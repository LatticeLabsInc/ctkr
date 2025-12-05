// RichMorphism - Rich wrapper for Morphism with query methods

import type { StoredCTC } from '../stores/Store.interface.js';
import type { QueryEngine } from '../client/QueryEngine.js';
import type { CreateMorphismInput } from '../types/index.js';
import { RichCTC } from './RichCTC.js';
import { RichObject } from './RichObject.js';
import { RichCategory } from './RichCategory.js';

/**
 * Rich Morphism with query methods.
 */
export class RichMorphism extends RichCTC {
  constructor(stored: StoredCTC, queryEngine: QueryEngine) {
    super(stored, queryEngine);
  }

  /** Morphism-specific data */
  get morphismData(): CreateMorphismInput | null {
    return this.stored.data as CreateMorphismInput | null;
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

