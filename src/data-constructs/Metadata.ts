// Metadata - descriptive information for a construct

/**
 * Options for creating metadata.
 */
export interface MetadataOptions {
  name?: string;
  description?: string;
}

/**
 * Metadata for a stored construct.
 */
export interface Metadata {
  readonly name?: string;
  readonly description?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Create new metadata.
 */
export function createMetadata(options?: MetadataOptions): Metadata {
  const now = new Date();
  return {
    name: options?.name,
    description: options?.description,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update metadata (preserves createdAt, updates updatedAt).
 */
export function updateMetadata(current: Metadata, options?: MetadataOptions): Metadata {
  return {
    ...current,
    name: options?.name ?? current.name,
    description: options?.description ?? current.description,
    updatedAt: new Date(),
  };
}

