// MorphismData - data structure for a category-theoretic Morphism
//
// In category theory, a Morphism (or arrow) is a structure-preserving map
// between objects in a category.

import type { Signature, SignatureId } from './Signature.js';
import type { Metadata } from './Metadata.js';

/**
 * Data structure representing a stored category-theoretic Morphism.
 */
export interface MorphismData {
  /** Unique signature identifying this morphism */
  readonly signature: Signature;
  
  /** Metadata (name, description, timestamps) */
  readonly metadata: Metadata;
  
  /** ID of the category this morphism belongs to */
  readonly categoryId?: string;
  
  /** Signature ID of the source object */
  readonly sourceId: SignatureId;
  
  /** Signature ID of the target object */
  readonly targetId: SignatureId;
  
  /** Additional custom properties */
  readonly properties?: Record<string, unknown>;

  /** True if this is an identity morphism (id_A: A → A) */
  readonly isIdentity?: boolean;
}

/**
 * Check if two morphisms are composable (f ; g).
 * Morphisms are composable if f.target === g.source.
 */
export function areComposable(f: MorphismData, g: MorphismData): boolean {
  return f.targetId === g.sourceId;
}

/**
 * Check if two morphisms are the same (by signature).
 */
export function morphismsEqual(a: MorphismData, b: MorphismData): boolean {
  return a.signature.id === b.signature.id && a.signature.storeId === b.signature.storeId;
}

