import { processScorecardEvaluation } from '@/lib/ai/router';
import { InterviewConfig, Message } from '@/lib/types';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { config, messages } = body as {
      config: InterviewConfig;
      messages: Message[];
    };

    if (!config || !messages) {
      return new Response(JSON.stringify({ error: 'Config and conversation messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const scorecard = await processScorecardEvaluation(config, messages);

    return new Response(JSON.stringify(scorecard), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Runtime': 'v8-isolate',
        'Cache-Control': 'no-store, no-cache'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Evaluation error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
