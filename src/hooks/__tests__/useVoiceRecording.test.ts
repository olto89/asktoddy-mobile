/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useVoiceRecording } from '../useVoiceRecording';

// Get references to the mocks from jest/setup.ts
const mockRequestPermissions = Audio.requestPermissionsAsync as jest.Mock;
const mockSetAudioMode = Audio.setAudioModeAsync as jest.Mock;
const mockCreateRecording = Audio.Recording.createAsync as jest.Mock;
const mockCreateSound = Audio.Sound.createAsync as jest.Mock;

jest.spyOn(Alert, 'alert');

describe('useVoiceRecording', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset to default granted permission
    mockRequestPermissions.mockResolvedValue({ granted: true, status: 'granted' });

    // Reset recording mock
    const mockRecording = {
      stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
      getURI: jest.fn(() => 'mock://recording.m4a'),
      getStatusAsync: jest.fn(() => Promise.resolve({ isRecording: true })),
    };
    mockCreateRecording.mockResolvedValue({ recording: mockRecording });

    // Reset sound mock
    const mockSound = {
      playAsync: jest.fn(() => Promise.resolve()),
      stopAsync: jest.fn(() => Promise.resolve()),
      unloadAsync: jest.fn(() => Promise.resolve()),
      setOnPlaybackStatusUpdate: jest.fn(),
    };
    mockCreateSound.mockResolvedValue({ sound: mockSound });
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.voiceRecordings).toEqual([]);
    expect(result.current.playingUri).toBeNull();
    expect(result.current.recordingDuration).toBe(0);
  });

  it('startRecording requests permissions', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockRequestPermissions).toHaveBeenCalled();
  });

  it('startRecording sets audio mode with allowsRecordingIOS', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockSetAudioMode).toHaveBeenCalledWith(
      expect.objectContaining({ allowsRecordingIOS: true })
    );
  });

  it('startRecording creates recording and sets isRecording true', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockCreateRecording).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });

  it('startRecording shows alert if permission denied', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false, status: 'denied' });

    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Microphone Permission Required',
      expect.any(String),
      expect.any(Array)
    );
    expect(result.current.isRecording).toBe(false);
  });

  it('stopRecording saves URI to voiceRecordings', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    // Start recording first
    await act(async () => {
      await result.current.startRecording();
    });

    // Stop recording
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.voiceRecordings).toHaveLength(1);
    expect(result.current.voiceRecordings[0].uri).toBe('mock://recording.m4a');
    expect(result.current.isRecording).toBe(false);
  });

  it('stopRecording resets audio mode with allowsRecordingIOS false', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    mockSetAudioMode.mockClear();

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(mockSetAudioMode).toHaveBeenCalledWith(
      expect.objectContaining({ allowsRecordingIOS: false })
    );
  });

  it('stopRecording calls onRecordingSaved callback', async () => {
    const onRecordingSaved = jest.fn();
    const { result } = renderHook(() => useVoiceRecording([], { onRecordingSaved }));

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(onRecordingSaved).toHaveBeenCalled();
  });

  it('playRecording creates sound and plays', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.playRecording('mock://test.m4a');
    });

    expect(mockCreateSound).toHaveBeenCalledWith({ uri: 'mock://test.m4a' });
    expect(result.current.playingUri).toBe('mock://test.m4a');
  });

  it('stopPlayback stops sound and resets playingUri', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    // Start playback first
    await act(async () => {
      await result.current.playRecording('mock://test.m4a');
    });

    expect(result.current.playingUri).toBe('mock://test.m4a');

    await act(async () => {
      await result.current.stopPlayback();
    });

    expect(result.current.playingUri).toBeNull();
  });

  it('removeRecording removes from list after confirmation', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording([
        { uri: 'mock://r1.m4a', duration: 10, timestamp: 1 },
        { uri: 'mock://r2.m4a', duration: 20, timestamp: 2 },
      ])
    );

    expect(result.current.voiceRecordings).toHaveLength(2);

    act(() => {
      result.current.removeRecording(0);
    });

    // Simulate pressing "Delete" in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2].find((btn: any) => btn.text === 'Delete');

    act(() => {
      deleteButton.onPress();
    });

    expect(result.current.voiceRecordings).toHaveLength(1);
    expect(result.current.voiceRecordings[0].uri).toBe('mock://r2.m4a');
  });

  it('formatDuration formats correctly', () => {
    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.formatDuration(0)).toBe('0:00');
    expect(result.current.formatDuration(65)).toBe('1:05');
    expect(result.current.formatDuration(3600)).toBe('60:00');
    expect(result.current.formatDuration(9)).toBe('0:09');
  });
});
