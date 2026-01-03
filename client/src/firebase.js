import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAa9XBCgoVw5G9aBPrlwtM5x3QlnIuvw8U",
    authDomain: "synccv.firebaseapp.com",
    projectId: "synccv",
    storageBucket: "synccv.firebasestorage.app",
    messagingSenderId: "391543568724",
    appId: "1:391543568724:web:121d6f81c78e7bf03cb0c1",
    measurementId: "G-ZHBZ0GLM8Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Auth services
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Initialize Firestore
import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);
