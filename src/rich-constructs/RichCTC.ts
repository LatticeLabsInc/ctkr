// RichCTC - Base class for rich constructs

import type { StoredCTC } from '../stores/Store.interface.js';
import type { Signature } from '../data-constructs/Signature.js';
import type { Metadata } from '../data-constructs/Metadata.js';
import type { QueryEngine } from '../client/QueryEngine.js';
import type { CTCInput } from '../types/index.js';

/**
 * Base class for rich constructs.
 * 
 * Rich constructs wrap StoredCTC and provide convenient methods for
 * querying related constructs using the QueryEngine.
 */
export abstract class RichCTC {
  constructor(
    protected readonly stored: StoredCTC,
    protected readonly queryEngine: QueryEngine
  ) {}

  /** The signature of this construct */
  get signature(): Signature {
    return this.stored.signature;
  }

  /** The metadata of this construct */
  get metadata(): Metadata {
    return this.stored.metadata;
  }

  /** The underlying stored data */
  get data(): CTCInput {
    return this.stored.data;
  }

  /** The raw StoredCTC */
  get raw(): StoredCTC {
    return this.stored;
  }
}

