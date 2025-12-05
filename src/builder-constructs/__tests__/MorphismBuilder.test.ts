// MorphismBuilder tests

import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '../../client/Client.js';
import { InMemoryStore } from '../../stores/InMemoryStore.js';
import { MorphismBuilder } from '../MorphismBuilder.js';
import type { RichCategory, RichObject } from '../../rich-constructs/index.js';

describe('MorphismBuilder', () => {
  let client: Client;
  let store: InMemoryStore;
  let category: RichCategory;
  let objectA: RichObject;
  let objectB: RichObject;

  beforeEach(async () => {
    client = new Client();
    store = new InMemoryStore({ id: 'test-store', name: 'Test Store' });
    client.attachStore(store);
    category = await client.createCategory(store, { name: 'TestCategory' });
    objectA = await client.createObject(store, category, { name: 'A' });
    objectB = await client.createObject(store, category, { name: 'B' });
  });

  describe('isReady', () => {
    it('returns not ready when nothing is set', () => {
      const builder = new MorphismBuilder(client);
      const result = builder.isReady();
      
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('store: Call inStore(store) to set the store');
      expect(result.missing).toContain('source: Call fromObject(object) to set the source object');
      expect(result.missing).toContain('target: Call toObject(object) to set the target object');
    });

    it('returns not ready when only store is set', () => {
      const builder = new MorphismBuilder(client);
      builder.inStore(store);
      
      const result = builder.isReady();
      expect(result.ready).toBe(false);
      expect(result.missing).toHaveLength(2); // source and target
    });

    it('returns not ready when only source is set', () => {
      const builder = new MorphismBuilder(client);
      builder.fromObject(objectA);
      
      const result = builder.isReady();
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('store: Call inStore(store) to set the store');
      expect(result.missing).toContain('target: Call toObject(object) to set the target object');
    });

    it('returns not ready when only target is set', () => {
      const builder = new MorphismBuilder(client);
      builder.toObject(objectB);
      
      const result = builder.isReady();
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('store: Call inStore(store) to set the store');
      expect(result.missing).toContain('source: Call fromObject(object) to set the source object');
    });

    it('returns ready when store, source, and target are set', () => {
      const builder = new MorphismBuilder(client);
      builder.inStore(store).fromObject(objectA).toObject(objectB);
      
      const result = builder.isReady();
      expect(result.ready).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('builder methods return this for chaining', () => {
    it('inStore returns this', () => {
      const builder = new MorphismBuilder(client);
      expect(builder.inStore(store)).toBe(builder);
    });

    it('inCategory returns this', () => {
      const builder = new MorphismBuilder(client);
      expect(builder.inCategory(category)).toBe(builder);
    });

    it('fromObject returns this', () => {
      const builder = new MorphismBuilder(client);
      expect(builder.fromObject(objectA)).toBe(builder);
    });

    it('toObject returns this', () => {
      const builder = new MorphismBuilder(client);
      expect(builder.toObject(objectB)).toBe(builder);
    });

    it('withName returns this', () => {
      const builder = new MorphismBuilder(client);
      expect(builder.withName('f')).toBe(builder);
    });

    it('withDescription returns this', () => {
      const builder = new MorphismBuilder(client);
      expect(builder.withDescription('Desc')).toBe(builder);
    });

    it('withProperties returns this', () => {
      const builder = new MorphismBuilder(client);
      expect(builder.withProperties({ key: 'value' })).toBe(builder);
    });
  });

  describe('build', () => {
    it('throws when not ready', async () => {
      const builder = new MorphismBuilder(client);
      
      await expect(builder.build()).rejects.toThrow('Cannot build Morphism: missing required fields');
    });

    it('creates a morphism with minimal configuration', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .fromObject(objectA)
        .toObject(objectB)
        .build();
      
      expect(morphism).toBeDefined();
      expect(morphism.signature.id).toBeDefined();
      expect(morphism.morphismData?.sourceId).toBe(objectA.signature.id);
      expect(morphism.morphismData?.targetId).toBe(objectB.signature.id);
    });

    it('creates a morphism with name', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .fromObject(objectA)
        .toObject(objectB)
        .withName('f')
        .build();
      
      expect(morphism.metadata.name).toBe('f');
    });

    it('creates a morphism with description', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .fromObject(objectA)
        .toObject(objectB)
        .withDescription('A morphism from A to B')
        .build();
      
      expect(morphism.metadata.description).toBe('A morphism from A to B');
    });

    it('creates a morphism with properties', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .fromObject(objectA)
        .toObject(objectB)
        .withProperties({ weight: 1.5 })
        .build();
      
      expect(morphism.morphismData?.properties).toEqual({ weight: 1.5 });
    });

    it('creates a morphism with explicit category', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .inCategory(category)
        .fromObject(objectA)
        .toObject(objectB)
        .build();
      
      expect(morphism.morphismData?.categoryId).toBe(category.signature.id);
    });

    it('infers category from source object when not explicitly set', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .fromObject(objectA)
        .toObject(objectB)
        .build();
      
      // Category should be inferred from source object
      expect(morphism.morphismData?.categoryId).toBe(category.signature.id);
    });

    it('creates endomorphism (morphism from object to itself)', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .fromObject(objectA)
        .toObject(objectA)
        .withName('endo')
        .build();
      
      expect(morphism.morphismData?.sourceId).toBe(objectA.signature.id);
      expect(morphism.morphismData?.targetId).toBe(objectA.signature.id);
    });
  });

  describe('using string IDs', () => {
    it('accepts source object ID as string', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .fromObject(objectA.signature.id)
        .toObject(objectB)
        .build();
      
      expect(morphism.morphismData?.sourceId).toBe(objectA.signature.id);
    });

    it('accepts target object ID as string', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .fromObject(objectA)
        .toObject(objectB.signature.id)
        .build();
      
      expect(morphism.morphismData?.targetId).toBe(objectB.signature.id);
    });

    it('accepts category ID as string', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .inCategory(category.signature.id)
        .fromObject(objectA)
        .toObject(objectB)
        .build();
      
      expect(morphism.morphismData?.categoryId).toBe(category.signature.id);
    });
  });

  describe('full workflow', () => {
    it('supports full chaining with all options', async () => {
      const morphism = await new MorphismBuilder(client)
        .inStore(store)
        .inCategory(category)
        .fromObject(objectA)
        .toObject(objectB)
        .withName('complete')
        .withDescription('A complete morphism')
        .withProperties({ complete: true })
        .build();
      
      expect(morphism.metadata.name).toBe('complete');
      expect(morphism.metadata.description).toBe('A complete morphism');
      expect(morphism.morphismData?.properties).toEqual({ complete: true });
      expect(morphism.morphismData?.sourceId).toBe(objectA.signature.id);
      expect(morphism.morphismData?.targetId).toBe(objectB.signature.id);
      expect(morphism.morphismData?.categoryId).toBe(category.signature.id);
    });

    it('creates multiple morphisms correctly', async () => {
      // Create a triangle: A → B → C, A → C
      const objectC = await client.createObject(store, category, { name: 'C' });
      
      const f = await new MorphismBuilder(client)
        .inStore(store).fromObject(objectA).toObject(objectB).withName('f').build();
      
      const g = await new MorphismBuilder(client)
        .inStore(store).fromObject(objectB).toObject(objectC).withName('g').build();
      
      const h = await new MorphismBuilder(client)
        .inStore(store).fromObject(objectA).toObject(objectC).withName('h').build();
      
      expect(f.morphismData?.sourceId).toBe(objectA.signature.id);
      expect(f.morphismData?.targetId).toBe(objectB.signature.id);
      expect(g.morphismData?.sourceId).toBe(objectB.signature.id);
      expect(g.morphismData?.targetId).toBe(objectC.signature.id);
      expect(h.morphismData?.sourceId).toBe(objectA.signature.id);
      expect(h.morphismData?.targetId).toBe(objectC.signature.id);
    });
  });
});

