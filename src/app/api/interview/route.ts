import { processInterviewTurn } from '@/lib/ai/router';
import { InterviewConfig, Message } from '@/lib/types';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      config,
      messages,
      currentQuestionIndex,
      candidateAnswer,
      codeSnippet,
      hasHadFollowUp
    } = body as {
      config: InterviewConfig;
      messages: Message[];
      currentQuestionIndex: number;
      candidateAnswer: string;
      codeSnippet?: string;
      hasHadFollowUp?: boolean;
    };

    if (!config || !candidateAnswer) {
      return new Response(JSON.stringify({ error: 'Invalid payload: config and candidateAnswer required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await processInterviewTurn(
      config,
      messages || [],
      currentQuestionIndex ?? 0,
      candidateAnswer,
      codeSnippet,
      Boolean(hasHadFollowUp)
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Runtime': 'v8-isolate',
        'Cache-Control': 'no-store, no-cache'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal edge error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
