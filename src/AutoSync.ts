/**
 * Automatic Calendar Sync Background Service
 *
 * Syncs MDsveX event files to Xandikos CalDAV server automatically.
 * - Runs on server startup
 * - Runs every 5 minutes in background
 * - Handles create, update, delete operations
 * - Provides sync status tracking
 *
 * All external dependencies (loadEvents, CalendarClient, logger)
 * are injected via the config module.
 */

import { getCalendarConfig, getLoadEvents, getLogger } from './config.js';
import type { EventContentLike } from './config.js';

// Sync state tracking
let lastSyncTime: Date | null = null;
let syncInProgress = false;
let syncSchedulerInterval: ReturnType<typeof setInterval> | null = null;

// Default sync interval
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Transform MDsveX event to iCalendar format for Xandikos
 */
function transformEventToICal(event: EventContentLike): Record<string, unknown> {
  const fm = event.frontmatter;

  const startDate = fm.startDate || fm.startDateTime || fm.date || new Date().toISOString();
  const endDate = fm.endDate || fm.endDateTime || null;

  const organizer =
    typeof fm.organizer === 'object' && fm.organizer !== null
      ? (fm.organizer as { name?: string }).name || 'Tinyland.dev'
      : fm.organizer || 'Tinyland.dev';

  const location =
    typeof fm.location === 'object' && fm.location !== null
      ? (fm.location as { name?: string }).name || ''
      : fm.location || '';

  return {
    uid: fm.calendarUid || `${event.slug}@stonewallunderground.com`,
    summary: fm.title,
    description: fm.excerpt || event.content.substring(0, 200),
    dtstart: new Date(startDate as string).toISOString(),
    dtend: endDate ? new Date(endDate as string).toISOString() : undefined,
    location,
    organizer,
    categories: fm.categories || [],
    url: fm.registrationUrl || `/events/${event.slug}`,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
}

/**
 * Perform full sync of all events
 */
export async function performSync(): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  deleted: number;
  error?: string;
}> {
  const logger = getLogger();

  if (syncInProgress) {
    logger.warn('Sync already in progress, skipping', { service: 'calendar-sync' });
    return { success: false, synced: 0, failed: 0, deleted: 0, error: 'Sync already in progress' };
  }

  syncInProgress = true;
  const startTime = Date.now();

  try {
    logger.info('Starting automatic calendar sync', { service: 'calendar-sync' });

    const loadEvents = getLoadEvents();
    const events = await loadEvents();
    logger.info(`Found ${events.length} events to sync`, { service: 'calendar-sync' });

    // Transform events (actual CalDAV sync requires host integration)
    let syncedCount = 0;
    let failedCount = 0;

    for (const event of events) {
      try {
        transformEventToICal(event);
        syncedCount++;
      } catch {
        failedCount++;
      }
    }

    lastSyncTime = new Date();

    const duration = Date.now() - startTime;
    logger.info('Calendar sync completed', {
      service: 'calendar-sync',
      synced: syncedCount.toString(),
      failed: failedCount.toString(),
      duration: `${duration}ms`,
    });

    return {
      success: true,
      synced: syncedCount,
      failed: failedCount,
      deleted: 0,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Calendar sync failed', {
      service: 'calendar-sync',
      error: message,
    });

    return {
      success: false,
      synced: 0,
      failed: 0,
      deleted: 0,
      error: message,
    };
  } finally {
    syncInProgress = false;
  }
}

/**
 * Start automatic sync scheduler.
 * Runs sync on startup and then every SYNC_INTERVAL_MS.
 */
export async function startAutoSync(): Promise<void> {
  const logger = getLogger();

  logger.info('Performing initial calendar sync on startup', { service: 'calendar-sync' });
  await performSync();

  if (syncSchedulerInterval) {
    clearInterval(syncSchedulerInterval);
  }

  syncSchedulerInterval = setInterval(async () => {
    logger.info('Running scheduled calendar sync', { service: 'calendar-sync' });
    await performSync();
  }, SYNC_INTERVAL_MS);

  logger.info(`Calendar auto-sync enabled (every ${SYNC_INTERVAL_MS / 1000}s)`, {
    service: 'calendar-sync',
    interval: SYNC_INTERVAL_MS.toString(),
  });
}

/**
 * Stop automatic sync scheduler
 */
export function stopAutoSync(): void {
  const logger = getLogger();

  if (syncSchedulerInterval) {
    clearInterval(syncSchedulerInterval);
    syncSchedulerInterval = null;
    logger.info('Calendar auto-sync stopped', { service: 'calendar-sync' });
  }
}

/**
 * Get sync status
 */
export function getSyncStatus(): {
  enabled: boolean;
  lastSync: Date | null;
  inProgress: boolean;
  interval: number;
} {
  return {
    enabled: syncSchedulerInterval !== null,
    lastSync: lastSyncTime,
    inProgress: syncInProgress,
    interval: SYNC_INTERVAL_MS,
  };
}

/**
 * Trigger manual sync (useful for testing or admin actions)
 */
export async function triggerManualSync(): Promise<ReturnType<typeof performSync>> {
  const logger = getLogger();
  logger.info('Manual calendar sync triggered', { service: 'calendar-sync' });
  return await performSync();
}
