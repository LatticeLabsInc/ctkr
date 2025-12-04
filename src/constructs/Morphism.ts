// Morphism construct
//
// In category theory, a Morphism (or arrow) is a structure-preserving map
// between objects in a category.

import type { Signature, SignatureId } from './Signature.js';

/**
 * Represents a category-theoretic Morphism.
 */
export interface CTMorphism {
  /** Unique signature identifying this morphism */
  readonly signature: Signature;
  
  /** ID of the category this morphism belongs to */
  readonly categoryId?: string;
  
  /** Signature ID of the source object */
  readonly sourceId: SignatureId;
  
  /** Signature ID of the target object */
  readonly targetId: SignatureId;
  
  /** Optional display name */
  readonly name?: string;
  
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Check if two morphisms are composable (f ; g).
 * Morphisms are composable if f.target === g.source.
 * @param f - First morphism
 * @param g - Second morphism
 */
export function areComposable(f: CTMorphism, g: CTMorphism): boolean {
  return f.targetId === g.sourceId;
}

/**
 * Check if two morphisms are the same (by signature).
 * @param a - First morphism
 * @param b - Second morphism
 */
export function morphismsEqual(a: CTMorphism, b: CTMorphism): boolean {
  return a.signature.id === b.signature.id && a.signature.storeId === b.signature.storeId;
}
