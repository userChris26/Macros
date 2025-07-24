const authController = require('../../controllers/auth.controller.js');
const authEmails = require('../../scripts/authEmails.js');
const User = require('../../models/User.js');

jest.mock('../../scripts/authEmails.js');
jest.mock('../../models/User.js');

describe("/api/register", () => {

    
    test('/api/register: missing parameters', async () => {

        const request = {
            userEmail: 'null',
            userPassword: null,
            userFirstName: null,
            userLastName: null
        }

        // // User.findOne.mockResolvedValue({ email: request.userEmail });
        // // User.save.mockResolvedValue();
        // jest.spyOn(User.prototype, 'findOne').mockReturnValueOnce({ email: request.userEmail });
        // jest.spyOn(User.prototype, 'save').mockResolvedValue();
        // authEmails.sendVerifyEmail.mockResolvedValue(request.userEmail, null);

        let response = await authController.register(request, request);

        expect().toThrow();
    })
})
