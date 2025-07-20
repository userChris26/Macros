const jwt = require('jsonwebtoken');
const createJWT = require('../scripts/createJWT.js');

module.exports = function (req, res)
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
    {
        return res.status(401).json({ error: 'Token not present' });
    }

    const userData = jwt.decode(token, { complete: true });
    createJWT.createToken({
        _id: userData.payload.userId,
        firstName: userData.payload.firstName,
        lastName: userData.payload.lastName,
        email: userData.payload.email,
        profilePic: userData.payload.profilePic,
        bio: userData.payload.bio
    });

}