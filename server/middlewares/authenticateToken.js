const jwt = require('jsonwebtoken');

module.exports = function (req, res, next)
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
    {
        return res.status(401).json({ error: 'Token not present' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) =>
    {
        console.log(err);
        if (err) 
        {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = decoded;
        
        next();
    })
}