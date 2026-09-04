export type InterviewDomain = 
  | 'frontend' 
  | 'backend' 
  | 'fullstack' 
  | 'system_design' 
  | 'dsa' 
  | 'behavioral';

export type ExperienceLevel = 
  | 'junior' 
  | 'mid' 
  | 'senior' 
  | 'staff';

export type InterviewerPersona = 
  | 'mentor' 
  | 'strict_tech_lead' 
  | 'startup_founder' 
  | 'faang_bar_raiser';

export type AIProvider = 
  | 'builtin' 
  | 'ollama' 
  | 'groq' 
  | 'openrouter';

export interface ProviderSettings {
  provider: AIProvider;
  ollamaEndpoint?: string;
  ollamaModel?: string;
  groqApiKey?: string;
  groqModel?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
}

export interface InterviewConfig {
  candidateName: string;
  domain: InterviewDomain;
  level: ExperienceLevel;
  persona: InterviewerPersona;
  questionCount: number;
  candidateResume?: string;
  providerSettings: ProviderSettings;
}

export interface Message {
  id: string;
  role: 'system' | 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
  codeSnippet?: string;
  questionIndex?: number;
  isFollowUp?: boolean;
}

export interface InterviewQuestion {
  id: number;
  topic: string;
  question: string;
  codePrompt?: string;
  starterCode?: string;
  idealKeypoints: string[];
}

export interface QuestionFeedback {
  questionIndex: number;
  question: string;
  candidateAnswer: string;
  score: number; // 0 - 100
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
}

export interface EvaluationResult {
  overallScore: number; // 0 - 100
  recommendation: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Leaning No Hire' | 'No Hire';
  summary: string;
  categoryScores: {
    technicalAccuracy: number;
    systemArchitecture: number;
    problemSolving: number;
    communicationClarity: number;
    confidenceAndStructure: number;
  };
  questionFeedback: QuestionFeedback[];
  topStrengths: string[];
  criticalGrowthAreas: string[];
  preparationRoadmap: string[];
  evaluatedAt: string;
  durationMinutes: number;
}
