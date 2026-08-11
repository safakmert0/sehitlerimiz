import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { THEME } from '../../lib/theme';
import { STATUS_LABELS } from '../../lib/types';
import type { Hero } from '../../lib/types';

export default function ProfileScreen() {
  const { user, profile, isAdmin, loading, refreshProfile } = useAuth();
  const [myHeroes, setMyHeroes] = useState<Hero[]>([]);
  const [loadingHeroes, setLoadingHeroes] = useState(false);

  const loadMyHeroes = useCallback(async () => {
    if (!user) {
      setMyHeroes([]);
      return;
    }
    setLoadingHeroes(true);
    const { data } = await supabase
      .from('heroes')
      .select('id, full_name, status, is_martyr, is_veteran, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMyHeroes(data as Hero[]);
    setLoadingHeroes(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadMyHeroes();
    }, [loadMyHeroes])
  );

  const logout = async () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const statusColor = (s: string) =>
    s === 'approved'
      ? THEME.colors.success
      : s === 'pending'
        ? THEME.colors.gold
        : THEME.colors.danger;

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Ionicons
                  name={user ? 'person' : 'person-outline'}
                  size={36}
                  color={THEME.colors.primary}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>
                  {user ? profile?.full_name || 'Kullanıcı' : 'Misafir'}
                </Text>
                <Text style={styles.email}>
                  {user ? profile?.role.toUpperCase() : 'Giriş yapmadan gezinmektesiniz'}
                </Text>
              </View>
              {user && !loading && (
                <Pressable onPress={logout} style={styles.logoutBtn}>
                  <Ionicons name="log-out-outline" size={20} color={THEME.colors.primary} />
                </Pressable>
              )}
            </View>

            {isAdmin && (
              <Pressable
                style={styles.adminCard}
                onPress={() => router.push('/admin')}
              >
                <View style={styles.adminIcon}>
                  <Ionicons name="shield-checkmark" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminTitle}>Moderasyon Paneli</Text>
                  <Text style={styles.adminSub}>
                    Bekleyen kayıtlar, bildirimler ve anılar
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Pressable>
            )}

            {!user ? (
              <View style={styles.authCard}>
                <Text style={styles.authText}>
                  Katkıda bulunmak, anı bırakmak ve bildirim yapmak için giriş yapın.
                </Text>
                <Link href="/auth/login" asChild>
                  <Pressable style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Giriş Yap</Text>
                  </Pressable>
                </Link>
                <Link href="/auth/register" style={styles.secondaryLink}>
                  Hesabınız yok mu? Kayıt olun
                </Link>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Katkılarım</Text>
                {loadingHeroes ? (
                  <ActivityIndicator style={{ marginVertical: 20 }} color={THEME.colors.primary} />
                ) : myHeroes.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Henüz katkınız yok. "Kayıt Ekle" sekmesinden ilk katkınızı yapın.
                  </Text>
                ) : null}
              </>
            )}
          </>
        }
        data={myHeroes}
        keyExtractor={(h) => h.id}
        ItemSeparatorComponent={() => <View style={{ height: THEME.spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.heroRow}
            onPress={() => router.push(`/hero/${item.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{item.full_name}</Text>
              <Text style={styles.heroMeta}>
                {item.is_martyr ? 'Şehit' : 'Gazi'} •{' '}
                {new Date(item.created_at).toLocaleDateString('tr-TR')}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
              <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  scroll: { padding: THEME.spacing.lg, gap: THEME.spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: THEME.colors.text },
  email: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 2 },
  logoutBtn: { padding: 8 },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  adminSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  authCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  authText: { fontSize: 14, color: THEME.colors.textMuted, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryLink: { color: THEME.colors.primary, fontSize: 14, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.text, marginTop: THEME.spacing.sm },
  emptyText: { fontSize: 14, color: THEME.colors.textMuted, lineHeight: 20 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.md,
  },
  heroName: { fontSize: 15, fontWeight: '600', color: THEME.colors.text },
  heroMeta: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
