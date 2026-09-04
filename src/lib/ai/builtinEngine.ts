import { InterviewConfig, Message, EvaluationResult, QuestionFeedback } from '../types';
import { QUESTION_BANKS, PERSONAS } from '../constants';

interface EvaluatedAnswer {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  depthFeedback: string;
  suggestedFollowUp?: string;
  isSatisfactory: boolean;
}

export function evaluateCandidateTurn(
  config: InterviewConfig,
  questionIndex: number,
  candidateAnswer: string,
  codeSnippet?: string
): EvaluatedAnswer {
  const bank = QUESTION_BANKS[config.domain] || QUESTION_BANKS.frontend;
  const currentQ = bank[questionIndex % bank.length];
  const lowerAnswer = (candidateAnswer + ' ' + (codeSnippet || '')).toLowerCase();

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const point of currentQ.idealKeypoints) {
    const words = point.toLowerCase().split(/[\s,()/]+/).filter(w => w.length > 3);
    const hasMatch = words.some(w => lowerAnswer.includes(w));
    if (hasMatch) {
      matchedKeywords.push(point);
    } else {
      missingKeywords.push(point);
    }
  }

  const wordCount = candidateAnswer.trim().split(/\s+/).filter(Boolean).length;
  let score = Math.round((matchedKeywords.length / (currentQ.idealKeypoints.length || 1)) * 70);

  // Bonus for depth and structure
  if (wordCount > 60) score += 15;
  else if (wordCount > 30) score += 10;
  else if (wordCount < 15) score = Math.max(20, score - 20);

  if (codeSnippet && codeSnippet.trim().length > 30) {
    score += 15;
  }

  // Cap between 25 and 98
  score = Math.min(98, Math.max(25, score));

  // Determine follow-up probe based on what's missing
  let suggestedFollowUp: string | undefined;
  const persona = PERSONAS.find(p => p.id === config.persona) || PERSONAS[0];

  if (missingKeywords.length > 0 && wordCount < 70) {
    const missingTopic = missingKeywords[0].split(':')[0] || missingKeywords[0];
    if (persona.id === 'strict_tech_lead') {
      suggestedFollowUp = `That touches on the high level, but what about ${missingTopic}? How does that impact system bottlenecks or failure modes under high load?`;
    } else if (persona.id === 'mentor') {
      suggestedFollowUp = `Good start! Could you expand a bit further on ${missingTopic} and how you would apply that in practice?`;
    } else if (persona.id === 'startup_founder') {
      suggestedFollowUp = `Interesting approach. How would ${missingTopic} affect engineering velocity and production reliability if we shipped this tomorrow?`;
    } else {
      suggestedFollowUp = `Understood. Drilling deeper into ${missingTopic}, what specific architectural trade-offs would you weigh here?`;
    }
  }

  return {
    score,
    matchedKeywords,
    missingKeywords,
    depthFeedback: wordCount < 30 ? 'Response was relatively brief. Providing concrete real-world examples and trade-offs demonstrates senior depth.' : 'Good structured depth with relevant technical terminology.',
    suggestedFollowUp,
    isSatisfactory: score >= 65
  };
}

export function generateInterviewerTurnResponse(
  config: InterviewConfig,
  currentQuestionIndex: number,
  candidateAnswer: string,
  codeSnippet?: string,
  hasHadFollowUp: boolean = false
): { text: string; nextQuestionIndex: number; isCompleted: boolean } {
  const bank = QUESTION_BANKS[config.domain] || QUESTION_BANKS.frontend;
  const totalQuestions = Math.min(config.questionCount, bank.length);
  const persona = PERSONAS.find(p => p.id === config.persona) || PERSONAS[0];

  const evalResult = evaluateCandidateTurn(config, currentQuestionIndex, candidateAnswer, codeSnippet);

  // If candidate was too brief or missed critical aspects AND hasn't had a follow-up yet, probe them!
  if (!hasHadFollowUp && evalResult.suggestedFollowUp && evalResult.score < 75) {
    const acknowledgment = evalResult.score >= 50
      ? `Thanks for walking through that. `
      : `I see what you are getting at. `;
    return {
      text: `${acknowledgment}${evalResult.suggestedFollowUp}`,
      nextQuestionIndex: currentQuestionIndex,
      isCompleted: false
    };
  }

  // Otherwise, transition to the next question
  const nextIndex = currentQuestionIndex + 1;
  if (nextIndex >= totalQuestions) {
    return {
      text: `That concludes all our questions for this session! You did a fantastic job articulating your thoughts under pressure. Let me compile the comprehensive performance scorecard and breakdown for you now.`,
      nextQuestionIndex: nextIndex,
      isCompleted: true
    };
  }

  const nextQ = bank[nextIndex];
  const transitions = [
    `Great explanation. Let's move on to the next topic: ${nextQ.topic}.`,
    `Excellent points. Now let's shift gears and look into ${nextQ.topic}.`,
    `Solid reasoning. For our next problem, I'd like to test your intuition on ${nextQ.topic}.`,
    `Appreciate the clear breakdown. Moving forward, let's discuss ${nextQ.topic}.`
  ];
  const transition = transitions[nextIndex % transitions.length];

  let promptText = `${transition}\n\n${nextQ.question}`;
  if (nextQ.codePrompt) {
    promptText += `\n\n💻 Coding Prompt: ${nextQ.codePrompt}`;
  }

  return {
    text: promptText,
    nextQuestionIndex: nextIndex,
    isCompleted: false
  };
}

