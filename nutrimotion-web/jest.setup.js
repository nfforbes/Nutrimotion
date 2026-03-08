import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.AUTH0_SECRET = 'test-secret-key-must-be-at-least-32-characters-long'
process.env.AUTH0_BASE_URL = 'http://localhost:3030'
process.env.AUTH0_ISSUER_BASE_URL = 'https://test.auth0.com'
process.env.AUTH0_CLIENT_ID = 'test-client-id'
process.env.AUTH0_CLIENT_SECRET = 'test-client-secret'
process.env.MONGODB_URI = 'mongodb://localhost:27017/nutrimotion-test'
