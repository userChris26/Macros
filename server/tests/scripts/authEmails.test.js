const authEmails = require('../../scripts/authEmails.js');
// const createJWT = require('../../scripts/createJWT.js');
const sgMail = require('@sendgrid/mail');

jest.mock('@sendgrid/mail');

describe("Email verification script", () => {
    let mockResponse;
    let msg;

    beforeEach(() => {
        mockResponse = {};
        msg = {};
    });

    test("without parameters", async () => {
        const expectedResponse = {
            json: {
                error: "Missing required fields: email, verifyToken"
            }
        }
        
        mockResponse = await authEmails.sendVerifyEmail(null, null);

        expect(mockResponse).toEqual(expectedResponse.json);
    });

    test('with invalid token', async() => {
        const expectedResponse = {
            json: {
                error: "Failed to send verification email. Please contact support."
            }
        };

        sgMail.send.mockImplementation(() => {
            throw new Error;
        });

        let mockResponse = await authEmails.sendVerifyEmail("valid", "valid");

        expect(mockResponse).toEqual(expectedResponse.json);
    })


    test('with email and valid token', async () => {

        const expectedResponse = {
            json: {
                error: ""
            }
        };

        sgMail.send.mockResolvedValue();

        let mockResponse = await authEmails.sendVerifyEmail("valid", "valid");

        expect(mockResponse).toEqual(expectedResponse.json);
    })
});

describe("Email verification confirmation script", () => {
    let mockResponse;

    beforeEach(() => {
        mockResponse = {};
    });

    test("without email parameter", async () => {
        const expectedResponse = {
            json: {
                error: "Email not present"
            }
        }
        
        let mockResponse = await authEmails.sendVerifiedConfirmationEmail(null);

        expect(mockResponse).toEqual(expectedResponse.json);
    });

    // test('with an email parameter', async () => {
    //     const expectedResponse = {
    //         json: {
    //             error: ""
    //         }
    //     };

    //     sgMail.send.mockResolvedValue();

    //     let mockResponse = await authEmails.sendVerifiedConfirmationEmail("valid");

    //     expect(mockResponse).not.toHaveReturned();
    // })
});

describe("Email recovery script", () => {
    let mockResponse;
    let msg;

    beforeEach(() => {
        mockResponse = {};
        msg = {};
    });

    test("without parameters", async () => {
        const expectedResponse = {
            json: {
                error: "Missing required fields: email, resetToken"
            }
        }
        
        mockResponse = await authEmails.sendRecoveryEmail(null, null);

        expect(mockResponse).toEqual(expectedResponse.json);
    });

    test('with invalid token', async() => {
        const expectedResponse = {
            json: {
                error: Error()
            }
        };

        sgMail.send.mockImplementation(() => {
            throw new Error;
        });

        let mockResponse = await authEmails.sendRecoveryEmail("valid", "valid");

        expect(mockResponse).toEqual(expectedResponse.json);
    })


    test('with email and valid token', async () => {

        const expectedResponse = {
            json: {
                error: ""
            }
        };

        msg = {
            to: 'to@mail.com',
            from: 'from@mail.com',
            subject: 'subject',
            text: 'text',
            html: '<p>html</p>'
        };
        sgMail.send.mockResolvedValue(msg);

        let mockResponse = await authEmails.sendRecoveryEmail("valid", "valid");

        expect(mockResponse).toEqual(expectedResponse.json);
    })
});


describe("Email recovery confirmation script", () => {
    let mockResponse;

    beforeEach(() => {
        mockResponse = {};
    });

    test("without email parameter", async () => {
        const expectedResponse = {
            json: {
                error: "Email not present"
            }
        }
        
        let mockResponse = await authEmails.sendRecoveredConfirmationEmail(null);

        expect(mockResponse).toEqual(expectedResponse.json);
    });

    // test('with an email parameter', async () => {
    //     const expectedResponse = {
    //         json: {
    //             error: ""
    //         }
    //     };

    //     sgMail.send.mockResolvedValue();

    //     let mockResponse = await authEmails.sendVerifiedConfirmationEmail("valid");

    //     expect(mockResponse).not.toHaveReturned();
    // })
});
