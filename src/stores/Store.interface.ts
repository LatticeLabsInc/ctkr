// TODO: Define Store interface
//
// The Store interface defines the contract that all store implementations must follow.
// This enables CTKR to work with different storage backends (in-memory, disk, HTTP, SQL)
// while maintaining a consistent API.
//
// Key operations:
// - CRUD for category-theoretic constructs
// - Query/search capabilities
// - Metadata access

import type { CTCId, CTCType, StoreConfig } from '../types/index.js';

/**
 * Represents a stored category-theoretic construct.
 */
export interface StoredCTC {
  id: CTCId;
  type: CTCType;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
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
   * @returns The created construct
   */
  create(type: CTCType, data: unknown): Promise<StoredCTC>;

  /**
   * Read a construct by ID.
   * @param id - The construct ID
   * @returns The construct, or undefined if not found
   */
  read(id: CTCId): Promise<StoredCTC | undefined>;

  /**
   * Update an existing construct.
   * @param id - The construct ID
   * @param data - The new construct data
   * @returns The updated construct
   */
  update(id: CTCId, data: unknown): Promise<StoredCTC>;

  /**
   * Delete a construct.
   * @param id - The construct ID
   * @returns True if deleted, false if not found
   */
  delete(id: CTCId): Promise<boolean>;

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
export interface BaseStoreConfig extends StoreConfig {
  id?: string;
}

