// RichObject - Rich wrapper for Object with query methods

import type { StoredCTC } from '../stores/Store.interface.js';
import type { QueryEngine } from '../client/QueryEngine.js';
import type { CreateObjectInput } from '../types/index.js';
import { RichCTC } from './RichCTC.js';
import { RichMorphism } from './RichMorphism.js';
import { RichCategory } from './RichCategory.js';

/**
 * Rich Object with query methods.
 */
export class RichObject extends RichCTC {
  constructor(stored: StoredCTC, queryEngine: QueryEngine) {
    super(stored, queryEngine);
  }

  /** Object-specific data */
  get objectData(): CreateObjectInput | null {
    return this.stored.data as CreateObjectInput | null;
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

  /**
   * Get the identity morphism ID for this object (if available).
   */
  get identityMorphismId(): string | undefined {
    return this.objectData?.identityMorphismId;
  }

  /**
   * Get the identity morphism for this object.
   * Every object has an identity morphism (id_A: A → A) that is automatically
   * created when the object is created.
   */
  async getIdentityMorphism(): Promise<RichMorphism | undefined> {
    const id = this.identityMorphismId;
    if (!id) return undefined;
    const mor = await this.queryEngine.get(id);
    return mor ? new RichMorphism(mor, this.queryEngine) : undefined;
  }
}

