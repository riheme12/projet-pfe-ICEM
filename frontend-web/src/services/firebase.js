import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyBgtxAYFi2nPvLfyqXemw5R9kjflvnjWyg',
    authDomain: 'testflutter-de1f5.firebaseapp.com',
    projectId: 'testflutter-de1f5',
    storageBucket: 'testflutter-de1f5.firebasestorage.app',
    messagingSenderId: '82085295710',
    appId: '1:82085295710:web:38ad6ffd7fa7b7545666cf',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail };
export default app;
