# ROADMAP

## ASAP
- how to do unit tests with every push
- Ensure all API Routes work
- When put in unit tests here
- make food date be iso not string if possible
- Start taking pictures of food and actually using (experiment for a week!)

focus on the Network, User settings, and Food queries

Food Log Features:
Create the food entry form with USDA API integration
Add a calendar view for historical entries
Implement macro tracking goals
Social Features:
Set up the following/followers system
Create the activity feed
Add the ability to like and comment on food entries
Profile Enhancements:
Connect the profile form to the backend
Add profile picture upload with Cloudinary
Implement stats and progress tracking
Mobile Responsiveness:
Add a mobile navigation menu for the sidebar
Optimize layouts for smaller screens

## LAYOUT
- Create shadcn / ui dashboard component
- Create windows for each app screen

## FUNCTIONALITY
- Profile update pics and stuff, stats...
- Food interface: add food, see journal, history, unit sizes?
- Social, follow people, see network
- Routine meals in here somewhere

## BACKEND
- email / password recovery
- password hashing

## EXPANSION
- Flutter create the same thing

## DETAILS
- get favicon working
- social nutrition tracker everywhere

## ACCESSIBILITY
- lighthouse
- light and dark mode
- password complexity
- mobile / responsiveneess

## DEPLOYMENT
- Unit Tests for EVERYTHING
- On server, full walkthrough for new user (end to end testing)

## PRESENTATION
- Github sharp / branding up
- Hero show off screenshots from mobile
- Powerpoint good and rehearsed (mobile app visuals there also)

## ME
- when do this again on my own
- what technologies (JWT / sendgrid) for resume

## UNIT TESTING

Unit Tests are isolated tests that verify specific pieces (units) of your code work as expected. Think of them as automated checks that run before code changes to prevent breaking existing functionality.

Here are examples of what we could test in your app:

### Frontend Tests
```typescript
```

### Backend API Tests
```typescript
// Example: Testing Authentication Endpoints
describe('POST /api/auth/login', () => {
  it('should return 401 with wrong password')
  it('should return JWT token with valid credentials')
  it('should set correct cookie headers')
})

// Example: Testing Food Entry Endpoints
describe('POST /api/food-entries', () => {
  it('should reject entries without required fields')
  it('should calculate correct total calories')
  it('should save image to Cloudinary')
  it('should link entry to correct user')
})

// Example: Testing USDA API Integration
describe('USDA Service', () => {
  it('should handle API timeouts gracefully')
  it('should cache frequent requests')
  it('should parse nutrition data correctly')
})
```

### Integration Tests
```typescript
// Example: Testing Complete Food Logging Flow
describe('Food Logging Flow', () => {
  it('should create entry from USDA search to database')
  it('should update user's daily totals')
  it('should appear in social feed')
})
```

### Key Testing Areas:

1. **Authentication**
   - Login/signup flows
   - JWT token handling
   - Protected route access
   - Password reset flow

2. **Food Entry Management**
   - CRUD operations
   - Macro calculations
   - Image upload
   - Data validation

3. **Social Features**
   - Following users
   - Feed generation
   - Comment functionality
   - Privacy settings

4. **External API Integration**
   - USDA API responses
   - Cloudinary upload success
   - SendGrid email delivery
   - Error handling

5. **Data Integrity**
   - Database operations
   - Data transformations
   - Cache management
   - State updates

### Benefits for Your Project:

1. **API Stability**
   - Catch breaking changes before deployment
   - Ensure backward compatibility
   - Validate API responses
   - Test error handling

2. **Feature Confidence**
   - Verify calculations are correct
   - Ensure UI behaves consistently
   - Validate user flows
   - Check edge cases

3. **Refactoring Safety**
   - Safely update dependencies
   - Modernize code patterns
   - Split components
   - Optimize performance

4. **Documentation**
   - Tests serve as usage examples
   - Clear expected behavior
   - API contract validation
   - Integration patterns

### Common Test Scenarios:

1. **User Flow Tests**
   ```typescript
   // Ensure users can:
   - Log in and access protected routes
   - Create and edit food entries
   - Follow other users
   - Comment on posts
   ```

2. **Data Validation Tests**
   ```typescript
   // Verify that:
   - Food entries have required fields
   - Macros add up correctly
   - Dates are properly formatted
   - Images are valid
   ```

3. **Error Handling Tests**
   ```typescript
   // Check responses for:
   - Invalid API keys
   - Network failures
   - Invalid input data
   - Rate limiting
   ```

4. **Security Tests**
   ```typescript
   // Validate that:
   - Users can't access others' private data
   - JWT tokens are properly validated
   - Password rules are enforced
   - Rate limiting works
   ```

Would you like me to:
1. Explain more about any specific testing area?
2. Provide more examples for a particular feature?
3. Discuss testing tools and frameworks?
4. Explain test organization strategies?

## EXAMPLES

// Example: Testing the Login Form Component
describe('LoginForm', () => {
  it('should show error message with invalid credentials')
  it('should enable submit button only when form is valid')
  it('should store JWT token after successful login')
  it('should redirect to dashboard after login')
})

// Example: Testing Food Entry Card Component
describe('FoodEntryCard', () => {
  it('should display correct macros breakdown')
  it('should format date correctly')
  it('should show edit options only for user's own entries')
})