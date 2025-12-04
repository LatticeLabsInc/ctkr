// Object construct
//
// In category theory, an Object is a basic element of a category.
// Objects are abstract entities that can be the source or target of morphisms.

import type { Signature } from './Signature.js';

/**
 * Represents a category-theoretic Object.
 */
export interface CTObject {
  /** Unique signature identifying this object */
  readonly signature: Signature;
  
  /** ID of the category this object belongs to (optional for standalone objects) */
  readonly categoryId?: string;
  
  /** Optional display name */
  readonly name?: string;
  
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Check if two objects are the same (by signature).
 * @param a - First object
 * @param b - Second object
 */
export function objectsEqual(a: CTObject, b: CTObject): boolean {
  return a.signature.id === b.signature.id && a.signature.storeId === b.signature.storeId;
}
