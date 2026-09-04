import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Award, MessageSquare, ChevronLeft, Calendar, FileText, CheckCircle, Clock, BarChart3, CornerDownRight } from "lucide-react";

interface Result {
  transcript: { type: "User" | "Assistant", content: string, createdAt: Date }[];
  score: number;
  feedback: string;
  status: "InProgress" | "Pre" | "Done";
}

export function Result() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [result, setresult] = useState<Result>({
    score: 0,
    feedback: '',
    transcript: [],
    status: "Pre"
  });

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/v1/result/${interviewId}`)
      .then(response => {
        setresult(response.data);
      });

    let intervalid = setInterval(() => {
      axios.get(`${BACKEND_URL}/api/v1/result/${interviewId}`)
        .then(response => {
          setresult(response.data);
          if (response.data.status === "Done") {
            clearInterval(intervalid);
          }
        });
    }, 5 * 1000);

    return () => {
      clearInterval(intervalid);
    };
  }, [interviewId]);

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-background text-foreground pb-20 font-sans selection:bg-primary/30">
      {/* Sci-Fi Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Decorative background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Area */}
      <header className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Portal
        </button>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 rounded-md text-muted-foreground">
          Session ID: {interviewId?.slice(0, 12)}...
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-6 space-y-12">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Interview Performance Report
          </h1>
          <p className="text-muted-foreground text-sm font-sans tracking-wide">
            Automated session summary, project mapping, and conversation timeline.
          </p>
        </div>

        {result.status !== "Done" ? (
          /* LOADING / WAITING STATE */
          <div className="flex flex-col items-center justify-center py-24 space-y-8 bg-card border border-border rounded-3xl backdrop-blur-xl">
            <div className="relative w-20 h-20">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-primary/20 bg-primary/5 animate-pulse" />
              {/* Spinning indicators */}
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
              <div className="absolute inset-3 rounded-full border-b-2 border-accent animate-[spin_3s_linear_infinite_reverse]" />
            </div>
            <div className="text-center space-y-2 max-w-xs">
              <h3 className="font-display font-bold text-lg text-white">Synthesizing Feedback</h3>
              <p className="text-sm text-muted-foreground font-sans animate-pulse">
                {result.status === "InProgress" 
                  ? "Evaluating transcription and projecting scores..." 
                  : "Connecting to execution cluster..."}
              </p>
            </div>
          </div>
        ) : (
          /* REPORT DASHBOARD COMPONENT */
          <div className="space-y-12 animate-in fade-in duration-75">
            
            {/* 1. Score & Feedback Summary Card */}
            <div className="bg-card border border-border rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
                
                {/* Score Dial Wrapper */}
                <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                  {/* Concentric glowing outline */}
                  <div className="absolute inset-0 rounded-full border border-primary/20 bg-primary/5 shadow-[0_0_40px_rgba(99,102,241,0.1)]" />
                  <div className="absolute inset-2 rounded-full border border-dashed border-accent/20 animate-radar-scan" style={{ animationDuration: '20s' }} />
                  
                  {/* Center metrics display */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-5xl font-black font-display text-white tracking-tighter">
                      {result.score}
                    </span>
                    <span className="text-[10px] text-accent font-mono uppercase tracking-widest mt-1">
                      MAX 10
                    </span>
                  </div>
                </div>
                
                {/* AI Review Content */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <Award className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold font-display text-white uppercase tracking-wider">
                      Evaluation & Verdict
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-base md:text-lg font-sans">
                    {result.feedback}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Transcript Timeline */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <h3 className="text-xl font-bold font-display text-white tracking-wide uppercase">
                    Session Log
                  </h3>
                </div>
                <span className="text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 rounded-full text-muted-foreground">
                  {result.transcript.length} Messages Recorded
                </span>
              </div>

              {result.transcript.length === 0 ? (
                <div className="p-10 rounded-3xl bg-card border border-border text-center text-muted-foreground font-sans">
                  No conversation logs recorded in this session.
                </div>
              ) : (
                <div className="space-y-6">
                  {result.transcript.map((msg, idx) => {
                    const isAI = msg.type === "Assistant";
                    return (
                      <div 
                        key={idx}
                        className={`flex gap-4 max-w-3xl ${isAI ? "mr-auto flex-row" : "ml-auto flex-row-reverse"}`}
                      >
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                          isAI 
                            ? "bg-primary/20 border border-primary/30 text-primary" 
                            : "bg-accent/20 border border-accent/30 text-accent"
                        }`}>
                          {isAI ? <BarChart3 className="w-4 h-4" /> : <CornerDownRight className="w-4 h-4" />}
                        </div>

                        {/* Bubble */}
                        <div className={`p-5 rounded-2xl border text-sm md:text-base leading-relaxed ${
                          isAI 
                            ? "bg-card border-border/80 text-foreground rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.15)]" 
                            : "bg-white/[0.02] border-white/[0.05] text-white/90 rounded-tr-none"
                        }`}>
                          <div className="flex items-center justify-between mb-2 gap-4">
                            <span className={`text-[11px] font-bold font-display tracking-widest uppercase ${
                              isAI ? "text-primary" : "text-accent"
                            }`}>
                              {isAI ? "AI Evaluator" : "You"}
                            </span>
                          </div>
                          <p className="font-sans leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}