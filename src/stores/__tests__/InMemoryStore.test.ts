import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from '../InMemoryStore.js';
import { ObjectType, MorphismType } from '../../types/index.js';

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
      await store.create('Object', null);
      await store.disconnect();
      const results = await store.search({});
      expect(results).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('creates an Object with null data', async () => {
      const obj = await store.create('Object', null);
      
      expect(obj.id).toBeDefined();
      expect(obj.type).toBe('Object');
      expect(obj.data).toBeNull();
      expect(obj.storeId).toBe(store.id);
      expect(obj.createdAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a Morphism with from/to data', async () => {
      const obj1 = await store.create('Object', null);
      const obj2 = await store.create('Object', null);
      const morphism = await store.create('Morphism', { from: obj1, to: obj2 });

      expect(morphism.type).toBe('Morphism');
      expect(morphism.data).toEqual({ from: obj1, to: obj2 });
    });

    it('generates unique IDs for each construct', async () => {
      const obj1 = await store.create('Object', null);
      const obj2 = await store.create('Object', null);
      
      expect(obj1.id).not.toBe(obj2.id);
    });
  });

  describe('read', () => {
    it('reads an existing construct by ID', async () => {
      const created = await store.create('Object', { name: 'test-obj' });
      const read = await store.read(created.id);

      expect(read).toBeDefined();
      expect(read?.id).toBe(created.id);
      expect(read?.data).toEqual({ name: 'test-obj' });
    });

    it('returns undefined for non-existent ID', async () => {
      const result = await store.read('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates an existing construct', async () => {
      const created = await store.create('Object', { name: 'original' });
      const updated = await store.update(created.id, { name: 'updated' });

      expect(updated.id).toBe(created.id);
      expect(updated.data).toEqual({ name: 'updated' });
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it('throws for non-existent ID', async () => {
      await expect(store.update('non-existent', { name: 'test' }))
        .rejects.toThrow('Construct not found');
    });
  });

  describe('delete', () => {
    it('deletes an existing construct', async () => {
      const created = await store.create('Object', null);
      const deleted = await store.delete(created.id);
      
      expect(deleted).toBe(true);
      expect(await store.read(created.id)).toBeUndefined();
    });

    it('returns false for non-existent ID', async () => {
      const deleted = await store.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('list', () => {
    it('returns all constructs of a given type', async () => {
      await store.create('Object', null);
      await store.create('Object', null);
      await store.create('Morphism', { from: { id: 'a' }, to: { id: 'b' } });

      const objects = await store.list('Object');
      const morphisms = await store.list('Morphism');

      expect(objects).toHaveLength(2);
      expect(morphisms).toHaveLength(1);
    });

    it('returns empty array when no constructs of type exist', async () => {
      await store.create('Object', null);
      const functors = await store.list('Functor');
      expect(functors).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('returns all constructs when query is empty', async () => {
      await store.create('Object', null);
      await store.create('Morphism', { from: { id: 'a' }, to: { id: 'b' } });

      const results = await store.search({});
      expect(results).toHaveLength(2);
    });

    it('filters by type when specified', async () => {
      await store.create('Object', null);
      await store.create('Morphism', { from: { id: 'a' }, to: { id: 'b' } });

      const results = await store.search({ type: 'Object' });
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('Object');
    });
  });
});
