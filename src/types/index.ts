// TODO: Define core CTKR types
//
// Types to implement:
// - CTCId: Unique identifier for category-theoretic constructs
// - CTCType: Enum/union of construct types (Object, Morphism, Category, Functor)
// - StoreId: Unique identifier for stores
// - ClientConfig: Configuration options for CTKR client
// - StoreConfig: Configuration options for stores

export type CTCId = string;

export type CTCType = 'Object' | 'Morphism' | 'Category' | 'Functor';

export type StoreId = string;

export interface ClientConfig {
  // TODO: Define client configuration options
}

export interface StoreConfig {
  // TODO: Define store configuration options
}

