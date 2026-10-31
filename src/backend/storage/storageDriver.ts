/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IStorageDriver {
  put(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
  getStatus(): { type: string; operational: boolean; details: string };
}
