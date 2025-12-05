// MockQueryEngine - Mock implementation for testing RichConstructs

import type { StoredCTC } from '../../stores/Store.interface.js';
import type { SignatureId } from '../../data-constructs/Signature.js';

/**
 * Mock QueryEngine for testing RichConstructs in isolation.
 * 
 * Each method can be configured to return specific results.
 */
export class MockQueryEngine {
  // Storage for mock results
  private mockResults: Map<string, StoredCTC[]> = new Map();
  private mockSingleResults: Map<string, StoredCTC | undefined> = new Map();

  // Track method calls
  public calls: {
    getObjectsInCategory: { args: any[] }[];
    getObjectInCategory: { args: any[] }[];
    getMorphismsInCategory: { args: any[] }[];
    getMorphismInCategory: { args: any[] }[];
    getFunctorsFromCategory: { args: any[] }[];
    getFunctorsToCategory: { args: any[] }[];
    getMorphismsFromObject: { args: any[] }[];
    getMorphismsToObject: { args: any[] }[];
    getSourceObject: { args: any[] }[];
    getTargetObject: { args: any[] }[];
    getSourceCategory: { args: any[] }[];
    getTargetCategory: { args: any[] }[];
    getObjectMappings: { args: any[] }[];
    getMorphismMappings: { args: any[] }[];
    getSourceObjects: { args: any[] }[];
    getTargetObjects: { args: any[] }[];
    getTargetObjectForSource: { args: any[] }[];
    getSourceObjectsForTarget: { args: any[] }[];
    getSourceMorphisms: { args: any[] }[];
    getTargetMorphisms: { args: any[] }[];
    getTargetMorphismForSource: { args: any[] }[];
    getSourceMorphismsForTarget: { args: any[] }[];
    get: { args: any[] }[];
  } = {
    getObjectsInCategory: [],
    getObjectInCategory: [],
    getMorphismsInCategory: [],
    getMorphismInCategory: [],
    getFunctorsFromCategory: [],
    getFunctorsToCategory: [],
    getMorphismsFromObject: [],
    getMorphismsToObject: [],
    getSourceObject: [],
    getTargetObject: [],
    getSourceCategory: [],
    getTargetCategory: [],
    getObjectMappings: [],
    getMorphismMappings: [],
    getSourceObjects: [],
    getTargetObjects: [],
    getTargetObjectForSource: [],
    getSourceObjectsForTarget: [],
    getSourceMorphisms: [],
    getTargetMorphisms: [],
    getTargetMorphismForSource: [],
    getSourceMorphismsForTarget: [],
    get: [],
  };

  /**
   * Configure a method to return specific results.
   */
  setMockResult(key: string, results: StoredCTC[]): void {
    this.mockResults.set(key, results);
  }

  /**
   * Configure a method to return a single result.
   */
  setMockSingleResult(key: string, result: StoredCTC | undefined): void {
    this.mockSingleResults.set(key, result);
  }

