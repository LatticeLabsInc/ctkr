import { describe, it, expect, beforeEach } from 'vitest';
import { Client, getClient } from '../Client.js';
import { MockStore } from '../../stores/mocks/MockStore.js';
import { ObjectType, MorphismType } from '../../types/index.js';

describe('Client', () => {
  let client: Client;
  let store: MockStore;

  beforeEach(() => {
    client = new Client();
    store = new MockStore('test-store');
  });

  describe('getClient', () => {
    it('returns a Client instance', () => {
      const c = getClient();
      expect(c).toBeInstanceOf(Client);
    });
  });

  describe('attachStore', () => {
    it('attaches a store and returns it', () => {
      const attached = client.attachStore(store);
      expect(attached).toBe(store);
    });

    it('allows retrieving attached store by ID', () => {
      client.attachStore(store);
      const retrieved = client.getStore(store.id);
      expect(retrieved).toBe(store);
    });

    it('allows attaching multiple stores', () => {
      const store2 = new MockStore('store-2');
      client.attachStore(store);
      client.attachStore(store2);

      expect(client.getStore(store.id)).toBe(store);
      expect(client.getStore(store2.id)).toBe(store2);
    });
  });

  describe('detachStore', () => {
    it('detaches a previously attached store', () => {
      client.attachStore(store);
      client.detachStore(store.id);
      expect(client.getStore(store.id)).toBeUndefined();
    });
  });

  describe('createCTC', () => {
    beforeEach(() => {
      client.attachStore(store);
    });

    it('creates an Object in a store', async () => {
      const obj = await client.createCTC(ObjectType, null, store);

      expect(obj.signature).toBeDefined();
      expect(obj.signature.id).toBeDefined();
      expect(obj.signature.storeId).toBe(store.id);
      expect(obj.signature.version).toBe(1);
      expect(obj.type).toBe(ObjectType);
      expect(obj.metadata).toBeDefined();
    });

    it('creates an Object with name and description', async () => {
      const obj = await client.createCTC(ObjectType, null, store, {
        name: 'Test Object',
        description: 'A test object',
      });

      expect(obj.metadata.name).toBe('Test Object');
      expect(obj.metadata.description).toBe('A test object');
    });

    it('creates a Morphism with from/to references', async () => {
      const obj1 = await client.createCTC(ObjectType, null, store);
      const obj2 = await client.createCTC(ObjectType, null, store);
      const morphism = await client.createCTC(MorphismType, { from: obj1, to: obj2 }, store);

      expect(morphism.type).toBe(MorphismType);
      expect(morphism.data).toEqual({ from: obj1, to: obj2 });
    });

    it('throws when store is not attached', async () => {
      const unattachedStore = new MockStore('unattached');
      await expect(client.createCTC(ObjectType, null, unattachedStore))
        .rejects.toThrow('Store not attached');
    });

    it('calls store.create with correct arguments', async () => {
      await client.createCTC(ObjectType, null, store, { name: 'test' });

      expect(store.calls.create).toHaveLength(1);
      expect(store.calls.create[0].args[0]).toBe(ObjectType);
      expect(store.calls.create[0].args[1]).toBeNull();
      expect(store.calls.create[0].args[2]).toEqual({ name: 'test' });
    });
  });

  describe('getCTC', () => {
    beforeEach(() => {
      client.attachStore(store);
    });

    it('finds a construct by signature ID', async () => {
      const created = await client.createCTC(ObjectType, null, store, { name: 'findme' });
      const found = await client.getCTC(created.signature.id);

      expect(found).toBeDefined();
      expect(found?.signature.id).toBe(created.signature.id);
      expect(found?.metadata.name).toBe('findme');
    });

    it('returns undefined for non-existent ID', async () => {
      const found = await client.getCTC('non-existent');
      expect(found).toBeUndefined();
    });

    it('searches across multiple stores', async () => {
      const store2 = new MockStore('store-2');
      client.attachStore(store2);

      const obj1 = await client.createCTC(ObjectType, null, store);
      const obj2 = await client.createCTC(ObjectType, null, store2);

      expect(await client.getCTC(obj1.signature.id)).toBeDefined();
      expect(await client.getCTC(obj2.signature.id)).toBeDefined();
    });

    it('calls store.read with correct arguments', async () => {
      const created = await client.createCTC(ObjectType, null, store);
      await client.getCTC(created.signature.id);

      expect(store.calls.read).toHaveLength(1);
      expect(store.calls.read[0].args[0]).toBe(created.signature.id);
    });
  });

  describe('updateCTC', () => {
    beforeEach(() => {
      client.attachStore(store);
    });

    it('updates a construct and increments version', async () => {
      const created = await client.createCTC(ObjectType, null, store, { name: 'original' });
      const updated = await client.updateCTC(created.signature.id, null, store, { name: 'updated' });

      expect(updated.signature.id).toBe(created.signature.id);
      expect(updated.signature.version).toBe(2);
      expect(updated.metadata.name).toBe('updated');
    });

    it('calls store.update with correct arguments', async () => {
      const created = await client.createCTC(ObjectType, null, store);
      await client.updateCTC(created.signature.id, { categoryId: 'cat-1' }, store, { name: 'new' });

      expect(store.calls.update).toHaveLength(1);
      expect(store.calls.update[0].args[0]).toBe(created.signature.id);
      expect(store.calls.update[0].args[1]).toEqual({ categoryId: 'cat-1' });
      expect(store.calls.update[0].args[2]).toEqual({ name: 'new' });
    });
  });

  describe('deleteCTC', () => {
    beforeEach(() => {
      client.attachStore(store);
    });

    it('deletes a construct', async () => {
      const created = await client.createCTC(ObjectType, null, store);
      const deleted = await client.deleteCTC(created.signature.id, store);

      expect(deleted).toBe(true);
      expect(await client.getCTC(created.signature.id)).toBeUndefined();
    });

    it('calls store.delete with correct arguments', async () => {
      const created = await client.createCTC(ObjectType, null, store);
      await client.deleteCTC(created.signature.id, store);

      expect(store.calls.delete).toHaveLength(1);
      expect(store.calls.delete[0].args[0]).toBe(created.signature.id);
    });
  });

  describe('full workflow', () => {
    it('supports the intended usage pattern with signatures and metadata', async () => {
      const client = new Client();
      const store = client.attachStore(new MockStore('personal-store'));

      // Create objects with names
      const obj1 = await client.createCTC(ObjectType, null, store, { name: 'Object A' });
      const obj2 = await client.createCTC(ObjectType, null, store, { name: 'Object B' });

      // Create morphism referencing objects
      const morphism1 = await client.createCTC(
        MorphismType, 
        { from: obj1, to: obj2 }, 
        store,
        { name: 'f: A → B' }
      );

      // Retrieve by signature ID
      const foundObj1 = await client.getCTC(obj1.signature.id);
      expect(foundObj1?.signature.id).toBe(obj1.signature.id);
      expect(foundObj1?.signature.version).toBe(1);
      expect(foundObj1?.metadata.name).toBe('Object A');

      const foundObj2 = await client.getCTC(obj2.signature.id);
      expect(foundObj2?.signature.id).toBe(obj2.signature.id);
      expect(foundObj2?.metadata.name).toBe('Object B');

      const foundMorphism = await client.getCTC(morphism1.signature.id);
      expect(foundMorphism?.signature.id).toBe(morphism1.signature.id);
      expect(foundMorphism?.metadata.name).toBe('f: A → B');
      expect(foundMorphism?.data).toEqual({ from: obj1, to: obj2 });
    });
  });
});
