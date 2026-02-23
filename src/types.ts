






















export interface CalendarEvent {
  
  id: string;
  uid: string;
  slug: string;

  
  title: string;
  description: string;
  location?: string;

  
  start?: string;
  dtstart: string;
  dtend?: string;
  timezone: string;

  
  eventType: EventType;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationUrl?: string;
  maxAttendees?: number | null;
  registrationRequired: boolean;

  
  isRecurring: boolean;
  rrule?: string;
  recurringPattern?: string;
  exdates?: string[];

  
  status: EventStatus;
  published: boolean;
  featured: boolean;

  
  syncToCalendar: boolean;
  lastSyncedAt?: string;
  caldavEtag?: string;
  caldavUrl?: string;

  
  tags: string[];
  categories: string[];

  
  createdAt: string;
  updatedAt: string;
  markdownPath: string;

  
  reminderMinutes: number;
}




export type EventType =
  | 'meeting'
  | 'workshop'
  | 'social'
  | 'support'
  | 'fundraiser'
  | 'celebration'
  | 'community'
  | 'other';




export type EventStatus = 'draft' | 'published' | 'cancelled';




export interface EventInstance extends CalendarEvent {
  baseEventId: string;
  recurrenceId: string;
  isCancelled: boolean;
  isModified: boolean;
}








export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';




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




export interface DateRange {
  start: Date;
  end: Date;
}




export interface RRuleValidationResult {
  valid: boolean;
  error?: string;
  humanReadable?: string;
}








export interface CollectionConfig {
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon?: string;
  isPublic: boolean;
}




export interface CalendarCollection extends CollectionConfig {
  id: number;
  sync_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}




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




export interface Conflict {
  id: string;
  eventSlug: string;
  xandikosUid: string;
  conflictType: 'update' | 'delete' | 'create';
  localData: unknown;
  remoteData: unknown;
  detectedAt: Date;
}




export interface ResolutionStrategy {
  type: 'local-first' | 'remote-first' | 'newest' | 'manual';
  resolver?: (conflict: Conflict) => Promise<unknown>;
}




export interface WebhookEvent {
  type: 'event.created' | 'event.updated' | 'event.deleted';
  source: 'mdsvex' | 'xandikos';
  data: unknown;
  timestamp: Date;
}




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




export interface EventOccurrence {
  date: Date;
  isException: boolean;
  exceptionData?: unknown;
  originalEvent: unknown;
}




export interface RecurrenceUpdate {
  scope: 'this' | 'future' | 'all';
  changes: Record<string, unknown>;
  reason?: string;
}




export interface Permissions {
  read: string[];
  write: string[];
  admin: string[];
}








export interface CalDAVConfig {
  serverUrl: string;
  username: string;
  password: string;
  calendarPath?: string;
}




export interface CalDAVResponse {
  success: boolean;
  etag?: string;
  url?: string;
  status?: number;
  error?: string;
}




export interface CalendarProps {
  displayName: string;
  description?: string;
  color?: string;
  timezone?: string;
  supportedComponents?: string[];
}




export interface Calendar {
  url: string;
  displayName: string;
  description?: string;
  ctag?: string;
  syncToken?: string;
  supportedComponents: string[];
}




export interface CalDAVSyncResult {
  success: boolean;
  etag?: string;
  syncToken?: string;
  changes?: Change[];
  error?: string;
  skipped?: boolean;
}




export interface Change {
  href: string;
  etag?: string;
  status: 'added' | 'modified' | 'deleted';
}




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




export interface VEventDateTime {
  value: string;
  tzid?: string;
}




export interface VEventOrganizer {
  name?: string;
  email: string;
}




export interface VEventAttendee {
  name?: string;
  email: string;
  partstat?: 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  role?: 'REQ-PARTICIPANT' | 'OPT-PARTICIPANT';
  rsvp?: boolean;
}




export interface VCalendar {
  prodid: string;
  version: '2.0';
  calscale?: 'GREGORIAN';
  method?: 'PUBLISH' | 'REQUEST' | 'REPLY' | 'CANCEL';
  events: VEvent[];
  timezones?: VTimezone[];
}




export interface VTimezone {
  tzid: string;
  standard?: VTimezoneComponent;
  daylight?: VTimezoneComponent;
}




export interface VTimezoneComponent {
  dtstart: string;
  rrule?: string;
  tzoffsetfrom: string;
  tzoffsetto: string;
  tzname: string;
}








export interface TimezoneInfo {
  identifier: string;
  offset: number;
  abbreviation: string;
  isDST: boolean;
}




export interface DSTTransition {
  date: Date;
  offsetBefore: number;
  offsetAfter: number;
}








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




export type AttendeeStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'tentative'
  | 'maybe';








export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}




export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}








export type SyncDirection = 'push' | 'pull' | 'bidirectional';




export type SyncStatusType = 'pending' | 'success' | 'failed' | 'conflict';




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








export type ConflictStrategy = 'local' | 'remote' | 'manual';




export interface ConflictResolution {
  strategy: ConflictStrategy;
  event: CalendarEvent;
  remoteEvent: CalendarEvent;
  resolution?: Partial<CalendarEvent>;
}








export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}




export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}




export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}









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




export interface EventWithCalendar extends EventContent {
  xandikosEvent: XandikosEvent;
}
