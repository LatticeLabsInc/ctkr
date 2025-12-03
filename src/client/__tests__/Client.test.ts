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

      expect(obj.id).toBeDefined();
      expect(obj.type).toBe('Object');
      expect(obj.storeId).toBe(store.id);
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

    it('finds a construct by ID', async () => {
      const created = await client.createCTC('Object', { name: 'findme' }, store);
      const found = await client.getCTC(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
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

      expect(await client.getCTC(obj1.id)).toBeDefined();
      expect(await client.getCTC(obj2.id)).toBeDefined();
    });
  });

  describe('full workflow', () => {
    it('supports the intended usage pattern', async () => {
      // const client = new Client()
      const client = new Client();

      // const store = client.attachStore(new InMemoryStore('personal store'))
      const store = client.attachStore(new InMemoryStore('personal store'));

      // const obj1 = client.createCTC(CTKR.ObjectType, null, store)
      const obj1 = await client.createCTC(ObjectType, null, store);

      // const obj2 = client.createCTC(CTKR.ObjectType, null, store)
      const obj2 = await client.createCTC(ObjectType, null, store);

      // const morphism1 = client.createCTC(CTKR.MorphismType, {from: obj1, to: obj2}, store)
      const morphism1 = await client.createCTC(MorphismType, { from: obj1, to: obj2 }, store);

      // client.getCTC(obj1.id)
      const foundObj1 = await client.getCTC(obj1.id);
      expect(foundObj1?.id).toBe(obj1.id);

      // client.getCTC(obj2.id)
      const foundObj2 = await client.getCTC(obj2.id);
      expect(foundObj2?.id).toBe(obj2.id);

      // client.getCTC(morphism1.id)
      const foundMorphism = await client.getCTC(morphism1.id);
      expect(foundMorphism?.id).toBe(morphism1.id);
      expect(foundMorphism?.data).toEqual({ from: obj1, to: obj2 });
    });
  });
});
