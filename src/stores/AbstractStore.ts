// AbstractStore - Base class that handles common signature and metadata operations.
//
// Concrete stores only need to implement the storage primitives:
// - _store: Save a construct to storage
// - _retrieve: Get a construct from storage
// - _remove: Delete a construct from storage
// - _getAll: Get all constructs from storage

import type { Store, StoredCTC, StoreQuery, CreateOptions } from './Store.interface.js';
import type { CTCType, CTCInput } from '../types/index.js';
import type { SignatureId } from '../data-constructs/Signature.js';
import { createSignature, incrementVersion } from '../data-constructs/Signature.js';
import { createMetadata, updateMetadata } from '../data-constructs/Metadata.js';

/**
 * Abstract base class for Store implementations.
 * 
 * Handles common operations like signature creation, version incrementing,
 * and metadata management. Concrete implementations only need to provide
 * the storage primitives.
 */
export abstract class AbstractStore implements Store {
  abstract readonly id: string;

  /**
   * Initialize the store connection.
   * Override in subclasses if needed.
   */
  async connect(): Promise<void> {
    // Default: no-op
  }

  /**
   * Close the store connection.
   * Override in subclasses if needed.
   */
  async disconnect(): Promise<void> {
    // Default: no-op
  }

  /**
   * Create a new construct in the store.
   */
  async create(type: CTCType, data: CTCInput, options?: CreateOptions): Promise<StoredCTC> {
    const signature = createSignature(this.id);
    const metadata = createMetadata({
      name: options?.name,
      description: options?.description,
    });

    const stored: StoredCTC = {
      signature,
      metadata,
      type,
      data,
    };

    await this._store(signature.id, stored);
    return stored;
  }

  /**
   * Read a construct by signature ID.
   */
  async read(id: SignatureId): Promise<StoredCTC | undefined> {
    return this._retrieve(id);
  }

  /**
   * Update an existing construct.
   */
  async update(id: SignatureId, data: CTCInput, options?: CreateOptions): Promise<StoredCTC> {
    const existing = await this._retrieve(id);
    if (!existing) {
      throw new Error(`Construct not found: ${id}`);
    }

    const updated: StoredCTC = {
      ...existing,
      signature: incrementVersion(existing.signature),
      metadata: updateMetadata(existing.metadata, {
        name: options?.name ?? existing.metadata.name,
        description: options?.description ?? existing.metadata.description,
      }),
      data,
    };

    await this._store(id, updated);
    return updated;
  }

  /**
   * Delete a construct.
   */
  async delete(id: SignatureId): Promise<boolean> {
    return this._remove(id);
  }

  /**
   * List all constructs of a given type.
   */
  async list(type: CTCType): Promise<StoredCTC[]> {
    const all = await this._getAll();
    return all.filter(c => c.type === type);
  }

  /**
   * Search for constructs matching a query.
   */
  async search(query: StoreQuery): Promise<StoredCTC[]> {
    let results = await this._getAll();
    if (query.type) {
      results = results.filter(c => c.type === query.type);
    }
    return results;
  }

  // ==================== Storage Primitives ====================
  // Subclasses must implement these methods

  /**
   * Store a construct. Called by create() and update().
   * @param id - The signature ID
   * @param ctc - The construct to store
   */
  protected abstract _store(id: SignatureId, ctc: StoredCTC): Promise<void>;

  /**
   * Retrieve a construct by ID. Called by read() and update().
   * @param id - The signature ID
   * @returns The construct, or undefined if not found
   */
  protected abstract _retrieve(id: SignatureId): Promise<StoredCTC | undefined>;

  /**
   * Remove a construct. Called by delete().
   * @param id - The signature ID
   * @returns True if removed, false if not found
   */
  protected abstract _remove(id: SignatureId): Promise<boolean>;

  /**
   * Get all constructs. Called by list() and search().
   * @returns All stored constructs
   */
  protected abstract _getAll(): Promise<StoredCTC[]>;
}
