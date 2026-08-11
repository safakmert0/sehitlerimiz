import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEvent, useEventListener } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView, type TimeUpdateEventPayload } from 'expo-video';
import { setAudioModeAsync } from 'expo-audio';
import { THEME } from '../lib/theme';
import { setOnboardingDone } from '../lib/onboardingGate';
import { SITE_TAGLINE } from '../lib/utils';

export const ONBOARDING_DONE_KEY = 'onboarding_completed';

export default function OnboardingScreen() {
  const player = useVideoPlayer(require('../assets/onboarding.mp4'), (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.1;
    p.muted = false;
    p.volume = 1;
  });

  const [watched, setWatched] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const durationRef = useRef(0);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    }).catch(console.warn);
    player.play();
    return () => {
      player.pause();
    };
  }, [player]);

  useEventListener(player, 'timeUpdate', (e: TimeUpdateEventPayload) => {
    const d = durationRef.current;
    if (d > 0) {
      setProgress(Math.min(e.currentTime / d, 1));
      if (e.currentTime >= d - 0.05) setWatched(true);
    }
  });

  useEventListener(player, 'sourceLoad', (e) => {
    durationRef.current = e.duration;
    setDuration(e.duration);
  });

  useEventListener(player, 'playToEnd', () => {
    setWatched(true);
  });

  const handleStatus = useCallback(
    (payload: { status: string }) => {
      if (payload.status === 'error') setFailed(true);
    },
    []
  );
  useEventListener(player, 'statusChange', handleStatus);

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const done = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
    } catch (e) {
      console.warn('Onboarding durumu kaydedilemedi:', e);
    }
    setOnboardingDone(true);
  }, []);

  const stl = styles;
  const pct = Math.round(progress * 100);

  return (
    <View style={stl.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.55, 1]}
        style={stl.overlay}
      />

      <View style={stl.brand}>
        <Text style={stl.brandTitle}>Şehitlerimiz ve Gazilerimiz</Text>
        <Text style={stl.brandTagline}>{SITE_TAGLINE}</Text>
      </View>

      <View style={stl.footer}>
        <Pressable
          style={[stl.playButton, isPlaying && stl.playButtonHidden]}
          onPress={() => (isPlaying ? player.pause() : player.play())}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#fff" />
        </Pressable>

        <View style={stl.progressRow}>
          <Ionicons name="lock-closed" size={14} color="#D4D4D4" />
          <View style={stl.progressTrack}>
            <View style={[stl.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={stl.progressText}>%{pct}</Text>
        </View>

        {watched ? (
          <Pressable style={stl.continueButton} onPress={done}>
            <Text style={stl.continueText}>Devam Et</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable style={stl.lockedButton} disabled>
            <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={stl.lockedText}>Devam Et</Text>
          </Pressable>
        )}

        {!watched && duration > 0 ? (
          <Text style={stl.hint}>Videoyu sonuna kadar izleyerek devam edin</Text>
        ) : null}
      </View>

      {failed ? (
        <View style={stl.errorBox}>
          <Ionicons name="alert-circle" size={22} color="#fff" />
          <Text style={stl.errorText}>
            Video yüklenemedi. Lütfen assets/onboarding.mp4 dosyasını kontrol edin.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  brand: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  brandTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandTagline: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    gap: 14,
    alignItems: 'center',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonHidden: { opacity: 0 },
  progressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: THEME.colors.gold },
  progressText: { color: '#D4D4D4', fontSize: 12, fontWeight: '700', width: 40, textAlign: 'right' },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: THEME.radius.lg,
    backgroundColor: THEME.colors.primary,
  },
  continueText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: THEME.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  lockedText: { color: 'rgba(255,255,255,0.6)', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  hint: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  errorBox: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(176,30,47,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    maxWidth: '85%',
  },
  errorText: { color: '#fff', fontSize: 12, fontWeight: '600', flexShrink: 1 },
});