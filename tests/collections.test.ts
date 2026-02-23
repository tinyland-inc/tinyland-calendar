import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { CalendarCollectionsStore } from '../src/collections.js';
import { configureCalendar, resetCalendarConfig } from '../src/config.js';

const TEST_DATA_DIR = path.join(process.cwd(), 'test-data-collections');







function seedDefaultCollections(): void {
  const now = new Date().toISOString();
  const defaults = [
    {
      id: 1,
      name: 'events',
      displayName: 'Community Events',
      description: 'Public community events and gatherings',
      color: '#FF6B6B',
      icon: 'calendar',
      isPublic: true,
      sync_enabled: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 2,
      name: 'workshops',
      displayName: 'Workshops & Training',
      description: 'Educational workshops and skill-building sessions',
      color: '#FECA57',
      icon: 'graduation-cap',
      isPublic: true,
      sync_enabled: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 3,
      name: 'meetings',
      displayName: 'Meetings',
      description: 'Community meetings and planning sessions',
      color: '#FF9F43',
      icon: 'users',
      isPublic: false,
      sync_enabled: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 4,
      name: 'pride',
      displayName: 'Pride Events',
      description: 'Pride month and LGBTQ+ celebrations',
      color: '#9C88FF',
      icon: 'heart',
      isPublic: true,
      sync_enabled: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 5,
      name: 'private',
      displayName: 'Private Calendar',
      description: 'Admin and organizer private events',
      color: '#54A0FF',
      icon: 'lock',
      isPublic: false,
      sync_enabled: true,
      created_at: now,
      updated_at: now,
    },
  ];
  writeFileSync(
    path.join(TEST_DATA_DIR, 'collections.json'),
    JSON.stringify(defaults, null, 2)
  );
}

describe('CalendarCollectionsStore', () => {
  let store: CalendarCollectionsStore;

  beforeEach(() => {
    
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
    mkdirSync(TEST_DATA_DIR, { recursive: true });
    seedDefaultCollections();

    resetCalendarConfig();
    configureCalendar({ dataDir: TEST_DATA_DIR });
    store = new CalendarCollectionsStore();
  });

  afterEach(() => {
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  describe('initialize', () => {
    it('should create default collections on first init', async () => {
      const all = await store.getAll();
      expect(all.length).toBe(5);
    });

    it('should include events collection', async () => {
      const events = await store.get('events');
      expect(events).not.toBeNull();
      expect(events!.displayName).toBe('Community Events');
    });

    it('should include workshops collection', async () => {
      const workshops = await store.get('workshops');
      expect(workshops).not.toBeNull();
    });

    it('should be idempotent', async () => {
      await store.getAll();
      await store.getAll();
      const all = await store.getAll();
      expect(all.length).toBe(5);
    });
  });

  describe('upsert', () => {
    it('should add a new collection', async () => {
      await store.upsert({
        name: 'custom',
        displayName: 'Custom Events',
        description: 'Custom calendar',
        color: '#00FF00',
        isPublic: true,
      });

      const custom = await store.get('custom');
      expect(custom).not.toBeNull();
      expect(custom!.displayName).toBe('Custom Events');
    });

    it('should update existing collection', async () => {
      await store.upsert({
        name: 'events',
        displayName: 'Updated Events',
        description: 'Updated description',
        color: '#000000',
        isPublic: false,
      });

      const events = await store.get('events');
      expect(events!.displayName).toBe('Updated Events');
    });
  });

  describe('update', () => {
    it('should update specific fields', async () => {
      await store.update('events', { displayName: 'New Name' });
      const events = await store.get('events');
      expect(events!.displayName).toBe('New Name');
    });

    it('should throw for non-existent collection', async () => {
      await expect(
        store.update('nonexistent', { displayName: 'Test' })
      ).rejects.toThrow("Collection 'nonexistent' not found");
    });
  });

  describe('delete', () => {
    it('should throw when deleting default collection', async () => {
      await expect(store.delete('events')).rejects.toThrow(
        "Cannot delete default collection 'events'"
      );
    });

    it('should delete custom collection', async () => {
      await store.upsert({
        name: 'custom',
        displayName: 'Custom',
        description: 'Custom',
        color: '#000',
        isPublic: true,
      });

      await store.delete('custom');
      const custom = await store.get('custom');
      expect(custom).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return sorted collections', async () => {
      const all = await store.getAll();
      const names = all.map((c) => c.displayName);

      
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });

    it('should return CalendarCollection with Date fields', async () => {
      const all = await store.getAll();
      expect(all[0].created_at).toBeInstanceOf(Date);
      expect(all[0].updated_at).toBeInstanceOf(Date);
    });
  });
});
