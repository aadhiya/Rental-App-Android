// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "renteasy-a2dea.firebaseapp.com",
  projectId: "renteasy-a2dea",
  storageBucket: "renteasy-a2dea.appspot.com",
  messagingSenderId: "548704032594",
  appId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
export default {};
