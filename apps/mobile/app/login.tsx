import { View } from 'react-native';
import { LoginForm } from '../src/features/auth';

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <LoginForm />
    </View>
  );
}
