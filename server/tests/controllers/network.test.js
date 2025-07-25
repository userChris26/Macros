const networkController = require("../../controllers/network.controller.js");

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

describe("POST /api/follow", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Missing required fields"
            }
        }

        mockRequest = {
            body: {
                followerId: null,
                followingId: null
            }
        }

        await networkController.followUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with followerId === followingId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Cannot follow yourself"
            }
        }

        mockRequest = {
            body: {
                followerId: "same",
                followingId: "same"
            }
        }

        await networkController.followUser(mockRequest, mockResponse, nextFunction);

        // expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with the user already following another", async () => {
        const Network = require("../../models/Network.js");

        const expectedResponse = {
            status: 400,
            json: {
                error: "Already following this user"
            }
        }

        mockRequest = {
            body: {
                followerId: "same",
                followingId: "dfferent"
            }
        }

        // TODO: Mongoose

        await networkController.followUser(mockRequest, mockResponse, nextFunction);

        // expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with following a new user", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: ""
            }
        }

        mockRequest = {
            body: {
                followerId: "same",
                followingId: "dfferent"
            }
        }

        // TODO: Mongoose

        await networkController.followUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(nextFunction).toHaveBeenCalled();
    });
});

describe("DELETE /api/follow", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Missing required fields"
            }
        }

        mockRequest = {
            body: {}
        }

        await networkController.unfollowUser(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with the user trying to unfollow self", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Cannot unfollow yourself"
            }
        }

        mockRequest = {
            body: {
                followerId: "same",
                followingId: "same"
            }
        }

        await networkController.unfollowUser(mockRequest, mockResponse, nextFunction);

        // expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent connection", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Not following this user"
            }
        }

        mockRequest = {
            body: {
                followerId: "same",
                followingId: "different"
            }
        }

        // TODO: Mongoose

        await networkController.unfollowUser(mockRequest, mockResponse, nextFunction);

        // expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid connection", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                error: ""
            }
        }

        mockRequest = {
            body: {
                followerId: "same",
                followingId: "different"
            }
        }

        // TODO: Mongoose

        await networkController.unfollowUser(mockRequest, mockResponse, nextFunction);

        // expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(nextFunction).toHaveBeenCalled();
    });
});

describe("GET /api/followers/:userId", () => {
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

        await networkController.getFollowers(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with userId provided", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                followers: jest.fn().mockReturnValue(),
                error: ""
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            }
        }

        // TODO: Mongoose

        await networkController.getFollowers(mockRequest, mockResponse, nextFunction);

        // expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(mockResponse).toHaveProperty("followers");
        expect(nextFunction).toHaveBeenCalled();
    });
});

describe("GET /api/following/:userId", () => {
    test("without providing userId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId not provided"
            }
        }

        mockRequest = {
            params: {}
        }

        await networkController.getFollowing(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a valid userId", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                following: jest.fn().mockReturnValue(),
                error: ""
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            }
        }

        // TODO: Mongoose

        await networkController.getFollowing(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});

describe("GET /api/dashboard/stats/:userId", () => {
    test("without userId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId not provided"
            }
        }

        mockRequest = {
            params: {}
        }

        await networkController.getDashboardStats(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with userId", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                success: true,
                stats: jest.fn().mockReturnValue(),
                // error: "userId not provided"
            }
        }

        mockRequest = {
            params: {
                userId: "valid"
            }
        }

        // TODO: Mongoose

        await networkController.getDashboardStats(mockRequest, mockResponse, nextFunction);

        // expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
        expect(nextFunction).toHaveBeenCalled();
    });
});