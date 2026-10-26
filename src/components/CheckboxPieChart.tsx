import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Task } from '../types';
import { playCelebrationFanfare, playDingSound } from '../utils/sound';

interface CheckboxPieChartProps {
  tasks: Task[];
  soundEnabled: boolean;
  darkMode?: boolean;
}

export const CheckboxPieChart: React.FC<CheckboxPieChartProps> = ({
  tasks,
  soundEnabled,
  darkMode = false,
}) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const ratio = total === 0 ? 0 : completed / total;
  const percentage = Math.round(ratio * 100);
  const isAllDone = total > 0 && completed === total;

  const prevDoneRef = useRef(false);

  useEffect(() => {
    if (isAllDone && !prevDoneRef.current) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: darkMode
          ? ['#d6d3d1', '#a8a29e', '#78716c', '#f5f5f4']
          : ['#292524', '#78716c', '#a8a29e', '#d6d3d1'],
      });
      playCelebrationFanfare(soundEnabled);
    }
    prevDoneRef.current = isAllDone;
  }, [isAllDone, soundEnabled, darkMode]);

  const handleClick = () => {
    if (isAllDone) {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.5 },
        colors: ['#78716c', '#a8a29e', '#d6d3d1'],
      });
      playDingSound(soundEnabled);
    }
  };

  const cx = 24;
  const cy = 24;
  const r = 16;

  const getPiePath = (val: number): string => {
    if (val <= 0) return '';
    if (val >= 0.999) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
    }
    const angle = val * 2 * Math.PI - Math.PI / 2;
    const endX = cx + r * Math.cos(angle);
    const endY = cy + r * Math.sin(angle);
    const largeArcFlag = val > 0.5 ? 1 : 0;
    return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };

  const boxStrokeColor = darkMode ? '#e7e5e4' : '#1c1917';
  const filledBgColor = darkMode ? '#e7e5e4' : '#1c1917';
  const checkmarkColor = darkMode ? '#171717' : '#ffffff';
  const hatchStrokeColor = darkMode ? '#d6d3d1' : '#292524';

  return (
    <div
      onClick={handleClick}
      className="inline-flex items-center gap-2 select-none cursor-pointer group"
      title={
        isAllDone
          ? 'All tasks completed! Click for celebration'
          : `${completed} of ${total} items checked (${percentage}%)`
      }
    >
      {/* Hand-drawn checkbox containing the pie chart */}
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
        <svg viewBox="0 0 48 48" className="w-full h-full overflow-visible">
          <defs>
            {/* Pencil hatch pattern */}
            <pattern
              id={darkMode ? 'hatch-fill-dark' : 'hatch-fill'}
              width="6"
              height="6"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke={hatchStrokeColor}
                strokeWidth="2"
                strokeOpacity="0.8"
              />
            </pattern>
          </defs>

          {/* Outer Hand-drawn Square Checkbox */}
          <rect
            x="4"
            y="4"
            width="40"
            height="40"
            rx="4"
            ry="4"
            fill={isAllDone ? filledBgColor : darkMode ? '#262626' : '#ffffff'}
            stroke={boxStrokeColor}
            strokeWidth="3.2"
            strokeDasharray={total === 0 ? '4 3' : undefined}
            className="transition-colors duration-200"
          />

          {/* Inner Pie Chart slice */}
          {!isAllDone && ratio > 0 && (
            <>
              {/* Pie slice fill */}
              <path
                d={getPiePath(ratio)}
                fill={`url(#${darkMode ? 'hatch-fill-dark' : 'hatch-fill'})`}
                className="transition-all duration-200"
              />
              <path
                d={getPiePath(ratio)}
                fill="none"
                stroke={boxStrokeColor}
                strokeWidth="1.8"
              />
            </>
          )}

          {/* 100% All Done Filled Checkbox */}
          {isAllDone && (
            <path
              d="M 12 24 L 20 32 L 36 14"
              fill="none"
              stroke={checkmarkColor}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      {/* Subtle percentage & ratio label */}
      <span className="font-hand text-stone-600 dark:text-stone-300 text-lg sm:text-xl">
        {completed}/{total}
        {isAllDone && (
          <span className="text-stone-900 dark:text-stone-100 font-bold ml-1 text-sm">
            done!
          </span>
        )}
      </span>
    </div>
  );
};
