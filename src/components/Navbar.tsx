'use client';

import React from 'react';
import { Cpu, Settings2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { ProviderSettings } from '@/lib/types';

interface NavbarProps {
  providerSettings: ProviderSettings;
  onOpenSettings: () => void;
  onReset: () => void;
  isInterviewActive: boolean;
}

export function Navbar({ providerSettings, onOpenSettings, onReset, isInterviewActive }: NavbarProps) {
  const getProviderLabel = () => {
    switch (providerSettings.provider) {
      case 'ollama':
        return `Ollama (${providerSettings.ollamaModel || 'llama3.2'})`;
      case 'groq':
        return `Groq (${providerSettings.groqModel || 'llama-3.3-70b'})`;
      case 'openrouter':
        return 'OpenRouter Free';
      default:
        return 'Built-in Edge NLP';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090e]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Badges */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                Interviewer<span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                Open Source
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider items-center gap-1">
                <Cpu className="w-3 h-3" /> Edge Runtime
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Free, Private & Real-Time Technical Interview Simulator
            </p>
          </div>
        </div>

        {/* Right: Provider & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all"
            title="Configure AI Model Provider"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline text-slate-400">Engine:</span>
            <span className="text-cyan-300 font-semibold">{getProviderLabel()}</span>
            <Settings2 className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {isInterviewActive && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-400 hover:text-red-300 transition-all"
              title="Reset and start a new interview"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">End Session</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
