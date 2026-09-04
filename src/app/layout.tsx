import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'InterviewerAI — Open-Source AI Technical Interviewer on Edge',
  description: 'Practice real-time technical & behavioral interviews with an autonomous open-source AI powered by Edge Functions and native Web Speech audio.',
  keywords: ['AI Interviewer', 'Open Source', 'Next.js Edge Functions', 'React', 'Coding Interview', 'System Design Mock', 'Web Speech API']
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen flex flex-col font-sans bg-[#07090e] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
