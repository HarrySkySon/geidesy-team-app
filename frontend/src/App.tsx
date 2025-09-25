import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { store } from '@store/index';
import { useAuth } from '@hooks/useAuth';

// Components
import { AppLayout } from '@components/Layout';
import { Login } from '@pages/Auth/Login';
import { Dashboard } from '@pages/Dashboard';
import { Tasks } from '@pages/Tasks';
import { Teams } from '@pages/Teams';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
  },
});

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requiredRoles = [] 
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Component
const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Protected Routes with Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Tasks Routes */}
          <Route path="tasks" element={<Tasks />} />
          
          {/* Teams Routes */}
          <Route path="teams" element={<Teams />} />
          
          {/* Locations Routes - Coming Soon */}
          <Route path="locations" element={
            <div>Locations Page - Coming Soon</div>
          } />
          
          {/* Reports Routes - Admin/Supervisor Only */}
          <Route path="reports" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERVISOR']}>
              <div>Reports Page - Coming Soon</div>
            </ProtectedRoute>
          } />
          
          {/* Users Routes - Admin Only */}
          <Route path="users" element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <div>Users Management - Coming Soon</div>
            </ProtectedRoute>
          } />
          
          {/* Profile Routes */}
          <Route path="profile" element={
            <div>Profile Page - Coming Soon</div>
          } />
          
          {/* Settings Routes */}
          <Route path="settings" element={
            <div>Settings Page - Coming Soon</div>
          } />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;