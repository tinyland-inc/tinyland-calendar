/**
 * Calendar package configuration via dependency injection.
 *
 * Consumers call `configureCalendar()` at startup to provide
 * logger, CalDAV credentials, event loader, and data directory.
 *
 * @example
 * ```ts
 * import { configureCalendar } from '@tummycrypt/tinyland-calendar';
 *
 * configureCalendar({
 *   logger: console,
 *   calDavUrl: 'http://localhost:8081',
 *   loadEvents: async () => loadEventsFromMDsveX(),
 * });
 * ```
 */

/**
 * Minimal logger interface accepted by the calendar package.
 */
export interface CalendarLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Event content shape expected by the calendar sync layer.
 * Matches the EventContent interface from the host application.
 */
export interface EventContentLike {
  slug: string;
  content: string;
  frontmatter: {
    title: string;
    startDate?: string;
    startDateTime?: string;
    date?: string;
    endDate?: string;
    endDateTime?: string;
    excerpt?: string;
    organizer?: string | { name?: string; email?: string };
    location?: string | { name?: string; address?: string };
    categories?: string[];
    registrationUrl?: string;
    calendarUid?: string;
    recurrence?: string;
    contactEmail?: string;
    [key: string]: unknown;
  };
}

/**
 * Configuration options for the calendar package.
 */
export interface CalendarConfig {
  /** Structured logger. Falls back to console if not provided. */
  logger?: CalendarLogger;
  /** CalDAV server URL (e.g. 'http://localhost:8081'). */
  calDavUrl?: string;
  /** CalDAV username for authentication. */
  calDavUsername?: string;
  /** CalDAV password for authentication. */
  calDavPassword?: string;
  /** Directory for flat-file data storage (collections, sync status). */
  dataDir?: string;
  /**
   * Callback to load events from the host application.
   * Replaces the `$lib/utils/eventLoader` import.
   */
  loadEvents?: () => Promise<EventContentLike[]>;
}

const defaultLogger: CalendarLogger = {
  info: (msg, meta) => console.log(`[calendar] ${msg}`, meta ?? ''),
  warn: (msg, meta) => console.warn(`[calendar] ${msg}`, meta ?? ''),
  error: (msg, meta) => console.error(`[calendar] ${msg}`, meta ?? ''),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[calendar:debug] ${msg}`, meta ?? '');
    }
  },
};

let config: CalendarConfig = {};

/**
 * Configure the calendar package. Call once at application startup.
 */
export function configureCalendar(c: CalendarConfig): void {
  config = { ...config, ...c };
}

/**
 * Retrieve current calendar configuration.
 */
export function getCalendarConfig(): CalendarConfig {
  return config;
}

/**
 * Reset configuration to defaults. Primarily useful in tests.
 */
export function resetCalendarConfig(): void {
  config = {};
}

/**
 * Get the configured logger, falling back to default console logger.
 */
export function getLogger(): CalendarLogger {
  return config.logger ?? defaultLogger;
}

/**
 * Get the configured event loader, or a no-op that returns an empty array.
 */
export function getLoadEvents(): () => Promise<EventContentLike[]> {
  return config.loadEvents ?? (async () => []);
}
