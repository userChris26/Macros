const foodController = require("../../controllers/food.controller.js");
const FoodEntry = require("../../models/FoodEntry.js");
const mockingoose = require('mockingoose');

let mockRequest;
let mockResponse;
// let nextFunction = jest.fn();

beforeEach(() => {
    mockRequest = {};
    mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
});

describe("POST /api/getfoodentries", () => {
    test("without userId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "User ID is required"
            }
        }

        mockRequest = {
            body: {}
        }

        await foodController.getFoodEntries(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: More tests
});

describe("POST /api/deletefoodentry", () => {
    test("without userId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "User ID is required"
            }
        }

        mockRequest = {
            body: {}
        }

        await foodController.deleteFoodEntry(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("without mealId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Entry ID is required"
            }
        }

        mockRequest = {
            body: {
                userId: "test"
            }
        }

        await foodController.deleteFoodEntry(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with nonexistent food entry", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "Food entry not found"
            }
        }

        mockRequest = {
            body: {
                userId: "test",
                entryId: "DNE"
            }
        }

        mockingoose(FoodEntry).toReturn(null, 'findOne');

        await foodController.deleteFoodEntry(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
    
    test("with existing food entry", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                success: true,
                message: "Food entry deleted",
                error: ""
            }
        }

        mockingoose(FoodEntry).toReturn({entry: "valid"}, 'findOne');
        mockingoose(FoodEntry).toReturn(null, 'deleteOne')

        mockRequest = {
            body: {
                userId: "test",
                entryId: "exists"
            }
        }

        // TODO: Mongoose

        await foodController.deleteFoodEntry(mockRequest, mockResponse);

        // expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});
describe("POST /api/food/:fdcId", () => {
    test("without fdcId", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "FDC ID is required"
            }
        }

        mockRequest = {
            params: {}
        }

        await foodController.getFoodDetails(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Test USDA API Error (?)
    
    // test("with valid mealId", async () => {
    //     const expectedResponse = {
    //         status: 400,
    //         json: {
    //             error: "Entry ID is required"
    //         }
    //     }

    //     mockRequest = {
    //         params: {
    //             fdcId: "test"
    //         }
    //     }

    //     await foodController.deleteFoodEntry(mockRequest, mockResponse);

    //     expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
    //     expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    // });
});
describe("POST /api/searchfood", () => {
    test("without query", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Search query is required"
            }
        }

        mockRequest = {
            query: {}
        }

        await foodController.searchFood(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Test USDA API Error (?)
    // TODO: Test a valid search query
});
describe("POST /api/addfood", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields",
                required: ['userId', 'fdcId', 'servingAmount', 'mealType']
            }
        }

        mockRequest = {
            body: {}
        }

        await foodController.addFood(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Test USDA API Error (?)
    // TODO: Test a valid request
});