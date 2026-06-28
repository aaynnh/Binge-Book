import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppAppearanceProvider, useAppAppearance } from '@/services/appearance';
import { AuthSessionProvider, useAuthSession } from '@/services/authSession';
import { getProfile, isProfileComplete } from '@/services/profile';

export const unstable_settings = {
  anchor: '(tabs)',
};

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errorScreen}>
      <Text style={styles.errorBrand}>BingeBook</Text>
      <Text style={styles.errorTitle}>The app hit a startup error</Text>
      <Text selectable style={styles.errorMessage}>{error.message}</Text>
      <TouchableOpacity activeOpacity={0.86} onPress={retry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <AppAppearanceProvider>
          <RootNavigator />
        </AppAppearanceProvider>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { isDark } = useAppAppearance();
  const { isReady, session } = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let isMounted = true;
    const isWelcomeRoute = pathname === "/";
    const isAuthRoute = pathname === "/sign-in" || pathname === "/create-account";
    const isAuthCallbackRoute = pathname === "/auth/callback";

    async function routeFromSession() {
      if (session && (isWelcomeRoute || isAuthRoute)) {
        const profile = await getProfile();

        if (isMounted) {
          router.replace(
            isProfileComplete(profile)
              ? ({ pathname: "/deck-loading", params: { mode: "resume" } } as never)
              : "/profile-setup"
          );
        }
        return;
      }

      if (!session && !isWelcomeRoute && !isAuthRoute && !isAuthCallbackRoute) {
        router.replace("/");
      }
    }

    void routeFromSession();

    return () => {
      isMounted = false;
    };
  }, [isReady, pathname, router, session]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-account" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
        <Stack.Screen name="taste-quiz" options={{ headerShown: false }} />
        <Stack.Screen name="mood-mode" options={{ headerShown: false }} />
        <Stack.Screen name="deck-loading" options={{ headerShown: false }} />
        <Stack.Screen name="deck" options={{ headerShown: false }} />
        <Stack.Screen name="book-detail" options={{ headerShown: false }} />
        <Stack.Screen name="reading-mode" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {!isReady ? (
        <View style={[styles.authLoading, { backgroundColor: isDark ? "#071323" : "#FFFAF0" }]}>
          <Text style={[styles.authLoadingBrand, { color: isDark ? "#FFFAF0" : "#071323" }]}>BingeBook</Text>
          <ActivityIndicator color="#D8AD55" size="small" />
          <Text style={[styles.authLoadingCopy, { color: isDark ? "rgba(255,250,240,0.58)" : "rgba(7,19,35,0.56)" }]}>Opening your shelf…</Text>
        </View>
      ) : null}
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    gap: 14,
    justifyContent: "center",
    zIndex: 100,
  },
  authLoadingBrand: {
    fontSize: 34,
    fontWeight: "900",
  },
  authLoadingCopy: {
    fontSize: 13,
    fontWeight: "800",
  },
  errorScreen: {
    alignItems: "center",
    backgroundColor: "#071323",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  errorBrand: {
    color: "#F1D99D",
    fontSize: 16,
    fontWeight: "900",
  },
  errorTitle: {
    color: "#FFFAF0",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center",
  },
  errorMessage: {
    color: "rgba(255,250,240,0.68)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    maxWidth: 340,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    marginTop: 22,
    minWidth: 150,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  retryButtonText: {
    color: "#071323",
    fontSize: 14,
    fontWeight: "900",
  },
});
