import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../lib/theme';

interface ConflictStat {
  name: string | null;
  count: number;
}
interface YearStat {
  year: number;
  count: number;
}
interface CityStat {
  city: string;
  count: number;
}
interface Stats {
  total: number;
  martyrs: number;
  veterans: number;
  per_conflict: ConflictStat[];
  per_year: YearStat[];
  per_city: CityStat[];
  updated_at: string;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_stats');
    if (error) {
      console.warn('İstatistik alınamadı:', error.message);
      return;
    }
    setStats(data as Stats);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading || !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  const maxConflict = Math.max(1, ...stats.per_conflict.map((c) => c.count));
  const maxYear = Math.max(1, ...stats.per_year.map((y) => y.count));
  const total = stats.total || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={THEME.colors.primary} />
      }
    >
      <LinearGradient colors={[THEME.colors.primary, THEME.colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Şehitlerimiz Sayılarla</Text>
        <Text style={styles.headerSub}>Kayıtlı kahramanlarımızın güncel sayıları</Text>
      </LinearGradient>

      <View style={styles.bigCards}>
        <BigCard label="Toplam" value={total} icon="people" />
        <BigCard label="Şehit" value={stats.martyrs} icon="medal" highlight />
        <BigCard label="Gazi" value={stats.veterans} icon="shield-checkmark" />
      </View>

      <Text style={styles.sectionTitle}>Savaş / Operasyon Kategorileri</Text>
      <View style={styles.card}>
        {stats.per_conflict.length === 0 && <Text style={styles.muted}>Veri yok</Text>}
        {stats.per_conflict.map((c, i) => (
          <View key={`${c.name}-${i}`} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {c.name ?? 'Diğer'}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(4, (c.count / maxConflict) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.barCount}>{c.count}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Şehadet Yıllarına Göre</Text>
      <View style={styles.card}>
        {stats.per_year.length === 0 && <Text style={styles.muted}>Veri yok</Text>}
        {[...stats.per_year]
          .sort((a, b) => b.year - a.year)
          .slice(0, 30)
          .map((y, i) => (
            <View key={`${y.year}-${i}`} style={styles.barRow}>
              <Text style={[styles.barLabel, { width: 52 }]}>{y.year}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    styles.barFillYear,
                    { width: `${Math.max(4, (y.count / maxYear) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{y.count}</Text>
            </View>
          ))}
      </View>

      <Text style={styles.sectionTitle}>Memleketlere Göre (İlk 10)</Text>
      <View style={styles.card}>
        {stats.per_city.length === 0 && <Text style={styles.muted}>Veri yok</Text>}
        {stats.per_city.map((c, i) => (
          <View key={`${c.city}-${i}`} style={styles.cityRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{i + 1}</Text>
            </View>
            <Text style={styles.cityName} numberOfLines={1}>
              {c.city}
            </Text>
            <Text style={styles.cityCount}>{c.count}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        Son güncelleme: {new Date(stats.updated_at).toLocaleString('tr-TR')}
      </Text>
    </ScrollView>
  );
}

function BigCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.bigCard, highlight && styles.bigCardHighlight]}>
      <Ionicons
        name={icon}
        size={22}
        color={highlight ? THEME.colors.primary : THEME.colors.textMuted}
      />
      <Text style={[styles.bigValue, highlight && styles.bigValueHighlight]}>
        {value.toLocaleString('tr-TR')}
      </Text>
      <Text style={styles.bigLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  scroll: { paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 64, paddingBottom: 28, paddingHorizontal: THEME.spacing.lg },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  bigCards: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    marginTop: -18,
  },
  bigCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  bigCardHighlight: { borderColor: THEME.colors.primary, borderWidth: 2 },
  bigValue: { fontSize: 24, fontWeight: '800', color: THEME.colors.text },
  bigValueHighlight: { color: THEME.colors.primary },
  bigLabel: { fontSize: 12, color: THEME.colors.textMuted },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.text,
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.sm,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.sm },
  barLabel: { width: 150, fontSize: 13, color: THEME.colors.text },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EFE9DD',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5, backgroundColor: THEME.colors.primary },
  barFillYear: { backgroundColor: THEME.colors.gold },
  barCount: { width: 44, textAlign: 'right', fontSize: 13, fontWeight: '700', color: THEME.colors.text },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.md },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FBE9EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 13, fontWeight: '800', color: THEME.colors.primary },
  cityName: { flex: 1, fontSize: 14, color: THEME.colors.text },
  cityCount: { fontSize: 14, fontWeight: '700', color: THEME.colors.text },
  muted: { fontSize: 13, color: THEME.colors.textMuted },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xl,
  },
});
