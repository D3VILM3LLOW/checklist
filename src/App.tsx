/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Moon,
  Sun,
  Cloud,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Task, FloatingTimerState, WallpaperData } from './types';
import {
  loadWallpaperData,
  saveWallpaperData,
  subscribeToSync,
  INITIAL_WALLPAPER_DATA,
} from './utils/storage';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
  saveWallpaperToCloud,
  subscribeToCloudWallpaper,
} from './utils/firebase';
import { User } from 'firebase/auth';
import { playClickSound, playDingSound } from './utils/sound';
import { WallpaperClock } from './components/WallpaperClock';
import { CheckboxPieChart } from './components/CheckboxPieChart';
import { WallpaperChecklist } from './components/WallpaperChecklist';
import { WallpaperNotes } from './components/WallpaperNotes';
import { FloatingTimer } from './components/FloatingTimer';

export default function App() {
  const [data, setData] = useState<WallpaperData>(() => loadWallpaperData());
  const [syncPulse, setSyncPulse] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const isRemoteUpdateRef = useRef(false);

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore document when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToCloudWallpaper(currentUser.uid, (cloudData) => {
      isRemoteUpdateRef.current = true;
      setData((prev) => {
        const next = {
          ...prev,
          ...cloudData,
          tasks: cloudData.tasks || prev.tasks,
          notes: cloudData.notes !== undefined ? cloudData.notes : prev.notes,
          darkMode: cloudData.darkMode !== undefined ? cloudData.darkMode : prev.darkMode,
        };
        saveWallpaperData(next, true);
        return next;
      });
      setSyncPulse(true);
      setTimeout(() => {
        setSyncPulse(false);
        isRemoteUpdateRef.current = false;
      }, 700);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Sync across tabs & local storage
  useEffect(() => {
    const unsubscribe = subscribeToSync(() => {
      setData(loadWallpaperData());
      setSyncPulse(true);
      setTimeout(() => setSyncPulse(false), 800);
    });
    return () => unsubscribe();
  }, []);

  // Guarantee HTML root class syncs with darkMode state
  useEffect(() => {
    if (data.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.darkMode]);

  const updateData = useCallback(
    (updater: (prev: WallpaperData) => WallpaperData, broadcast: boolean = true) => {
      setData((prev) => {
        const next = updater(prev);
        saveWallpaperData(next, broadcast);

        // Also save to cloud if signed in
        if (currentUser && !isRemoteUpdateRef.current) {
          setIsCloudSyncing(true);
          saveWallpaperToCloud(currentUser.uid, next).finally(() => {
            setTimeout(() => setIsCloudSyncing(false), 500);
          });
        }

        return next;
      });
      setSyncPulse(true);
      setTimeout(() => setSyncPulse(false), 600);
    },
    [currentUser]
  );

  // Checklist handlers
  const handleAddTask = (title: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    updateData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  };

  const handleToggleTask = (id: string) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const handleDeleteTask = (id: string) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  const handleUpdateTaskTitle = (id: string, newTitle: string) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, title: newTitle } : t
      ),
    }));
  };

  // Notes handler
  const handleUpdateNotes = (notes: string) => {
    updateData(
      (prev) => ({
        ...prev,
        notes,
      }),
      true
    );
  };

  // Floating timer handlers
  const handleUpdateTimer = (updated: Partial<FloatingTimerState>) => {
    updateData((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        ...updated,
      },
    }));
  };

  // Ambient sound handler
  const handleUpdateAmbient = (ambientSound: 'none' | 'pencil' | 'rain') => {
    updateData((prev) => ({
      ...prev,
      ambientSound,
    }));
  };

  const toggleSound = () => {
    const next = !data.soundEnabled;
    updateData((prev) => ({
      ...prev,
      soundEnabled: next,
    }));
    playDingSound(next);
  };

  const toggleDarkMode = () => {
    playClickSound(data.soundEnabled);
    updateData((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  const toggleFullscreen = () => {
    playClickSound(data.soundEnabled);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleReset = () => {
    playClickSound(data.soundEnabled);
    updateData((prev) => ({
      ...INITIAL_WALLPAPER_DATA,
      darkMode: prev.darkMode,
    }));
  };

  const handleAuthAction = async () => {
    playClickSound(data.soundEnabled);
    if (currentUser) {
      await logoutUser();
    } else {
      await loginWithGoogle();
    }
  };

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden wallpaper-grid select-none ${
        data.darkMode ? 'dark text-stone-100' : 'text-stone-900'
      }`}
    >
      {/* Subtle wrinkled paper shading layer */}
      <div className="absolute inset-0 paper-wrinkles pointer-events-none z-0" />

      {/* Main Wallpaper Content Grid */}
      <div className="relative z-10 w-full h-full flex flex-row">
        {/* Left Side: Date/Clock, Cloud Sync, Dark Mode Toggle, Checklist Header, Add Item, Task List (~76% width) */}
        <div className="flex-1 h-full flex flex-col px-6 sm:px-10 md:px-14 py-6 sm:py-8 overflow-y-auto">
          {/* Top Bar: Date/Time Clock + Cloud Sync + Dark Mode Toggle */}
          <div className="flex items-center justify-between pb-4 sm:pb-6 gap-3 flex-wrap">
            <WallpaperClock syncPulse={syncPulse} darkMode={data.darkMode} />

            <div className="flex items-center gap-2">
              {/* Cloud Device Sync Button */}
              <button
                type="button"
                onClick={handleAuthAction}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-stone-400 dark:border-stone-600 bg-white/70 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 font-hand text-base sm:text-lg transition-colors cursor-pointer text-stone-800 dark:text-stone-200"
                title={
                  currentUser
                    ? `Logged in as ${currentUser.email}. Click to sign out.`
                    : 'Sign in with Google to sync across all devices'
                }
              >
                <Cloud
                  className={`w-4 h-4 ${
                    isCloudSyncing
                      ? 'animate-pulse text-amber-500'
                      : currentUser
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-stone-500'
                  }`}
                />
                <span>
                  {currentUser
                    ? currentUser.displayName?.split(' ')[0] || 'Synced'
                    : 'sync devices'}
                </span>
                {currentUser && <LogOut className="w-3 h-3 text-stone-400 ml-0.5" />}
              </button>

              {/* Inverted Dark Mode Toggle button */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-stone-400 dark:border-stone-600 bg-white/70 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 font-hand text-base sm:text-lg transition-colors cursor-pointer text-stone-800 dark:text-stone-200"
                title={data.darkMode ? 'Switch to light mode' : 'Switch to inverted dark mode'}
              >
                {data.darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-stone-200" />
                    <span>light mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-stone-700" />
                    <span>dark mode</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* "checklist" Header matching user mockup + Checkbox Pie Chart */}
          <div className="flex items-center gap-4 sm:gap-6 pb-4 sm:pb-6">
            <h1 className="font-hand font-bold text-3xl sm:text-4xl md:text-5xl text-stone-900 dark:text-stone-100 tracking-tight leading-none">
              checklist
            </h1>

            {/* Checkbox Pie Chart (fills up as tasks are checked, 100% fills checkbox!) */}
            <div className="flex items-center pt-1">
              <CheckboxPieChart
                tasks={data.tasks}
                soundEnabled={data.soundEnabled}
                darkMode={data.darkMode}
              />
            </div>
          </div>

          {/* Interactive Checklist: Checked items hide with a dropdown to show completed */}
          <div className="pt-1">
            <WallpaperChecklist
              tasks={data.tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTaskTitle={handleUpdateTaskTitle}
              soundEnabled={data.soundEnabled}
              darkMode={data.darkMode}
            />
          </div>
        </div>

        {/* Hand-drawn bold vertical divider line matching user mockup (Inverted in dark mode) */}
        <div className="h-full py-4 shrink-0 flex items-stretch">
          <div className="hand-drawn-divider h-full" />
        </div>

        {/* Right Side: "Notes" Column matching user mockup (~24% width) */}
        <div className="w-64 sm:w-80 md:w-96 lg:w-[26rem] h-full flex flex-col px-5 sm:px-8 py-6 sm:py-8 overflow-y-auto">
          <WallpaperNotes
            notes={data.notes}
            onChange={handleUpdateNotes}
            darkMode={data.darkMode}
          />
        </div>
      </div>

      {/* Floating Draggable Timer Widget */}
      <FloatingTimer
        timerState={data.timer}
        onUpdateTimer={handleUpdateTimer}
        soundEnabled={data.soundEnabled}
        ambientSound={data.ambientSound}
        onUpdateAmbient={handleUpdateAmbient}
        darkMode={data.darkMode}
      />

      {/* Discreet bottom-right toolbar for minimalist desktop wallpaper controls */}
      <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity bg-white/70 dark:bg-stone-800/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-stone-300 dark:border-stone-700 text-xs font-hand shadow-xs">
        <button
          type="button"
          onClick={toggleSound}
          className="p-1 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 rounded text-stone-700 dark:text-stone-300"
          title={data.soundEnabled ? 'Mute soft sounds' : 'Enable soft sounds'}
        >
          {data.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 rounded text-stone-700 dark:text-stone-300"
          title="Toggle fullscreen wallpaper"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="p-1 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 rounded text-stone-700 dark:text-stone-300"
          title="Reset to mockup defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
