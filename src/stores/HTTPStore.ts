// TODO: Implement HTTPStore
//
// An HTTP-based implementation of the Store interface.
// Connects to a remote CTKR-compatible API.
//
// Characteristics:
// - Remote storage access
// - Good for distributed systems and multi-user scenarios
// - Requires network connectivity

import type { Store, StoredCTC, StoreQuery, BaseStoreConfig } from './Store.interface.js';
import type { CTCId, CTCType, CTCData } from '../types/index.js';

export interface HTTPStoreConfig extends BaseStoreConfig {
  /** Base URL of the remote store API */
  baseUrl: string;
  /** Optional authentication headers */
  headers?: Record<string, string>;
}

export class HTTPStore implements Store {
  readonly id: string;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: HTTPStoreConfig) {
    this.id = config.id ?? crypto.randomUUID();
    this.baseUrl = config.baseUrl;
    this.headers = config.headers ?? {};
  }

  async connect(): Promise<void> {
    // TODO: Implement connection
    // - Verify remote store is accessible
    // - Authenticate if needed
    // - Fetch store metadata
    throw new Error('Not implemented');
  }

  async disconnect(): Promise<void> {
    // TODO: Implement disconnection
    // - Clear cached data
    // - Invalidate session if applicable
    throw new Error('Not implemented');
  }

  async create(_type: CTCType, _data: CTCData): Promise<StoredCTC> {
    // TODO: Implement create
    // - POST to remote API
    // - Parse and return response
    throw new Error('Not implemented');
  }

  async read(_id: CTCId): Promise<StoredCTC | undefined> {
    // TODO: Implement read
    // - GET from remote API
    // - Parse and return response
    throw new Error('Not implemented');
  }

  async update(_id: CTCId, _data: CTCData): Promise<StoredCTC> {
    // TODO: Implement update
    // - PUT/PATCH to remote API
    // - Parse and return response
    throw new Error('Not implemented');
  }

  async delete(_id: CTCId): Promise<boolean> {
    // TODO: Implement delete
    // - DELETE to remote API
    // - Return success/failure
    throw new Error('Not implemented');
  }

  async list(_type: CTCType): Promise<StoredCTC[]> {
    // TODO: Implement list
    // - GET with type filter
    // - Parse and return response
    throw new Error('Not implemented');
  }

  async search(_query: StoreQuery): Promise<StoredCTC[]> {
    // TODO: Implement search
    // - POST/GET with query params
    // - Parse and return response
    throw new Error('Not implemented');
  }
}