  /**
   * Reset all mocks and call tracking.
   */
  reset(): void {
    this.mockResults.clear();
    this.mockSingleResults.clear();
    for (const key of Object.keys(this.calls) as (keyof typeof this.calls)[]) {
      this.calls[key] = [];
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Category queries
  // ─────────────────────────────────────────────────────────────────────────────

  async getObjectsInCategory(categoryId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getObjectsInCategory.push({ args: [categoryId] });
    return this.mockResults.get(`getObjectsInCategory:${categoryId}`) ?? [];
  }

  async getObjectInCategory(categoryId: SignatureId, objectId: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.getObjectInCategory.push({ args: [categoryId, objectId] });
    return this.mockSingleResults.get(`getObjectInCategory:${categoryId}:${objectId}`);
  }

  async getMorphismsInCategory(categoryId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getMorphismsInCategory.push({ args: [categoryId] });
    return this.mockResults.get(`getMorphismsInCategory:${categoryId}`) ?? [];
  }

  async getMorphismInCategory(categoryId: SignatureId, morphismId: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.getMorphismInCategory.push({ args: [categoryId, morphismId] });
    return this.mockSingleResults.get(`getMorphismInCategory:${categoryId}:${morphismId}`);
  }

  async getFunctorsFromCategory(categoryId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getFunctorsFromCategory.push({ args: [categoryId] });
    return this.mockResults.get(`getFunctorsFromCategory:${categoryId}`) ?? [];
  }

  async getFunctorsToCategory(categoryId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getFunctorsToCategory.push({ args: [categoryId] });
    return this.mockResults.get(`getFunctorsToCategory:${categoryId}`) ?? [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Object queries
  // ─────────────────────────────────────────────────────────────────────────────

  async getMorphismsFromObject(objectId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getMorphismsFromObject.push({ args: [objectId] });
    return this.mockResults.get(`getMorphismsFromObject:${objectId}`) ?? [];
  }

  async getMorphismsToObject(objectId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getMorphismsToObject.push({ args: [objectId] });
    return this.mockResults.get(`getMorphismsToObject:${objectId}`) ?? [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Morphism queries
  // ─────────────────────────────────────────────────────────────────────────────

  async getSourceObject(morphismId: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.getSourceObject.push({ args: [morphismId] });
    return this.mockSingleResults.get(`getSourceObject:${morphismId}`);
  }

  async getTargetObject(morphismId: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.getTargetObject.push({ args: [morphismId] });
    return this.mockSingleResults.get(`getTargetObject:${morphismId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Functor queries
  // ─────────────────────────────────────────────────────────────────────────────

  async getSourceCategory(functorId: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.getSourceCategory.push({ args: [functorId] });
    return this.mockSingleResults.get(`getSourceCategory:${functorId}`);
  }

  async getTargetCategory(functorId: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.getTargetCategory.push({ args: [functorId] });
    return this.mockSingleResults.get(`getTargetCategory:${functorId}`);
  }

  async getObjectMappings(functorId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getObjectMappings.push({ args: [functorId] });
    return this.mockResults.get(`getObjectMappings:${functorId}`) ?? [];
  }

  async getMorphismMappings(functorId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getMorphismMappings.push({ args: [functorId] });
    return this.mockResults.get(`getMorphismMappings:${functorId}`) ?? [];
  }

  async getSourceObjects(functorId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getSourceObjects.push({ args: [functorId] });
    return this.mockResults.get(`getSourceObjects:${functorId}`) ?? [];
  }

  async getTargetObjects(functorId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getTargetObjects.push({ args: [functorId] });
    return this.mockResults.get(`getTargetObjects:${functorId}`) ?? [];
  }

  async getTargetObjectForSource(functorId: SignatureId, sourceObjectId: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.getTargetObjectForSource.push({ args: [functorId, sourceObjectId] });
    return this.mockSingleResults.get(`getTargetObjectForSource:${functorId}:${sourceObjectId}`);
  }

  async getSourceObjectsForTarget(functorId: SignatureId, targetObjectId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getSourceObjectsForTarget.push({ args: [functorId, targetObjectId] });
    return this.mockResults.get(`getSourceObjectsForTarget:${functorId}:${targetObjectId}`) ?? [];
  }

  async getSourceMorphisms(functorId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getSourceMorphisms.push({ args: [functorId] });
    return this.mockResults.get(`getSourceMorphisms:${functorId}`) ?? [];
  }

  async getTargetMorphisms(functorId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getTargetMorphisms.push({ args: [functorId] });
    return this.mockResults.get(`getTargetMorphisms:${functorId}`) ?? [];
  }

  async getTargetMorphismForSource(functorId: SignatureId, sourceMorphismId: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.getTargetMorphismForSource.push({ args: [functorId, sourceMorphismId] });
    return this.mockSingleResults.get(`getTargetMorphismForSource:${functorId}:${sourceMorphismId}`);
  }

  async getSourceMorphismsForTarget(functorId: SignatureId, targetMorphismId: SignatureId): Promise<StoredCTC[]> {
    this.calls.getSourceMorphismsForTarget.push({ args: [functorId, targetMorphismId] });
    return this.mockResults.get(`getSourceMorphismsForTarget:${functorId}:${targetMorphismId}`) ?? [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Generic queries
  // ─────────────────────────────────────────────────────────────────────────────

  async get(id: SignatureId): Promise<StoredCTC | undefined> {
    this.calls.get.push({ args: [id] });
    return this.mockSingleResults.get(`get:${id}`);
  }
}

