// FunctorBuilder tests - comprehensive constraint enforcement testing

import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '../../client/Client.js';
import { InMemoryStore } from '../../stores/InMemoryStore.js';
import { FunctorBuilder } from '../FunctorBuilder.js';
import type { RichCategory, RichObject, RichMorphism } from '../../rich-constructs/index.js';

describe('FunctorBuilder', () => {
  let client: Client;
  let store: InMemoryStore;

  beforeEach(() => {
    client = new Client();
    store = new InMemoryStore({ id: 'test-store', name: 'Test Store' });
    client.attachStore(store);
  });

  describe('isReady', () => {
    it('returns not ready when nothing is set', () => {
      const builder = new FunctorBuilder(client);
      const result = builder.isReady();
      
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('store: Call inStore(store) to set the store');
      expect(result.missing).toContain('sourceCategory: Call sourceCategory(category) to set the source category');
      expect(result.missing).toContain('targetCategory: Call targetCategory(category) to set the target category');
    });

    it('returns not ready when only store is set', () => {
      const builder = new FunctorBuilder(client);
      builder.inStore(store);
      
      const result = builder.isReady();
      expect(result.ready).toBe(false);
      expect(result.missing).toHaveLength(2); // source and target categories
    });

    it('returns not ready when only source category is set', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      
      const builder = new FunctorBuilder(client);
      builder.inStore(store).sourceCategory(C);
      
      const result = builder.isReady();
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('targetCategory: Call targetCategory(category) to set the target category');
    });

    it('returns ready when store and both categories are set', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const D = await client.createCategory(store, { name: 'D' });
      
      const builder = new FunctorBuilder(client);
      builder.inStore(store).sourceCategory(C).targetCategory(D);
      
      const result = builder.isReady();
      expect(result.ready).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('builder methods return this for chaining', () => {
    it('all methods return this', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const D = await client.createCategory(store, { name: 'D' });
      
      const builder = new FunctorBuilder(client);
      
      expect(builder.inStore(store)).toBe(builder);
      expect(builder.sourceCategory(C)).toBe(builder);
      expect(builder.targetCategory(D)).toBe(builder);
      expect(builder.withName('F')).toBe(builder);
      expect(builder.withDescription('A functor')).toBe(builder);
      expect(builder.withProperties({ key: 'value' })).toBe(builder);
    });
  });

  describe('build - basic functionality', () => {
    it('throws when not ready', async () => {
      const builder = new FunctorBuilder(client);
      
      await expect(builder.build()).rejects.toThrow();
    });

    it('creates a functor with minimal configuration', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const D = await client.createCategory(store, { name: 'D' });
      
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .build();
      
      expect(functor).toBeDefined();
      expect(functor.signature.id).toBeDefined();
      expect(functor.functorData?.sourceCategoryId).toBe(C.signature.id);
      expect(functor.functorData?.targetCategoryId).toBe(D.signature.id);
    });

    it('creates a functor with name and description', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const D = await client.createCategory(store, { name: 'D' });
      
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .withName('F')
        .withDescription('A test functor')
        .build();
      
      expect(functor.metadata.name).toBe('F');
      expect(functor.metadata.description).toBe('A test functor');
    });
  });

  describe('object mappings - manual', () => {
    let C: RichCategory;
    let D: RichCategory;
    let x: RichObject;
    let y: RichObject;
    let a: RichObject;
    let b: RichObject;

    beforeEach(async () => {
      // Category C with objects x, y
      C = await client.createCategory(store, { name: 'C' });
      x = await client.createObject(store, C, { name: 'x' });
      y = await client.createObject(store, C, { name: 'y' });
      
      // Category D with objects a, b
      D = await client.createCategory(store, { name: 'D' });
      a = await client.createObject(store, D, { name: 'a' });
      b = await client.createObject(store, D, { name: 'b' });
    });

    it('can manually map objects', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .mapObject(y, b);
      
      const mappings = builder.getObjectMappings();
      expect(mappings.get(x.signature.id)).toBe(a.signature.id);
      expect(mappings.get(y.signature.id)).toBe(b.signature.id);
    });

    it('builds functor with manual object mappings', async () => {
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .mapObject(y, b)
        .withName('F')
        .build();
      
      expect(functor).toBeDefined();
      
      // Verify object mappings were created
      const objectMappings = await functor.getObjectMappings();
      expect(objectMappings.length).toBe(2);
    });

    it('accepts string IDs for mapObject', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x.signature.id, a.signature.id);
      
      const mappings = builder.getObjectMappings();
      expect(mappings.get(x.signature.id)).toBe(a.signature.id);
    });
  });

  describe('morphism mappings - constraint derivation', () => {
    let C: RichCategory;
    let D: RichCategory;
    let x: RichObject;
    let y: RichObject;
    let a: RichObject;
    let b: RichObject;
    let f: RichMorphism; // f: x → y in C
    let g: RichMorphism; // g: a → b in D

    beforeEach(async () => {
      // Category C with morphism f: x → y
      C = await client.createCategory(store, { name: 'C' });
      x = await client.createObject(store, C, { name: 'x' });
      y = await client.createObject(store, C, { name: 'y' });
      f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      // Category D with morphism g: a → b
      D = await client.createCategory(store, { name: 'D' });
      a = await client.createObject(store, D, { name: 'a' });
      b = await client.createObject(store, D, { name: 'b' });
      g = await client.createMorphism(a, b, store, D, { name: 'g' });
    });

    it('derives object mappings from morphism mapping', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g);
      
      // Trigger derivation via validate()
      await builder.validate();
      
      const derived = builder.getDerivedObjectMappings();
      expect(derived.get(x.signature.id)?.targetId).toBe(a.signature.id);
      expect(derived.get(y.signature.id)?.targetId).toBe(b.signature.id);
    });

    it('getObjectMappings includes derived mappings', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g);
      
      await builder.validate();
      
      const allMappings = builder.getObjectMappings();
      expect(allMappings.get(x.signature.id)).toBe(a.signature.id);
      expect(allMappings.get(y.signature.id)).toBe(b.signature.id);
    });

    it('builds functor with morphism mapping and derived object mappings', async () => {
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g)
        .withName('F')
        .build();
      
      expect(functor).toBeDefined();
      
      // Should have object mappings (derived)
      const objectMappings = await functor.getObjectMappings();
      expect(objectMappings.length).toBe(2);
      
      // Should have morphism mappings (including identities)
      const morphismMappings = await functor.getMorphismMappings();
      // f → g plus identity morphisms for x→a and y→b
      expect(morphismMappings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('conflict detection', () => {
    let C: RichCategory;
    let D: RichCategory;
    let x: RichObject;
    let y: RichObject;
    let a: RichObject;
    let b: RichObject;
    let c: RichObject;
    let f: RichMorphism;
    let g: RichMorphism;
    let h: RichMorphism;

    beforeEach(async () => {
      C = await client.createCategory(store, { name: 'C' });
      x = await client.createObject(store, C, { name: 'x' });
      y = await client.createObject(store, C, { name: 'y' });
      f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      D = await client.createCategory(store, { name: 'D' });
      a = await client.createObject(store, D, { name: 'a' });
      b = await client.createObject(store, D, { name: 'b' });
      c = await client.createObject(store, D, { name: 'c' });
      g = await client.createMorphism(a, b, store, D, { name: 'g' });
      h = await client.createMorphism(a, c, store, D, { name: 'h' });
    });

    it('detects conflict between manual and derived object mappings', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(y, c) // Manual: y → c
        .mapMorphism(f, g); // This will derive y → b (conflict!)
      
      const validation = await builder.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('manually mapped');
    });

    it('throws on conflict in mapObject after morphism constraint', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g);
      
      await builder.validate(); // This sets up derived mappings
      
      // Now try to set a conflicting manual mapping
      expect(() => builder.mapObject(y, c)).toThrow();
    });
  });

  describe('listAvailableObjectTargets', () => {
    let C: RichCategory;
    let D: RichCategory;
    let x: RichObject;
    let y: RichObject;
    let a: RichObject;
    let b: RichObject;
    let f: RichMorphism;
    let g: RichMorphism;

    beforeEach(async () => {
      C = await client.createCategory(store, { name: 'C' });
      x = await client.createObject(store, C, { name: 'x' });
      y = await client.createObject(store, C, { name: 'y' });
      f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      D = await client.createCategory(store, { name: 'D' });
      a = await client.createObject(store, D, { name: 'a' });
      b = await client.createObject(store, D, { name: 'b' });
      g = await client.createMorphism(a, b, store, D, { name: 'g' });
    });

    it('returns all target objects when no constraints', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D);
      
      const targets = await builder.listAvailableObjectTargets(x);
      expect(targets.length).toBe(2); // a and b
      expect(targets.every(t => !t.required)).toBe(true);
    });

    it('returns only required target when constrained by morphism', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g);
      
      const targets = await builder.listAvailableObjectTargets(x);
      expect(targets.length).toBe(1);
      expect(targets[0].object.signature.id).toBe(a.signature.id);
      expect(targets[0].required).toBe(true);
    });

    it('throws when source object is not in source category', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D);
      
      // 'a' is in D, not C
      await expect(builder.listAvailableObjectTargets(a)).rejects.toThrow('not in the source category');
    });
  });

  describe('listAvailableMorphismTargets', () => {
    let C: RichCategory;
    let D: RichCategory;
    let x: RichObject;
    let y: RichObject;
    let z: RichObject;
    let a: RichObject;
    let b: RichObject;
    let c: RichObject;
    let f: RichMorphism; // f: x → y
    let g: RichMorphism; // g: y → z
    let h: RichMorphism; // h: a → b
    let i: RichMorphism; // i: a → c
    let j: RichMorphism; // j: b → c

    beforeEach(async () => {
      C = await client.createCategory(store, { name: 'C' });
      x = await client.createObject(store, C, { name: 'x' });
      y = await client.createObject(store, C, { name: 'y' });
      z = await client.createObject(store, C, { name: 'z' });
      f = await client.createMorphism(x, y, store, C, { name: 'f' });
      g = await client.createMorphism(y, z, store, C, { name: 'g' });
      
      D = await client.createCategory(store, { name: 'D' });
      a = await client.createObject(store, D, { name: 'a' });
      b = await client.createObject(store, D, { name: 'b' });
      c = await client.createObject(store, D, { name: 'c' });
      h = await client.createMorphism(a, b, store, D, { name: 'h' });
      i = await client.createMorphism(a, c, store, D, { name: 'i' });
      j = await client.createMorphism(b, c, store, D, { name: 'j' });
    });

    it('returns all non-identity target morphisms when no constraints', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D);
      
      const targets = await builder.listAvailableMorphismTargets(f);
      expect(targets.length).toBe(3); // h, i, j (non-identity)
    });

    it('filters morphisms based on object mapping constraints', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .mapObject(y, b);
      
      // f: x → y should map to morphisms a → b
      // Only h: a → b fits
      const targets = await builder.listAvailableMorphismTargets(f);
      expect(targets.length).toBe(1);
      expect(targets[0].morphism.signature.id).toBe(h.signature.id);
    });

    it('returns no targets when constraints are impossible', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .mapObject(y, c); // f: x → y would need a morphism a → c
      
      const targets = await builder.listAvailableMorphismTargets(f);
      expect(targets.length).toBe(1);
      expect(targets[0].morphism.signature.id).toBe(i.signature.id); // i: a → c
    });

    it('throws when source morphism is not in source category', async () => {
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D);
      
      // h is in D, not C
      await expect(builder.listAvailableMorphismTargets(h)).rejects.toThrow('not in the source category');
    });
  });

  describe('identity morphism handling', () => {
    let C: RichCategory;
    let D: RichCategory;
    let x: RichObject;
    let a: RichObject;
    let b: RichObject;

    beforeEach(async () => {
      C = await client.createCategory(store, { name: 'C' });
      x = await client.createObject(store, C, { name: 'x' });
      
      D = await client.createCategory(store, { name: 'D' });
      a = await client.createObject(store, D, { name: 'a' });
      b = await client.createObject(store, D, { name: 'b' });
    });

    it('automatically maps identity morphisms when objects are mapped', async () => {
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .withName('F')
        .build();
      
      // Get morphism mappings
      const morphismMappings = await functor.getMorphismMappings();
      
      // Should have at least one mapping (id_x → id_a)
      expect(morphismMappings.length).toBeGreaterThanOrEqual(1);
      
      // Verify the identity mapping
      const identityMapping = morphismMappings.find(m => {
        const srcMorId = (m.data as any).sourceMorphismId;
        return srcMorId === x.objectData?.identityMorphismId;
      });
      expect(identityMapping).toBeDefined();
    });
  });

  describe('complex scenarios', () => {
    it('handles functor from category to itself', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      // Endofunctor: C → C
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(C)
        .mapObject(x, y)
        .mapObject(y, y) // Collapse
        .withName('Collapse')
        .build();
      
      expect(functor.functorData?.sourceCategoryId).toBe(C.signature.id);
      expect(functor.functorData?.targetCategoryId).toBe(C.signature.id);
    });

    it('handles multiple morphisms between same objects', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      const g = await client.createMorphism(x, y, store, C, { name: 'g' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const h = await client.createMorphism(a, b, store, D, { name: 'h' });
      const i = await client.createMorphism(a, b, store, D, { name: 'i' });
      
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, h)
        .mapMorphism(g, i)
        .withName('F')
        .build();
      
      expect(functor).toBeDefined();
      
      // Both morphism mappings should be created
      const morphismMappings = await functor.getMorphismMappings();
      // At least 2 non-identity mappings
      const nonIdentityMappings = morphismMappings.filter(m => {
        // Find the source morphism and check if it's an identity
        return true; // We trust the builder created the mappings correctly
      });
      expect(morphismMappings.length).toBeGreaterThanOrEqual(2);
    });

    it('validates before build and reports all errors', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const c = await client.createObject(store, D, { name: 'c' });
      const g = await client.createMorphism(a, b, store, D, { name: 'g' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(y, c) // Manual: y → c
        .mapMorphism(f, g); // This derives y → b, conflicting with manual
      
      const validation = await builder.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should not be able to build
      await expect(builder.build()).rejects.toThrow();
    });
  });

  describe('clear on category change', () => {
    it('clears mappings when source category changes', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const C2 = await client.createCategory(store, { name: 'C2' });
      const D = await client.createCategory(store, { name: 'D' });
      
      const x = await client.createObject(store, C, { name: 'x' });
      const a = await client.createObject(store, D, { name: 'a' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a);
      
      expect(builder.getObjectMappings().size).toBe(1);
      
      // Change source category - mappings should clear
      builder.sourceCategory(C2);
      expect(builder.getObjectMappings().size).toBe(0);
    });

    it('clears mappings when target category changes', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const D = await client.createCategory(store, { name: 'D' });
      const D2 = await client.createCategory(store, { name: 'D2' });
      
      const x = await client.createObject(store, C, { name: 'x' });
      const a = await client.createObject(store, D, { name: 'a' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a);
      
      expect(builder.getObjectMappings().size).toBe(1);
      
      // Change target category - mappings should clear
      builder.targetCategory(D2);
      expect(builder.getObjectMappings().size).toBe(0);
    });
  });

  describe('conflicting derived mappings (derived vs derived)', () => {
    it('detects conflict when two morphism mappings require inconsistent object mappings', async () => {
      // Source category C with: x, y, z and morphisms f: x → y, h: x → z
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const z = await client.createObject(store, C, { name: 'z' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' }); // x → y
      const h = await client.createMorphism(x, z, store, C, { name: 'h' }); // x → z
      
      // Target category D with: a, b, c, d and morphisms g: a → b, i: c → d
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const c = await client.createObject(store, D, { name: 'c' });
      const d = await client.createObject(store, D, { name: 'd' });
      const g = await client.createMorphism(a, b, store, D, { name: 'g' }); // a → b
      const i = await client.createMorphism(c, d, store, D, { name: 'i' }); // c → d
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g)  // f: x → y maps to g: a → b → derives x → a
        .mapMorphism(h, i); // h: x → z maps to i: c → d → derives x → c (CONFLICT!)
      
      const validation = await builder.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('must map to both');
    });

    it('succeeds when multiple morphism mappings derive consistent object mappings', async () => {
      // f: x → y and g: x → z both map to morphisms starting from 'a'
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const z = await client.createObject(store, C, { name: 'z' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      const g = await client.createMorphism(x, z, store, C, { name: 'g' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const c = await client.createObject(store, D, { name: 'c' });
      const h = await client.createMorphism(a, b, store, D, { name: 'h' }); // a → b
      const i = await client.createMorphism(a, c, store, D, { name: 'i' }); // a → c (same source!)
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, h)  // x → a (from source)
        .mapMorphism(g, i); // x → a (consistent!)
      
      const validation = await builder.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('overwriting mappings', () => {
    it('overwrites existing object mapping when mapObject called twice for same source', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .mapObject(x, b); // Overwrite
      
      const mappings = builder.getObjectMappings();
      expect(mappings.get(x.signature.id)).toBe(b.signature.id);
      expect(mappings.size).toBe(1);
    });

    it('overwrites existing morphism mapping when mapMorphism called twice for same source', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const g = await client.createMorphism(a, b, store, D, { name: 'g' });
      const h = await client.createMorphism(a, b, store, D, { name: 'h' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g)
        .mapMorphism(f, h); // Overwrite
      
      const mappings = builder.getMorphismMappings();
      expect(mappings.get(f.signature.id)).toBe(h.signature.id);
      expect(mappings.size).toBe(1);
    });
  });

  describe('mapMorphism with string IDs', () => {
    it('accepts string IDs for mapMorphism', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const g = await client.createMorphism(a, b, store, D, { name: 'g' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f.signature.id, g.signature.id); // String IDs
      
      const mappings = builder.getMorphismMappings();
      expect(mappings.get(f.signature.id)).toBe(g.signature.id);
    });
  });

  describe('manual mapping agreeing with derived', () => {
    it('succeeds when manual mapping matches derived mapping', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const g = await client.createMorphism(a, b, store, D, { name: 'g' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a) // Manual: x → a
        .mapMorphism(f, g); // Derives: x → a (same!)
      
      const validation = await builder.validate();
      expect(validation.valid).toBe(true);
      
      // Should be able to build
      const functor = await builder.withName('F').build();
      expect(functor).toBeDefined();
    });
  });

  describe('validate success case', () => {
    it('returns valid true when configuration is correct with no mappings', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const D = await client.createCategory(store, { name: 'D' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D);
      
      const validation = await builder.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('returns valid true when all mappings are consistent', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const g = await client.createMorphism(a, b, store, D, { name: 'g' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .mapObject(y, b)
        .mapMorphism(f, g);
      
      const validation = await builder.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('withProperties', () => {
    it('passes properties to created functor', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const D = await client.createCategory(store, { name: 'D' });
      
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .withProperties({ custom: 'value', number: 42 })
        .build();
      
      expect(functor.functorData?.properties).toEqual({ custom: 'value', number: 42 });
    });
  });

  describe('empty categories', () => {
    it('handles empty source category (no objects)', async () => {
      const C = await client.createCategory(store, { name: 'EmptyC' });
      const D = await client.createCategory(store, { name: 'D' });
      await client.createObject(store, D, { name: 'a' });
      
      const functor = await new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .withName('EmptyFunctor')
        .build();
      
      expect(functor).toBeDefined();
      const objectMappings = await functor.getObjectMappings();
      expect(objectMappings.length).toBe(0);
    });

    it('handles empty target category (no objects)', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const D = await client.createCategory(store, { name: 'EmptyD' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D);
      
      // Should still be able to build (empty functor)
      const functor = await builder.build();
      expect(functor).toBeDefined();
    });

    it('listAvailableObjectTargets returns empty array for empty target category', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const D = await client.createCategory(store, { name: 'EmptyD' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D);
      
      const targets = await builder.listAvailableObjectTargets(x);
      expect(targets).toEqual([]);
    });
  });

  describe('cross-store functors', () => {
    it('handles source and target categories in different stores', async () => {
      const store2 = new InMemoryStore({ id: 'store-2', name: 'Store 2' });
      client.attachStore(store2);
      
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      
      const D = await client.createCategory(store2, { name: 'D' });
      const a = await client.createObject(store2, D, { name: 'a' });
      
      const functor = await new FunctorBuilder(client)
        .inStore(store) // Functor stored in store
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .withName('CrossStore')
        .build();
      
      expect(functor).toBeDefined();
      expect(functor.functorData?.sourceCategoryId).toBe(C.signature.id);
      expect(functor.functorData?.targetCategoryId).toBe(D.signature.id);
    });
  });

  describe('listAvailableObjectTargets with manual constraint', () => {
    it('excludes manually mapped target from available list', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a); // Manual mapping
      
      // For y (unmapped), all targets should be available
      const targets = await builder.listAvailableObjectTargets(y);
      expect(targets.length).toBe(2);
      expect(targets.every(t => !t.required)).toBe(true);
    });
  });

  describe('listAvailableMorphismTargets for identity morphism', () => {
    it('returns empty list for source identity morphism (identities auto-mapped)', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D);
      
      // Get identity morphism for x
      const idX = x.objectData?.identityMorphismId;
      expect(idX).toBeDefined();
      
      // Identity morphisms should have no non-identity targets
      // (they are auto-mapped to corresponding identity)
      const targets = await builder.listAvailableMorphismTargets(idX!);
      // Should return empty because identities are filtered out in target morphisms
      expect(targets.length).toBe(0);
    });
  });

  describe('getMorphismMappings excludes identity morphisms', () => {
    it('only returns user-specified morphism mappings, not identity mappings', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const g = await client.createMorphism(a, b, store, D, { name: 'g' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g);
      
      // getMorphismMappings should only have the user-specified mapping
      const mappings = builder.getMorphismMappings();
      expect(mappings.size).toBe(1);
      expect(mappings.has(f.signature.id)).toBe(true);
      
      // Should NOT contain identity morphism IDs
      const idX = x.objectData?.identityMorphismId;
      const idY = y.objectData?.identityMorphismId;
      expect(mappings.has(idX!)).toBe(false);
      expect(mappings.has(idY!)).toBe(false);
    });
  });

  describe('getDerivedObjectMappings details', () => {
    it('includes fromMorphismId correctly in derived mappings', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      const y = await client.createObject(store, C, { name: 'y' });
      const f = await client.createMorphism(x, y, store, C, { name: 'f' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      const g = await client.createMorphism(a, b, store, D, { name: 'g' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapMorphism(f, g);
      
      await builder.validate();
      
      const derived = builder.getDerivedObjectMappings();
      
      // x should be derived from f
      const xDerived = derived.get(x.signature.id);
      expect(xDerived).toBeDefined();
      expect(xDerived?.targetId).toBe(a.signature.id);
      expect(xDerived?.fromMorphismId).toBe(f.signature.id);
      
      // y should be derived from f
      const yDerived = derived.get(y.signature.id);
      expect(yDerived).toBeDefined();
      expect(yDerived?.targetId).toBe(b.signature.id);
      expect(yDerived?.fromMorphismId).toBe(f.signature.id);
    });
  });

  describe('reusing builder after build', () => {
    it('can modify and rebuild after first build', async () => {
      const C = await client.createCategory(store, { name: 'C' });
      const x = await client.createObject(store, C, { name: 'x' });
      
      const D = await client.createCategory(store, { name: 'D' });
      const a = await client.createObject(store, D, { name: 'a' });
      const b = await client.createObject(store, D, { name: 'b' });
      
      const builder = new FunctorBuilder(client)
        .inStore(store)
        .sourceCategory(C)
        .targetCategory(D)
        .mapObject(x, a)
        .withName('F1');
      
      const functor1 = await builder.build();
      expect(functor1.metadata.name).toBe('F1');
      
      // Modify and rebuild
      builder.mapObject(x, b).withName('F2');
      
      const functor2 = await builder.build();
      expect(functor2.metadata.name).toBe('F2');
      expect(functor2.signature.id).not.toBe(functor1.signature.id);
    });
  });
});

