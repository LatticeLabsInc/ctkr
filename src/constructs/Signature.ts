// Signature - unique identifier for category-theoretic constructs
//
// Every CTC has a Signature that uniquely identifies it across stores.
// The Signature contains versioning information for optimistic concurrency.

import type { StoreId } from '../types/index.js';

/**
 * Unique identifier (UUID) for a construct.
 */
export type SignatureId = string;

/**
 * Version number for optimistic concurrency control.
 */
export type Version = number;

/**
 * Signature uniquely identifies a category-theoretic construct.
 * 
 * Every construct (Object, Morphism, Category, Functor) has a Signature
 * that provides identity and versioning information.
 */
export interface Signature {
  /** Unique identifier (UUID) for this construct */
  readonly id: SignatureId;
  
  /** ID of the store where this construct resides */
  readonly storeId: StoreId;
  
  /** Version number, incremented on each update */
  readonly version: Version;
}

/**
 * Create a new Signature for a construct.
 * @param storeId - The store where the construct will be stored
 * @param id - Optional UUID (generated if not provided)
 * @param version - Initial version (defaults to 1)
 */
export function createSignature(
  storeId: StoreId,
  id?: SignatureId,
  version: Version = 1
): Signature {
  return {
    id: id ?? crypto.randomUUID(),
    storeId,
    version,
  };
}

/**
 * Create a new version of a Signature (increments version).
 * @param signature - The existing signature
 */
export function incrementVersion(signature: Signature): Signature {
  return {
    ...signature,
    version: signature.version + 1,
  };
}

/**
 * Check if two signatures refer to the same construct.
 * @param a - First signature
 * @param b - Second signature
 */
export function signaturesEqual(a: Signature, b: Signature): boolean {
  return a.id === b.id && a.storeId === b.storeId;
}

