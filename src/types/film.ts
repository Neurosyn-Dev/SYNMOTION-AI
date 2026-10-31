/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductionDuration = '30s' | '1m' | '3m' | '5m' | '10m' | '15m' | '30m' | 'custom';
export type AspectRatio = '16:9' | '9:16' | '2.39:1' | '4:3';
export type OutputQuality = '720p' | '1080p' | '4k';
export type GenerationMethod = 'generative_video' | 'procedural_3d' | 'procedural_2d' | 'hybrid';

export type SceneStatus =
  | 'PENDING'
  | 'PLANNING'
  | 'GENERATING'
  | 'PROCESSING'
  | 'QUALITY_CHECK'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED';

export type ProductionPhase =
  | 'IDLE'
  | 'BRIEF_INTERPRETATION'
  | 'SCREENPLAY_AND_BIBLE'
  | 'STORYBOARD_DECOMPOSITION'
  | 'VISUAL_DNA_SYNC'
  | 'SCENE_GENERATION'
  | 'QUALITY_CONTROL'
  | 'AUDIO_SYNCHRONIZATION'
  | 'ASSEMBLY_AND_RENDER'
  | 'COMPLETED';

export type ReferenceCategory =
  | 'character'
  | 'environment'
  | 'clothing'
  | 'prop'
  | 'visual_style'
  | 'composition'
  | 'lighting'
  | 'color_palette'
  | 'first_frame'
  | 'last_frame'
  | 'concept_art';

export type VideoReferenceCategory =
  | 'cinematography'
  | 'camera_movement'
  | 'character_movement'
  | 'choreography'
  | 'action_sequence'
  | 'environmental_movement'
  | 'animation_style'
  | 'editing_rhythm'
  | 'lighting'
  | 'source_footage'
  | 'continuation';

export interface ImageReference {
  id: string;
  name: string;
  url: string;
  category: ReferenceCategory;
  tags: string[];
  extractedTraits?: {
    palette: string[];
    lighting: string;
    clothingStyle?: string;
    architecture?: string;
    artisticStyle?: string;
    summary: string;
  };
  createdAt: string;
}

export interface VideoReference {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  category: VideoReferenceCategory;
  durationSeconds: number;
  extractedTraits?: {
    cameraMotion: string;
    movementDynamics: string;
    pacing: string;
    lightingProfile: string;
    summary: string;
  };
  createdAt: string;
}

export interface CharacterDNA {
  id: string;
  name: string;
  archetype: string;
  silhouette: string;
  facialFeatures: string;
  clothing: string;
  accessories: string;
  colorPalette: string[];
  movementTraits: string;
  referenceImageIds: string[];
  referenceVideoIds: string[];
  isGlobal: boolean;
}

export interface EnvironmentDNA {
  id: string;
  name: string;
  locationType: string;
  architecturalDetails: string;
  lightingConditions: string;
  atmosphere: string;
  weather: 'clear' | 'thunderstorm' | 'fog' | 'snow' | 'rain' | 'overcast' | 'neon_night';
  colorPalette: string[];
  spatialScale: string;
  referenceImageIds: string[];
  isGlobal: boolean;
}

export interface StyleDNA {
  id: string;
  name: string;
  artisticDirection: string;
  colorGrading: string;
  contrast: 'high' | 'medium' | 'soft' | 'noir';
  filmGrain: 'none' | 'subtle_35mm' | 'heavy_16mm' | 'digital_clean';
  cinematographyStyle: string;
  referenceImageIds: string[];
  isGlobal: boolean;
}

export interface MotionDNA {
  id: string;
  name: string;
  pacing: 'frenetic' | 'deliberate' | 'meditative' | 'dynamic' | 'slow_burn';
  cameraLanguage: string;
  movementStyle: string;
  referenceVideoIds: string[];
  isGlobal: boolean;
}

export interface VisualDNACollection {
  characters: CharacterDNA[];
  environments: EnvironmentDNA[];
  styles: StyleDNA[];
  motions: MotionDNA[];
}

export interface StoryboardShot {
  shotNumber: number;
  durationSeconds: number;
  framing: 'Extreme Wide' | 'Wide' | 'Medium' | 'Close-Up' | 'Extreme Close-Up' | 'Over-the-Shoulder';
  cameraMotion: 'Static' | 'Dolly Push-In' | 'Crane Sweep' | 'Tracking Shot' | 'Handheld' | 'Slow Orbit';
  description: string;
}

export interface Procedural3DSceneConfig {
  preset: 'abandoned_city_rain' | 'cyberpunk_alley' | 'gothic_cathedral' | 'scifi_desert' | 'deep_forest_fog';
  cameraMovement: 'dolly_in' | 'crane_sweep' | 'tracking_follow' | 'orbit_reveal' | 'handheld_drift';
  weather: 'rain' | 'thunderstorm' | 'fog' | 'snow' | 'clear';
  fogDensity: number;
  rainIntensity: number;
  timeOfDay: 'night' | 'dusk' | 'golden_hour' | 'overcast_day';
  heroSubject: 'hooded_wanderer' | 'cyber_courier' | 'mech_scout' | 'lone_vehicle' | 'architectural_monument';
  keyLightColor: string;
  fillLightColor: string;
  cameraSpeed: number;
}

