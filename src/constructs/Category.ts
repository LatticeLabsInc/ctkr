// Category construct
//
// In category theory, a Category consists of:
// - A collection of objects
// - A collection of morphisms between objects
// - Composition of morphisms (associative)
// - Identity morphisms for each object
//
// Categories must satisfy:
// - Associativity: (h ∘ g) ∘ f = h ∘ (g ∘ f)
// - Identity: id ∘ f = f = f ∘ id

import type { Signature } from './Signature.js';
import type { Metadata } from './Metadata.js';

/**
 * Represents a category-theoretic Category.
 */
export interface CTCategory {
  /** Unique signature identifying this category */
  readonly signature: Signature;
  
  /** Metadata (name, description, timestamps) */
  readonly metadata: Metadata;
  
  /** Additional custom properties */
  readonly properties?: Record<string, unknown>;
}

/**
 * Check if two categories are the same (by signature).
 * @param a - First category
 * @param b - Second category
 */
export function categoriesEqual(a: CTCategory, b: CTCategory): boolean {
  return a.signature.id === b.signature.id && a.signature.storeId === b.signature.storeId;
}
