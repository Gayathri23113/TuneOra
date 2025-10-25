import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
    Auth,
} from 'firebase/auth';
import {
    getFirestore,
    Firestore,
    doc,
    setDoc,
    serverTimestamp,
    getDoc,
} from 'firebase/firestore';

// Build firebaseConfig from common Vite env vars or fall back to a global if present
// This keeps the module safe to import even when the environment isn't set up.
let firebaseConfig: Record<string, any> = {};
try {
    // Prefer standard Vite env vars (VITE_FIREBASE_*), but allow a full JSON string in
    // import.meta.env.VITE_FIREBASE_CONFIG for convenience.
    if (typeof (import.meta as any).env?.VITE_FIREBASE_CONFIG === 'string') {
        firebaseConfig = JSON.parse((import.meta as any).env.VITE_FIREBASE_CONFIG || '{}');
    } else {
        const env = (import.meta as any).env || {};
        if (env.VITE_FIREBASE_API_KEY) {
            firebaseConfig = {
                apiKey: env.VITE_FIREBASE_API_KEY,
                authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: env.VITE_FIREBASE_APP_ID,
            };
        }
    }
} catch (err) {
    console.warn('Failed to parse VITE_FIREBASE_CONFIG, proceeding without Firebase config.', err);
}

const hasConfig = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (hasConfig) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        // Optional: enable debug logging only when configured and desired
        // console.debug('Firebase initialized');
    } catch (err) {
        console.error('Failed to initialize Firebase app:', err);
        app = null;
        auth = null;
        db = null;
    }
} else {
    console.warn('Firebase config not found. Firebase services will be disabled until configuration is provided.');
}

// Exports: make auth and db available but possibly null so callers must handle missing config.
export { auth, db };

export const ensureConfigured = () => {
    if (!auth || !db) {
        throw new Error(
            'Firebase is not configured. Set VITE_FIREBASE_CONFIG (JSON) or individual VITE_FIREBASE_* env vars.'
        );
    }
};

export type RegisterParams = {
    email: string;
    password: string;
    fullName?: string;
};

export const registerUser = async ({ email, password, fullName }: RegisterParams) => {
    ensureConfigured();
    // auth and db are non-null after ensureConfigured
    const a = auth as Auth;
    const firestore = db as Firestore;

    const cred = await createUserWithEmailAndPassword(a, email, password);

    if (fullName) {
        try {
            await updateProfile(cred.user as User, { displayName: fullName });
        } catch (err) {
            console.warn('Failed to update displayName', err);
        }
    }

    const uid = cred.user.uid;
    const userRef = doc(firestore, 'users', uid);
    await setDoc(userRef, {
        uid,
        email,
        fullName: fullName || null,
        createdAt: serverTimestamp(),
    });

    return cred.user;
};

export const loginUser = async (email: string, password: string) => {
    ensureConfigured();
    const a = auth as Auth;
    const firestore = db as Firestore;

    const cred = await signInWithEmailAndPassword(a, email, password);

    const uid = cred.user.uid;
    const userRef = doc(firestore, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        await signOut(a);
        throw new Error('No registration record found in Firestore for this user. Please register first.');
    }

    return { user: cred.user, userData: snap.data() };
};

export const getUserDoc = async (uid: string) => {
    ensureConfigured();
    const firestore = db as Firestore;
    const ref = doc(firestore, 'users', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
};
