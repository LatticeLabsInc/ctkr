// TODO: Implement HTTPStore
//
// An HTTP-based implementation of the Store interface.
// Connects to a remote CTKR-compatible API.

import type { Store, StoredCTC, StoreQuery, BaseStoreConfig, CreateOptions } from './Store.interface.js';
import type { CTCType, CTCInput } from '../types/index.js';
import type { SignatureId } from '../data-constructs/Signature.js';

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
