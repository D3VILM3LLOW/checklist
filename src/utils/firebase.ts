import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { WallpaperData } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-in Error', err);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function saveWallpaperToCloud(userId: string, data: WallpaperData): Promise<void> {
  const path = `wallpapers/${userId}`;
  try {
    const userDocRef = doc(db, 'wallpapers', userId);
    await setDoc(
      userDocRef,
      {
        userId,
        notes: data.notes || '',
        tasks: data.tasks || [],
        darkMode: Boolean(data.darkMode),
        soundEnabled: Boolean(data.soundEnabled),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToCloudWallpaper(
  userId: string,
  onData: (cloudData: Partial<WallpaperData>) => void
) {
  const path = `wallpapers/${userId}`;
  const userDocRef = doc(db, 'wallpapers', userId);

  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        onData({
          notes: d.notes,
          tasks: d.tasks,
          darkMode: d.darkMode,
          soundEnabled: d.soundEnabled,
        });
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}
