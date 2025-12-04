// CTKR Client - main entry point for interacting with CTKR.

import type { Store, StoredCTC, CreateOptions } from '../stores/Store.interface.js';
import type { ClientConfig, StoreId, CTCType, CTCData } from '../types/index.js';
import type { SignatureId } from '../constructs/Signature.js';

export class Client {
  private stores: Map<StoreId, Store> = new Map();

  constructor(_config?: ClientConfig) {
    // Initialize client
  }

  /**
   * Attach a store to this client.
   * @param store - The store to attach
   * @returns The attached store (for chaining)
   */
  attachStore(store: Store): Store {
    this.stores.set(store.id, store);
    return store;
  }

  /**
   * Detach a store from this client.
   * @param storeId - The ID of the store to detach
   */
  detachStore(storeId: StoreId): void {
    this.stores.delete(storeId);
  }

  /**
   * Get an attached store by ID.
   * @param storeId - The store ID
   * @returns The store, or undefined if not found
   */
  getStore(storeId: StoreId): Store | undefined {
    return this.stores.get(storeId);
  }

  /**
   * Create a new category-theoretic construct in a store.
   * @param type - The type of construct to create
   * @param data - The construct data (null for Objects, {from, to} for Morphisms, etc.)
   * @param store - The store to create the construct in
   * @param options - Optional name and description
   * @returns The created construct with its signature and metadata
   */
  async createCTC(
    type: CTCType,
    data: CTCData,
    store: Store,
    options?: CreateOptions
  ): Promise<StoredCTC> {
    if (!this.stores.has(store.id)) {
      throw new Error(`Store not attached: ${store.id}`);
    }
    return store.create(type, data, options);
  }

  /**
   * Get a construct by signature ID.
   * Searches across all attached stores.
   * @param id - The signature ID of the construct to find
   * @returns The construct, or undefined if not found
   */
  async getCTC(id: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores.values()) {
      const result = await store.read(id);
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  /**
   * Update a construct by signature ID.
   * @param id - The signature ID
   * @param data - The new data
   * @param store - The store containing the construct
   * @param options - Optional metadata updates (name, description)
   * @returns The updated construct with incremented version
   */
  async updateCTC(
    id: SignatureId,
    data: CTCData,
    store: Store,
    options?: CreateOptions
  ): Promise<StoredCTC> {
    if (!this.stores.has(store.id)) {
      throw new Error(`Store not attached: ${store.id}`);
    }
    return store.update(id, data, options);
  }

  /**
   * Delete a construct by signature ID.
   * @param id - The signature ID
   * @param store - The store containing the construct
   * @returns True if deleted, false if not found
   */
  async deleteCTC(id: SignatureId, store: Store): Promise<boolean> {
    if (!this.stores.has(store.id)) {
      throw new Error(`Store not attached: ${store.id}`);
    }
    return store.delete(id);
  }

  /**
   * Access metadata store operations.
   * @returns Metadata query interface
   */
  meta(): MetaQuery {
    // TODO: Implement metadata access
    throw new Error('Not implemented');
  }
}

/**
 * Metadata query interface for searching store metadata.
 */
export class MetaQuery {
  find(_name: string, _type: CTCType): unknown {
    throw new Error('Not implemented');
  }
}

/**
 * Create a new CTKR client.
 */
export function getClient(config?: ClientConfig): Client {
  return new Client(config);
}
