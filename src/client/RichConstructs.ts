// Rich Construct Classes
//
// These classes wrap StoredCTC and provide convenient methods for
// querying related constructs. They are returned by the Client and
// use the QueryEngine internally.

import type { StoredCTC } from '../stores/Store.interface.js';
import type { Signature } from '../constructs/Signature.js';
import type { Metadata } from '../constructs/Metadata.js';
import type { QueryEngine } from './QueryEngine.js';
import type { 
  CTCData, 
  ObjectData, 
  MorphismData, 
  CategoryData, 
  FunctorData 
} from '../types/index.js';

/**
 * Base class for rich constructs.
 */
export abstract class RichCTC {
  constructor(
    protected readonly stored: StoredCTC,
    protected readonly queryEngine: QueryEngine
  ) {}

  /** The signature of this construct */
  get signature(): Signature {
    return this.stored.signature;
  }

  /** The metadata of this construct */
  get metadata(): Metadata {
    return this.stored.metadata;
  }

  /** The underlying stored data */
  get data(): CTCData {
    return this.stored.data;
  }

  /** The raw StoredCTC */
  get raw(): StoredCTC {
    return this.stored;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RichCategory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rich Category with query methods.
 */
export class RichCategory extends RichCTC {
  /** Category-specific data */
  get categoryData(): CategoryData | null {
    return this.stored.data as CategoryData | null;
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

// ─────────────────────────────────────────────────────────────────────────────
// RichObject
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rich Object with query methods.
 */
export class RichObject extends RichCTC {
  /** Object-specific data */
  get objectData(): ObjectData | null {
    return this.stored.data as ObjectData | null;
  }

  /** The category ID this object belongs to */
  get categoryId(): string | undefined {
    return this.objectData?.categoryId;
  }

  /** Custom properties */
  get properties(): Record<string, unknown> | undefined {
    return this.objectData?.properties;
  }

  /**
   * Get all morphisms from this object.
   */
  async getMorphismsFrom(): Promise<RichMorphism[]> {
    const morphisms = await this.queryEngine.getMorphismsFromObject(this.signature.id);
    return morphisms.map(mor => new RichMorphism(mor, this.queryEngine));
  }

  /**
   * Get all morphisms to this object.
   */
  async getMorphismsTo(): Promise<RichMorphism[]> {
    const morphisms = await this.queryEngine.getMorphismsToObject(this.signature.id);
    return morphisms.map(mor => new RichMorphism(mor, this.queryEngine));
  }

  /**
   * Get the category this object belongs to.
   */
  async getCategory(): Promise<RichCategory | undefined> {
    if (!this.categoryId) return undefined;
    const cat = await this.queryEngine.get(this.categoryId);
    return cat ? new RichCategory(cat, this.queryEngine) : undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RichMorphism
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rich Morphism with query methods.
 */
export class RichMorphism extends RichCTC {
  /** Morphism-specific data */
  get morphismData(): MorphismData | null {
    return this.stored.data as MorphismData | null;
  }

  /** The source object ID */
  get sourceId(): string | undefined {
    return this.morphismData?.sourceId;
  }

  /** The target object ID */
  get targetId(): string | undefined {
    return this.morphismData?.targetId;
  }

  /** The category ID this morphism belongs to */
  get categoryId(): string | undefined {
    return this.morphismData?.categoryId;
  }

  /** Custom properties */
  get properties(): Record<string, unknown> | undefined {
    return this.morphismData?.properties;
  }

  /**
   * Get the source object.
   */
  async getSourceObject(): Promise<RichObject | undefined> {
    const obj = await this.queryEngine.getSourceObject(this.signature.id);
    return obj ? new RichObject(obj, this.queryEngine) : undefined;
  }

  /**
   * Get the target object.
   */
  async getTargetObject(): Promise<RichObject | undefined> {
    const obj = await this.queryEngine.getTargetObject(this.signature.id);
    return obj ? new RichObject(obj, this.queryEngine) : undefined;
  }

  /**
   * Get the category this morphism belongs to.
   */
  async getCategory(): Promise<RichCategory | undefined> {
    if (!this.categoryId) return undefined;
    const cat = await this.queryEngine.get(this.categoryId);
    return cat ? new RichCategory(cat, this.queryEngine) : undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RichFunctor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rich Functor with query methods.
 */
export class RichFunctor extends RichCTC {
  /** Functor-specific data */
  get functorData(): FunctorData | null {
    return this.stored.data as FunctorData | null;
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory function
// ─────────────────────────────────────────────────────────────────────────────

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
      return new (class extends RichCTC {})(stored, queryEngine);
  }
}

