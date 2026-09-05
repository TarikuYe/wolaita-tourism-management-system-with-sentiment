const express = require('express');
const router = express.Router();
const admin = require('../services/firebaseAdmin');
const { sendWelcomeEmail } = require('../services/mailer');
// TODO: Protect this route with admin authentication in production!

router.post('/create-user', async (req, res) => {
  const { email, name, phone, role, companyName, address, description } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      emailVerified: false,
    });

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
      phone,
      companyName: companyName || '',
      address: address || '',
      description: description || '',
      verified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      businessVerified: role === 'agency',
    });

    const resetLink = await admin.auth().generatePasswordResetLink(email);

    await sendWelcomeEmail({
      to: email,
      name,
      resetLink,
      role
    });

    res.json({ message: 'User created and welcome email sent!' });
  } catch (e) {
    console.error('create-user error:', e);
    res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
});

router.delete('/delete-user/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    let authDeleted = false;
    let authError = null;
    let userExistsInAuth = false;

    // Step 1: Check if user exists in Firebase Auth
    try {
      await admin.auth().getUser(uid);
      userExistsInAuth = true;
      console.log(`User ${uid} exists in Firebase Auth`);
    } catch (err) {
      if (err && err.code === 'auth/user-not-found') {
        userExistsInAuth = false;
        console.log(`User ${uid} not found in Firebase Auth (may have been deleted already)`);
      } else {
        // Error checking user existence
        authError = { step: 'getUser', code: err.code, message: err.message };
        console.error('Error checking user in Auth:', authError);
        return res.status(500).json({ 
          error: 'Failed to check user in Firebase Auth', 
          authError,
          message: 'Cannot proceed with deletion without verifying Auth status'
        });
      }
    }

    // Step 2: Delete from Firebase Auth if user exists
    if (userExistsInAuth) {
      try {
        await admin.auth().deleteUser(uid);
        authDeleted = true;
        console.log(`User ${uid} deleted from Firebase Auth`);
      } catch (err) {
        // Log error but continue with Firestore deletion
        // This ensures at least Firestore is cleaned up
        authError = { step: 'deleteUser', code: err.code, message: err.message };
        console.error('WARNING: Failed to delete user from Firebase Auth:', authError);
        // Continue to Firestore deletion - we'll return a warning
      }
    }

    // Step 3: Delete from Firestore (only if Auth deletion succeeded or user didn't exist in Auth)
    let firestoreDeleted = false;
    try {
      const firestoreDoc = await admin.firestore().collection('users').doc(uid).get();
      if (firestoreDoc.exists) {
        await admin.firestore().collection('users').doc(uid).delete();
        firestoreDeleted = true;
        console.log(`User ${uid} deleted from Firestore`);
      } else {
        console.log(`User ${uid} not found in Firestore (may have been deleted already)`);
        firestoreDeleted = false;
      }
    } catch (fsErr) {
      console.error('Firestore delete error:', fsErr);
      // If Auth was deleted but Firestore fails, still return partial success
      // but warn about the inconsistency
      return res.status(500).json({ 
        error: 'Failed to delete from Firestore', 
        code: fsErr.code || 'firestore/delete-error',
        message: fsErr.message,
        authDeleted,
        firestoreDeleted: false,
        warning: authDeleted ? 'User deleted from Auth but Firestore deletion failed. Manual cleanup may be required.' : null
      });
    }

    // Step 4: Return success response
    const authSuccess = authDeleted || !userExistsInAuth;
    const allSuccess = authSuccess && firestoreDeleted;
    
    if (allSuccess) {
      return res.json({ 
        message: 'User deleted successfully from both Firebase Authentication and Firestore', 
        authDeleted: authSuccess,
        firestoreDeleted,
        authError: null
      });
    } else if (firestoreDeleted && !authSuccess && userExistsInAuth) {
      // Firestore deleted but Auth deletion failed
      return res.status(207).json({ 
        message: 'User deleted from Firestore, but Firebase Auth deletion failed', 
        authDeleted: false,
        firestoreDeleted: true,
        authError,
        warning: 'User still exists in Firebase Authentication. Manual deletion may be required.'
      });
    } else if (!firestoreDeleted) {
      // Firestore deletion failed
      return res.status(500).json({ 
        error: 'Failed to delete user from Firestore',
        authDeleted: authSuccess,
        firestoreDeleted: false,
        authError,
        message: 'Firestore deletion failed. User may still exist in database.'
      });
    } else {
      // Should not reach here, but handle anyway
      return res.status(500).json({ 
        error: 'Unknown error during user deletion',
        authDeleted: authSuccess,
        firestoreDeleted,
        authError
      });
    }
  } catch (e) {
    console.error('delete-user error:', e);
    return res.status(500).json({ 
      error: e.message || 'Internal Server Error',
      code: e.code || 'unknown-error'
    });
  }
});

module.exports = router;
