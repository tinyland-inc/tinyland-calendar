import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CalendarService } from '../src/CalendarService.js';
import { configureCalendar, resetCalendarConfig } from '../src/config.js';


vi.mock('../src/collections.js', () => {
  const collections = new Map<string, any>();
  return {
    collectionsStore: {
      upsert: vi.fn(async (config: any) => {
        const now = new Date().toISOString();
        collections.set(config.name, {
          id: Date.now(),
          ...config,
          icon: config.icon || 'calendar',
          sync_enabled: true,
          created_at: now,
          updated_at: now,
        });
      }),
      getAll: vi.fn(async () => {
        return Array.from(collections.values()).map((c: any) => ({
          ...c,
          created_at: new Date(c.created_at),
          updated_at: new Date(c.updated_at),
        }));
      }),
      get: vi.fn(async (name: string) => {
        const c = collections.get(name);
        if (!c) return null;
        return { ...c, created_at: new Date(c.created_at), updated_at: new Date(c.updated_at) };
      }),
      update: vi.fn(),
      delete: vi.fn(async (name: string) => {
        collections.delete(name);
      }),
    },
    CalendarCollectionsStore: vi.fn(),
  };
});


const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    resetCalendarConfig();
    service = new CalendarService();

    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCollection', () => {
    it('should send MKCOL request to CalDAV server', async () => {
      configureCalendar({ calDavUrl: 'http://test-xandikos:8081' });

      await service.createCollection({
        name: 'test-collection',
        displayName: 'Test Collection',
        description: 'A test',
        color: '#FF0000',
        isPublic: true,
      });

      
      const mkcolCall = mockFetch.mock.calls.find(
        (call) => call[1]?.method === 'MKCOL'
      );
      expect(mkcolCall).toBeDefined();
      expect(mkcolCall![0]).toContain('test-collection');
    });

    it('should send PROPPATCH after MKCOL', async () => {
      configureCalendar({ calDavUrl: 'http://test-xandikos:8081' });

      await service.createCollection({
        name: 'test-collection',
        displayName: 'Test Collection',
        description: 'A test',
        color: '#FF0000',
        isPublic: true,
      });

      const proppatchCall = mockFetch.mock.calls.find(
        (call) => call[1]?.method === 'PROPPATCH'
      );
      expect(proppatchCall).toBeDefined();
      expect(proppatchCall![1].body).toContain('Test Collection');
      expect(proppatchCall![1].body).toContain('#FF0000');
    });
  });

  describe('deleteCollection', () => {
    it('should reject deletion of default collections', async () => {
      const defaultNames = ['events', 'workshops', 'meetings', 'pride', 'private'];

      for (const name of defaultNames) {
        await expect(service.deleteCollection(name)).rejects.toThrow(
          `Cannot delete default collection '${name}'`
        );
      }
    });

    it('should send DELETE request for non-default collection', async () => {
      configureCalendar({ calDavUrl: 'http://test-xandikos:8081' });

      
      try {
        await service.deleteCollection('custom-collection');
      } catch {
        
      }

      const deleteCall = mockFetch.mock.calls.find(
        (call) => call[1]?.method === 'DELETE'
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![0]).toContain('custom-collection');
    });
  });

  describe('syncAllEvents', () => {
    it('should return sync result with zero events when no loader configured', async () => {
      const result = await service.syncAllEvents();

      expect(result.success).toBe(true);
      expect(result.summary.totalEvents).toBe(0);
      expect(result.summary.totalSynced).toBe(0);
    });

    it('should return event count from configured loader', async () => {
      const mockEvents = [
        { slug: 'event-1', content: 'Content', frontmatter: { title: 'E1' } },
        { slug: 'event-2', content: 'Content', frontmatter: { title: 'E2' } },
        { slug: 'event-3', content: 'Content', frontmatter: { title: 'E3' } },
      ];

      configureCalendar({ loadEvents: async () => mockEvents });

      const result = await service.syncAllEvents();
      expect(result.summary.totalEvents).toBe(3);
    });

    it('should handle loader errors gracefully', async () => {
      configureCalendar({
        loadEvents: async () => {
          throw new Error('Loader failed');
        },
      });

      const result = await service.syncAllEvents();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Loader failed');
    });

    it('should include duration in result', async () => {
      const result = await service.syncAllEvents();
      expect(result.summary.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCollections', () => {
    it('should return array of collections', async () => {
      const collections = await service.getCollections();
      expect(Array.isArray(collections)).toBe(true);
    });
  });
});
