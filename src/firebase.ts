import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    Auth, 
} from 'firebase/auth';
import { 
    getFirestore, 
    Firestore,
    setLogLevel
} from 'firebase/firestore';

// --- MANDATORY GLOBAL VARIABLES (Provided by the environment) ---
// We must declare them to be accessible in TypeScript
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// 1. Parse Config and Initialize App
// Safely parse the Firebase config provided by the environment
const firebaseConfig = JSON.parse(
    typeof __firebase_config !== 'undefined' ? __firebase_config : '{}'
);

const app = initializeApp(firebaseConfig);

// 2. Initialize Services
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

// Set Debug Logging (Useful for seeing Firebase traffic in the console)
setLogLevel('debug'); 

/**
 * Initializes Firebase Authentication. 
 * Attempts to sign in with the secure custom token first, 
 * then falls back to anonymous sign-in if the token is missing.
 */
export const initializeAuth = async (): Promise<void> => {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Firebase Auth: Signed in with custom token.");
        } else {
            await signInAnonymously(auth);
            console.log("Firebase Auth: Signed in anonymously.");
        }
    } catch (error) {
        console.error("Firebase Auth initialization failed:", error);
    }
};

// Exporting utility functions is often helpful, though not strictly required for this specific task
export const getCurrentUserId = (): string => {
    return auth.currentUser?.uid || 'temp-anon-user-' + crypto.randomUUID();
};
