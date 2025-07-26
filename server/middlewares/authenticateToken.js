const jwt = require('jsonwebtoken');
const express = require('express');

module.exports = function (req, res, next)
{

    if (!req.headers || !req.headers['authorization'])
    {
        res.status(401).json({error: "Missing token from the 'Authorization' header"});
        return;
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(req);

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