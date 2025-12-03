# CTKR - Category-Theoretic Knowledge Representation

A TypeScript library for representing, storing, and querying category-theoretic constructs.

## Overview

CTKR provides a modular system for working with category theory concepts across different storage backends. It's designed to be included as a dependency in other projects (e.g., Lattice).

## Installation

```bash
yarn add @ctkr/core
# or
npm install @ctkr/core
```

## Usage

```typescript
import { getClient } from '@ctkr/core';
import { InMemoryStore, SQLStore } from '@ctkr/core/stores';

// Create a client
const client = getClient();

// Attach stores
const localStore = client.attachStore(new InMemoryStore());
const prodStore = client.attachStore(new SQLStore({ connectionString: '...' }));

// Create constructs
const obj = client.createCTC('Object', localStore);
```

## Architecture

### Client

The `Client` is the main entry point. It manages connections to multiple stores and provides methods for creating and querying category-theoretic constructs.

### Stores

CTKR supports multiple storage backends:

- **InMemoryStore**: Fast, non-persistent storage for testing
- **OnDiskStore**: File-system based persistence
- **HTTPStore**: Connect to remote CTKR APIs
- **SQLStore**: SQL database storage for production

### Constructs

Category-theoretic constructs:

- **Object**: Basic elements of a category
- **Morphism**: Structure-preserving maps between objects
- **Category**: Collections of objects and morphisms
- **Functor**: Structure-preserving maps between categories

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Run tests
yarn test

# Watch mode
yarn dev
```

## License

MIT

