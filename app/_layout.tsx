import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/Colors'; // <--- importás tus colores
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './auth/AuthProvider'; // Import AuthProvider and useAuth

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Sora-Bold': require('../assets/fonts/Sora-Bold.ttf'),
    'Sora-Regular': require('../assets/fonts/Sora-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Wrap the main content with AuthProvider */}
        <AuthProvider>
          <LayoutContent theme={theme} />
        </AuthProvider>
        {/* Add Toast at the root level */}
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// New component to handle conditional rendering based on auth state
function LayoutContent({ theme }: { theme: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Show a loading indicator while the auth state is being determined
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    );
  } else {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    );
  }
}
