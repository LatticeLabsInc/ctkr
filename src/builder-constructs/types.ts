// Builder types and interfaces

import type { Store } from '../stores/Store.interface.js';
import type { RichCTC, RichCategory, RichObject, RichMorphism, RichFunctor } from '../rich-constructs/index.js';
import type { CreateOptions } from '../stores/Store.interface.js';

/**
 * Result of checking if a builder is ready to build.
 * If not ready, includes descriptive messages about what's missing.
 */
export interface ReadyResult {
  ready: boolean;
  missing: string[];
}

/**
 * Base interface for all builders.
 */
export interface Builder<T extends RichCTC> {
  /**
   * Check if the builder has all required fields set to create the construct.
   */
  isReady(): ReadyResult;
  
  /**
   * Build and create the construct via the client.
   * Throws if isReady() returns false.
   */
  build(): Promise<T>;
  
  /**
   * Set the store where the construct will be created.
   */
  inStore(store: Store): this;
  
  /**
   * Set the name for the construct.
   */
  withName(name: string): this;
  
  /**
   * Set the description for the construct.
   */
  withDescription(description: string): this;
}

/**
 * Extended builder interface for Category.
 */
export interface ICategoryBuilder extends Builder<RichCategory> {
  withProperties(properties: Record<string, unknown>): this;
}

/**
 * Extended builder interface for Object.
 */
export interface IObjectBuilder extends Builder<RichObject> {
  inCategory(category: RichCategory | string): this;
  withProperties(properties: Record<string, unknown>): this;
}

/**
 * Extended builder interface for Morphism.
 */
export interface IMorphismBuilder extends Builder<RichMorphism> {
  inCategory(category: RichCategory | string): this;
  fromObject(source: RichObject | string): this;
  toObject(target: RichObject | string): this;
  withProperties(properties: Record<string, unknown>): this;
}

/**
 * Information about an available object target for functor mapping.
 */
export interface AvailableObjectTarget {
  object: RichObject;
  /** Why this target is available (or why it's required) */
  reason?: string;
  /** True if this mapping is required (derived from morphism mappings) */
  required?: boolean;
}

/**
 * Information about an available morphism target for functor mapping.
 */
export interface AvailableMorphismTarget {
  morphism: RichMorphism;
  /** Why this target is available */
  reason?: string;
}

/**
 * Extended builder interface for Functor.
 */
export interface IFunctorBuilder extends Builder<RichFunctor> {
  sourceCategory(category: RichCategory | string): this;
  targetCategory(category: RichCategory | string): this;
  
  /**
   * Map a source object to a target object.
   */
  mapObject(source: RichObject | string, target: RichObject | string): this;
  
  /**
   * Map a source morphism to a target morphism.
   * This also constrains the object mappings for the source/target of the morphisms.
   */
  mapMorphism(source: RichMorphism | string, target: RichMorphism | string): this;
  
  /**
   * List available target objects for a source object.
   * Takes into account existing morphism mappings that constrain object mappings.
   */
  listAvailableObjectTargets(source: RichObject | string): Promise<AvailableObjectTarget[]>;
  
  /**
   * List available target morphisms for a source morphism.
   * Only morphisms compatible with existing object mappings are returned.
   */
  listAvailableMorphismTargets(source: RichMorphism | string): Promise<AvailableMorphismTarget[]>;
  
  /**
   * Get the current object mappings (source ID -> target ID).
   */
  getObjectMappings(): Map<string, string>;
  
  /**
   * Get the current morphism mappings (source ID -> target ID).
   */
  getMorphismMappings(): Map<string, string>;
  
  /**
   * Get which object mappings are derived (locked) from morphism mappings.
   */
  getDerivedObjectMappings(): Map<string, { targetId: string; fromMorphismId: string }>;
  
  withProperties(properties: Record<string, unknown>): this;
}

