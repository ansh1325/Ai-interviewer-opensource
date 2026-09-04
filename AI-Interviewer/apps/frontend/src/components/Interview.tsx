import { BACKEND_URL } from "@/lib/config";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Cpu, Mic, Activity, Power, Volume2, Square } from "lucide-react";

export function Interview() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [userSpeaking, setUserSpeaking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [sessionTime, setSessionTime] = useState("00:00");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiText, setAiText] = useState<string | null>(
    "Connecting to your AI Interviewer..."
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
      const secs = String(seconds % 60).padStart(2, "0");
      setSessionTime(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis is not supported in this browser.");
      return;
    }

    // Clean text of any stray markdown/formatting symbols
    const cleanText = text.replace(/[*#_`~]/g, "").trim();

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const englishVoice = voices.find(
        (v) => v.lang.startsWith("en") || v.lang.includes("en")
      );
      if (englishVoice) utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setAiSpeaking(true);
      setAiVolume(60);
    };

    utterance.onend = () => {
      setAiSpeaking(false);
      setAiVolume(0);
    };

    utterance.onerror = (err) => {
      console.error("Speech synthesis playback error:", err);
      setAiSpeaking(false);
      setAiVolume(0);
    };

    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();
  }, []);

  // Pre-load voices for Chrome/Edge
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Fetch opening question and introduce AI
  useEffect(() => {
    if (hasInitializedRef.current || !interviewId) return;
    hasInitializedRef.current = true;

    let isMounted = true;
    const initInterviewGreeting = async () => {
      try {
        setIsProcessing(true);
        const res = await fetch(`${BACKEND_URL}/api/v1/session/${interviewId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isInitial: true }),
        });

        if (!res.ok) throw new Error("Failed to start session");

        const data = await res.json();
        if (isMounted && data.text) {
          setAiText(data.text);
          speakText(data.text);
        }
      } catch (err) {
        console.error("Initial greeting error:", err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    initInterviewGreeting();

    return () => {
      isMounted = false;
    };
  }, [interviewId, speakText]);

  useEffect(() => {
    let animationFrameId: number;
    let audioCtx: AudioContext;

    (async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        const userSource = audioCtx.createMediaStreamSource(ms);
        const userAnalyser = audioCtx.createAnalyser();
        userAnalyser.fftSize = 64;
        userSource.connect(userAnalyser);
        const userBuffer = new Uint8Array(userAnalyser.frequencyBinCount);

        const checkSpeech = () => {
          userAnalyser.getByteFrequencyData(userBuffer);
          let userSum = 0;
          for (let i = 0; i < userBuffer.length; i++) {
            const val = userBuffer[i];
            if (val !== undefined) userSum += val;
          }
          const userAvg = userSum / userBuffer.length;
          const normUserVol = Math.min(100, Math.round((userAvg / 128) * 100));
          setUserVolume(normUserVol);
          setUserSpeaking(normUserVol > 12);

          animationFrameId = requestAnimationFrame(checkSpeech);
        };
        checkSpeech();
      } catch (err) {
        console.error("Audio visualizer microphone error:", err);
      }
    })();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (audioCtx) audioCtx.close();
      window.speechSynthesis.cancel();
    };
  }, []);

  const sendAudio = async (audioBlob: Blob) => {
    // Safeguard 1: Cancel accidental clicks / empty recordings (< 1000 bytes)
    if (audioBlob.size < 1000) {
      alert("Audio recording too short. Please speak your answer before submitting.");
      return;
    }

    setIsProcessing(true);
    try {
      // Read audioBlob to Base64 to ensure 100% binary integrity
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const parts = res.split(",");
          resolve(parts[1] || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const res = await fetch(`${BACKEND_URL}/api/v1/session/${interviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!res.ok) throw new Error("Backend error processing audio session");

      const data = await res.json();

      if (data.text) {
        setAiText(data.text);
        speakText(data.text);
      }
    } catch (err) {
      console.error("Send audio failed:", err);
      alert("Failed to process your response. Please try speaking again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isProcessing) return;

    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    audioChunksRef.current = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach((t) => t.stop());
          if (blob.size > 0) {
            sendAudio(blob);
          }
        };

        recorder.start();
        setIsRecording(true);
      })
      .catch((err) => {
        console.error("Microphone access error:", err);
        alert("Microphone access is required. Please check your browser permissions.");
      });
  };

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col justify-between relative font-sans text-foreground select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="z-10 px-8 py-5 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="font-display font-bold tracking-widest text-sm text-foreground/80 uppercase">
            Technical Session
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground font-mono">
            {interviewId?.slice(0, 8)}...
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-sm text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE: {sessionTime}
          </div>
        </div>
      </header>

      <main className="z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-16 md:gap-24 max-w-6xl mx-auto w-full px-6">
        <div className="flex flex-col items-center gap-6 flex-1 max-w-sm">
          <div className="text-center">
            <span className="text-xs font-semibold tracking-widest text-primary/80 font-display uppercase">
              INTERVIEW CONDUCTOR
            </span>
            <h3 className="text-2xl font-black font-display text-white mt-1">AI Evaluator</h3>
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border border-primary/20 bg-primary/5 transition-transform duration-100 ease-out"
              style={{ transform: `scale(${1.0 + (aiVolume / 100) * 0.5})`, opacity: aiSpeaking ? 0.8 : 0.2 }}
            />
            {aiSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse-ring" style={{ animationDelay: "0s" }} />
                <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-pulse-ring" style={{ animationDelay: "1.5s" }} />
              </>
            )}
            <div className="absolute inset-4 rounded-full border border-white/5 bg-card/60 backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <div className="absolute inset-4 rounded-full border border-dashed border-primary/30 animate-radar-scan" style={{ animationDuration: "12s" }} />
              <div className="absolute inset-8 rounded-full border border-dotted border-accent/20 animate-radar-scan" style={{ animationDuration: "8s", animationDirection: "reverse" }} />
              <div
                className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary via-primary/80 to-accent flex items-center justify-center transition-transform duration-75 shadow-[0_0_50px_rgba(99,102,241,0.4)]"
                style={{ transform: `scale(${1.0 + (aiVolume / 100) * 0.25})` }}
              >
                <Cpu className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>
          </div>

          <div className="h-10 flex items-center justify-center">
            {isProcessing ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-xs font-bold font-display uppercase tracking-widest text-yellow-500 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                Thinking...
              </div>
            ) : aiSpeaking ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold font-display uppercase tracking-widest text-primary animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                AI Speaking
              </div>
            ) : (
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                AI Listening...
              </div>
            )}
          </div>

          {aiText && (
            <div className="w-full max-w-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-foreground/90 text-center shadow-lg backdrop-blur-sm transition-all leading-relaxed relative group">
              <p>{aiText}</p>
              <button
                onClick={() => speakText(aiText)}
                title="Replay Voice"
                className="mt-2 text-[11px] text-primary/80 hover:text-primary flex items-center justify-center gap-1.5 mx-auto py-1 px-2.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay Voice</span>
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col items-center justify-center w-32 relative">
          <span className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-widest mb-3">
            {isRecording ? "Recording" : "Audio Link"}
          </span>
          <div className="w-full h-[2px] bg-border relative overflow-hidden rounded-full">
            <div
              className="absolute h-full w-12 bg-gradient-to-r from-transparent via-primary to-transparent"
              style={{
                animation: "shimmer 1.5s infinite linear",
                animationDuration: isRecording ? "0.5s" : "2s",
              }}
            />
          </div>
          <Activity className="w-5 h-5 text-muted-foreground/20 mt-3 animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-6 flex-1 max-w-sm">
          <div className="text-center">
            <span className="text-xs font-semibold tracking-widest text-accent/80 font-display uppercase">
              LOCAL STREAM
            </span>
            <h3 className="text-2xl font-black font-display text-white mt-1">You (Candidate)</h3>
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border border-accent/20 bg-accent/5 transition-transform duration-100 ease-out"
              style={{ transform: `scale(${1.0 + (userVolume / 100) * 0.5})`, opacity: userSpeaking ? 0.8 : 0.2 }}
            />
            {userSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-pulse-ring" style={{ animationDelay: "0s" }} />
                <div className="absolute inset-0 rounded-full border-2 border-accent/10 animate-pulse-ring" style={{ animationDelay: "1.5s" }} />
              </>
            )}
            <div className="absolute inset-4 rounded-full border border-white/5 bg-card/60 backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <div className="flex items-center justify-center gap-2 h-16 w-32 relative z-10">
                {[...Array(6)].map((_, i) => {
                  const baseDelays = [0.1, 0.4, 0.2, 0.5, 0.3, 0.6];
                  const delay = baseDelays[i] ?? 0.2;
                  const speakerMultiplier = userSpeaking ? (userVolume / 100) * 2.2 + 0.4 : 0.3;
                  return (
                    <div
                      key={i}
                      className="w-2.5 bg-gradient-to-t from-accent/50 to-accent rounded-full transition-all duration-100 ease-out"
                      style={{
                        height: userSpeaking
                          ? `${Math.max(10, Math.round(50 * speakerMultiplier * (0.5 + Math.random() * 0.5)))}px`
                          : "6px",
                        opacity: userSpeaking ? 0.9 : 0.4,
                        transitionDelay: `${delay * 0.05}s`,
                      }}
                    />
                  );
                })}
              </div>
              <div
                className="absolute w-36 h-36 rounded-full border border-accent/10 transition-transform duration-75"
                style={{ transform: `scale(${1.0 + (userVolume / 100) * 0.1})` }}
              />
            </div>
          </div>

          <div className="h-10 flex items-center justify-center">
            {isRecording ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-bold font-display uppercase tracking-widest text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <Mic className="w-3.5 h-3.5" />
                Recording Answer...
              </div>
            ) : userSpeaking ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-xs font-bold font-display uppercase tracking-widest text-accent animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Mic className="w-3.5 h-3.5" />
                Microphone Active
              </div>
            ) : (
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                Microphone Ready
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="z-10 px-8 py-6 border-t border-border bg-background/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-xs text-muted-foreground max-w-md">
            {aiSpeaking
              ? "Listen to the interviewer's question..."
              : isRecording
              ? "Click the red button when you are done answering."
              : "Click the microphone button to record your response."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
              isRecording
                ? "bg-red-500 border-red-400 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)] cursor-pointer"
                : isProcessing
                ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500 cursor-not-allowed"
                : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40 cursor-pointer"
            }`}
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            ) : isRecording ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          <Button
            onClick={() => navigate(`/result/${interviewId}`)}
            className="px-6 h-12 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 hover:border-destructive rounded-xl transition-all duration-300 font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <Power className="w-4 h-4" />
            End Session
          </Button>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { left: -50px; }
          100% { left: 150px; }
        }
      `}</style>
    </div>
  );
}
