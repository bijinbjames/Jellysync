import { StyleSheet, View } from 'react-native';
import { VideoView } from 'expo-video';
import type { VideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';

interface VideoPlayerViewProps {
  player: VideoPlayer;
}

export function VideoPlayerView({ player }: VideoPlayerViewProps) {
  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '15%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
  },
});
