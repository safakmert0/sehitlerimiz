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

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError('Ad soyad, geçerli e-posta ve en az 6 karakterli şifre gerekli.');
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (error) {
      setError(
        error.message === 'User already registered'
          ? 'Bu e-posta zaten kayıtlı.'
          : error.message
      );
      return;
    }
    if (data.session) {
      router.replace('/(tabs)');
    } else {
      setError('Kayıt oluşturuldu. Lütfen e-postanızı doğrulayın.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <Text style={styles.subtitle}>
          Şehitlerimizin ve gazilerimizin hikayelerine katkıda bulunun.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          placeholderTextColor={THEME.colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
        />
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
          placeholder="Şifre (en az 6 karakter)"
          placeholderTextColor={THEME.colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={register}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          )}
        </Pressable>

        <Link href="/auth/login" style={styles.link}>
          Zaten hesabınız var mı? Giriş yapın
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
