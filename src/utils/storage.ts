import { Task, FloatingTimerState, WallpaperData } from '../types';

const STORAGE_KEY = 'doodle_wallpaper_data_v4';
const SYNC_CHANNEL = 'doodle_wallpaper_channel';

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(SYNC_CHANNEL);
  } catch (e) {
    console.debug('BroadcastChannel error', e);
  }
}

export const INITIAL_WALLPAPER_DATA: WallpaperData = {
  tasks: [
    { id: '1', title: 'thing 1', completed: false, createdAt: new Date().toISOString() },
    { id: '2', title: 'thing 2', completed: false, createdAt: new Date().toISOString() },
    { id: '3', title: 'thing 3', completed: false, createdAt: new Date().toISOString() },
    { id: '4', title: 'thing 4', completed: false, createdAt: new Date().toISOString() },
  ],
  notes: 'Meeting recap:\n- Draft outline by 3 PM\n- Follow up on designs\n\nIdeas & sketches:\n💡 Remember to hydrate & take short breaks!',
  soundEnabled: true,
  ambientSound: 'none',
  darkMode: false,
  timer: {
    x: 480,
    y: 90,
    durationMinutes: 25,
    remainingSeconds: 25 * 60,
    isRunning: false,
    isMinimized: false,
  },
  lastUpdated: new Date().toISOString(),
};

export function loadWallpaperData(): WallpaperData {
  if (typeof window === 'undefined') return INITIAL_WALLPAPER_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveWallpaperData(INITIAL_WALLPAPER_DATA, false);
      return INITIAL_WALLPAPER_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_WALLPAPER_DATA,
      ...parsed,
      timer: {
        ...INITIAL_WALLPAPER_DATA.timer,
        ...(parsed.timer || {}),
        isRunning: false, // Don't auto-run on reload
      },
    };
  } catch (err) {
    console.error('Error loading wallpaper data', err);
    return INITIAL_WALLPAPER_DATA;
  }
}

export function saveWallpaperData(data: WallpaperData, broadcast: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (broadcast && channel) {
      channel.postMessage({ type: 'DATA_SYNC', timestamp: Date.now() });
    }
  } catch (err) {
    console.error('Error saving wallpaper data', err);
  }
}

export function subscribeToSync(onSync: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = () => onSync();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onSync();
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}
