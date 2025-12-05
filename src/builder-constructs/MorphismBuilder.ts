// MorphismBuilder - Builder for creating Morphism constructs

import type { Client } from '../client/Client.js';
import type { Store } from '../stores/Store.interface.js';
import type { RichCategory, RichObject, RichMorphism } from '../rich-constructs/index.js';
import type { IMorphismBuilder, ReadyResult } from './types.js';

/**
 * Builder for creating Morphism constructs.
 * 
 * Usage:
 * ```
 * const builder = new MorphismBuilder(client);
 * builder.inStore(store).fromObject(A).toObject(B).withName('f');
 * if (builder.isReady().ready) {
 *   const morphism = await builder.build();
 * }
 * ```
 */
export class MorphismBuilder implements IMorphismBuilder {
  private _store: Store | null = null;
  private _category: RichCategory | string | null = null;
  private _source: RichObject | string | null = null;
  private _target: RichObject | string | null = null;
  private _name: string | null = null;
  private _description: string | null = null;
  private _properties: Record<string, unknown> | null = null;

  constructor(private readonly client: Client) {}

  inStore(store: Store): this {
    this._store = store;
    return this;
  }

  inCategory(category: RichCategory | string): this {
    this._category = category;
    return this;
  }

  fromObject(source: RichObject | string): this {
    this._source = source;
    return this;
  }

  toObject(target: RichObject | string): this {
    this._target = target;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withDescription(description: string): this {
    this._description = description;
    return this;
  }

  withProperties(properties: Record<string, unknown>): this {
    this._properties = properties;
    return this;
  }

  isReady(): ReadyResult {
    const missing: string[] = [];
    
    if (!this._store) {
      missing.push('store: Call inStore(store) to set the store');
    }
    
    if (!this._source) {
      missing.push('source: Call fromObject(object) to set the source object');
    }
    
    if (!this._target) {
      missing.push('target: Call toObject(object) to set the target object');
    }
    
    return {
      ready: missing.length === 0,
      missing,
    };
  }

  async build(): Promise<RichMorphism> {
    const readyResult = this.isReady();
    if (!readyResult.ready) {
      throw new Error(
        `Cannot build Morphism: missing required fields.\n${readyResult.missing.join('\n')}`
      );
    }

    const options: { name?: string; description?: string; properties?: Record<string, unknown> } = {};
    if (this._name) options.name = this._name;
    if (this._description) options.description = this._description;
    if (this._properties) options.properties = this._properties;

    // Get category from source object if not explicitly set
    let category: RichCategory | string | undefined = this._category ?? undefined;
    if (!category && this._source) {
      if (typeof this._source !== 'string') {
        category = this._source.objectData?.categoryId;
      }
    }

    // createMorphism(source, target, store, category?, options?)
    return this.client.createMorphism(this._source!, this._target!, this._store!, category, options);
  }
}

