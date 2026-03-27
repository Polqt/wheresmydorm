import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="email" />
      <Stack.Screen name="email-code" />
      <Stack.Screen name="callback" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="avatar-setup" />
      <Stack.Screen name="contact-info" />
      <Stack.Screen name="role-preferences" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
