/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
admin.initializeApp();

// פונקציית API שמחזירה את כל המשתמשים
exports.listAllUsers = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const listUsersResult = await admin.auth().listUsers(1000);
      res.json(
        listUsersResult.users.map((u) => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          creationTime: u.metadata.creationTime,
          lastSignInTime: u.metadata.lastSignInTime,
        }))
      );
    } catch (error) {
      res.status(500).send(error.toString());
    }
  });
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
