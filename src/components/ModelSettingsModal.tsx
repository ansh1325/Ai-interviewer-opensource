'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Server, Zap, Globe } from 'lucide-react';
import { AIProvider, ProviderSettings } from '@/lib/types';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProviderSettings;
  onSave: (newSettings: ProviderSettings) => void;
}

export function ModelSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave
}: ModelSettingsModalProps) {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(settings.provider);
  const [ollamaEndpoint, setOllamaEndpoint] = useState(settings.ollamaEndpoint || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel || 'llama3.2');
  const [groqApiKey, setGroqApiKey] = useState(settings.groqApiKey || '');
  const [groqModel, setGroqModel] = useState(settings.groqModel || 'llama-3.3-70b-versatile');

  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingStatus('testing');
    setTestMessage('Pinging endpoint from Edge Function...');
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: currentProvider,
          endpoint: ollamaEndpoint,
          apiKey: groqApiKey
        })
      });
      const data = await res.json();
      if (res.ok && (data.status === 'healthy' || data.status === 'connected')) {
        setTestingStatus('success');
        setTestMessage(data.message || 'Connection verified successfully!');
      } else {
        setTestingStatus('error');
        setTestMessage(data.message || 'Unable to connect to selected provider.');
      }
    } catch (err: unknown) {
      setTestingStatus('error');
      const msg = err instanceof Error ? err.message : 'Network test error';
      setTestMessage(`Test failed: ${msg}`);
    }
  };

  const handleSave = () => {
    onSave({
      provider: currentProvider,
      ollamaEndpoint,
      ollamaModel,
      groqApiKey,
      groqModel
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0e131f] border border-white/10 shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              AI Model & Engine Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose your open-source inference engine. All options are 100% free with zero required subscriptions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Cards */}
        <div className="mt-5 space-y-3">
          {/* Built-in Edge */}
          <div
            onClick={() => setCurrentProvider('builtin')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentProvider === 'builtin'
                ? 'bg-cyan-500/10 border-cyan-400/80 ring-1 ring-cyan-400/50'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Built-in Edge NLP Engine</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Recommended • Zero Config
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Runs directly inside the Next.js Edge isolate. Zero API keys, zero installations, instantaneous evaluation.
                  </p>
                </div>
              </div>
              <input
                type="radio"
                checked={currentProvider === 'builtin'}
                onChange={() => setCurrentProvider('builtin')}
                className="mt-1 accent-cyan-400"
              />
            </div>
          </div>

          {/* Local Ollama */}
          <div
            onClick={() => setCurrentProvider('ollama')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentProvider === 'ollama'
                ? 'bg-purple-500/10 border-purple-400/80 ring-1 ring-purple-400/50'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Local Ollama (100% Private & Open Source)</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Local Offline
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Runs on your local machine using Llama 3.2, DeepSeek-R1, Mistral, or Qwen. Zero data sent to cloud.
                  </p>
                </div>
              </div>
              <input
                type="radio"
                checked={currentProvider === 'ollama'}
                onChange={() => setCurrentProvider('ollama')}
                className="mt-1 accent-purple-400"
              />
            </div>

            {currentProvider === 'ollama' && (
              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Ollama Host URL</label>
                  <input
                    type="text"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-black/40 border border-white/15 focus:border-purple-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Installed Model Name</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="llama3.2, mistral, deepseek-r1"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-black/40 border border-white/15 focus:border-purple-400 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Groq Free Tier */}
          <div
            onClick={() => setCurrentProvider('groq')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentProvider === 'groq'
                ? 'bg-amber-500/10 border-amber-400/80 ring-1 ring-amber-400/50'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Groq Free Tier (Llama 3.3 70B)</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Ultra Fast (500 tps)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Free cloud inference on open-source weights. Free API key from console.groq.com.
                  </p>
                </div>
              </div>
              <input
                type="radio"
                checked={currentProvider === 'groq'}
                onChange={() => setCurrentProvider('groq')}
                className="mt-1 accent-amber-400"
              />
            </div>

            {currentProvider === 'groq' && (
              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Groq API Key (Stored Locally)</label>
                  <input
                    type="password"
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full text-xs px-3 py-2 rounded-lg bg-black/40 border border-white/15 focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Groq Open-Source Model</label>
                  <select
                    value={groqModel}
                    onChange={(e) => setGroqModel(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-black/40 border border-white/15 focus:border-amber-400 outline-none text-white"
                  >
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diagnostic Status Box */}
        {testingStatus !== 'idle' && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 border ${
              testingStatus === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : testingStatus === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}
          >
            {testingStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
            {testingStatus === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            {testingStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin mt-0.5" />}
            <div>{testMessage}</div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={handleTestConnection}
            disabled={testingStatus === 'testing'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingStatus === 'testing' ? 'animate-spin' : ''}`} />
            Test Connection
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
