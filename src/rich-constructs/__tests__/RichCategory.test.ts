import { describe, it, expect, beforeEach } from 'vitest';
import { RichCategory } from '../RichCategory.js';
import { RichObject } from '../RichObject.js';
import { RichMorphism } from '../RichMorphism.js';
import { RichFunctor } from '../RichFunctor.js';
import { MockQueryEngine } from '../../client/mocks/MockQueryEngine.js';
import type { StoredCTC } from '../../stores/Store.interface.js';
import { CategoryType, ObjectType, MorphismType, FunctorType } from '../../types/index.js';

describe('RichCategory', () => {
  let mockQueryEngine: MockQueryEngine;
  let categoryStored: StoredCTC;
  let category: RichCategory;

  beforeEach(() => {
    mockQueryEngine = new MockQueryEngine();
    categoryStored = {
      signature: { id: 'cat-1', storeId: 'store-1', version: 1 },
      metadata: { name: 'TestCategory', createdAt: new Date(), updatedAt: new Date() },
      type: CategoryType,
      data: { properties: { key: 'value' } },
    };
    category = new RichCategory(categoryStored, mockQueryEngine as any);
  });

  describe('properties', () => {
    it('exposes signature', () => {
      expect(category.signature.id).toBe('cat-1');
      expect(category.signature.storeId).toBe('store-1');
      expect(category.signature.version).toBe(1);
    });

    it('exposes metadata', () => {
      expect(category.metadata.name).toBe('TestCategory');
    });

    it('exposes categoryData', () => {
      expect(category.categoryData).toEqual({ properties: { key: 'value' } });
    });

    it('exposes properties from categoryData', () => {
      expect(category.properties).toEqual({ key: 'value' });
    });

    it('returns undefined properties when categoryData is null', () => {
      const emptyCategory = new RichCategory({
        ...categoryStored,
        data: null,
      }, mockQueryEngine as any);
      expect(emptyCategory.properties).toBeUndefined();
    });
  });

  describe('getObjects', () => {
    it('calls queryEngine.getObjectsInCategory with correct ID', async () => {
      await category.getObjects();
      expect(mockQueryEngine.calls.getObjectsInCategory).toHaveLength(1);
      expect(mockQueryEngine.calls.getObjectsInCategory[0].args[0]).toBe('cat-1');
    });

    it('returns RichObject instances', async () => {
      const objectStored: StoredCTC = {
        signature: { id: 'obj-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'Object A', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: { categoryId: 'cat-1' },
      };
      mockQueryEngine.setMockResult('getObjectsInCategory:cat-1', [objectStored]);

      const objects = await category.getObjects();
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBeInstanceOf(RichObject);
      expect(objects[0].signature.id).toBe('obj-1');
    });

    it('returns empty array when no objects', async () => {
      const objects = await category.getObjects();
      expect(objects).toHaveLength(0);
    });
  });

  describe('getObject', () => {
    it('calls queryEngine.getObjectInCategory with correct IDs', async () => {
      await category.getObject('obj-1');
      expect(mockQueryEngine.calls.getObjectInCategory).toHaveLength(1);
      expect(mockQueryEngine.calls.getObjectInCategory[0].args).toEqual(['cat-1', 'obj-1']);
    });

    it('returns RichObject when found', async () => {
      const objectStored: StoredCTC = {
        signature: { id: 'obj-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'Object A', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: { categoryId: 'cat-1' },
      };
      mockQueryEngine.setMockSingleResult('getObjectInCategory:cat-1:obj-1', objectStored);

      const obj = await category.getObject('obj-1');
      expect(obj).toBeInstanceOf(RichObject);
      expect(obj?.signature.id).toBe('obj-1');
    });

    it('returns undefined when not found', async () => {
      const obj = await category.getObject('non-existent');
      expect(obj).toBeUndefined();
    });
  });

  describe('getMorphisms', () => {
    it('calls queryEngine.getMorphismsInCategory with correct ID', async () => {
      await category.getMorphisms();
      expect(mockQueryEngine.calls.getMorphismsInCategory).toHaveLength(1);
      expect(mockQueryEngine.calls.getMorphismsInCategory[0].args[0]).toBe('cat-1');
    });

    it('returns RichMorphism instances', async () => {
      const morphismStored: StoredCTC = {
        signature: { id: 'mor-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'f', createdAt: new Date(), updatedAt: new Date() },
        type: MorphismType,
        data: { sourceId: 'obj-1', targetId: 'obj-2', categoryId: 'cat-1' },
      };
      mockQueryEngine.setMockResult('getMorphismsInCategory:cat-1', [morphismStored]);

      const morphisms = await category.getMorphisms();
      expect(morphisms).toHaveLength(1);
      expect(morphisms[0]).toBeInstanceOf(RichMorphism);
    });
  });

  describe('getMorphism', () => {
    it('calls queryEngine.getMorphismInCategory with correct IDs', async () => {
      await category.getMorphism('mor-1');
      expect(mockQueryEngine.calls.getMorphismInCategory).toHaveLength(1);
      expect(mockQueryEngine.calls.getMorphismInCategory[0].args).toEqual(['cat-1', 'mor-1']);
    });

    it('returns RichMorphism when found', async () => {
      const morphismStored: StoredCTC = {
        signature: { id: 'mor-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'f', createdAt: new Date(), updatedAt: new Date() },
        type: MorphismType,
        data: { sourceId: 'obj-1', targetId: 'obj-2', categoryId: 'cat-1' },
      };
      mockQueryEngine.setMockSingleResult('getMorphismInCategory:cat-1:mor-1', morphismStored);

      const mor = await category.getMorphism('mor-1');
      expect(mor).toBeInstanceOf(RichMorphism);
    });
  });

  describe('getFunctorsFrom', () => {
    it('calls queryEngine.getFunctorsFromCategory with correct ID', async () => {
      await category.getFunctorsFrom();
      expect(mockQueryEngine.calls.getFunctorsFromCategory).toHaveLength(1);
      expect(mockQueryEngine.calls.getFunctorsFromCategory[0].args[0]).toBe('cat-1');
    });

    it('returns RichFunctor instances', async () => {
      const functorStored: StoredCTC = {
        signature: { id: 'fun-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'F', createdAt: new Date(), updatedAt: new Date() },
        type: FunctorType,
        data: { sourceCategoryId: 'cat-1', targetCategoryId: 'cat-2' },
      };
      mockQueryEngine.setMockResult('getFunctorsFromCategory:cat-1', [functorStored]);

      const functors = await category.getFunctorsFrom();
      expect(functors).toHaveLength(1);
      expect(functors[0]).toBeInstanceOf(RichFunctor);
    });
  });

  describe('getFunctorsTo', () => {
    it('calls queryEngine.getFunctorsToCategory with correct ID', async () => {
      await category.getFunctorsTo();
      expect(mockQueryEngine.calls.getFunctorsToCategory).toHaveLength(1);
      expect(mockQueryEngine.calls.getFunctorsToCategory[0].args[0]).toBe('cat-1');
    });

    it('returns RichFunctor instances', async () => {
      const functorStored: StoredCTC = {
        signature: { id: 'fun-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'G', createdAt: new Date(), updatedAt: new Date() },
        type: FunctorType,
        data: { sourceCategoryId: 'cat-2', targetCategoryId: 'cat-1' },
      };
      mockQueryEngine.setMockResult('getFunctorsToCategory:cat-1', [functorStored]);

      const functors = await category.getFunctorsTo();
      expect(functors).toHaveLength(1);
      expect(functors[0]).toBeInstanceOf(RichFunctor);
    });
  });
});

