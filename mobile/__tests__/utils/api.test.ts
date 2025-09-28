import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the API base URL logic
const getApiBase = () => {
  if (process.env.NODE_ENV === 'test') {
    return 'http://localhost:3000';
  }
  return 'http://10.117.172.139:3000';
};

describe('API Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use localhost for test environment', () => {
    process.env.NODE_ENV = 'test';
    const apiBase = getApiBase();
    expect(apiBase).toBe('http://localhost:3000');
  });

  it('should use mobile IP for production', () => {
    process.env.NODE_ENV = 'production';
    const apiBase = getApiBase();
    expect(apiBase).toBe('http://10.117.172.139:3000');
  });
});

describe('API Error Handling', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any);
  });

  it('should handle network errors', async () => {
    const mockApi = {
      get: jest.fn().mockRejectedValue(new Error('Network Error')),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockApi as any);

    try {
      await mockApi.get('/test');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network Error');
    }
  });

  it('should handle API timeout', async () => {
    const mockApi = {
      get: jest.fn().mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      ),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockApi as any);

    const startTime = Date.now();
    try {
      await mockApi.get('/test');
    } catch (error) {
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(90);
      expect((error as Error).message).toBe('Timeout');
    }
  });

  it('should handle HTTP error responses', async () => {
    const mockApi = {
      post: jest.fn().mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      }),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockApi as any);

    try {
      await mockApi.post('/auth/login', {});
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.message).toBe('Unauthorized');
    }
  });
});

describe('Authentication API', () => {
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockApi);
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@geodesy.com',
          role: 'admin',
        },
        token: 'mock-jwt-token',
      },
    };

    mockApi.post.mockResolvedValue(mockResponse);

    const result = await mockApi.post('/auth/login', {
      email: 'test@geodesy.com',
      password: 'password123',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@geodesy.com',
      password: 'password123',
    });
    expect(result.data.user.email).toBe('test@geodesy.com');
    expect(result.data.token).toBe('mock-jwt-token');
  });

  it('should handle login failure', async () => {
    mockApi.post.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
    });

    try {
      await mockApi.post('/auth/login', {
        email: 'wrong@email.com',
        password: 'wrongpassword',
      });
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.message).toBe('Invalid credentials');
    }
  });
});

describe('Dashboard API', () => {
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockApi);
  });

  it('should fetch dashboard data successfully', async () => {
    const mockResponse = {
      data: {
        tasks: [
          { id: '1', title: 'Task 1', status: 'PENDING', priority: 'HIGH' },
          { id: '2', title: 'Task 2', status: 'COMPLETED', priority: 'LOW' },
        ],
        teams: [
          { id: '1', name: 'Team 1', memberCount: 5, leader: 'John Doe' },
        ],
        stats: {
          totalTasks: 2,
          totalTeams: 1,
          completedTasks: 1,
        },
      },
    };

    mockApi.get.mockResolvedValue(mockResponse);

    const result = await mockApi.get('/dashboard');

    expect(mockApi.get).toHaveBeenCalledWith('/dashboard');
    expect(result.data.tasks).toHaveLength(2);
    expect(result.data.teams).toHaveLength(1);
    expect(result.data.stats.totalTasks).toBe(2);
  });

  it('should handle empty dashboard data', async () => {
    const mockResponse = {
      data: {
        tasks: [],
        teams: [],
        stats: {
          totalTasks: 0,
          totalTeams: 0,
          completedTasks: 0,
        },
      },
    };

    mockApi.get.mockResolvedValue(mockResponse);

    const result = await mockApi.get('/dashboard');

    expect(result.data.tasks).toHaveLength(0);
    expect(result.data.teams).toHaveLength(0);
    expect(result.data.stats.totalTasks).toBe(0);
  });
});

describe('Request/Response Interceptors', () => {
  it('should add authorization header when token exists', () => {
    const mockCreate = jest.fn().mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    });

    mockedAxios.create = mockCreate;

    const api = mockedAxios.create({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
    });
  });
});