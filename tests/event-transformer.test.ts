import { describe, it, expect } from 'vitest';
import { EventTransformer } from '../src/EventTransformer.js';
import type { CalendarEvent, VEvent } from '../src/types.js';

describe('EventTransformer', () => {
  const transformer = new EventTransformer();

  function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
    return {
      id: 'test-id',
      uid: 'test-uid@stonewallunderground.com',
      slug: 'test-event',
      title: 'Test Event',
      description: 'A test event description',
      location: '123 Main Street',
      dtstart: '2025-06-01T18:00:00Z',
      dtend: '2025-06-01T20:00:00Z',
      timezone: 'America/New_York',
      eventType: 'community',
      organizer: 'Test Organizer',
      contactEmail: 'test@example.com',
      registrationRequired: false,
      isRecurring: false,
      status: 'published',
      published: true,
      featured: false,
      syncToCalendar: true,
      tags: ['community'],
      categories: ['social'],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      markdownPath: '/events/test-event.md',
      reminderMinutes: 30,
      ...overrides,
    };
  }

  // ============================================================================
  // toICalendar
  // ============================================================================

  describe('toICalendar', () => {
    it('should transform a basic event to VEvent', () => {
      const event = makeEvent();
      const vevent = transformer.toICalendar(event);

      expect(vevent.uid).toBe('test-uid@stonewallunderground.com');
      expect(vevent.summary).toBe('Test Event');
      expect(vevent.description).toBe('A test event description');
      expect(vevent.location).toBe('123 Main Street');
      expect(vevent.status).toBe('CONFIRMED');
    });

    it('should set DTSTART with timezone', () => {
      const event = makeEvent({ timezone: 'America/Los_Angeles' });
      const vevent = transformer.toICalendar(event);

      expect(vevent.dtstart.value).toBe('2025-06-01T18:00:00Z');
      expect(vevent.dtstart.tzid).toBe('America/Los_Angeles');
    });

    it('should not set TZID for UTC timezone', () => {
      const event = makeEvent({ timezone: 'UTC' });
      const vevent = transformer.toICalendar(event);

      expect(vevent.dtstart.tzid).toBeUndefined();
    });

    it('should set DTEND when present', () => {
      const event = makeEvent();
      const vevent = transformer.toICalendar(event);

      expect(vevent.dtend).toBeDefined();
      expect(vevent.dtend!.value).toBe('2025-06-01T20:00:00Z');
    });

    it('should not set DTEND when absent', () => {
      const event = makeEvent({ dtend: undefined });
      const vevent = transformer.toICalendar(event);

      expect(vevent.dtend).toBeUndefined();
    });

    it('should set organizer when both name and email present', () => {
      const event = makeEvent({
        organizer: 'Jane Doe',
        contactEmail: 'jane@example.com',
      });
      const vevent = transformer.toICalendar(event);

      expect(vevent.organizer).toBeDefined();
      expect(vevent.organizer!.name).toBe('Jane Doe');
      expect(vevent.organizer!.email).toBe('jane@example.com');
    });

    it('should not set organizer when email is missing', () => {
      const event = makeEvent({ organizer: 'Jane Doe', contactEmail: undefined });
      const vevent = transformer.toICalendar(event);

      expect(vevent.organizer).toBeUndefined();
    });

    it('should map published status to CONFIRMED', () => {
      const event = makeEvent({ status: 'published' });
      const vevent = transformer.toICalendar(event);
      expect(vevent.status).toBe('CONFIRMED');
    });

    it('should map draft status to TENTATIVE', () => {
      const event = makeEvent({ status: 'draft' });
      const vevent = transformer.toICalendar(event);
      expect(vevent.status).toBe('TENTATIVE');
    });

    it('should map cancelled status to CANCELLED', () => {
      const event = makeEvent({ status: 'cancelled' });
      const vevent = transformer.toICalendar(event);
      expect(vevent.status).toBe('CANCELLED');
    });

    it('should include RRULE for recurring events', () => {
      const event = makeEvent({
        isRecurring: true,
        rrule: 'FREQ=WEEKLY;BYDAY=TH',
      });
      const vevent = transformer.toICalendar(event);
      expect(vevent.rrule).toBe('FREQ=WEEKLY;BYDAY=TH');
    });

    it('should not include RRULE for non-recurring events', () => {
      const event = makeEvent({ isRecurring: false });
      const vevent = transformer.toICalendar(event);
      expect(vevent.rrule).toBeUndefined();
    });

    it('should include EXDATE for events with exceptions', () => {
      const event = makeEvent({
        exdates: ['2025-06-08T18:00:00Z', '2025-06-15T18:00:00Z'],
      });
      const vevent = transformer.toICalendar(event);
      expect(vevent.exdates).toHaveLength(2);
    });

    it('should include categories', () => {
      const event = makeEvent({ categories: ['workshop', 'community'] });
      const vevent = transformer.toICalendar(event);
      expect(vevent.categories).toEqual(['workshop', 'community']);
    });

    it('should include URL from registrationUrl', () => {
      const event = makeEvent({ registrationUrl: 'https://example.com/register' });
      const vevent = transformer.toICalendar(event);
      expect(vevent.url).toBe('https://example.com/register');
    });
  });

  // ============================================================================
  // toVCalendar
  // ============================================================================

  describe('toVCalendar', () => {
    it('should generate valid VCALENDAR wrapper', () => {
      const events = [makeEvent()];
      const ics = transformer.toVCalendar(events);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//Tinyland.dev//Calendar//EN');
      expect(ics).toContain('CALSCALE:GREGORIAN');
      expect(ics).toContain('METHOD:PUBLISH');
    });

    it('should contain VEVENT block', () => {
      const events = [makeEvent()];
      const ics = transformer.toVCalendar(events);

      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
    });

    it('should contain event UID', () => {
      const events = [makeEvent()];
      const ics = transformer.toVCalendar(events);

      expect(ics).toContain('UID:test-uid@stonewallunderground.com');
    });

    it('should contain SUMMARY', () => {
      const events = [makeEvent({ title: 'Pride Parade' })];
      const ics = transformer.toVCalendar(events);

      expect(ics).toContain('SUMMARY:Pride Parade');
    });

    it('should handle multiple events', () => {
      const events = [
        makeEvent({ uid: 'event-1@test.com', title: 'Event One' }),
        makeEvent({ uid: 'event-2@test.com', title: 'Event Two' }),
      ];
      const ics = transformer.toVCalendar(events);

      const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(veventCount).toBe(2);
    });

    it('should handle empty events array', () => {
      const ics = transformer.toVCalendar([]);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).not.toContain('BEGIN:VEVENT');
    });

    it('should escape special characters in text fields', () => {
      const events = [
        makeEvent({
          title: 'Event with; semicolons, commas',
          description: 'Line 1\nLine 2',
        }),
      ];
      const ics = transformer.toVCalendar(events);

      expect(ics).toContain('\\;');
      expect(ics).toContain('\\,');
      expect(ics).toContain('\\n');
    });

    it('should fold lines longer than 75 characters', () => {
      const longDescription = 'A'.repeat(200);
      const events = [makeEvent({ description: longDescription })];
      const ics = transformer.toVCalendar(events);

      // Folded lines start with a space
      const lines = ics.split('\r\n');
      const foldedLines = lines.filter((l) => l.startsWith(' '));
      expect(foldedLines.length).toBeGreaterThan(0);
    });

    it('should include DTSTART with TZID for non-UTC timezone', () => {
      const events = [makeEvent({ timezone: 'America/Chicago' })];
      const ics = transformer.toVCalendar(events);

      expect(ics).toContain('DTSTART;TZID=America/Chicago:');
    });

    it('should include DTSTART without TZID for UTC', () => {
      const events = [makeEvent({ timezone: 'UTC' })];
      const ics = transformer.toVCalendar(events);

      expect(ics).toContain('DTSTART:');
      expect(ics).not.toContain('DTSTART;TZID=UTC:');
    });

    it('should include ORGANIZER line', () => {
      const events = [
        makeEvent({
          organizer: 'Jane Smith',
          contactEmail: 'jane@example.com',
        }),
      ];
      const ics = transformer.toVCalendar(events);

      expect(ics).toContain('ORGANIZER;CN=Jane Smith:mailto:jane@example.com');
    });
  });

  // ============================================================================
  // generateUID
  // ============================================================================

  describe('generateUID', () => {
    it('should generate unique UIDs', () => {
      const uid1 = transformer.generateUID();
      const uid2 = transformer.generateUID();

      expect(uid1).not.toBe(uid2);
    });

    it('should include domain suffix', () => {
      const uid = transformer.generateUID();
      expect(uid).toContain('@stonewallunderground.com');
    });

    it('should be non-empty', () => {
      const uid = transformer.generateUID();
      expect(uid.length).toBeGreaterThan(10);
    });
  });

  // ============================================================================
  // Not implemented methods
  // ============================================================================

  describe('not-implemented stubs', () => {
    it('fromICalendar should throw', () => {
      expect(() => transformer.fromICalendar('')).toThrow('Not implemented');
    });

    it('parseVEvent should throw', () => {
      const vevent = {} as VEvent;
      expect(() => transformer.parseVEvent(vevent)).toThrow('Not implemented');
    });

    it('validateICalendar should throw', () => {
      expect(() => transformer.validateICalendar('')).toThrow('Not implemented');
    });
  });
});
