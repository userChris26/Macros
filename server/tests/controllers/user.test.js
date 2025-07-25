const userController = require('../../controllers/user.controller.js');
const User = require('../../models/User.js');
const mockingoose = require('mockingoose');
const { cloudinary } = require("../../config/cloudinary.js");

jest.mock("../../config/cloudinary.js");

let mockRequest;
let mockResponse;
let nextFunction = jest.fn();

beforeEach(() => {
    mockRequest = {};
    mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
});

describe("GET /api/users/search", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Search query is required"
            }
        }

        mockRequest = {
            query: {
                q: null
            }
        }

        await userController.searchUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent query", async () => {
        const expectedResponse = {
            status: 500,
            json: {
                error: "Failed to search users"
            }
        }

        mockRequest = {
            query: {
                q: "invalid"
            }
        }

        mockingoose(User).toReturn(null, "find")

        await userController.searchUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid query", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: ""
            }
        }

        mockRequest = {
            query: {
                q: "valid"
            }
        }

        mockingoose(User).toReturn([{
            _id: "id",
            firstName: "first",
            lastName: "last",
            email: "email"
            
        }], "find");
        
        

        await userController.searchUser(mockRequest, mockResponse, nextFunction);

        // TODO: Make this test more thorough
        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        // expect(mockResponse.).toHaveProperty("users");
        // expect(mockResponse.json.error).toHaveBeenCalledWith(expectedResponse.json.error);
        expect(nextFunction).toHaveBeenCalled();
    });
});

describe("POST /api/upload-profile-pic/:userId", () => {
    test("without a userId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "No userId provided"
            }
        }

        mockRequest = {
            params: {},
            body: {}
        }

        await userController.uploadProfilePic(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("without photo data", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "No photo data provided"
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            },
            body: {}
        }

        await userController.uploadProfilePic(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with nonexistent user", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "User not found"
            }
        }

        mockRequest = {
            params: {
                userId: "DNE"
            },
            body: {
                photoBase64: "photo"
            }
        }

        mockingoose(User).toReturn(null, 'findById');

        await userController.uploadProfilePic(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid upload", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: ""
            }
        }

        mockRequest = {
            params: {
                userId: "exists"
            },
            body: {
                photoBase64: "photo"
            }
        }
        
        // TODO: Mongoose
        mockingoose(User).toReturn({user: "doesExist"}, 'findById');
        cloudinary.uploader.upload.mockReturnThis();
        mockingoose(User).toReturn(null, 'findByIdAndUpdate');

        await userController.uploadProfilePic(mockRequest, mockResponse, nextFunction);

        // TODO: Make this test more thorough
        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        // expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        // expect(mockResponse).toHaveProperty('message');
        // expect(mockResponse).toHaveProperty('profilePicUrl');
        // expect(mockResponse).toHaveProperty('user');
        expect(nextFunction).toHaveBeenCalled();
    })
});

describe("DELETE /api/delete-profile-pic/:userId", () => {
    test("without a userId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId not provided"
            }
        }

        mockRequest = {
            params: {}
        }

        await userController.deleteProfilePic(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent user", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "User not found"
            }
        }

        mockRequest = {
            params: {
                userId: "DNE"
            }
        }

        mockingoose(User).toReturn(null, 'findById');

        await userController.deleteProfilePic(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid user", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: ""
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            }
        }

        // TODO: Mongoose
        mockingoose(User).toReturn({userId: "id"}, 'findById');


        await userController.deleteProfilePic(mockRequest, mockResponse, nextFunction);

        // TODO: Make this test more thorough
        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        // expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        // expect(mockResponse).toHaveProperty('message');
        // expect(mockResponse).toHaveProperty('user');
        expect(nextFunction).toHaveBeenCalled();
    });
});

describe("GET /api/user/:userId", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId not provided"
            }
        }

        mockRequest = {
            params: {}
        }

        await userController.getUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent user", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "User not found"
            }
        }

        mockRequest = {
            params: {
                userId: "DNE"
            }
        }

        // TODO: Mongoose findById

        await userController.getUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid user", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                user: jest.fn().mockReturnThis(),
                error: ""
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            }
        }

        // TODO: Mongoose findById

        await userController.getUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(mockResponse).toHaveProperty("user");
    });
});

describe("PUT /api/user/:userId", () => {
    test("without userId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId not provided"
            }
        }

        mockRequest = {
            params: {},
            body: {}
        }

        await userController.updateUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("without user details", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId not provided"
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            },
            body: {}
        }

        await userController.updateUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent user", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "User not found"
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            },
            body: {
                firstName: "valid",
                lastName: "valid",
                bio: "..."
            }
        }

        // TODO: Mockingoose findById

        await userController.updateUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid user and details", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: ""
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            },
            body: {
                firstName: "valid",
                lastName: "valid",
                bio: "..."
            }
        }

        // TODO: Mockingoose findById

        await userController.updateUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(mockResponse).toHaveProperty('message');
        expect(mockResponse).toHaveProperty('user');
        expect(nextFunction).toHaveBeenCalled();
    });
});

describe("DELETE /api/user/:userId", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId not provided"
            }
        }

        mockRequest = {
            params: {}
        }

        await userController.deleteUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent user", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "User not found"
            }
        }

        mockRequest = {
            params: {
                userId: "DNE"
            }
        }

        // TODO: Mongoose findById

        await userController.deleteUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid user", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                message: jest.fn().mockReturnThis(),
                error: "userId not provided"
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            }
        }

        // TODO: Mongoose findById

        await userController.deleteUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(mockResponse).toHaveProperty('message');
        expect(nextFunction).toHaveBeenCalled();
    });
});