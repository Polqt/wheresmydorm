# Mobile Agent Guide

Scope: everything under `apps/native`.

This app is the React Native / Expo native client for the monorepo. Apply the repo-root instructions first, then use these mobile-specific rules when working in this directory.

## Stack and Architecture

- Runtime: Expo + React Native
- Routing: `expo-router`
- Styling: NativeWind utility classes, with stable style objects/constants when values are reused
- Server state: TanStack Query + tRPC
- Client state: Zustand selectors for focused subscriptions
- Images: `expo-image`
- Lists: `@shopify/flash-list`
- Animation: `react-native-reanimated`

## Required Mobile Rules

- Use `Pressable`, not `TouchableOpacity` or `TouchableHighlight`.
- Use `expo-image` for remote and local image rendering.
- Prefer `FlashList` for any rendered collection, including horizontal carousels. Do not map arrays inside `ScrollView` unless the child count is fixed and trivially small.
- Keep list items lightweight. Do not run queries or expensive derived work inside row components.
- Hoist list callbacks to the list root when practical and avoid inline object creation in list render paths.
- Do not use `{value && <Component />}` when `value` can be `0` or `""`. Use a ternary or explicit boolean coercion.
- Keep animations on `transform` and `opacity` when possible.
- Prefer native navigation primitives through `expo-router` and React Navigation's native-backed navigators.
- Keep native dependencies declared in `apps/native/package.json` so Expo autolinking works correctly.

## Project-Specific Conventions

- Preserve the existing route groups in `app/(finder-tabs)`, `app/(lister-tabs)`, and nested flows under `app/auth`, `app/messages`, `app/listings`, and `app/profile`.
- Reuse shared screen primitives from `components/ui` and screen modules from `components/screens` before creating new top-level patterns.
- Keep data access in hooks and services. Presentation components should receive prepared values and callbacks.
- Prefer Zustand selectors over broad store subscriptions in screen components.
- When adding new list UIs, provide `estimatedItemSize` for `FlashList`.
- When adding media browsing, prefer a native-feeling path first; avoid custom JS-heavy modal stacks unless there is a clear product reason.

## Review Checklist

- Is a mapped collection using `FlashList` instead of `ScrollView`?
- Are image components using `expo-image`?
- Are safe areas handled explicitly on full-screen views?
- Are list rows memo-friendly and free of queries?
- Are navigation changes consistent with `expo-router` file-based routing?
- Did any new native dependency also get added to `apps/native/package.json`?
