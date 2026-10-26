import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  GripHorizontal,
} from 'lucide-react';
import { FloatingTimerState } from '../types';
import {
  playClickSound,
  playCelebrationFanfare,
  setAmbientSound,
} from '../utils/sound';

interface FloatingTimerProps {
  timerState: FloatingTimerState;
  onUpdateTimer: (updated: Partial<FloatingTimerState>) => void;
  soundEnabled: boolean;
  ambientSound: 'none' | 'pencil' | 'rain';
  onUpdateAmbient: (ambient: 'none' | 'pencil' | 'rain') => void;
  darkMode?: boolean;
}

export const FloatingTimer: React.FC<FloatingTimerProps> = ({
  timerState,
  onUpdateTimer,
  soundEnabled,
  ambientSound,
  onUpdateAmbient,
  darkMode = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Ticking countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerState.isRunning && timerState.remainingSeconds > 0) {
      interval = setInterval(() => {
        onUpdateTimer({
          remainingSeconds: Math.max(0, timerState.remainingSeconds - 1),
        });
      }, 1000);
    } else if (timerState.isRunning && timerState.remainingSeconds === 0) {
      onUpdateTimer({ isRunning: false });
      playCelebrationFanfare(soundEnabled);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: darkMode
          ? ['#d6d3d1', '#a8a29e', '#78716c', '#f5f5f4']
          : ['#292524', '#78716c', '#a8a29e', '#d6d3d1'],
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, timerState.remainingSeconds, soundEnabled, onUpdateTimer, darkMode]);

  // Ambient sound management
  useEffect(() => {
    if (timerState.isRunning && ambientSound !== 'none' && soundEnabled) {
      setAmbientSound(ambientSound, 0.02);
    } else {
      setAmbientSound('none');
    }
    return () => setAmbientSound('none');
  }, [timerState.isRunning, ambientSound, soundEnabled]);

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('input')
    ) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: timerState.x,
      initialY: timerState.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;

      const newX = Math.max(10, Math.min(window.innerWidth - 220, dragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, dragStartRef.current.initialY + dy));

      onUpdateTimer({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const toggleRun = () => {
    playClickSound(soundEnabled);
    if (timerState.remainingSeconds === 0) {
      onUpdateTimer({
        remainingSeconds: timerState.durationMinutes * 60,
        isRunning: true,
      });
      return;
    }
    onUpdateTimer({ isRunning: !timerState.isRunning });
  };

  const resetTimer = () => {
    playClickSound(soundEnabled);
    onUpdateTimer({
      remainingSeconds: timerState.durationMinutes * 60,
      isRunning: false,
    });
  };

  const setPreset = (mins: number) => {
    playClickSound(soundEnabled);
    onUpdateTimer({
      durationMinutes: mins,
      remainingSeconds: mins * 60,
      isRunning: false,
    });
  };

  const adjustMinutes = (deltaMin: number) => {
    playClickSound(soundEnabled);
    const newMins = Math.max(1, Math.min(180, timerState.durationMinutes + deltaMin));
    const newSecs = Math.max(0, timerState.remainingSeconds + deltaMin * 60);
    onUpdateTimer({
      durationMinutes: newMins,
      remainingSeconds: newSecs,
    });
  };

  const mins = Math.floor(timerState.remainingSeconds / 60);
  const secs = timerState.remainingSeconds % 60;
  const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const presets = [5, 15, 25, 45];

  // Minimized floating pill view
  if (timerState.isMinimized) {
    return (
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        style={{ left: `${timerState.x}px`, top: `${timerState.y}px` }}
        className="fixed z-40 select-none cursor-grab active:cursor-grabbing floating-card-sm px-3 py-1.5 flex items-center gap-2 hover:shadow-md transition-shadow"
      >
        <span className="text-sm">⏱️</span>
        <span className="font-hand font-bold text-stone-900 dark:text-stone-100 text-lg tabular-nums">
          {timeDisplay}
        </span>
        <button
          type="button"
          onClick={toggleRun}
          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-800 dark:text-stone-200"
          title={timerState.isRunning ? 'Pause' : 'Start'}
        >
          {timerState.isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
        <button
          type="button"
          onClick={() => onUpdateTimer({ isMinimized: false })}
          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
          title="Expand timer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Expanded floating note view
  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      style={{ left: `${timerState.x}px`, top: `${timerState.y}px` }}
      className={`fixed z-40 select-none floating-card w-64 p-3.5 flex flex-col gap-2.5 transition-shadow ${
        isDragging ? 'cursor-grabbing shadow-lg' : 'cursor-default'
      }`}
    >
      {/* Neutral Gray Washi Tape strip on top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-4 washi-tape-strip pointer-events-none opacity-90 -rotate-1" />

      {/* Header bar / Drag handle */}
      <div className="flex items-center justify-between cursor-grab active:cursor-grabbing pb-1 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
          <GripHorizontal className="w-4 h-4 text-stone-400 dark:text-stone-500" />
          <span className="font-hand font-bold text-stone-900 dark:text-stone-100 text-base">
            floating timer
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const next = ambientSound === 'none' ? 'pencil' : ambientSound === 'pencil' ? 'rain' : 'none';
              onUpdateAmbient(next);
            }}
            className={`p-1 rounded text-xs transition-colors ${
              ambientSound !== 'none'
                ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
            title="Toggle focus sound (pencil / rain / off)"
          >
            {ambientSound !== 'none' ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onUpdateTimer({ isMinimized: true })}
            className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded"
            title="Minimize to floating pill"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="flex items-center justify-center my-0.5">
        <span className="font-hand font-bold text-stone-900 dark:text-stone-100 text-4xl sm:text-5xl tracking-tight tabular-nums">
          {timeDisplay}
        </span>
      </div>

      {/* Quick Presets (Gray/Neutral Accents) */}
      <div className="flex items-center justify-between gap-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={`flex-1 py-0.5 text-xs font-hand rounded border transition-colors ${
              timerState.durationMinutes === p && !timerState.isRunning
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 font-bold'
                : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-600'
            }`}
          >
            {p}m
          </button>
        ))}
      </div>

      {/* Steppers (+1m / -1m) and Controls */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => adjustMinutes(-1)}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            title="Subtract 1 minute"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => adjustMinutes(5)}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            title="Add 5 minutes"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetTimer}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            title="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleRun}
            className={`px-3 py-1 font-hand font-bold text-sm rounded border flex items-center gap-1.5 transition-colors ${
              timerState.isRunning
                ? 'bg-stone-300 dark:bg-stone-600 text-stone-900 dark:text-stone-100 border-stone-400 dark:border-stone-500'
                : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200'
            }`}
          >
            {timerState.isRunning ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>start</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
