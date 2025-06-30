require('express');
require('mongodb');

exports.setApp = function ( app, client )
{

    app.post('/api/register', async (req, res, next) =>
    {
        // incoming: userLogin, userPassword, userEmail, userFirstName, userLastName
        // outgoing: error

        const { userFirstName, userLastName, userEmail, userLogin, userPassword } = req.body;
        var error = '';

        const db = client.db('COP4331Cards');
        const results = await
            db.collection('users').find({$or: [{login:userLogin}, {email:userEmail}]}).toArray();

        try
        {
            if ( results.length > 0 )
            {
                error = "Account Already Exists";
            }
            else
            {
                const newUser = {email: userEmail, login: userLogin, password: userPassword, firstName:userFirstName, lastName:userLastName};
                const result = db.collection('users').insertOne(newUser);
            }
        }
        catch(e)
        {
            error = e.toString();
        }

        var ret = { error: error };
        res.status(200).json(ret);
    });

    app.post('/api/login', async (req, res, next) =>
    {
        // incoming: userLogin, userPassword
        // outgoing: id, firstName, lastName, error

        var error = '';

        const { userLogin, userPassword } = req.body;

        const db = client.db('COP4331Cards');

        const results = await
        db.collection('users').find({login:userLogin,password:userPassword}).toArray();

        var userId = -1;
        var userFirstName = '';
        var userLastName = '';

        var ret;

        if( results.length > 0 )
        {
            userId = results[0]._id;
            userFirstName = results[0].firstName;
            userLastName = results[0].lastName;

            try
            {
                const token = require("./createJWT.js");
                ret = token.createToken( userFirstName, userLastName, userId );
            }
            catch(e)
            {
                ret = {error:e.message};
            }
        }
        else
        {
            ret = {error:"Login/Password incorrect"};
        }
        
        res.status(200).json(ret);
    });

    app.post('/api/updateaccount', async (req, res, next) =>
    {
        // incoming: userId, userFirstName, userLastName, userEmail, userLogin, userJwt
        // outgoing: error

        var token = require('.createJWT.js');
        
        const { userId, userFirstName, userLastName, userEmail, userLogin, userJwt } = req.body;
        
        try
        {
            if(token.isExpired(userJwt))
            {
                var ret = {error:'The JWT is no longer valid', userJwt: ''};
                res.status(200).json(ret);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }
        
        var error = '';

        try
        {
            const db = client.db('COP4331Cards');
            const result = await db.collection('users').updateOne(
                {_id:ObjectId.createFromHexString(userId)},
                {
                    $set: {email: userEmail, login: userLogin,
                        firstName: userFirstName, lastName: userLastName}
                }
            );
            
        }
        catch(e)
        {
            error = e.toString();
        }
        
        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(userJwt);
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { error: error, userJwt: refreshedToken };

        res.status(200).json(ret);
    });

    app.post('/api/addcard', async (req, res, next) =>
    {
        // incoming: userId, card, userJwt
        // outgoing: error
        
        var token = require('./createJWT.js');

        const { userId, card, userJwt } = req.body;

        try
        {
            if(token.isExpired(userJwt))
            {
                var ret = {error:'The JWT is no longer valid', userJwt: ''};
                res.status(200).json(ret);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        const newCard = {user:userId,name:card};
        var error = '';

        try
        {
            const db = client.db('COP4331Cards');
            const result = db.collection('cards').insertOne(newCard);
        }
        catch(e)
        {
            error = e.toString();
        }
        
        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(userJwt);
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { error: error, userJwt: refreshedToken };

        res.status(200).json(ret);
    });

    app.post('/api/searchcards', async (req, res, next) =>
    {
        // incoming: userId, search, userJwt
        // outgoing: results[], error
        
        var error = '';

        var token = require('./createJWT.js');

        const { userId, search, userJwt } = req.body;
        try
        {
            if(token.isExpired(userJwt))
            {
                var ret = {error:'The JWT is no longer valid', userJwt:''};
                res.status(200).json(ret);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        var _search = search.trim();

        const db = client.db('COP4331Cards');
        const results = await db.collection('cards').find({"name":{$regex:_search+'.*', $options:'i'}}).toArray();

        var _ret = [];
        for( var i = 0; i < results.length; i++ )
        {
            _ret.push( results[i].name );
        }
        
        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(userJwt);
        }
        catch(error)
        {
            console.log(error.message);
        }
        
        var ret = { results: _ret, error: error, userJwt: refreshedToken };

        res.status(200).json(ret);
    });
}