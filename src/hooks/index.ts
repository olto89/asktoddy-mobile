/**
 * AskToddy Mobile Hooks
 * Reusable React hooks for camera, image picking, location, and AI analysis
 */

export { useCamera } from './useCamera';
export { useImagePicker } from './useImagePicker';
export { useImageAnalysis } from './useImageAnalysis';
export { useLocation, usePricingMultiplier, useFormattedLocation } from './useLocation';
export { useVoiceRecording } from './useVoiceRecording';

export type { CameraOptions, CameraState, UseCameraOptions } from './useCamera';

export type { ImagePickerState, UseImagePickerOptions } from './useImagePicker';

export type {
  AnalysisContext,
  AnalysisResult,
  ImageAnalysisState,
  UseImageAnalysisOptions,
} from './useImageAnalysis';

export type { UseLocationState } from './useLocation';

export type {
  VoiceRecording,
  UseVoiceRecordingReturn,
  UseVoiceRecordingOptions,
} from './useVoiceRecording';
