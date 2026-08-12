import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../lib/theme';
import { publicMediaUrl } from '../lib/utils';
import type { HeroMedia } from '../lib/types';

export default function MediaGallery({
  media,
  galleryHeight = 220,
}: {
  media: HeroMedia[];
  galleryHeight?: number;
}) {
  const hasVideo = media.some((m) => m.type === 'video');

  if (hasVideo) {
    return (
      <View style={styles.gallery}>
        {media.map((item) =>
          item.type === 'video' ? (
            <VideoItem key={item.id} item={item} galleryHeight={galleryHeight} />
          ) : (
            <PhotoItem key={item.id} item={item} galleryHeight={galleryHeight} />
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
      renderItem={({ item }) => <PhotoItem item={item} galleryHeight={galleryHeight} />}
    />
  );
}

function PhotoItem({ item, galleryHeight }: { item: HeroMedia; galleryHeight: number }) {
  const url = publicMediaUrl(item.url);
  const [ratio, setRatio] = useState<number | null>(null);
  if (!url) return null;
  return (
    <View style={styles.photoWrap}>
      <Image
        source={{ uri: url }}
        style={[
          styles.photo,
          { width: 'auto', maxWidth: '100%', height: galleryHeight },
          ratio ? { aspectRatio: ratio } : styles.photoFallback,
        ]}
        contentFit="contain"
        transition={200}
        onLoad={(e) => {
          const w = e.source.width;
          const h = e.source.height;
          if (w && h) setRatio(w / h);
        }}
      />
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
    </View>
  );
}

function VideoItem({ item, galleryHeight }: { item: HeroMedia; galleryHeight: number }) {
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
        style={[styles.video, { height: galleryHeight }]}
        contentFit="contain"
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
  photoWrap: { gap: 4, alignItems: 'flex-start' },
  photo: { backgroundColor: '#EEE7DA' },
  photoFallback: { width: 260, height: 220 },
  videoWrap: { gap: 4 },
  video: { width: '100%', borderRadius: THEME.radius.md, backgroundColor: '#111' },
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
