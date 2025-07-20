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

// invalid token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODdiZDJjMjNlZDUxMjgxMjg1Njk3ZjIiLCJmaXJzdE5hbWUiOiJKb25hcyIsImxhc3ROYW1lIjoiRGFsbGFzIiwiZW1haWwiOiJ5YWRhZzI5NTk0QGtpc3NneS5jb20iLCJwcm9maWxlUGljIjpudWxsLCJiaW8iOm51bGwsImlhdCI6MTc1Mjk3NTY3MiwiZXhwIjoxNzUyOTc5MjcyfQ.3ac7OqJBMG8tQGthYC8OZrfi-OokNnqKLHg16eolddw