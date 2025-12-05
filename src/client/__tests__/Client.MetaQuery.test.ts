import { describe, it, expect, beforeEach } from 'vitest';
import { Client, MetaQuery } from '../Client.js';
import { MockStore } from '../../stores/mocks/MockStore.js';
import { ObjectType, MorphismType, CategoryType } from '../../types/index.js';

describe('MetaQuery', () => {
  let client: Client;
  let store: MockStore;

  beforeEach(() => {
    client = new Client();
    store = new MockStore('test-store');
    client.attachStore(store);
  });

  describe('client.meta()', () => {
    it('returns a MetaQuery instance', () => {
      const query = client.meta();
      expect(query).toBeInstanceOf(MetaQuery);
    });

    it('accepts a specific store to search in', () => {
      const query = client.meta(store);
      expect(query).toBeInstanceOf(MetaQuery);
    });
  });

  describe('find', () => {
    it('finds constructs by exact name match', async () => {
      await client.createCTC(ObjectType, null, store, { name: 'apple' });
      await client.createCTC(ObjectType, null, store, { name: 'banana' });
      await client.createCTC(ObjectType, null, store, { name: 'apple' });

      const results = await client.meta().find(ObjectType, 'apple');

      expect(results).toHaveLength(2);
      expect(results.every(r => r.metadata.name === 'apple')).toBe(true);
    });

    it('returns empty array when no matches', async () => {
      await client.createCTC(ObjectType, null, store, { name: 'apple' });

      const results = await client.meta().find(ObjectType, 'orange');

      expect(results).toHaveLength(0);
    });

    it('filters by type', async () => {
      await client.createCTC(ObjectType, null, store, { name: 'test' });
      await client.createCTC(CategoryType, null, store, { name: 'test' });

      const objects = await client.meta().find(ObjectType, 'test');
      const categories = await client.meta().find(CategoryType, 'test');

      expect(objects).toHaveLength(1);
      expect(objects[0].type).toBe(ObjectType);
      expect(categories).toHaveLength(1);
      expect(categories[0].type).toBe(CategoryType);
    });

    it('searches across multiple stores', async () => {
      const store2 = new MockStore('store-2');
      client.attachStore(store2);

      await client.createCTC(ObjectType, null, store, { name: 'shared-name' });
      await client.createCTC(ObjectType, null, store2, { name: 'shared-name' });

      const results = await client.meta().find(ObjectType, 'shared-name');

      expect(results).toHaveLength(2);
    });

    it('searches only in specified store when provided', async () => {
      const store2 = new MockStore('store-2');
      client.attachStore(store2);

      await client.createCTC(ObjectType, null, store, { name: 'shared-name' });
      await client.createCTC(ObjectType, null, store2, { name: 'shared-name' });

      const results = await client.meta(store).find(ObjectType, 'shared-name');

      expect(results).toHaveLength(1);
      expect(results[0].signature.storeId).toBe(store.id);
    });

    it('supports partial match with exactMatch: false', async () => {
      await client.createCTC(ObjectType, null, store, { name: 'apple-pie' });
      await client.createCTC(ObjectType, null, store, { name: 'apple-sauce' });
      await client.createCTC(ObjectType, null, store, { name: 'banana' });

      const results = await client.meta().find(ObjectType, 'apple', { exactMatch: false });

      expect(results).toHaveLength(2);
    });

    it('searches description with searchDescription: true and exactMatch: false', async () => {
      await client.createCTC(ObjectType, null, store, { 
        name: 'obj1', 
        description: 'This is a fruit' 
      });
      await client.createCTC(ObjectType, null, store, { 
        name: 'obj2', 
        description: 'This is a vegetable' 
      });

      const results = await client.meta().find(ObjectType, 'fruit', { 
        exactMatch: false, 
        searchDescription: true 
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe('obj1');
    });

    it('filters by categoryId when provided', async () => {
      await client.createCTC(ObjectType, { categoryId: 'cat-1' }, store, { name: 'obj' });
      await client.createCTC(ObjectType, { categoryId: 'cat-2' }, store, { name: 'obj' });
      await client.createCTC(ObjectType, { categoryId: 'cat-1' }, store, { name: 'obj' });

      const results = await client.meta().find(ObjectType, 'obj', { categoryId: 'cat-1' });

      expect(results).toHaveLength(2);
      expect(results.every(r => (r.data as { categoryId: string }).categoryId === 'cat-1')).toBe(true);
    });
  });

  describe('findAll', () => {
    it('returns all constructs of a given type', async () => {
      await client.createCTC(ObjectType, null, store, { name: 'obj1' });
      await client.createCTC(ObjectType, null, store, { name: 'obj2' });
      await client.createCTC(MorphismType, { sourceId: 'a', targetId: 'b' }, store);

      const objects = await client.meta().findAll(ObjectType);
      const morphisms = await client.meta().findAll(MorphismType);

      expect(objects).toHaveLength(2);
      expect(morphisms).toHaveLength(1);
    });

    it('searches across multiple stores', async () => {
      const store2 = new MockStore('store-2');
      client.attachStore(store2);

      await client.createCTC(ObjectType, null, store);
      await client.createCTC(ObjectType, null, store2);

      const results = await client.meta().findAll(ObjectType);

      expect(results).toHaveLength(2);
    });
  });

  describe('usage pattern', () => {
    it('supports querying with meta().find()', async () => {
      // Create some objects
      await client.createCTC(ObjectType, null, store, { name: 'my-object' });
      await client.createCTC(ObjectType, null, store, { name: 'my-object' });
      await client.createCTC(ObjectType, null, store, { name: 'other-object' });

      // Query by name
      const results = await client.meta().find(ObjectType, 'my-object');

      expect(results).toHaveLength(2);
      expect(results.every(r => r.metadata.name === 'my-object')).toBe(true);
    });
  });
});

