import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../lib/theme';
import { formatDate } from '../lib/utils';
import type { Tribute } from '../lib/types';

export default function TributeItem({ tribute }: { tribute: Tribute }) {
  const name =
    (tribute.profile as unknown as { full_name?: string | null } | null)?.full_name ??
    'Anonim';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="heart" size={14} color={THEME.colors.primary} />
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.date}>{formatDate(tribute.created_at)}</Text>
      </View>
      <Text style={styles.message}>{tribute.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FBE9EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 13, fontWeight: '600', color: THEME.colors.text, flex: 1 },
  date: { fontSize: 11, color: THEME.colors.textMuted },
  message: { fontSize: 14, lineHeight: 21, color: THEME.colors.text },
});
