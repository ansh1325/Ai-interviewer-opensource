# 🎙️ InterviewerAI — Autonomous Open-Source AI Interviewer

A 100% free, open-source AI technical and behavioral interview platform built on **React** and **Next.js Edge Functions**.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Next.js Edge](https://img.shields.io/badge/Next.js_Edge_Runtime-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Open Source](https://img.shields.io/badge/100%25_Open_Source-Free-emerald?style=flat-square)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fansh1325%2FAi-interviewer-opensource)

---

## ✨ Features

- **⚡ V8 Edge Function Backend**: Sub-5ms cold starts running on V8 edge isolates (`export const runtime = 'edge'`).
- **🧠 100% Free / Open-Source Inference**:
  - **Built-in Edge NLP Engine**: Zero API key, zero setup, runs directly on the edge.
  - **Local Ollama Integration**: 100% private, offline inference with Llama 3.2, DeepSeek-R1, Mistral.
  - **Groq Free Tier**: Cloud open-source inference at 500+ tokens/sec.
- **🎙️ Zero-Cost Audio Pipeline**:
  - Browser-native Web Speech API (`SpeechRecognition` for STT, `SpeechSynthesis` for natural voice TTS).
  - Dynamic HTML5 Canvas audio waveform visualizer.
  - Optional real-time webcam video feed.
- **💻 Live Code Scratchpad**: Real-time syntax-highlighted code editor for technical and algorithmic questions.
- **📊 5-Dimension Scorecard**: Comprehensive breakdown across Technical Accuracy, System Architecture, Problem Solving, Communication, and STAR alignment, with downloadable `.md` reports.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build & Run for Production
```bash
npm run build
npm start
```

---

## 📖 Interview Defense & Architecture Guide

Looking to explain this project in a job interview? Check out the full breakdown in [INTERVIEW_EXPLANATION.md](file:///d:/Ai-interviewer-opensource/INTERVIEW_EXPLANATION.md) for talking points, architectural decisions, and answers to challenging technical questions.
