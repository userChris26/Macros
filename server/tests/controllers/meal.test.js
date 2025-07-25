const mealController = require("../../controllers/meal.controller.js");
const Meal = require("../../models/Meal.js");
const mockingoose = require('mockingoose');
const { cloudinary } = require("../../config/cloudinary.js");

jest.mock('../../config/cloudinary.js');

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

describe("POST /api/meal/photo", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields"
            }
        }

        mockRequest = {
            body: {}
        }

        await mealController.uploadMealPhoto(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with valid request", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                success: true,
                meal: expect.anything()
            }
        }

        mockRequest = {
            body: {
                userId: "test",
                date: "test",
                mealType: "breakfast"
            }
        }

        mockingoose(Meal).toReturn({valid: "meal"}, 'findOne');
        cloudinary.uploader.destroy.mockReturnThis();
        cloudinary.uploader.upload.mockReturnThis();

        await mealController.deleteMealPhoto(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});

describe("DELETE /api/meal/photo", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required fields"
            }
        }

        mockRequest = {
            body: {}
        }

        await mealController.deleteMealPhoto(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with nonexistent meal", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                success: false,
                error: "Meal not found"
            }
        }

        mockRequest = {
            body: {
                userId: "test",
                date: "test",
                mealType: "breakfast"
            }
        }

        mockingoose(Meal).toReturn(null, 'findOne');

        await mealController.deleteMealPhoto(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Invalid request

    test("with valid request", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                success: true,
                meal: expect.anything()
            }
        }

        mockRequest = {
            body: {
                userId: "test",
                date: "test",
                mealType: "breakfast"
            }
        }

        mockingoose(Meal).toReturn({valid: "meal"}, 'findOne');
        cloudinary.uploader.destroy.mockReturnThis();

        await mealController.deleteMealPhoto(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.status).not.toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});

describe("GET /api/meal/:userId/:date/:mealType", () => {
    test("without parameters", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                success: false,
                error: "Missing required parameters"
            }
        }

        mockRequest = {
            params: {}
        }

        await mealController.getMealDetails(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: implement invalid meal condition

    test("with parameters", async () => {
        const expectedResponse = {
            status: 200,
            json: {
                success: true,
                meal: expect.anything()
            }
        }

        mockRequest = {
            params: {
                userId: "test",
                date: "test",
                mealType: "breakfast"
            }
        }

        mockingoose(Meal).toReturn({valid: "meal"}, 'findOne');

        await mealController.getMealDetails(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.status).not.toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
});

describe("POST /api/addmeal", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId, mealName, mealType, and foodItems are required",
                // received: jest.fn().mockReturnValue()
            }
        }

        mockRequest = {
            body: {}
        }

        await mealController.addMeal(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Test with a valid meal entry
    // test("with valid meal entry", async () => {
    //     const expectedResponse = {
    //         status: 200,
    //         json: {
    //             error: "userId, mealName, mealType, and foodItems are required",
    //             // received: jest.fn().mockReturnValue()
    //         }
    //     }

    //     mockRequest = {
    //         body: {
    //             userId: "test", // TODO: Make this an ObjectId...
    //             mealName: "name",
    //             mealType: "breakfast",
    //             foodItems: [{
    //                 fdcId: "1",
    //                 foodName: "name",
    //                 servingSize: 0,
    //                 nutrients: {}
    //             }]
    //         }
    //     }

    //     mockingoose(Meal).toReturn({meal: "saved"}, 'save');

    //     await mealController.addMeal(mockRequest, mockResponse, nextFunction);

    //     expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
    //     expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    // });
});

describe("POST /api/getmeals", () => {
    test("without parameters", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "User ID is required",
            }
        }

        mockRequest = {
            body: {}
        }

        await mealController.getUserMealTemplates(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Test valid request
});

describe("POST /api/addmealtoday", () => {
    test("without parameters", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "User ID and Meal ID are required",
            }
        }

        mockRequest = {
            body: {}
        }

        await mealController.addMealTemplateToday(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with a nonexistent meal template", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "Meal template not found",
            }
        }

        mockRequest = {
            body: {
                userId: "test",
                mealId: "test"
            }
        }

        mockingoose(Meal).toReturn(null, 'findOne');

        await mealController.addMealTemplateToday(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });
    

    // TODO: Test valid request
});

describe("POST /api/deletemeal", () => {
    test("without parameters", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "User ID and Meal ID are required",
            }
        }

        mockRequest = {
            body: {}
        }

        await mealController.deleteMealTemplate(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with nonexistent meal template", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "Meal not found",
            }
        }

        mockRequest = {
            body: {
                userId: "test",
                mealId: "test"
            }
        }

        mockingoose(Meal).toReturn(null, 'findOne');

        await mealController.deleteMealTemplate(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Test valid request
});

describe("PUT /api/updatemeal/:mealId", () => {
    test("without required fields", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "userId, mealName, and foodItems are required",
            }
        }

        mockRequest = {
            params: {},
            body: {}
        }

        await mealController.updateMealTemplate(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("without mealId parameter", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "mealId is required",
            }
        }

        mockRequest = {
            params: {},
            body: {
                userId: "test",
                mealName: "test",
                foodItems: ["test"]
            }
        }

        await mealController.updateMealTemplate(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with nonexistent meal", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "Meal not found",
            }
        }

        mockRequest = {
            params: {
                mealId: "test"
            },
            body: {
                userId: "test",
                mealName: "test",
                foodItems: ["test"]
            }
        }

        mockingoose(Meal).toReturn(null, 'findOneAndUpdate');

        await mealController.updateMealTemplate(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Test valid request
});

describe("GET /api/meal/:mealId", () => {
    test("without userId field", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "User ID is required",
            }
        }

        mockRequest = {
            params: {},
            query: {}
        }

        await mealController.getMealTemplate(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("without mealId parameter", async () => {
        const expectedResponse = {
            status: 400,
            json: {
                error: "Meal ID is required",
            }
        }

        mockRequest = {
            params: {},
            query: {
                userId: "test"
            }
        }

        await mealController.getMealTemplate(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    test("with nonexistent meal", async () => {
        const expectedResponse = {
            status: 404,
            json: {
                error: "Meal not found",
            }
        }

        mockRequest = {
            params: {
                mealId: "test"
            },
            query: {
                userId: "test"
            }
        }

        mockingoose(Meal).toReturn(null, 'findOne')

        await mealController.getMealTemplate(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse.json);
    });

    // TODO: Test valid request
});