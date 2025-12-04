// Functor construct
//
// In category theory, a Functor is a structure-preserving map between categories.
// A functor F: C → D maps:
// - Objects of C to objects of D
// - Morphisms of C to morphisms of D
//
// Functors must preserve:
// - Composition: F(g ∘ f) = F(g) ∘ F(f)
// - Identity: F(id_A) = id_{F(A)}

import type { Signature, SignatureId } from './Signature.js';

/**
 * Represents a category-theoretic Functor.
 */
export interface CTFunctor {
  /** Unique signature identifying this functor */
  readonly signature: Signature;
  
  /** Signature ID of the source category */
  readonly sourceCategoryId: SignatureId;
  
  /** Signature ID of the target category */
  readonly targetCategoryId: SignatureId;
  
  /** Optional display name */
  readonly name?: string;
  
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Mapping of objects under a functor.
 */
export interface ObjectMapping {
  readonly functorId: SignatureId;
  readonly sourceObjectId: SignatureId;
  readonly targetObjectId: SignatureId;
}

/**
 * Mapping of morphisms under a functor.
 */
export interface MorphismMapping {
  readonly functorId: SignatureId;
  readonly sourceMorphismId: SignatureId;
  readonly targetMorphismId: SignatureId;
}

/**
 * Check if two functors are the same (by signature).
 * @param a - First functor
 * @param b - Second functor
 */
export function functorsEqual(a: CTFunctor, b: CTFunctor): boolean {
  return a.signature.id === b.signature.id && a.signature.storeId === b.signature.storeId;
}
