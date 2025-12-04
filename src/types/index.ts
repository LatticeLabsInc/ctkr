// Core CTKR types

export type CTCType = 'Object' | 'Morphism' | 'Category' | 'Functor';

// Type constants for use in createCTC calls
export const ObjectType: CTCType = 'Object';
export const MorphismType: CTCType = 'Morphism';
export const CategoryType: CTCType = 'Category';
export const FunctorType: CTCType = 'Functor';

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
  from: { signature: { id: string } };
  to: { signature: { id: string } };
  categoryId?: string;
  properties?: Record<string, unknown>;
}

export interface CategoryData {
  properties?: Record<string, unknown>;
}

export interface FunctorData {
  source: { signature: { id: string } };
  target: { signature: { id: string } };
  properties?: Record<string, unknown>;
}

export type CTCData = ObjectData | MorphismData | CategoryData | FunctorData | null;
