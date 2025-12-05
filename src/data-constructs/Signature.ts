// Signature - unique identifier for a stored construct

import type { StoreId } from '../types/index.js';

export type SignatureId = string;
export type Version = number;

/**
 * Signature uniquely identifies a stored construct.
 */
export interface Signature {
  readonly id: SignatureId;
  readonly storeId: StoreId;
  readonly version: Version;
}

/**
 * Create a new signature for a construct in a store.
 */
export function createSignature(storeId: StoreId): Signature {
  return {
    id: crypto.randomUUID(),
    storeId,
    version: 1,
  };
}

/**
 * Increment the version of a signature (for updates).
 */
export function incrementVersion(signature: Signature): Signature {
  return {
    ...signature,
    version: signature.version + 1,
  };
}

/**
 * Check if two signatures refer to the same construct.
 */
export function signaturesEqual(a: Signature, b: Signature): boolean {
  return a.id === b.id && a.storeId === b.storeId;
}

