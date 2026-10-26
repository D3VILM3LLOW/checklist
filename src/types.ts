export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  estimatedMinutes?: number;
}

export interface FloatingTimerState {
  x: number;
  y: number;
  durationMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  isMinimized: boolean;
}

export interface WallpaperData {
  tasks: Task[];
  notes: string;
  soundEnabled: boolean;
  ambientSound: 'none' | 'pencil' | 'rain';
  timer: FloatingTimerState;
  darkMode: boolean;
  lastUpdated: string;
}
