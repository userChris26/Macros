const userController = require('../../controllers/user.controller.js');

let mockRequest;
let mockResponse;

beforeEach(() => {
    mockRequest = {};
    mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
    nextResponse = jest.fn();
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
            body: {}
        }

        await userController.searchUser(mockResponse, mockRequest, nextFunction);

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
            body: {}
        }

        await userController.searchUser(mockResponse, mockRequest, nextFunction);

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
            body: {}
        }

        await userController.searchUser(mockResponse, mockRequest, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse).toHaveProperty("users");
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
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

        await userController.uploadProfilePic(mockResponse, mockRequest, nextFunction);

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

        await userController.uploadProfilePic(mockResponse, mockRequest, nextFunction);

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

        await userController.uploadProfilePic(mockResponse, mockRequest, nextFunction);

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

        await userController.uploadProfilePic(mockResponse, mockRequest, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(mockResponse).toHaveProperty('message');
        expect(mockResponse).toHaveProperty('profilePicUrl');
        expect(mockResponse).toHaveProperty('user');
        expect(nextFnuction).toHaveBeenCalled();
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

        await userController.deleteProfilePic(mockResponse, mockRequest, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistance user", async () => {
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

        await userController.deleteProfilePic(mockResponse, mockRequest, nextFunction);

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

        await userController.deleteProfilePic(mockResponse, mockRequest, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(mockResponse).toHaveProperty('message');
        expect(mockResponse).toHaveProperty('user');
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

        await userController.getUser(mockResponse, mockRequest, nextFunction);

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

        await userController.getUser(mockResponse, mockRequest, nextFunction);

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

        await userController.getUser(mockResponse, mockRequest, nextFunction);

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

        await userController.updateUser(mockResponse, mockRequest, nextFunction);

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

        await userController.updateUser(mockResponse, mockRequest, nextFunction);

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

        await userController.updateUser(mockResponse, mockRequest, nextFunction);

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

        await userController.updateUser(mockResponse, mockRequest, nextFunction);

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

            }
        }

        mockRequest = {
            params: {}
        }

        await userController.deleteUser(mockResponse, mockRequest, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

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

        await userController.deleteUser(mockResponse, mockRequest, nextFunction);

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

        await userController.deleteUser(mockResponse, mockRequest, nextFunction);

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

        await userController.deleteUser(mockResponse, mockRequest, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(mockResponse).toHaveProperty('message');
        expect(nextFunction).toHaveBeenCalled();
    });
});