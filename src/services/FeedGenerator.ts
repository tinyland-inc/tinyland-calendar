/**
 * Feed Generator - Generate iCalendar feeds for public subscription
 *
 * Handles generation of .ics feeds with caching and validation.
 *
 * @version 1.0.0
 */

import type { CalendarEvent, EventFilters } from '../types.js';
import { EventTransformer } from '../EventTransformer.js';
import { CalendarDatabase } from '../db/index.js';

export class FeedGenerator {
  private transformer: EventTransformer;
  private db: CalendarDatabase;
  private cache: Map<string, { content: string; etag: string; timestamp: number }>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(db: CalendarDatabase) {
    this.transformer = new EventTransformer();
    this.db = db;
    this.cache = new Map();
  }

  /**
   * Generate calendar feed for published events
   */
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

  /**
   * Generate feed for a specific category
   */
  async generateCategoryFeed(category: string): Promise<string> {
    return this.generateFeed({ category });
  }

  /**
   * Generate feed for a specific event type
   */
  async generateTypeFeed(eventType: string): Promise<string> {
    return this.generateFeed({ eventType: eventType as CalendarEvent['eventType'] });
  }

  /**
   * Generate feed for upcoming events only
   */
  async generateUpcomingFeed(days = 90): Promise<string> {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    return this.generateFeed({ from, to });
  }

  /**
   * Invalidate feed cache
   */
  invalidateCache(filters?: EventFilters): void {
    if (filters) {
      const cacheKey = this.buildCacheKey(filters);
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cached ETag for conditional requests
   */
  getCachedETag(filters: EventFilters = {}): string | undefined {
    const cacheKey = this.buildCacheKey(filters);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.etag;
    }

    return undefined;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Build cache key from filters
   */
  private buildCacheKey(filters: EventFilters): string {
    return JSON.stringify({
      category: filters.category,
      eventType: filters.eventType,
      tag: filters.tag,
      from: filters.from,
      to: filters.to,
    });
  }

  /**
   * Generate ETag from content
   */
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
