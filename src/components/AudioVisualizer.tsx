'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  color?: 'cyan' | 'purple' | 'red';
  barCount?: number;
  height?: number;
}

export function AudioVisualizer({
  isActive,
  color = 'cyan',
  barCount = 28,
  height = 48
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      phaseRef.current += isActive ? 0.15 : 0.03;
      const currentPhase = phaseRef.current;

      const step = width / barCount;
      const barWidth = Math.max(2, step * 0.55);

      for (let i = 0; i < barCount; i++) {
        const x = i * step + (step - barWidth) / 2;
        let normalizedHeight = 0.15; // idle baseline

        if (isActive) {
          // Dynamic harmonic motion
          const wave1 = Math.sin(currentPhase + i * 0.45);
          const wave2 = Math.cos(currentPhase * 1.3 - i * 0.3);
          const wave3 = Math.sin(currentPhase * 0.7 + i * 0.2);
          const combined = (wave1 + wave2 + wave3) / 3;
          normalizedHeight = Math.max(0.12, Math.min(0.95, (combined + 1) / 2));
        } else {
          // Gentle breathing idle wave
          normalizedHeight = 0.12 + Math.sin(currentPhase + i * 0.2) * 0.06;
        }

        const barHeight = Math.max(4, normalizedHeight * h);
        const y = (h - barHeight) / 2;

        // Gradient styling based on color
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (color === 'red') {
          gradient.addColorStop(0, '#f87171');
          gradient.addColorStop(1, '#ef4444');
        } else if (color === 'purple') {
          gradient.addColorStop(0, '#c084fc');
          gradient.addColorStop(1, '#8b5cf6');
        } else {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(1, '#06b6d4');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Rounded bar
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, color, barCount, height]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={height}
      className="w-full max-w-[240px] h-auto block"
    />
  );
}
