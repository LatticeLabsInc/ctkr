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

// Data types for construct creation
export interface ObjectData {
  categoryId?: string;
  properties?: Record<string, unknown>;
}

export interface MorphismData {
  sourceId: string;
  targetId: string;
  categoryId?: string;
  properties?: Record<string, unknown>;
}

export interface CategoryData {
  properties?: Record<string, unknown>;
}

export interface FunctorData {
  sourceCategoryId: string;
  targetCategoryId: string;
  properties?: Record<string, unknown>;
}

/**
 * Maps an object in the source category to an object in the target category.
 * Created as part of defining a functor.
 */
export interface ObjectMappingData {
  functorId: string;
  sourceObjectId: string;
  targetObjectId: string;
}

/**
 * Maps a morphism in the source category to a morphism in the target category.
 * Created as part of defining a functor.
 */
export interface MorphismMappingData {
  functorId: string;
  sourceMorphismId: string;
  targetMorphismId: string;
}

export type CTCData = ObjectData | MorphismData | CategoryData | FunctorData | ObjectMappingData | MorphismMappingData | null;
