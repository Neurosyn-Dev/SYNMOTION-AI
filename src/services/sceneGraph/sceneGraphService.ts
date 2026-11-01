/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SceneGraphData,
  SceneEntity,
  AnimationTrack,
  TransformData,
  PBRMaterialData,
  EnvironmentSettings,
  Vector3D,
} from './types';
import { AnimationEngine } from '../animation/animationEngine';
import { globalCommandManager, SceneCommand } from './commandManager';

export class SceneGraphService {
  private currentScene: SceneGraphData;
  private listeners: ((scene: SceneGraphData) => void)[] = [];

  constructor() {
    this.currentScene = this.createDefaultScene('scene-1', 'Obsidian Arrival', 45);
  }

  public getScene(): SceneGraphData {
    return this.currentScene;
  }

  public setScene(scene: SceneGraphData): void {
    this.currentScene = scene;
    this.notify();
  }

  public createDefaultScene(
    sceneId: string,
    title: string,
    durationSeconds = 45
  ): SceneGraphData {
    const heroActor: SceneEntity = {
      id: 'entity-hero-actor',
      name: 'Hero Wanderer (Digital Human)',
      type: 'character',
      visible: true,
      locked: false,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: {
        color: '#0d1117',
        roughness: 0.45,
        metalness: 0.15,
        emissive: '#0284c7',
        emissiveIntensity: 1.2,
        opacity: 1.0,
        transparent: false,
        wireframe: false,
      },
      properties: {
        posture: 'Heroic Stand',
        clothing: 'Weathered Shrouded Cowl',
        relicGlow: true,
        walkSpeed: 1.2,
      },
    };

    const cineCamera: SceneEntity = {
      id: 'entity-cine-camera',
      name: '35mm Cine Prime Camera',
      type: 'camera',
      visible: true,
      locked: false,
      transform: {
        position: { x: 0, y: 2.8, z: 14 },
        rotation: { x: -6, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      properties: {
        focalLengthMm: 35,
        fov: 38,
        aperture: 'f/2.0',
        movementMode: 'dolly_in',
        shutterAngle: 180,
        focusDistance: 8.5,
      },
    };

    const keyLight: SceneEntity = {
      id: 'entity-key-light',
      name: 'Directional Key Light (Moonlight)',
      type: 'directional_light',
      visible: true,
      locked: false,
      transform: {
        position: { x: 12, y: 24, z: 15 },
        rotation: { x: 45, y: -30, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      properties: {
        intensity: 2.5,
        color: '#7dd3fc',
        castShadow: true,
        shadowBias: -0.0005,
      },
    };

    const rimLight: SceneEntity = {
      id: 'entity-rim-light',
      name: 'Cyan Rim Accent',
      type: 'directional_light',
      visible: true,
      locked: false,
      transform: {
        position: { x: -15, y: 10, z: -18 },
        rotation: { x: -20, y: 140, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      properties: {
        intensity: 1.8,
        color: '#38bdf8',
        castShadow: false,
      },
    };

    const rainSystem: SceneEntity = {
      id: 'entity-rain-particles',
      name: 'Atmospheric Rain Particle Emitter',
      type: 'particle_system',
      visible: true,
      locked: false,
      transform: {
        position: { x: 0, y: 20, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      properties: {
        particleCount: 12000,
        speed: 35,
        windAngle: -5,
        color: '#a5f3fc',
      },
    };

    const groundPlane: SceneEntity = {
      id: 'entity-ground-plaza',
      name: 'Wet Asphalt & Puddle Plaza',
      type: 'terrain',
      visible: true,
      locked: true,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: -90, y: 0, z: 0 },
        scale: { x: 160, y: 160, z: 1 },
      },
      material: {
        color: '#070b14',
        roughness: 0.12,
        metalness: 0.8,
        emissive: '#000000',
        emissiveIntensity: 0,
        opacity: 1.0,
        transparent: false,
        wireframe: false,
      },
      properties: {
        wetness: 0.85,
        puddleReflectivity: 0.9,
      },
    };

    // Default Animation Tracks
    const cameraPositionTrack: AnimationTrack = {
      id: 'track-camera-pos',
      entityId: 'entity-cine-camera',
      propertyName: 'position',
      keyframes: [
        { id: 'kf-c1', timeSec: 0, value: { x: 0, y: 3.5, z: 18 }, easing: 'easeInOut' },
        { id: 'kf-c2', timeSec: durationSeconds * 0.5, value: { x: 1.2, y: 2.6, z: 11 }, easing: 'easeInOut' },
        { id: 'kf-c3', timeSec: durationSeconds, value: { x: 0, y: 2.2, z: 6.5 }, easing: 'easeInOut' },
      ],
    };

    const actorBobTrack: AnimationTrack = {
      id: 'track-actor-pos',
      entityId: 'entity-hero-actor',
      propertyName: 'position',
      keyframes: [
        { id: 'kf-a1', timeSec: 0, value: { x: 0, y: 0, z: 0 }, easing: 'easeInOut' },
        { id: 'kf-a2', timeSec: durationSeconds * 0.5, value: { x: 0, y: 0.08, z: 0 }, easing: 'easeInOut' },
        { id: 'kf-a3', timeSec: durationSeconds, value: { x: 0, y: 0, z: 0 }, easing: 'easeInOut' },
      ],
    };

    return {
      version: 1,
      sceneId,
      sceneTitle: title,
      durationSeconds,
      activeCameraId: 'entity-cine-camera',
      entities: [heroActor, cineCamera, keyLight, rimLight, rainSystem, groundPlane],
      animationTracks: [cameraPositionTrack, actorBobTrack],
      environment: {
        weather: 'thunderstorm',
        timeOfDay: 'night',
        fogDensity: 0.028,
        rainDensity: 12000,
        skyColor: '#03060c',
        ambientColor: '#050810',
      },
    };
  }

  public getEntity(id: string): SceneEntity | undefined {
    return this.currentScene.entities.find((e) => e.id === id);
  }

  public updateEntityTransform(
    id: string,
    transform: Partial<TransformData>,
    recordUndo = true
  ): void {
    const entity = this.getEntity(id);
    if (!entity || entity.locked) return;

    const prevTransform = { ...entity.transform };
    const newTransform: TransformData = {
      position: { ...entity.transform.position, ...(transform.position || {}) },
      rotation: { ...entity.transform.rotation, ...(transform.rotation || {}) },
      scale: { ...entity.transform.scale, ...(transform.scale || {}) },
    };

    if (recordUndo) {
      const cmd: SceneCommand = {
        name: `Transform ${entity.name}`,
        execute: () => {
          entity.transform = newTransform;
          this.notify();
        },
        undo: () => {
          entity.transform = prevTransform;
          this.notify();
        },
      };
      globalCommandManager.execute(cmd);
    } else {
      entity.transform = newTransform;
      this.notify();
    }
  }

  public updateEntityMaterial(id: string, materialUpdate: Partial<PBRMaterialData>): void {
    const entity = this.getEntity(id);
    if (!entity) return;

    const prevMat = entity.material ? { ...entity.material } : undefined;
    const newMat = entity.material
      ? { ...entity.material, ...materialUpdate }
      : ({
          color: '#ffffff',
          roughness: 0.5,
          metalness: 0.1,
          emissive: '#000000',
          emissiveIntensity: 0,
          opacity: 1.0,
          transparent: false,
          wireframe: false,
          ...materialUpdate,
        } as PBRMaterialData);

    const cmd: SceneCommand = {
      name: `Modify Material for ${entity.name}`,
      execute: () => {
        entity.material = newMat;
        this.notify();
      },
      undo: () => {
        entity.material = prevMat;
        this.notify();
      },
    };
    globalCommandManager.execute(cmd);
  }

  public updateEntityProperty(id: string, propKey: string, value: any): void {
    const entity = this.getEntity(id);
    if (!entity) return;

    const prevVal = entity.properties[propKey];
    const cmd: SceneCommand = {
      name: `Update ${propKey} on ${entity.name}`,
      execute: () => {
        entity.properties[propKey] = value;
        this.notify();
      },
      undo: () => {
        entity.properties[propKey] = prevVal;
        this.notify();
      },
    };
    globalCommandManager.execute(cmd);
  }

  public updateEnvironment(envUpdate: Partial<EnvironmentSettings>): void {
    const prevEnv = { ...this.currentScene.environment };
    const newEnv = { ...this.currentScene.environment, ...envUpdate };

    const cmd: SceneCommand = {
      name: 'Modify Environment Atmosphere',
      execute: () => {
        this.currentScene.environment = newEnv;
        this.notify();
      },
      undo: () => {
        this.currentScene.environment = prevEnv;
        this.notify();
      },
    };
    globalCommandManager.execute(cmd);
  }

  public addEntity(entity: SceneEntity): void {
    const cmd: SceneCommand = {
      name: `Add Entity ${entity.name}`,
      execute: () => {
        this.currentScene.entities.push(entity);
        this.notify();
      },
      undo: () => {
        this.currentScene.entities = this.currentScene.entities.filter((e) => e.id !== entity.id);
        this.notify();
      },
    };
    globalCommandManager.execute(cmd);
  }

  public removeEntity(id: string): void {
    const entity = this.getEntity(id);
    if (!entity) return;

    const index = this.currentScene.entities.findIndex((e) => e.id === id);
    const cmd: SceneCommand = {
      name: `Remove Entity ${entity.name}`,
      execute: () => {
        this.currentScene.entities = this.currentScene.entities.filter((e) => e.id !== id);
        this.notify();
      },
      undo: () => {
        this.currentScene.entities.splice(index, 0, entity);
        this.notify();
      },
    };
    globalCommandManager.execute(cmd);
  }

  /**
   * Records a keyframe into an existing or new animation track for an entity.
   */
  public recordKeyframe(
    entityId: string,
    propertyName: AnimationTrack['propertyName'],
    timeSec: number,
    value: any
  ): void {
    let track = this.currentScene.animationTracks.find(
      (t) => t.entityId === entityId && t.propertyName === propertyName
    );

    if (!track) {
      track = {
        id: `track-${entityId}-${propertyName}-${Date.now()}`,
        entityId,
        propertyName,
        keyframes: [],
      };
      this.currentScene.animationTracks.push(track);
    }

    const updatedTrack = AnimationEngine.insertKeyframe(track, timeSec, value);
    this.currentScene.animationTracks = this.currentScene.animationTracks.map((t) =>
      t.id === track!.id ? updatedTrack : t
    );
    this.notify();
  }

  /**
   * Evaluates the entire scene graph at a specific timecode, computing all animated properties.
   */
  public evaluateSceneAtTime(timeSec: number): SceneGraphData {
    const evaluated: SceneGraphData = JSON.parse(JSON.stringify(this.currentScene));

    for (const track of evaluated.animationTracks) {
      const entity = evaluated.entities.find((e) => e.id === track.entityId);
      if (!entity) continue;

      const interpolated = AnimationEngine.evaluateTrack(track, timeSec);
      if (interpolated === null || interpolated === undefined) continue;

      if (track.propertyName === 'position') {
        entity.transform.position = interpolated;
      } else if (track.propertyName === 'rotation') {
        entity.transform.rotation = interpolated;
      } else if (track.propertyName === 'scale') {
        entity.transform.scale = interpolated;
      } else if (track.propertyName === 'fov') {
        entity.properties.fov = interpolated;
      } else if (track.propertyName === 'intensity') {
        entity.properties.intensity = interpolated;
      } else if (track.propertyName === 'posture') {
        entity.properties.posture = interpolated;
      }
    }

    return evaluated;
  }

  public subscribe(listener: (scene: SceneGraphData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentScene);
    }
  }
}

export const globalSceneGraph = new SceneGraphService();
