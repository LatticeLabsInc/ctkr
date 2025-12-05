// RichCategory - Rich wrapper for Category with query methods

import type { StoredCTC } from '../stores/Store.interface.js';
import type { QueryEngine } from '../client/QueryEngine.js';
import type { CreateCategoryInput } from '../types/index.js';
import { RichCTC } from './RichCTC.js';
import { RichObject } from './RichObject.js';
import { RichMorphism } from './RichMorphism.js';
import { RichFunctor } from './RichFunctor.js';

/**
 * Rich Category with query methods.
 */
export class RichCategory extends RichCTC {
  constructor(stored: StoredCTC, queryEngine: QueryEngine) {
    super(stored, queryEngine);
  }

  /** Category-specific data */
  get categoryData(): CreateCategoryInput | null {
    return this.stored.data as CreateCategoryInput | null;
  }

  /** Custom properties */
  get properties(): Record<string, unknown> | undefined {
    return this.categoryData?.properties;
  }

  /**
   * Get all objects in this category.
   */
  async getObjects(): Promise<RichObject[]> {
    const objects = await this.queryEngine.getObjectsInCategory(this.signature.id);
    return objects.map(obj => new RichObject(obj, this.queryEngine));
  }

  /**
   * Get a specific object in this category by ID.
   */
  async getObject(objectId: string): Promise<RichObject | undefined> {
    const obj = await this.queryEngine.getObjectInCategory(this.signature.id, objectId);
    return obj ? new RichObject(obj, this.queryEngine) : undefined;
  }

  /**
   * Get all morphisms in this category.
   */
  async getMorphisms(): Promise<RichMorphism[]> {
    const morphisms = await this.queryEngine.getMorphismsInCategory(this.signature.id);
    return morphisms.map(mor => new RichMorphism(mor, this.queryEngine));
  }

  /**
   * Get a specific morphism in this category by ID.
   */
  async getMorphism(morphismId: string): Promise<RichMorphism | undefined> {
    const mor = await this.queryEngine.getMorphismInCategory(this.signature.id, morphismId);
    return mor ? new RichMorphism(mor, this.queryEngine) : undefined;
  }

  /**
   * Get all functors from this category.
   */
  async getFunctorsFrom(): Promise<RichFunctor[]> {
    const functors = await this.queryEngine.getFunctorsFromCategory(this.signature.id);
    return functors.map(fun => new RichFunctor(fun, this.queryEngine));
  }

  /**
   * Get all functors to this category.
   */
  async getFunctorsTo(): Promise<RichFunctor[]> {
    const functors = await this.queryEngine.getFunctorsToCategory(this.signature.id);
    return functors.map(fun => new RichFunctor(fun, this.queryEngine));
  }
}

