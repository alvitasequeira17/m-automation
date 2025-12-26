# Utility Bill Pay - Project Summary

This file contains the full project overview, test strategy, coverage, design decisions, and known limitations for the Utility Bill Pay test automation suite.

## 📋 Table of Contents
- Overview
- Test Strategy
- Project Structure
- Prerequisites
- Installation & Execution
- Test Coverage
- Design Decisions
- Assumptions
- Known Limitations

## Overview
Comprehensive automated testing suite for the Utility Bill Pay application, covering both API and UI testing using Playwright and TypeScript.

## Test Strategy
- Critical business logic (invoice creation, payment, status transitions)
- API contract validation and error handling
- End-to-end user workflows for invoice management
- Data integrity and prevention of duplicates
- Deterministic payment testing (amounts ending in 3/7 fail)
- Unique test data generation for shared environments

## Project Structure
```
m-automation/
├── tests/
│   ├── api/                          # API test suites
│   │   ├── health.api.spec.ts        # Health check endpoint
│   │   ├── invoices.api.spec.ts      # Invoice CRUD operations
│   │   └── payments.api.spec.ts      # Payment processing logic
│   ├── ui/                           # UI test suites
│   │   ├── pages/                    # Page Object Models
│   │   │   ├── invoice-list.page.ts
│   │   │   └── create-invoice-modal.page.ts
│   │   └── invoice-management.ui.spec.ts
│   └── helpers/                      # Shared utilities
│       ├── api-client.ts             # API wrapper with typed methods
│       ├── types.ts                  # TypeScript type definitions
│       └── test-data.ts              # Test data generators
├── playwright.config.ts              # Playwright configuration
├── Dockerfile                        # Docker setup
├── package.json
└── README.md
```

## Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- Chrome Browser (for UI tests)
- Docker (optional but recommended)

## Installation & Execution
### Using Docker
- Build: `docker build -t home-assignment .`
- Run all tests: `docker run --rm home-assignment`
- Run API tests: `docker run --rm home-assignment npm run test:api`
- Run UI tests: `docker run --rm home-assignment npm run test:ui`

### Local
- Install: `npm install`
- Run all: `npm test`
- API: `npm run test:api`
- UI: `npm run test:ui`
- Report: `npm run test:report`

## Test Coverage
- API: Invoice creation, payment, status transitions, error handling, filtering, pagination, idempotency, health check
- UI: Invoice list, creation, payment, status filtering, responsive design, error states

## Design Decisions
- Playwright for unified API/UI testing
- TypeScript for type safety
- Page Object Model for UI abstraction
- Unique test data for shared environment
- Deterministic payment logic
- Flexible UI selectors
