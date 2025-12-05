// Core CTKR types

export type CTCType = 'Object' | 'Morphism' | 'Category' | 'Functor' | 'ObjectMapping' | 'MorphismMapping';

// Type constants for use in createCTC calls
export const ObjectType: CTCType = 'Object';
export const MorphismType: CTCType = 'Morphism';
export const CategoryType: CTCType = 'Category';
export const FunctorType: CTCType = 'Functor';
export const ObjectMappingType: CTCType = 'ObjectMapping';
export const MorphismMappingType: CTCType = 'MorphismMapping';

export type StoreId = string;

export interface ClientConfig {
  // TODO: Define client configuration options
}

// ─────────────────────────────────────────────────────────────────────────────
// Creation data types - used when creating new constructs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateObjectInput {
  categoryId?: string;
  properties?: Record<string, unknown>;
  // Bidirectional pointers (maintained by Client)
  morphismsFromIds?: string[];
  morphismsToIds?: string[];
  // Identity morphism (auto-created by Client)
  identityMorphismId?: string;
}

export interface CreateMorphismInput {
  sourceId: string;
  targetId: string;
  categoryId?: string;
  properties?: Record<string, unknown>;
  /** True if this is an identity morphism (id_A: A → A) */
  isIdentity?: boolean;
}

export interface CreateCategoryInput {
  properties?: Record<string, unknown>;
  // Bidirectional pointers (maintained by Client)
  objectIds?: string[];
  morphismIds?: string[];
  functorsFromIds?: string[];
  functorsToIds?: string[];
}

export interface CreateFunctorInput {
  sourceCategoryId: string;
  targetCategoryId: string;
  properties?: Record<string, unknown>;
  // Bidirectional pointers (maintained by Client)
  objectMappingIds?: string[];
  morphismMappingIds?: string[];
}

/**
 * Maps an object in the source category to an object in the target category.
 * Created as part of defining a functor.
 */
export interface CreateObjectMappingInput {
  functorId: string;
  sourceObjectId: string;
  targetObjectId: string;
}

/**
 * Maps a morphism in the source category to a morphism in the target category.
 * Created as part of defining a functor.
 */
export interface CreateMorphismMappingInput {
  functorId: string;
  sourceMorphismId: string;
  targetMorphismId: string;
}

export type CTCInput = 
  | CreateObjectInput 
  | CreateMorphismInput 
  | CreateCategoryInput 
  | CreateFunctorInput 
  | CreateObjectMappingInput 
  | CreateMorphismMappingInput 
  | null;
