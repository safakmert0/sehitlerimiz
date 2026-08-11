import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'E-posta veya şifre hatalı.'
        : error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>
          Katkıda bulunmak, anı bırakmak ve bildirim yapmak için giriş yapın.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor={THEME.colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor={THEME.colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={login}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Giriş Yap</Text>
          )}
        </Pressable>

        <Link href="/auth/register" style={styles.link}>
          Hesabınız yok mu? Kayıt olun
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  form: {
    flex: 1,
    justifyContent: 'center',
    padding: THEME.spacing.xl,
    gap: THEME.spacing.md,
  },
  title: { fontSize: 26, fontWeight: '800', color: THEME.colors.text },
  subtitle: { fontSize: 14, color: THEME.colors.textMuted, marginBottom: THEME.spacing.md },
  input: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    fontSize: 15,
    color: THEME.colors.text,
  },
  error: { color: THEME.colors.danger, fontSize: 13 },
  button: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: THEME.colors.primary, fontSize: 14, marginTop: THEME.spacing.sm },
});
