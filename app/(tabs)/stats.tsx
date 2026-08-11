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
import { demoHeroes, isDemoMode } from '../../lib/demo';
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

type Segment = 'total' | 'martyr' | 'veteran';

export default function StatsScreen() {
  const [allStats, setAllStats] = useState<Stats | null>(null);
  const [martyrStats, setMartyrStats] = useState<Stats | null>(null);
  const [veteranStats, setVeteranStats] = useState<Stats | null>(null);
  const [segment, setSegment] = useState<Segment>('total');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const compute = (subset: typeof demoHeroes) => {
    const perConflict = new Map<string, number>();
    subset.forEach((h) => {
      const key = h.conflict?.name ?? 'Diğer';
      perConflict.set(key, (perConflict.get(key) ?? 0) + 1);
    });
    const perYear = new Map<number, number>();
    subset
      .filter((h) => h.is_martyr && h.death_date)
      .forEach((h) => {
        const y = new Date(h.death_date!).getFullYear();
        perYear.set(y, (perYear.get(y) ?? 0) + 1);
      });
    const perCity = new Map<string, number>();
    subset
      .filter((h) => h.birth_place)
      .forEach((h) => {
        const c = h.birth_place!;
        perCity.set(c, (perCity.get(c) ?? 0) + 1);
      });
    return {
      total: subset.length,
      martyrs: subset.filter((h) => h.is_martyr).length,
      veterans: subset.filter((h) => h.is_veteran).length,
      per_conflict: [...perConflict.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      per_year: [...perYear.entries()].map(([year, count]) => ({ year, count })),
      per_city: [...perCity.entries()]
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      updated_at: new Date().toISOString(),
    };
  };

  const load = useCallback(async () => {
    if (isDemoMode()) {
      const approved = demoHeroes.filter((h) => h.status === 'approved');
      setAllStats(compute(approved));
      setMartyrStats(compute(approved.filter((h) => h.is_martyr)));
      setVeteranStats(compute(approved.filter((h) => h.is_veteran)));
      return;
    }
    if (!supabase) return;
    const { data, error } = await supabase.rpc('get_stats');
    if (error) {
      console.warn('İstatistik alınamadı:', error.message);
      return;
    }
    setAllStats(data as Stats);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const stats: Stats | null =
    segment === 'total' ? allStats : segment === 'martyr' ? martyrStats : veteranStats;

  if (loading || !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  const maxConflict = Math.max(1, ...stats.per_conflict.map((c) => c.count));
  const maxYear = Math.max(1, ...stats.per_year.map((y) => y.count));
  const total = allStats?.total || 0;
  const canSegment = isDemoMode();

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

      {canSegment ? (
        <View style={styles.segmentRow}>
          {(
            [
              ['total', 'Toplam'],
              ['martyr', 'Şehit'],
              ['veteran', 'Gazi'],
            ] as [Segment, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.segmentItem, segment === key && styles.segmentItemActive]}
              onPress={() => setSegment(key)}
            >
              <Text
                style={[styles.segmentText, segment === key && styles.segmentTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.bigCards}>
        <BigCard
          label="Toplam"
          value={total}
          icon="people"
          active={segment === 'total'}
          onPress={canSegment ? () => setSegment('total') : undefined}
        />
        <BigCard
          label="Şehit"
          value={stats.martyrs}
          icon="medal"
          highlight
          active={segment === 'martyr'}
          onPress={canSegment ? () => setSegment('martyr') : undefined}
        />
        <BigCard
          label="Gazi"
          value={stats.veterans}
          icon="shield-checkmark"
          active={segment === 'veteran'}
          onPress={canSegment ? () => setSegment('veteran') : undefined}
        />
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
  active,
  onPress,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  highlight?: boolean;
  active?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons
        name={icon}
        size={22}
        color={active || highlight ? THEME.colors.primary : THEME.colors.textMuted}
      />
      <Text style={[styles.bigValue, (active || highlight) && styles.bigValueHighlight]}>
        {value.toLocaleString('tr-TR')}
      </Text>
      <Text style={styles.bigLabel}>{label}</Text>
    </>
  );
  if (!onPress) {
    return <View style={[styles.bigCard, highlight && styles.bigCardHighlight]}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      style={[styles.bigCard, (active || highlight) && styles.bigCardActive]}
    >
      {content}
    </Pressable>
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
  bigCardActive: { borderColor: THEME.colors.primary, borderWidth: 2, backgroundColor: '#FBF3F4' },
  bigCardHighlight: { borderColor: THEME.colors.primary, borderWidth: 2 },
  segmentRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  segmentText: { fontSize: 14, fontWeight: '700', color: THEME.colors.textMuted },
  segmentTextActive: { color: THEME.colors.white },
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
