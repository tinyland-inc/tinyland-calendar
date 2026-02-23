








import type {
  CalendarEvent,
  VEvent,
  VCalendar,
  VTimezone,
  ValidationResult,
} from './types.js';

export class EventTransformer {
  private readonly prodId = '-//Tinyland.dev//Calendar//EN';
  private readonly version = '2.0';

  
  
  

  


  toICalendar(event: CalendarEvent): VEvent {
    const statusMap: Record<string, 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'> = {
      published: 'CONFIRMED',
      draft: 'TENTATIVE',
      cancelled: 'CANCELLED',
      archived: 'CANCELLED',
    };
    const vevent: VEvent = {
      uid: event.uid,
      summary: event.title,
      description: event.description,
      location: event.location,
      dtstart: {
        value: event.dtstart,
        tzid: event.timezone !== 'UTC' ? event.timezone : undefined,
      },
      dtstamp: new Date().toISOString(),
      status: statusMap[event.status] || 'CONFIRMED',
      url: event.registrationUrl,
      categories: event.categories,
    };

    if (event.dtend) {
      vevent.dtend = {
        value: event.dtend,
        tzid: event.timezone !== 'UTC' ? event.timezone : undefined,
      };
    }

    if (event.organizer && event.contactEmail) {
      vevent.organizer = {
        name: event.organizer,
        email: event.contactEmail,
      };
    }

    if (event.isRecurring && event.rrule) {
      vevent.rrule = event.rrule;
    }

    if (event.exdates && event.exdates.length > 0) {
      vevent.exdates = event.exdates;
    }

    if (event.status === 'cancelled') {
      vevent.status = 'CANCELLED';
    } else if (event.status === 'draft') {
      vevent.status = 'TENTATIVE';
    } else {
      vevent.status = 'CONFIRMED';
    }

    return vevent;
  }

  


  toVCalendar(events: CalendarEvent[]): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      `VERSION:${this.version}`,
      `PRODID:${this.prodId}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    
    const _timezones = new Set<string>();
    events.forEach((event) => {
      if (event.timezone && event.timezone !== 'UTC') {
        _timezones.add(event.timezone);
      }
    });

    events.forEach((event) => {
      const vevent = this.toICalendar(event);
      lines.push(this.serializeVEvent(vevent));
    });

    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  
  
  

  


  fromICalendar(_ical: string): CalendarEvent[] {
    throw new Error('Not implemented: fromICalendar');
  }

  


  parseVEvent(_vevent: VEvent): CalendarEvent {
    throw new Error('Not implemented: parseVEvent');
  }

  
  
  

  


  generateUID(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}@stonewallunderground.com`;
  }

  


  validateICalendar(_ical: string): ValidationResult {
    throw new Error('Not implemented: validateICalendar');
  }

  
  
  

  


  private serializeVEvent(vevent: VEvent): string {
    const lines: string[] = ['BEGIN:VEVENT'];

    lines.push(`UID:${vevent.uid}`);
    lines.push(`DTSTAMP:${this.formatICalDateTime(vevent.dtstamp)}`);
    lines.push(`SUMMARY:${this.escapeText(vevent.summary)}`);

    const dtstartLine = vevent.dtstart.tzid
      ? `DTSTART;TZID=${vevent.dtstart.tzid}:${this.formatICalDateTime(vevent.dtstart.value, false)}`
      : `DTSTART:${this.formatICalDateTime(vevent.dtstart.value)}`;
    lines.push(dtstartLine);

    if (vevent.dtend) {
      const dtendLine = vevent.dtend.tzid
        ? `DTEND;TZID=${vevent.dtend.tzid}:${this.formatICalDateTime(vevent.dtend.value, false)}`
        : `DTEND:${this.formatICalDateTime(vevent.dtend.value)}`;
      lines.push(dtendLine);
    }

    if (vevent.description) {
      lines.push(`DESCRIPTION:${this.escapeText(vevent.description)}`);
    }

    if (vevent.location) {
      lines.push(`LOCATION:${this.escapeText(vevent.location)}`);
    }

    if (vevent.url) {
      lines.push(`URL:${vevent.url}`);
    }

    if (vevent.status) {
      lines.push(`STATUS:${vevent.status}`);
    }

    if (vevent.organizer) {
      const orgLine = `ORGANIZER;CN=${this.escapeText(vevent.organizer.name || vevent.organizer.email)}:mailto:${vevent.organizer.email}`;
      lines.push(orgLine);
    }

    if (vevent.categories && vevent.categories.length > 0) {
      lines.push(`CATEGORIES:${vevent.categories.map((c) => this.escapeText(c)).join(',')}`);
    }

    if (vevent.rrule) {
      lines.push(`RRULE:${vevent.rrule}`);
    }

    if (vevent.exdates && vevent.exdates.length > 0) {
      vevent.exdates.forEach((exdate) => {
        lines.push(`EXDATE:${this.formatICalDateTime(exdate)}`);
      });
    }

    if (vevent.recurrenceId) {
      lines.push(`RECURRENCE-ID:${this.formatICalDateTime(vevent.recurrenceId)}`);
    }

    lines.push('END:VEVENT');

    return lines.map((line) => this.foldLine(line)).join('\r\n');
  }

  


  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  


  private foldLine(line: string): string {
    if (line.length <= 75) {
      return line;
    }

    const result: string[] = [];
    let remaining = line;

    result.push(remaining.substring(0, 75));
    remaining = remaining.substring(75);

    while (remaining.length > 0) {
      result.push(' ' + remaining.substring(0, 74));
      remaining = remaining.substring(74);
    }

    return result.join('\r\n');
  }

  


  private formatICalDateTime(dateStr: string, utc = true): string {
    const date = new Date(dateStr);
    const year = date.getUTCFullYear().toString();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hour = date.getUTCHours().toString().padStart(2, '0');
    const minute = date.getUTCMinutes().toString().padStart(2, '0');
    const second = date.getUTCSeconds().toString().padStart(2, '0');

    const formatted = `${year}${month}${day}T${hour}${minute}${second}`;
    return utc ? `${formatted}Z` : formatted;
  }
}
