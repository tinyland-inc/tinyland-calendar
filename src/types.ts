/**
 * Calendar Integration Types
 *
 * TypeScript type definitions for calendar integration.
 * Based on RFC 5545 (iCalendar) and RFC 4791 (CalDAV) specifications.
 *
 * Consolidates types from:
 * - src/lib/server/calendar/types.ts (internal calendar types)
 * - src/lib/types/calendar.ts (shared calendar types)
 * - Relevant parts of src/lib/types/event.ts (event types used by calendar)
 *
 * @version 1.0.0
 * @see https://tools.ietf.org/html/rfc5545
 * @see https://tools.ietf.org/html/rfc4791
 */

// ============================================================================
// Core Calendar Event Types
// ============================================================================

/**
 * Calendar event stored in database with sync metadata
 */
export interface CalendarEvent {
  // Identifiers
  id: string;
  uid: string;
  slug: string;

  // Event details
  title: string;
  description: string;
  location?: string;

  // Date/Time (ISO 8601 UTC)
  start?: string;
  dtstart: string;
  dtend?: string;
  timezone: string;

  // Event type and organization
  eventType: EventType;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationUrl?: string;
  maxAttendees?: number | null;
  registrationRequired: boolean;

  // Recurrence
  isRecurring: boolean;
  rrule?: string;
  recurringPattern?: string;
  exdates?: string[];

  // Status and visibility
  status: EventStatus;
  published: boolean;
  featured: boolean;

  // Calendar sync
  syncToCalendar: boolean;
  lastSyncedAt?: string;
  caldavEtag?: string;
  caldavUrl?: string;

  // Tags and categorization
  tags: string[];
  categories: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  markdownPath: string;

  // Reminders
  reminderMinutes: number;
}

/**
 * Event types supported by the system
 */
export type EventType =
  | 'meeting'
  | 'workshop'
  | 'social'
  | 'support'
  | 'fundraiser'
  | 'celebration'
  | 'community'
  | 'other';

/**
 * Event publication status
 */
export type EventStatus = 'draft' | 'published' | 'cancelled';

/**
 * Specific instance of a recurring event (base + modifications)
 */
export interface EventInstance extends CalendarEvent {
  baseEventId: string;
  recurrenceId: string;
  isCancelled: boolean;
  isModified: boolean;
}

// ============================================================================
// Recurring Event Types
// ============================================================================

/**
 * Recurrence frequency
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Recurrence pattern for event creation (from internal types)
 */
export interface RecurringPattern {
  frequency: RecurrenceFrequency;
  interval?: number;
  count?: number;
  until?: string;
  byweekday?: string[];
  bymonthday?: number[];
  bymonth?: number[];
  bysetpos?: number;
}

/**
 * Recurring event form data
 */
export interface RecurringEventForm {
  frequency: RecurrenceFrequency;
  interval?: number;
  monthlyType?: 'bymonthday' | 'bysetpos';
  monthday?: number;
  position?: number;
  endType?: 'count' | 'until' | 'never';
  count?: number;
  until?: string;
  selectedDays?: string[];
}

/**
 * Date range for querying event instances
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * RRULE validation result
 */
export interface RRuleValidationResult {
  valid: boolean;
  error?: string;
  humanReadable?: string;
}

// ============================================================================
// Shared Calendar Types (from $lib/types/calendar.ts)
// ============================================================================

/**
 * Calendar collection configuration
 */
export interface CollectionConfig {
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon?: string;
  isPublic: boolean;
}

/**
 * Calendar collection with metadata
 */
