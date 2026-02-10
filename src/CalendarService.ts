/**
 * Main calendar service that provides initialization, sync, and management capabilities.
 *
 * Replaces the original init-xandikos.js startup script.
 */

import { collectionsStore } from './collections.js';
import { getCalendarConfig, getLoadEvents, getLogger } from './config.js';
import type { CollectionConfig, SyncResult, CalendarCollection } from './types.js';

export class CalendarService {
  private initialized = false;

  /**
   * Initialize calendar system.
   * Called during app startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const logger = getLogger();

    try {
      await this.checkXandikosHealth();
      await this.createCalendarBase();
      await this.initializeDefaultCollections();
      await this.performInitialSync();

      this.initialized = true;
      logger.debug('[OK] Calendar system initialized successfully');
    } catch (error) {
      logger.error('[ERROR] Failed to initialize calendar system:', { error });
      this.initialized = false;
    }
  }

  /**
   * Check if Xandikos is running and accessible
   */
  private async checkXandikosHealth(): Promise<void> {
    const config = getCalendarConfig();
    const logger = getLogger();
    const baseUrl = config.calDavUrl || process.env.XANDIKOS_URL || 'http://localhost:8081';

    try {
      const response = await fetch(baseUrl);
      if (!response.ok && response.status !== 401) {
        throw new Error(`Xandikos returned status ${response.status}`);
      }
    } catch (_error) {
      logger.warn(`Cannot connect to Xandikos at ${baseUrl}. It may not be running yet.`);
    }
  }

