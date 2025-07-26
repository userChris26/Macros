const authEmails = require('../../scripts/authEmails.js');
// const createJWT = require('../../scripts/createJWT.js');
const sgMail = require('@sendgrid/mail');

jest.mock('@sendgrid/mail');

let mockResponse;
let msg;

beforeEach(() => {
    mockResponse = {};
    msg = {};
});

describe("sendVerifyEmail(email, verifyToken)", () => {
    test("without parameters", async () => {
        const expectedResponse = {
            json: {
                error: "Missing required fields: email, verifyToken"
            }
        }
        
        mockResponse = await authEmails.sendVerifyEmail(null, null);

        expect(mockResponse).toEqual(expectedResponse.json);
    });


    test('with email and valid token', async () => {
        const expectedResponse = {
            json: {
                error: ""
            }
        };

        sgMail.send.mockResolvedValue();

        mockResponse = await authEmails.sendVerifyEmail("valid", "valid");

        expect(mockResponse).toEqual(expectedResponse.json);
    })
});

describe("sendVerifiedConfirmationEmail(email)", () => {
    test("without email parameter", async () => {
        const expectedResponse = {
            json: {
                error: "Email not present"
            }
        }
        
        mockResponse = await authEmails.sendVerifiedConfirmationEmail(null);

        expect(mockResponse).toEqual(expectedResponse.json);
    });

    test('with an email parameter', async () => {
        const expectedResponse = { error: '' };

        sgMail.send.mockResolvedValue();

        mockResponse = await authEmails.sendVerifiedConfirmationEmail("valid");

        expect(mockResponse).toEqual(expectedResponse);
    })
});

describe("sendRecoveryEmail(email, resetToken)", () => {
    test("without parameters", async () => {
        const expectedResponse = {
            json: {
                error: "Missing required fields: email, resetToken"
            }
        }
        
        mockResponse = await authEmails.sendRecoveryEmail(null, null);

        expect(mockResponse).toEqual(expectedResponse.json);
    });


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

        mockResponse = await authEmails.sendRecoveryEmail("valid", "valid");

        expect(mockResponse).toEqual(expectedResponse.json);
    })
});


describe("sendRecoveredConfirmationEmail(email)", () => {
    test("without email parameter", async () => {
        const expectedResponse = {
            json: {
                error: "Email not present"
            }
        }
        
        mockResponse = await authEmails.sendRecoveredConfirmationEmail(null);

        expect(mockResponse).toEqual(expectedResponse.json);
    });

    test('with an email parameter', async () => {
        const expectedResponse = { error: '' };

        sgMail.send.mockResolvedValue();

        mockResponse = await authEmails.sendVerifiedConfirmationEmail("valid");

        expect(mockResponse).toEqual(expectedResponse);
    })
});
