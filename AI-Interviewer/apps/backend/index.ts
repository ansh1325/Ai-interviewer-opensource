import "dotenv/config";
import express from "express";
import { PreInterviewBody } from "./types";
import { scrapegithub } from "./scrapers/github";
import cors from "cors";
import { prisma } from "./db";
import { calculateResult } from "./result";
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIClient: GoogleGenerativeAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (err) {
  console.warn("Failed to initialize Google GenAI client:", err);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.raw({ type: "multipart/form-data", limit: "50mb" }));

async function callGemini(contents: any, fallbackText: string, maxTokens = 250): Promise<string> {
  const models = [
    "gemini-2.5-flash-exp",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];

  if (!genAIClient) {
    return fallbackText;
  }

  for (const modelName of models) {
    try {
      const model = genAIClient.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      });

      const result = await model.generateContent({ contents });
      const response = result.response;
      const text = response.text();
      if (text && text.trim().length > 0) {
        return text.replace(/[*#_`~]/g, "").trim();
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} failed, trying next:`, err?.message || err);
    }
  }

  return fallbackText;
}

// Helper to parse multipart/form-data safely
function parseMultipartFormData(
  buffer: Buffer,
  contentType: string
): { fields: Record<string, string>; files: Record<string, { filename?: string; mimeType?: string; data: Buffer }> } {
  const fields: Record<string, string> = {};
  const files: Record<string, { filename?: string; mimeType?: string; data: Buffer }> = {};

  const match = contentType.match(/boundary=([^;]+)/i);
  if (!match || !match[1]) return { fields, files };

  let boundary = match[1].trim();
  if (boundary.startsWith('"') && boundary.endsWith('"')) {
    boundary = boundary.slice(1, -1);
  }

  const delimiter = Buffer.from(`--${boundary}`);

  let start = 0;
  while (start < buffer.length) {
    const boundaryIndex = buffer.indexOf(delimiter, start);
    if (boundaryIndex === -1) break;

    start = boundaryIndex + delimiter.length;
    if (buffer.subarray(start, start + 2).toString() === "--") break;
    if (buffer.subarray(start, start + 2).toString() === "\r\n") start += 2;

    const nextBoundaryIndex = buffer.indexOf(delimiter, start);
    if (nextBoundaryIndex === -1) break;

    const partBuffer = buffer.subarray(start, nextBoundaryIndex);
    const headerEndIndex = partBuffer.indexOf("\r\n\r\n");
    if (headerEndIndex === -1) continue;

    const headerStr = partBuffer.subarray(0, headerEndIndex).toString("utf-8");
    let bodyBuffer = partBuffer.subarray(headerEndIndex + 4);

    if (bodyBuffer.length >= 2 && bodyBuffer[bodyBuffer.length - 2] === 0x0D && bodyBuffer[bodyBuffer.length - 1] === 0x0A) {
      bodyBuffer = bodyBuffer.subarray(0, bodyBuffer.length - 2);
    } else if (bodyBuffer.length >= 1 && bodyBuffer[bodyBuffer.length - 1] === 0x0A) {
      bodyBuffer = bodyBuffer.subarray(0, bodyBuffer.length - 1);
    }

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const partContentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

    if (nameMatch && nameMatch[1]) {
      const fieldName = nameMatch[1];
      if (filenameMatch && filenameMatch[1]) {
        files[fieldName] = {
          filename: filenameMatch[1],
          mimeType: partContentTypeMatch && partContentTypeMatch[1] ? partContentTypeMatch[1].trim() : "audio/webm",
          data: bodyBuffer,
        };
      } else {
        fields[fieldName] = bodyBuffer.toString("utf-8");
      }
    }
  }

  return { fields, files };
}

app.post("/api/v1/pre-interview", async (req, res) => {
  const { success, data } = PreInterviewBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({ message: "Incorrect Links" });
    return;
  }
  const githubMatch = data.github.match(/github\.com\/([a-zA-Z0-9_-]+)/);
  const githubUsername = githubMatch ? githubMatch[1] : null;
  if (!githubUsername) {
    res.status(400).json({ message: "Invalid GitHub URL provided" });
    return;
  }

  const githubdata = await scrapegithub(githubUsername);
  const interview = await prisma.interview.create({
    data: {
      githubMetadata: JSON.stringify(githubdata),
      status: "Pre",
    },
  });
  res.json({ id: interview.id });
});

app.post("/api/v1/session/:interviewId", async (req, res) => {
  try {
    let audioBuffer: Buffer | null = null;
    let isInitialRequest = false;

    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data") && Buffer.isBuffer(req.body)) {
      const parsed = parseMultipartFormData(req.body, contentType);
      if (parsed.files.audio) {
        audioBuffer = parsed.files.audio.data;
      }
      if (parsed.fields.isInitial === "true") {
        isInitialRequest = true;
      }
    } else if (req.body && typeof req.body === "object") {
      if (req.body.audio) {
        audioBuffer = Buffer.from(req.body.audio, "base64");
      }
      if (req.body.isInitial) {
        isInitialRequest = true;
      }
    }

    const interview = await prisma.interview.findFirst({
      where: { id: req.params.interviewId },
      include: { conversations: true },
    });

    if (!interview) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    // Handle initial greeting: AI introduces itself and asks Question 1
    if (isInitialRequest || (!audioBuffer && interview.conversations.length === 0)) {
      let parsedGithub: any = [];
      try {
        parsedGithub = typeof interview.githubMetadata === "string" ? JSON.parse(interview.githubMetadata) : interview.githubMetadata;
      } catch {
        parsedGithub = interview.githubMetadata || [];
      }

      const projectNames = Array.isArray(parsedGithub) && parsedGithub.length > 0
        ? parsedGithub.slice(0, 3).map((p: any) => p.name).join(", ")
        : "software engineering projects";

      const defaultOpening = `Hello! Welcome to your technical interview. I'm your AI interviewer. To get us started, could you walk me through the architecture of your main project and the key engineering decisions you made?`;

      const openingPrompt = `You are an expert technical interviewer conducting a live software engineering interview. Speak in clear, natural conversational English.
Candidate projects: ${projectNames}

Instructions:
1. Greet the candidate: "Hello! Welcome to your technical interview. I'm your AI interviewer."
2. Briefly mention one of their projects or technical areas.
3. Directly ask your first technical interview question about their project architecture, implementation, and how they handled data flow or scalability.
4. IMPORTANT: Do NOT use markdown symbols, asterisks, bullet points, headers, or quotes. Your response MUST end with a clear technical question.`;

      let assistantText = await callGemini(
        [{ role: "user", parts: [{ text: openingPrompt }] }],
        defaultOpening
      );

      if (!assistantText.includes("?")) {
        assistantText += " To start, could you walk me through the architecture of your most recent project and how you structured the backend and database?";
      }

      await prisma.message.create({
        data: {
          interviewId: req.params.interviewId,
          type: "Assistant",
          message: assistantText,
        },
      });

      if (interview.status === "Pre") {
        await prisma.interview.update({
          where: { id: interview.id },
          data: { status: "InProgress" },
        });
      }

      res.json({ text: assistantText });
      return;
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      res.status(400).json({ error: "Missing audio field" });
      return;
    }

    if (interview.status === "Pre") {
      await prisma.interview.update({
        where: { id: interview.id },
        data: { status: "InProgress" },
      });
    }

    const conversationHistory = interview.conversations.map((m) => ({
      role: m.type === "User" ? "user" : "model",
      parts: [{ text: m.message }],
    }));

    const defaultFollowUp = `Thanks for explaining that. Could you dive deeper into how you handle error handling, caching, or scaling under high traffic in that architecture?`;

    const systemContext = `You are an expert technical interviewer conducting a live software engineering interview. Speak in clear, natural conversational English.
Candidate GitHub Profile:
${typeof interview.githubMetadata === "string" ? interview.githubMetadata : JSON.stringify(interview.githubMetadata)}

Current conversation turns above are the interview history. The user will now provide a new answer via the attached audio recording.
Instructions:
1. Listen closely to what the candidate answered in the audio.
2. Provide a 1-sentence natural reaction acknowledging their answer.
3. Ask the next technical question (diving into system design, scalability, algorithms, edge cases, or database optimization).
4. If 3 or more questions have been answered in total, conclude the interview politely and instruct the candidate to click End Session.
5. IMPORTANT: Output ONLY clean conversational sentences. Do NOT use markdown symbols, bullet points, asterisks, bold text, or headers.
Keep your response concise (2-3 sentences max).`;

    const audioBase64 = audioBuffer.toString("base64");

    const fullContents = [
      ...conversationHistory,
      {
        role: "user",
        parts: [
          { text: systemContext },
          {
            inlineData: {
              mimeType: "audio/webm",
              data: audioBase64,
            },
          },
        ],
      },
    ];

    let assistantText = await callGemini(fullContents, defaultFollowUp);

    await prisma.message.create({
      data: {
        interviewId: req.params.interviewId,
        type: "User",
        message: "(Candidate Voice Response)",
      },
    });

    await prisma.message.create({
      data: {
        interviewId: req.params.interviewId,
        type: "Assistant",
        message: assistantText,
      },
    });

    res.json({ text: assistantText });
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Failed to process audio" });
  }
});

app.post("/api/v1/session/user/response/:interviewId", async (req, res) => {
  const { message } = req.body;
  await prisma.message.create({
    data: {
      interviewId: req.params.interviewId!,
      type: "User",
      message: message,
    },
  });
  res.json({ success: true });
});

app.get("/api/v1/result/:interviewId", async (req, res) => {
  const interview = await prisma.interview.findFirst({
    where: { id: req.params.interviewId },
    include: { conversations: true },
  });

  if (!interview) {
    res.status(411).json({ message: "Interview not found" });
    return;
  }

  res.json({
    score: interview?.score,
    feedback: interview?.feedback,
    transcript: interview?.conversations.map((c) => ({
      type: c.type,
      content: c.message,
      createdAt: c.createdAt,
    })),
    status: interview.status,
  });

  if (interview.status != "Done") {
    const result = await calculateResult(interview.conversations);

    await prisma.interview.update({
      where: { id: req.params.interviewId },
      data: {
        status: "Done",
        feedback: result.feedback,
        score: result.score,
      },
    });
  }
});

app.listen(3001, () => {
  console.log("Server listening on port 3001");
});
