/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MediaProviderInfo, ProviderStatus } from '../../types/film.js';

export interface GenerationRequest {
  projectId: string;
  sceneId?: string;
  prompt: string;
  negativePrompt?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  resolution?: string;
  referenceImageUrls?: string[];
  referenceVideoUrls?: string[];
  options?: Record<string, any>;
}

export interface GenerationResult {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  assetUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface IMediaProvider {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'reasoning' | 'procedural';
  getStatus(): ProviderStatus;
  getStatusMessage(): string;
  getCapabilities(): string[];
  getLatencyEstimate(): string;
  getSupportedModels(): string[];
  generate(request: GenerationRequest): Promise<GenerationResult>;
  poll(externalJobId: string): Promise<GenerationResult>;
  getInfo(): MediaProviderInfo;
}

export class ProviderRegistry {
  private static providers = new Map<string, IMediaProvider>();

  public static register(provider: IMediaProvider): void {
    this.providers.set(provider.id, provider);
  }

  public static get(id: string): IMediaProvider | undefined {
    return this.providers.get(id);
  }

  public static list(): MediaProviderInfo[] {
    return Array.from(this.providers.values()).map((p) => p.getInfo());
  }

  public static getByType(type: 'video' | 'image' | 'audio' | 'reasoning' | 'procedural'): IMediaProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.type === type);
  }
}
