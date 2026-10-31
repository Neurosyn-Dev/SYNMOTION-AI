/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IStorageDriver } from './storageDriver.js';

export class CloudflareR2StorageDriver implements IStorageDriver {
  private accountId: string | undefined;
  private accessKeyId: string | undefined;
  private secretAccessKey: string | undefined;
  private bucket: string | undefined;
  private isConfigured: boolean;

  constructor() {
    this.accountId = process.env.R2_ACCOUNT_ID;
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET;

    this.isConfigured = Boolean(
      this.accountId && this.accessKeyId && this.secretAccessKey && this.bucket
    );
  }

  public async put(_key: string, _buffer: Buffer, _mimeType: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(
        'Cloudflare R2 is not configured. Environment variables R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET are required.'
      );
    }
    throw new Error('R2 driver client awaiting cloud credential configuration.');
  }

  public async get(_key: string): Promise<Buffer> {
    if (!this.isConfigured) {
      throw new Error('Cloudflare R2 is not configured.');
    }
    throw new Error('R2 driver client awaiting cloud credential configuration.');
  }

  public async delete(_key: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Cloudflare R2 is not configured.');
    }
  }

  public async exists(_key: string): Promise<boolean> {
    return false;
  }

  public getUrl(key: string): string {
    return `/api/assets/content/${encodeURIComponent(key)}`;
  }

  public getStatus(): { type: string; operational: boolean; details: string } {
    return {
      type: 'Cloudflare R2 Object Storage',
      operational: this.isConfigured,
      details: this.isConfigured
        ? `Configured with bucket ${this.bucket}`
        : 'Unconfigured (Awaiting R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)',
    };
  }
}
