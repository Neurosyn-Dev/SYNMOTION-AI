/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const CreateProjectSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(150),
  prompt: z.string().min(5, 'Prompt must be at least 5 characters').max(3000),
  duration: z.enum(['30s', '1m', '3m', '5m', '10m', '15m', '30m', 'custom']).default('5m'),
  aspectRatio: z.enum(['16:9', '9:16', '2.39:1', '4:3']).default('2.39:1'),
  quality: z.enum(['720p', '1080p', '4k']).default('4k'),
  imageReferences: z.array(z.any()).optional().default([]),
  videoReferences: z.array(z.any()).optional().default([]),
});

export const DirectorsCutSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  revisionPrompt: z.string().min(3, 'Revision prompt must be at least 3 characters').max(2000),
});

export const AnalyzeImageSchema = z.object({
  imageUrl: z.string().url('Invalid image URL format'),
  name: z.string().optional(),
  category: z.string().optional(),
});

export const CreateJobSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  sceneId: z.string().optional(),
  jobType: z.enum([
    'DIRECTOR_INTERPRETATION',
    'STORYBOARD_GENERATION',
    'IMAGE_ANALYSIS',
    'VIDEO_ANALYSIS',
    'VIDEO_GENERATION',
    'PROCEDURAL_RENDER',
    'AUDIO_GENERATION',
    'QUALITY_CONTROL',
    'MASTER_ASSEMBLY',
    'EXPORT',
  ]),
  inputParams: z.record(z.string(), z.any()).optional(),
  maxRetries: z.number().int().min(0).max(10).optional().default(3),
});

export const UpdateJobStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'QUEUED',
    'PROCESSING',
    'QUALITY_CHECK',
    'RETRYING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
  ]),
  progress: z.number().min(0).max(100).optional(),
  errorDetails: z.string().optional(),
  outputAssets: z.array(z.string()).optional(),
});
