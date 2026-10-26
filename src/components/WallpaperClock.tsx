import React, { useState, useEffect } from 'react';

interface WallpaperClockProps {
  syncPulse?: boolean;
  darkMode?: boolean;
}

export const WallpaperClock: React.FC<WallpaperClockProps> = ({ syncPulse }) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-2 select-none font-hand text-stone-700 dark:text-stone-300 tracking-wide text-lg sm:text-xl">
      <span className="font-bold text-stone-900 dark:text-stone-100 tabular-nums">
        {timeString}
      </span>
      <span className="text-stone-400 dark:text-stone-500 font-sans text-xs">/</span>
      <span className="text-stone-600 dark:text-stone-300">
        {dateString}
      </span>
      <span
        title="Syncs across devices & tabs"
        className={`ml-1 inline-block w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          syncPulse ? 'bg-emerald-500 scale-125' : 'bg-stone-400 dark:bg-stone-500 opacity-60'
        }`}
      />
    </div>
  );
};
