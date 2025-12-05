import { describe, it, expect, beforeEach } from 'vitest';
import { RichMorphism } from '../RichMorphism.js';
import { RichObject } from '../RichObject.js';
import { RichCategory } from '../RichCategory.js';
import { MockQueryEngine } from '../../client/mocks/MockQueryEngine.js';
import type { StoredCTC } from '../../stores/Store.interface.js';
import { MorphismType, ObjectType, CategoryType } from '../../types/index.js';

describe('RichMorphism', () => {
  let mockQueryEngine: MockQueryEngine;
  let morphismStored: StoredCTC;
  let morphism: RichMorphism;

  beforeEach(() => {
    mockQueryEngine = new MockQueryEngine();
    morphismStored = {
      signature: { id: 'mor-1', storeId: 'store-1', version: 1 },
      metadata: { name: 'f: A → B', createdAt: new Date(), updatedAt: new Date() },
      type: MorphismType,
      data: { sourceId: 'obj-a', targetId: 'obj-b', categoryId: 'cat-1', properties: { key: 'value' } },
    };
    morphism = new RichMorphism(morphismStored, mockQueryEngine as any);
  });

  describe('properties', () => {
    it('exposes signature', () => {
      expect(morphism.signature.id).toBe('mor-1');
    });

    it('exposes metadata', () => {
      expect(morphism.metadata.name).toBe('f: A → B');
    });

    it('exposes morphismData', () => {
      expect(morphism.morphismData).toEqual({
        sourceId: 'obj-a',
        targetId: 'obj-b',
        categoryId: 'cat-1',
        properties: { key: 'value' },
      });
    });

    it('exposes sourceId', () => {
      expect(morphism.sourceId).toBe('obj-a');
    });

    it('exposes targetId', () => {
      expect(morphism.targetId).toBe('obj-b');
    });

    it('exposes categoryId', () => {
      expect(morphism.categoryId).toBe('cat-1');
    });

    it('exposes properties', () => {
      expect(morphism.properties).toEqual({ key: 'value' });
    });

    it('returns undefined for all when morphismData is null', () => {
      const emptyMorphism = new RichMorphism({
        ...morphismStored,
        data: null,
      }, mockQueryEngine as any);
      expect(emptyMorphism.sourceId).toBeUndefined();
      expect(emptyMorphism.targetId).toBeUndefined();
      expect(emptyMorphism.categoryId).toBeUndefined();
    });
  });

  describe('getSourceObject', () => {
    it('calls queryEngine.getSourceObject with morphism ID', async () => {
      await morphism.getSourceObject();
      expect(mockQueryEngine.calls.getSourceObject).toHaveLength(1);
      expect(mockQueryEngine.calls.getSourceObject[0].args[0]).toBe('mor-1');
    });

    it('returns RichObject when found', async () => {
      const objectStored: StoredCTC = {
        signature: { id: 'obj-a', storeId: 'store-1', version: 1 },
        metadata: { name: 'A', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: { categoryId: 'cat-1' },
      };
      mockQueryEngine.setMockSingleResult('getSourceObject:mor-1', objectStored);

      const source = await morphism.getSourceObject();
      expect(source).toBeInstanceOf(RichObject);
      expect(source?.signature.id).toBe('obj-a');
    });

    it('returns undefined when not found', async () => {
      const source = await morphism.getSourceObject();
      expect(source).toBeUndefined();
    });
  });

  describe('getTargetObject', () => {
    it('calls queryEngine.getTargetObject with morphism ID', async () => {
      await morphism.getTargetObject();
      expect(mockQueryEngine.calls.getTargetObject).toHaveLength(1);
      expect(mockQueryEngine.calls.getTargetObject[0].args[0]).toBe('mor-1');
    });

    it('returns RichObject when found', async () => {
      const objectStored: StoredCTC = {
        signature: { id: 'obj-b', storeId: 'store-1', version: 1 },
        metadata: { name: 'B', createdAt: new Date(), updatedAt: new Date() },
        type: ObjectType,
        data: { categoryId: 'cat-1' },
      };
      mockQueryEngine.setMockSingleResult('getTargetObject:mor-1', objectStored);

      const target = await morphism.getTargetObject();
      expect(target).toBeInstanceOf(RichObject);
      expect(target?.signature.id).toBe('obj-b');
    });
  });

  describe('getCategory', () => {
    it('returns undefined when categoryId is not set', async () => {
      const morphismNoCategory = new RichMorphism({
        ...morphismStored,
        data: { sourceId: 'a', targetId: 'b' },
      }, mockQueryEngine as any);

      const cat = await morphismNoCategory.getCategory();
      expect(cat).toBeUndefined();
    });

    it('calls queryEngine.get with categoryId', async () => {
      await morphism.getCategory();
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

      const cat = await morphism.getCategory();
      expect(cat).toBeInstanceOf(RichCategory);
      expect(cat?.signature.id).toBe('cat-1');
    });
  });
});

