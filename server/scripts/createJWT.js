const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.createToken = function (user) {
    return _createToken(user);
}

_createToken = function (user) {
    try {
        // console.log('JWT_SECRET in createJWT.js:', process.env.JWT_SECRET);
        const payload = {
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profilePic: user.profilePic || null,
            bio: user.bio || null
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log(accessToken);
        return { accessToken };
    }
    catch(e) {
        return { error: e.message };
    }
}

// exports.isExpired = function(token) {
//     var isError = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,
//         (err, verifiedJwt) => {
//             if(err) {
//                 return true;
//             }
//             else {
//                 return false;
//             }
//         });

//     return isError;
// }

// exports.refresh = function(token) {
//     var userData = jwt.decode(token, { complete: true });
//     return _createToken({
//         _id: userData.payload.userId,
//         firstName: userData.payload.firstName,
//         lastName: userData.payload.lastName,
//         email: userData.payload.email,
//         profilePic: userData.payload.profilePic,
//         bio: userData.payload.bio
//     });
// }