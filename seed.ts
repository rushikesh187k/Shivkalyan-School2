import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
if (!fs.existsSync(configPath)) {
  console.error("No config found");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(config.firebaseConfig);
const db = getFirestore(app);

const studentsToSeed = [
  { name: "kartik", class: "Class 10 A" },
  { name: "nikhil", class: "Class 10 A" },
  { name: "vighnesh", class: "Class 9 A" },
  { name: "shreyash", class: "Class 10 B" },
  { name: "rudra", class: "Class 8 A" }
];

const teachersToSeed = [
  { name: "sunita miss" },
  { name: "vaishali miss" },
  { name: "jadhav sir" }
];

async function seed() {
  for (const st of studentsToSeed) {
    const docRef = doc(collection(db, "users"));
    await setDoc(docRef, {
      fullName: st.name,
      role: "Student",
      assignedClass: st.class,
      mobileNumber: "9876543210",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log("Added student", st.name);
  }

  for (const t of teachersToSeed) {
    const docRef = doc(collection(db, "users"));
    await setDoc(docRef, {
      fullName: t.name,
      role: "Teacher",
      mobileNumber: "9876543210",
      qualifications: "B.Ed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log("Added teacher", t.name);
  }
}

seed().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(console.error);
