import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="modal" options={{
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
        headerShown: false,
      }} />
    </Stack>
  );
} 