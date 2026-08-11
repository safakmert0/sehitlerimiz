import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../lib/theme';
import { publicMediaUrl } from '../lib/utils';
import type { HeroMedia } from '../lib/types';

export default function MediaGallery({ media }: { media: HeroMedia[] }) {
  const hasVideo = media.some((m) => m.type === 'video');

  if (hasVideo) {
    return (
      <View style={styles.gallery}>
        {media.map((item) =>
          item.type === 'video' ? (
            <VideoItem key={item.id} item={item} />
          ) : (
            <PhotoItem key={item.id} item={item} />
          )
        )}
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={media}
      keyExtractor={(m) => m.id}
      contentContainerStyle={{ gap: THEME.spacing.sm }}
      renderItem={({ item }) => <PhotoItem item={item} />}
    />
  );
}

function PhotoItem({ item }: { item: HeroMedia }) {
  const url = publicMediaUrl(item.url);
  if (!url) return null;
  return (
    <View style={styles.photoWrap}>
      <Image source={{ uri: url }} style={styles.photo} contentFit="cover" transition={200} />
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
    </View>
  );
}

function VideoItem({ item }: { item: HeroMedia }) {
  const url = publicMediaUrl(item.url) ?? '';
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  if (!url) return null;

  return (
    <View style={styles.videoWrap}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
        fullscreenOptions={{ enable: true }}
      />
      <Pressable
        style={[styles.playButton, isPlaying && styles.playButtonActive]}
        onPress={() => (isPlaying ? player.pause() : player.play())}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={28}
          color="#fff"
        />
      </Pressable>
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { gap: THEME.spacing.md },
  photoWrap: { gap: 4, width: 240 },
  photo: { width: 240, height: 180, borderRadius: THEME.radius.md, backgroundColor: '#EEE7DA' },
  videoWrap: { gap: 4 },
  video: { width: '100%', height: 220, borderRadius: THEME.radius.md, backgroundColor: '#111' },
  playButton: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: { opacity: 0 },
  caption: { fontSize: 12, color: THEME.colors.textMuted, fontStyle: 'italic' },
});
