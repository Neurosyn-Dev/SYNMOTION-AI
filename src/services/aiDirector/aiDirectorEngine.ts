/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalSceneGraph } from '../sceneGraph/sceneGraphService';
import { globalCommandManager, SceneCommand } from '../sceneGraph/commandManager';
import type { SceneEntity, Vector3D } from '../sceneGraph/types';

export interface StructuredAIDirectorAction {
  actionType:
    | 'TRANSFORM_ENTITY'
    | 'SET_MATERIAL'
    | 'DIRECT_CAMERA'
    | 'SET_ENVIRONMENT'
    | 'ANIMATE_TRACK'
    | 'CREATE_OBJECT';
  targetEntityId?: string;
  parameters: Record<string, any>;
  description: string;
}

export interface AIDirectorExecutionResult {
  success: boolean;
  prompt: string;
  appliedActions: string[];
  undoAvailable: boolean;
  timestamp: string;
}

export class AIDirectorEngine {
  /**
   * Interprets natural language directorial requests and executes them as structured commands against the SceneGraph.
   */
  public static async executeDirective(prompt: string): Promise<AIDirectorExecutionResult> {
    const actions = this.parseDirectiveToActions(prompt);
    const appliedActions: string[] = [];

    for (const act of actions) {
      switch (act.actionType) {
        case 'DIRECT_CAMERA': {
          const cam = globalSceneGraph.getEntity('entity-cine-camera');
          if (cam) {
            const prevMode = cam.properties.movementMode;
            const prevFov = cam.properties.fov;
            const newMode = act.parameters.movementMode || prevMode;
            const newFov = act.parameters.fov || prevFov;

            const cmd: SceneCommand = {
              name: `AI: Direct Camera (${newMode}, ${newFov}°)`,
              execute: () => {
                globalSceneGraph.updateEntityProperty('entity-cine-camera', 'movementMode', newMode);
                globalSceneGraph.updateEntityProperty('entity-cine-camera', 'fov', newFov);
              },
              undo: () => {
                globalSceneGraph.updateEntityProperty('entity-cine-camera', 'movementMode', prevMode);
                globalSceneGraph.updateEntityProperty('entity-cine-camera', 'fov', prevFov);
              },
            };
            globalCommandManager.execute(cmd);
            appliedActions.push(`Camera configured to ${newMode} with ${newFov}° FOV`);
          }
          break;
        }

        case 'SET_ENVIRONMENT': {
          const currentEnv = globalSceneGraph.getScene().environment;
          const prevEnv = { ...currentEnv };
          const newWeather = act.parameters.weather || currentEnv.weather;
          const newTimeOfDay = act.parameters.timeOfDay || currentEnv.timeOfDay;
          const newFog = act.parameters.fogDensity !== undefined ? act.parameters.fogDensity : currentEnv.fogDensity;

          const cmd: SceneCommand = {
            name: `AI: Set Environment (${newWeather}, ${newTimeOfDay})`,
            execute: () => {
              globalSceneGraph.updateEnvironment({
                weather: newWeather,
                timeOfDay: newTimeOfDay,
                fogDensity: newFog,
              });
            },
            undo: () => {
              globalSceneGraph.updateEnvironment(prevEnv);
            },
          };
          globalCommandManager.execute(cmd);
          appliedActions.push(`Atmosphere updated to ${newWeather} (${newTimeOfDay})`);
          break;
        }

        case 'SET_MATERIAL': {
          const entity = globalSceneGraph.getEntity(act.targetEntityId || 'entity-hero-actor');
          if (entity && entity.material) {
            const prevRough = entity.material.roughness;
            const prevMetal = entity.material.metalness;
            const prevEmissive = entity.material.emissive;

            const newRough = act.parameters.roughness !== undefined ? act.parameters.roughness : prevRough;
            const newMetal = act.parameters.metalness !== undefined ? act.parameters.metalness : prevMetal;
            const newEmissive = act.parameters.emissive || prevEmissive;

            const cmd: SceneCommand = {
              name: `AI: Material Shading on ${entity.name}`,
              execute: () => {
                globalSceneGraph.updateEntityMaterial(entity.id, {
                  roughness: newRough,
                  metalness: newMetal,
                  emissive: newEmissive,
                });
              },
              undo: () => {
                globalSceneGraph.updateEntityMaterial(entity.id, {
                  roughness: prevRough,
                  metalness: prevMetal,
                  emissive: prevEmissive,
                });
              },
            };
            globalCommandManager.execute(cmd);
            appliedActions.push(`Material updated on ${entity.name} (Roughness ${newRough}, Metal ${newMetal})`);
          }
          break;
        }

        case 'TRANSFORM_ENTITY': {
          const entity = globalSceneGraph.getEntity(act.targetEntityId || 'entity-hero-actor');
          if (entity) {
            const prevPos = { ...entity.transform.position };
            const newPos: Vector3D = { ...prevPos, ...(act.parameters.position || {}) };

            const cmd: SceneCommand = {
              name: `AI: Transform ${entity.name}`,
              execute: () => {
                globalSceneGraph.updateEntityTransform(entity.id, { position: newPos }, false);
              },
              undo: () => {
                globalSceneGraph.updateEntityTransform(entity.id, { position: prevPos }, false);
              },
            };
            globalCommandManager.execute(cmd);
            appliedActions.push(`Moved ${entity.name} to (${newPos.x}, ${newPos.y}, ${newPos.z})`);
          }
          break;
        }

        case 'CREATE_OBJECT': {
          const newObj: SceneEntity = {
            id: `entity-prop-${Date.now()}`,
            name: act.parameters.name || 'Ancient Sci-Fi Monolith',
            type: 'mesh',
            visible: true,
            locked: false,
            transform: {
              position: act.parameters.position || { x: -8, y: 3, z: 0 },
              rotation: { x: 0, y: 15, z: 0 },
              scale: { x: 2, y: 6, z: 2 },
            },
            material: {
              color: '#0f172a',
              roughness: 0.2,
              metalness: 0.8,
              emissive: '#0284c7',
              emissiveIntensity: 0.8,
              opacity: 1.0,
              transparent: false,
              wireframe: false,
            },
            properties: { geometry: 'monolith_column' },
          };

          globalSceneGraph.addEntity(newObj);
          appliedActions.push(`Created new 3D Entity: ${newObj.name}`);
          break;
        }

        case 'ANIMATE_TRACK': {
          const entityId = act.targetEntityId || 'entity-cine-camera';
          const time = act.parameters.timeSec || 0;
          const val = act.parameters.value;
          globalSceneGraph.recordKeyframe(entityId, act.parameters.property || 'position', time, val);
          appliedActions.push(`Recorded keyframe on ${entityId} at ${time}s`);
          break;
        }
      }
    }

    return {
      success: appliedActions.length > 0,
      prompt,
      appliedActions,
      undoAvailable: globalCommandManager.canUndo(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deterministic semantic parser with structured schema mapping.
   */
  private static parseDirectiveToActions(prompt: string): StructuredAIDirectorAction[] {
    const actions: StructuredAIDirectorAction[] = [];
    const text = prompt.toLowerCase();

    // Camera Direction
    if (text.includes('orbit')) {
      actions.push({
        actionType: 'DIRECT_CAMERA',
        parameters: { movementMode: 'orbit_reveal', fov: 35 },
        description: 'Set camera to 360 degree orbit reveal',
      });
    } else if (text.includes('dolly') || text.includes('closer') || text.includes('push')) {
      actions.push({
        actionType: 'DIRECT_CAMERA',
        parameters: { movementMode: 'dolly_in', fov: 32 },
        description: 'Set camera to cinematic dolly push-in',
      });
    } else if (text.includes('crane') || text.includes('aerial') || text.includes('overhead')) {
      actions.push({
        actionType: 'DIRECT_CAMERA',
        parameters: { movementMode: 'crane_sweep', fov: 42 },
        description: 'Set camera to high-angle crane sweep',
      });
    }

    // Atmosphere & Weather
    if (text.includes('golden') || text.includes('sunset') || text.includes('dusk')) {
      actions.push({
        actionType: 'SET_ENVIRONMENT',
        parameters: { weather: 'clear', timeOfDay: 'golden_hour', fogDensity: 0.015 },
        description: 'Shift atmosphere to warm golden hour sunset',
      });
    } else if (text.includes('storm') || text.includes('lightning') || text.includes('rain')) {
      actions.push({
        actionType: 'SET_ENVIRONMENT',
        parameters: { weather: 'thunderstorm', timeOfDay: 'night', fogDensity: 0.035 },
        description: 'Engage volumetric thunderstorm and lightning',
      });
    } else if (text.includes('fog') || text.includes('mist') || text.includes('haze')) {
      actions.push({
        actionType: 'SET_ENVIRONMENT',
        parameters: { weather: 'fog', timeOfDay: 'night', fogDensity: 0.05 },
        description: 'Increase volumetric atmospheric fog',
      });
    }

    // Material Shading
    if (text.includes('metal') || text.includes('reflective') || text.includes('chrome')) {
      actions.push({
        actionType: 'SET_MATERIAL',
        targetEntityId: 'entity-hero-actor',
        parameters: { roughness: 0.15, metalness: 0.85, emissive: '#38bdf8' },
        description: 'Increase metallic specularity on actor costume',
      });
    } else if (text.includes('cloth') || text.includes('matte') || text.includes('rough')) {
      actions.push({
        actionType: 'SET_MATERIAL',
        targetEntityId: 'entity-hero-actor',
        parameters: { roughness: 0.75, metalness: 0.05 },
        description: 'Set diffuse matte cloth texture on actor',
      });
    }

    // Create 3D Object
    if (text.includes('monolith') || text.includes('tower') || text.includes('pillar') || text.includes('spawn')) {
      actions.push({
        actionType: 'CREATE_OBJECT',
        parameters: { name: 'Obsidian Monolith Pillar', position: { x: -6, y: 3, z: 2 } },
        description: 'Spawn new 3D Obsidian Monolith into scene',
      });
    }

    // Default Fallback: If no matches, apply cinematic lighting enhance
    if (actions.length === 0) {
      actions.push({
        actionType: 'SET_ENVIRONMENT',
        parameters: { weather: 'thunderstorm', timeOfDay: 'night' },
        description: 'Applied default cinematic mood calibration',
      });
    }

    return actions;
  }
}
