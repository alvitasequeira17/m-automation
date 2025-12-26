# Utility Bill Pay - Test Automation Suite

## Quick Start: How to Run Tests

### Using Docker (Recommended)
1. Build the Docker image:
   ```bash
   docker build -t home-assignment .
   ```
2. Run all tests:
   ```bash
   docker run --rm home-assignment
   ```
3. Run only API tests:
   ```bash
   docker run --rm home-assignment npm run test:api
   ```
4. Run only UI tests:
   ```bash
   docker run --rm home-assignment npm run test:ui
   ```

### Running Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run all tests:
   ```bash
   npm test
   ```
3. Run only API tests:
   ```bash
   npm run test:api
   ```
4. Run only UI tests:
   ```bash
   npm run test:ui
   ```
5. View the test report:
   ```bash
   npm run test:report
   ```

### Environment Variables
- Override API/UI base URLs if needed:
  ```bash
  export API_BASE_URL=https://your-api-url.com
  export UI_BASE_URL=https://your-ui-url.com
  npm test
  ```

## Main Focus & Assumptions
- Tests cover invoice creation, payment, status transitions, and filtering.
- API contract and error handling are validated.
- Unique IDs are used to avoid data collisions in a shared environment.
- Payment failures are determined by the last digit of the amount (3 or 7).
- UI selectors are flexible to accommodate unknown implementation details.
- **Expired status Assumption:** Creating an invoice with a past due date did not result in an expired status during testing; auto-expiration may require additional system logic or time to take effect.

For full project details, see PROJECT_SUMMARY.md
