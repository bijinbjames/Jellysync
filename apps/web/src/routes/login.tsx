import { LoginForm } from '../features/auth';

export default function LoginPage() {
  return (
    <div className="flex-1 min-h-screen bg-surface flex items-center justify-center px-6">
      <LoginForm />
    </div>
  );
}
