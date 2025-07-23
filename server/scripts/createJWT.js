const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.createToken = function (user)
{
    return _createToken(user);
}

_createToken = function (user)
{
    try
    {
        if (!user._id || !user.firstName || !user.lastName || !user.email)
        {
            throw new Error("Missing required fields: _id, firstName, lastName, email");
        }

        // console.log('JWT_SECRET in createJWT.js:', process.env.JWT_SECRET);
        const payload = {
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profilePic: user.profilePic || null,
            bio: user.bio || null
        };

        const accessToken = jwt.sign(payload, 
                                    process.env.JWT_SECRET, 
                                    { expiresIn: '1h' });

        console.log(accessToken);
        return { accessToken };
    }
    catch(e)
    {
        return { error: e.message };
    }
}