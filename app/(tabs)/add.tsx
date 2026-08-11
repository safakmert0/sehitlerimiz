import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { isDemoMode } from '../../lib/demo';
import { THEME } from '../../lib/theme';
import type { Conflict } from '../../lib/types';

interface PickedMedia {
  uri: string;
  type: 'photo' | 'video';
  fileName: string;
}

export default function AddHeroScreen() {
  const { user } = useAuth();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('');
  const [unit, setUnit] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [isMartyr, setIsMartyr] = useState(true);
  const [isVeteran, setIsVeteran] = useState(false);
  const [summary, setSummary] = useState('');
  const [story, setStory] = useState('');
  const [graveLocation, setGraveLocation] = useState('');
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('conflicts')
        .select('id, name, sort_order')
        .order('sort_order');
      if (data) setConflicts(data as Conflict[]);
    })();
  }, []);

  const pickMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin Gerekli', 'Galeriye erişim izni verilmelidir.');
      return;
    }
    setPicking(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 10,
    });
    setPicking(false);
    if (result.canceled) return;
    const picked: PickedMedia[] = result.assets.map((a) => ({
      uri: a.uri,
      type: a.type === 'video' ? 'video' : 'photo',
      fileName: a.fileName ?? `media_${Date.now()}`,
    }));
    setMedia((prev) => [...prev, ...picked].slice(0, 10));
  }, []);

  const uploadMedia = async (heroId: string) => {
    const uploaded: { type: string; url: string; caption: string | null }[] = [];
    for (const m of media) {
      const ext = m.type === 'video' ? 'mp4' : 'jpg';
      const path = `${heroId}/${Date.now()}_${m.fileName.replace(/\s/g, '_')}.${ext}`;
      try {
        const file = new File(m.uri);
        const bytes = await file.bytes();
        const { error } = await supabase.storage
          .from('hero-media')
          .upload(path, bytes, {
            contentType: m.type === 'video' ? 'video/mp4' : 'image/jpeg',
            upsert: false,
          });
        if (!error) uploaded.push({ type: m.type, url: path, caption: null });
      } catch (e) {
        console.warn('Medya yüklenemedi:', e);
      }
    }
    if (uploaded.length > 0) {
      await supabase.from('hero_media').insert(
        uploaded.map((u) => ({ hero_id: heroId, ...u, uploaded_by: user?.id }))
      );
    }
    return uploaded;
  };

  const submit = async () => {
    if (isDemoMode()) {
      Alert.alert(
        'Demo Modu',
        'Bu sürüm örnek verilerle çalışmaktadır. Kayıt eklemek için uygulama veritabanına (Supabase) bağlanmalıdır.'
      );
      return;
    }
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Katkıda bulunmak için önce giriş yapmalısınız.');
      router.push('/auth/login');
      return;
    }
    if (fullName.trim().length < 3) {
      Alert.alert('Eksik Bilgi', 'Ad Soyad en az 3 karakter olmalıdır.');
      return;
    }
    if (!isMartyr && !isVeteran) {
      Alert.alert('Eksik Bilgi', 'Şehit veya Gazi seçmelisiniz.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('heroes')
        .insert({
          full_name: fullName.trim(),
          rank: rank.trim() || null,
          unit: unit.trim() || null,
          birth_date: birthDate.trim() || null,
          birth_place: birthPlace.trim() || null,
          death_date: isMartyr ? (deathDate.trim() || null) : null,
          death_place: isMartyr ? (deathPlace.trim() || null) : null,
          conflict_id: conflictId,
          is_martyr: isMartyr,
          is_veteran: isVeteran,
          summary: summary.trim() || null,
          story: story.trim() || null,
          grave_location: graveLocation.trim() || null,
          status: 'pending',
          created_by: user.id,
        })
        .select('id')
        .single();
      if (error) throw error;

      if (media.length > 0) {
        await uploadMedia(data.id);
      }

      Alert.alert(
        'Teşekkürler!',
        'Kaydınız alındı. Moderatör onayından sonra yayınlanacaktır.',
        [{ text: 'Tamam', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleType = (martyr: boolean) => {
    setIsMartyr(martyr);
    setIsVeteran(!martyr);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Şehit / Gazi Kaydı Ekle</Text>
        <Text style={styles.subtitle}>
          Bilgilerini paylaşmak istediğiniz kahramanın kaydını oluşturun. Kayıtlar
          moderatör onayından sonra yayınlanır.
        </Text>

        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeButton, isMartyr && styles.typeButtonActive]}
            onPress={() => toggleType(true)}
          >
            <Ionicons
              name="medal"
              size={20}
              color={isMartyr ? '#fff' : THEME.colors.primary}
            />
            <Text style={[styles.typeText, isMartyr && styles.typeTextActive]}>Şehit</Text>
          </Pressable>
          <Pressable
            style={[styles.typeButton, isVeteran && styles.typeButtonActive]}
            onPress={() => toggleType(false)}
          >
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={isVeteran ? '#fff' : THEME.colors.gold}
            />
            <Text style={[styles.typeText, isVeteran && styles.typeTextActive]}>Gazi</Text>
          </Pressable>
        </View>

        <Input label="Ad Soyad *" value={fullName} onChangeText={setFullName} placeholder="Örn. Mehmet Yılmaz" />
        <RowInputs
          left={<Input label="Rütbe" value={rank} onChangeText={setRank} placeholder="Örn. P. Uzm. Çvş." />}
          right={<Input label="Birlik" value={unit} onChangeText={setUnit} placeholder="Örn. 2. Komando Tug." />}
        />
        <RowInputs
          left={<Input label="Doğum Tarihi" value={birthDate} onChangeText={setBirthDate} placeholder="GG.AA.YYYY" />}
          right={<Input label="Doğum Yeri" value={birthPlace} onChangeText={setBirthPlace} placeholder="Örn. Adıyaman" />}
        />
        {isMartyr && (
          <RowInputs
            left={<Input label="Şehadet Tarihi" value={deathDate} onChangeText={setDeathDate} placeholder="GG.AA.YYYY" />}
            right={<Input label="Şehadet Yeri" value={deathPlace} onChangeText={setDeathPlace} placeholder="Örn. Hakkari" />}
          />
        )}
        <Input label="Şehitlik / Kabir" value={graveLocation} onChangeText={setGraveLocation} placeholder="Örn. Ankara Şehitliği" />

        <Text style={styles.label}>Savaş / Operasyon</Text>
        <View style={styles.conflictWrap}>
          {conflicts.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, conflictId === c.id && styles.chipActive]}
              onPress={() => setConflictId(conflictId === c.id ? null : c.id)}
            >
              <Text style={[styles.chipText, conflictId === c.id && styles.chipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input
          label="Özet"
          value={summary}
          onChangeText={setSummary}
          placeholder="Kısa özet (2-3 cümle)"
          multiline
        />
        <Input
          label="Hayat Hikayesi"
          value={story}
          onChangeText={setStory}
          placeholder="Doğumu, ailesi, askerlik dönemi, şehadeti/gaziliği, kahramanlıkları..."
          multiline
        />

        <Text style={styles.label}>Fotoğraf / Video</Text>
        {media.length > 0 && (
          <View style={styles.mediaRow}>
            {media.map((m, i) => (
              <View key={`${m.uri}-${i}`} style={styles.mediaThumb}>
                <Image source={{ uri: m.uri }} style={styles.mediaThumbImage} contentFit="cover" />
                {m.type === 'video' && (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={12} color="#fff" />
                  </View>
                )}
                <Pressable
                  style={styles.removeMedia}
                  onPress={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Pressable
          style={[styles.mediaButton, picking && { opacity: 0.6 }]}
          onPress={pickMedia}
          disabled={picking}
        >
          {picking ? (
            <ActivityIndicator color={THEME.colors.primary} />
          ) : (
            <>
              <Ionicons name="images-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.mediaButtonText}>
                {media.length > 0 ? 'Daha fazla ekle' : 'Galeriden seç'}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.submitButton, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Onaya Gönder</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={THEME.colors.textMuted}
        multiline={multiline}
      />
    </View>
  );
}

function RowInputs({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowItem}>{left}</View>
      <View style={styles.rowItem}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  scroll: { padding: THEME.spacing.lg, paddingBottom: 48, gap: THEME.spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: THEME.colors.text },
  subtitle: { fontSize: 14, color: THEME.colors.textMuted, lineHeight: 21 },
  typeRow: { flexDirection: 'row', gap: THEME.spacing.md },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.card,
  },
  typeButtonActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  typeText: { fontSize: 15, fontWeight: '700', color: THEME.colors.text },
  typeTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: THEME.spacing.md },
  rowItem: { flex: 1 },
  inputWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: THEME.colors.text },
  input: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    fontSize: 15,
    color: THEME.colors.text,
  },
  inputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  conflictWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: THEME.spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  chipText: { fontSize: 13, color: THEME.colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: THEME.spacing.sm },
  mediaThumb: { width: 90, height: 90 },
  mediaThumbImage: { width: '100%', height: '100%', borderRadius: THEME.radius.md },
  videoBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 3,
  },
  removeMedia: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: THEME.colors.danger,
    borderRadius: 999,
    padding: 3,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.primary,
  },
  mediaButtonText: { color: THEME.colors.primary, fontWeight: '600', fontSize: 15 },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
