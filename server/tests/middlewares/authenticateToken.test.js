const authenticateToken = require('../../middlewares/authenticateToken.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// jest.mock('jsonwebtoken');

describe("Authorization middleware", () => {
    let mockRequest;
    let mockResponse;
    let nextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    test("without headers", async () => {
        const expectedResponse = {
            status: 401,
            json: {
                error: "Missing token from the 'Authorization' header"
            }
        };
        
        authenticateToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("without 'authorization' header", async () => {
        const expectedResponse = {
            status: 401,
            json: {
                error: "Missing token from the 'Authorization' header"
            }
        };

        mockRequest = {
            headers: {}
        };

        authenticateToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with invalid 'authorization' header token", async () => {
        const expectedResponse = {
            status: 403,
            json: {
                error: "Invalid token"
            }
        };
        
        mockRequest = {
            headers: {
                authorization: "Bearer invalidToken"
            }
        }

        authenticateToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    })

    test("with valid 'authorization' header token", () => {

        // TODO: Make this an actual unit test
        validToken = jwt.sign({data: "payload"}, process.env.JWT_SECRET, {expiresIn: '1h'});

        mockRequest = {
            headers: {
                authorization: "Bearer " + validToken
            }
        }
        authenticateToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
    })
});
