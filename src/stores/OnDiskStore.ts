// TODO: Implement OnDiskStore
//
// A file-system based implementation of the Store interface.
// Persists data to disk using JSON files.
//
// Characteristics:
// - Persistent storage across restarts
// - Good for local development and single-user scenarios
// - No concurrent access handling (use SQLStore for that)

import type { Store, StoredCTC, StoreQuery, BaseStoreConfig } from './Store.interface.js';
import type { CTCId, CTCType } from '../types/index.js';

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
    // TODO: Implement connection
    // - Create directory if it doesn't exist
    // - Load index file if present
    throw new Error('Not implemented');
  }

  async disconnect(): Promise<void> {
    // TODO: Implement disconnection
    // - Flush any pending writes
    // - Save index file
    throw new Error('Not implemented');
  }

  async create(_type: CTCType, _data: unknown): Promise<StoredCTC> {
    // TODO: Implement create
    // - Generate unique ID
    // - Write construct to file
    // - Update index
    throw new Error('Not implemented');
  }

  async read(_id: CTCId): Promise<StoredCTC | undefined> {
    // TODO: Implement read
    // - Read construct file
    // - Parse and return
    throw new Error('Not implemented');
  }

  async update(_id: CTCId, _data: unknown): Promise<StoredCTC> {
    // TODO: Implement update
    // - Read existing construct
    // - Update and write back
    throw new Error('Not implemented');
  }

  async delete(_id: CTCId): Promise<boolean> {
    // TODO: Implement delete
    // - Remove construct file
    // - Update index
    throw new Error('Not implemented');
  }

  async list(_type: CTCType): Promise<StoredCTC[]> {
    // TODO: Implement list
    // - Read index
    // - Filter by type
    // - Load and return constructs
    throw new Error('Not implemented');
  }

  async search(_query: StoreQuery): Promise<StoredCTC[]> {
    // TODO: Implement search
    // - Apply query filters to index
    // - Load matching constructs
    throw new Error('Not implemented');
  }
}

