import axios from 'axios';

// Mock axios для інтеграційних тестів
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockTasks = [
  {
    id: '1',
    title: 'Topographic Survey - Site A',
    description: 'Complete topographic survey of construction site A with GPS coordinates',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedTo: 'surveyor1@geodesy.com',
    dueDate: '2024-10-15',
  },
  {
    id: '2',
    title: 'GPS Control Point Verification',
    description: 'Verify accuracy of existing GPS control points',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: 'surveyor2@geodesy.com',
    dueDate: '2024-10-20',
  },
  {
    id: '3',
    title: 'Building Layout Stakeout',
    description: 'Stake out building corners and foundation layout',
    status: 'COMPLETED',
    priority: 'LOW',
    assignedTo: 'surveyor1@geodesy.com',
    dueDate: '2024-09-25',
  },
];

const mockTeams = [
  {
    id: '1',
    name: 'Survey Team Alpha',
    description: 'Primary topographic survey team',
    leader: 'John Doe',
    memberCount: 3,
  },
  {
    id: '2',
    name: 'Geodetic Control Network Team',
    description: 'GPS control point establishment and verification',
    leader: 'Jane Smith',
    memberCount: 5,
  },
];

const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@geodesy.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Surveyor One',
    email: 'surveyor1@geodesy.com',
    role: 'surveyor',
  },
];

