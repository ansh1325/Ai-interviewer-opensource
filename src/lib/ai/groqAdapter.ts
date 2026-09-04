import { InterviewConfig, Message } from '../types';
import { PERSONAS } from '../constants';

export async function queryGroq(
  config: InterviewConfig,
  messages: Message[],
  systemPromptAddition: string = ''
): Promise<string> {
  const apiKey = config.providerSettings.groqApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key is not configured. Please supply an API key in settings or select Built-in Engine.');
  }

  const model = config.providerSettings.groqModel || 'llama-3.3-70b-versatile';
  const persona = PERSONAS.find(p => p.id === config.persona) || PERSONAS[0];

  const systemInstruction = `You are ${persona.name}, ${persona.title}.
Interview Style: ${persona.style}
You are interviewing a candidate for a ${config.level} position in ${config.domain}.
Keep your responses conversational, rigorous, and concise (under 120 words per response so it flows naturally in voice chat).
Evaluate answers critically and ask probing follow-up questions when necessary.
${systemPromptAddition}`;

  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(m => ({
      role: m.role === 'interviewer' ? 'assistant' : 'user',
      content: m.content + (m.codeSnippet ? `\n\nCode Provided:\n${m.codeSnippet}` : '')
    }))
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 400
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Understood. Let us proceed to the next question.';
}
