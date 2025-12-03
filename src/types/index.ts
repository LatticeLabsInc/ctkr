// Core CTKR types

export type CTCId = string;

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

export interface StoreConfig {
  // TODO: Define store configuration options
}

// Data types for construct creation
export interface ObjectData {
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface MorphismData {
  from: { id: CTCId };
  to: { id: CTCId };
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface CategoryData {
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface FunctorData {
  source: { id: CTCId };
  target: { id: CTCId };
  name?: string;
  metadata?: Record<string, unknown>;
}

export type CTCData = ObjectData | MorphismData | CategoryData | FunctorData | null;
