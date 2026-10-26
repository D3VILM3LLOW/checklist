import React from 'react';

interface WallpaperNotesProps {
  notes: string;
  onChange: (newNotes: string) => void;
  darkMode?: boolean;
}

export const WallpaperNotes: React.FC<WallpaperNotesProps> = ({ notes, onChange }) => {
  return (
    <div className="flex flex-col h-full select-text">
      {/* "Notes" Header matching mockup */}
      <div className="pb-3 select-none">
        <h2 className="font-hand font-bold text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 tracking-tight">
          Notes
        </h2>
      </div>

      {/* Freeform notepad textarea */}
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        placeholder="write your quick notes, thoughts, and doodles here..."
        className="w-full flex-1 bg-transparent resize-none outline-none font-hand text-xl sm:text-2xl text-stone-800 dark:text-stone-100 leading-relaxed placeholder:text-stone-400 dark:placeholder:text-stone-600 placeholder:italic min-h-[300px]"
        spellCheck={false}
      />
    </div>
  );
};
