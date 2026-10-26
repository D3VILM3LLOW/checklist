import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Task } from '../types';
import { playDingSound, playClickSound, playScribbleSound } from '../utils/sound';

interface WallpaperChecklistProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTaskTitle: (id: string, newTitle: string) => void;
  soundEnabled: boolean;
  darkMode?: boolean;
}

export const WallpaperChecklist: React.FC<WallpaperChecklistProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTaskTitle,
  soundEnabled,
  darkMode = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setIsAdding(false);
      return;
    }
    playScribbleSound(soundEnabled);
    onAddTask(newTitle.trim());
    setNewTitle('');
  };

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    playClickSound(soundEnabled);
    onToggleTask(id);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) {
      onUpdateTaskTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="flex flex-col gap-5 sm:gap-7 select-none">
      {/* "+ add new item" button / form */}
      <div>
        {isAdding ? (
          <form onSubmit={handleCreate} className="flex items-center gap-3">
            <span className="font-hand font-bold text-2xl text-stone-900 dark:text-stone-100">+</span>
            <input
              ref={addInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={() => {
                if (newTitle.trim()) {
                  playScribbleSound(soundEnabled);
                  onAddTask(newTitle.trim());
                  setNewTitle('');
                }
                setIsAdding(false);
              }}
              placeholder="type task and press enter..."
              className="font-hand text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 bg-transparent border-b-2 border-stone-800 dark:border-stone-300 outline-none pb-0.5 w-72 sm:w-96"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              playClickSound(soundEnabled);
              setIsAdding(true);
            }}
            className="flex items-center gap-2 font-hand text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 hover:text-stone-700 dark:hover:text-stone-300 transition-colors group cursor-pointer"
          >
            <span className="font-bold text-3xl leading-none group-hover:scale-110 transition-transform">
              +
            </span>
            <span>add new item</span>
          </button>
        )}
      </div>

      {/* Active Uncompleted Tasks */}
      <div className="flex flex-col gap-4 sm:gap-5">
        {activeTasks.length > 0 ? (
          activeTasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-3 sm:gap-4 transition-all"
            >
              {/* Square hand-drawn checkbox */}
              <button
                type="button"
                onClick={() => handleToggle(task.id, false)}
                className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 border-2.5 sm:border-3 border-stone-900 dark:border-stone-200 rounded-[3px] bg-transparent flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Check off task"
              />

              {/* Task Title */}
              {editingId === task.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveEdit(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(task.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                  className="font-hand text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 bg-transparent border-b-2 border-stone-700 dark:border-stone-300 outline-none flex-1 max-w-md"
                />
              ) : (
                <span
                  onClick={() => handleToggle(task.id, false)}
                  onDoubleClick={() => startEdit(task)}
                  className="font-hand text-2xl sm:text-3xl cursor-pointer leading-tight transition-all select-none text-stone-900 dark:text-stone-100 hover:text-stone-700 dark:hover:text-stone-300"
                  title="Click to check off, double-click to rename"
                >
                  {task.title}
                </span>
              )}

              {/* Action buttons on hover */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound(soundEnabled);
                    onDeleteTask(task.id);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="font-hand text-xl text-stone-500 dark:text-stone-400 italic pt-1">
            {completedTasks.length > 0
              ? 'All active items are checked off! 🎉'
              : 'No items yet. Click "+ add new item" above!'}
          </div>
        )}
      </div>

      {/* Completed Items Dropdown */}
      {completedTasks.length > 0 && (
        <div className="pt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              playClickSound(soundEnabled);
              setShowCompleted(!showCompleted);
            }}
            className="self-start flex items-center gap-2 font-hand text-lg sm:text-xl text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer py-1"
          >
            {showCompleted ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>
              {showCompleted ? 'hide completed items' : 'show completed items'}{' '}
              ({completedTasks.length})
            </span>
          </button>

          {/* Collapsible Completed Items List */}
          {showCompleted && (
            <div className="flex flex-col gap-3 pl-2 sm:pl-3 border-l-2 border-dashed border-stone-300 dark:border-stone-700">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 sm:gap-4 transition-all opacity-75 hover:opacity-100"
                >
                  {/* Checked Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id, true)}
                    className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 border-2.5 border-stone-900 dark:border-stone-300 rounded-[3px] bg-stone-900 dark:bg-stone-200 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    title="Uncheck item"
                  >
                    <Check className="w-4 h-4 stroke-[3.5] text-white dark:text-stone-900" />
                  </button>

                  {/* Strikethrough Task Title */}
                  <span
                    onClick={() => handleToggle(task.id, true)}
                    className="font-hand text-xl sm:text-2xl cursor-pointer leading-tight doodle-strike text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 select-none"
                    title="Click to uncheck"
                  >
                    {task.title}
                  </span>

                  {/* Delete button */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound(soundEnabled);
                        onDeleteTask(task.id);
                      }}
                      className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