export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  title: string;
  narrativePurpose: string;
  description: string;
  durationSeconds: number;
  camera: {
    angle: string;
    movement: string;
    focalLength: string;
  };
  lighting: {
    key: string;
    contrast: string;
    atmosphere: string;
  };
  environment: string;
  characters: string[];
  method: GenerationMethod;
  status: SceneStatus;
  retryCount: number;
  maxRetries: number;
  qualityReview?: {
    passed: boolean;
    score: number; // 0-100
    continuityConfidence: number; // 0-100
    notes: string;
  };
  visualDnaRefs: {
    characterIds: string[];
    environmentId?: string;
    styleId?: string;
  };
  audioCues: {
    dialogue?: string;
    ambience: string;
    musicTheme: string;
    sfx: string[];
  };
  shots: StoryboardShot[];
  procedural3DConfig?: Procedural3DSceneConfig;
  generatedVideoUrl?: string;
  thumbnailUrl?: string;
  generationLog?: string[];
}

export interface Screenplay {
  title: string;
  logline: string;
  genre: string;
  tone: string;
  narrativeStructure: {
    act1: string;
    act2: string;
    act3: string;
  };
  screenplayScenes: {
    heading: string;
    action: string;
    dialogue?: { character: string; line: string }[];
  }[];
}

export interface ProductionBible {
  narrativeVision: string;
  cinematographyStyle: string;
  colorPalette: string[];
  lightingRules: string;
  characterProfiles: { name: string; visualContinuityKeys: string[] }[];
  environmentProfiles: { name: string; keyAtmosphericCues: string[] }[];
  audioDirectorNotes: string;
  continuityChecklist: string[];
}

export interface TimelineClip {
  id: string;
  sceneId: string;
  trackId: 'V1' | 'V2' | 'A1' | 'A2' | 'A3' | 'A4';
  startTime: number;
  duration: number;
  label: string;
  color: string;
  volume?: number;
  transitionIn?: 'cut' | 'crossfade' | 'dip_black';
}

export interface ProductionVersion {
  versionNumber: number;
  name: string;
  createdAt: string;
  revisionPrompt?: string;
  modifiedSceneIds: string[];
  notes: string;
}

export interface FilmProject {
  id: string;
  title: string;
  userPrompt: string;
  durationTarget: ProductionDuration;
  durationSeconds: number;
  aspectRatio: AspectRatio;
  quality: OutputQuality;
  fps: number;
  genre: string;
  visualStyle: string;
  currentPhase: ProductionPhase;
  phaseProgress: number; // 0 - 100
  screenplay?: Screenplay;
  productionBible?: ProductionBible;
  storyboard: StoryboardScene[];
  visualDna: VisualDNACollection;
  imageReferences: ImageReference[];
  videoReferences: VideoReference[];
  timelineClips: TimelineClip[];
  versions: ProductionVersion[];
  currentVersionIndex: number;
  renderedVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssetType =
  | 'generated_video'
  | 'generated_image'
  | 'uploaded_image'
  | 'uploaded_video'
  | 'audio'
  | 'voiceover'
  | 'music'
  | 'sound_effect'
  | 'procedural_3d_capture'
  | 'reference_material'
  | 'rendered_export';

export interface MediaAsset {
  id: string;
  projectId: string;
  sceneId?: string;
  assetType: AssetType;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  storageLocation: 'local' | 'r2' | 's3';
  url: string;
  metadata?: Record<string, any>;
  status: 'READY' | 'PROCESSING' | 'ERROR';
  duration?: number;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

export type JobType =
  | 'DIRECTOR_INTERPRETATION'
  | 'STORYBOARD_GENERATION'
  | 'IMAGE_ANALYSIS'
  | 'VIDEO_ANALYSIS'
  | 'VIDEO_GENERATION'
  | 'PROCEDURAL_RENDER'
  | 'AUDIO_GENERATION'
  | 'QUALITY_CONTROL'
  | 'MASTER_ASSEMBLY'
  | 'EXPORT';

export type JobStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'QUALITY_CHECK'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ProductionJob {
  id: string;
  projectId: string;
  sceneId?: string;
  jobType: JobType;
  status: JobStatus;
  progress: number;
  retryCount: number;
  maxRetries: number;
  errorDetails?: string;
  inputParams?: Record<string, any>;
  outputAssets?: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export type ProviderStatus =
  | 'AVAILABLE'
  | 'CONFIGURED'
  | 'AUTHENTICATED'
  | 'OPERATIONAL'
  | 'UNAVAILABLE'
  | 'ERROR';

export interface MediaProviderInfo {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'reasoning' | 'procedural';
  status: ProviderStatus;
  statusMessage?: string;
  capabilities: string[];
  latency: string;
  models?: string[];
}

