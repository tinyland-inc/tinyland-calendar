import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import path from 'path';
import { EventSyncStatusStore } from '../src/sync-status.js';
import { configureCalendar, resetCalendarConfig } from '../src/config.js';

const TEST_DATA_DIR = path.join(process.cwd(), 'test-data-sync-status');

describe('EventSyncStatusStore', () => {
  let store: EventSyncStatusStore;

  beforeEach(() => {
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
    mkdirSync(TEST_DATA_DIR, { recursive: true });

    resetCalendarConfig();
    configureCalendar({ dataDir: TEST_DATA_DIR });
    store = new EventSyncStatusStore();
  });

  afterEach(() => {
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  describe('updateStatus', () => {
    it('should store sync status', async () => {
      await store.updateStatus('event-1', 'synced');
      const statuses = await store.getStatus(['event-1']);
      expect(statuses['event-1']).toBeDefined();
      expect(statuses['event-1'].status).toBe('synced');
    });

    it('should store error status with message', async () => {
      await store.updateStatus('event-2', 'error', 'Connection failed');
      const statuses = await store.getStatus(['event-2']);
      expect(statuses['event-2'].status).toBe('error');
      expect(statuses['event-2'].error).toBe('Connection failed');
    });

    it('should update existing status', async () => {
      await store.updateStatus('event-1', 'error', 'First error');
      await store.updateStatus('event-1', 'synced');

      const statuses = await store.getStatus(['event-1']);
      expect(statuses['event-1'].status).toBe('synced');
    });

    it('should record sync timestamp', async () => {
      const before = new Date();
      await store.updateStatus('event-1', 'synced');
      const after = new Date();

      const statuses = await store.getStatus(['event-1']);
      const syncedAt = statuses['event-1'].syncedAt;
      expect(syncedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(syncedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getStatus', () => {
    it('should return empty object for unknown slugs', async () => {
      const statuses = await store.getStatus(['unknown-event']);
      expect(Object.keys(statuses)).toHaveLength(0);
    });

    it('should return statuses for multiple slugs', async () => {
      await store.updateStatus('event-1', 'synced');
      await store.updateStatus('event-2', 'error', 'Failed');
      await store.updateStatus('event-3', 'synced');

      const statuses = await store.getStatus(['event-1', 'event-2', 'event-3']);
      expect(Object.keys(statuses)).toHaveLength(3);
    });

    it('should only return requested slugs', async () => {
      await store.updateStatus('event-1', 'synced');
      await store.updateStatus('event-2', 'synced');

      const statuses = await store.getStatus(['event-1']);
      expect(Object.keys(statuses)).toHaveLength(1);
      expect(statuses['event-1']).toBeDefined();
      expect(statuses['event-2']).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return empty array initially', async () => {
      const all = await store.getAll();
      expect(all).toHaveLength(0);
    });

    it('should return all stored statuses', async () => {
      await store.updateStatus('event-1', 'synced');
      await store.updateStatus('event-2', 'error', 'Test error');

      const all = await store.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should remove all statuses', async () => {
      await store.updateStatus('event-1', 'synced');
      await store.updateStatus('event-2', 'synced');

      await store.clear();

      const all = await store.getAll();
      expect(all).toHaveLength(0);
    });
  });
});
