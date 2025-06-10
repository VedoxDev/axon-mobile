import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function Layout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { 
        backgroundColor: 'transparent',
        // Add padding for Android navigation buttons
        paddingBottom: Platform.OS === 'android' ? 20 : 0,
      },
    }}>
      <Stack.Screen name="taskScreen" options={{
        headerShown: false,
        contentStyle: { 
          backgroundColor: 'transparent',
          paddingBottom: 0, // Regular screen, let SafeAreaView handle it
        },
      }} />
      <Stack.Screen name="modal" options={{
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
        headerShown: false,
        contentStyle: { 
          backgroundColor: 'transparent',
          // Ensure modals have proper spacing from bottom
          paddingBottom: Platform.OS === 'android' ? 10 : 0,
        },
      }} />
      <Stack.Screen name="createTaskModal" options={{
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
        headerShown: false,
        contentStyle: { 
          backgroundColor: 'transparent',
          // Add spacing for keyboard and navigation
          paddingBottom: Platform.OS === 'android' ? 10 : 0,
        },
      }} />
      <Stack.Screen name="createSectionModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }} />
      <Stack.Screen name="editSectionModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }} />
      <Stack.Screen name="selectLabelsModal" options={{
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
        headerShown: false,
        contentStyle: { 
          backgroundColor: 'transparent',
          paddingBottom: Platform.OS === 'android' ? 10 : 0,
        },
      }} />
      <Stack.Screen name="moveTaskModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }} />
      <Stack.Screen name="deleteSectionModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }} />
      <Stack.Screen name="sectionOptionsModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }} />
    </Stack>
  );
} 