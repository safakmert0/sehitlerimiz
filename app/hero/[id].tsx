import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { THEME } from '../../lib/theme';
import { ageAtDeath, formatDate, openMapUrl, publicMediaUrl } from '../../lib/utils';
import type { Hero, HeroMedia, Tribute } from '../../lib/types';
import MediaGallery from '../../components/MediaGallery';
import TributeItem from '../../components/TributeItem';

export default function HeroDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [hero, setHero] = useState<Hero | null>(null);
  const [media, setMedia] = useState<HeroMedia[]>([]);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [tributeText, setTributeText] = useState('');
  const [sendingTribute, setSendingTribute] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [{ data: heroData }, { data: mediaData }, { data: tributesData }] = await Promise.all([
        supabase
          .from('heroes')
          .select(
            `*, conflict:conflicts (id, name, sort_order), 
             approved_media:hero_media (id, type, url, caption)`
          )
          .eq('id', id)
          .single(),
        supabase
          .from('hero_media')
          .select('id, hero_id, type, url, caption, status, created_at')
          .eq('hero_id', id)
          .eq('status', 'approved')
          .order('created_at', { ascending: true }),
        supabase
          .from('tributes')
          .select('id, hero_id, message, status, created_at, profile:profiles (full_name)')
          .eq('hero_id', id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      if (heroData) setHero(heroData as Hero);
      if (mediaData) setMedia(mediaData as HeroMedia[]);
      if (tributesData) setTributes(tributesData as unknown as Tribute[]);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const photos = useMemo(() => media.filter((m) => m.type === 'photo'), [media]);
  const videos = useMemo(() => media.filter((m) => m.type === 'video'), [media]);

  const reportHero = () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Bildirim yapmak için giriş yapmalısınız.');
      return;
    }
    Alert.prompt
      ? Alert.prompt(
          'Bildir',
          'Bu kayıtla ilgili sorunu kısaca açıklayın:',
          [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Gönder',
              onPress: async (desc: string | undefined) => {
                if (!desc?.trim()) return;
                const { error } = await supabase.from('reports').insert({
                  hero_id: hero?.id,
                  report_type: 'diger',
                  description: desc.trim(),
                  reported_by: user.id,
                });
                if (error) {
                  Alert.alert('Hata', error.message);
                } else {
                  Alert.alert('Teşekkürler', 'Bildiriminiz moderatörlerimize iletildi.');
                }
              },
            },
          ],
          'plain-text'
        )
      : Alert.alert('Bildir', 'Lütfen bildirim açıklamasını giriniz.');
  };

  const sendTribute = async () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Anı bırakmak için giriş yapmalısınız.');
      return;
    }
    const msg = tributeText.trim();
    if (!msg) return;
    setSendingTribute(true);
    const { error } = await supabase.from('tributes').insert({
      hero_id: hero?.id,
      user_id: user.id,
      message: msg,
    });
    setSendingTribute(false);
    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      setTributeText('');
      Alert.alert('Teşekkürler', 'Anınız moderatör onayından sonra yayınlanacaktır.');
    }
  };

  const shareHero = () => {
    if (!hero) return;
    const text = `${hero.full_name} — ${hero.is_martyr ? 'Şehit' : 'Gazi'} ${
      hero.conflict ? hero.conflict.name : ''
    }`;
    Linking.openURL(
      `https://wa.me/?text=${encodeURIComponent(text + ' — Şehitlerimiz uygulamasında')}`
    ).catch(() => {});
  };

  const age = ageAtDeath(hero?.birth_date ?? null, hero?.death_date ?? null);
  const photo = publicMediaUrl(hero?.profile_photo_url ?? null);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: hero?.full_name ?? '' }} />
      {loading || !hero ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.cover} contentFit="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="medal" size={64} color={THEME.colors.gold} />
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.badgesRow}>
              {hero.is_martyr && (
                <View style={styles.badgeMartyr}>
                  <Text style={styles.badgeText}>ŞEHİT</Text>
                </View>
              )}
              {hero.is_veteran && (
                <View style={styles.badgeVeteran}>
                  <Text style={styles.badgeText}>GAZİ</Text>
                </View>
              )}
              {hero.conflict && (
                <View style={styles.badgeConflict}>
                  <Text style={styles.badgeConflictText}>{hero.conflict.name}</Text>
                </View>
              )}
            </View>

            <Text style={styles.name}>{hero.full_name}</Text>
            {(hero.rank || hero.unit) && (
              <Text style={styles.rank}>
                {[hero.rank, hero.unit].filter(Boolean).join(' • ')}
              </Text>
            )}

            <View style={styles.infoCard}>
              {hero.birth_date && (
                <InfoRow
                  icon="calendar-outline"
                  label="Doğum"
                  value={`${formatDate(hero.birth_date)}${hero.birth_place ? ` — ${hero.birth_place}` : ''}`}
                />
              )}
              {hero.is_martyr && hero.death_date && (
                <InfoRow
                  icon="flag-outline"
                  label="Şehadet"
                  value={`${formatDate(hero.death_date)}${hero.death_place ? ` — ${hero.death_place}` : ''}`}
                  accent
                />
              )}
              {hero.is_veteran && hero.birth_place && (
                <InfoRow icon="location-outline" label="Memleket" value={hero.birth_place} />
              )}
              {age !== null && (
                <InfoRow icon="hourglass-outline" label="Yaş" value={`${age}`} />
              )}
              {hero.grave_location && (
                <Pressable
                  onPress={() =>
                    Linking.openURL(openMapUrl(hero.lat, hero.lng, hero.grave_location)).catch(() => {})
                  }
                >
                  <InfoRow
                    icon="map-outline"
                    label="Şehitlik / Kabir"
                    value={hero.grave_location}
                    link
                  />
                </Pressable>
              )}
            </View>

            {hero.summary ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Özet</Text>
                <Text style={styles.bodyText}>{hero.summary}</Text>
              </View>
            ) : null}

            {hero.story ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hayat Hikayesi</Text>
                <Text style={styles.bodyText}>{hero.story}</Text>
              </View>
            ) : null}

            {videos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Videolar</Text>
                <MediaGallery media={videos} />
              </View>
            )}

            {photos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fotoğraflar</Text>
                <MediaGallery media={photos} />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Anı Defteri</Text>
              {tributes.length === 0 && (
                <Text style={styles.bodyText}>Henüz anı bırakılmamış. Siz ilk olun.</Text>
              )}
              {tributes.map((t) => (
                <TributeItem key={t.id} tribute={t} />
              ))}

              <View style={styles.tributeBox}>
                <TextInput
                  style={styles.tributeInput}
                  placeholder="Şehidimiz için bir anı veya dua bırakın..."
                  placeholderTextColor={THEME.colors.textMuted}
                  multiline
                  value={tributeText}
                  onChangeText={setTributeText}
                />
                <Pressable
                  style={[styles.primaryButton, sendingTribute && { opacity: 0.6 }]}
                  onPress={sendTribute}
                  disabled={sendingTribute}
                >
                  <Text style={styles.primaryButtonText}>Gönder</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duyarlılık</Text>
              <View style={styles.actionRow}>
                <Pressable style={styles.actionButton} onPress={reportHero}>
                  <Ionicons name="flag" size={16} color={THEME.colors.danger} />
                  <Text style={styles.actionDangerText}>Bildir</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={shareHero}>
                  <Ionicons name="share-social" size={16} color={THEME.colors.primary} />
                  <Text style={styles.actionText}>Paylaş</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  accent,
  link,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent?: boolean;
  link?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={accent ? THEME.colors.primary : THEME.colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          accent && styles.infoValueAccent,
          link && styles.infoValueLink,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  scroll: { paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 280, backgroundColor: '#EEE7DA' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: THEME.spacing.lg, gap: THEME.spacing.lg },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badgeMartyr: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeVeteran: {
    backgroundColor: THEME.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  badgeConflict: {
    backgroundColor: '#FBE9EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeConflictText: { color: THEME.colors.primaryDark, fontSize: 12, fontWeight: '600' },
  name: { fontSize: 26, fontWeight: '800', color: THEME.colors.text },
  rank: { fontSize: 15, color: THEME.colors.textMuted, marginTop: -8 },
  infoCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { color: THEME.colors.textMuted, fontSize: 13, width: 88 },
  infoValue: { flex: 1, color: THEME.colors.text, fontSize: 14, fontWeight: '500' },
  infoValueAccent: { color: THEME.colors.primary, fontWeight: '700' },
  infoValueLink: { color: THEME.colors.primary, textDecorationLine: 'underline' },
  section: { gap: THEME.spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.text },
  bodyText: { fontSize: 15, lineHeight: 24, color: THEME.colors.text },
  tributeBox: { gap: THEME.spacing.sm, marginTop: THEME.spacing.sm },
  tributeInput: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.md,
    minHeight: 80,
    fontSize: 14,
    color: THEME.colors.text,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: THEME.spacing.md },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
  },
  actionText: { color: THEME.colors.primary, fontWeight: '600', fontSize: 14 },
  actionDangerText: { color: THEME.colors.danger, fontWeight: '600', fontSize: 14 },
});
