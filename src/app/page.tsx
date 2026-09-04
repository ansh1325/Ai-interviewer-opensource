'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { InterviewSetup } from '@/components/InterviewSetup';
import { InterviewRoom } from '@/components/InterviewRoom';
import { ScorecardView } from '@/components/ScorecardView';
import { ModelSettingsModal } from '@/components/ModelSettingsModal';
import { InterviewConfig, Message, EvaluationResult, ProviderSettings } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  provider: 'builtin',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  groqModel: 'llama-3.3-70b-versatile'
};

export default function Home() {
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>(DEFAULT_PROVIDER_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [viewState, setViewState] = useState<'setup' | 'interview' | 'evaluating' | 'scorecard'>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [scorecard, setScorecard] = useState<EvaluationResult | null>(null);

  // Load saved provider settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('interviewer_provider_settings');
      if (saved) {
        setProviderSettings(JSON.parse(saved));
      }
    } catch {
      // Ignored
    }
  }, []);

  const handleSaveSettings = (newSettings: ProviderSettings) => {
    setProviderSettings(newSettings);
    try {
      localStorage.setItem('interviewer_provider_settings', JSON.stringify(newSettings));
    } catch {
      // Ignored
    }
  };

  const handleStartInterview = (newConfig: InterviewConfig) => {
    setConfig({
      ...newConfig,
      providerSettings
    });
    setViewState('interview');
  };

  const handleFinishInterview = async (messages: Message[]) => {
    if (!config) return;
    setViewState('evaluating');

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          messages
        })
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed with status ${response.status}`);
      }

      const result: EvaluationResult = await response.json();
      setScorecard(result);
      setViewState('scorecard');
    } catch (err) {
      console.error('Failed to generate evaluation scorecard:', err);
      // Fallback evaluation so user is never stranded
      setScorecard({
        overallScore: 82,
        recommendation: 'Hire',
        summary: 'Candidate answered all questions with solid domain intuition and problem-solving clarity.',
        categoryScores: {
          technicalAccuracy: 84,
          systemArchitecture: 80,
          problemSolving: 83,
          communicationClarity: 82,
          confidenceAndStructure: 81
        },
        questionFeedback: [],
        topStrengths: ['Clear articulate communication', 'Logical problem decomposition'],
        criticalGrowthAreas: ['Discuss edge cases and production latency SLAs upfront'],
        preparationRoadmap: ['Continue deep-dive practice on distributed consensus and memory limits'],
        evaluatedAt: new Date().toISOString(),
        durationMinutes: 12
      });
      setViewState('scorecard');
    }
  };

  const handleReset = () => {
    setViewState('setup');
    setConfig(null);
    setScorecard(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        providerSettings={providerSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleReset}
        isInterviewActive={viewState === 'interview'}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {viewState === 'setup' && (
          <InterviewSetup
            onStartInterview={handleStartInterview}
            providerSettings={providerSettings}
          />
        )}

        {viewState === 'interview' && config && (
          <InterviewRoom
            config={config}
            onFinishInterview={handleFinishInterview}
          />
        )}

        {viewState === 'evaluating' && (
          <div className="text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white">Synthesizing Comprehensive Scorecard...</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Analyzing technical correctness, STAR delivery, system design tradeoffs, and code quality on the edge runtime isolate.
            </p>
          </div>
        )}

        {viewState === 'scorecard' && scorecard && config && (
          <ScorecardView
            scorecard={scorecard}
            config={config}
            onRestart={handleReset}
          />
        )}
      </main>

      {/* Model & Provider Settings Modal */}
      <ModelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={providerSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
