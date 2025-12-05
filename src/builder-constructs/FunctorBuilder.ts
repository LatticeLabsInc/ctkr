// FunctorBuilder - Builder for creating Functor constructs with constraint enforcement

import type { Client } from '../client/Client.js';
import type { Store, StoredCTC } from '../stores/Store.interface.js';
import type { RichCategory, RichObject, RichMorphism, RichFunctor } from '../rich-constructs/index.js';
import type { 
  IFunctorBuilder, 
  ReadyResult, 
  AvailableObjectTarget, 
  AvailableMorphismTarget 
} from './types.js';
import type { CreateMorphismInput, CreateObjectInput } from '../types/index.js';

/**
 * Builder for creating Functor constructs with full constraint enforcement.
 * 
 * Key constraints enforced:
 * 1. When mapping a morphism f: A → B to g: X → Y, the builder automatically
 *    requires A → X and B → Y as object mappings.
 * 2. Identity morphisms are automatically mapped when objects are mapped.
 * 3. Available targets are filtered based on existing mappings.
 * 
 * Usage:
 * ```
 * const builder = new FunctorBuilder(client);
 * builder
 *   .inStore(store)
 *   .sourceCategory(C)
 *   .targetCategory(D)
 *   .mapMorphism(f, g)  // This derives object mappings
 *   .withName('F');
 * 
 * if (builder.isReady().ready) {
 *   const functor = await builder.build();
 * }
 * ```
 */
export class FunctorBuilder implements IFunctorBuilder {
  private _store: Store | null = null;
  private _sourceCategory: RichCategory | string | null = null;
  private _targetCategory: RichCategory | string | null = null;
  private _name: string | null = null;
  private _description: string | null = null;
  private _properties: Record<string, unknown> | null = null;

  // Manual object mappings (set by user directly via mapObject)
  private _manualObjectMappings: Map<string, string> = new Map();
  
  // Derived object mappings (inferred from morphism mappings)
  // Maps source object ID → { targetId, fromMorphismId }
  private _derivedObjectMappings: Map<string, { targetId: string; fromMorphismId: string }> = new Map();
  
  // Morphism mappings (non-identity)
  private _morphismMappings: Map<string, string> = new Map();
  
  // Cached category data for validation
  private _sourceCategoryData: {
    objects: StoredCTC[];
    morphisms: StoredCTC[];
  } | null = null;
  private _targetCategoryData: {
    objects: StoredCTC[];
    morphisms: StoredCTC[];
  } | null = null;

  constructor(private readonly client: Client) {}

  inStore(store: Store): this {
    this._store = store;
    return this;
  }

  sourceCategory(category: RichCategory | string): this {
    this._sourceCategory = category;
    // Clear cached data when category changes
    this._sourceCategoryData = null;
    this._manualObjectMappings.clear();
    this._derivedObjectMappings.clear();
    this._morphismMappings.clear();
    return this;
  }

