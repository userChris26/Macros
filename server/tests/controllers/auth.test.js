const MongoMemoryServer = require("mongodb-memory-server");
const authController = require('../../controllers/auth.controller.js');
const dbHandler = require("../../utils/dbHandler.util.js");
const authEmails = require('../../scripts/authEmails.js');
const User = require('../../models/User.js');
const mockingoose = require('mockingoose');
const createJWT = require("../../scripts/createJWT.js");

// beforeAll(async () => dbHandler.dbConnect());
// afterAll(async () => dbHandler.dbDisconnect());

jest.mock('../../scripts/authEmails.js')
jest.mock('../../scripts/createJWT.js');

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
            status: 400,
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

        mockingoose(User).toReturn({already: 'exists'}, 'findOne');

        await authController.register(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with am unregistered user", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: "",
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

        mockingoose(User).toReturn(null, 'findOne');
        mockingoose(User).toReturn(null, 'save');
        authEmails.sendVerifyEmail.mockReturnValue({error: ''});

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
            status: 400,
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

        mockingoose(User).toReturn(null, 'findOne');

        await authController.login(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with an unverified account", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: "Please verify your email before logging in",
                needsVerification: true
            }
        }

        mockRequest = {
            body: {
                userEmail: "unverified",
                userPassword: "account"
            }
        }

        mockingoose(User).toReturn({account: 'exists', isVerified: false}, 'findOne');

        await authController.login(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a registered and verified account", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                accessToken: "test",
                error: "",
            }
        }

        mockRequest = {
            body: {
                userEmail: "registered",
                userPassword: "verified"
            }
        }

        mockingoose(User).toReturn({account: 'exists', isVerified: true}, 'findOne');
        createJWT.createToken.mockReturnValue({accessToken: "test"});

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
                email: "DNE",
            }
        }

        mockingoose(User).toReturn(null, 'findOne');

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
                email: "unverified",
            }
        }

        mockingoose(User).toReturn({account: "exists"}, 'findOne');
        mockingoose(User).toReturn(null, 'findByIdAndUpdate');
        authEmails.sendRecoveryEmail.mockReturnValue({ error: '' });

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
                error: "Invalid or expired verification token",
            }
        }

        mockRequest = {
            body: {
                token: "Bearer invalid"
            }
        }

        mockingoose(User).toReturn(null, 'findOne');

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
                token: "Bearer valid"
            }
        }

        mockingoose(User).toReturn({account: "hasValidToken"}, 'findOne');
        authEmails.sendRecoveredConfirmationEmail.mockReturnThis();

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

        mockingoose(User).toReturn(null, 'findOne');

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
        mockingoose(User).toReturn({account: "exists"}, 'findOne');
        mockingoose(User).toReturn(null, 'findByIdAndUpdate');
        authEmails.sendRecoveryEmail.mockReturnValue({ error: '' });

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

        mockingoose(User).toReturn(null, 'findOne');

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

        mockingoose(User).toReturn({account: "hasValidToken"}, 'findOne');
        authEmails.sendRecoveredConfirmationEmail.mockReturnThis();

        await authController.recoverEmail(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});