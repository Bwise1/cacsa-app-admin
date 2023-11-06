import * as admin from "firebase-admin";
const serviceAccount = require("../../cacsa-app-firebase-adminsdk-whx1z-128d09876d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
});

export async function getAllUsers(): Promise<admin.auth.UserRecord[]> {
  try {
    const listUsersResult = await admin.auth().listUsers();

    const users = listUsersResult.users;

    console.log("Total users:", users.length);

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error; // You can choose to handle the error as needed
  }
}