export function generateCompleteEvaluation(
  config: InterviewConfig,
  messages: Message[]
): EvaluationResult {
  const bank = QUESTION_BANKS[config.domain] || QUESTION_BANKS.frontend;
  const candidateResponses = messages.filter(m => m.role === 'candidate');

  const questionFeedbackList: QuestionFeedback[] = [];
  let totalScore = 0;

  for (let i = 0; i < Math.min(config.questionCount, bank.length); i++) {
    const q = bank[i];
    const userMsg = candidateResponses[i];
    const answerText = userMsg ? userMsg.content : 'No answer provided.';
    const snippet = userMsg?.codeSnippet;

    const evaluated = evaluateCandidateTurn(config, i, answerText, snippet);
    totalScore += evaluated.score;

    questionFeedbackList.push({
      questionIndex: i + 1,
      question: q.question,
      candidateAnswer: answerText,
      score: evaluated.score,
      strengths: evaluated.matchedKeywords.length > 0 
        ? evaluated.matchedKeywords.map(k => `Addressed key concept: ${k}`)
        : ['Maintained composure and attempted the problem logically.'],
      improvements: evaluated.missingKeywords.length > 0 
        ? evaluated.missingKeywords.map(k => `Could have elaborated more on: ${k}`)
        : ['Add more quantitative production metrics (e.g. latency percentiles, memory profiling).'],
      idealAnswer: `An ideal response emphasizes: ${q.idealKeypoints.join('; ')}.`
    });
  }

  const averageScore = Math.round(totalScore / (questionFeedbackList.length || 1));

  let recommendation: EvaluationResult['recommendation'] = 'Hire';
  if (averageScore >= 88) recommendation = 'Strong Hire';
  else if (averageScore >= 75) recommendation = 'Hire';
  else if (averageScore >= 62) recommendation = 'Leaning Hire';
  else if (averageScore >= 50) recommendation = 'Leaning No Hire';
  else recommendation = 'No Hire';

  const categoryScores = {
    technicalAccuracy: Math.min(100, Math.round(averageScore * 1.02)),
    systemArchitecture: Math.min(100, Math.round(averageScore * 0.96)),
    problemSolving: Math.min(100, Math.round(averageScore * 1.01)),
    communicationClarity: Math.min(100, Math.round(averageScore * 0.98)),
    confidenceAndStructure: Math.min(100, Math.round(averageScore * 0.95))
  };

  const topStrengths: string[] = [
    `Strong conceptual grasp of ${config.domain.replace('_', ' ').toUpperCase()} fundamentals.`,
    'Clear communication and structured thought progression during problem solving.',
    'Proactive consideration of scalability and architectural trade-offs.'
  ];

  const criticalGrowthAreas: string[] = [
    'Deepen familiarity with low-level edge isolate memory constraints and browser rendering pipelines.',
    'Structure complex technical answers with the STAR method (Situation, Task, Action, Result) for higher impact.',
    'Mention failure modes, observability, and distributed tracing proactively when discussing architectures.'
  ];

  const preparationRoadmap: string[] = [
    'Review browser event loop microtask vs macrotask execution order and Fiber reconciliation mechanics.',
    'Practice explaining distributed concurrency primitives (optimistic locking vs pessimistic locking).',
    'Simulate 45-minute timed system design mocks emphasizing back-of-the-envelope estimations and bottleneck identification.'
  ];

  return {
    overallScore: averageScore,
    recommendation,
    summary: `Candidate demonstrated solid technical competency for a ${config.level.toUpperCase()} level engineer in ${config.domain.replace('_', ' ').toUpperCase()}. Answers were cohesive, demonstrating good mental models and problem breakdown under live interview pressure.`,
    categoryScores,
    questionFeedback: questionFeedbackList,
    topStrengths,
    criticalGrowthAreas,
    preparationRoadmap,
    evaluatedAt: new Date().toISOString(),
    durationMinutes: Math.max(5, Math.round(messages.length * 1.8))
  };
}
