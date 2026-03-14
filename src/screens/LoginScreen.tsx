import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

type LoginScreenProps = {
  onGoRegister: () => void;
};

export function LoginScreen({ onGoRegister }: LoginScreenProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage('username 不能为空');
      return;
    }

    if (!password) {
      setErrorMessage('password 不能为空');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('password 长度必须 >= 6');
      return;
    }

    setErrorMessage('');
    try {
      await login(trimmedUsername, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败，请稍后重试';
      setErrorMessage(message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>登录后继续使用你的个人词库和复习进度</Text>

          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="请输入用户名"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="请输入密码"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.buttonGroup}>
            <Pressable style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Login</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onGoRegister}>
              <Text style={styles.secondaryButtonText}>Go to Register</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    gap: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  formSection: {
    gap: 16,
  },
  fieldGroup: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
    lineHeight: 20,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
});