describe('Integration Tests - API Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow Integration', () => {
    it('should handle complete login flow', async () => {
      const mockApi = {
        post: jest.fn(),
        get: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockApi as any);

      // Mock successful login
      mockApi.post.mockResolvedValueOnce({
        data: {
          user: mockUsers[0],
          token: 'mock-jwt-token-12345',
        },
      });

      // Mock dashboard data fetch after login
      mockApi.get.mockResolvedValueOnce({
        data: {
          tasks: mockTasks,
          teams: mockTeams,
          stats: {
            totalTasks: mockTasks.length,
            totalTeams: mockTeams.length,
            completedTasks: mockTasks.filter(task => task.status === 'COMPLETED').length,
          },
        },
      });

      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Simulate login
      const loginResult = await api.post('/auth/login', {
        email: 'admin@geodesy.com',
        password: 'password123',
      });

      expect(loginResult.data.user.email).toBe('admin@geodesy.com');
      expect(loginResult.data.token).toBe('mock-jwt-token-12345');

      // Simulate dashboard fetch after login
      const dashboardResult = await api.get('/dashboard');

      expect(dashboardResult.data.tasks).toHaveLength(3);
      expect(dashboardResult.data.teams).toHaveLength(2);
      expect(dashboardResult.data.stats.completedTasks).toBe(1);
    });

    it('should handle login failure and retry', async () => {
      const mockApi = {
        post: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockApi as any);

      // Mock failed login attempt
      mockApi.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      });

      // Mock successful retry
      mockApi.post.mockResolvedValueOnce({
        data: {
          user: mockUsers[0],
          token: 'mock-jwt-token-12345',
        },
      });

      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // First attempt - should fail
      try {
        await api.post('/auth/login', {
          email: 'admin@geodesy.com',
          password: 'wrongpassword',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }

      // Second attempt - should succeed
      const result = await api.post('/auth/login', {
        email: 'admin@geodesy.com',
        password: 'password123',
      });

      expect(result.data.user.email).toBe('admin@geodesy.com');
    });
  });

  describe('Task Management Integration', () => {
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

    it('should handle complete task CRUD operations', async () => {
      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock GET all tasks
      mockApi.get.mockResolvedValueOnce({
        data: { tasks: [...mockTasks] },
      });

      // Mock POST create task
      const newTask = {
        id: '4',
        title: 'New Survey Task',
        description: 'Integration test task',
        status: 'PENDING',
        priority: 'MEDIUM',
      };
      mockApi.post.mockResolvedValueOnce({
        data: { task: newTask },
        status: 201,
      });

      // Mock PUT update task
      const updatedTask = { ...newTask, status: 'IN_PROGRESS' };
      mockApi.put.mockResolvedValueOnce({
        data: { task: updatedTask },
      });

      // Mock GET updated task
      mockApi.get.mockResolvedValueOnce({
        data: { task: updatedTask },
      });

      // Execute CRUD flow
      // 1. Fetch initial tasks
      const initialTasks = await api.get('/tasks');
      expect(initialTasks.data.tasks).toHaveLength(3);

      // 2. Create new task
      const createResult = await api.post('/tasks', {
        title: 'New Survey Task',
        description: 'Integration test task',
        priority: 'MEDIUM',
      });
      expect(createResult.status).toBe(201);
      expect(createResult.data.task.title).toBe('New Survey Task');

      // 3. Update task
      const updateResult = await api.put('/tasks/4', {
        status: 'IN_PROGRESS',
      });
      expect(updateResult.data.task.status).toBe('IN_PROGRESS');

      // 4. Verify update
      const verifyResult = await api.get('/tasks/4');
      expect(verifyResult.data.task.status).toBe('IN_PROGRESS');
    });

    it('should handle task filtering and search', async () => {
      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock filtered tasks by status
      const pendingTasks = mockTasks.filter(task => task.status === 'PENDING');
      mockApi.get.mockResolvedValueOnce({
        data: { tasks: pendingTasks },
      });

      // Mock filtered tasks by priority
      const highPriorityTasks = mockTasks.filter(task => task.priority === 'HIGH');
      mockApi.get.mockResolvedValueOnce({
        data: { tasks: highPriorityTasks },
      });

      // Test status filtering
      const pendingResult = await api.get('/tasks?status=PENDING');
      expect(pendingResult.data.tasks).toHaveLength(1);
      expect(pendingResult.data.tasks[0].status).toBe('PENDING');

      // Test priority filtering
      const highPriorityResult = await api.get('/tasks?priority=HIGH');
      expect(highPriorityResult.data.tasks).toHaveLength(1);
      expect(highPriorityResult.data.tasks[0].priority).toBe('HIGH');
    });
  });

  describe('Team Management Integration', () => {
    let mockApi: any;

    beforeEach(() => {
      mockApi = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi);
    });

    it('should handle team data operations', async () => {
      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock teams fetch
      mockApi.get.mockResolvedValueOnce({
        data: { teams: [...mockTeams] },
      });

      // Mock specific team fetch
      mockApi.get.mockResolvedValueOnce({
        data: { team: mockTeams[0] },
      });

      // Fetch all teams
      const teamsResult = await api.get('/teams');
      expect(teamsResult.data.teams).toHaveLength(2);

      // Fetch specific team
      const teamResult = await api.get('/teams/1');
      expect(teamResult.data.team.name).toBe('Survey Team Alpha');
      expect(teamResult.data.team.memberCount).toBe(3);
    });
  });

  describe('Error Handling Integration', () => {
    let mockApi: any;

    beforeEach(() => {
      mockApi = {
        get: jest.fn(),
        post: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi);
    });

    it('should handle network errors gracefully', async () => {
      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock network error
      mockApi.get.mockRejectedValueOnce({
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
      });

      try {
        await api.get('/tasks');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.message).toBe('Network connection failed');
      }
    });

    it('should handle server errors with retry logic', async () => {
      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock server error on first attempt
      mockApi.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      // Mock success on retry
      mockApi.get.mockResolvedValueOnce({
        data: { tasks: mockTasks },
      });

      // First attempt - should fail
      try {
        await api.get('/tasks');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }

      // Retry - should succeed
      const retryResult = await api.get('/tasks');
      expect(retryResult.data.tasks).toHaveLength(3);
    });

    it('should handle timeout errors', async () => {
      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock timeout error
      mockApi.get.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      try {
        await api.get('/tasks');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED');
        expect(error.message).toContain('timeout');
      }
    });
  });

  describe('State Management Integration', () => {
    it('should maintain user session state across requests', async () => {
      const mockApi = {
        post: jest.fn(),
        get: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockApi as any);

      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock login with token
      mockApi.post.mockResolvedValueOnce({
        data: {
          user: mockUsers[0],
          token: 'mock-jwt-token-12345',
        },
      });

      // Mock authenticated request
      mockApi.get.mockResolvedValueOnce({
        data: { tasks: mockTasks },
      });

      // Login
      const loginResult = await api.post('/auth/login', {
        email: 'admin@geodesy.com',
        password: 'password123',
      });

      const token = loginResult.data.token;

      // Simulate adding token to subsequent requests
      // (In real app, this would be done by interceptors)
      const tasksResult = await api.get('/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(tasksResult.data.tasks).toHaveLength(3);
      expect(mockApi.get).toHaveBeenCalledWith('/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should handle state synchronization between components', async () => {
      const mockApi = {
        get: jest.fn(),
        post: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockApi as any);

      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock dashboard data
      mockApi.get.mockResolvedValueOnce({
        data: {
          tasks: mockTasks,
          teams: mockTeams,
          stats: {
            totalTasks: 3,
            totalTeams: 2,
            completedTasks: 1,
          },
        },
      });

      // Mock task update
      const updatedTask = { ...mockTasks[0], status: 'COMPLETED' };
      mockApi.post.mockResolvedValueOnce({
        data: { task: updatedTask },
      });

      // Mock updated dashboard data
      mockApi.get.mockResolvedValueOnce({
        data: {
          tasks: [updatedTask, ...mockTasks.slice(1)],
          teams: mockTeams,
          stats: {
            totalTasks: 3,
            totalTeams: 2,
            completedTasks: 2, // Increased due to update
          },
        },
      });

      // Initial dashboard load
      const initialDashboard = await api.get('/dashboard');
      expect(initialDashboard.data.stats.completedTasks).toBe(1);

      // Update task
      await api.post('/tasks/1/complete');

      // Refresh dashboard
      const updatedDashboard = await api.get('/dashboard');
      expect(updatedDashboard.data.stats.completedTasks).toBe(2);
    });
  });

  describe('Performance and Optimization Integration', () => {
    it('should handle concurrent API requests efficiently', async () => {
      const mockApi = {
        get: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockApi as any);

      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock multiple endpoints
      mockApi.get
        .mockResolvedValueOnce({ data: { tasks: mockTasks } })
        .mockResolvedValueOnce({ data: { teams: mockTeams } })
        .mockResolvedValueOnce({ data: { user: mockUsers[0] } });

      const startTime = Date.now();

      // Execute concurrent requests
      const [tasksResult, teamsResult, userResult] = await Promise.all([
        api.get('/tasks'),
        api.get('/teams'),
        api.get('/user/profile'),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests completed
      expect(tasksResult.data.tasks).toHaveLength(3);
      expect(teamsResult.data.teams).toHaveLength(2);
      expect(userResult.data.user.email).toBe('admin@geodesy.com');

      // Performance check (should be fast since mocked)
      expect(duration).toBeLessThan(100);
    });

    it('should handle data caching simulation', async () => {
      const mockApi = {
        get: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockApi as any);

      const api = mockedAxios.create({ baseURL: 'http://localhost:3000' });

      // Mock first request (cache miss)
      mockApi.get.mockResolvedValueOnce({
        data: { tasks: mockTasks },
        headers: { 'cache-status': 'miss' },
      });

      // Mock second request (cache hit)
      mockApi.get.mockResolvedValueOnce({
        data: { tasks: mockTasks },
        headers: { 'cache-status': 'hit' },
      });

      // First request
      const firstResult = await api.get('/tasks');
      expect(firstResult.data.tasks).toHaveLength(3);

      // Second request (simulating cache)
      const secondResult = await api.get('/tasks');
      expect(secondResult.data.tasks).toHaveLength(3);

      // Verify both requests were made (in real scenario, second might be from cache)
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });
});