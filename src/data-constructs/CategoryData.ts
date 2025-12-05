// CategoryData - data structure for a category-theoretic Category
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
 * Data structure representing a stored category-theoretic Category.
 */
export interface CategoryData {
  /** Unique signature identifying this category */
  readonly signature: Signature;
  
  /** Metadata (name, description, timestamps) */
  readonly metadata: Metadata;
  
  /** Additional custom properties */
  readonly properties?: Record<string, unknown>;
}

/**
 * Check if two categories are the same (by signature).
 */
export function categoriesEqual(a: CategoryData, b: CategoryData): boolean {
  return a.signature.id === b.signature.id && a.signature.storeId === b.signature.storeId;
}

