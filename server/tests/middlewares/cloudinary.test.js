const cloudinary = require("../../config/cloudinary.js");

describe("upload.sigle()", () => {
    test("without a file", () => {
        
        expect(cloudinary.upload.single(null)).toThrow();
    });

    test("with an invalid file format", () => {
        expect(cloudinary.upload.single('./cloudinary.test.js')).toThrow();
    });

    test("with an image that is above the 5MB limit", () => {
        expect(cloudinary.upload.single('res/burger-with-melted-cheese-6mb.jpg')).toThrow();
    });

    test("with an image that is below the 5MB limit", () => {
        expect(cloudinary.upload.single('res/burger-with-melted-cheese.jpg')).toThrow();
    });
});