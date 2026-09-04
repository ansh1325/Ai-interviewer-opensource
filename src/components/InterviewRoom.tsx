'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Video, VideoOff, Code2, 
  MessageSquare, Loader2, Sparkles, CheckCircle, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { InterviewConfig, Message, InterviewQuestion } from '@/lib/types';
import { QUESTION_BANKS, PERSONAS } from '@/lib/constants';
import { SpeechRecognitionController } from '@/lib/audio/speechRecognition';
import { SpeechSynthesisController } from '@/lib/audio/speechSynthesis';
import { AudioVisualizer } from './AudioVisualizer';

interface InterviewRoomProps {
  config: InterviewConfig;
  onFinishInterview: (messages: Message[]) => void;
}

export function InterviewRoom({ config, onFinishInterview }: InterviewRoomProps) {
  const bank = QUESTION_BANKS[config.domain] || QUESTION_BANKS.frontend;
  const totalQuestions = Math.min(config.questionCount, bank.length);
  const persona = PERSONAS.find(p => p.id === config.persona) || PERSONAS[0];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [candidateInput, setCandidateInput] = useState<string>('');
  const [codeContent, setCodeContent] = useState<string>('');
  const [hasCodeTab, setHasCodeTab] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat');

  // Audio / Speech States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Video / Webcam States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Network / Loading States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasHadFollowUp, setHasHadFollowUp] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Controllers
  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const synthesisRef = useRef<SpeechSynthesisController | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initialize Controllers and Timer
  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionController();
    synthesisRef.current = new SpeechSynthesisController();

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      recognitionRef.current?.stop();
      synthesisRef.current?.cancel();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 2. Launch initial question on mount
  useEffect(() => {
    const firstQ = bank[0];
    const greeting = `Hello ${config.candidateName}, welcome to your ${config.level.toUpperCase()} interview for ${config.domain.replace('_', ' ').toUpperCase()}. I'm ${persona.name}. Let's jump right in.\n\n${firstQ.question}`;
    
    if (firstQ.starterCode) {
      setCodeContent(firstQ.starterCode);
      setHasCodeTab(true);
    }

    const initialMsg: Message = {
      id: 'msg-init',
      role: 'interviewer',
      content: greeting,
      timestamp: Date.now(),
      questionIndex: 0
    };

    setMessages([initialMsg]);

    // Speak initial greeting
    setTimeout(() => {
      synthesisRef.current?.speak(greeting, undefined, undefined, (speaking) => setIsSpeaking(speaking));
    }, 600);
  }, [config, bank, persona]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, candidateInput]);

  // Webcam Toggle
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Webcam permission denied or unavailable:', err);
      }
    }
  };

  // Speech Recognition Toggle
  const toggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // If AI is speaking, cancel TTS first
      if (isSpeaking) {
        synthesisRef.current?.cancel();
        setIsSpeaking(false);
      }

      recognitionRef.current?.start(
        candidateInput,
        (transcript) => {
          setCandidateInput(transcript);
        },
        (listening) => {
          setIsListening(listening);
        },
        (error) => {
          setSpeechError(`Microphone notice: ${error}`);
          setIsListening(false);
        }
      );
    }
  };

  // Replay current interviewer question
  const handleReplayQuestion = () => {
    const lastInterviewerMsg = [...messages].reverse().find(m => m.role === 'interviewer');
    if (lastInterviewerMsg) {
      synthesisRef.current?.speak(
        lastInterviewerMsg.content,
        undefined,
        undefined,
        (speaking) => setIsSpeaking(speaking)
      );
    }
  };

  // Mute toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    synthesisRef.current?.setMuted(nextMuted);
    if (nextMuted) {
      setIsSpeaking(false);
    }
  };

  // Submit Answer to Edge Function
  const handleSubmitAnswer = async () => {
    const trimmedAnswer = candidateInput.trim();
    if (!trimmedAnswer && !codeContent.trim()) return;

    // Stop microphone if currently listening
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const candidateMsg: Message = {
      id: `cand-${Date.now()}`,
      role: 'candidate',
      content: trimmedAnswer || 'Provided solution in code editor.',
      timestamp: Date.now(),
      codeSnippet: hasCodeTab && codeContent ? codeContent : undefined,
      questionIndex: currentQuestionIndex
    };

    const updatedMessages = [...messages, candidateMsg];
    setMessages(updatedMessages);
    setCandidateInput('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          messages: updatedMessages,
          currentQuestionIndex,
          candidateAnswer: candidateMsg.content,
          codeSnippet: candidateMsg.codeSnippet,
          hasHadFollowUp
        })
      });

      if (!response.ok) {
        throw new Error(`Edge API error: ${response.status}`);
      }

      const data = await response.json();
      const interviewerReply: string = data.reply;
      const isCompleted: boolean = data.isCompleted;
      const nextIndex: number = data.nextQuestionIndex;

      const newInterviewerMsg: Message = {
        id: `int-${Date.now()}`,
        role: 'interviewer',
        content: interviewerReply,
        timestamp: Date.now(),
        questionIndex: nextIndex,
        isFollowUp: nextIndex === currentQuestionIndex
      };

      const finalMessages = [...updatedMessages, newInterviewerMsg];
      setMessages(finalMessages);

      // Track whether this turn was a follow-up probe
      if (nextIndex === currentQuestionIndex) {
        setHasHadFollowUp(true);
      } else {
        setHasHadFollowUp(false);
        setCurrentQuestionIndex(nextIndex);

        // If next question has code, load it
        const nextQ = bank[nextIndex % bank.length];
        if (nextQ?.starterCode) {
          setCodeContent(nextQ.starterCode);
          setHasCodeTab(true);
        }
      }

      // Speak response
      synthesisRef.current?.speak(
        interviewerReply,
        undefined,
        () => {
          if (isCompleted) {
            setTimeout(() => onFinishInterview(finalMessages), 1200);
          }
        },
        (speaking) => setIsSpeaking(speaking)
      );

      if (isCompleted) {
        setTimeout(() => onFinishInterview(finalMessages), 4000);
      }
    } catch (err: unknown) {
      console.error('Failed to submit answer:', err);
      // Fallback message so interview does not stall
      const fallbackMsg: Message = {
        id: `int-fallback-${Date.now()}`,
        role: 'interviewer',
        content: 'Thanks for walking through that. Let us proceed to the next topic.',
        timestamp: Date.now(),
        questionIndex: currentQuestionIndex + 1
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setCurrentQuestionIndex(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = bank[currentQuestionIndex % bank.length] || bank[0];

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 sm:px-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Session Progress Bar */}
      <div className="glass-panel px-4 py-2.5 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            Question {Math.min(currentQuestionIndex + 1, totalQuestions)} of {totalQuestions}
          </span>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Topic:</span>
            <span className="truncate max-w-xs">{currentQ.topic}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
          <button
            onClick={() => onFinishInterview(messages)}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
            title="Conclude early and view evaluation"
          >
            Finish & Review
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Column: Interviewer Avatar + Candidate Cam (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* AI Interviewer Card */}
          <div className="glass-panel p-5 flex flex-col items-center text-center relative overflow-hidden">
            {/* Top right voice controls */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <button
                onClick={handleReplayQuestion}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Replay question audio"
              >
                <Volume2 className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
              </button>
            </div>

            {/* Persona Avatar */}
            <div className="relative mt-2 mb-3">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl transition-all ${
                  isSpeaking
                    ? 'ring-4 ring-cyan-400/80 shadow-cyan-500/40 bg-cyan-950/60 scale-105'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {persona.avatar}
              </div>
              {isSpeaking && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white">{persona.name}</h3>
            <p className="text-xs text-cyan-400 font-medium">{persona.title}</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{persona.style}</p>

            {/* Live Audio Visualizer Canvas */}
            <div className="w-full mt-4 pt-3 border-t border-white/10 flex flex-col items-center">
              <div className="flex items-center justify-between w-full text-[11px] text-slate-400 mb-1.5 px-2">
                <span>Audio Stream</span>
                <span className={isSpeaking ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>
                  {isSpeaking ? 'Speaking...' : isSubmitting ? 'Evaluating...' : 'Listening'}
                </span>
              </div>
              <AudioVisualizer isActive={isSpeaking} color="cyan" height={36} />
            </div>
          </div>

          {/* Candidate Webcam Viewport (Optional) */}
          <div className="glass-panel p-4 flex-1 flex flex-col relative overflow-hidden min-h-[160px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{config.candidateName}</span>
                <span className="text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                  {config.level}
                </span>
              </div>
              <button
                onClick={toggleCamera}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                {isCameraActive ? <VideoOff className="w-3.5 h-3.5 text-red-400" /> : <Video className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{isCameraActive ? 'Disable Cam' : 'Enable Cam'}</span>
              </button>
            </div>

            <div className="flex-1 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center relative overflow-hidden">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Video className="w-6 h-6 opacity-40" />
                  </div>
                  <p className="text-xs text-slate-500">Camera is off (Optional)</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Click "Enable Cam" to simulate live video</p>
                </div>
              )}

              {/* Real-time mic indicator overlay on video */}
              {isListening && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Mic Active
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Transcript & Code Editor & Speech Bar (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
          {/* Tab Switcher (Chat vs Code) */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Live Conversation
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'code'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Code Scratchpad
                {codeContent && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:block">
              Web Speech API • Zero External Audio Latency
            </div>
          </div>

          {/* Transcript View */}
          {activeTab === 'chat' ? (
            <div className="glass-panel p-4 flex-1 overflow-y-auto space-y-4 min-h-0">
              {messages.map((msg) => {
                const isCandidate = msg.role === 'candidate';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isCandidate ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCandidate && (
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0">
                        {persona.avatar}
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isCandidate
                          ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-xs shadow-lg shadow-cyan-900/30'
                          : 'bg-[#121826] border border-white/10 text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10 text-[11px] opacity-75">
                        <span className="font-semibold">{isCandidate ? config.candidateName : persona.name}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Attached code snippet */}
                      {msg.codeSnippet && (
                        <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-xs overflow-x-auto">
                          <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                            <Code2 className="w-3 h-3" /> Submitted Code:
                          </div>
                          <code>{msg.codeSnippet}</code>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSubmitting && (
                <div className="flex gap-3 items-center text-xs text-cyan-400 animate-pulse p-2">
                  <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs">
                    {persona.avatar}
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating response on edge isolate...</span>
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>
          ) : (
            /* Code Scratchpad View */
            <div className="glass-panel p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-violet-400" />
                  TypeScript / JavaScript Live Editor
                </span>
                <button
                  onClick={() => setCodeContent('')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="// Write code here to submit along with your spoken or written answer..."
                className="flex-1 w-full p-3 rounded-xl bg-black/70 border border-white/10 text-emerald-300 font-mono text-xs sm:text-sm focus:border-violet-400 outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Live Response & Speech Input Bar */}
          <div className="glass-panel p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? 'mic-pulsing text-white'
                    : 'bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10'
                }`}
                title={isListening ? 'Click to pause microphone' : 'Click to speak using Web Speech STT'}
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-slate-400" />}
              </button>

              {/* Text Input / Real-time Transcript */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={candidateInput}
                  onChange={(e) => setCandidateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'Listening... Speak your answer now (transcribing live)'
                      : 'Type your answer or click the microphone to speak...'
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all pr-12"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || (!candidateInput.trim() && !codeContent.trim())}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <div className="flex items-center gap-2">
                <span>{isListening ? '🔴 Recording speech' : 'Microphone idle'}</span>
                {codeContent.trim() && (
                  <span className="text-violet-400 font-medium">• Code attached ({codeContent.length} chars)</span>
                )}
              </div>
              <span className="hidden sm:inline">Press Enter ↵ to send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