export interface CalendarCollection extends CollectionConfig {
  id: number;
  sync_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Sync result from CalendarService
 */
export interface SyncResult {
  success: boolean;
  error?: string;
  summary: {
    totalEvents: number;
    totalSynced: number;
    totalErrors: number;
    duration: number;
  };
  errors: Array<{
    eventId: string;
    error: string;
  }>;
  mdsvex?: {
    total: number;
    synced: number;
    errors: Array<{ eventId: string; error: string }>;
  };
  database?: {
    total: number;
    synced: number;
    errors: Array<{ eventId: string; error: string }>;
  };
}

/**
 * Sync conflict
 */
export interface Conflict {
  id: string;
  eventSlug: string;
  xandikosUid: string;
  conflictType: 'update' | 'delete' | 'create';
  localData: unknown;
  remoteData: unknown;
  detectedAt: Date;
}

/**
 * Resolution strategy for sync conflicts
 */
export interface ResolutionStrategy {
  type: 'local-first' | 'remote-first' | 'newest' | 'manual';
  resolver?: (conflict: Conflict) => Promise<unknown>;
}

/**
 * Webhook event for calendar sync
 */
export interface WebhookEvent {
  type: 'event.created' | 'event.updated' | 'event.deleted';
  source: 'mdsvex' | 'xandikos';
  data: unknown;
  timestamp: Date;
}

/**
 * Recurrence pattern (from shared types)
 */
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: Date;
  byDay?: string[];
  byMonth?: number[];
  byMonthDay?: number[];
  bySetPos?: number;
}

/**
 * Event occurrence from recurrence expansion
 */
export interface EventOccurrence {
  date: Date;
  isException: boolean;
  exceptionData?: unknown;
  originalEvent: unknown;
}

/**
 * Recurrence update scope
 */
export interface RecurrenceUpdate {
  scope: 'this' | 'future' | 'all';
  changes: Record<string, unknown>;
  reason?: string;
}

/**
 * Calendar permissions
 */
export interface Permissions {
  read: string[];
  write: string[];
  admin: string[];
}

// ============================================================================
// CalDAV Types
// ============================================================================

/**
 * CalDAV client configuration
 */
export interface CalDAVConfig {
  serverUrl: string;
  username: string;
  password: string;
  calendarPath?: string;
}

/**
 * CalDAV operation response
 */
export interface CalDAVResponse {
  success: boolean;
  etag?: string;
  url?: string;
  status?: number;
  error?: string;
}

/**
 * CalDAV calendar properties
 */
export interface CalendarProps {
  displayName: string;
  description?: string;
  color?: string;
  timezone?: string;
  supportedComponents?: string[];
}

/**
 * CalDAV calendar
 */
export interface Calendar {
  url: string;
  displayName: string;
  description?: string;
  ctag?: string;
  syncToken?: string;
  supportedComponents: string[];
}

/**
 * CalDAV sync result
 */
export interface CalDAVSyncResult {
  success: boolean;
  etag?: string;
  syncToken?: string;
  changes?: Change[];
  error?: string;
  skipped?: boolean;
}

/**
 * CalDAV change entry
 */
export interface Change {
  href: string;
  etag?: string;
  status: 'added' | 'modified' | 'deleted';
}

/**
 * Sync summary for multiple events
 */
export interface SyncSummary {
  syncId: string;
  total: number;
  succeeded: number;
  failed: number;
  conflicts: number;
  results: CalDAVSyncResult[];
  duration: number;
  completedAt: string;
}

// ============================================================================
// iCalendar Types (VEVENT, VCALENDAR)
// ============================================================================

/**
 * iCalendar VEVENT component
 */
export interface VEvent {
  uid: string;
  summary: string;
  description: string;
  location?: string;
  dtstart: VEventDateTime;
  dtend?: VEventDateTime;
  dtstamp: string;
  organizer?: VEventOrganizer;
  attendees?: VEventAttendee[];
  rrule?: string;
  exdates?: string[];
  recurrenceId?: string;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  url?: string;
  categories?: string[];
  etag?: string;
}

/**
 * iCalendar datetime with timezone
 */
export interface VEventDateTime {
  value: string;
  tzid?: string;
}

/**
 * iCalendar organizer
 */
export interface VEventOrganizer {
  name?: string;
  email: string;
}

/**
 * iCalendar attendee
 */
export interface VEventAttendee {
  name?: string;
  email: string;
  partstat?: 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  role?: 'REQ-PARTICIPANT' | 'OPT-PARTICIPANT';
  rsvp?: boolean;
}

/**
 * Complete iCalendar file (VCALENDAR)
 */
export interface VCalendar {
  prodid: string;
  version: '2.0';
  calscale?: 'GREGORIAN';
  method?: 'PUBLISH' | 'REQUEST' | 'REPLY' | 'CANCEL';
  events: VEvent[];
  timezones?: VTimezone[];
}

/**
 * iCalendar VTIMEZONE component
 */
