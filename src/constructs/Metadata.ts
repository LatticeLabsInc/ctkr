// Metadata - descriptive information for category-theoretic constructs
//
// Every CTC has Metadata that provides human-readable information
// and timestamps for auditing.

/**
 * Metadata provides descriptive information for a construct.
 * 
 * Every construct (Object, Morphism, Category, Functor) has Metadata
 * that provides naming, description, and timestamp information.
 */
export interface Metadata {
  /** Human-readable name for this construct */
  readonly name?: string;
  
  /** Optional description */
  readonly description?: string;
  
  /** Creation timestamp */
  readonly createdAt: Date;
  
  /** Last update timestamp */
  readonly updatedAt: Date;
}

/**
 * Create new Metadata for a construct.
 * @param options - Optional name and description
 */
export function createMetadata(options?: { name?: string; description?: string }): Metadata {
  const now = new Date();
  return {
    name: options?.name,
    description: options?.description,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update Metadata with new values and timestamp.
 * @param metadata - Existing metadata
 * @param updates - Fields to update
 */
export function updateMetadata(
  metadata: Metadata,
  updates: { name?: string; description?: string }
): Metadata {
  return {
    ...metadata,
    ...updates,
    updatedAt: new Date(),
  };
}

