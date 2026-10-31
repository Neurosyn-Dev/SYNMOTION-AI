/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import fs from 'fs';
import type { IStorageDriver } from './storageDriver.js';

export class LocalStorageDriver implements IStorageDriver {
  private baseDir: string;

  constructor(baseDirName = 'storage') {
    this.baseDir = path.resolve(process.cwd(), 'data', baseDirName);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    // Prevent directory traversal attacks
    const sanitizedKey = key.replace(/^[/\\]+/, '');
    const resolved = path.resolve(this.baseDir, sanitizedKey);
    if (!resolved.startsWith(this.baseDir)) {
      throw new Error(`Security Exception: Path traversal attempt detected for key: ${key}`);
    }
    return resolved;
  }

  public async put(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = this.resolveSafePath(key);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    await fs.promises.writeFile(fullPath, buffer);
    return key;
  }

  public async get(key: string): Promise<Buffer> {
    const fullPath = this.resolveSafePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Asset file not found on disk: ${key}`);
    }
    return await fs.promises.readFile(fullPath);
  }

  public async delete(key: string): Promise<void> {
    const fullPath = this.resolveSafePath(key);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  public async exists(key: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(key);
    return fs.existsSync(fullPath);
  }

  public getUrl(key: string): string {
    return `/api/assets/content/${encodeURIComponent(key)}`;
  }

  public getStatus(): { type: string; operational: boolean; details: string } {
    return {
      type: 'Local File Storage',
      operational: true,
      details: `Mounted at ${this.baseDir}`,
    };
  }
}
