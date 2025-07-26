const jwt = require('jsonwebtoken');
const createJWT = require('../../scripts/createJWT.js');

jest.mock('jsonwebtoken');

test('createToken() on a valid payload', () => {
    const validUser = {
        _id: "1",
        firstName: "firstName",
        lastName: "lastName",
        email: "test@COP4331Group20.com"
    }

    // jwt.sign.mockResolvedValue(null, null, {expiresIn: '1h'});

    expect(createJWT.createToken(validUser)).toHaveProperty('accessToken');
});

test('createToken() with missing parameters', () => {
        const invalidUser = {}

        expect(createJWT.createToken(invalidUser)).toHaveProperty('error');
});