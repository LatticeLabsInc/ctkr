// RichFunctor - Rich wrapper for Functor with query methods

import type { StoredCTC } from '../stores/Store.interface.js';
import type { QueryEngine } from '../client/QueryEngine.js';
import type { CreateFunctorInput } from '../types/index.js';
import { RichCTC } from './RichCTC.js';
import { RichCategory } from './RichCategory.js';
import { RichObject } from './RichObject.js';
import { RichMorphism } from './RichMorphism.js';

/**
 * Rich Functor with query methods.
 */
export class RichFunctor extends RichCTC {
  constructor(stored: StoredCTC, queryEngine: QueryEngine) {
    super(stored, queryEngine);
  }

  /** Functor-specific data */
  get functorData(): CreateFunctorInput | null {
    return this.stored.data as CreateFunctorInput | null;
  }

  /** The source category ID */
  get sourceCategoryId(): string | undefined {
    return this.functorData?.sourceCategoryId;
  }

  /** The target category ID */
  get targetCategoryId(): string | undefined {
    return this.functorData?.targetCategoryId;
  }

  /** Custom properties */
  get properties(): Record<string, unknown> | undefined {
    return this.functorData?.properties;
  }

  /**
   * Get the source category.
   */
  async getSourceCategory(): Promise<RichCategory | undefined> {
    const cat = await this.queryEngine.getSourceCategory(this.signature.id);
    return cat ? new RichCategory(cat, this.queryEngine) : undefined;
  }

  /**
   * Get the target category.
   */
  async getTargetCategory(): Promise<RichCategory | undefined> {
    const cat = await this.queryEngine.getTargetCategory(this.signature.id);
    return cat ? new RichCategory(cat, this.queryEngine) : undefined;
  }

  /**
   * Get all source objects (objects in source category that have mappings).
   */
  async getSourceObjects(): Promise<RichObject[]> {
    const objects = await this.queryEngine.getSourceObjects(this.signature.id);
    return objects.map(obj => new RichObject(obj, this.queryEngine));
  }

  /**
   * Get all target objects (images under this functor).
   */
  async getTargetObjects(): Promise<RichObject[]> {
    const objects = await this.queryEngine.getTargetObjects(this.signature.id);
    return objects.map(obj => new RichObject(obj, this.queryEngine));
  }

  /**
   * Get the target object for a given source object (image under functor).
   * @param obj - The source object (or its signature ID)
   */
  async getTargetObject(obj: RichObject | string): Promise<RichObject | undefined> {
    const sourceId = typeof obj === 'string' ? obj : obj.signature.id;
    const target = await this.queryEngine.getTargetObjectForSource(this.signature.id, sourceId);
    return target ? new RichObject(target, this.queryEngine) : undefined;
  }

  /**
   * Get all source objects that map to the given target object (preimage).
   * @param obj - The target object (or its signature ID)
   */
  async getSourceObjectsFor(obj: RichObject | string): Promise<RichObject[]> {
    const targetId = typeof obj === 'string' ? obj : obj.signature.id;
    const sources = await this.queryEngine.getSourceObjectsForTarget(this.signature.id, targetId);
    return sources.map(o => new RichObject(o, this.queryEngine));
  }

  /**
   * Get all source morphisms (morphisms in source category that have mappings).
   */
  async getSourceMorphisms(): Promise<RichMorphism[]> {
    const morphisms = await this.queryEngine.getSourceMorphisms(this.signature.id);
    return morphisms.map(mor => new RichMorphism(mor, this.queryEngine));
  }

  /**
   * Get all target morphisms (images under this functor).
   */
  async getTargetMorphisms(): Promise<RichMorphism[]> {
    const morphisms = await this.queryEngine.getTargetMorphisms(this.signature.id);
    return morphisms.map(mor => new RichMorphism(mor, this.queryEngine));
  }

  /**
   * Get the target morphism for a given source morphism (image under functor).
   * @param mor - The source morphism (or its signature ID)
   */
  async getTargetMorphism(mor: RichMorphism | string): Promise<RichMorphism | undefined> {
    const sourceId = typeof mor === 'string' ? mor : mor.signature.id;
    const target = await this.queryEngine.getTargetMorphismForSource(this.signature.id, sourceId);
    return target ? new RichMorphism(target, this.queryEngine) : undefined;
  }

  /**
   * Get all source morphisms that map to the given target morphism (preimage).
   * @param mor - The target morphism (or its signature ID)
   */
  async getSourceMorphismsFor(mor: RichMorphism | string): Promise<RichMorphism[]> {
    const targetId = typeof mor === 'string' ? mor : mor.signature.id;
    const sources = await this.queryEngine.getSourceMorphismsForTarget(this.signature.id, targetId);
    return sources.map(m => new RichMorphism(m, this.queryEngine));
  }

  /**
   * Get all object mappings for this functor.
   * Returns the raw ObjectMapping StoredCTC objects.
   */
  async getObjectMappings(): Promise<StoredCTC[]> {
    return this.queryEngine.getObjectMappings(this.signature.id);
  }

  /**
   * Get all morphism mappings for this functor.
   * Returns the raw MorphismMapping StoredCTC objects.
   */
  async getMorphismMappings(): Promise<StoredCTC[]> {
    return this.queryEngine.getMorphismMappings(this.signature.id);
  }
}

