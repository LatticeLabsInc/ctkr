import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Client, 
  RichCategory, 
  RichObject, 
  RichMorphism, 
  RichFunctor 
} from '../client/Client.js';
import { InMemoryStore } from '../stores/InMemoryStore.js';
import { 
  ObjectType, 
  MorphismType, 
  CategoryType, 
  FunctorType 
} from '../types/index.js';

/**
 * Helper to filter out identity morphisms from a list of morphisms.
 * Identity morphisms are auto-created when objects are created.
 */
function nonIdentityMorphisms(morphisms: RichMorphism[]): RichMorphism[] {
  return morphisms.filter(m => !m.morphismData?.isIdentity);
}

/**
 * Integration tests using InMemoryStore.
 * 
 * These tests exercise the full API including:
 * - Multiple stores
 * - Categories with objects and morphisms
 * - Functors between categories with object and morphism mappings
 * - Rich construct query methods
 * - MetaQuery for finding constructs
 */
describe('Integration (InMemoryStore)', () => {
  let client: Client;
  let store1: InMemoryStore;
  let store2: InMemoryStore;

  beforeEach(() => {
    client = new Client();
    store1 = new InMemoryStore({ id: 'store-1', name: 'Primary Store' });
    store2 = new InMemoryStore({ id: 'store-2', name: 'Secondary Store' });
    client.attachStore(store1);
    client.attachStore(store2);
  });

  describe('Single Category Operations', () => {
    let category: RichCategory;
    let objA: RichObject;
    let objB: RichObject;
    let objC: RichObject;
    let morF: RichMorphism;
    let morG: RichMorphism;
    let morH: RichMorphism;

    beforeEach(async () => {
      // Create a category with 3 objects and 3 morphisms:
      //   A --f--> B --g--> C
      //   A --------h-----> C (composition)
      
      category = await client.createCategory(store1, { name: 'TestCategory' });
      
      objA = await client.createObject(store1, category, { name: 'Object A' });
      objB = await client.createObject(store1, category, { name: 'Object B' });
      objC = await client.createObject(store1, category, { name: 'Object C' });
      
      morF = await client.createMorphism(objA, objB, store1, category, { name: 'f: A → B' });
      morG = await client.createMorphism(objB, objC, store1, category, { name: 'g: B → C' });
      morH = await client.createMorphism(objA, objC, store1, category, { name: 'h: A → C (composition)' });
    });

    describe('Category queries', () => {
      it('cat.getObjects() returns all objects in category', async () => {
        const objects = await category.getObjects();
        
        expect(objects).toHaveLength(3);
        expect(objects.map(o => o.metadata.name)).toEqual(
          expect.arrayContaining(['Object A', 'Object B', 'Object C'])
        );
      });

      it('cat.getObject(id) returns specific object', async () => {
        const obj = await category.getObject(objB.signature.id);
        
        expect(obj).toBeDefined();
        expect(obj?.signature.id).toBe(objB.signature.id);
        expect(obj?.metadata.name).toBe('Object B');
      });

      it('cat.getObject(id) returns undefined for non-existent object', async () => {
        const obj = await category.getObject('non-existent');
        expect(obj).toBeUndefined();
      });

      it('cat.getMorphisms() returns all morphisms in category', async () => {
        const morphisms = await category.getMorphisms();
        const userMorphisms = nonIdentityMorphisms(morphisms);
        
        // 3 user-created morphisms + 3 identity morphisms (one per object)
        expect(morphisms).toHaveLength(6);
        expect(userMorphisms).toHaveLength(3);
        expect(userMorphisms.map(m => m.metadata.name)).toEqual(
          expect.arrayContaining(['f: A → B', 'g: B → C', 'h: A → C (composition)'])
        );
      });

      it('cat.getMorphism(id) returns specific morphism', async () => {
        const mor = await category.getMorphism(morG.signature.id);
        
        expect(mor).toBeDefined();
        expect(mor?.signature.id).toBe(morG.signature.id);
        expect(mor?.metadata.name).toBe('g: B → C');
      });
    });

    describe('Object queries', () => {
      it('obj.getMorphismsFrom() returns outgoing morphisms', async () => {
        const morphisms = await objA.getMorphismsFrom();
        const userMorphisms = nonIdentityMorphisms(morphisms);
        
        // 2 user morphisms + 1 identity morphism
        expect(morphisms).toHaveLength(3);
        expect(userMorphisms).toHaveLength(2);
        expect(userMorphisms.map(m => m.metadata.name)).toEqual(
          expect.arrayContaining(['f: A → B', 'h: A → C (composition)'])
        );
      });

      it('obj.getMorphismsTo() returns incoming morphisms', async () => {
        const morphisms = await objC.getMorphismsTo();
        const userMorphisms = nonIdentityMorphisms(morphisms);
        
        // 2 user morphisms + 1 identity morphism
        expect(morphisms).toHaveLength(3);
        expect(userMorphisms).toHaveLength(2);
        expect(userMorphisms.map(m => m.metadata.name)).toEqual(
          expect.arrayContaining(['g: B → C', 'h: A → C (composition)'])
        );
      });

      it('obj.getCategory() returns the containing category', async () => {
        const cat = await objB.getCategory();
        
        expect(cat).toBeDefined();
        expect(cat?.signature.id).toBe(category.signature.id);
        expect(cat?.metadata.name).toBe('TestCategory');
      });
    });

    describe('Morphism queries', () => {
      it('mor.getSourceObject() returns source', async () => {
        const source = await morF.getSourceObject();
        
        expect(source).toBeDefined();
        expect(source?.signature.id).toBe(objA.signature.id);
        expect(source?.metadata.name).toBe('Object A');
      });

      it('mor.getTargetObject() returns target', async () => {
        const target = await morF.getTargetObject();
        
        expect(target).toBeDefined();
        expect(target?.signature.id).toBe(objB.signature.id);
        expect(target?.metadata.name).toBe('Object B');
      });

      it('morphism chain is traversable', async () => {
        // Start at A, follow f to B, then g to C
        const A = await morF.getSourceObject();
        expect(A?.metadata.name).toBe('Object A');
        
        const B = await morF.getTargetObject();
        expect(B?.metadata.name).toBe('Object B');
        
        // Get non-identity morphisms from B
        const fromB = await B!.getMorphismsFrom();
        const userFromB = nonIdentityMorphisms(fromB);
        expect(userFromB).toHaveLength(1);
        
        const C = await userFromB[0].getTargetObject();
        expect(C?.metadata.name).toBe('Object C');
      });
    });
  });

  describe('Functor Between Categories', () => {
    let catC: RichCategory;
    let catD: RichCategory;
    let functor: RichFunctor;
    
    // Category C: A --f--> B
    let cA: RichObject;
    let cB: RichObject;
    let cF: RichMorphism;
    
    // Category D: X --g--> Y
    let dX: RichObject;
    let dY: RichObject;
    let dG: RichMorphism;

    beforeEach(async () => {
      // Create source category C
      catC = await client.createCategory(store1, { name: 'Category C' });
      cA = await client.createObject(store1, catC, { name: 'A' });
      cB = await client.createObject(store1, catC, { name: 'B' });
      cF = await client.createMorphism(cA, cB, store1, catC, { name: 'f' });
      
      // Create target category D
      catD = await client.createCategory(store1, { name: 'Category D' });
      dX = await client.createObject(store1, catD, { name: 'X' });
      dY = await client.createObject(store1, catD, { name: 'Y' });
      dG = await client.createMorphism(dX, dY, store1, catD, { name: 'g' });
      
      // Create functor F: C → D
      functor = await client.createFunctor(catC, catD, store1, { name: 'F: C → D' });
      
      // Define mappings: A ↦ X, B ↦ Y, f ↦ g
      await client.addObjectMapping(functor, cA, dX, store1);
      await client.addObjectMapping(functor, cB, dY, store1);
      await client.addMorphismMapping(functor, cF, dG, store1);
    });

    describe('Functor queries', () => {
      it('fun.getSourceCategory() returns source category', async () => {
        const source = await functor.getSourceCategory();
        
        expect(source).toBeDefined();
        expect(source?.signature.id).toBe(catC.signature.id);
        expect(source?.metadata.name).toBe('Category C');
      });

      it('fun.getTargetCategory() returns target category', async () => {
        const target = await functor.getTargetCategory();
        
        expect(target).toBeDefined();
        expect(target?.signature.id).toBe(catD.signature.id);
        expect(target?.metadata.name).toBe('Category D');
      });

      it('fun.getSourceObjects() returns objects in source that are mapped', async () => {
        const objects = await functor.getSourceObjects();
        
        expect(objects).toHaveLength(2);
        expect(objects.map(o => o.metadata.name)).toEqual(
          expect.arrayContaining(['A', 'B'])
        );
      });

      it('fun.getTargetObjects() returns images in target category', async () => {
        const objects = await functor.getTargetObjects();
        
        expect(objects).toHaveLength(2);
        expect(objects.map(o => o.metadata.name)).toEqual(
          expect.arrayContaining(['X', 'Y'])
        );
      });

      it('fun.getTargetObject(sourceObj) calculates image of object', async () => {
        const image = await functor.getTargetObject(cA);
        
        expect(image).toBeDefined();
        expect(image?.signature.id).toBe(dX.signature.id);
        expect(image?.metadata.name).toBe('X');
      });

      it('fun.getTargetObject(id) works with string ID', async () => {
        const image = await functor.getTargetObject(cB.signature.id);
        
        expect(image).toBeDefined();
        expect(image?.metadata.name).toBe('Y');
      });

      it('fun.getSourceObjectsFor(targetObj) calculates preimage', async () => {
        const preimage = await functor.getSourceObjectsFor(dX);
        
        expect(preimage).toHaveLength(1);
        expect(preimage[0].signature.id).toBe(cA.signature.id);
      });

      it('fun.getSourceMorphisms() returns morphisms in source that are mapped', async () => {
        const morphisms = await functor.getSourceMorphisms();
        
        expect(morphisms).toHaveLength(1);
        expect(morphisms[0].metadata.name).toBe('f');
      });

      it('fun.getTargetMorphisms() returns images of morphisms', async () => {
        const morphisms = await functor.getTargetMorphisms();
        
        expect(morphisms).toHaveLength(1);
        expect(morphisms[0].metadata.name).toBe('g');
      });

      it('fun.getTargetMorphism(sourceMor) calculates image of morphism', async () => {
        const image = await functor.getTargetMorphism(cF);
        
        expect(image).toBeDefined();
        expect(image?.signature.id).toBe(dG.signature.id);
        expect(image?.metadata.name).toBe('g');
      });

      it('fun.getSourceMorphismsFor(targetMor) calculates preimage', async () => {
        const preimage = await functor.getSourceMorphismsFor(dG);
        
        expect(preimage).toHaveLength(1);
        expect(preimage[0].signature.id).toBe(cF.signature.id);
      });
    });

    describe('Category-Functor integration', () => {
      it('cat.getFunctorsFrom() returns outgoing functors', async () => {
        const functors = await catC.getFunctorsFrom();
        
        expect(functors).toHaveLength(1);
        expect(functors[0].metadata.name).toBe('F: C → D');
      });

      it('cat.getFunctorsTo() returns incoming functors', async () => {
        const functors = await catD.getFunctorsTo();
        
        expect(functors).toHaveLength(1);
        expect(functors[0].metadata.name).toBe('F: C → D');
      });
    });
  });

  describe('Multi-Store Operations', () => {
    it('creates constructs in different stores', async () => {
      const cat1 = await client.createCategory(store1, { name: 'Cat in Store 1' });
      const cat2 = await client.createCategory(store2, { name: 'Cat in Store 2' });
      
      expect(cat1.signature.storeId).toBe('store-1');
      expect(cat2.signature.storeId).toBe('store-2');
    });

    it('retrieves constructs across stores', async () => {
      const cat1 = await client.createCategory(store1, { name: 'Cat in Store 1' });
      const cat2 = await client.createCategory(store2, { name: 'Cat in Store 2' });
      
      const found1 = await client.getCategory(cat1.signature.id);
      const found2 = await client.getCategory(cat2.signature.id);
      
      expect(found1?.metadata.name).toBe('Cat in Store 1');
      expect(found2?.metadata.name).toBe('Cat in Store 2');
    });

    it('creates cross-store relationships', async () => {
      // Category in store1, objects in store2
      const cat = await client.createCategory(store1, { name: 'Cross-Store Category' });
      const objA = await client.createObject(store2, cat, { name: 'Object A' });
      const objB = await client.createObject(store2, cat, { name: 'Object B' });
      
      expect(cat.signature.storeId).toBe('store-1');
      expect(objA.signature.storeId).toBe('store-2');
      expect(objA.categoryId).toBe(cat.signature.id);
      
      // Query objects in category across stores
      const objects = await cat.getObjects();
      expect(objects).toHaveLength(2);
    });

    it('meta().find() searches across all stores', async () => {
      await client.createCategory(store1, { name: 'SharedName' });
      await client.createCategory(store2, { name: 'SharedName' });
      
      const results = await client.meta().find(CategoryType, 'SharedName');
      
      expect(results).toHaveLength(2);
      expect(results.map(r => r.signature.storeId)).toEqual(
        expect.arrayContaining(['store-1', 'store-2'])
      );
    });

    it('meta(store).find() searches only in specified store', async () => {
      await client.createCategory(store1, { name: 'SharedName' });
      await client.createCategory(store2, { name: 'SharedName' });
      
      const results = await client.meta(store1).find(CategoryType, 'SharedName');
      
      expect(results).toHaveLength(1);
      expect(results[0].signature.storeId).toBe('store-1');
    });
  });

  describe('Complex Workflow', () => {
    it('builds and queries a complex category structure', async () => {
      // Create a category representing a simple type system
      const types = await client.createCategory(store1, { 
        name: 'TypeCategory',
        description: 'Simple type system'
      });
      
      // Create primitive types
      const intType = await client.createObject(store1, types, { name: 'Int' });
      const stringType = await client.createObject(store1, types, { name: 'String' });
      const boolType = await client.createObject(store1, types, { name: 'Bool' });
      
      // Create function types (as morphisms representing coercions/conversions)
      const intToString = await client.createMorphism(
        intType, stringType, store1, types, 
        { name: 'toString', description: 'Convert Int to String' }
      );
      await client.createMorphism(
        boolType, stringType, store1, types,
        { name: 'boolToString' }
      );
      await client.createMorphism(
        intType, boolType, store1, types,
        { name: 'toBool', description: 'Zero is false, non-zero is true' }
      );
      
      // Query: What can Int convert to?
      const intConversions = await intType.getMorphismsFrom();
      const userIntConversions = nonIdentityMorphisms(intConversions);
      expect(userIntConversions).toHaveLength(2);
      expect(userIntConversions.map(m => m.metadata.name)).toEqual(
        expect.arrayContaining(['toString', 'toBool'])
      );
      
      // Query: What can convert to String?
      const toStringConversions = await stringType.getMorphismsTo();
      const userToString = nonIdentityMorphisms(toStringConversions);
      expect(userToString).toHaveLength(2);
      
      // Query: Find the toString morphism by name
      const found = await client.meta().find(MorphismType, 'toString', {
        categoryId: types.signature.id
      });
      expect(found).toHaveLength(1);
      expect(found[0].signature.id).toBe(intToString.signature.id);
      
      // Traverse: From Bool, what's reachable?
      const fromBool = await boolType.getMorphismsFrom();
      const userFromBool = nonIdentityMorphisms(fromBool);
      expect(userFromBool).toHaveLength(1);
      const target = await userFromBool[0].getTargetObject();
      expect(target?.metadata.name).toBe('String');
    });

    it('models and queries a module system with imports', async () => {
      // Module A with exports
      const moduleA = await client.createCategory(store1, { name: 'ModuleA' });
      const funcA1 = await client.createObject(store1, moduleA, { name: 'helper' });
      await client.createObject(store1, moduleA, { name: 'compute' });
      
      // Module B with its own functions
      const moduleB = await client.createCategory(store1, { name: 'ModuleB' });
      await client.createObject(store1, moduleB, { name: 'process' });
      
      // Import functor: B imports from A
      const importFunctor = await client.createFunctor(moduleA, moduleB, store1, { 
        name: 'import A into B' 
      });
      
      // Map A.helper to a local reference in B
      const helperRefInB = await client.createObject(store1, moduleB, { name: 'A.helper' });
      await client.addObjectMapping(importFunctor, funcA1, helperRefInB, store1);
      
      // Query: What does B import from A?
      const imports = await importFunctor.getSourceObjects();
      expect(imports).toHaveLength(1);
      expect(imports[0].metadata.name).toBe('helper');
      
      // Query: What's the local reference for helper in B?
      const localRef = await importFunctor.getTargetObject(funcA1);
      expect(localRef?.metadata.name).toBe('A.helper');
      
      // Query: What functors come into ModuleB?
      const incomingFunctors = await moduleB.getFunctorsTo();
      expect(incomingFunctors).toHaveLength(1);
      expect(incomingFunctors[0].metadata.name).toBe('import A into B');
    });
  });

  describe('Metadata and Search', () => {
    it('finds constructs by partial name match', async () => {
      await client.createCategory(store1, { name: 'UserService' });
      await client.createCategory(store1, { name: 'UserRepository' });
      await client.createCategory(store1, { name: 'OrderService' });
      
      const results = await client.meta().find(CategoryType, 'User', { exactMatch: false });
      
      expect(results).toHaveLength(2);
    });

    it('finds constructs by description', async () => {
      await client.createCategory(store1, { 
        name: 'Service', 
        description: 'Handles user authentication' 
      });
      await client.createCategory(store1, { 
        name: 'Controller', 
        description: 'HTTP endpoints' 
      });
      
      const results = await client.meta().find(CategoryType, 'authentication', { 
        exactMatch: false, 
        searchDescription: true 
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe('Service');
    });

    it('findAllRich returns rich constructs', async () => {
      const cat = await client.createCategory(store1, { name: 'TestCat' });
      await client.createObject(store1, cat, { name: 'Obj1' });
      await client.createObject(store1, cat, { name: 'Obj2' });
      
      const objects = await client.meta().findAllRich(ObjectType);
      
      expect(objects).toHaveLength(2);
      expect(objects[0]).toBeInstanceOf(RichObject);
      
      // Can query from rich objects
      const category = await (objects[0] as RichObject).getCategory();
      expect(category?.metadata.name).toBe('TestCat');
    });
  });

  describe('Version and Signature Tracking', () => {
    it('tracks versions across updates', async () => {
      const cat = await client.createCategory(store1, { name: 'Original' });
      expect(cat.signature.version).toBe(1);
      
      const stored = await store1.update(cat.signature.id, null, { name: 'Updated' });
      expect(stored.signature.version).toBe(2);
      
      const stored2 = await store1.update(cat.signature.id, null, { name: 'Updated Again' });
      expect(stored2.signature.version).toBe(3);
    });

    it('maintains store ID across operations', async () => {
      const cat = await client.createCategory(store1, { name: 'Test' });
      const obj = await client.createObject(store1, cat, { name: 'Obj' });
      
      expect(cat.signature.storeId).toBe('store-1');
      expect(obj.signature.storeId).toBe('store-1');
      
      // Retrieve and check
      const retrieved = await client.getObject(obj.signature.id);
      expect(retrieved?.signature.storeId).toBe('store-1');
    });
  });

  describe('InMemoryStore-specific: Disconnect clears data', () => {
    it('disconnect clears all constructs from store', async () => {
      const cat = await client.createCategory(store1, { name: 'Test' });
      await client.createObject(store1, cat, { name: 'Obj1' });
      await client.createObject(store1, cat, { name: 'Obj2' });
      
      // Verify data exists
      const beforeDisconnect = await client.meta(store1).findAll(ObjectType);
      expect(beforeDisconnect).toHaveLength(2);
      
      // Disconnect clears the store
      await store1.disconnect();
      
      // Verify data is cleared
      const afterDisconnect = await client.meta(store1).findAll(ObjectType);
      expect(afterDisconnect).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty categories', async () => {
      const cat = await client.createCategory(store1, { name: 'Empty' });
      
      const objects = await cat.getObjects();
      const morphisms = await cat.getMorphisms();
      
      expect(objects).toHaveLength(0);
      expect(morphisms).toHaveLength(0);
    });

    it('handles objects with no user-created morphisms', async () => {
      const cat = await client.createCategory(store1, { name: 'Cat' });
      const obj = await client.createObject(store1, cat, { name: 'Lonely' });
      
      const from = await obj.getMorphismsFrom();
      const to = await obj.getMorphismsTo();
      
      // Object has its identity morphism but no user-created morphisms
      expect(from).toHaveLength(1);
      expect(to).toHaveLength(1);
      expect(from[0].morphismData?.isIdentity).toBe(true);
      expect(nonIdentityMorphisms(from)).toHaveLength(0);
      expect(nonIdentityMorphisms(to)).toHaveLength(0);
    });

    it('handles objects without category', async () => {
      const obj = await client.createObject(store1, undefined, { name: 'Orphan' });
      
      expect(obj.categoryId).toBeUndefined();
      
      const cat = await obj.getCategory();
      expect(cat).toBeUndefined();
    });

    it('handles functor with no mappings', async () => {
      const catA = await client.createCategory(store1, { name: 'A' });
      const catB = await client.createCategory(store1, { name: 'B' });
      const fun = await client.createFunctor(catA, catB, store1, { name: 'Empty Functor' });
      
      const sourceObjs = await fun.getSourceObjects();
      const targetObjs = await fun.getTargetObjects();
      const sourceMors = await fun.getSourceMorphisms();
      const targetMors = await fun.getTargetMorphisms();
      
      expect(sourceObjs).toHaveLength(0);
      expect(targetObjs).toHaveLength(0);
      expect(sourceMors).toHaveLength(0);
      expect(targetMors).toHaveLength(0);
    });
  });
});

