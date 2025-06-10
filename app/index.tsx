import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from './auth/AuthProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, redirect to main app
        router.replace('/(tabs)/home');
      } else {
        // User is not authenticated, redirect to login
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show loading screen while determining auth state
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: theme.background 
    }}>
      <ActivityIndicator size="large" color={theme.tint} />
    </View>
  );
} 