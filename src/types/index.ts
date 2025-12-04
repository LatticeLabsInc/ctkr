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
  name?: string;
  categoryId?: string;
  metadata?: Record<string, unknown>;
}

export interface MorphismData {
  from: { signature: { id: string } };
  to: { signature: { id: string } };
  categoryId?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface CategoryData {
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface FunctorData {
  source: { signature: { id: string } };
  target: { signature: { id: string } };
  name?: string;
  metadata?: Record<string, unknown>;
}

export type CTCData = ObjectData | MorphismData | CategoryData | FunctorData | null;
