// MockStore - A mock implementation of the Store interface for testing.

import { AbstractStore } from '../AbstractStore.js';
import type { StoredCTC, StoreQuery, CreateOptions } from '../Store.interface.js';
import type { CTCType, CTCInput } from '../../types/index.js';
import type { SignatureId } from '../../data-constructs/Signature.js';

export class MockStore extends AbstractStore {
  readonly id: string;
  private constructs: Map<SignatureId, StoredCTC> = new Map();

  // Track method calls for assertions
  readonly calls = {
    connect: [] as Array<{ args: [] }>,
    disconnect: [] as Array<{ args: [] }>,
    create: [] as Array<{ args: [CTCType, CTCInput, CreateOptions?] }>,
    read: [] as Array<{ args: [SignatureId] }>,
    update: [] as Array<{ args: [SignatureId, CTCInput, CreateOptions?] }>,
    delete: [] as Array<{ args: [SignatureId] }>,
    list: [] as Array<{ args: [CTCType] }>,
    search: [] as Array<{ args: [StoreQuery] }>,
  };

  constructor(id?: string) {
    super();
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

  // Override public methods to track calls

  override async connect(): Promise<void> {
    this.calls.connect.push({ args: [] });
    return super.connect();
  }

  override async disconnect(): Promise<void> {
    this.calls.disconnect.push({ args: [] });
    this.constructs.clear();
  }

  override async create(type: CTCType, data: CTCInput, options?: CreateOptions): Promise<StoredCTC> {
    this.calls.create.push({ args: [type, data, options] });
    return super.create(type, data, options);
  }

  override async read(id: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.read.push({ args: [id] });
    return super.read(id);
  }

  override async update(id: SignatureId, data: CTCInput, options?: CreateOptions): Promise<StoredCTC> {
    this.calls.update.push({ args: [id, data, options] });
    return super.update(id, data, options);
  }

  override async delete(id: SignatureId): Promise<boolean> {
    this.calls.delete.push({ args: [id] });
    return super.delete(id);
  }

  override async list(type: CTCType): Promise<StoredCTC[]> {
    this.calls.list.push({ args: [type] });
    return super.list(type);
  }

  override async search(query: StoreQuery): Promise<StoredCTC[]> {
    this.calls.search.push({ args: [query] });
    return super.search(query);
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
