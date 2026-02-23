







import type { CalendarEvent, EventFilters } from '../types.js';
import { EventTransformer } from '../EventTransformer.js';
import { CalendarDatabase } from '../db/index.js';

export class FeedGenerator {
  private transformer: EventTransformer;
  private db: CalendarDatabase;
  private cache: Map<string, { content: string; etag: string; timestamp: number }>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; 

  constructor(db: CalendarDatabase) {
    this.transformer = new EventTransformer();
    this.db = db;
    this.cache = new Map();
  }

  


  async generateFeed(filters: EventFilters = {}): Promise<string> {
    const cacheKey = this.buildCacheKey(filters);

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.content;
    }

    const events = await this.db.listEvents({
      ...filters,
      published: true,
      status: 'published',
    });

    const feedContent = this.transformer.toVCalendar(events);

    const etag = this.generateETag(feedContent);

    this.cache.set(cacheKey, {
      content: feedContent,
      etag,
      timestamp: Date.now(),
    });

    return feedContent;
  }

  


  async generateCategoryFeed(category: string): Promise<string> {
    return this.generateFeed({ category });
  }

  


  async generateTypeFeed(eventType: string): Promise<string> {
    return this.generateFeed({ eventType: eventType as CalendarEvent['eventType'] });
  }

  


  async generateUpcomingFeed(days = 90): Promise<string> {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    return this.generateFeed({ from, to });
  }

  


  invalidateCache(filters?: EventFilters): void {
    if (filters) {
      const cacheKey = this.buildCacheKey(filters);
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  


  getCachedETag(filters: EventFilters = {}): string | undefined {
    const cacheKey = this.buildCacheKey(filters);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.etag;
    }

    return undefined;
  }

  
  
  

  


  private buildCacheKey(filters: EventFilters): string {
    return JSON.stringify({
      category: filters.category,
      eventType: filters.eventType,
      tag: filters.tag,
      from: filters.from,
      to: filters.to,
    });
  }

  


  private generateETag(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `"${hash.toString(36)}"`;
  }
}
