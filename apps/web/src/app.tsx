import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useStore } from 'zustand';
import { authStore } from './lib/auth';
import LoginPage from './routes/login';
import HomePage from './routes/index';
import CreateRoomPage from './routes/create-room';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(authStore, (s) => s.isAuthenticated);
  const isHydrated = useStore(authStore, (s) => s.isHydrated);

  if (!isHydrated) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(authStore, (s) => s.isAuthenticated);
  const isHydrated = useStore(authStore, (s) => s.isHydrated);

  if (!isHydrated) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
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
            <AuthGuard>
              <HomePage />
            </AuthGuard>
          }
        />
        <Route
          path="/create-room"
          element={
            <AuthGuard>
              <CreateRoomPage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
