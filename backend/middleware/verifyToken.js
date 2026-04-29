const admin = require('firebase-admin');

const verifyToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    // checkRevoked: true → يتحقق أيضاً إذا التوكن تم إبطاله (Revoke)
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);

    // إذا التوكن تم إبطاله
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Unauthorized: Token has been revoked. Please login again.' });
    }

    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = verifyToken;
