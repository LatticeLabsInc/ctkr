// TODO: Implement SQLStore
//
// A SQL database implementation of the Store interface.
// Uses a relational database for persistent, concurrent storage.

import type { Store, StoredCTC, StoreQuery, BaseStoreConfig, CreateOptions } from './Store.interface.js';
import type { CTCType, CTCData } from '../types/index.js';
import type { SignatureId } from '../constructs/Signature.js';

export interface SQLStoreConfig extends BaseStoreConfig {
  /** Database connection string */
  connectionString: string;
  /** Optional table name prefix */
  tablePrefix?: string;
}

export class SQLStore implements Store {
  readonly id: string;
  private readonly connectionString: string;
  private readonly tablePrefix: string;

  constructor(config: SQLStoreConfig) {
    this.id = config.id ?? crypto.randomUUID();
    this.connectionString = config.connectionString;
    this.tablePrefix = config.tablePrefix ?? 'ctkr_';
  }

  async connect(): Promise<void> {
    throw new Error('Not implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Not implemented');
  }

  async create(_type: CTCType, _data: CTCData, _options?: CreateOptions): Promise<StoredCTC> {
    throw new Error('Not implemented');
  }

  async read(_id: SignatureId): Promise<StoredCTC | undefined> {
    throw new Error('Not implemented');
  }

  async update(_id: SignatureId, _data: CTCData, _options?: CreateOptions): Promise<StoredCTC> {
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
