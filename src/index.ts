/**
 * @tummycrypt/tinyland-calendar
 *
 * Calendar system with CalDAV, iCal, RRULE, and timezone support.
 *
 * @example
 * ```ts
 * import {
 *   configureCalendar,
 *   CalendarService,
 *   RecurrenceEngine,
 *   EventTransformer,
 * } from '@tummycrypt/tinyland-calendar';
 *
 * configureCalendar({
 *   logger: myLogger,
 *   calDavUrl: 'http://localhost:8081',
 *   loadEvents: async () => loadEventsFromMDsveX(),
 * });
 *
 * const service = new CalendarService();
 * await service.initialize();
 * ```
 */

// Configuration
export {
  configureCalendar,
  getCalendarConfig,
  resetCalendarConfig,
  getLogger,
  getLoadEvents,
} from './config.js';
export type { CalendarConfig, CalendarLogger, EventContentLike } from './config.js';

// Core services
export { CalendarService, calendarService } from './CalendarService.js';
export { RecurrenceEngine, recurrenceEngine } from './RecurrenceEngine.js';
export { EventTransformer } from './EventTransformer.js';
export { RecurringEventManager } from './RecurringEventManager.js';
export { TimezoneHandler } from './TimezoneHandler.js';
export { RRuleGenerator } from './RRuleGenerator.js';

// Storage
export { CalendarCollectionsStore, collectionsStore } from './collections.js';
export { EventSyncStatusStore, syncStatusStore } from './sync-status.js';

// Database
export { CalendarDatabase } from './db/index.js';
export type { DatabaseLike } from './db/index.js';

// Feed generation
export { FeedGenerator } from './services/FeedGenerator.js';

// Auto sync
export {
  performSync,
  startAutoSync,
  stopAutoSync,
  getSyncStatus,
  triggerManualSync,
} from './AutoSync.js';

// Types - re-export everything
export type {
  // Core event types
  CalendarEvent,
  EventType,
  EventStatus,
  EventInstance,

  // Recurrence types
  RecurrenceFrequency,
  RecurringPattern,
  RecurringEventForm,
  DateRange,
  RRuleValidationResult,

  // Shared calendar types
  CollectionConfig,
  CalendarCollection,
  SyncResult,
  Conflict,
  ResolutionStrategy,
  WebhookEvent,
  RecurrencePattern,
  EventOccurrence,
  RecurrenceUpdate,
  Permissions,

  // CalDAV types
  CalDAVConfig,
  CalDAVResponse,
  CalendarProps,
  Calendar,
  CalDAVSyncResult,
  Change,
  SyncSummary,

  // iCalendar types
  VEvent,
  VEventDateTime,
  VEventOrganizer,
  VEventAttendee,
  VCalendar,
  VTimezone,
  VTimezoneComponent,

  // Timezone types
  TimezoneInfo,
  DSTTransition,

  // Feed types
  CalendarFeed,
  EventFilters,

  // Attendee types
  EventAttendee,
  AttendeeStatus,

  // Validation types
  ValidationResult,
  ValidationError,

  // Sync log types
  SyncDirection,
  SyncStatusType,
  SyncLogEntry,

  // Conflict resolution
  ConflictStrategy,
  ConflictResolution,

  // Service response types
  ServiceResult,
  PaginationMeta,
  PaginatedResponse,

  // Event types (co-extracted)
  EventFrontmatter,
  EventContent,
  XandikosEvent,
  EventWithCalendar,
} from './types.js';
