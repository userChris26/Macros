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

        try {
            const db = client.db('COP4331Cards');
            const results = await db.collection('users').find({login:userLogin}).toArray();

            if ( results.length > 0 ) {
                error = "Username Already Exists";
            } else {
                const newUser = {
                    login: userLogin, 
                    password: userPassword, 
                    firstName: userFirstName, 
                    lastName: userLastName
                };
                await db.collection('users').insertOne(newUser);
            }
        } catch(e) {
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
        var userId = -1;
        var userFirstName = '';
        var userLastName = '';

        try {
            const { userLogin, userPassword } = req.body;
            const db = client.db('COP4331Cards');
            const results = await db.collection('users')
                .find({login:userLogin, password:userPassword})
                .toArray();

            if( results.length > 0 ) {
                userId = results[0]._id;
                userFirstName = results[0].firstName;
                userLastName = results[0].lastName;
            }
        } catch(e) {
            error = e.toString();
        }
        
        var ret = { 
            id: userId, 
            firstName: userFirstName, 
            lastName: userLastName, 
            error: error
        };
        res.status(200).json(ret);
    });

    app.post('/api/updateAccount', async (req, res, next) =>
    {
        // incoming: userId, userFirstName, userLastName, userLogin, userPassword
        // outgoing: error
        
        const { userId, userFirstName, userLastName, userLogin, userPassword } = req.body;
        var error = '';

        try {
            const db = client.db('COP4331Cards');
            await db.collection('users').updateOne(
                { _id: ObjectId.createFromHexString(userId) },
                {
                    $set: {
                        login: userLogin,
                        password: userPassword,
                        firstName: userFirstName,
                        lastName: userLastName
                    }
                }
            );
        } catch(e) {
            error = e.toString();
        }
        
        var ret = { error: error };
        res.status(200).json(ret);
    });

    app.post('/api/addcard', async (req, res, next) =>
    {
        // incoming: userId, card
        // outgoing: error, cardId

        const { userId, card } = req.body;
        var error = '';
        var cardId = '';

        try {
            const db = client.db('COP4331Cards');
            const result = await db.collection('cards').insertOne({
                user: userId,
                name: card
            });
            cardId = result.insertedId;
        } catch(e) {
            error = e.toString();
        }

        var ret = { error: error, cardId: cardId };
        res.status(200).json(ret);
    });

    app.post('/api/searchcards', async (req, res, next) =>
    {
        // incoming: userId, search
        // outgoing: results[], error

        var error = '';
        var _ret = [];

        try {
            const { userId, search } = req.body;
            const _search = search.trim();

            const db = client.db('COP4331Cards');
            const results = await db.collection('cards')
                .find({
                    user: userId,
                    name: { $regex: _search + '.*', $options: 'i' }
                })
                .toArray();

            _ret = results.map(card => card.name);
        } catch(e) {
            error = e.toString();
        }
        
        var ret = { results: _ret, error: error };
        res.status(200).json(ret);
    });
}