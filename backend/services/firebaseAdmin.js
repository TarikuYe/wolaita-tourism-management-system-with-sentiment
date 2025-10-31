const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // PLACE YOUR DOWNLOADED SERVICE ACCOUNT KEY HERE

console.log('Backend files:', require('fs').readdirSync(__dirname + '/..'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
