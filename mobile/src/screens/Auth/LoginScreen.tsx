import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, selectAuthLoading, selectAuthError } from '../../store/authSlice';
import { LoginRequest } from '../../types';
import { SIZES, COLORS } from '../../constants';

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const authError = useAppSelector(selectAuthError);

  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await dispatch(loginUser(data));
      
      if (loginUser.rejected.match(result)) {
        Alert.alert('Login Failed', result.payload as string);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Demo credentials
  const fillDemoCredentials = () => {
    setValue('email', 'admin@surveyteam.com');
    setValue('password', 'Admin123!');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon
            name="location-on"
            size={64}
            color={theme.colors.primary}
            style={styles.logo}
          />
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            Surveying Team
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onBackground }]}>
            Mobile App
          </Text>
        </View>

        {/* Login Form */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={[styles.formTitle, { color: theme.colors.onSurface }]}>
              Sign In
            </Text>

            {/* Email Field */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.email}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  left={<TextInput.Icon icon="email" />}
                />
              )}
            />
            {errors.email && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.email.message}
              </Text>
            )}

            {/* Password Field */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.password}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              )}
            />
            {errors.password && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.password.message}
              </Text>
            )}

            {/* Auth Error */}
            {authError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {authError}
              </Text>
            )}

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid || isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            {/* Demo Credentials */}
            <Divider style={styles.divider} />
            
            <Button
              mode="text"
              onPress={fillDemoCredentials}
              style={styles.demoButton}
              icon="account-circle"
            >
              Use Demo Credentials
            </Button>

            {/* Forgot Password */}
            <Button
              mode="text"
              onPress={() => {/* Navigate to forgot password */}}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.onBackground }]}>
            Don't have an account?
          </Text>
          <Button
            mode="text"
            onPress={() => {/* Navigate to register */}}
            style={styles.registerButton}
          >
            Sign Up
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    marginBottom: 24,
    elevation: 4,
  },
  cardContent: {
    padding: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 12,
  },
  loginButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContent: {
    height: 48,
  },
  divider: {
    marginVertical: 16,
  },
  demoButton: {
    marginBottom: 8,
  },
  forgotButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    marginRight: 8,
  },
  registerButton: {
    marginLeft: 0,
  },
});

export default LoginScreen;