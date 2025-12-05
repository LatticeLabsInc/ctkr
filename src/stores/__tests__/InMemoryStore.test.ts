import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from '../InMemoryStore.js';
import { ObjectType, MorphismType, FunctorType } from '../../types/index.js';

describe('InMemoryStore', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore('test-store');
  });

  describe('constructor', () => {
    it('creates a store with a unique ID when given a string name', () => {
      const s = new InMemoryStore('my-store');
      expect(s.id).toBeDefined();
      expect(typeof s.id).toBe('string');
      expect(s.name).toBe('my-store');
    });

    it('uses provided ID from config object', () => {
      const s = new InMemoryStore({ id: 'custom-id', name: 'named-store' });
      expect(s.id).toBe('custom-id');
      expect(s.name).toBe('named-store');
    });

    it('generates ID and defaults name when config is undefined', () => {
      const s = new InMemoryStore();
      expect(s.id).toBeDefined();
      expect(s.name).toBe('unnamed');
    });
  });

  describe('connect/disconnect', () => {
    it('connect is a no-op', async () => {
      await expect(store.connect()).resolves.toBeUndefined();
    });

    it('disconnect clears all constructs', async () => {
      await store.create(ObjectType, null);
      await store.disconnect();
      const results = await store.search({});
      expect(results).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('creates an Object with null data and metadata', async () => {
      const obj = await store.create(ObjectType, null, { name: 'test-obj' });
      
      expect(obj.signature).toBeDefined();
      expect(obj.signature.id).toBeDefined();
      expect(obj.signature.storeId).toBe(store.id);
      expect(obj.signature.version).toBe(1);
      expect(obj.type).toBe(ObjectType);
      expect(obj.data).toBeNull();
      expect(obj.metadata).toBeDefined();
      expect(obj.metadata.name).toBe('test-obj');
      expect(obj.metadata.createdAt).toBeInstanceOf(Date);
      expect(obj.metadata.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a Morphism with sourceId/targetId data', async () => {
      const obj1 = await store.create(ObjectType, null);
      const obj2 = await store.create(ObjectType, null);
      const morphism = await store.create(MorphismType, { 
        sourceId: obj1.signature.id, 
        targetId: obj2.signature.id 
      });

      expect(morphism.type).toBe(MorphismType);
      expect(morphism.data).toEqual({ 
        sourceId: obj1.signature.id, 
        targetId: obj2.signature.id 
      });
    });

    it('generates unique IDs for each construct', async () => {
      const obj1 = await store.create(ObjectType, null);
      const obj2 = await store.create(ObjectType, null);
      
      expect(obj1.signature.id).not.toBe(obj2.signature.id);
    });

    it('creates with name and description', async () => {
      const obj = await store.create(ObjectType, null, { 
        name: 'My Object', 
        description: 'A test object' 
      });
      
      expect(obj.metadata.name).toBe('My Object');
      expect(obj.metadata.description).toBe('A test object');
    });
  });

  describe('read', () => {
    it('reads an existing construct by signature ID', async () => {
      const created = await store.create(ObjectType, null, { name: 'test-obj' });
      const read = await store.read(created.signature.id);

      expect(read).toBeDefined();
      expect(read?.signature.id).toBe(created.signature.id);
      expect(read?.metadata.name).toBe('test-obj');
    });

    it('returns undefined for non-existent ID', async () => {
      const result = await store.read('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates an existing construct and increments version', async () => {
      const created = await store.create(ObjectType, null, { name: 'original' });
      const updated = await store.update(created.signature.id, null, { name: 'updated' });

      expect(updated.signature.id).toBe(created.signature.id);
      expect(updated.signature.version).toBe(2);
      expect(updated.metadata.name).toBe('updated');
      expect(updated.metadata.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.metadata.createdAt.getTime()
      );
    });

    it('throws for non-existent ID', async () => {
      await expect(store.update('non-existent', null, { name: 'test' }))
        .rejects.toThrow('Construct not found');
    });
  });

  describe('delete', () => {
    it('deletes an existing construct', async () => {
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
      await store.create(MorphismType, { sourceId: 'a', targetId: 'b' });

      const objects = await store.list(ObjectType);
      const morphisms = await store.list(MorphismType);

      expect(objects).toHaveLength(2);
      expect(morphisms).toHaveLength(1);
    });

    it('returns empty array when no constructs of type exist', async () => {
      await store.create(ObjectType, null);
      const functors = await store.list(FunctorType);
      expect(functors).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('returns all constructs when query is empty', async () => {
      await store.create(ObjectType, null);
      await store.create(MorphismType, { sourceId: 'a', targetId: 'b' });

      const results = await store.search({});
      expect(results).toHaveLength(2);
    });

    it('filters by type when specified', async () => {
      await store.create(ObjectType, null);
      await store.create(MorphismType, { sourceId: 'a', targetId: 'b' });

      const results = await store.search({ type: ObjectType });
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(ObjectType);
    });
  });
});
