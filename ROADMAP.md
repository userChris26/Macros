# ROADMAP

- Finish Mobile Version

## TESTING
- Create unit tests and show in powerpoint (routes, userflow...)
- Perform full end to end tests with new users
- Create accounts on the app and track your foods for 2 days, try to break stuff
- Test all endpoints, delete user, delete meal, delete pic / replace...

## PRESENTATION
- Create Powerpoint, ERD, UseCase, rehearse
- Gantt Chart
- Swagger and API documentation with one working endpoint

## DETAILS
- Stats by user profile, ensure they change their settings in db
- Accessibility and lighthouse and responsiveness
- Banner ensure works in light mode (improve hero)(iphone screenshots)
- Sort foods by genericness
- Don't say can't find anything before they search
- Don't shown own user in search users
- About / help page for users
- "Social calorie tracker" everywhere
- keyboard navigation

## TECHNICAL REFERENCE

### Meal System Architecture
The app uses a hierarchical meal-based system where:
- Each user has multiple meals per day (breakfast, lunch, dinner, snack)
- Each meal can have:
  - Multiple food entries
  - One photo
  - Metadata (date, type, etc.)

### Data Flow
1. User adds food:
   - Food details fetched from USDA API
   - FoodEntry created and stored
   - Meal created/updated to include the food entry
   - Nutrients calculated per serving

### Key API Endpoints
- `/api/meal/:userId/:date/:mealType` - Get meal with foods and photo
- `/api/addfood` - Add food entry and associate with meal
- `/api/meal/photo` - Upload/update meal photo

### Database Relations
- User -> Meals (one-to-many)
- Meal -> FoodEntries (one-to-many)
- Meal -> Photo (one-to-one)

### Social Feed
- Fetches meals (not individual foods) from followed users
- Displays in reverse chronological order
- Shows meal photos and aggregated nutrients
- Groups foods by meal time

### Nutrient Calculations
- USDA API returns nutrients per 100g
- Backend converts to per-serving values
- Frontend displays total nutrients per meal
- Accounts for serving size in calculations