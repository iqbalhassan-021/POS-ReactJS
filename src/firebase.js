
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDYYYlfwRJEQFR0vWQC5kPHvDrhR12-V0c",
    authDomain: "buttpharmacy-c497b.firebaseapp.com",
    projectId: "buttpharmacy-c497b",
    storageBucket: "buttpharmacy-c497b.firebasestorage.app",
    messagingSenderId: "65246088217",
    appId: "1:65246088217:web:9dd638cbbeb8c684f3ae88"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);