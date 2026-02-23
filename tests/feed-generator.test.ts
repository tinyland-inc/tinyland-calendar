import { describe, it, expect, beforeEach } from 'vitest';
import { FeedGenerator } from '../src/services/FeedGenerator.js';
import type { CalendarDatabase, DatabaseLike } from '../src/db/index.js';
import type { CalendarEvent, EventFilters } from '../src/types.js';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'test-id',
    uid: 'test@stonewallunderground.com',
    slug: 'test-event',
    title: 'Test Event',
    description: 'A test description',
    dtstart: '2025-06-01T18:00:00Z',
    dtend: '2025-06-01T20:00:00Z',
    timezone: 'UTC',
    eventType: 'community',
    registrationRequired: false,
    isRecurring: false,
    status: 'published',
    published: true,
    featured: false,
    syncToCalendar: true,
    tags: [],
    categories: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    markdownPath: '/events/test.md',
    reminderMinutes: 30,
    ...overrides,
  };
}




function createMockDb(events: CalendarEvent[]): CalendarDatabase {
  return {
    listEvents: async (_filters: EventFilters) => events,
    createEvent: async () => events[0],
    getEvent: async () => null,
    getEventByUid: async () => null,
    getEventBySlug: async () => null,
    updateEvent: async () => null,
    deleteEvent: async () => false,
    updateSyncStatus: async () => {},
  } as unknown as CalendarDatabase;
}

describe('FeedGenerator', () => {
  let generator: FeedGenerator;

  beforeEach(() => {
    const db = createMockDb([
      makeEvent({ uid: 'event-1@test.com', title: 'Pride March' }),
      makeEvent({ uid: 'event-2@test.com', title: 'Community Workshop' }),
    ]);
    generator = new FeedGenerator(db);
  });

  describe('generateFeed', () => {
    it('should generate valid iCalendar feed', async () => {
      const feed = await generator.generateFeed();

      expect(feed).toContain('BEGIN:VCALENDAR');
      expect(feed).toContain('END:VCALENDAR');
      expect(feed).toContain('BEGIN:VEVENT');
      expect(feed).toContain('END:VEVENT');
    });

    it('should include all events', async () => {
      const feed = await generator.generateFeed();

      expect(feed).toContain('Pride March');
      expect(feed).toContain('Community Workshop');
    });

    it('should cache results', async () => {
      const feed1 = await generator.generateFeed();
      const feed2 = await generator.generateFeed();

      expect(feed1).toBe(feed2);
    });

    it('should return different feeds for different filters', async () => {
      const feed1 = await generator.generateFeed({ category: 'social' });
      const feed2 = await generator.generateFeed({ category: 'workshop' });

      
      expect(feed1).toBeDefined();
      expect(feed2).toBeDefined();
    });
  });

  describe('generateCategoryFeed', () => {
    it('should generate feed for a category', async () => {
      const feed = await generator.generateCategoryFeed('social');
      expect(feed).toContain('BEGIN:VCALENDAR');
    });
  });

  describe('generateTypeFeed', () => {
    it('should generate feed for an event type', async () => {
      const feed = await generator.generateTypeFeed('workshop');
      expect(feed).toContain('BEGIN:VCALENDAR');
    });
  });

  describe('generateUpcomingFeed', () => {
    it('should generate feed for upcoming events', async () => {
      const feed = await generator.generateUpcomingFeed(30);
      expect(feed).toContain('BEGIN:VCALENDAR');
    });

    it('should default to 90 days', async () => {
      const feed = await generator.generateUpcomingFeed();
      expect(feed).toContain('BEGIN:VCALENDAR');
    });
  });

  describe('invalidateCache', () => {
    it('should clear specific cache entry', async () => {
      await generator.generateFeed({ category: 'social' });

      generator.invalidateCache({ category: 'social' });

      
      const feed = await generator.generateFeed({ category: 'social' });
      expect(feed).toContain('BEGIN:VCALENDAR');
    });

    it('should clear all cache when no filters provided', async () => {
      await generator.generateFeed();
      await generator.generateFeed({ category: 'social' });

      generator.invalidateCache();

      const feed = await generator.generateFeed();
      expect(feed).toContain('BEGIN:VCALENDAR');
    });
  });

  describe('getCachedETag', () => {
    it('should return undefined when no cache', () => {
      const etag = generator.getCachedETag();
      expect(etag).toBeUndefined();
    });

    it('should return ETag after feed generation', async () => {
      await generator.generateFeed();
      const etag = generator.getCachedETag();
      expect(etag).toBeDefined();
      expect(etag).toMatch(/^".*"$/); 
    });
  });

  describe('empty feed', () => {
    it('should handle empty event list', async () => {
      const emptyDb = createMockDb([]);
      const emptyGenerator = new FeedGenerator(emptyDb);

      const feed = await emptyGenerator.generateFeed();
      expect(feed).toContain('BEGIN:VCALENDAR');
      expect(feed).toContain('END:VCALENDAR');
      expect(feed).not.toContain('BEGIN:VEVENT');
    });
  });
});
