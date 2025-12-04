// MockStore - A mock implementation of the Store interface for testing.

import type { Store, StoredCTC, StoreQuery, CreateOptions } from '../Store.interface.js';
import type { CTCType, CTCData } from '../../types/index.js';
import type { SignatureId } from '../../constructs/Signature.js';
import { createSignature, incrementVersion } from '../../constructs/Signature.js';
import { createMetadata, updateMetadata } from '../../constructs/Metadata.js';

export class MockStore implements Store {
  readonly id: string;
  private constructs: Map<SignatureId, StoredCTC> = new Map();

  // Track method calls for assertions
  readonly calls = {
    connect: [] as Array<{ args: [] }>,
    disconnect: [] as Array<{ args: [] }>,
    create: [] as Array<{ args: [CTCType, CTCData, CreateOptions?] }>,
    read: [] as Array<{ args: [SignatureId] }>,
    update: [] as Array<{ args: [SignatureId, CTCData, CreateOptions?] }>,
    delete: [] as Array<{ args: [SignatureId] }>,
    list: [] as Array<{ args: [CTCType] }>,
    search: [] as Array<{ args: [StoreQuery] }>,
  };

  constructor(id?: string) {
    this.id = id ?? 'mock-store-' + crypto.randomUUID();
  }

  /** Reset all stored data and call tracking */
  reset(): void {
    this.constructs.clear();
    this.calls.connect = [];
    this.calls.disconnect = [];
    this.calls.create = [];
    this.calls.read = [];
    this.calls.update = [];
    this.calls.delete = [];
    this.calls.list = [];
    this.calls.search = [];
  }

  async connect(): Promise<void> {
    this.calls.connect.push({ args: [] });
  }

  async disconnect(): Promise<void> {
    this.calls.disconnect.push({ args: [] });
    this.constructs.clear();
  }

  async create(type: CTCType, data: CTCData, options?: CreateOptions): Promise<StoredCTC> {
    this.calls.create.push({ args: [type, data, options] });

    const signature = createSignature(this.id);
    const metadata = createMetadata({
      name: options?.name,
      description: options?.description,
    });

    const stored: StoredCTC = {
      signature,
      metadata,
      type,
      data,
    };

    this.constructs.set(signature.id, stored);
    return stored;
  }

  async read(id: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.read.push({ args: [id] });
    return this.constructs.get(id);
  }

  async update(id: SignatureId, data: CTCData, options?: CreateOptions): Promise<StoredCTC> {
    this.calls.update.push({ args: [id, data, options] });

    const existing = this.constructs.get(id);
    if (!existing) {
      throw new Error(`Construct not found: ${id}`);
    }

    const updated: StoredCTC = {
      ...existing,
      signature: incrementVersion(existing.signature),
      metadata: updateMetadata(existing.metadata, {
        name: options?.name ?? existing.metadata.name,
        description: options?.description ?? existing.metadata.description,
      }),
      data,
    };

    this.constructs.set(id, updated);
    return updated;
  }

  async delete(id: SignatureId): Promise<boolean> {
    this.calls.delete.push({ args: [id] });
    return this.constructs.delete(id);
  }

  async list(type: CTCType): Promise<StoredCTC[]> {
    this.calls.list.push({ args: [type] });
    return Array.from(this.constructs.values()).filter(c => c.type === type);
  }

  async search(query: StoreQuery): Promise<StoredCTC[]> {
    this.calls.search.push({ args: [query] });
    let results = Array.from(this.constructs.values());
    if (query.type) {
      results = results.filter(c => c.type === query.type);
    }
    return results;
  }
}