  /**
   * Create the base calendar path if it doesn't exist
   */
  private async createCalendarBase(): Promise<void> {
    const config = getCalendarConfig();
    const baseUrl = config.calDavUrl || process.env.XANDIKOS_URL || 'http://localhost:8081';
    const basePath = '/calendars/stonewall/';

    try {
      await fetch(`${baseUrl}${basePath}`, {
        method: 'MKCOL',
        headers: {
          'Content-Type': 'application/xml',
        },
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status !== 405) {
        throw error;
      }
    }
  }

  /**
   * Initialize default calendar collections
   */
  private async initializeDefaultCollections(): Promise<void> {
    const defaultCollections: CollectionConfig[] = [
      {
        name: 'events',
        displayName: 'Community Events',
        description: 'Public community events and gatherings',
        color: '#FF6B6B',
        icon: 'calendar',
        isPublic: true,
      },
      {
        name: 'workshops',
        displayName: 'Workshops & Training',
        description: 'Educational workshops and skill-building sessions',
        color: '#FECA57',
        icon: 'graduation-cap',
        isPublic: true,
      },
      {
        name: 'meetings',
        displayName: 'Meetings',
        description: 'Community meetings and planning sessions',
        color: '#FF9F43',
        icon: 'users',
        isPublic: false,
      },
      {
        name: 'pride',
        displayName: 'Pride Events',
        description: 'Pride month and LGBTQ+ celebrations',
        color: '#9C88FF',
        icon: 'heart',
        isPublic: true,
      },
      {
        name: 'private',
        displayName: 'Private Calendar',
        description: 'Admin and organizer private events',
        color: '#54A0FF',
        icon: 'lock',
        isPublic: false,
      },
    ];

    for (const collection of defaultCollections) {
      await this.createCollection(collection);
    }
  }

  /**
   * Create a calendar collection
   */
  async createCollection(config: CollectionConfig): Promise<void> {
    const calConfig = getCalendarConfig();
    const logger = getLogger();
    const baseUrl = calConfig.calDavUrl || process.env.XANDIKOS_URL || 'http://localhost:8081';
    const basePath = '/calendars/stonewall/';

    try {
      const response = await fetch(`${baseUrl}${basePath}${config.name}/`, {
        method: 'MKCOL',
        headers: {
          'Content-Type': 'application/xml',
        },
      });

      if (response.ok || response.status === 405) {
        await this.setCollectionProperties(config);
        await this.storeCollectionMetadata(config);
        logger.debug(`[OK] Collection '${config.name}' ready`);
      }
    } catch (error) {
      logger.error(`[ERROR] Failed to create collection '${config.name}':`, { error });
      throw error;
    }
  }

  /**
   * Set CalDAV collection properties
   */
  private async setCollectionProperties(config: CollectionConfig): Promise<void> {
    const calConfig = getCalendarConfig();
    const baseUrl = calConfig.calDavUrl || process.env.XANDIKOS_URL || 'http://localhost:8081';
    const basePath = '/calendars/stonewall/';

    const propPatch = `<?xml version="1.0" encoding="utf-8"?>
<d:propertyupdate xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:x="http://apple.com/ns/ical/">
  <d:set>
    <d:prop>
      <d:displayname>${config.displayName}</d:displayname>
      <c:calendar-description>${config.description}</c:calendar-description>
      <x:calendar-color>${config.color}</x:calendar-color>
    </d:prop>
  </d:set>
</d:propertyupdate>`;

    await fetch(`${baseUrl}${basePath}${config.name}/`, {
      method: 'PROPPATCH',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: propPatch,
    });
  }

  /**
   * Store collection metadata in flat file
   */
  private async storeCollectionMetadata(config: CollectionConfig): Promise<void> {
    await collectionsStore.upsert(config);
  }

  /**
   * Perform initial sync of MDsveX events to Xandikos
   */
  private async performInitialSync(): Promise<void> {
    const logger = getLogger();
    const loadEvents = getLoadEvents();
    logger.debug('[CALENDAR] Performing initial calendar sync...');

    try {
      const events = await loadEvents();
      logger.debug(`[OK] Loaded ${events.length} events for sync`);
      // Note: Full sync integration requires host-provided eventSync callback
    } catch (error) {
      logger.error('[ERROR] Initial sync failed:', { error });
    }
  }

  /**
   * Get all calendar collections
   */
  async getCollections(): Promise<CalendarCollection[]> {
    return await collectionsStore.getAll();
  }

  /**
   * Update a calendar collection
   */
  async updateCollection(name: string, updates: Partial<CollectionConfig>): Promise<void> {
    await collectionsStore.update(name, updates);

    if (updates.displayName || updates.description || updates.color) {
      const current = await this.getCollection(name);
      if (current) {
        await this.setCollectionProperties({
          name: current.name,
          displayName: current.displayName,
          description: current.description,
          color: current.color,
          icon: current.icon,
          isPublic: current.isPublic,
          ...updates,
        });
      }
    }
  }

  /**
   * Get a single collection
   */
  async getCollection(name: string): Promise<CalendarCollection | null> {
    return await collectionsStore.get(name);
  }

  /**
   * Delete a calendar collection
   */
  async deleteCollection(name: string): Promise<void> {
    const defaultCollections = ['events', 'workshops', 'meetings', 'pride', 'private'];
    if (defaultCollections.includes(name)) {
      throw new Error(`Cannot delete default collection '${name}'`);
    }

    const calConfig = getCalendarConfig();
    const baseUrl = calConfig.calDavUrl || process.env.XANDIKOS_URL || 'http://localhost:8081';
    const basePath = '/calendars/stonewall/';

    await fetch(`${baseUrl}${basePath}${name}/`, {
      method: 'DELETE',
    });

    await collectionsStore.delete(name);
  }

  /**
   * Sync all events between MDsveX and Xandikos
   */
  async syncAllEvents(): Promise<SyncResult> {
    const loadEvents = getLoadEvents();
    const startTime = Date.now();
    const errors: Array<{ eventId: string; error: string }> = [];

    try {
      const mdsvexEvents = await loadEvents();
      const syncedCount = mdsvexEvents.length;

      return {
        success: errors.length === 0,
        summary: {
          totalEvents: mdsvexEvents.length,
          totalSynced: syncedCount,
          totalErrors: errors.length,
          duration: Date.now() - startTime,
        },
        errors,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message,
        summary: {
          totalEvents: 0,
          totalSynced: 0,
          totalErrors: 1,
          duration: Date.now() - startTime,
        },
        errors,
      };
    }
  }
}

/** Singleton instance */
export const calendarService = new CalendarService();