  targetCategory(category: RichCategory | string): this {
    this._targetCategory = category;
    // Clear cached data when category changes
    this._targetCategoryData = null;
    this._manualObjectMappings.clear();
    this._derivedObjectMappings.clear();
    this._morphismMappings.clear();
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withDescription(description: string): this {
    this._description = description;
    return this;
  }

  withProperties(properties: Record<string, unknown>): this {
    this._properties = properties;
    return this;
  }

  private getCategoryId(category: RichCategory | string): string {
    return typeof category === 'string' ? category : category.signature.id;
  }

  private async ensureCategoryDataLoaded(): Promise<void> {
    if (!this._sourceCategory || !this._targetCategory) {
      throw new Error('Source and target categories must be set before querying');
    }

    if (!this._sourceCategoryData) {
      const sourceCatId = this.getCategoryId(this._sourceCategory);
      const objects = await this.client.query().getObjectsInCategory(sourceCatId);
      const morphisms = await this.client.query().getMorphismsInCategory(sourceCatId);
      this._sourceCategoryData = { objects, morphisms };
    }

    if (!this._targetCategoryData) {
      const targetCatId = this.getCategoryId(this._targetCategory);
      const objects = await this.client.query().getObjectsInCategory(targetCatId);
      const morphisms = await this.client.query().getMorphismsInCategory(targetCatId);
      this._targetCategoryData = { objects, morphisms };
    }
  }

  private getMorphismData(morphism: StoredCTC): CreateMorphismInput | null {
    return morphism.data as CreateMorphismInput | null;
  }

  private getObjectData(object: StoredCTC): CreateObjectInput | null {
    return object.data as CreateObjectInput | null;
  }

  /**
   * Map a source object to a target object.
   * This is a manual mapping that can be overridden by derived mappings from morphisms.
   */
  mapObject(source: RichObject | string, target: RichObject | string): this {
    const sourceId = typeof source === 'string' ? source : source.signature.id;
    const targetId = typeof target === 'string' ? target : target.signature.id;
    
    // Check if this conflicts with a derived mapping
    const derived = this._derivedObjectMappings.get(sourceId);
    if (derived && derived.targetId !== targetId) {
      throw new Error(
        `Cannot map object ${sourceId} to ${targetId}: ` +
        `morphism mapping already requires it to map to ${derived.targetId}`
      );
    }
    
    this._manualObjectMappings.set(sourceId, targetId);
    return this;
  }

  /**
   * Map a source morphism to a target morphism.
   * This also derives object mappings for the source/target objects of the morphisms.
   */
  mapMorphism(source: RichMorphism | string, target: RichMorphism | string): this {
    const sourceId = typeof source === 'string' ? source : source.signature.id;
    const targetId = typeof target === 'string' ? target : target.signature.id;
    
    this._morphismMappings.set(sourceId, targetId);
    
    // We'll derive object mappings lazily when needed, since we need async access to morphism data
    // For now, just mark that we need to recompute
    
    return this;
  }

  /**
   * Compute derived object mappings from morphism mappings.
   * Must be called after categories are loaded.
   */
  private async computeDerivedMappings(): Promise<{ conflicts: string[] }> {
    await this.ensureCategoryDataLoaded();
    const conflicts: string[] = [];
    
    this._derivedObjectMappings.clear();
    
    for (const [srcMorId, tgtMorId] of this._morphismMappings) {
      const srcMor = this._sourceCategoryData!.morphisms.find(m => m.signature.id === srcMorId);
      const tgtMor = this._targetCategoryData!.morphisms.find(m => m.signature.id === tgtMorId);
      
      if (!srcMor || !tgtMor) continue;
      
      const srcMorData = this.getMorphismData(srcMor);
      const tgtMorData = this.getMorphismData(tgtMor);
      
      if (!srcMorData || !tgtMorData) continue;
      
      // Derive: srcMor.source → tgtMor.source
      const existingSource = this._derivedObjectMappings.get(srcMorData.sourceId);
      if (existingSource && existingSource.targetId !== tgtMorData.sourceId) {
        conflicts.push(
          `Object ${srcMorData.sourceId} must map to both ${existingSource.targetId} ` +
          `(from morphism ${existingSource.fromMorphismId}) and ${tgtMorData.sourceId} ` +
          `(from morphism ${srcMorId})`
        );
      } else {
        this._derivedObjectMappings.set(srcMorData.sourceId, {
          targetId: tgtMorData.sourceId,
          fromMorphismId: srcMorId,
        });
      }
      
      // Derive: srcMor.target → tgtMor.target
      const existingTarget = this._derivedObjectMappings.get(srcMorData.targetId);
      if (existingTarget && existingTarget.targetId !== tgtMorData.targetId) {
        conflicts.push(
          `Object ${srcMorData.targetId} must map to both ${existingTarget.targetId} ` +
          `(from morphism ${existingTarget.fromMorphismId}) and ${tgtMorData.targetId} ` +
          `(from morphism ${srcMorId})`
        );
      } else {
        this._derivedObjectMappings.set(srcMorData.targetId, {
          targetId: tgtMorData.targetId,
          fromMorphismId: srcMorId,
        });
      }
    }
    
    // Check for conflicts between derived and manual mappings
    for (const [srcObjId, derived] of this._derivedObjectMappings) {
      const manual = this._manualObjectMappings.get(srcObjId);
      if (manual && manual !== derived.targetId) {
        conflicts.push(
          `Object ${srcObjId} is manually mapped to ${manual} but morphism mapping ` +
          `requires it to map to ${derived.targetId}`
        );
      }
    }
    
    return { conflicts };
  }

  /**
   * Get the effective object mapping for a source object.
   * Derived mappings take precedence over manual mappings.
   */
  private getEffectiveObjectMapping(sourceObjId: string): string | undefined {
    const derived = this._derivedObjectMappings.get(sourceObjId);
    if (derived) return derived.targetId;
    return this._manualObjectMappings.get(sourceObjId);
  }

  /**
   * List available target objects for a source object.
   * If there are derived constraints, only the required target is returned.
   * Otherwise, all target category objects are returned.
   */
  async listAvailableObjectTargets(source: RichObject | string): Promise<AvailableObjectTarget[]> {
    await this.ensureCategoryDataLoaded();
    await this.computeDerivedMappings();
    
    const sourceId = typeof source === 'string' ? source : source.signature.id;
    
    // Check if source is in source category
    const sourceObj = this._sourceCategoryData!.objects.find(o => o.signature.id === sourceId);
    if (!sourceObj) {
      throw new Error(`Object ${sourceId} is not in the source category`);
    }
    
    const results: AvailableObjectTarget[] = [];
    
    // Check for derived constraint
    const derived = this._derivedObjectMappings.get(sourceId);
    if (derived) {
      const targetObj = this._targetCategoryData!.objects.find(o => o.signature.id === derived.targetId);
      if (targetObj) {
        // Convert to RichObject
        const richTarget = await this.client.getObject(derived.targetId);
        if (richTarget) {
          results.push({
            object: richTarget,
            reason: `Required by morphism mapping`,
            required: true,
          });
        }
      }
      return results;
    }
    
    // No constraint - all target objects are available
    for (const targetObj of this._targetCategoryData!.objects) {
      const richTarget = await this.client.getObject(targetObj.signature.id);
      if (richTarget) {
        results.push({
          object: richTarget,
          reason: undefined,
          required: false,
        });
      }
    }
    
    return results;
  }

  /**
   * List available target morphisms for a source morphism.
   * Only morphisms whose source/target are compatible with existing object mappings are returned.
   */
  async listAvailableMorphismTargets(source: RichMorphism | string): Promise<AvailableMorphismTarget[]> {
    await this.ensureCategoryDataLoaded();
    await this.computeDerivedMappings();
    
    const sourceId = typeof source === 'string' ? source : source.signature.id;
    
    // Check if source is in source category
    const sourceMor = this._sourceCategoryData!.morphisms.find(m => m.signature.id === sourceId);
    if (!sourceMor) {
      throw new Error(`Morphism ${sourceId} is not in the source category`);
    }
    
    const srcMorData = this.getMorphismData(sourceMor);
    if (!srcMorData) {
      throw new Error(`Morphism ${sourceId} has no data`);
    }
    
    // Get the required target object mappings for this morphism's source and target
    const requiredSourceTarget = this.getEffectiveObjectMapping(srcMorData.sourceId);
    const requiredTargetTarget = this.getEffectiveObjectMapping(srcMorData.targetId);
    
    const results: AvailableMorphismTarget[] = [];
    
    for (const targetMor of this._targetCategoryData!.morphisms) {
      const tgtMorData = this.getMorphismData(targetMor);
      if (!tgtMorData) continue;
      
      // Skip identity morphisms - they are auto-mapped when objects are mapped
      if (tgtMorData.isIdentity) continue;
      
      // Check compatibility with object mappings
      if (requiredSourceTarget && tgtMorData.sourceId !== requiredSourceTarget) {
        continue; // Source object mapping doesn't match
      }
      if (requiredTargetTarget && tgtMorData.targetId !== requiredTargetTarget) {
        continue; // Target object mapping doesn't match
      }
      
      const richTarget = await this.client.getMorphism(targetMor.signature.id);
      if (richTarget) {
        let reason: string | undefined;
        if (requiredSourceTarget || requiredTargetTarget) {
          reason = 'Compatible with existing object mappings';
        }
        results.push({
          morphism: richTarget,
          reason,
        });
      }
    }
    
    return results;
  }

  getObjectMappings(): Map<string, string> {
    // Combine manual and derived, with derived taking precedence
    const result = new Map(this._manualObjectMappings);
    for (const [srcId, derived] of this._derivedObjectMappings) {
      result.set(srcId, derived.targetId);
    }
    return result;
  }

  getMorphismMappings(): Map<string, string> {
    return new Map(this._morphismMappings);
  }

  getDerivedObjectMappings(): Map<string, { targetId: string; fromMorphismId: string }> {
    return new Map(this._derivedObjectMappings);
  }

  isReady(): ReadyResult {
    const missing: string[] = [];
    
    if (!this._store) {
      missing.push('store: Call inStore(store) to set the store');
    }
    
    if (!this._sourceCategory) {
      missing.push('sourceCategory: Call sourceCategory(category) to set the source category');
    }
    
    if (!this._targetCategory) {
      missing.push('targetCategory: Call targetCategory(category) to set the target category');
    }
    
    return {
      ready: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate that the functor mappings are consistent.
   * Returns validation errors if any.
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const readyResult = this.isReady();
    if (!readyResult.ready) {
      return { valid: false, errors: readyResult.missing };
    }
    
    const { conflicts } = await this.computeDerivedMappings();
    if (conflicts.length > 0) {
      return { valid: false, errors: conflicts };
    }
    
    return { valid: true, errors: [] };
  }

  async build(): Promise<RichFunctor> {
    const validation = await this.validate();
    if (!validation.valid) {
      throw new Error(
        `Cannot build Functor: invalid configuration.\n${validation.errors.join('\n')}`
      );
    }

    const options: { name?: string; description?: string; properties?: Record<string, unknown> } = {};
    if (this._name) options.name = this._name;
    if (this._description) options.description = this._description;
    if (this._properties) options.properties = this._properties;

    // Create the functor (source, target, store, options)
    const functor = await this.client.createFunctor(
      this._sourceCategory!,
      this._targetCategory!,
      this._store!,
      options
    );

    // Add object mappings (combined manual + derived)
    const allObjectMappings = this.getObjectMappings();
    for (const [srcId, tgtId] of allObjectMappings) {
      await this.client.addObjectMapping(functor, srcId, tgtId, this._store!);
    }

    // Add morphism mappings (user-specified non-identity morphisms)
    for (const [srcId, tgtId] of this._morphismMappings) {
      await this.client.addMorphismMapping(functor, srcId, tgtId, this._store!);
    }

    // Add identity morphism mappings for all mapped objects
    await this.ensureCategoryDataLoaded();
    for (const [srcObjId, tgtObjId] of allObjectMappings) {
      // Find identity morphism for source object
      const srcObj = this._sourceCategoryData!.objects.find(o => o.signature.id === srcObjId);
      const srcObjData = srcObj ? this.getObjectData(srcObj) : null;
      const srcIdentityId = srcObjData?.identityMorphismId;
      
      // Find identity morphism for target object
      const tgtObj = this._targetCategoryData!.objects.find(o => o.signature.id === tgtObjId);
      const tgtObjData = tgtObj ? this.getObjectData(tgtObj) : null;
      const tgtIdentityId = tgtObjData?.identityMorphismId;
      
      if (srcIdentityId && tgtIdentityId) {
        await this.client.addMorphismMapping(functor, srcIdentityId, tgtIdentityId, this._store!);
      }
    }

    // Refresh functor to get updated mappings
    const refreshed = await this.client.getFunctor(functor.signature.id);
    return refreshed || functor;
  }
}

