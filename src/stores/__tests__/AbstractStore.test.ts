import { describe, it, expect, beforeEach } from 'vitest';
import { AbstractStore } from '../AbstractStore.js';
import type { StoredCTC } from '../Store.interface.js';
import type { SignatureId } from '../../constructs/Signature.js';
import { ObjectType, MorphismType } from '../../types/index.js';

/**
 * Minimal concrete implementation for testing AbstractStore.
 */
class TestStore extends AbstractStore {
  readonly id = 'test-store-id';
  private data: Map<SignatureId, StoredCTC> = new Map();

  protected async _store(id: SignatureId, ctc: StoredCTC): Promise<void> {
    this.data.set(id, ctc);
  }

  protected async _retrieve(id: SignatureId): Promise<StoredCTC | undefined> {
    return this.data.get(id);
  }

  protected async _remove(id: SignatureId): Promise<boolean> {
    return this.data.delete(id);
  }

  protected async _getAll(): Promise<StoredCTC[]> {
    return Array.from(this.data.values());
  }

  // Expose for testing
  clear(): void {
    this.data.clear();
  }
}

describe('AbstractStore', () => {
  let store: TestStore;

  beforeEach(() => {
    store = new TestStore();
  });

  describe('create', () => {
    it('creates a construct with a signature', async () => {
      const result = await store.create(ObjectType, null);

      expect(result.signature).toBeDefined();
      expect(result.signature.id).toBeDefined();
      expect(result.signature.storeId).toBe(store.id);
      expect(result.signature.version).toBe(1);
    });

    it('creates a construct with metadata timestamps', async () => {
      const result = await store.create(ObjectType, null);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.createdAt).toBeInstanceOf(Date);
      expect(result.metadata.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a construct with name and description', async () => {
      const result = await store.create(ObjectType, null, {
        name: 'Test Object',
        description: 'A test description',
      });

      expect(result.metadata.name).toBe('Test Object');
      expect(result.metadata.description).toBe('A test description');
    });

    it('stores the correct type', async () => {
      const obj = await store.create(ObjectType, null);
      const morphism = await store.create(MorphismType, { from: obj, to: obj });

      expect(obj.type).toBe(ObjectType);
      expect(morphism.type).toBe(MorphismType);
    });

    it('stores the correct data', async () => {
      const data = { categoryId: 'cat-1', properties: { key: 'value' } };
      const result = await store.create(ObjectType, data);

      expect(result.data).toEqual(data);
    });

    it('generates unique signature IDs', async () => {
      const obj1 = await store.create(ObjectType, null);
      const obj2 = await store.create(ObjectType, null);

      expect(obj1.signature.id).not.toBe(obj2.signature.id);
    });
  });

  describe('read', () => {
    it('retrieves a stored construct', async () => {
      const created = await store.create(ObjectType, null, { name: 'findme' });
      const found = await store.read(created.signature.id);

      expect(found).toBeDefined();
      expect(found?.signature.id).toBe(created.signature.id);
      expect(found?.metadata.name).toBe('findme');
    });

    it('returns undefined for non-existent ID', async () => {
      const result = await store.read('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('increments the version on update', async () => {
      const created = await store.create(ObjectType, null);
      expect(created.signature.version).toBe(1);

      const updated = await store.update(created.signature.id, null);
      expect(updated.signature.version).toBe(2);

      const updated2 = await store.update(created.signature.id, null);
      expect(updated2.signature.version).toBe(3);
    });

    it('updates the updatedAt timestamp', async () => {
      const created = await store.create(ObjectType, null);
      
      // Small delay to ensure different timestamp
      await new Promise(r => setTimeout(r, 10));
      
      const updated = await store.update(created.signature.id, null);

      expect(updated.metadata.updatedAt.getTime()).toBeGreaterThan(
        created.metadata.createdAt.getTime()
      );
    });

    it('preserves existing metadata when not provided', async () => {
      const created = await store.create(ObjectType, null, {
        name: 'Original',
        description: 'Original desc',
      });

      const updated = await store.update(created.signature.id, null);

      expect(updated.metadata.name).toBe('Original');
      expect(updated.metadata.description).toBe('Original desc');
    });

    it('updates metadata when provided', async () => {
      const created = await store.create(ObjectType, null, { name: 'Original' });

      const updated = await store.update(created.signature.id, null, {
        name: 'Updated',
        description: 'New desc',
      });

      expect(updated.metadata.name).toBe('Updated');
      expect(updated.metadata.description).toBe('New desc');
    });

    it('updates data', async () => {
      const created = await store.create(ObjectType, { categoryId: 'old' });
      const updated = await store.update(created.signature.id, { categoryId: 'new' });

      expect(updated.data).toEqual({ categoryId: 'new' });
    });

    it('throws for non-existent ID', async () => {
      await expect(store.update('non-existent', null))
        .rejects.toThrow('Construct not found: non-existent');
    });
  });

  describe('delete', () => {
    it('removes a construct', async () => {
      const created = await store.create(ObjectType, null);
      const deleted = await store.delete(created.signature.id);

      expect(deleted).toBe(true);
      expect(await store.read(created.signature.id)).toBeUndefined();
    });

    it('returns false for non-existent ID', async () => {
      const deleted = await store.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('list', () => {
    it('returns all constructs of a given type', async () => {
      await store.create(ObjectType, null);
      await store.create(ObjectType, null);
      await store.create(MorphismType, { from: { signature: { id: 'a' } }, to: { signature: { id: 'b' } } });

      const objects = await store.list(ObjectType);
      const morphisms = await store.list(MorphismType);

      expect(objects).toHaveLength(2);
      expect(morphisms).toHaveLength(1);
    });

    it('returns empty array when no constructs of type exist', async () => {
      await store.create(ObjectType, null);
      const morphisms = await store.list(MorphismType);
      expect(morphisms).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('returns all constructs when query is empty', async () => {
      await store.create(ObjectType, null);
      await store.create(MorphismType, { from: { signature: { id: 'a' } }, to: { signature: { id: 'b' } } });

      const results = await store.search({});
      expect(results).toHaveLength(2);
    });

    it('filters by type when specified', async () => {
      await store.create(ObjectType, null);
      await store.create(MorphismType, { from: { signature: { id: 'a' } }, to: { signature: { id: 'b' } } });

      const results = await store.search({ type: ObjectType });
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(ObjectType);
    });
  });

  describe('connect/disconnect', () => {
    it('connect is a no-op by default', async () => {
      await expect(store.connect()).resolves.toBeUndefined();
    });

    it('disconnect is a no-op by default', async () => {
      await expect(store.disconnect()).resolves.toBeUndefined();
    });
  });
});

