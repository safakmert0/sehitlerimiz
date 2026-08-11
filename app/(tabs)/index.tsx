import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { cacheHeroes, getCachedHeroes } from '../../lib/cache';
import { THEME } from '../../lib/theme';
import { SITE_TAGLINE } from '../../lib/utils';
import type { Conflict, Hero } from '../../lib/types';
import HeroCard from '../../components/HeroCard';

const PAGE_SIZE = 20;

type TypeFilter = 'all' | 'martyr' | 'veteran';

export default function HomeScreen() {
  const router = useRouter();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [endReached, setEndReached] = useState(false);
  const pageRef = useRef(0);

  const loadConflicts = useCallback(async () => {
    const { data, error } = await supabase
      .from('conflicts')
      .select('id, name, sort_order')
      .order('sort_order');
    if (!error && data) setConflicts(data as Conflict[]);
  }, []);

  const fetchPage = useCallback(
    async (page: number, replace: boolean) => {
      let queryBuilder = supabase
        .from('heroes')
        .select(
          `id, full_name, rank, unit, birth_date, birth_place, death_date, death_place,
           conflict_id, is_martyr, is_veteran, summary, story, profile_photo_url,
           grave_location, lat, lng, status, created_at,
           conflict:conflicts (id, name, sort_order)`
        )
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (typeFilter === 'martyr') queryBuilder = queryBuilder.eq('is_martyr', true);
      if (typeFilter === 'veteran') queryBuilder = queryBuilder.eq('is_veteran', true);
      if (conflictId) queryBuilder = queryBuilder.eq('conflict_id', conflictId);
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,unit.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;

      const raw = data ?? [];
      const mapped = raw.map((h) => ({
        ...h,
        conflict: Array.isArray(h.conflict) ? h.conflict[0] ?? null : (h.conflict ?? null),
      })) as Hero[];
      setHeroes((prev) => (replace ? mapped : [...prev, ...mapped]));
      setEndReached((data ?? []).length < PAGE_SIZE);
      if (replace && mapped.length > 0) {
        cacheHeroes(mapped.map((h) => ({ id: h.id, data: h }))).catch(() => {});
      }
      return mapped;
    },
    [query, typeFilter, conflictId]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setEndReached(false);
    pageRef.current = 0;
    try {
      await fetchPage(0, true);
    } catch (e) {
      console.warn('fetch hatası, önbellekten yükleniyor', e);
      const cached = await getCachedHeroes();
      setHeroes((cached as Hero[]).filter((h) => h.status === 'approved'));
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    loadConflicts();
    loadInitial();
  }, [loadConflicts, loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || endReached) return;
    setLoadingMore(true);
    pageRef.current += 1;
    try {
      await fetchPage(pageRef.current, false);
    } catch {
      pageRef.current -= 1;
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, endReached, fetchPage]);

  const filterChips: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'martyr', label: 'Şehitler' },
    { key: 'veteran', label: 'Gaziler' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.primary, THEME.colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.title}>Şehitlerimiz</Text>
        <Text style={styles.tagline}>{SITE_TAGLINE}</Text>
      </LinearGradient>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="İsim, birlik, şehir ara..."
            placeholderTextColor={THEME.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={loadInitial}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); loadInitial(); }}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.typeFilters}>
          {filterChips.map((c) => (
            <Pressable
              key={c.key}
              style={[styles.chip, typeFilter === c.key && styles.chipActive]}
              onPress={() => setTypeFilter(c.key)}
            >
              <Text style={[styles.chipText, typeFilter === c.key && styles.chipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.conflictFilters}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={conflicts}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.chip, conflictId === item.id && styles.chipActive]}
                onPress={() => setConflictId(conflictId === item.id ? null : item.id)}
              >
                <Text
                  style={[styles.chipText, conflictId === item.id && styles.chipTextActive]}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      ) : heroes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={THEME.colors.textMuted} />
          <Text style={styles.emptyText}>Kayıt bulunamadı</Text>
          <Text style={styles.emptySub}>
            Filtreleri değiştirin veya "Kayıt Ekle" bölümünden katkıda bulunun.
          </Text>
        </View>
      ) : (
        <FlatList
          data={heroes}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/hero/${item.id}`)}>
              <HeroCard hero={item} />
            </Pressable>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={THEME.colors.primary} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: { paddingTop: 64, paddingBottom: 24, paddingHorizontal: THEME.spacing.lg },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  searchRow: { paddingHorizontal: THEME.spacing.lg, marginTop: -16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    paddingHorizontal: THEME.spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: THEME.colors.text },
  filtersRow: { paddingVertical: THEME.spacing.sm, gap: THEME.spacing.sm },
  typeFilters: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
  },
  conflictFilters: { paddingHorizontal: THEME.spacing.lg },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  chipText: { fontSize: 13, color: THEME.colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: THEME.spacing.lg, gap: THEME.spacing.md, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: THEME.colors.text },
  emptySub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
