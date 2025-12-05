// Tests for SemanticOperations

import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '../Client.js';
import { MockStore } from '../../stores/mocks/MockStore.js';
import type { RichCategory, RichObject, RichMorphism } from '../../rich-constructs/index.js';
import type { CreateObjectMappingInput, CreateMorphismMappingInput } from '../../types/index.js';

describe('SemanticOperations', () => {
  let client: Client;
  let store: MockStore;

  beforeEach(() => {
    client = new Client();
    store = new MockStore('test-store');
    client.attachStore(store);
  });

  describe('extract', () => {
    // ─────────────────────────────────────────────────────────────────────────
    // Empty/Edge Cases
    // ─────────────────────────────────────────────────────────────────────────

    describe('edge cases', () => {
      it('throws when objects list is empty', async () => {
        await expect(
          client.semantic().extract([], [], store, store)
        ).rejects.toThrow('Extract requires at least one object');
      });

      it('throws when objects have no category', async () => {
        // Create an object without a category
        const obj = await client.createObject(store);

        await expect(
          client.semantic().extract([obj], [], store, store)
        ).rejects.toThrow('All objects must belong to a category');
      });

      it('throws when objects are in different categories', async () => {
        const cat1 = await client.createCategory(store, { name: 'Cat1' });
        const cat2 = await client.createCategory(store, { name: 'Cat2' });
        const obj1 = await client.createObject(store, cat1, { name: 'A' });
        const obj2 = await client.createObject(store, cat2, { name: 'B' });

        await expect(
          client.semantic().extract([obj1, obj2], [], store, store)
        ).rejects.toThrow('All objects must be in the same category');
      });

      it('throws when morphism source is not in objects list', async () => {
        const cat = await client.createCategory(store, { name: 'Cat' });
        const objA = await client.createObject(store, cat, { name: 'A' });
        const objB = await client.createObject(store, cat, { name: 'B' });
        const objC = await client.createObject(store, cat, { name: 'C' });
        const mor = await client.createMorphism(objA, objB, store, cat);

        // Only include B and C, but mor has source A
        await expect(
          client.semantic().extract([objB, objC], [mor], store, store)
        ).rejects.toThrow('has source not in objects list');
      });

      it('throws when morphism target is not in objects list', async () => {
        const cat = await client.createCategory(store, { name: 'Cat' });
        const objA = await client.createObject(store, cat, { name: 'A' });
        const objB = await client.createObject(store, cat, { name: 'B' });
        const objC = await client.createObject(store, cat, { name: 'C' });
        const mor = await client.createMorphism(objA, objB, store, cat);

        // Only include A and C, but mor has target B
        await expect(
          client.semantic().extract([objA, objC], [mor], store, store)
        ).rejects.toThrow('has target not in objects list');
      });

      it('throws when object ID is not found', async () => {
        await expect(
          client.semantic().extract(['nonexistent-id'], [], store, store)
        ).rejects.toThrow('Object not found: nonexistent-id');
      });

      it('throws when morphism ID is not found', async () => {
        const cat = await client.createCategory(store, { name: 'Cat' });
        const obj = await client.createObject(store, cat, { name: 'A' });

        await expect(
          client.semantic().extract([obj], ['nonexistent-id'], store, store)
        ).rejects.toThrow('Morphism not found: nonexistent-id');
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Simple Case: Single object, no morphisms
    // ─────────────────────────────────────────────────────────────────────────

    describe('simple case', () => {
      it('extracts a single object with no morphisms', async () => {
        const sourceCat = await client.createCategory(store, { name: 'Source' });
        const objA = await client.createObject(store, sourceCat, { name: 'A' });

        const result = await client.semantic().extract(
          [objA],
          [],
          store,
          store
        );

        // Should create a new category
        expect(result.category).toBeDefined();
        expect(result.category.signature.id).not.toBe(sourceCat.signature.id);

        // Should create a functor
        expect(result.functor).toBeDefined();
        expect(result.functor.functorData?.sourceCategoryId).toBe(result.category.signature.id);
        expect(result.functor.functorData?.targetCategoryId).toBe(sourceCat.signature.id);

        // Should create one object
        expect(result.objects).toHaveLength(1);
        expect(result.objects[0].objectData?.categoryId).toBe(result.category.signature.id);

        // Should create one object mapping
        expect(result.objectMappings).toHaveLength(1);
        const mappingData = result.objectMappings[0].data as CreateObjectMappingInput;
        expect(mappingData.sourceObjectId).toBe(result.objects[0].signature.id);
        expect(mappingData.targetObjectId).toBe(objA.signature.id);

        // No morphisms
        expect(result.morphisms).toHaveLength(0);
        expect(result.morphismMappings).toHaveLength(0);
      });

      it('extracts two objects with one morphism', async () => {
        const sourceCat = await client.createCategory(store, { name: 'Source' });
        const objA = await client.createObject(store, sourceCat, { name: 'A' });
        const objB = await client.createObject(store, sourceCat, { name: 'B' });
        const mor = await client.createMorphism(objA, objB, store, sourceCat, { name: 'f' });

        const result = await client.semantic().extract(
          [objA, objB],
          [mor],
          store,
          store
        );

        // Should create a new category
        expect(result.category).toBeDefined();

        // Should create two objects
        expect(result.objects).toHaveLength(2);

        // Should create one morphism
        expect(result.morphisms).toHaveLength(1);
        const newMor = result.morphisms[0];
        expect(newMor.morphismData?.categoryId).toBe(result.category.signature.id);

        // New morphism should connect new objects (not original)
        expect(newMor.morphismData?.sourceId).toBe(result.objects[0].signature.id);
        expect(newMor.morphismData?.targetId).toBe(result.objects[1].signature.id);

        // Should create object and morphism mappings
        expect(result.objectMappings).toHaveLength(2);
        expect(result.morphismMappings).toHaveLength(1);

        const morMappingData = result.morphismMappings[0].data as CreateMorphismMappingInput;
        expect(morMappingData.sourceMorphismId).toBe(newMor.signature.id);
        expect(morMappingData.targetMorphismId).toBe(mor.signature.id);
      });

      it('accepts object and morphism IDs (strings) instead of rich objects', async () => {
        const sourceCat = await client.createCategory(store, { name: 'Source' });
        const objA = await client.createObject(store, sourceCat, { name: 'A' });
        const objB = await client.createObject(store, sourceCat, { name: 'B' });
        const mor = await client.createMorphism(objA, objB, store, sourceCat, { name: 'f' });

        // Pass IDs instead of rich objects
        const result = await client.semantic().extract(
          [objA.signature.id, objB.signature.id],
          [mor.signature.id],
          store,
          store
        );

        expect(result.category).toBeDefined();
        expect(result.objects).toHaveLength(2);
        expect(result.morphisms).toHaveLength(1);
        expect(result.objectMappings).toHaveLength(2);
        expect(result.morphismMappings).toHaveLength(1);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Complex Case: All options exercised
    // ─────────────────────────────────────────────────────────────────────────

    describe('complex case', () => {
      let sourceCat: RichCategory;
      let objA: RichObject;
      let objB: RichObject;
      let objC: RichObject;
      let morU: RichMorphism;
      let morV: RichMorphism;

      beforeEach(async () => {
        // Create source category: A --u--> B --v--> C
        sourceCat = await client.createCategory(store, { name: 'SourceCategory' });
        objA = await client.createObject(store, sourceCat, { name: 'A' });
        objB = await client.createObject(store, sourceCat, { name: 'B' });
        objC = await client.createObject(store, sourceCat, { name: 'C' });
        morU = await client.createMorphism(objA, objB, store, sourceCat, { name: 'u' });
        morV = await client.createMorphism(objB, objC, store, sourceCat, { name: 'v' });
      });

      it('extracts with all options specified', async () => {
        const result = await client.semantic().extract(
          [objA, objB, objC],
          [morU, morV],
          store,
          store,
          {
            objectOptions: [
              { name: "A'", description: 'Copy of A' },
              { name: "B'", description: 'Copy of B' },
              { name: "C'", description: 'Copy of C' },
            ],
            morphismOptions: [
              { name: "u'", description: 'Copy of u' },
              { name: "v'", description: 'Copy of v' },
            ],
            categoryOptions: { name: 'abstraction', description: 'Extracted subcategory' },
            functorOptions: { name: 'abstraction-application', description: 'Injection functor' },
          }
        );

        // Verify category options
        expect(result.category.metadata.name).toBe('abstraction');
        expect(result.category.metadata.description).toBe('Extracted subcategory');

        // Verify functor options
        expect(result.functor.metadata.name).toBe('abstraction-application');
        expect(result.functor.metadata.description).toBe('Injection functor');

        // Verify object options (in order)
        expect(result.objects).toHaveLength(3);
        expect(result.objects[0].metadata.name).toBe("A'");
        expect(result.objects[0].metadata.description).toBe('Copy of A');
        expect(result.objects[1].metadata.name).toBe("B'");
        expect(result.objects[1].metadata.description).toBe('Copy of B');
        expect(result.objects[2].metadata.name).toBe("C'");
        expect(result.objects[2].metadata.description).toBe('Copy of C');

        // Verify morphism options (in order)
        expect(result.morphisms).toHaveLength(2);
        expect(result.morphisms[0].metadata.name).toBe("u'");
        expect(result.morphisms[0].metadata.description).toBe('Copy of u');
        expect(result.morphisms[1].metadata.name).toBe("v'");
        expect(result.morphisms[1].metadata.description).toBe('Copy of v');
      });

      it('preserves morphism structure in extracted category', async () => {
        const result = await client.semantic().extract(
          [objA, objB, objC],
          [morU, morV],
          store,
          store
        );

        // New morphisms should have same structure
        // u': A' -> B', v': B' -> C'
        const [newA, newB, newC] = result.objects;
        const [newU, newV] = result.morphisms;

        expect(newU.morphismData?.sourceId).toBe(newA.signature.id);
        expect(newU.morphismData?.targetId).toBe(newB.signature.id);
        expect(newV.morphismData?.sourceId).toBe(newB.signature.id);
        expect(newV.morphismData?.targetId).toBe(newC.signature.id);
      });

      it('functor maps correctly from new category to source', async () => {
        const result = await client.semantic().extract(
          [objA, objB, objC],
          [morU, morV],
          store,
          store
        );

        // Verify functor structure
        const functorData = result.functor.functorData;
        expect(functorData?.sourceCategoryId).toBe(result.category.signature.id);
        expect(functorData?.targetCategoryId).toBe(sourceCat.signature.id);

        // Verify object mappings
        expect(result.objectMappings).toHaveLength(3);
        for (let i = 0; i < 3; i++) {
          const mapping = result.objectMappings[i].data as CreateObjectMappingInput;
          expect(mapping.sourceObjectId).toBe(result.objects[i].signature.id);
        }

        // Mapping targets should be original objects
        const targets = result.objectMappings.map(
          m => (m.data as CreateObjectMappingInput).targetObjectId
        );
        expect(targets).toContain(objA.signature.id);
        expect(targets).toContain(objB.signature.id);
        expect(targets).toContain(objC.signature.id);

        // Verify morphism mappings
        expect(result.morphismMappings).toHaveLength(2);
        const morTargets = result.morphismMappings.map(
          m => (m.data as CreateMorphismMappingInput).targetMorphismId
        );
        expect(morTargets).toContain(morU.signature.id);
        expect(morTargets).toContain(morV.signature.id);
      });

      it('can use different stores for category and functor', async () => {
        const store2 = new MockStore('store-2');
        client.attachStore(store2);

        const result = await client.semantic().extract(
          [objA, objB],
          [morU],
          store,    // category goes here
          store2,   // functor goes here
          {
            categoryOptions: { name: 'in-store-1' },
            functorOptions: { name: 'in-store-2' },
          }
        );

        // Category and objects should be in store
        expect(result.category.signature.storeId).toBe(store.id);
        expect(result.objects[0].signature.storeId).toBe(store.id);
        expect(result.objects[1].signature.storeId).toBe(store.id);
        expect(result.morphisms[0].signature.storeId).toBe(store.id);

        // Functor and mappings should be in store2
        expect(result.functor.signature.storeId).toBe(store2.id);
        expect(result.objectMappings[0].signature.storeId).toBe(store2.id);
        expect(result.morphismMappings[0].signature.storeId).toBe(store2.id);
      });

      it('extracts subset of objects (not all from category)', async () => {
        // Only extract A and B with u, leaving C and v behind
        const result = await client.semantic().extract(
          [objA, objB],
          [morU],
          store,
          store
        );

        expect(result.objects).toHaveLength(2);
        expect(result.morphisms).toHaveLength(1);

        // The functor still maps to the original category (which has 3 objects)
        expect(result.functor.functorData?.targetCategoryId).toBe(sourceCat.signature.id);
      });

      it('handles complex morphism structure (diamond)', async () => {
        // Create a diamond: A -> B, A -> C, B -> D, C -> D
        const catDiamond = await client.createCategory(store, { name: 'Diamond' });
        const dA = await client.createObject(store, catDiamond, { name: 'A' });
        const dB = await client.createObject(store, catDiamond, { name: 'B' });
        const dC = await client.createObject(store, catDiamond, { name: 'C' });
        const dD = await client.createObject(store, catDiamond, { name: 'D' });
        const mAB = await client.createMorphism(dA, dB, store, catDiamond, { name: 'AB' });
        const mAC = await client.createMorphism(dA, dC, store, catDiamond, { name: 'AC' });
        const mBD = await client.createMorphism(dB, dD, store, catDiamond, { name: 'BD' });
        const mCD = await client.createMorphism(dC, dD, store, catDiamond, { name: 'CD' });

        const result = await client.semantic().extract(
          [dA, dB, dC, dD],
          [mAB, mAC, mBD, mCD],
          store,
          store
        );

        expect(result.objects).toHaveLength(4);
        expect(result.morphisms).toHaveLength(4);
        expect(result.objectMappings).toHaveLength(4);
        expect(result.morphismMappings).toHaveLength(4);

        // Verify diamond structure is preserved
        const [nA, nB, nC, nD] = result.objects;
        const [nAB, nAC, nBD, nCD] = result.morphisms;

        expect(nAB.morphismData?.sourceId).toBe(nA.signature.id);
        expect(nAB.morphismData?.targetId).toBe(nB.signature.id);
        expect(nAC.morphismData?.sourceId).toBe(nA.signature.id);
        expect(nAC.morphismData?.targetId).toBe(nC.signature.id);
        expect(nBD.morphismData?.sourceId).toBe(nB.signature.id);
        expect(nBD.morphismData?.targetId).toBe(nD.signature.id);
        expect(nCD.morphismData?.sourceId).toBe(nC.signature.id);
        expect(nCD.morphismData?.targetId).toBe(nD.signature.id);
      });
    });
  });
});

