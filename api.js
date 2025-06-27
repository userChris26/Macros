require('express');
require('mongodb');

exports.setApp = function ( app, client )
{
    app.post('/api/register', async (req, res, next) =>
    {
        // incoming: userLogin, userPassword, userFirstName, userLastName
        // outgoing: error

        const { userFirstName, userLastName, userLogin, userPassword } = req.body;
        var error = '';

        const db = client.db('COP4331Cards');
        const results = await
            db.collection('users').find({login:userLogin}).toArray();

        try
        {
            if ( results.length > 0 )
            {
                error = "Username Already Exists";
            }
            else
            {
                const newUser = {login: userLogin, password: userPassword, firstName:userFirstName, lastName:userLastName};
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

        if( results.length > 0 )
        {
            userId = results[0]._id;
            userFirstName = results[0].firstName;
            userLastName = results[0].lastName;
        }
        
        var ret = { id:userId, firstName:userFirstName, lastName:userLastName, error:''};
        res.status(200).json(ret);
    });

    app.post('/api/updateAccount', async (req, res, next) =>
    {
        // incoming: userId, userFirstName, userLastName
        // outgoing: error
        
        const { userId, userFirstName, userLastName, userLogin, userPassword } = req.body;
        var error = '';

        try
        {
            const db = client.db('COP4331Cards');
            const result = await db.collection('users').updateOne(
                {_id:ObjectId.createFromHexString(userId)},
                {
                    $set: {login : userLogin, password : userPassword, firstName : userFirstName, lastName : userLastName}
                }
            );
            
        }
        catch(e)
        {
            error = e.toString();
        }
        
        var ret = { error: error };
        res.status(200).json(ret);
    });

    app.post('/api/addcard', async (req, res, next) =>
    {
        // incoming: userId, card
        // outgoing: error

        const { userId, card } = req.body;

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

        cardList.push( card );

        var ret = { error: error };
        res.status(200).json(ret);
    });

    app.post('/api/searchcards', async (req, res, next) =>
    {
        // incoming: userId, search
        // outgoing: results[], error

        var error = '';

        const { userId, search } = req.body;

        var _search = search.trim();

        const db = client.db('COP4331Cards');
        const results = await db.collection('cards').find({"name":{$regex:_search+'.*', $options:'i'}}).toArray();

        var _ret = [];
        for( var i=0; i<results.length; i++ )
        {
            _ret.push( results[i].name );
        }
        
        var ret = {results:_ret, error:error};
        res.status(200).json(ret);
    });
}