// QueryEngine - Extends MetaQuery with relational query capabilities
//
// The QueryEngine provides methods for querying constructs based on relationships,
// such as finding all morphisms from an object, or all objects in a category.

import type { Store, StoredCTC } from '../stores/Store.interface.js';
import type { SignatureId } from '../data-constructs/Signature.js';
import { 
  ObjectType, 
  MorphismType, 
  FunctorType, 
  ObjectMappingType, 
  MorphismMappingType,
  type CreateMorphismInput,
  type CreateObjectInput,
  type CreateFunctorInput,
  type CreateObjectMappingInput,
  type CreateMorphismMappingInput,
} from '../types/index.js';

/**
 * QueryEngine provides relational queries for category-theoretic constructs.
 */
export class QueryEngine {
  constructor(private readonly stores: Store[]) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Category queries
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get all objects in a category.
   */
  async getObjectsInCategory(categoryId: SignatureId): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    for (const store of this.stores) {
      const objects = await store.list(ObjectType);
      for (const obj of objects) {
        const data = obj.data as CreateObjectInput | null;
        if (data?.categoryId === categoryId) {
          results.push(obj);
        }
      }
    }
    return results;
  }

  /**
   * Get a specific object in a category by its signature ID.
   */
  async getObjectInCategory(categoryId: SignatureId, objectId: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores) {
      const obj = await store.read(objectId);
      if (obj && obj.type === ObjectType) {
        const data = obj.data as CreateObjectInput | null;
        if (data?.categoryId === categoryId) {
          return obj;
        }
      }
    }
    return undefined;
  }

  /**
   * Get all morphisms in a category.
   */
  async getMorphismsInCategory(categoryId: SignatureId): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    for (const store of this.stores) {
      const morphisms = await store.list(MorphismType);
      for (const mor of morphisms) {
        const data = mor.data as CreateMorphismInput | null;
        if (data?.categoryId === categoryId) {
          results.push(mor);
        }
      }
    }
    return results;
  }

  /**
   * Get a specific morphism in a category by its signature ID.
   */
  async getMorphismInCategory(categoryId: SignatureId, morphismId: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores) {
      const mor = await store.read(morphismId);
      if (mor && mor.type === MorphismType) {
        const data = mor.data as CreateMorphismInput | null;
        if (data?.categoryId === categoryId) {
          return mor;
        }
      }
    }
    return undefined;
  }

  /**
   * Get all functors from this category (as source).
   */
  async getFunctorsFromCategory(categoryId: SignatureId): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    for (const store of this.stores) {
      const functors = await store.list(FunctorType);
      for (const fun of functors) {
        const data = fun.data as CreateFunctorInput | null;
        if (data?.sourceCategoryId === categoryId) {
          results.push(fun);
        }
      }
    }
    return results;
  }

  /**
   * Get all functors to this category (as target).
   */
  async getFunctorsToCategory(categoryId: SignatureId): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    for (const store of this.stores) {
      const functors = await store.list(FunctorType);
      for (const fun of functors) {
        const data = fun.data as CreateFunctorInput | null;
        if (data?.targetCategoryId === categoryId) {
          results.push(fun);
        }
      }
    }
    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Object queries
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get all morphisms from this object (as source).
   */
  async getMorphismsFromObject(objectId: SignatureId): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    for (const store of this.stores) {
      const morphisms = await store.list(MorphismType);
      for (const mor of morphisms) {
        const data = mor.data as CreateMorphismInput | null;
        if (data?.sourceId === objectId) {
          results.push(mor);
        }
      }
    }
    return results;
  }

  /**
   * Get all morphisms to this object (as target).
   */
  async getMorphismsToObject(objectId: SignatureId): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    for (const store of this.stores) {
      const morphisms = await store.list(MorphismType);
      for (const mor of morphisms) {
        const data = mor.data as CreateMorphismInput | null;
        if (data?.targetId === objectId) {
          results.push(mor);
        }
      }
    }
    return results;
  }

  /**
   * Get the category an object belongs to.
   */
  async getCategoryOfObject(objectId: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores) {
      const obj = await store.read(objectId);
      if (obj && obj.type === ObjectType) {
        const data = obj.data as CreateObjectInput | null;
        if (data?.categoryId) {
          const category = await store.read(data.categoryId);
          if (category) return category;
        }
      }
    }
    // Try all stores for the category
    for (const store of this.stores) {
      const obj = await store.read(objectId);
      if (obj && obj.type === ObjectType) {
        const data = obj.data as CreateObjectInput | null;
        if (data?.categoryId) {
          for (const s of this.stores) {
            const category = await s.read(data.categoryId);
            if (category) return category;
          }
        }
      }
    }
    return undefined;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Morphism queries
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get the source object of a morphism.
   */
  async getSourceObject(morphismId: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores) {
      const mor = await store.read(morphismId);
      if (mor && mor.type === MorphismType) {
        const data = mor.data as CreateMorphismInput | null;
        if (data?.sourceId) {
          for (const s of this.stores) {
            const obj = await s.read(data.sourceId);
            if (obj) return obj;
          }
        }
      }
    }
    return undefined;
  }

  /**
   * Get the target object of a morphism.
   */
  async getTargetObject(morphismId: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores) {
      const mor = await store.read(morphismId);
      if (mor && mor.type === MorphismType) {
        const data = mor.data as CreateMorphismInput | null;
        if (data?.targetId) {
          for (const s of this.stores) {
            const obj = await s.read(data.targetId);
            if (obj) return obj;
          }
        }
      }
    }
    return undefined;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Functor queries
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get the source category of a functor.
   */
  async getSourceCategory(functorId: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores) {
      const fun = await store.read(functorId);
      if (fun && fun.type === FunctorType) {
        const data = fun.data as CreateFunctorInput | null;
        if (data?.sourceCategoryId) {
          for (const s of this.stores) {
            const cat = await s.read(data.sourceCategoryId);
            if (cat) return cat;
          }
        }
      }
    }
    return undefined;
  }

  /**
   * Get the target category of a functor.
   */
  async getTargetCategory(functorId: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores) {
      const fun = await store.read(functorId);
      if (fun && fun.type === FunctorType) {
        const data = fun.data as CreateFunctorInput | null;
        if (data?.targetCategoryId) {
          for (const s of this.stores) {
            const cat = await s.read(data.targetCategoryId);
            if (cat) return cat;
          }
        }
      }
    }
    return undefined;
  }

  /**
   * Get all object mappings for a functor.
   */
  async getObjectMappings(functorId: SignatureId): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    for (const store of this.stores) {
      const mappings = await store.list(ObjectMappingType);
      for (const mapping of mappings) {
        const data = mapping.data as CreateObjectMappingInput | null;
        if (data?.functorId === functorId) {
          results.push(mapping);
        }
      }
    }
    return results;
  }

  /**
   * Get all morphism mappings for a functor.
   */
  async getMorphismMappings(functorId: SignatureId): Promise<StoredCTC[]> {
    const results: StoredCTC[] = [];
    for (const store of this.stores) {
      const mappings = await store.list(MorphismMappingType);
      for (const mapping of mappings) {
        const data = mapping.data as CreateMorphismMappingInput | null;
        if (data?.functorId === functorId) {
          results.push(mapping);
        }
      }
    }
    return results;
  }

  /**
   * Get source objects of a functor (all objects that are mapped).
   */
  async getSourceObjects(functorId: SignatureId): Promise<StoredCTC[]> {
    const mappings = await this.getObjectMappings(functorId);
    const results: StoredCTC[] = [];
    
    for (const mapping of mappings) {
      const data = mapping.data as CreateObjectMappingInput;
      for (const store of this.stores) {
        const obj = await store.read(data.sourceObjectId);
        if (obj) {
          results.push(obj);
          break;
        }
      }
    }
    return results;
  }

  /**
   * Get target objects of a functor (all objects that are images).
   */
  async getTargetObjects(functorId: SignatureId): Promise<StoredCTC[]> {
    const mappings = await this.getObjectMappings(functorId);
    const results: StoredCTC[] = [];
    const seen = new Set<string>();
    
    for (const mapping of mappings) {
      const data = mapping.data as CreateObjectMappingInput;
      if (seen.has(data.targetObjectId)) continue;
      seen.add(data.targetObjectId);
      
      for (const store of this.stores) {
        const obj = await store.read(data.targetObjectId);
        if (obj) {
          results.push(obj);
          break;
        }
      }
    }
    return results;
  }

  /**
   * Get the target object for a source object under a functor (image).
   */
  async getTargetObjectForSource(functorId: SignatureId, sourceObjectId: SignatureId): Promise<StoredCTC | undefined> {
    const mappings = await this.getObjectMappings(functorId);
    
    for (const mapping of mappings) {
      const data = mapping.data as CreateObjectMappingInput;
      if (data.sourceObjectId === sourceObjectId) {
        for (const store of this.stores) {
          const obj = await store.read(data.targetObjectId);
          if (obj) return obj;
        }
      }
    }
    return undefined;
  }

  /**
   * Get all source objects that map to a target object under a functor (preimage).
   */
  async getSourceObjectsForTarget(functorId: SignatureId, targetObjectId: SignatureId): Promise<StoredCTC[]> {
    const mappings = await this.getObjectMappings(functorId);
    const results: StoredCTC[] = [];
    
    for (const mapping of mappings) {
      const data = mapping.data as CreateObjectMappingInput;
      if (data.targetObjectId === targetObjectId) {
        for (const store of this.stores) {
          const obj = await store.read(data.sourceObjectId);
          if (obj) {
            results.push(obj);
            break;
          }
        }
      }
    }
    return results;
  }

  /**
   * Get source morphisms of a functor (all morphisms that are mapped).
   */
  async getSourceMorphisms(functorId: SignatureId): Promise<StoredCTC[]> {
    const mappings = await this.getMorphismMappings(functorId);
    const results: StoredCTC[] = [];
    
    for (const mapping of mappings) {
      const data = mapping.data as CreateMorphismMappingInput;
      for (const store of this.stores) {
        const mor = await store.read(data.sourceMorphismId);
        if (mor) {
          results.push(mor);
          break;
        }
      }
    }
    return results;
  }

  /**
   * Get target morphisms of a functor (all morphisms that are images).
   */
  async getTargetMorphisms(functorId: SignatureId): Promise<StoredCTC[]> {
    const mappings = await this.getMorphismMappings(functorId);
    const results: StoredCTC[] = [];
    const seen = new Set<string>();
    
    for (const mapping of mappings) {
      const data = mapping.data as CreateMorphismMappingInput;
      if (seen.has(data.targetMorphismId)) continue;
      seen.add(data.targetMorphismId);
      
      for (const store of this.stores) {
        const mor = await store.read(data.targetMorphismId);
        if (mor) {
          results.push(mor);
          break;
        }
      }
    }
    return results;
  }

  /**
   * Get the target morphism for a source morphism under a functor (image).
   */
  async getTargetMorphismForSource(functorId: SignatureId, sourceMorphismId: SignatureId): Promise<StoredCTC | undefined> {
    const mappings = await this.getMorphismMappings(functorId);
    
    for (const mapping of mappings) {
      const data = mapping.data as CreateMorphismMappingInput;
      if (data.sourceMorphismId === sourceMorphismId) {
        for (const store of this.stores) {
          const mor = await store.read(data.targetMorphismId);
          if (mor) return mor;
        }
      }
    }
    return undefined;
  }

  /**
   * Get all source morphisms that map to a target morphism under a functor (preimage).
   */
  async getSourceMorphismsForTarget(functorId: SignatureId, targetMorphismId: SignatureId): Promise<StoredCTC[]> {
    const mappings = await this.getMorphismMappings(functorId);
    const results: StoredCTC[] = [];
    
    for (const mapping of mappings) {
      const data = mapping.data as CreateMorphismMappingInput;
      if (data.targetMorphismId === targetMorphismId) {
        for (const store of this.stores) {
          const mor = await store.read(data.sourceMorphismId);
          if (mor) {
            results.push(mor);
            break;
          }
        }
      }
    }
    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Generic queries
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get a construct by ID.
   */
  async get(id: SignatureId): Promise<StoredCTC | undefined> {
    for (const store of this.stores) {
      const result = await store.read(id);
      if (result) return result;
    }
    return undefined;
  }
}

