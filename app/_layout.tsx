import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/Colors'; // <--- importás tus colores
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './auth/AuthProvider'; // Import AuthProvider and useAuth
import { ProjectProvider } from '@/contexts/ProjectContext'; // Import ProjectProvider
import { UserProvider } from '@/contexts/UserContext'; // Import UserProvider

// LiveKit initialization
import { registerGlobals, AudioSession } from '@livekit/react-native';

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

  // Initialize LiveKit globals only (not audio session)
  useEffect(() => {
    registerGlobals();
    console.log('✅ LiveKit globals registered');
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Wrap the main content with AuthProvider */}
        <AuthProvider>
          {/* Wrap with UserProvider so user context is available throughout the app */}
          <UserProvider>
            {/* Wrap with ProjectProvider so project context is available throughout the app */}
            <ProjectProvider>
              <LayoutContent theme={theme} />
            </ProjectProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// New component to handle conditional rendering based on auth state
function LayoutContent({ theme }: { theme: any }) {
  const { user, isLoading, isAuthTransitioning } = useAuth();

  if (isLoading || isAuthTransitioning) {
    // Show a loading indicator while the auth state is being determined or transitioning
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Single Stack configuration with all routes defined
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Index route - entry point */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* Authentication routes */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="changePassword" options={{ headerShown: false }} />
        
        {/* Main app routes */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="call/[callId]" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[chatId]" options={{ headerShown: false }} />
        <Stack.Screen name="project/[projectId]" options={{ headerShown: false }} />
        
        {/* Not found route */}
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}
