// Store interface for CTKR storage backends.
//
// The Store interface defines the contract that all store implementations must follow.
// This enables CTKR to work with different storage backends (in-memory, disk, HTTP, SQL)
// while maintaining a consistent API.

import type { CTCType, CTCData } from '../types/index.js';
import type { Signature, SignatureId } from '../constructs/Signature.js';
import type { Metadata } from '../constructs/Metadata.js';

/**
 * Represents a stored category-theoretic construct.
 */
export interface StoredCTC {
  /** Unique signature for this construct */
  signature: Signature;
  
  /** Metadata (name, description, timestamps) */
  metadata: Metadata;
  
  /** Type of construct (Object, Morphism, Category, Functor) */
  type: CTCType;
  
  /** Construct-specific data */
  data: CTCData;
}

/**
 * Options for creating a new construct.
 */
export interface CreateOptions {
  name?: string;
  description?: string;
}

/**
 * Store interface that all storage implementations must implement.
 */
export interface Store {
  /**
   * Get the store's unique identifier.
   */
  readonly id: string;

  /**
   * Initialize the store connection.
   */
  connect(): Promise<void>;

  /**
   * Close the store connection.
   */
  disconnect(): Promise<void>;

  /**
   * Create a new construct in the store.
   * @param type - The type of construct to create
   * @param data - The construct data
   * @param options - Optional name and description
   * @returns The created construct with its signature and metadata
   */
  create(type: CTCType, data: CTCData, options?: CreateOptions): Promise<StoredCTC>;

  /**
   * Read a construct by signature ID.
   * @param id - The signature ID
   * @returns The construct, or undefined if not found
   */
  read(id: SignatureId): Promise<StoredCTC | undefined>;

  /**
   * Update an existing construct.
   * @param id - The signature ID
   * @param data - The new construct data
   * @param options - Optional metadata updates (name, description)
   * @returns The updated construct with incremented version
   */
  update(id: SignatureId, data: CTCData, options?: CreateOptions): Promise<StoredCTC>;

  /**
   * Delete a construct.
   * @param id - The signature ID
   * @returns True if deleted, false if not found
   */
  delete(id: SignatureId): Promise<boolean>;

  /**
   * List all constructs of a given type.
   * @param type - The type of constructs to list
   * @returns Array of constructs
   */
  list(type: CTCType): Promise<StoredCTC[]>;

  /**
   * Search for constructs matching a query.
   * @param query - The search query
   * @returns Array of matching constructs
   */
  search(query: StoreQuery): Promise<StoredCTC[]>;
}

/**
 * Query parameters for searching constructs.
 */
export interface StoreQuery {
  type?: CTCType;
  // TODO: Add more query parameters (filters, pagination, etc.)
}

/**
 * Base configuration for all store types.
 */
export interface BaseStoreConfig {
  id?: string;
}
