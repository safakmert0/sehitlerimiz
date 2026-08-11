import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../lib/theme';
import { REPORT_TYPE_LABELS } from '../../lib/types';
import type { Hero, HeroMedia, Report, Tribute } from '../../lib/types';

type Tab = 'heroes' | 'media' | 'reports' | 'tributes';

export default function AdminScreen() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('heroes');

  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [media, setMedia] = useState<HeroMedia[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<Hero | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [h, m, r, t] = await Promise.all([
      supabase
        .from('heroes')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('hero_media')
        .select('*, hero:heroes (id, full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('reports')
        .select('*, hero:heroes (id, full_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('tributes')
        .select('*, hero:heroes (id, full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    if (!h.error && h.data) setHeroes(h.data as Hero[]);
    if (!m.error && m.data) setMedia(m.data as HeroMedia[]);
    if (!r.error && r.data) setReports(r.data as Report[]);
    if (!t.error && t.data) setTributes(t.data as Tribute[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin, loadAll]);

  const approveHero = async (hero: Hero) => {
    const { error } = await supabase
      .from('heroes')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', hero.id);
    if (error) return Alert.alert('Hata', error.message);
    setHeroes((prev) => prev.filter((x) => x.id !== hero.id));
  };

  const rejectHero = async (hero: Hero) => {
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Gerekli', 'Red gerekçesi yazmalısınız.');
      return;
    }
    const { error } = await supabase
      .from('heroes')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', hero.id);
    if (error) return Alert.alert('Hata', error.message);
    setRejectReason('');
    setHeroes((prev) => prev.filter((x) => x.id !== hero.id));
  };

  const setMediaStatus = async (m: HeroMedia, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('hero_media').update({ status }).eq('id', m.id);
    if (error) return Alert.alert('Hata', error.message);
    setMedia((prev) => prev.filter((x) => x.id !== m.id));
  };

  const resolveReport = async (r: Report, status: 'resolved' | 'dismissed') => {
    const { error } = await supabase
      .from('reports')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', r.id);
    if (error) return Alert.alert('Hata', error.message);
    setReports((prev) => prev.filter((x) => x.id !== r.id));
  };

  const setTributeStatus = async (t: Tribute, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('tributes').update({ status }).eq('id', t.id);
    if (error) return Alert.alert('Hata', error.message);
    setTributes((prev) => prev.filter((x) => x.id !== t.id));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'heroes', label: `Kayıtlar (${heroes.length})` },
    { key: 'media', label: `Medya (${media.length})` },
    { key: 'reports', label: `Bildirimler (${reports.length})` },
    { key: 'tributes', label: `Anılar (${tributes.length})` },
  ];

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Bu sayfaya erişim yetkiniz yok.</Text>
      </View>
    );
  }

  const empty =
    heroes.length === 0 && media.length === 0 && reports.length === 0 && tributes.length === 0;

  const renderItem = () => {
    switch (tab) {
      case 'heroes':
        return heroes.map((item) => (
          <HeroRow
            key={item.id}
            hero={item}
            onApprove={() => approveHero(item)}
            onReject={() => setRejecting(item)}
          />
        ));
      case 'media':
        return media.map((item) => (
          <MediaRow
            key={item.id}
            media={item}
            onApprove={() => setMediaStatus(item, 'approved')}
            onReject={() => setMediaStatus(item, 'rejected')}
          />
        ));
      case 'reports':
        return reports.map((item) => (
          <ReportRow
            key={item.id}
            report={item}
            onResolve={() => resolveReport(item, 'resolved')}
            onDismiss={() => resolveReport(item, 'dismissed')}
          />
        ));
      case 'tributes':
        return tributes.map((item) => (
          <TributeRow
            key={item.id}
            tribute={item}
            onApprove={() => setTributeStatus(item, 'approved')}
            onReject={() => setTributeStatus(item, 'rejected')}
          />
        ));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {renderItem()}
          {empty && (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Bekleyen öğe yok.</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={rejecting !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRejecting(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Red Gerekçesi</Text>
            <Text style={styles.modalSub}>
              "{rejecting?.full_name}" kaydı neden reddedilsin?
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Örn. Doğrulanamayan bilgi, eksik tarih..."
              placeholderTextColor={THEME.colors.textMuted}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]}
                onPress={() => {
                  setRejecting(null);
                  setRejectReason('');
                }}
              >
                <Text style={styles.actionBtnText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.approveBtn, { flex: 1 }]}
                onPress={() => {
                  if (rejecting) rejectHero(rejecting);
                  setRejecting(null);
                }}
              >
                <Text style={styles.actionBtnText}>Reddi Onayla</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HeroRow({
  hero,
  onApprove,
  onReject,
}: {
  hero: Hero;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{hero.full_name}</Text>
      <Text style={styles.cardMeta}>
        {[hero.rank, hero.unit].filter(Boolean).join(' • ') || 'Bilgi yok'}
      </Text>
      <Text style={styles.cardMeta}>
        {hero.birth_date ?? '—'} - {hero.is_martyr ? hero.death_date ?? '—' : 'Gazi'}
      </Text>
      {hero.summary ? (
        <Text style={styles.cardBody} numberOfLines={3}>
          {hero.summary}
        </Text>
      ) : null}
      <View style={styles.cardActions}>
        <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={onApprove}>
          <Text style={styles.actionBtnText}>Onayla</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
          <Text style={styles.actionBtnText}>Reddet</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MediaRow({
  media,
  onApprove,
  onReject,
}: {
  media: HeroMedia;
  onApprove: () => void;
  onReject: () => void;
}) {
  const hero = media.hero ?? null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {hero?.full_name ?? 'Kahraman bilgisi yok'} — {media.type}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {media.url}
      </Text>
      {media.caption ? <Text style={styles.cardBody}>{media.caption}</Text> : null}
      <View style={styles.cardActions}>
        <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={onApprove}>
          <Text style={styles.actionBtnText}>Onayla</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
          <Text style={styles.actionBtnText}>Reddet</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReportRow({
  report,
  onResolve,
  onDismiss,
}: {
  report: Report;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const hero = report.hero ?? null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {REPORT_TYPE_LABELS[report.report_type]} — {hero?.full_name ?? 'Bilinmeyen'}
      </Text>
      {report.description ? <Text style={styles.cardBody}>{report.description}</Text> : null}
      <Text style={styles.cardMeta}>
        {new Date(report.created_at).toLocaleString('tr-TR')}
      </Text>
      <View style={styles.cardActions}>
        <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={onResolve}>
          <Text style={styles.actionBtnText}>Çözüldü</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={onDismiss}>
          <Text style={styles.actionBtnText}>Asılsız</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TributeRow({
  tribute,
  onApprove,
  onReject,
}: {
  tribute: Tribute;
  onApprove: () => void;
  onReject: () => void;
}) {
  const hero = tribute.hero ?? null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{hero?.full_name ?? 'Kahraman'}</Text>
      <Text style={styles.cardBody}>{tribute.message}</Text>
      <View style={styles.cardActions}>
        <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={onApprove}>
          <Text style={styles.actionBtnText}>Yayınla</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
          <Text style={styles.actionBtnText}>Reddet</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  tabRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  tabText: { fontSize: 13, color: THEME.colors.textMuted },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: THEME.spacing.lg, gap: THEME.spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 14, color: THEME.colors.textMuted },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: THEME.colors.text },
  cardMeta: { fontSize: 13, color: THEME.colors.textMuted },
  cardBody: { fontSize: 14, color: THEME.colors.text, lineHeight: 20 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.text },
  modalSub: { fontSize: 14, color: THEME.colors.textMuted },
  modalInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    minHeight: 80,
    fontSize: 14,
    color: THEME.colors.text,
    textAlignVertical: 'top',
    backgroundColor: THEME.colors.background,
  },
  modalActions: { flexDirection: 'row', gap: THEME.spacing.md },
  rejectInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.sm,
    padding: THEME.spacing.sm,
    fontSize: 13,
    color: THEME.colors.text,
    backgroundColor: THEME.colors.background,
  },
  cardActions: { flexDirection: 'row', gap: THEME.spacing.sm },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: THEME.colors.success },
  rejectBtn: { backgroundColor: THEME.colors.danger },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
