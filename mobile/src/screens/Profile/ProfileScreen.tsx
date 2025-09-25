import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useAppDispatch } from '../../store';
import { logoutUser } from '../../store/authSlice';

const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        Profile Screen
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onBackground }]}>
        Coming Soon
      </Text>
      
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
  },
  logoutButton: {
    marginTop: 20,
  },
});

export default ProfileScreen;