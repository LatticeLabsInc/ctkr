// Constructs module - category-theoretic constructs

export type { Signature, SignatureId, Version } from './Signature.js';
export { createSignature, incrementVersion, signaturesEqual } from './Signature.js';

export type { CTObject } from './Object.js';
export { objectsEqual } from './Object.js';

export type { CTMorphism } from './Morphism.js';
export { areComposable, morphismsEqual } from './Morphism.js';

export type { CTCategory } from './Category.js';
export { categoriesEqual } from './Category.js';

export type { CTFunctor, ObjectMapping, MorphismMapping } from './Functor.js';
export { functorsEqual } from './Functor.js';
