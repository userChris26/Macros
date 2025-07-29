const jwt = require('jsonwebtoken');
const createJWT = require('../scripts/createJWT.js');

module.exports = function (req, res)
{
    if (!req.headers || !req.headers['authorization'])
    {
        return res.status(401).json({ error: 'Token not present' });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const userData = jwt.decode(token, { complete: true });
    
    res.json(createJWT.createToken({
        _id: userData.payload.userId,
        firstName: userData.payload.firstName,
        lastName: userData.payload.lastName,
        email: userData.payload.email,
        profilePic: userData.payload.profilePic,
        bio: userData.payload.bio
    }));

}