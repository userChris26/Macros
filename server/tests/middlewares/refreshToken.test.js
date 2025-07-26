const refreshToken = require('../../middlewares/refreshToken');
// const createJWT = require('../../scripts/createJWT.js')

describe("Refresh middleware", () => {
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

    test("without headers", () => {
        const expectedResponse = {
            status: 401,
            json: {
                error: "Token not present"
            }
        };

        refreshToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("without 'authorization' header", () => {
        const expectedResponse = {
            status: 401,
            json: {
                error: "Token not present"
            }
        };

        mockRequest = {
            headers: {}
        }

        refreshToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // test("with valid 'authorization' header token", () => {
    //     const expectedResponse = {
    //         status: 401,
    //         json: {
    //             error: "Token not present"
    //         }
    //     };

    //     mockRequest = {
    //         headers: {
    //             token: "invalid"
    //         }
    //     }

    //     refreshToken(
    //         mockRequest,
    //         mockResponse,
    //         nextFunction
    //     );

    //     expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
    //     expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    // });
})