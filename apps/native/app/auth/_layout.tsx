import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="email" />
      <Stack.Screen name="email-code" />
      <Stack.Screen name="callback" />
      <Stack.Screen name="role-select" />
    </Stack>
  );
}
