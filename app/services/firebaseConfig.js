// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArCs5z5h5kHZ6KF1QNkwMYaDRBxxkEj8k",
  authDomain: "renteasy-a2dea.firebaseapp.com",
  projectId: "renteasy-a2dea",
  storageBucket: "renteasy-a2dea.appspot.com",
  messagingSenderId: "548704032594",
  appId: "1:548704032594:web:56a456c69402fe77a94c8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
export default {};