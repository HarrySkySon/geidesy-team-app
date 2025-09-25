import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAppSelector, useAppDispatch } from '../store';
import { selectIsAuthenticated, selectAuthLoading, initializeAuth } from '../store/authSlice';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

import TasksScreen from '../screens/tasks/TasksScreen';
import TaskDetailsScreen from '../screens/tasks/TaskDetailsScreen';
import TaskFormScreen from '../screens/tasks/TaskFormScreen';

import MapsScreen from '../screens/maps/MapsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

import LoadingScreen from '../screens/common/LoadingScreen';

// Navigation types
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  TasksStackParamList,
} from '../types';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const TasksStack = createStackNavigator<TasksStackParamList>();

// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Tasks Stack Navigator
const TasksStackNavigator = () => {
  const theme = useTheme();
  
  return (
    <TasksStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <TasksStack.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{
          title: 'My Tasks',
        }}
      />
      <TasksStack.Screen 
        name="TaskDetails" 
        component={TaskDetailsScreen}
        options={{
          title: 'Task Details',
        }}
      />
      <TasksStack.Screen 
        name="TaskForm" 
        component={TaskFormScreen}
        options={({ route }) => ({
          title: route.params?.taskId ? 'Edit Task' : 'New Task',
        })}
      />
    </TasksStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  const theme = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerShown: false,
      }}
    >
      <MainTab.Screen
        name="TasksTab"
        component={TasksStackNavigator}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <Icon name="assignment" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="MapsTab"
        component={MapsScreen}
        options={{
          tabBarLabel: 'Maps',
          tabBarIcon: ({ color, size }) => (
            <Icon name="map" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
};

// Root App Navigator
const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);

  useEffect(() => {
    // Initialize authentication state when app starts
    dispatch(initializeAuth());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;