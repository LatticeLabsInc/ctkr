// toRich - Factory function to create rich constructs from stored data

import type { StoredCTC } from '../stores/Store.interface.js';
import type { QueryEngine } from '../client/QueryEngine.js';
import { RichCTC } from './RichCTC.js';
import { RichCategory } from './RichCategory.js';
import { RichObject } from './RichObject.js';
import { RichMorphism } from './RichMorphism.js';
import { RichFunctor } from './RichFunctor.js';

/**
 * Create a rich construct from a stored CTC.
 */
export function toRich(stored: StoredCTC, queryEngine: QueryEngine): RichCTC {
  switch (stored.type) {
    case 'Category':
      return new RichCategory(stored, queryEngine);
    case 'Object':
      return new RichObject(stored, queryEngine);
    case 'Morphism':
      return new RichMorphism(stored, queryEngine);
    case 'Functor':
      return new RichFunctor(stored, queryEngine);
    default:
      // For ObjectMapping, MorphismMapping, or unknown types
      return new (class extends RichCTC {})(stored, queryEngine);
  }
}

