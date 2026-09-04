'use client';

import React, { useState } from 'react';
import { Layout, Server, Layers, Network, Code2, Users, ArrowRight, Sparkles, Mic, FileText, Bot, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { DOMAINS, EXPERIENCE_LEVELS, PERSONAS } from '@/lib/constants';
import { InterviewConfig, InterviewDomain, ExperienceLevel, InterviewerPersona, ProviderSettings } from '@/lib/types';

interface InterviewSetupProps {
  onStartInterview: (config: InterviewConfig) => void;
  providerSettings: ProviderSettings;
}

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  Layout: <Layout className="w-5 h-5 text-cyan-400" />,
  Server: <Server className="w-5 h-5 text-emerald-400" />,
  Layers: <Layers className="w-5 h-5 text-violet-400" />,
  Network: <Network className="w-5 h-5 text-amber-400" />,
  Code2: <Code2 className="w-5 h-5 text-blue-400" />,
  Users: <Users className="w-5 h-5 text-rose-400" />
};

export function InterviewSetup({ onStartInterview, providerSettings }: InterviewSetupProps) {
  const [candidateName, setCandidateName] = useState<string>('Ansh Tiwari');
  const [githubUsername, setGithubUsername] = useState<string>('ansh1325');
  const [isSyncingGithub, setIsSyncingGithub] = useState<boolean>(false);
  const [githubSyncSuccess, setGithubSyncSuccess] = useState<string | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [domain, setDomain] = useState<InterviewDomain>('frontend');
  const [level, setLevel] = useState<ExperienceLevel>('senior');
  const [persona, setPersona] = useState<InterviewerPersona>('strict_tech_lead');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [candidateResume, setCandidateResume] = useState<string>(
    'Fullstack Engineer experienced in TypeScript, React, Next.js Edge Functions, and Node.js. Built projects including Ai-interviewer-opensource and TRELLO-FULLSTACK.'
  );

  const handleFetchGithub = async () => {
    if (!githubUsername.trim()) return;
    setIsSyncingGithub(true);
    setGithubError(null);
    setGithubSyncSuccess(null);

    try {
      const res = await fetch(`/api/github?username=${encodeURIComponent(githubUsername.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub profile');
      }

      // Populate profile
      if (data.name) setCandidateName(data.name);
      if (data.resumeSummary) setCandidateResume(data.resumeSummary);
      if (data.suggestedDomain && ['frontend', 'backend', 'fullstack', 'system_design', 'dsa', 'behavioral'].includes(data.suggestedDomain)) {
        setDomain(data.suggestedDomain as InterviewDomain);
      }

      setGithubSyncSuccess(`Successfully imported @${data.username}: ${data.publicRepos} repos (${data.topLanguages.slice(0, 3).join(', ')})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching GitHub';
      setGithubError(msg);
    } finally {
      setIsSyncingGithub(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartInterview({
      candidateName: candidateName.trim() || 'Candidate',
      domain,
      level,
      persona,
      questionCount,
      candidateResume,
      providerSettings
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Technical Interview Simulator</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Master Your Next Tech Interview with{' '}
          <span className="gradient-text-cyan">Autonomous AI</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Powered by edge functions, native Web Speech audio, and open-source models. 
          Experience dynamic follow-ups, real-time code execution, and rigorous rubric scoring with zero fees.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Candidate Info & GitHub Sync */}
        <div className="glass-panel p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
              Candidate Profile & GitHub Intelligence
            </h2>
            <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Live GitHub API Ingestion
            </span>
          </div>

          {/* GitHub Sync Bar */}
          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 shrink-0">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>Import GitHub Profile:</span>
            </div>
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Enter GitHub username (e.g. ansh1325)"
                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-cyan-400 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleFetchGithub}
              disabled={isSyncingGithub || !githubUsername.trim()}
              className="w-full sm:w-auto px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isSyncingGithub ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-cyan-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>Sync Profile</span>
                </>
              )}
            </button>
          </div>

          {/* GitHub Sync Notification */}
          {githubSyncSuccess && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{githubSyncSuccess}</span>
            </div>
          )}
          {githubError && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{githubError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Your Full Name / Alias
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Ansh Tiwari"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Resume Highlights / GitHub Projects</span>
                <span className="text-[11px] text-slate-500">Auto-synced</span>
              </label>
              <input
                type="text"
                value={candidateResume}
                onChange={(e) => setCandidateResume(e.target.value)}
                placeholder="Key skills: React, TypeScript, Kafka, Postgres, GraphQL..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Domain Selection */}
        <div className="glass-panel p-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
            Select Interview Specialization
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {DOMAINS.map((item) => {
              const isSelected = domain === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setDomain(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white/5">
                      {DOMAIN_ICONS[item.iconName] || <Layout className="w-5 h-5 text-cyan-400" />}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">{item.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.topics.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-white/5 text-slate-300 px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Seniority & Persona */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seniority Level */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">3</span>
              Target Seniority Level
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const isSelected = level === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setLevel(lvl.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{lvl.label}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{lvl.experience}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{lvl.focus}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persona Selection */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">4</span>
              Interviewer Persona
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {PERSONAS.map((p) => {
                const isSelected = persona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersona(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-400 text-white shadow-md shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{p.avatar}</span>
                      <div>
                        <div className="text-xs font-bold">{p.name}</div>
                        <div className="text-[10px] text-purple-300 font-medium">{p.title}</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{p.style}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 4: Questions & Launch */}
        <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-300">Session Length:</span>
            <div className="flex gap-1.5">
              {[3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    questionCount === num
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {num}Q
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">
              (~{questionCount * 3} minutes mock)
            </span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Enter Interview Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
