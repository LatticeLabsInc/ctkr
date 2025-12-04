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
   * Access metadata query interface for searching constructs.
   * @param store - Optional store to search in (searches all if not provided)
   * @returns MetaQuery instance for building and executing queries
   */
  meta(store?: Store): MetaQuery {
    const stores = store ? [store] : Array.from(this.stores.values());
    return new MetaQuery(stores);
  }
}

/**
 * Options for filtering query results.
 * Extensible for future query capabilities.
 */
export interface FindOptions {
  /** Match name exactly (default: true) */
  exactMatch?: boolean;
  
  /** Also search in description field */
  searchDescription?: boolean;
  
  /** Filter by category ID (for Objects and Morphisms) */
  categoryId?: string;
  
  // Future options:
  // fuzzy?: boolean;
  // caseSensitive?: boolean;
  // limit?: number;
  // offset?: number;
}

/**
 * Metadata query interface for searching constructs by metadata.
 */
export class MetaQuery {
  constructor(private readonly stores: Store[]) {}

  /**
   * Find constructs by type and name.
   * 
   * @param type - The type of construct to find
   * @param name - The name to search for
   * @param options - Optional search options
   * @returns Array of matching constructs
   * 
   * @example
   * // Find all Objects named "my-object"
   * const results = await client.meta().find(ObjectType, 'my-object');
   * 
   * @example
   * // Find in a specific store with options
   * const results = await client.meta(store).find(ObjectType, 'test', {
   *   exactMatch: false,
   *   searchDescription: true,
   * });
   */
  async find(type: CTCType, name: string, options?: FindOptions): Promise<StoredCTC[]> {
    const exactMatch = options?.exactMatch ?? true;
    const searchDescription = options?.searchDescription ?? false;
    const categoryId = options?.categoryId;

    const results: StoredCTC[] = [];

    for (const store of this.stores) {
      const constructs = await store.list(type);
      
      for (const ctc of constructs) {
        // Check name match
        const nameMatches = exactMatch
          ? ctc.metadata.name === name
          : ctc.metadata.name?.includes(name) ?? false;

        // Check description match (if enabled)
        const descriptionMatches = searchDescription && !exactMatch
          ? ctc.metadata.description?.includes(name) ?? false
          : false;

        // Check category filter (if provided)
        const categoryMatches = categoryId === undefined || this.matchesCategory(ctc, categoryId);

        if ((nameMatches || descriptionMatches) && categoryMatches) {
          results.push(ctc);
        }
      }
    }

    return results;
  }

  /**
   * Find all constructs of a given type.
   * 
   * @param type - The type of construct to find
   * @returns Array of all constructs of that type
   */
  async findAll(type: CTCType): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    
    for (const store of this.stores) {
      const constructs = await store.list(type);
      results.push(...constructs);
    }
    
    return results;
  }

  /**
   * Check if a construct belongs to a specific category.
   */
  private matchesCategory(ctc: StoredCTC, categoryId: string): boolean {
    const data = ctc.data as Record<string, unknown> | null;
    if (!data) return false;
    return data.categoryId === categoryId;
  }
}

/**
 * Create a new CTKR client.
 */
export function getClient(config?: ClientConfig): Client {
  return new Client(config);
}
