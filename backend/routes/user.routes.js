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

    // Check if user exists in Auth first
    let userExistsInAuth = false;
    try {
      await admin.auth().getUser(uid);
      userExistsInAuth = true;
    } catch (err) {
      if (err && err.code === 'auth/user-not-found') {
        userExistsInAuth = false;
      } else {
        authError = { step: 'getUser', code: err.code, message: err.message };
      }
    }

    if (userExistsInAuth) {
      try {
        await admin.auth().deleteUser(uid);
        authDeleted = true;
      } catch (err) {
        // If we fail to delete from Auth, capture and continue to Firestore delete
        authError = { step: 'deleteUser', code: err.code, message: err.message };
      }
    }

    // Delete Firestore user document (ignore if missing)
    let firestoreDeleted = false;
    try {
      await admin.firestore().collection('users').doc(uid).delete();
      firestoreDeleted = true;
    } catch (fsErr) {
      console.error('Firestore delete error:', fsErr);
      return res.status(500).json({ error: fsErr.message || 'Failed to delete from Firestore', code: fsErr.code || 'firestore/delete-error' });
    }

    // If Firestore delete succeeded, consider the operation successful even if Auth user was missing
    return res.json({ message: 'User deletion processed.', authDeleted, firestoreDeleted, authError });
  } catch (e) {
    console.error('delete-user error:', e);
    return res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
});

module.exports = router;
