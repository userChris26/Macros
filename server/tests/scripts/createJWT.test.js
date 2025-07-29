const jwt = require('jsonwebtoken');
const createJWT = require('../../scripts/createJWT.js');

jest.mock('jsonwebtoken');

describe('createToken()', () => {
    test('with missing parameters', () => {
            const invalidUser = {}

            expect(createJWT.createToken(invalidUser)).toHaveProperty('error');
    });

    test('with valid parameters', () => {
        const validUser = {
            _id: "1",
            firstName: "firstName",
            lastName: "lastName",
            email: "test@COP4331Group20.com"
        }

        // jwt.sign.mockResolvedValue(null, null, {expiresIn: '1h'});

        expect(createJWT.createToken(validUser)).toHaveProperty('accessToken');
    });
})



