








import type { CalendarEvent, EventFilters, EventInstance } from '../types.js';






export interface DatabaseLike {
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}




export class CalendarDatabase {
  private db: DatabaseLike;

  constructor(db: DatabaseLike) {
    this.db = db;
  }

  
  
  

  


  async createEvent(
    event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CalendarEvent> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const stmt = this.db.prepare(`
      INSERT INTO calendar_events (
        id, uid, slug, title, description, location,
        dtstart, dtend, timezone,
        event_type, organizer, contact_email, contact_phone,
        registration_url, max_attendees, registration_required,
        is_recurring, rrule, recurring_pattern, exdates,
        status, published, featured,
        sync_to_calendar, caldav_etag, caldav_url,
        tags, categories, reminder_minutes,
        created_at, updated_at, markdown_path
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
      )
    `);

    stmt.run(
      id,
      event.uid,
      event.slug,
      event.title,
      event.description || null,
      event.location || null,
      event.dtstart,
      event.dtend || null,
      event.timezone,
      event.eventType,
      event.organizer || null,
      event.contactEmail || null,
      event.contactPhone || null,
      event.registrationUrl || null,
      event.maxAttendees || null,
      event.registrationRequired ? 1 : 0,
      event.isRecurring ? 1 : 0,
      event.rrule || null,
      event.recurringPattern || null,
      event.exdates ? JSON.stringify(event.exdates) : null,
      event.status,
      event.published ? 1 : 0,
      event.featured ? 1 : 0,
      event.syncToCalendar ? 1 : 0,
      event.caldavEtag || null,
      event.caldavUrl || null,
      JSON.stringify(event.tags),
      JSON.stringify(event.categories),
      event.reminderMinutes,
      now,
      now,
      event.markdownPath
    );

    return {
      ...event,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  


  async getEvent(id: string): Promise<CalendarEvent | null> {
    const stmt = this.db.prepare('SELECT * FROM calendar_events WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRowToEvent(row) : null;
  }

  


  async getEventByUid(uid: string): Promise<CalendarEvent | null> {
    const stmt = this.db.prepare('SELECT * FROM calendar_events WHERE uid = ?');
    const row = stmt.get(uid);
    return row ? this.mapRowToEvent(row) : null;
  }

  


  async getEventBySlug(slug: string): Promise<CalendarEvent | null> {
    const stmt = this.db.prepare('SELECT * FROM calendar_events WHERE slug = ?');
    const row = stmt.get(slug);
    return row ? this.mapRowToEvent(row) : null;
  }

  


  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const current = await this.getEvent(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const updated = { ...current, ...updates, updatedAt: now };

    const stmt = this.db.prepare(`
      UPDATE calendar_events SET
        title = ?, description = ?, location = ?,
        dtstart = ?, dtend = ?, timezone = ?,
        event_type = ?, organizer = ?,
        contact_email = ?, contact_phone = ?,
        registration_url = ?, max_attendees = ?, registration_required = ?,
        is_recurring = ?, rrule = ?, recurring_pattern = ?, exdates = ?,
        status = ?, published = ?, featured = ?,
        sync_to_calendar = ?, last_synced_at = ?, caldav_etag = ?, caldav_url = ?,
        tags = ?, categories = ?, reminder_minutes = ?,
        updated_at = ?, markdown_path = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.title,
      updated.description || null,
      updated.location || null,
      updated.dtstart,
      updated.dtend || null,
      updated.timezone,
      updated.eventType,
      updated.organizer || null,
      updated.contactEmail || null,
      updated.contactPhone || null,
      updated.registrationUrl || null,
      updated.maxAttendees || null,
      updated.registrationRequired ? 1 : 0,
      updated.isRecurring ? 1 : 0,
      updated.rrule || null,
      updated.recurringPattern || null,
      updated.exdates ? JSON.stringify(updated.exdates) : null,
      updated.status,
      updated.published ? 1 : 0,
      updated.featured ? 1 : 0,
      updated.syncToCalendar ? 1 : 0,
      updated.lastSyncedAt || null,
      updated.caldavEtag || null,
      updated.caldavUrl || null,
      JSON.stringify(updated.tags),
      JSON.stringify(updated.categories),
      updated.reminderMinutes,
      now,
      updated.markdownPath,
      id
    );

    return updated;
  }

  


  async deleteEvent(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM calendar_events WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  


  async listEvents(filters: EventFilters = {}): Promise<CalendarEvent[]> {
    let query = 'SELECT * FROM calendar_events WHERE 1=1';
    const params: unknown[] = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.published !== undefined) {
      query += ' AND published = ?';
      params.push(filters.published ? 1 : 0);
    }

    if (filters.from) {
      query += ' AND dtstart >= ?';
      params.push(filters.from);
    }

    if (filters.to) {
      query += ' AND dtstart <= ?';
      params.push(filters.to);
    }

    if (filters.isRecurring !== undefined) {
      query += ' AND is_recurring = ?';
      params.push(filters.isRecurring ? 1 : 0);
    }

    if (filters.eventType) {
      query += ' AND event_type = ?';
      params.push(filters.eventType);
    }

    query += ' ORDER BY dtstart ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map((row) => this.mapRowToEvent(row));
  }

  


  async updateSyncStatus(id: string, etag: string, url?: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE calendar_events
      SET last_synced_at = ?, caldav_etag = ?, caldav_url = ?
      WHERE id = ?
    `);

    stmt.run(new Date().toISOString(), etag, url || null, id);
  }

  
  
  

  


  private mapRowToEvent(row: unknown): CalendarEvent {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      uid: r.uid as string,
      slug: r.slug as string,
      title: r.title as string,
      description: (r.description as string) || '',
      location: r.location as string | undefined,
      dtstart: r.dtstart as string,
      dtend: r.dtend as string | undefined,
      timezone: r.timezone as string,
      eventType: r.event_type as CalendarEvent['eventType'],
      organizer: r.organizer as string | undefined,
      contactEmail: r.contact_email as string | undefined,
      contactPhone: r.contact_phone as string | undefined,
      registrationUrl: r.registration_url as string | undefined,
      maxAttendees: r.max_attendees as number | null | undefined,
      registrationRequired: Boolean(r.registration_required),
      isRecurring: Boolean(r.is_recurring),
      rrule: r.rrule as string | undefined,
      recurringPattern: r.recurring_pattern as string | undefined,
      exdates: r.exdates ? JSON.parse(r.exdates as string) : [],
      status: r.status as CalendarEvent['status'],
      published: Boolean(r.published),
      featured: Boolean(r.featured),
      syncToCalendar: Boolean(r.sync_to_calendar),
      lastSyncedAt: r.last_synced_at as string | undefined,
      caldavEtag: r.caldav_etag as string | undefined,
      caldavUrl: r.caldav_url as string | undefined,
      tags: JSON.parse((r.tags as string) || '[]'),
      categories: JSON.parse((r.categories as string) || '[]'),
      reminderMinutes: r.reminder_minutes as number,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
      markdownPath: r.markdown_path as string,
    };
  }
}
