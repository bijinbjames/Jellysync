import '../global.css';
import { useEffect } from 'react';
import { Slot, Redirect, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useStore } from 'zustand';
import { authStore } from '../src/lib/auth';
import { WebSocketProvider } from '../src/shared/providers/websocket-provider';

SplashScreen.preventAutoHideAsync();

const INTENT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

let pendingDeepLink: string | null = null;
let pendingDeepLinkTimestamp: number | null = null;

function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const isAuthenticated = useStore(authStore, (s) => s.isAuthenticated);
  const isHydrated = useStore(authStore, (s) => s.isHydrated);

  if (!isHydrated) return null;

  const onLoginPage = segments[0] === 'login';

  // Capture pending deep link before redirecting to login
  if (!isAuthenticated && !onLoginPage) {
    const currentPath = '/' + segments.join('/');
    if (currentPath !== '/') {
      pendingDeepLink = currentPath;
      pendingDeepLinkTimestamp = Date.now();
    }
    return <Redirect href="/login" />;
  }

  // After login, check for pending deep link and navigate
  if (isAuthenticated && onLoginPage) {
    if (
      pendingDeepLink &&
      pendingDeepLinkTimestamp &&
      Date.now() - pendingDeepLinkTimestamp < INTENT_TIMEOUT_MS
    ) {
      const target = pendingDeepLink;
      pendingDeepLink = null;
      pendingDeepLinkTimestamp = null;
      return <Redirect href={target as any} />;
    }
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const isHydrated = useStore(authStore, (s) => s.isHydrated);
  const [fontsLoaded, fontError] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const fontsReady = fontsLoaded || fontError;

  useEffect(() => {
    if (fontsReady && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady, isHydrated]);

  if (!fontsReady) {
    return null;
  }

  return (
    <AuthGate>
      <WebSocketProvider>
        <Slot />
      </WebSocketProvider>
      <StatusBar style="light" />
    </AuthGate>
  );
}
