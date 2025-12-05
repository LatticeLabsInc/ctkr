// ObjectBuilder - Builder for creating Object constructs

import type { Client } from '../client/Client.js';
import type { Store } from '../stores/Store.interface.js';
import type { RichCategory, RichObject } from '../rich-constructs/index.js';
import type { IObjectBuilder, ReadyResult } from './types.js';

/**
 * Builder for creating Object constructs.
 * 
 * Usage:
 * ```
 * const builder = new ObjectBuilder(client);
 * builder.inStore(store).inCategory(category).withName('MyObject');
 * if (builder.isReady().ready) {
 *   const object = await builder.build();
 * }
 * ```
 */
export class ObjectBuilder implements IObjectBuilder {
  private _store: Store | null = null;
  private _category: RichCategory | string | null = null;
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
    
    if (!this._category) {
      missing.push('category: Call inCategory(category) to set the category');
    }
    
    return {
      ready: missing.length === 0,
      missing,
    };
  }

  async build(): Promise<RichObject> {
    const readyResult = this.isReady();
    if (!readyResult.ready) {
      throw new Error(
        `Cannot build Object: missing required fields.\n${readyResult.missing.join('\n')}`
      );
    }

    const options: { name?: string; description?: string; properties?: Record<string, unknown> } = {};
    if (this._name) options.name = this._name;
    if (this._description) options.description = this._description;
    if (this._properties) options.properties = this._properties;

    return this.client.createObject(this._store!, this._category!, options);
  }
}

