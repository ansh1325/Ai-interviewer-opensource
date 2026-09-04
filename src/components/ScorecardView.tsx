'use client';

import React, { useEffect, useState } from 'react';
import { 
  Award, CheckCircle2, TrendingUp, AlertTriangle, ArrowRight, 
  Download, Copy, Check, Sparkles, RefreshCw, ChevronDown, ChevronUp, FileText 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EvaluationResult, InterviewConfig } from '@/lib/types';

interface ScorecardViewProps {
  scorecard: EvaluationResult;
  config: InterviewConfig;
  onRestart: () => void;
}

export function ScorecardView({ scorecard, config, onRestart }: ScorecardViewProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  useEffect(() => {
    if (scorecard.overallScore >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignored
      }
    }
  }, [scorecard.overallScore]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-400/40 bg-emerald-500/10';
    if (score >= 70) return 'text-cyan-400 border-cyan-400/40 bg-cyan-500/10';
    if (score >= 55) return 'text-amber-400 border-amber-400/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-400/40 bg-rose-500/10';
  };

  const handleCopySummary = () => {
    const summaryText = `# Interview Evaluation Report: ${config.candidateName}
Domain: ${config.domain.toUpperCase()} (${config.level.toUpperCase()})
Overall Score: ${scorecard.overallScore}/100 - Recommendation: ${scorecard.recommendation}

## Category Breakdown:
- Technical Accuracy: ${scorecard.categoryScores.technicalAccuracy}%
- System Architecture: ${scorecard.categoryScores.systemArchitecture}%
- Problem Solving: ${scorecard.categoryScores.problemSolving}%
- Communication Clarity: ${scorecard.categoryScores.communicationClarity}%
- Confidence & Structure: ${scorecard.categoryScores.confidenceAndStructure}%

## Summary:
${scorecard.summary}

## Key Strengths:
${scorecard.topStrengths.map(s => `- ${s}`).join('\n')}

## Areas for Growth:
${scorecard.criticalGrowthAreas.map(a => `- ${a}`).join('\n')}
`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const reportMd = `# Official Technical Interview Scorecard
**Candidate:** ${config.candidateName}  
**Domain:** ${config.domain}  
**Seniority:** ${config.level}  
**Date:** ${new Date(scorecard.evaluatedAt).toLocaleDateString()}  
**Overall Score:** ${scorecard.overallScore}/100 (${scorecard.recommendation})  

---

## Executive Summary
${scorecard.summary}

## Category Scores
- **Technical Accuracy:** ${scorecard.categoryScores.technicalAccuracy}/100
- **System Architecture & Scalability:** ${scorecard.categoryScores.systemArchitecture}/100
- **Problem Solving:** ${scorecard.categoryScores.problemSolving}/100
- **Communication & STAR Method:** ${scorecard.categoryScores.communicationClarity}/100
- **Confidence & Structured Reasoning:** ${scorecard.categoryScores.confidenceAndStructure}/100

---

## Question-by-Question Analysis
${scorecard.questionFeedback.map(q => `
### Question ${q.questionIndex}: ${q.question}
- **Score:** ${q.score}/100
- **Candidate Answer:** "${q.candidateAnswer}"
- **Strengths:**
${q.strengths.map(s => `  * ${s}`).join('\n')}
- **Opportunities for Improvement:**
${q.improvements.map(imp => `  * ${imp}`).join('\n')}
- **Ideal Response Formulation:** ${q.idealAnswer}
`).join('\n---\n')}

## Recommended Preparation Roadmap
${scorecard.preparationRoadmap.map(step => `1. ${step}`).join('\n')}
`;

    const blob = new Blob([reportMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-scorecard-${config.candidateName.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Assessment Completed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Evaluation for <span className="text-cyan-400">{config.candidateName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {config.domain.replace('_', ' ').toUpperCase()} • {config.level.toUpperCase()} LEVEL • {scorecard.durationMinutes} MIN MOCK
            </p>
          </div>

          {/* Overall Score Badge */}
          <div className="flex flex-col items-center sm:items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black gradient-text-cyan">{scorecard.overallScore}</span>
              <span className="text-lg text-slate-500 font-bold">/100</span>
            </div>
            <div className={`mt-1 px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(scorecard.overallScore)}`}>
              {scorecard.recommendation}
            </div>
          </div>
        </div>

        <p className="mt-5 pt-4 border-t border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {scorecard.summary}
        </p>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Report (.md)</span>
          </button>

          <button
            onClick={onRestart}
            className="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Mock Interview</span>
          </button>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Technical Accuracy', score: scorecard.categoryScores.technicalAccuracy },
          { label: 'System Architecture', score: scorecard.categoryScores.systemArchitecture },
          { label: 'Problem Solving', score: scorecard.categoryScores.problemSolving },
          { label: 'Communication Clarity', score: scorecard.categoryScores.communicationClarity },
          { label: 'Confidence & STAR', score: scorecard.categoryScores.confidenceAndStructure },
        ].map((item, idx) => (
          <div key={idx} className="glass-panel p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium mb-2">{item.label}</span>
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xl font-bold text-white">{item.score}%</span>
                <span className="text-[10px] text-slate-500">Benchmark: 75%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Growth Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Strengths */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Demonstrated Strengths
          </h3>
          <ul className="space-y-2">
            {scorecard.topStrengths.map((str, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Areas */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Critical Growth Opportunities
          </h3>
          <ul className="space-y-2">
            {scorecard.criticalGrowthAreas.map((area, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question by Question Deep Dive */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
          <span>Question-by-Question Deep Dive</span>
          <span className="text-xs text-slate-400 font-normal">
            Click to expand ideal answers and grading details
          </span>
        </h3>

        <div className="space-y-3">
          {scorecard.questionFeedback.map((q, idx) => {
            const isExpanded = expandedQuestion === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 select-none"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0">
                      Q{q.questionIndex}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white line-clamp-1">
                      {q.question}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getScoreColor(q.score)}`}>
                      {q.score}%
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-white/10 text-xs space-y-3 mt-3">
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Your Stated Answer:</span>
                      <p className="text-slate-200 bg-black/40 p-2.5 rounded-lg border border-white/5 italic">
                        "{q.candidateAnswer}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-emerald-400 font-semibold block mb-1">Key Strengths Noted:</span>
                        <ul className="space-y-1 text-slate-300">
                          {q.strengths.map((s, i) => (
                            <li key={i}>✓ {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-amber-400 font-semibold block mb-1">Missed Opportunities:</span>
                        <ul className="space-y-1 text-slate-300">
                          {q.improvements.map((imp, i) => (
                            <li key={i}>△ {imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <span className="text-cyan-400 font-semibold block mb-1">Ideal Model Answer Formulation:</span>
                      <p className="text-slate-300 bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-500/20">
                        {q.idealAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
