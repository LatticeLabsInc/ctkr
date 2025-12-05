// CategoryBuilder - Builder for creating Category constructs

import type { Client } from '../client/Client.js';
import type { Store } from '../stores/Store.interface.js';
import type { RichCategory } from '../rich-constructs/index.js';
import type { ICategoryBuilder, ReadyResult } from './types.js';

/**
 * Builder for creating Category constructs.
 * 
 * Usage:
 * ```
 * const builder = new CategoryBuilder(client);
 * builder.inStore(store).withName('MyCategory');
 * if (builder.isReady().ready) {
 *   const category = await builder.build();
 * }
 * ```
 */
export class CategoryBuilder implements ICategoryBuilder {
  private _store: Store | null = null;
  private _name: string | null = null;
  private _description: string | null = null;
  private _properties: Record<string, unknown> | null = null;

  constructor(private readonly client: Client) {}

  inStore(store: Store): this {
    this._store = store;
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
    
    // Name is optional for Category, but we can suggest it
    // if (!this._name) {
    //   missing.push('name: Call withName(name) to set the name');
    // }
    
    return {
      ready: missing.length === 0,
      missing,
    };
  }

  async build(): Promise<RichCategory> {
    const readyResult = this.isReady();
    if (!readyResult.ready) {
      throw new Error(
        `Cannot build Category: missing required fields.\n${readyResult.missing.join('\n')}`
      );
    }

    const options: { name?: string; description?: string; properties?: Record<string, unknown> } = {};
    if (this._name) options.name = this._name;
    if (this._description) options.description = this._description;
    if (this._properties) options.properties = this._properties;

    return this.client.createCategory(this._store!, options);
  }
}

