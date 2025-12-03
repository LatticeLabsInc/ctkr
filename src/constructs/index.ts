// Constructs module - category-theoretic constructs

export type { CTObject } from './Object.js';
export { createObject, objectsEqual } from './Object.js';

export type { CTMorphism } from './Morphism.js';
export { createMorphism, identityMorphism, compose, areComposable } from './Morphism.js';

export type { CTCategory } from './Category.js';
export { createCategory, getObjects, getMorphisms, getHomSet, isValidCategory } from './Category.js';

export type { CTFunctor, ObjectMapping, MorphismMapping } from './Functor.js';
export { createFunctor, applyToObject, applyToMorphism, isValidFunctor, composeFunctors } from './Functor.js';

