import { describe, it, expect } from 'vitest';
import { InMemoryStore } from '../InMemoryStore.js';

describe('InMemoryStore', () => {
  describe('constructor', () => {
    it('creates a store with a unique ID', () => {
      const store = new InMemoryStore();
      expect(store.id).toBeDefined();
      expect(typeof store.id).toBe('string');
    });

    it('uses provided ID if given', () => {
      const store = new InMemoryStore({ id: 'test-store' });
      expect(store.id).toBe('test-store');
    });
  });

  describe('connect/disconnect', () => {
    it.todo('connect initializes the store');
    it.todo('disconnect cleans up resources');
  });

  describe('CRUD operations', () => {
    it.todo('create stores a new construct');
    it.todo('read retrieves an existing construct');
    it.todo('read returns undefined for non-existent ID');
    it.todo('update modifies an existing construct');
    it.todo('update throws for non-existent ID');
    it.todo('delete removes a construct');
    it.todo('delete returns false for non-existent ID');
  });

  describe('list', () => {
    it.todo('returns all constructs of a given type');
    it.todo('returns empty array when no constructs of type exist');
  });

  describe('search', () => {
    it.todo('finds constructs matching query');
    it.todo('returns empty array for no matches');
  });
});

