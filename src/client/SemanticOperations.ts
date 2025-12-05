// SemanticOperations - Higher-level operations on category-theoretic constructs
//
// These operations compose multiple constructs into meaningful structures,
// such as extracting subcategories, computing limits/colimits, etc.

import type { Store, StoredCTC, CreateOptions } from '../stores/Store.interface.js';
import type { RichCategory, RichObject, RichMorphism, RichFunctor } from '../rich-constructs/index.js';

// Forward declaration to avoid circular dependency
// The actual Client type is passed in at runtime
interface ClientInterface {
  createCategory(
    store: Store,
    options?: CreateOptions & { properties?: Record<string, unknown> }
  ): Promise<RichCategory>;
  createObject(
    store: Store,
    category?: RichCategory | string,
    options?: CreateOptions & { properties?: Record<string, unknown> }
  ): Promise<RichObject>;
  createMorphism(
    source: RichObject | string,
    target: RichObject | string,
    store: Store,
    category?: RichCategory | string,
    options?: CreateOptions & { properties?: Record<string, unknown> }
  ): Promise<RichMorphism>;
  createFunctor(
    source: RichCategory | string,
    target: RichCategory | string,
    store: Store,
    options?: CreateOptions & { properties?: Record<string, unknown> }
  ): Promise<RichFunctor>;
  addObjectMapping(
    functor: RichFunctor | string,
    sourceObject: RichObject | string,
    targetObject: RichObject | string,
    store: Store
  ): Promise<StoredCTC>;
  addMorphismMapping(
    functor: RichFunctor | string,
    sourceMorphism: RichMorphism | string,
    targetMorphism: RichMorphism | string,
    store: Store
  ): Promise<StoredCTC>;
  getObject(id: string): Promise<RichObject | undefined>;
  getMorphism(id: string): Promise<RichMorphism | undefined>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for the extract operation.
 */
export interface ExtractOptions {
  /** Creation options for each object (in order) */
  objectOptions?: CreateOptions[];
  /** Creation options for each morphism (in order) */
  morphismOptions?: CreateOptions[];
  /** Creation options for the new category */
  categoryOptions?: CreateOptions;
  /** Creation options for the functor */
  functorOptions?: CreateOptions;
}

/**
 * Result of the extract operation.
 */
export interface ExtractResult {
  /** The newly created category */
  category: RichCategory;
  /** The functor mapping new category to source category */
  functor: RichFunctor;
  /** The newly created objects (parallel to input objects) */
  objects: RichObject[];
  /** The newly created morphisms (parallel to input morphisms) */
  morphisms: RichMorphism[];
  /** Object mappings (new object -> source object) */
  objectMappings: StoredCTC[];
  /** Morphism mappings (new morphism -> source morphism) */
  morphismMappings: StoredCTC[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SemanticOperations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Semantic operations that compose category-theoretic constructs
 * into meaningful higher-level structures.
 * 
 * Access via `client.semantic()`.
 */
export class SemanticOperations {
  constructor(private readonly client: ClientInterface) {}

  /**
   * Extract a subcategory from a set of objects and morphisms.
   * 
   * Creates a new category with parallel objects/morphisms, then creates
   * a functor that maps from the new category into the source category.
   * 
   * **Preconditions:**
   * - All objects must be in the same category
   * - All morphism endpoints must be in the objects list
   * - Objects list cannot be empty
   * 
   * @param objects - Objects to extract (must all be in the same category)
   * @param morphisms - Morphisms to extract (endpoints must be in objects)
   * @param categoryStore - Store to create the new category in
   * @param functorStore - Store to create the functor in
   * @param options - Optional creation options for each construct
   * @returns The created category, functor, objects, morphisms, and all mappings
   * 
   * @throws If objects list is empty
   * @throws If objects are in different categories
   * @throws If any object has no category
   * @throws If any morphism has an endpoint not in the objects list
   * 
   * @example
   * // Extract objects A, B, C and morphisms u, v into a new category
   * const { category, functor } = await client.semantic().extract(
   *   [objA, objB, objC],
   *   [morphismU, morphismV],
   *   store1,
   *   store1,
   *   {
   *     objectOptions: [{ name: "A'" }, { name: "B'" }, { name: "C'" }],
   *     morphismOptions: [{ name: "u'" }, { name: "v'" }],
   *     categoryOptions: { name: 'abstraction' },
   *     functorOptions: { name: 'abstraction-application' },
   *   }
   * );
   */
  async extract(
    objects: (RichObject | string)[],
    morphisms: (RichMorphism | string)[],
    categoryStore: Store,
    functorStore: Store,
    options?: ExtractOptions
  ): Promise<ExtractResult> {
    // 1. Resolve all objects and morphisms to RichObject/RichMorphism
    const resolvedObjects = await this.resolveObjects(objects);
    const resolvedMorphisms = await this.resolveMorphisms(morphisms);

    // 2. Validate: all objects in same category
    const sourceCategoryId = this.validateSameCategory(resolvedObjects);

    // 3. Validate: all morphism endpoints are in the objects list
    this.validateMorphismEndpoints(resolvedMorphisms, resolvedObjects);

    // 4. Create the new (extracted) category
    const newCategory = await this.client.createCategory(
      categoryStore,
      options?.categoryOptions
    );

    // 5. Create parallel objects in the new category
    const newObjects: RichObject[] = [];
    for (let i = 0; i < resolvedObjects.length; i++) {
      const obj = await this.client.createObject(
        categoryStore,
        newCategory,
        options?.objectOptions?.[i]
      );
      newObjects.push(obj);
    }

    // 6. Build object ID mapping (old -> new)
    const objectIdMap = new Map<string, RichObject>();
    for (let i = 0; i < resolvedObjects.length; i++) {
      objectIdMap.set(resolvedObjects[i].signature.id, newObjects[i]);
    }

    // 7. Create parallel morphisms in the new category
    const newMorphisms: RichMorphism[] = [];
    for (let i = 0; i < resolvedMorphisms.length; i++) {
      const oldMor = resolvedMorphisms[i];
      const sourceData = oldMor.morphismData;

      const newSource = objectIdMap.get(sourceData!.sourceId)!;
      const newTarget = objectIdMap.get(sourceData!.targetId)!;

      const mor = await this.client.createMorphism(
        newSource,
        newTarget,
        categoryStore,
        newCategory,
        options?.morphismOptions?.[i]
      );
      newMorphisms.push(mor);
    }

    // 8. Create the functor from new category to source category
    const functor = await this.client.createFunctor(
      newCategory,
      sourceCategoryId,
      functorStore,
      options?.functorOptions
    );

    // 9. Create object mappings (new -> old)
    const objectMappings: StoredCTC[] = [];
    for (let i = 0; i < resolvedObjects.length; i++) {
      const mapping = await this.client.addObjectMapping(
        functor,
        newObjects[i],
        resolvedObjects[i],
        functorStore
      );
      objectMappings.push(mapping);
    }

    // 10. Create morphism mappings (new -> old)
    const morphismMappings: StoredCTC[] = [];
    for (let i = 0; i < resolvedMorphisms.length; i++) {
      const mapping = await this.client.addMorphismMapping(
        functor,
        newMorphisms[i],
        resolvedMorphisms[i],
        functorStore
      );
      morphismMappings.push(mapping);
    }

    return {
      category: newCategory,
      functor,
      objects: newObjects,
      morphisms: newMorphisms,
      objectMappings,
      morphismMappings,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async resolveObjects(
    objects: (RichObject | string)[]
  ): Promise<RichObject[]> {
    const resolved: RichObject[] = [];
    for (const obj of objects) {
      if (typeof obj === 'string') {
        const rich = await this.client.getObject(obj);
        if (!rich) throw new Error(`Object not found: ${obj}`);
        resolved.push(rich);
      } else {
        resolved.push(obj);
      }
    }
    return resolved;
  }

  private async resolveMorphisms(
    morphisms: (RichMorphism | string)[]
  ): Promise<RichMorphism[]> {
    const resolved: RichMorphism[] = [];
    for (const mor of morphisms) {
      if (typeof mor === 'string') {
        const rich = await this.client.getMorphism(mor);
        if (!rich) throw new Error(`Morphism not found: ${mor}`);
        resolved.push(rich);
      } else {
        resolved.push(mor);
      }
    }
    return resolved;
  }

  private validateSameCategory(objects: RichObject[]): string {
    if (objects.length === 0) {
      throw new Error('Extract requires at least one object');
    }

    const categoryIds = objects.map(o => o.objectData?.categoryId);
    const uniqueIds = new Set(categoryIds.filter(Boolean));

    if (uniqueIds.size === 0) {
      throw new Error('All objects must belong to a category');
    }
    if (uniqueIds.size > 1) {
      throw new Error('All objects must be in the same category');
    }

    return [...uniqueIds][0]!;
  }

  private validateMorphismEndpoints(
    morphisms: RichMorphism[],
    objects: RichObject[]
  ): void {
    const objectIds = new Set(objects.map(o => o.signature.id));

    for (const mor of morphisms) {
      const data = mor.morphismData;
      if (!data) continue;

      if (!objectIds.has(data.sourceId)) {
        throw new Error(
          `Morphism ${mor.signature.id} has source not in objects list`
        );
      }
      if (!objectIds.has(data.targetId)) {
        throw new Error(
          `Morphism ${mor.signature.id} has target not in objects list`
        );
      }
    }
  }
}

