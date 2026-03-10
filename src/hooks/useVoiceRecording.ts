import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { Audio } from 'expo-av';

export interface VoiceRecording {
  uri: string;
  duration: number; // in seconds
  timestamp: number;
}

export interface UseVoiceRecordingOptions {
  onRecordingSaved?: () => void;
  onRecordingRemoved?: () => void;
}

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  recordingDuration: number;
  voiceRecordings: VoiceRecording[];
  playingUri: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playRecording: (uri: string) => Promise<void>;
  stopPlayback: () => Promise<void>;
  removeRecording: (index: number) => void;
  formatDuration: (seconds: number) => string;
  setVoiceRecordings: React.Dispatch<React.SetStateAction<VoiceRecording[]>>;
}

export function useVoiceRecording(
  initialRecordings: VoiceRecording[] = [],
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>(initialRecordings);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const permissionResponse = await Audio.requestPermissionsAsync();

      if (!permissionResponse.granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in Settings to record voice notes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingOptions: Audio.RecordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every second
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      durationIntervalRef.current = interval;
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      // Clear duration interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      if (uri) {
        const newRecording: VoiceRecording = {
          uri,
          duration: recordingDuration,
          timestamp: Date.now(),
        };
        setVoiceRecordings(prev => [...prev, newRecording]);
        options.onRecordingSaved?.();
        Alert.alert(
          'Voice Note Saved',
          `Recording saved (${formatDuration(recordingDuration)}). It will be analyzed when generating your quote.`
        );
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  }, [recording, recordingDuration, options, formatDuration]);

  const playRecording = useCallback(
    async (uri: string) => {
      try {
        // Stop any currently playing sound
        if (sound) {
          await sound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync({ uri });
        setSound(newSound);
        setPlayingUri(uri);

        newSound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingUri(null);
          }
        });

        await newSound.playAsync();
      } catch (error) {
        console.error('Failed to play recording:', error);
        Alert.alert('Error', 'Failed to play recording');
      }
    },
    [sound]
  );

  const stopPlayback = useCallback(async () => {
    if (sound) {
      await sound.stopAsync();
      setPlayingUri(null);
    }
  }, [sound]);

  const removeRecording = useCallback(
    (index: number) => {
      Alert.alert('Delete Recording', 'Are you sure you want to delete this voice note?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVoiceRecordings(prev => prev.filter((_, i) => i !== index));
            options.onRecordingRemoved?.();
          },
        },
      ]);
    },
    [options]
  );

  return {
    isRecording,
    recordingDuration,
    voiceRecordings,
    playingUri,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    removeRecording,
    formatDuration,
    setVoiceRecordings,
  };
}
