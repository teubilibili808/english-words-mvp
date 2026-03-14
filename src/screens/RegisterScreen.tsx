import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiPost } from '../utils/apiClient';

type RegisterScreenProps = {
  onGoLogin: () => void;
};

export function RegisterScreen({ onGoLogin }: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage('username 不能为空');
      setSuccessMessage('');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('password 长度必须 >= 6');
      setSuccessMessage('');
      return;
    }

    if (confirmPassword !== password) {
      setErrorMessage('confirmPassword 必须与 password 一致');
      setSuccessMessage('');
      return;
    }

    setErrorMessage('');
    try {
      await apiPost<{ success: boolean }>(
        '/auth/register',
        {
          username: trimmedUsername,
          password,
        },
        false
      );
      setSuccessMessage('注册成功，请登录');
      setTimeout(() => {
        onGoLogin();
      }, 600);
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败，请稍后重试';
      setErrorMessage(message);
      setSuccessMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Pressable style={styles.backButton} onPress={onGoLogin}>
          <Text style={styles.backButtonText}>返回 Login</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>创建账号后即可使用个人词库与复习记录</Text>

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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>confirmPassword</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="请再次输入密码"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <View style={styles.buttonGroup}>
            <Pressable style={styles.primaryButton} onPress={handleRegister}>
              <Text style={styles.primaryButtonText}>Register</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onGoLogin}>
              <Text style={styles.secondaryButtonText}>Go to Login</Text>
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
    gap: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
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
  successText: {
    fontSize: 14,
    color: '#166534',
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
