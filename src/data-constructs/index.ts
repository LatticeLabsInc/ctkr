// Data Constructs module - category-theoretic data structures

export type { Signature, SignatureId, Version } from './Signature.js';
export { createSignature, incrementVersion, signaturesEqual } from './Signature.js';

export type { Metadata, MetadataOptions } from './Metadata.js';
export { createMetadata, updateMetadata } from './Metadata.js';

export type { ObjectData } from './ObjectData.js';
export { objectsEqual } from './ObjectData.js';

export type { MorphismData } from './MorphismData.js';
export { areComposable, morphismsEqual } from './MorphismData.js';

export type { CategoryData } from './CategoryData.js';
export { categoriesEqual } from './CategoryData.js';

export type { FunctorData, ObjectMapping, MorphismMapping } from './FunctorData.js';
export { functorsEqual } from './FunctorData.js';

