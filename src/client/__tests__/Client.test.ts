import { describe, it, expect, beforeEach } from 'vitest';
import { Client, getClient } from '../Client.js';
import { InMemoryStore } from '../../stores/InMemoryStore.js';
import { ObjectType, MorphismType } from '../../types/index.js';

describe('Client', () => {
  let client: Client;
  let store: InMemoryStore;

  beforeEach(() => {
    client = new Client();
    store = new InMemoryStore('test-store');
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
      const store2 = new InMemoryStore('store-2');
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
      const obj = await client.createCTC('Object', null, store);

      expect(obj.signature).toBeDefined();
      expect(obj.signature.id).toBeDefined();
      expect(obj.signature.storeId).toBe(store.id);
      expect(obj.signature.version).toBe(1);
      expect(obj.type).toBe('Object');
    });

    it('creates a Morphism with from/to references', async () => {
      const obj1 = await client.createCTC('Object', null, store);
      const obj2 = await client.createCTC('Object', null, store);
      const morphism = await client.createCTC('Morphism', { from: obj1, to: obj2 }, store);

      expect(morphism.type).toBe('Morphism');
      expect(morphism.data).toEqual({ from: obj1, to: obj2 });
    });

    it('throws when store is not attached', async () => {
      const unattachedStore = new InMemoryStore('unattached');
      await expect(client.createCTC('Object', null, unattachedStore))
        .rejects.toThrow('Store not attached');
    });
  });

  describe('getCTC', () => {
    beforeEach(() => {
      client.attachStore(store);
    });

    it('finds a construct by signature ID', async () => {
      const created = await client.createCTC('Object', { name: 'findme' }, store);
      const found = await client.getCTC(created.signature.id);

      expect(found).toBeDefined();
      expect(found?.signature.id).toBe(created.signature.id);
      expect(found?.data).toEqual({ name: 'findme' });
    });

    it('returns undefined for non-existent ID', async () => {
      const found = await client.getCTC('non-existent');
      expect(found).toBeUndefined();
    });

    it('searches across multiple stores', async () => {
      const store2 = new InMemoryStore('store-2');
      client.attachStore(store2);

      const obj1 = await client.createCTC('Object', null, store);
      const obj2 = await client.createCTC('Object', null, store2);

      expect(await client.getCTC(obj1.signature.id)).toBeDefined();
      expect(await client.getCTC(obj2.signature.id)).toBeDefined();
    });
  });

  describe('updateCTC', () => {
    beforeEach(() => {
      client.attachStore(store);
    });

    it('updates a construct and increments version', async () => {
      const created = await client.createCTC('Object', { name: 'original' }, store);
      const updated = await client.updateCTC(created.signature.id, { name: 'updated' }, store);

      expect(updated.signature.id).toBe(created.signature.id);
      expect(updated.signature.version).toBe(2);
      expect(updated.data).toEqual({ name: 'updated' });
    });
  });

  describe('deleteCTC', () => {
    beforeEach(() => {
      client.attachStore(store);
    });

    it('deletes a construct', async () => {
      const created = await client.createCTC('Object', null, store);
      const deleted = await client.deleteCTC(created.signature.id, store);

      expect(deleted).toBe(true);
      expect(await client.getCTC(created.signature.id)).toBeUndefined();
    });
  });

  describe('full workflow', () => {
    it('supports the intended usage pattern with signatures', async () => {
      const client = new Client();
      const store = client.attachStore(new InMemoryStore('personal store'));

      // Create objects
      const obj1 = await client.createCTC(ObjectType, null, store);
      const obj2 = await client.createCTC(ObjectType, null, store);

      // Create morphism referencing objects
      const morphism1 = await client.createCTC(MorphismType, { from: obj1, to: obj2 }, store);

      // Retrieve by signature ID
      const foundObj1 = await client.getCTC(obj1.signature.id);
      expect(foundObj1?.signature.id).toBe(obj1.signature.id);
      expect(foundObj1?.signature.version).toBe(1);

      const foundObj2 = await client.getCTC(obj2.signature.id);
      expect(foundObj2?.signature.id).toBe(obj2.signature.id);

      const foundMorphism = await client.getCTC(morphism1.signature.id);
      expect(foundMorphism?.signature.id).toBe(morphism1.signature.id);
      expect(foundMorphism?.data).toEqual({ from: obj1, to: obj2 });
    });
  });
});
