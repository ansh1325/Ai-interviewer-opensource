import { InterviewConfig, Message, EvaluationResult } from '../types';
import { generateInterviewerTurnResponse, generateCompleteEvaluation } from './builtinEngine';
import { queryOllama } from './ollamaAdapter';
import { queryGroq } from './groqAdapter';
import { QUESTION_BANKS } from '../constants';

export interface TurnResult {
  reply: string;
  nextQuestionIndex: number;
  isCompleted: boolean;
  providerUsed: string;
  fallbackOccurred?: boolean;
  fallbackReason?: string;
}

export async function processInterviewTurn(
  config: InterviewConfig,
  messages: Message[],
  currentQuestionIndex: number,
  candidateAnswer: string,
  codeSnippet?: string,
  hasHadFollowUp: boolean = false
): Promise<TurnResult> {
  const provider = config.providerSettings?.provider || 'builtin';

  if (provider === 'builtin') {
    const res = generateInterviewerTurnResponse(
      config,
      currentQuestionIndex,
      candidateAnswer,
      codeSnippet,
      hasHadFollowUp
    );
    return {
      reply: res.text,
      nextQuestionIndex: res.nextQuestionIndex,
      isCompleted: res.isCompleted,
      providerUsed: 'Built-in Edge Engine (Zero Config, 100% Free)'
    };
  }

  // Attempt external open-source provider (Ollama / Groq)
  try {
    let reply = '';
    const bank = QUESTION_BANKS[config.domain] || QUESTION_BANKS.frontend;
    const currentQ = bank[currentQuestionIndex % bank.length];
    const isLast = currentQuestionIndex >= Math.min(config.questionCount, bank.length) - 1;

    const guidance = `Current topic: ${currentQ.topic}.
Candidate just answered: "${candidateAnswer}".
${codeSnippet ? `Candidate submitted code: ${codeSnippet}` : ''}
If the candidate's answer was incomplete or missed critical trade-offs, ask ONE concise follow-up probe.
If the candidate's answer was good and complete:
${isLast ? 'Congratulate them and conclude the interview.' : `Acknowledge their answer in 1 sentence and transition to the next topic: ${bank[(currentQuestionIndex + 1) % bank.length]?.topic}.`}`;

    if (provider === 'ollama') {
      reply = await queryOllama(config, messages, guidance);
    } else if (provider === 'groq') {
      reply = await queryGroq(config, messages, guidance);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const nextIndex = isLast ? currentQuestionIndex + 1 : currentQuestionIndex + 1;

    return {
      reply,
      nextQuestionIndex: nextIndex,
      isCompleted: isLast,
      providerUsed: provider === 'ollama' ? 'Local Ollama Open-Source' : 'Groq Open-Source (Llama 3.3)'
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown provider error';
    console.warn(`[AI Router] External provider "${provider}" failed. Falling back to Built-in Edge Engine:`, errorMsg);

    const res = generateInterviewerTurnResponse(
      config,
      currentQuestionIndex,
      candidateAnswer,
      codeSnippet,
      hasHadFollowUp
    );

    return {
      reply: res.text,
      nextQuestionIndex: res.nextQuestionIndex,
      isCompleted: res.isCompleted,
      providerUsed: 'Built-in Edge Engine (Automated Fallback)',
      fallbackOccurred: true,
      fallbackReason: errorMsg
    };
  }
}

export async function processScorecardEvaluation(
  config: InterviewConfig,
  messages: Message[]
): Promise<EvaluationResult> {
  // Built-in rubric evaluation executes on edge with guaranteed reliability
  return generateCompleteEvaluation(config, messages);
}
