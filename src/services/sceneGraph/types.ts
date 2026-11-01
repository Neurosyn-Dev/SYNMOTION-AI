/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EntityType =
  | 'mesh'
  | 'character'
  | 'camera'
  | 'directional_light'
  | 'point_light'
  | 'spot_light'
  | 'ambient_light'
  | 'particle_system'
  | 'environment_volume'
  | 'terrain';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface TransformData {
  position: Vector3D;
  rotation: Vector3D; // in degrees
  scale: Vector3D;
}

export interface PBRMaterialData {
  color: string;
  roughness: number; // 0 - 1
  metalness: number; // 0 - 1
  emissive: string;
  emissiveIntensity: number;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  textureUrl?: string;
  normalMapUrl?: string;
}

export type KeyframeEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'step';

export interface KeyframeData<T = any> {
  id: string;
  timeSec: number;
  value: T;
  easing: KeyframeEasing;
}

export interface AnimationTrack {
  id: string;
  entityId: string;
  propertyName: 'position' | 'rotation' | 'scale' | 'fov' | 'intensity' | 'color' | 'posture';
  keyframes: KeyframeData[];
}

export interface SceneEntity {
  id: string;
  name: string;
  type: EntityType;
  parentId?: string;
  visible: boolean;
  locked: boolean;
  transform: TransformData;
  material?: PBRMaterialData;
  properties: Record<string, any>; // e.g. camera fov, light intensity, character posture, particle count
}

export interface EnvironmentSettings {
  weather: 'thunderstorm' | 'rain' | 'fog' | 'clear' | 'snow';
  timeOfDay: 'night' | 'dusk' | 'golden_hour' | 'overcast_day';
  fogDensity: number;
  rainDensity: number;
  skyColor: string;
  ambientColor: string;
}

export interface SceneGraphData {
  version: number;
  sceneId: string;
  sceneTitle: string;
  durationSeconds: number;
  activeCameraId: string;
  entities: SceneEntity[];
  animationTracks: AnimationTrack[];
  environment: EnvironmentSettings;
}
