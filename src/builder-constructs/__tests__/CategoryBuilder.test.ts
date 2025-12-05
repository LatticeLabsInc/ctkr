// CategoryBuilder tests

import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '../../client/Client.js';
import { InMemoryStore } from '../../stores/InMemoryStore.js';
import { CategoryBuilder } from '../CategoryBuilder.js';

describe('CategoryBuilder', () => {
  let client: Client;
  let store: InMemoryStore;

  beforeEach(() => {
    client = new Client();
    store = new InMemoryStore({ id: 'test-store', name: 'Test Store' });
    client.attachStore(store);
  });

  describe('isReady', () => {
    it('returns not ready when store is not set', () => {
      const builder = new CategoryBuilder(client);
      const result = builder.isReady();
      
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('store: Call inStore(store) to set the store');
    });

    it('returns ready when store is set', () => {
      const builder = new CategoryBuilder(client);
      builder.inStore(store);
      
      const result = builder.isReady();
      expect(result.ready).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('returns ready even without name (name is optional)', () => {
      const builder = new CategoryBuilder(client);
      builder.inStore(store);
      
      const result = builder.isReady();
      expect(result.ready).toBe(true);
    });
  });

  describe('builder methods return this for chaining', () => {
    it('inStore returns this', () => {
      const builder = new CategoryBuilder(client);
      const result = builder.inStore(store);
      expect(result).toBe(builder);
    });

    it('withName returns this', () => {
      const builder = new CategoryBuilder(client);
      const result = builder.withName('Test');
      expect(result).toBe(builder);
    });

    it('withDescription returns this', () => {
      const builder = new CategoryBuilder(client);
      const result = builder.withDescription('A test category');
      expect(result).toBe(builder);
    });

    it('withProperties returns this', () => {
      const builder = new CategoryBuilder(client);
      const result = builder.withProperties({ key: 'value' });
      expect(result).toBe(builder);
    });
  });

  describe('build', () => {
    it('throws when not ready', async () => {
      const builder = new CategoryBuilder(client);
      
      await expect(builder.build()).rejects.toThrow('Cannot build Category: missing required fields');
    });

    it('creates a category with minimal configuration', async () => {
      const builder = new CategoryBuilder(client);
      builder.inStore(store);
      
      const category = await builder.build();
      
      expect(category).toBeDefined();
      expect(category.signature.id).toBeDefined();
    });

    it('creates a category with name', async () => {
      const builder = new CategoryBuilder(client);
      builder.inStore(store).withName('MyCategory');
      
      const category = await builder.build();
      
      expect(category.metadata.name).toBe('MyCategory');
    });

    it('creates a category with description', async () => {
      const builder = new CategoryBuilder(client);
      builder
        .inStore(store)
        .withName('TestCat')
        .withDescription('A test category');
      
      const category = await builder.build();
      
      expect(category.metadata.description).toBe('A test category');
    });

    it('creates a category with properties', async () => {
      const builder = new CategoryBuilder(client);
      builder
        .inStore(store)
        .withProperties({ custom: 'property', number: 42 });
      
      const category = await builder.build();
      
      expect(category.categoryData?.properties).toEqual({ custom: 'property', number: 42 });
    });

    it('supports full chaining', async () => {
      const category = await new CategoryBuilder(client)
        .inStore(store)
        .withName('Chained')
        .withDescription('Built with chaining')
        .withProperties({ chained: true })
        .build();
      
      expect(category.metadata.name).toBe('Chained');
      expect(category.metadata.description).toBe('Built with chaining');
      expect(category.categoryData?.properties).toEqual({ chained: true });
    });
  });

  describe('multiple builds', () => {
    it('can build multiple categories from same builder', async () => {
      const builder = new CategoryBuilder(client).inStore(store).withName('Multi');
      
      const cat1 = await builder.build();
      const cat2 = await builder.build();
      
      expect(cat1.signature.id).not.toBe(cat2.signature.id);
      expect(cat1.metadata.name).toBe('Multi');
      expect(cat2.metadata.name).toBe('Multi');
    });
  });
});

