"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminClaim = exports.deleteUser = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
/**
 * Cloud Function to delete a user from both Firebase Auth and Firestore
 * This function can only be called by authenticated admin users
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
    var _a;
    // Check if the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // Get the user ID to delete from the request data
    const { uid } = data;
    if (!uid || typeof uid !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a valid user ID.");
    }
    try {
        // Get the current user's custom claims to check if they're an admin
        const callerRecord = await auth.getUser(context.auth.uid);
        const customClaims = callerRecord.customClaims || {};
        // Check if the caller is an admin
        if (!customClaims.admin && !((_a = customClaims.role) === null || _a === void 0 ? void 0 : _a.includes("admin"))) {
            // Alternative: Check if user exists in admin collection
            const adminDoc = await db.collection("users").doc(context.auth.uid).get();
            const userData = adminDoc.data();
            if (!userData || userData.role !== "admin") {
                throw new functions.https.HttpsError("permission-denied", "Only admin users can delete other users.");
            }
        }
        // Prevent self-deletion
        if (uid === context.auth.uid) {
            throw new functions.https.HttpsError("invalid-argument", "Users cannot delete their own account through this function.");
        }
        const results = {
            authDeleted: false,
            firestoreDeleted: false,
            errors: [],
        };
        // Delete from Firebase Authentication
        try {
            await auth.deleteUser(uid);
            results.authDeleted = true;
            functions.logger.info(`Successfully deleted user from Firebase Auth: ${uid}`);
        }
        catch (authError) {
            const errorMessage = `Failed to delete user from Firebase Auth: ${authError.message}`;
            results.errors.push(errorMessage);
            functions.logger.error(errorMessage, authError);
        }
        // Delete from Firestore
        try {
            await db.collection("users").doc(uid).delete();
            results.firestoreDeleted = true;
            functions.logger.info(`Successfully deleted user from Firestore: ${uid}`);
        }
        catch (firestoreError) {
            const errorMessage = `Failed to delete user from Firestore: ${firestoreError.message}`;
            results.errors.push(errorMessage);
            functions.logger.error(errorMessage, firestoreError);
        }
        // Optional: Delete user's associated data (teams, bids, etc.)
        try {
            // Delete user's team memberships
            const teamsQuery = await db.collection("teams")
                .where("members", "array-contains", uid)
                .get();
            const batch = db.batch();
            teamsQuery.docs.forEach((doc) => {
                const teamData = doc.data();
                const updatedMembers = teamData.members.filter((memberId) => memberId !== uid);
                batch.update(doc.ref, { members: updatedMembers });
            });
            // Delete user's bids
            const bidsQuery = await db.collection("bids")
                .where("userId", "==", uid)
                .get();
            bidsQuery.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            functions.logger.info(`Successfully cleaned up associated data for user: ${uid}`);
        }
        catch (cleanupError) {
            const errorMessage = `Failed to clean up associated data: ${cleanupError.message}`;
            results.errors.push(errorMessage);
            functions.logger.error(errorMessage, cleanupError);
        }
        // Log the deletion activity
        try {
            await db.collection("admin_logs").add({
                action: "user_deletion",
                targetUserId: uid,
                adminUserId: context.auth.uid,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                results: results,
            });
        }
        catch (logError) {
            functions.logger.error(`Failed to log deletion activity: ${logError.message}`, logError);
        }
        // Return results
        if (results.authDeleted || results.firestoreDeleted) {
            return {
                success: true,
                message: "User deletion completed",
                details: results,
            };
        }
        else {
            throw new functions.https.HttpsError("internal", "Failed to delete user from both Auth and Firestore", results);
        }
    }
    catch (error) {
        functions.logger.error(`Error in deleteUser function: ${error.message}`, error);
        // Re-throw HttpsError as-is
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Wrap other errors
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while deleting the user", error.message);
    }
});
/**
 * Cloud Function to set admin custom claims
 * This is a helper function for setting up admin users
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
    // This function should only be callable by existing admins or during initial setup
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { uid, isAdmin } = data;
    if (!uid || typeof uid !== "string" || typeof isAdmin !== "boolean") {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with valid uid and isAdmin parameters.");
    }
    try {
        await auth.setCustomUserClaims(uid, { admin: isAdmin });
        functions.logger.info(`Successfully set admin claim for user ${uid}: ${isAdmin}`);
        return {
            success: true,
            message: `Admin claim ${isAdmin ? "granted" : "revoked"} for user ${uid}`,
        };
    }
    catch (error) {
        functions.logger.error(`Error setting admin claim: ${error.message}`, error);
        throw new functions.https.HttpsError("internal", "Failed to set admin claim", error.message);
    }
});
//# sourceMappingURL=index.js.map