export interface VTimezone {
  tzid: string;
  standard?: VTimezoneComponent;
  daylight?: VTimezoneComponent;
}

/**
 * VTIMEZONE sub-component (STANDARD or DAYLIGHT)
 */
export interface VTimezoneComponent {
  dtstart: string;
  rrule?: string;
  tzoffsetfrom: string;
  tzoffsetto: string;
  tzname: string;
}

// ============================================================================
// Timezone Types
// ============================================================================

/**
 * Timezone information
 */
export interface TimezoneInfo {
  identifier: string;
  offset: number;
  abbreviation: string;
  isDST: boolean;
}

/**
 * DST transition
 */
export interface DSTTransition {
  date: Date;
  offsetBefore: number;
  offsetAfter: number;
}

// ============================================================================
// Calendar Feed Types
// ============================================================================

/**
 * Calendar subscription feed
 */
export interface CalendarFeed {
  id: string;
  slug: string;
  name: string;
  description?: string;
  filterTags?: string[];
  filterCategories?: string[];
  filterEventTypes?: EventType[];
  isPublic: boolean;
  requiresAuth: boolean;
  accessToken?: string;
  createdAt: string;
  updatedAt: string;
  lastGeneratedAt?: string;
  subscriberCount: number;
  url: string;
}

/**
 * Event filters for querying
 */
export interface EventFilters {
  status?: EventStatus;
  published?: boolean;
  from?: string;
  to?: string;
  tag?: string;
  category?: string;
  eventType?: EventType;
  isRecurring?: boolean;
  feedSlug?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Event Attendee Types
// ============================================================================

/**
 * Event attendee RSVP
 */
export interface EventAttendee {
  id: string;
  eventId: string;
  email: string;
  name?: string;
  phone?: string;
  status: AttendeeStatus;
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Attendee RSVP status
 */
export type AttendeeStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'tentative'
  | 'maybe';

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Generic validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================================================
// Sync Log Types
// ============================================================================

/**
 * Sync direction
 */
export type SyncDirection = 'push' | 'pull' | 'bidirectional';

/**
 * Sync status
 */
export type SyncStatusType = 'pending' | 'success' | 'failed' | 'conflict';

/**
 * Sync log entry
 */
export interface SyncLogEntry {
  id: string;
  syncId: string;
  eventId?: string;
  direction: SyncDirection;
  status: SyncStatusType;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  errorCode?: string;
  etagLocal?: string;
  etagRemote?: string;
}

// ============================================================================
// Conflict Resolution Types
// ============================================================================

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'local' | 'remote' | 'manual';

/**
 * Conflict resolution
 */
export interface ConflictResolution {
  strategy: ConflictStrategy;
  event: CalendarEvent;
  remoteEvent: CalendarEvent;
  resolution?: Partial<CalendarEvent>;
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Generic service operation result
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// Event Types (co-extracted from $lib/types/event.ts)
// ============================================================================

/**
 * Event frontmatter from MDsveX files.
 * Simplified version containing fields relevant to calendar operations.
 */
export interface EventFrontmatter {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  excerpt?: string;
  organizer?: { name?: string; email?: string } | string;
  organizerEmail?: string;
  calendarId?: string;
  category?: string;
  tags?: string[];
  image?: string;
  featuredImage?: string;
  registrationUrl?: string;
  maxAttendees?: number;
  registrationDeadline?: string;
  published?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  visibility?: string;
}

/**
 * Event content loaded from markdown files
 */
export interface EventContent {
  frontmatter: EventFrontmatter & {
    slug?: string;
    layout?: string;
    authorId?: string | null;
    startDate?: string;
    startDateTime?: string;
    endDate?: string;
    endDateTime?: string;
    featured?: boolean;
    categories?: string[];
    calendarUid?: string;
    contactEmail?: string;
    recurrence?: string;
  };
  content: string;
  slug: string;
  readingTime: number;
  wordCount: number;
}

/**
 * Xandikos calendar event format
 */
export interface XandikosEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend?: string;
  location?: string;
  organizer?: string;
  categories?: string[];
  url?: string;
  rrule?: string;
  created?: string;
  lastModified?: string;
}

/**
 * Event with calendar integration data
 */
export interface EventWithCalendar extends EventContent {
  xandikosEvent: XandikosEvent;
}
