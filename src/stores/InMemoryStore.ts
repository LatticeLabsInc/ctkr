// An in-memory implementation of the Store interface.
// Useful for testing, prototyping, and temporary storage.

import { AbstractStore } from './AbstractStore.js';
import type { StoredCTC, BaseStoreConfig } from './Store.interface.js';
import type { SignatureId } from '../constructs/Signature.js';

export interface InMemoryStoreConfig extends BaseStoreConfig {
  name?: string;
}

export class InMemoryStore extends AbstractStore {
  readonly id: string;
  readonly name: string;
  private constructs: Map<SignatureId, StoredCTC> = new Map();

  constructor(name?: string | InMemoryStoreConfig) {
    super();
    if (typeof name === 'string') {
      this.id = crypto.randomUUID();
      this.name = name;
    } else {
      this.id = name?.id ?? crypto.randomUUID();
      this.name = name?.name ?? 'unnamed';
    }
  }

  async disconnect(): Promise<void> {
    this.constructs.clear();
  }

  // Storage primitives

  protected async _store(id: SignatureId, ctc: StoredCTC): Promise<void> {
    this.constructs.set(id, ctc);
  }

  protected async _retrieve(id: SignatureId): Promise<StoredCTC | undefined> {
    return this.constructs.get(id);
  }

  protected async _remove(id: SignatureId): Promise<boolean> {
    return this.constructs.delete(id);
  }

  protected async _getAll(): Promise<StoredCTC[]> {
    return Array.from(this.constructs.values());
  }
}
