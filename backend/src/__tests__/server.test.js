/**
 * Basic server health test
 */

const request = require('supertest');
const express = require('express');

// Simple express app for testing
const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Geodesy Team Management API',
    version: '1.0.0',
    description: 'Backend API for surveying team management',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth/*',
      tasks: '/api/v1/tasks',
      teams: '/api/v1/teams',
      users: '/api/v1/users'
    }
  });
});

describe('Server Health Tests', () => {
  test('Health endpoint should return status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  test('API info endpoint should return version', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('endpoints');
  });
});

describe('Environment Tests', () => {
  test('Node.js version should be >= 18', () => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    expect(majorVersion).toBeGreaterThanOrEqual(18);
  });

  test('Test environment should be configured', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});