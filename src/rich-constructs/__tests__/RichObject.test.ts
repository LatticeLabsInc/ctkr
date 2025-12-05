import { describe, it, expect, beforeEach } from 'vitest';
import { RichObject } from '../RichObject.js';
import { RichMorphism } from '../RichMorphism.js';
import { RichCategory } from '../RichCategory.js';
import { MockQueryEngine } from '../../client/mocks/MockQueryEngine.js';
import type { StoredCTC } from '../../stores/Store.interface.js';
import { ObjectType, MorphismType, CategoryType } from '../../types/index.js';

describe('RichObject', () => {
  let mockQueryEngine: MockQueryEngine;
  let objectStored: StoredCTC;
  let object: RichObject;

  beforeEach(() => {
    mockQueryEngine = new MockQueryEngine();
    objectStored = {
      signature: { id: 'obj-1', storeId: 'store-1', version: 1 },
      metadata: { name: 'Object A', createdAt: new Date(), updatedAt: new Date() },
      type: ObjectType,
      data: { categoryId: 'cat-1', properties: { key: 'value' } },
    };
    object = new RichObject(objectStored, mockQueryEngine as any);
  });

  describe('properties', () => {
    it('exposes signature', () => {
      expect(object.signature.id).toBe('obj-1');
    });

    it('exposes metadata', () => {
      expect(object.metadata.name).toBe('Object A');
    });

    it('exposes objectData', () => {
      expect(object.objectData).toEqual({ categoryId: 'cat-1', properties: { key: 'value' } });
    });

    it('exposes categoryId', () => {
      expect(object.categoryId).toBe('cat-1');
    });

    it('exposes properties', () => {
      expect(object.properties).toEqual({ key: 'value' });
    });

    it('returns undefined categoryId when objectData is null', () => {
      const orphanObject = new RichObject({
        ...objectStored,
        data: null,
      }, mockQueryEngine as any);
      expect(orphanObject.categoryId).toBeUndefined();
    });
  });

  describe('getMorphismsFrom', () => {
    it('calls queryEngine.getMorphismsFromObject with correct ID', async () => {
      await object.getMorphismsFrom();
      expect(mockQueryEngine.calls.getMorphismsFromObject).toHaveLength(1);
      expect(mockQueryEngine.calls.getMorphismsFromObject[0].args[0]).toBe('obj-1');
    });

    it('returns RichMorphism instances', async () => {
      const morphismStored: StoredCTC = {
        signature: { id: 'mor-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'f', createdAt: new Date(), updatedAt: new Date() },
        type: MorphismType,
        data: { sourceId: 'obj-1', targetId: 'obj-2' },
      };
      mockQueryEngine.setMockResult('getMorphismsFromObject:obj-1', [morphismStored]);

      const morphisms = await object.getMorphismsFrom();
      expect(morphisms).toHaveLength(1);
      expect(morphisms[0]).toBeInstanceOf(RichMorphism);
      expect(morphisms[0].sourceId).toBe('obj-1');
    });

    it('returns empty array when no outgoing morphisms', async () => {
      const morphisms = await object.getMorphismsFrom();
      expect(morphisms).toHaveLength(0);
    });
  });

  describe('getMorphismsTo', () => {
    it('calls queryEngine.getMorphismsToObject with correct ID', async () => {
      await object.getMorphismsTo();
      expect(mockQueryEngine.calls.getMorphismsToObject).toHaveLength(1);
      expect(mockQueryEngine.calls.getMorphismsToObject[0].args[0]).toBe('obj-1');
    });

    it('returns RichMorphism instances', async () => {
      const morphismStored: StoredCTC = {
        signature: { id: 'mor-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'g', createdAt: new Date(), updatedAt: new Date() },
        type: MorphismType,
        data: { sourceId: 'obj-2', targetId: 'obj-1' },
      };
      mockQueryEngine.setMockResult('getMorphismsToObject:obj-1', [morphismStored]);

      const morphisms = await object.getMorphismsTo();
      expect(morphisms).toHaveLength(1);
      expect(morphisms[0]).toBeInstanceOf(RichMorphism);
      expect(morphisms[0].targetId).toBe('obj-1');
    });
  });

  describe('getCategory', () => {
    it('returns undefined when categoryId is not set', async () => {
      const orphan = new RichObject({
        ...objectStored,
        data: null,
      }, mockQueryEngine as any);

      const cat = await orphan.getCategory();
      expect(cat).toBeUndefined();
    });

    it('calls queryEngine.get with categoryId', async () => {
      await object.getCategory();
      expect(mockQueryEngine.calls.get).toHaveLength(1);
      expect(mockQueryEngine.calls.get[0].args[0]).toBe('cat-1');
    });

    it('returns RichCategory when found', async () => {
      const categoryStored: StoredCTC = {
        signature: { id: 'cat-1', storeId: 'store-1', version: 1 },
        metadata: { name: 'TestCategory', createdAt: new Date(), updatedAt: new Date() },
        type: CategoryType,
        data: null,
      };
      mockQueryEngine.setMockSingleResult('get:cat-1', categoryStored);

      const cat = await object.getCategory();
      expect(cat).toBeInstanceOf(RichCategory);
      expect(cat?.signature.id).toBe('cat-1');
    });

    it('returns undefined when category not found', async () => {
      // categoryId is set but queryEngine returns undefined
      const cat = await object.getCategory();
      expect(cat).toBeUndefined();
    });
  });
});

