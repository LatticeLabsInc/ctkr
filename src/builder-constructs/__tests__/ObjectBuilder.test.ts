// ObjectBuilder tests

import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '../../client/Client.js';
import { InMemoryStore } from '../../stores/InMemoryStore.js';
import { ObjectBuilder } from '../ObjectBuilder.js';
import type { RichCategory } from '../../rich-constructs/index.js';

describe('ObjectBuilder', () => {
  let client: Client;
  let store: InMemoryStore;
  let category: RichCategory;

  beforeEach(async () => {
    client = new Client();
    store = new InMemoryStore({ id: 'test-store', name: 'Test Store' });
    client.attachStore(store);
    category = await client.createCategory(store, { name: 'TestCategory' });
  });

  describe('isReady', () => {
    it('returns not ready when nothing is set', () => {
      const builder = new ObjectBuilder(client);
      const result = builder.isReady();
      
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('store: Call inStore(store) to set the store');
      expect(result.missing).toContain('category: Call inCategory(category) to set the category');
    });

    it('returns not ready when only store is set', () => {
      const builder = new ObjectBuilder(client);
      builder.inStore(store);
      
      const result = builder.isReady();
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('category: Call inCategory(category) to set the category');
    });

    it('returns not ready when only category is set', () => {
      const builder = new ObjectBuilder(client);
      builder.inCategory(category);
      
      const result = builder.isReady();
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('store: Call inStore(store) to set the store');
    });

    it('returns ready when store and category are set', () => {
      const builder = new ObjectBuilder(client);
      builder.inStore(store).inCategory(category);
      
      const result = builder.isReady();
      expect(result.ready).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('builder methods return this for chaining', () => {
    it('inStore returns this', () => {
      const builder = new ObjectBuilder(client);
      expect(builder.inStore(store)).toBe(builder);
    });

    it('inCategory returns this', () => {
      const builder = new ObjectBuilder(client);
      expect(builder.inCategory(category)).toBe(builder);
    });

    it('withName returns this', () => {
      const builder = new ObjectBuilder(client);
      expect(builder.withName('Test')).toBe(builder);
    });

    it('withDescription returns this', () => {
      const builder = new ObjectBuilder(client);
      expect(builder.withDescription('Desc')).toBe(builder);
    });

    it('withProperties returns this', () => {
      const builder = new ObjectBuilder(client);
      expect(builder.withProperties({ key: 'value' })).toBe(builder);
    });
  });

  describe('build', () => {
    it('throws when not ready', async () => {
      const builder = new ObjectBuilder(client);
      
      await expect(builder.build()).rejects.toThrow('Cannot build Object: missing required fields');
    });

    it('creates an object with minimal configuration', async () => {
      const builder = new ObjectBuilder(client);
      builder.inStore(store).inCategory(category);
      
      const object = await builder.build();
      
      expect(object).toBeDefined();
      expect(object.signature.id).toBeDefined();
      expect(object.objectData?.categoryId).toBe(category.signature.id);
    });

    it('creates an object with name', async () => {
      const object = await new ObjectBuilder(client)
        .inStore(store)
        .inCategory(category)
        .withName('MyObject')
        .build();
      
      expect(object.metadata.name).toBe('MyObject');
    });

    it('creates an object with description', async () => {
      const object = await new ObjectBuilder(client)
        .inStore(store)
        .inCategory(category)
        .withDescription('An object')
        .build();
      
      expect(object.metadata.description).toBe('An object');
    });

    it('creates an object with properties', async () => {
      const object = await new ObjectBuilder(client)
        .inStore(store)
        .inCategory(category)
        .withProperties({ custom: 'value' })
        .build();
      
      expect(object.objectData?.properties).toEqual({ custom: 'value' });
    });

    it('creates an object with identity morphism', async () => {
      const object = await new ObjectBuilder(client)
        .inStore(store)
        .inCategory(category)
        .withName('A')
        .build();
      
      // Identity morphism should be automatically created
      expect(object.objectData?.identityMorphismId).toBeDefined();
      
      // Verify identity morphism exists and is properly configured
      const identityMorphism = await client.getMorphism(object.objectData!.identityMorphismId!);
      expect(identityMorphism).toBeDefined();
      expect(identityMorphism?.morphismData?.isIdentity).toBe(true);
      expect(identityMorphism?.morphismData?.sourceId).toBe(object.signature.id);
      expect(identityMorphism?.morphismData?.targetId).toBe(object.signature.id);
    });
  });

  describe('using string category ID', () => {
    it('accepts category ID as string', async () => {
      const object = await new ObjectBuilder(client)
        .inStore(store)
        .inCategory(category.signature.id) // string ID
        .withName('StringCatObject')
        .build();
      
      expect(object.objectData?.categoryId).toBe(category.signature.id);
    });
  });

  describe('full workflow', () => {
    it('supports full chaining with all options', async () => {
      const object = await new ObjectBuilder(client)
        .inStore(store)
        .inCategory(category)
        .withName('FullObject')
        .withDescription('Complete object')
        .withProperties({ complete: true, version: 1 })
        .build();
      
      expect(object.metadata.name).toBe('FullObject');
      expect(object.metadata.description).toBe('Complete object');
      expect(object.objectData?.properties).toEqual({ complete: true, version: 1 });
      expect(object.objectData?.categoryId).toBe(category.signature.id);
    });
  });
});

