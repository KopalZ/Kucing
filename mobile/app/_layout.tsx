import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      {/* Ini artinya: Semua file di folder ini otomatis jadi layar Stack */}
      <Stack.Screen name="index" /> 
      <Stack.Screen name="register" />
    </Stack>
  );
}