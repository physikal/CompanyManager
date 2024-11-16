import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCBsMOKmOcmbz6csSYtvtt7jMdoV2jP9j4",
  authDomain: "timekeeper-ac3df.firebaseapp.com",
  projectId: "timekeeper-ac3df",
  storageBucket: "timekeeper-ac3df.firebasestorage.app",
  messagingSenderId: "691447697095",
  appId: "1:691447697095:web:3f196b8b1f8ba262a438e2"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);