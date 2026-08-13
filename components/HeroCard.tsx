import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Hero } from '../lib/types';
import { THEME } from '../lib/theme';
import { ageAtDeath, formatDateShort, publicMediaUrl } from '../lib/utils';
import { fetchWikiThumb } from '../lib/wiki';
import { canAutoEnrichHero, recordDisambiguator } from '../lib/heroRecords';

export default function HeroCard({ hero }: { hero: Hero }) {
  const photo = publicMediaUrl(hero.profile_photo_url);
  const [wikiPhoto, setWikiPhoto] = useState<string | null>(null);
  const age = ageAtDeath(hero.birth_date, hero.death_date);

  useEffect(() => {
    if (photo || !canAutoEnrichHero(hero)) return;
    let cancelled = false;
    fetchWikiThumb(hero.full_name).then((thumb) => {
      if (!cancelled && thumb) setWikiPhoto(thumb);
    });
    return () => {
      cancelled = true;
    };
  }, [hero, photo]);

  const shown = photo ?? wikiPhoto;

  return (
    <View style={styles.card}>
      {shown ? (
        <Image source={{ uri: shown }} style={styles.photo} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <Ionicons name="medal" size={36} color={THEME.colors.gold} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {hero.full_name}
          </Text>
          {hero.is_martyr ? (
            <View style={styles.badgeMartyr}>
              <Text style={styles.badgeMartyrText}>Şehit</Text>
            </View>
          ) : hero.is_veteran ? (
            <View style={styles.badgeVeteran}>
              <Text style={styles.badgeVeteranText}>Gazi</Text>
            </View>
          ) : null}
        </View>

        {(hero.rank || hero.unit) && (
          <Text style={styles.meta} numberOfLines={1}>
            {[hero.rank, hero.unit].filter(Boolean).join(' • ')}
          </Text>
        )}

        {recordDisambiguator(hero) ? (
          <Text style={styles.recordIdentity} numberOfLines={1}>
            {recordDisambiguator(hero)}
          </Text>
        ) : null}

        <View style={styles.datesRow}>
          {hero.birth_date && (
            <Text style={styles.dates}>
              {formatDateShort(hero.birth_date)} -{' '}
              {hero.is_martyr ? formatDateShort(hero.death_date) : hero.is_veteran ? 'Gazi' : ''}
              {age !== null ? ` (${age} yaş)` : ''}
            </Text>
          )}
          {hero.conflict && <Text style={styles.conflict}>{hero.conflict.name}</Text>}
        </View>

        {hero.summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {hero.summary}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  photo: {
    width: 72,
    height: 96,
    borderRadius: THEME.radius.md,
    backgroundColor: '#EEE7DA',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '700', color: THEME.colors.text, flexShrink: 1 },
  badgeMartyr: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeMartyrText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  badgeVeteran: {
    backgroundColor: THEME.colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeVeteranText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  meta: { color: THEME.colors.textMuted, fontSize: 13 },
  recordIdentity: { color: THEME.colors.primaryDark, fontSize: 11, fontWeight: '600' },
  datesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  dates: { color: THEME.colors.textMuted, fontSize: 12 },
  conflict: {
    color: THEME.colors.primaryDark,
    backgroundColor: '#FBE9EB',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  summary: { color: THEME.colors.textMuted, fontSize: 13, marginTop: 2 },
});
