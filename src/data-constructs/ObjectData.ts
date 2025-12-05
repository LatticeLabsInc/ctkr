// ObjectData - data structure for a category-theoretic Object
//
// In category theory, an Object is a basic element of a category.
// Objects are abstract entities that can be the source or target of morphisms.

import type { Signature } from './Signature.js';
import type { Metadata } from './Metadata.js';

/**
 * Data structure representing a stored category-theoretic Object.
 */
export interface ObjectData {
  /** Unique signature identifying this object */
  readonly signature: Signature;
  
  /** Metadata (name, description, timestamps) */
  readonly metadata: Metadata;
  
  /** ID of the category this object belongs to (optional for standalone objects) */
  readonly categoryId?: string;
  
  /** Additional custom properties */
  readonly properties?: Record<string, unknown>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Bidirectional pointers (maintained automatically by Client)
  // ─────────────────────────────────────────────────────────────────────────────
  
  /** IDs of all morphisms where this object is the source */
  readonly morphismsFromIds?: string[];
  
  /** IDs of all morphisms where this object is the target */
  readonly morphismsToIds?: string[];

  /** ID of the identity morphism for this object (id_A: A → A) */
  readonly identityMorphismId?: string;
}

/**
 * Check if two objects are the same (by signature).
 */
export function objectsEqual(a: ObjectData, b: ObjectData): boolean {
  return a.signature.id === b.signature.id && a.signature.storeId === b.signature.storeId;
}

