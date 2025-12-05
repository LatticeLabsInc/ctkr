// TODO: Implement OnDiskStore
//
// A file-system based implementation of the Store interface.
// Persists data to disk using JSON files.

import type { Store, StoredCTC, StoreQuery, BaseStoreConfig, CreateOptions } from './Store.interface.js';
import type { CTCType, CTCInput } from '../types/index.js';
import type { SignatureId } from '../data-constructs/Signature.js';

export interface OnDiskStoreConfig extends BaseStoreConfig {
  /** Directory path where data will be stored */
  path: string;
}

export class OnDiskStore implements Store {
  readonly id: string;
  private readonly path: string;

  constructor(config: OnDiskStoreConfig) {
    this.id = config.id ?? crypto.randomUUID();
    this.path = config.path;
  }

  async connect(): Promise<void> {
    throw new Error('Not implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Not implemented');
  }

  async create(_type: CTCType, _data: CTCInput, _options?: CreateOptions): Promise<StoredCTC> {
    throw new Error('Not implemented');
  }

  async read(_id: SignatureId): Promise<StoredCTC | undefined> {
    throw new Error('Not implemented');
  }

  async update(_id: SignatureId, _data: CTCInput, _options?: CreateOptions): Promise<StoredCTC> {
    throw new Error('Not implemented');
  }

  async delete(_id: SignatureId): Promise<boolean> {
    throw new Error('Not implemented');
  }

  async list(_type: CTCType): Promise<StoredCTC[]> {
    throw new Error('Not implemented');
  }

  async search(_query: StoreQuery): Promise<StoredCTC[]> {
    throw new Error('Not implemented');
  }
}
