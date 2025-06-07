import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, ToastAndroid } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements'; // 👈 Aquí el fix elegante
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../auth/AuthProvider';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, justLoggedIn, setJustLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user && justLoggedIn) {
      ToastAndroid.showWithGravity(
        `Bienvenido ${user.nombre}`,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
      setJustLoggedIn(false);
    }
  }, [user, justLoggedIn, setJustLoggedIn]);

  const activeTintColor =
    colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint;
  const inactiveTintColor =
    colorScheme === 'dark'
      ? Colors.dark.tabIconDefault
      : Colors.light.tabIconDefault;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarStyle: {
          backgroundColor:
            colorScheme === 'dark'
              ? Colors.dark.background
              : Colors.light.background,
          borderTopWidth: 0,
          height: 65 + Math.max(insets.bottom - 15, 0),
          paddingBottom: Math.max(insets.bottom - 15, 15),
          paddingTop: 8,
        },
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            android_ripple={{ color: 'transparent' }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkmark-done" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'User',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
