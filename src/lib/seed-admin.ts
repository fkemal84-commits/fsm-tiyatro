import { adminDb } from "./firebase-admin";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables for local testing
dotenv.config({ path: ".env.local" });

async function seedAdmin() {
  try {
    const email = "fkemal84@gmail.com";
    const password = "Superadmin123!";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userDoc = await adminDb.collection("users").doc("superadmin_default").get();
    
    if (userDoc.exists) {
      console.log("Superadmin account already exists.");
    } else {
      await adminDb.collection("users").doc("superadmin_default").set({
        name: "Furkan Kemal",
        email: email,
        password: hashedPassword,
        role: "SUPERADMIN",
        createdAt: new Date().toISOString()
      });
      console.log("Superadmin account successfully created in production Firestore!");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error creating superadmin:", error);
    process.exit(1);
  }
}

seedAdmin();
