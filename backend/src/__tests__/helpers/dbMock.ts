// Mock database query function for testing
export const mockQuery = jest.fn()

jest.mock('../../config/database', () => ({
  query: mockQuery,
  getClient: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
}))
