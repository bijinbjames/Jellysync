import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { useStore } from 'zustand';
import { authStore } from './lib/auth';
import { WebSocketProvider } from './shared/providers/websocket-provider';
import LoginPage from './routes/login';
import HomePage from './routes/index';
import CreateRoomPage from './routes/create-room';
import JoinPage from './routes/join';
import RoomLobbyPage from './routes/room/lobby';

const PENDING_DEEP_LINK_KEY = 'pendingDeepLink';
const PENDING_DEEP_LINK_TS_KEY = 'pendingDeepLinkTimestamp';
const INTENT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(authStore, (s) => s.isAuthenticated);
  const isHydrated = useStore(authStore, (s) => s.isHydrated);
  const location = useLocation();

  if (!isHydrated) return null;
  if (!isAuthenticated) {
    // Preserve the current path for post-login redirect
    if (location.pathname !== '/') {
      sessionStorage.setItem(PENDING_DEEP_LINK_KEY, location.pathname);
      sessionStorage.setItem(PENDING_DEEP_LINK_TS_KEY, String(Date.now()));
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(authStore, (s) => s.isAuthenticated);
  const isHydrated = useStore(authStore, (s) => s.isHydrated);

  if (!isHydrated) return null;
  if (isAuthenticated) {
    // Check for pending deep link after login
    const pendingLink = sessionStorage.getItem(PENDING_DEEP_LINK_KEY);
    const pendingTs = sessionStorage.getItem(PENDING_DEEP_LINK_TS_KEY);
    if (pendingLink) {
      sessionStorage.removeItem(PENDING_DEEP_LINK_KEY);
      sessionStorage.removeItem(PENDING_DEEP_LINK_TS_KEY);
      const isExpired = pendingTs && Date.now() - Number(pendingTs) >= INTENT_TIMEOUT_MS;
      if (!isExpired) {
        return <Navigate to={pendingLink} replace />;
      }
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AuthenticatedRoutes({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <WebSocketProvider>{children}</WebSocketProvider>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route
          path="/"
          element={
            <AuthenticatedRoutes>
              <HomePage />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/join"
          element={
            <AuthenticatedRoutes>
              <JoinPage />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/create-room"
          element={
            <AuthenticatedRoutes>
              <CreateRoomPage />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/room/:code"
          element={
            <AuthenticatedRoutes>
              <RoomLobbyPage />
            </AuthenticatedRoutes>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
