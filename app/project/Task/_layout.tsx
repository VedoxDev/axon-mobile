import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
    }}>
      <Stack.Screen name="modal" options={{
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
        headerShown: false,
      }} />
      <Stack.Screen name="createSectionModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
      }} />
      <Stack.Screen name="editSectionModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
      }} />
      <Stack.Screen name="selectLabelsModal" options={{
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
        headerShown: false,
      }} />
      <Stack.Screen name="moveTaskModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
      }} />
      <Stack.Screen name="deleteSectionModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
      }} />
      <Stack.Screen name="sectionOptionsModal" options={{
        presentation: 'transparentModal',
        animation: 'fade',
        headerShown: false,
      }} />
    </Stack>
  );
} 