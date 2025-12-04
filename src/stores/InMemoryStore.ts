// An in-memory implementation of the Store interface.
// Useful for testing, prototyping, and temporary storage.

import type { Store, StoredCTC, StoreQuery, BaseStoreConfig } from './Store.interface.js';
import type { CTCType, CTCData } from '../types/index.js';
import type { SignatureId } from '../constructs/Signature.js';
import { createSignature, incrementVersion } from '../constructs/Signature.js';

export interface InMemoryStoreConfig extends BaseStoreConfig {
  name?: string;
}

export class InMemoryStore implements Store {
  readonly id: string;
  readonly name: string;
  private constructs: Map<SignatureId, StoredCTC> = new Map();

  constructor(name?: string | InMemoryStoreConfig) {
    if (typeof name === 'string') {
      this.id = crypto.randomUUID();
      this.name = name;
    } else {
      this.id = name?.id ?? crypto.randomUUID();
      this.name = name?.name ?? 'unnamed';
    }
  }

  async connect(): Promise<void> {
    // No-op for in-memory store
  }

  async disconnect(): Promise<void> {
    this.constructs.clear();
  }

  async create(type: CTCType, data: CTCData): Promise<StoredCTC> {
    const signature = createSignature(this.id);
    const now = new Date();

    const stored: StoredCTC = {
      signature,
      type,
      data,
      createdAt: now,
      updatedAt: now,
    };

    this.constructs.set(signature.id, stored);
    return stored;
  }

  async read(id: SignatureId): Promise<StoredCTC | undefined> {
    return this.constructs.get(id);
  }

  async update(id: SignatureId, data: CTCData): Promise<StoredCTC> {
    const existing = this.constructs.get(id);
    if (!existing) {
      throw new Error(`Construct not found: ${id}`);
    }

    const updated: StoredCTC = {
      ...existing,
      signature: incrementVersion(existing.signature),
      data,
      updatedAt: new Date(),
    };

    this.constructs.set(id, updated);
    return updated;
  }

  async delete(id: SignatureId): Promise<boolean> {
    return this.constructs.delete(id);
  }

  async list(type: CTCType): Promise<StoredCTC[]> {
    return Array.from(this.constructs.values()).filter(c => c.type === type);
  }

  async search(query: StoreQuery): Promise<StoredCTC[]> {
    let results = Array.from(this.constructs.values());
    if (query.type) {
      results = results.filter(c => c.type === query.type);
    }
    return results;
  }
}
