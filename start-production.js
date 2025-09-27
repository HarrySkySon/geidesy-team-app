#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Geodesy Team Management System - Production Environment');
console.log('==================================================================');

// Check if .env files exist
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');

if (!fs.existsSync(backendEnvPath)) {
  console.log('⚠️  Backend .env file not found. Please copy from .env.example and configure.');
  process.exit(1);
}

// Start backend
console.log('📡 Starting Backend API Server...');
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

backendProcess.on('error', (error) => {
  console.error('❌ Backend startup error:', error);
});

// Wait a moment for backend to start
setTimeout(() => {
  // Start frontend if it exists
  const frontendPath = path.join(__dirname, 'frontend');
  if (fs.existsSync(frontendPath)) {
    console.log('🌐 Starting Frontend Development Server...');
    const frontendProcess = spawn('npm', ['start'], {
      cwd: frontendPath,
      stdio: 'inherit',
      shell: true
    });

    frontendProcess.on('error', (error) => {
      console.error('❌ Frontend startup error:', error);
    });
  } else {
    console.log('ℹ️  Frontend not found. Backend API running on http://localhost:3000');
    console.log('📚 API Documentation available at http://localhost:3000/api');
    console.log('💚 Health Check: http://localhost:3000/health');
  }
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...');
  backendProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('\n🔧 Development Environment Information:');
console.log('======================================');
console.log('Backend API: http://localhost:3000');
console.log('API Documentation: http://localhost:3000/api');
console.log('Health Check: http://localhost:3000/health');
console.log('WebSocket: ws://localhost:3000');
console.log('\n📚 API Endpoints:');
console.log('- POST /api/v1/auth/login - User authentication');
console.log('- GET  /api/v1/tasks - Get all tasks');
console.log('- GET  /api/v1/teams - Get all teams');
console.log('- GET  /api/v1/users - Get all users');
console.log('- POST /api/v1/tasks - Create new task');
console.log('- POST /api/v1/teams - Create new team');
console.log('\n🔐 Test Credentials:');
console.log('Admin: admin@geodesy.com / password123');
console.log('Supervisor: supervisor@geodesy.com / password123');
console.log('Team Member: member1@geodesy.com / password123');
console.log('\n💡 To stop the servers, press Ctrl+C');