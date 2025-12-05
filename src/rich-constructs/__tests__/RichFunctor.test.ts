import { describe, it, expect, beforeEach } from 'vitest';
import { RichFunctor } from '../RichFunctor.js';
import { RichCategory } from '../RichCategory.js';
import { RichObject } from '../RichObject.js';
import { RichMorphism } from '../RichMorphism.js';
import { MockQueryEngine } from '../../client/mocks/MockQueryEngine.js';
import type { StoredCTC } from '../../stores/Store.interface.js';
import { FunctorType, CategoryType, ObjectType, MorphismType } from '../../types/index.js';

describe('RichFunctor', () => {
  let mockQueryEngine: MockQueryEngine;
  let functorStored: StoredCTC;
  let functor: RichFunctor;

  beforeEach(() => {
    mockQueryEngine = new MockQueryEngine();
    functorStored = {
      signature: { id: 'fun-1', storeId: 'store-1', version: 1 },
      metadata: { name: 'F: C → D', createdAt: new Date(), updatedAt: new Date() },
      type: FunctorType,
      data: { sourceCategoryId: 'cat-c', targetCategoryId: 'cat-d', properties: { key: 'value' } },
    };
    functor = new RichFunctor(functorStored, mockQueryEngine as any);
  });

  describe('properties', () => {
    it('exposes signature', () => {
      expect(functor.signature.id).toBe('fun-1');
    });

    it('exposes metadata', () => {
      expect(functor.metadata.name).toBe('F: C → D');
    });

    it('exposes functorData', () => {
      expect(functor.functorData).toEqual({
        sourceCategoryId: 'cat-c',
        targetCategoryId: 'cat-d',
        properties: { key: 'value' },
      });
    });

    it('exposes sourceCategoryId', () => {
      expect(functor.sourceCategoryId).toBe('cat-c');
    });

    it('exposes targetCategoryId', () => {
      expect(functor.targetCategoryId).toBe('cat-d');
    });

    it('exposes properties', () => {
      expect(functor.properties).toEqual({ key: 'value' });
    });
  });

  describe('getSourceCategory', () => {
    it('calls queryEngine.getSourceCategory with functor ID', async () => {
      await functor.getSourceCategory();
      expect(mockQueryEngine.calls.getSourceCategory).toHaveLength(1);
      expect(mockQueryEngine.calls.getSourceCategory[0].args[0]).toBe('fun-1');
    });

    it('returns RichCategory when found', async () => {
      const categoryStored: StoredCTC = {
        signature: { id: 'cat-c', storeId: 'store-1', version: 1 },
        metadata: { name: 'Category C', createdAt: new Date(), updatedAt: new Date() },
        type: CategoryType,
        data: null,
      };
      mockQueryEngine.setMockSingleResult('getSourceCategory:fun-1', categoryStored);

      const cat = await functor.getSourceCategory();
      expect(cat).toBeInstanceOf(RichCategory);
      expect(cat?.signature.id).toBe('cat-c');
    });
  });

  describe('getTargetCategory', () => {
    it('calls queryEngine.getTargetCategory with functor ID', async () => {
      await functor.getTargetCategory();
      expect(mockQueryEngine.calls.getTargetCategory).toHaveLength(1);
      expect(mockQueryEngine.calls.getTargetCategory[0].args[0]).toBe('fun-1');
    });

    it('returns RichCategory when found', async () => {
      const categoryStored: StoredCTC = {
        signature: { id: 'cat-d', storeId: 'store-1', version: 1 },
        metadata: { name: 'Category D', createdAt: new Date(), updatedAt: new Date() },
        type: CategoryType,
        data: null,
      };
      mockQueryEngine.setMockSingleResult('getTargetCategory:fun-1', categoryStored);

      const cat = await functor.getTargetCategory();
      expect(cat).toBeInstanceOf(RichCategory);
      expect(cat?.signature.id).toBe('cat-d');
    });
  });

  describe('getSourceObjects', () => {
    it('calls queryEngine.getSourceObjects with functor ID', async () => {
      await functor.getSourceObjects();
      expect(mockQueryEngine.calls.getSourceObjects).toHaveLength(1);
      expect(mockQueryEngine.calls.getSourceObjects[0].args[0]).toBe('fun-1');
    });

    it('returns RichObject instances', async () => {
      const objectStored: StoredCTC = {
        signature: { id: 'obj-a', storeId: 'store-1', version: 1 },
        metadata: { name: 'A', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: { categoryId: 'cat-c' },
      };
      mockQueryEngine.setMockResult('getSourceObjects:fun-1', [objectStored]);

      const objects = await functor.getSourceObjects();
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBeInstanceOf(RichObject);
    });
  });

  describe('getTargetObjects', () => {
    it('calls queryEngine.getTargetObjects with functor ID', async () => {
      await functor.getTargetObjects();
      expect(mockQueryEngine.calls.getTargetObjects).toHaveLength(1);
      expect(mockQueryEngine.calls.getTargetObjects[0].args[0]).toBe('fun-1');
    });

    it('returns RichObject instances', async () => {
      const objectStored: StoredCTC = {
        signature: { id: 'obj-x', storeId: 'store-1', version: 1 },
        metadata: { name: 'X', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: { categoryId: 'cat-d' },
      };
      mockQueryEngine.setMockResult('getTargetObjects:fun-1', [objectStored]);

      const objects = await functor.getTargetObjects();
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBeInstanceOf(RichObject);
    });
  });

  describe('getTargetObject (image under functor)', () => {
    it('calls queryEngine with functor ID and source object ID (string)', async () => {
      await functor.getTargetObject('obj-a');
      expect(mockQueryEngine.calls.getTargetObjectForSource).toHaveLength(1);
      expect(mockQueryEngine.calls.getTargetObjectForSource[0].args).toEqual(['fun-1', 'obj-a']);
    });

    it('calls queryEngine with functor ID and source object (RichObject)', async () => {
      const sourceObj = new RichObject({
        signature: { id: 'obj-a', storeId: 'store-1', version: 1 },
        metadata: { name: 'A', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: null,
      }, mockQueryEngine as any);

      await functor.getTargetObject(sourceObj);
      expect(mockQueryEngine.calls.getTargetObjectForSource[0].args).toEqual(['fun-1', 'obj-a']);
    });

    it('returns RichObject when found', async () => {
      const targetStored: StoredCTC = {
        signature: { id: 'obj-x', storeId: 'store-1', version: 1 },
        metadata: { name: 'X', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: { categoryId: 'cat-d' },
      };
      mockQueryEngine.setMockSingleResult('getTargetObjectForSource:fun-1:obj-a', targetStored);

      const target = await functor.getTargetObject('obj-a');
      expect(target).toBeInstanceOf(RichObject);
      expect(target?.signature.id).toBe('obj-x');
    });
  });

  describe('getSourceObjectsFor (preimage)', () => {
    it('calls queryEngine with functor ID and target object ID', async () => {
      await functor.getSourceObjectsFor('obj-x');
      expect(mockQueryEngine.calls.getSourceObjectsForTarget).toHaveLength(1);
      expect(mockQueryEngine.calls.getSourceObjectsForTarget[0].args).toEqual(['fun-1', 'obj-x']);
    });

    it('returns RichObject instances', async () => {
      const sourceStored: StoredCTC = {
        signature: { id: 'obj-a', storeId: 'store-1', version: 1 },
        metadata: { name: 'A', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: { categoryId: 'cat-c' },
      };
      mockQueryEngine.setMockResult('getSourceObjectsForTarget:fun-1:obj-x', [sourceStored]);

      const sources = await functor.getSourceObjectsFor('obj-x');
      expect(sources).toHaveLength(1);
      expect(sources[0]).toBeInstanceOf(RichObject);
    });
  });

  describe('getSourceMorphisms', () => {
    it('calls queryEngine.getSourceMorphisms with functor ID', async () => {
      await functor.getSourceMorphisms();
      expect(mockQueryEngine.calls.getSourceMorphisms).toHaveLength(1);
      expect(mockQueryEngine.calls.getSourceMorphisms[0].args[0]).toBe('fun-1');
    });

    it('returns RichMorphism instances', async () => {
      const morphismStored: StoredCTC = {
        signature: { id: 'mor-f', storeId: 'store-1', version: 1 },
        metadata: { name: 'f', createdAt: new Date(), updatedAt: new Date() },
        type: MorphismType,
        data: { sourceId: 'obj-a', targetId: 'obj-b' },
      };
      mockQueryEngine.setMockResult('getSourceMorphisms:fun-1', [morphismStored]);

      const morphisms = await functor.getSourceMorphisms();
      expect(morphisms).toHaveLength(1);
      expect(morphisms[0]).toBeInstanceOf(RichMorphism);
    });
  });

  describe('getTargetMorphisms', () => {
    it('returns RichMorphism instances', async () => {
      const morphismStored: StoredCTC = {
        signature: { id: 'mor-g', storeId: 'store-1', version: 1 },
        metadata: { name: 'g', createdAt: new Date(), updatedAt: new Date() },
        type: MorphismType,
        data: { sourceId: 'obj-x', targetId: 'obj-y' },
      };
      mockQueryEngine.setMockResult('getTargetMorphisms:fun-1', [morphismStored]);

      const morphisms = await functor.getTargetMorphisms();
      expect(morphisms).toHaveLength(1);
      expect(morphisms[0]).toBeInstanceOf(RichMorphism);
    });
  });

  describe('getTargetMorphism (image under functor)', () => {
    it('calls queryEngine with functor ID and source morphism ID', async () => {
      await functor.getTargetMorphism('mor-f');
      expect(mockQueryEngine.calls.getTargetMorphismForSource).toHaveLength(1);
      expect(mockQueryEngine.calls.getTargetMorphismForSource[0].args).toEqual(['fun-1', 'mor-f']);
    });

    it('returns RichMorphism when found', async () => {
      const targetStored: StoredCTC = {
        signature: { id: 'mor-g', storeId: 'store-1', version: 1 },
        metadata: { name: 'g', createdAt: new Date(), updatedAt: new Date() },
        type: MorphismType,
        data: { sourceId: 'obj-x', targetId: 'obj-y' },
      };
      mockQueryEngine.setMockSingleResult('getTargetMorphismForSource:fun-1:mor-f', targetStored);

      const target = await functor.getTargetMorphism('mor-f');
      expect(target).toBeInstanceOf(RichMorphism);
      expect(target?.signature.id).toBe('mor-g');
    });
  });

  describe('getSourceMorphismsFor (preimage)', () => {
    it('returns RichMorphism instances', async () => {
      const sourceStored: StoredCTC = {
        signature: { id: 'mor-f', storeId: 'store-1', version: 1 },
        metadata: { name: 'f', createdAt: new Date(), updatedAt: new Date() },
        type: MorphismType,
        data: { sourceId: 'obj-a', targetId: 'obj-b' },
      };
      mockQueryEngine.setMockResult('getSourceMorphismsForTarget:fun-1:mor-g', [sourceStored]);

      const sources = await functor.getSourceMorphismsFor('mor-g');
      expect(sources).toHaveLength(1);
      expect(sources[0]).toBeInstanceOf(RichMorphism);
    });
  });
});

