const authController = require('../../controllers/auth.controller.js');
const authEmails = require('../../scripts/authEmails.js');
const User = require('../../models/User.js');

jest.mock('../../scripts/authEmails.js');
jest.mock('../../models/User.js');

let mockRequest;
let mockResponse;

beforeEach(() => {
    mockRequest = {};
    mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
});

describe("POST /api/register", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields",
                required: ['userEmail', 'userPassword', 'userFirstName', 'userLastName']
            }
        }

        mockRequest = {
            body: {}
        }

        await authController.register(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a registered user", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error:  "Account Already Exists"
            }
        }

        mockRequest = {
            body: {
                userEmail: "account@exists.com",
                userPassword: "exists",
                userFirstName: "exists",
                userLastName: "exists"
            }
        }

        // TODO: Mongoose

        await authController.register(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a registered user", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields",
                required: ['userEmail', 'userPassword', 'userFirstName', 'userLastName']
            }
        }

        mockRequest = {
            body: {
                userEmail: "new@account.com",
                userPassword: "new",
                userFirstName: "new",
                userLastName: "new"
            }
        }

        // TODO: Mongoose

        await authController.register(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});

describe("POST /api/login", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields",
                required: ['userEmail', 'userPassword']
            }
        }

        mockRequest = {
            body: {}
        }

        await authController.login(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent account", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: "Login/Password incorrect",
            }
        }

        mockRequest = {
            body: {
                userEmail: "wrong",
                userPassword: "wrong"
            }
        }

        // TODO: Mongoose

        await authController.login(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: test("with an unverified user")
    test("with an unverified account", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: "Please verify your email before loggin in",
                needsVerification: true
            }
        }

        mockRequest = {
            body: {
                userEmail: "unverified",
                userPassword: "account"
            }
        }

        // TODO: Mongoose

        await authController.login(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
    // TODO: test("with a jwt error")

    test("with a registered and verified account", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                accessToken: jest.fn().mockReturnValue(),
                error: "",
            }
        }

        mockRequest = {
            body: {
                userEmail: "registered",
                userPassword: "verified"
            }
        }

        // TODO: Mongoose

        await authController.login(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});

describe("POST /api/send-email-verification", () => {
    test("without the required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields",
                required: ['email']
            }
        }

        mockRequest = {
            body: {}
        }

        await authController.sendRecoveryEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent account", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: "",
            }
        }

        mockRequest = {
            body: {
                userEmail: "DNE",
            }
        }

        // TODO: Mongoose

        await authController.sendRecoveryEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid account", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: "",
            }
        }

        mockRequest = {
            body: {
                userEmail: "unverified",
            }
        }

        // TODO: Mongoose

        await authController.sendRecoveryEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Implement condition for accounts that are already verified
});

describe("POST /api/verify-email", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields",
                required: ['token']
            }
        }

        mockRequest = {
            body: {}
        }

        await authController.verifyEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with invalid/expired token", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Invalid or expred reset token",
            }
        }

        mockRequest = {
            body: {
                token: "bad"
            }
        }

        // TODO: Mongoose

        await authController.verifyEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with valid token", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: "",
            }
        }

        mockRequest = {
            body: {
                token: "valid"
            }
        }

        // TODO: Mongoose
        // TODO: SendGrid

        await authController.verifyEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});

describe("POST /api/forgot-password", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields",
                required: ['email']
            }
        }

        mockRequest = {
            body: {}
        }

        await authController.sendRecoveryEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with nonexistent user", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: ""
            }
        }

        mockRequest = {
            body: {
                email: "DNE"
            }
        }

        // TODO: Mongoose

        await authController.sendRecoveryEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with valid user", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: ""
            }
        }

        mockRequest = {
            body: {
                email: "exists"
            }
        }

        // TOOD: Correct the control flow
        // TODO: Mongoose
        // TODO: SendGrid

        await authController.sendRecoveryEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: SendGrid error
});

describe("POST /api/reset-password", () => {

    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields",
                required: ['token', 'newPassword']
            }
        }

        mockRequest = {
            body: {}
        }

        await authController.recoverEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with expred/invalid token", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Invalid or expired reset token",
            }
        }

        mockRequest = {
            body: {
                token: "expired",
                newPassword: "new"
            }
        }

        // TODO: Mongoose

        await authController.recoverEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with valid token", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: "",
            }
        }

        mockRequest = {
            body: {
                token: "valid",
                newPassword: "new"
            }
        }

        // TODO: Mongoose
        // TODO: SendGrid

        await authController.recoverEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});