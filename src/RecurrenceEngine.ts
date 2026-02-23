





import type { RecurrencePattern, EventOccurrence, RecurrenceUpdate, EventWithCalendar } from './types.js';
import { getLogger } from './config.js';








export class RecurrenceEngine {
  





  parseRRule(rruleString: string): RecurrencePattern {
    try {
      const parts = rruleString.replace('RRULE:', '').split(';');
      const params: Record<string, string> = {};

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key && value) {
          params[key.toUpperCase()] = value;
        }
      }

      const freqMap: Record<string, RecurrencePattern['frequency']> = {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        YEARLY: 'yearly',
      };

      return {
        frequency: freqMap[params.FREQ] || 'daily',
        interval: params.INTERVAL ? parseInt(params.INTERVAL, 10) : 1,
        count: params.COUNT ? parseInt(params.COUNT, 10) : undefined,
        until: params.UNTIL ? new Date(params.UNTIL) : undefined,
        byDay: params.BYDAY ? params.BYDAY.split(',') : undefined,
        byMonth: params.BYMONTH
          ? params.BYMONTH.split(',').map((m: string) => parseInt(m, 10))
          : undefined,
        byMonthDay: params.BYMONTHDAY
          ? params.BYMONTHDAY.split(',').map((d: string) => parseInt(d, 10))
          : undefined,
        bySetPos: params.BYSETPOS ? parseInt(params.BYSETPOS, 10) : undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid RRULE: ${message}`);
    }
  }

  





  async generateOccurrences(
    event: EventWithCalendar,
    startDate: Date,
    endDate: Date
  ): Promise<EventOccurrence[]> {
    if (!event.frontmatter.recurrence) {
      const eventDate = new Date(event.frontmatter.startDate || event.frontmatter.date);
      if (eventDate >= startDate && eventDate <= endDate) {
        return [
          {
            date: eventDate,
            isException: false,
            originalEvent: event,
          },
        ];
      }
      return [];
    }

    const logger = getLogger();

    try {
      const pattern = this.parseRRule(event.frontmatter.recurrence);
      const dtstart = new Date(event.frontmatter.startDate || event.frontmatter.date);
      const dates = this.expandPattern(pattern, dtstart, startDate, endDate);
      const occurrences: EventOccurrence[] = [];

      for (const date of dates) {
        occurrences.push({
          date,
          isException: false,
          originalEvent: event,
        });
      }

      return occurrences;
    } catch (error) {
      logger.error(`Failed to generate occurrences for ${event.slug}:`, { error });
      return [];
    }
  }

  


  createRRule(pattern: RecurrencePattern): string {
    const parts: string[] = [];

    const freqMap: Record<string, string> = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
      yearly: 'YEARLY',
    };

    parts.push(`FREQ=${freqMap[pattern.frequency]}`);

    if (pattern.interval && pattern.interval > 1) {
      parts.push(`INTERVAL=${pattern.interval}`);
    }

    if (pattern.count) {
      parts.push(`COUNT=${pattern.count}`);
    }

    if (pattern.until) {
      const d = pattern.until;
      const formatted =
        d.getUTCFullYear().toString() +
        (d.getUTCMonth() + 1).toString().padStart(2, '0') +
        d.getUTCDate().toString().padStart(2, '0') +
        'T' +
        d.getUTCHours().toString().padStart(2, '0') +
        d.getUTCMinutes().toString().padStart(2, '0') +
        d.getUTCSeconds().toString().padStart(2, '0') +
        'Z';
      parts.push(`UNTIL=${formatted}`);
    }

    if (pattern.byDay && pattern.byDay.length > 0) {
      parts.push(`BYDAY=${pattern.byDay.join(',')}`);
    }

    if (pattern.byMonth && pattern.byMonth.length > 0) {
      parts.push(`BYMONTH=${pattern.byMonth.join(',')}`);
    }

    if (pattern.byMonthDay && pattern.byMonthDay.length > 0) {
      parts.push(`BYMONTHDAY=${pattern.byMonthDay.join(',')}`);
    }

    if (pattern.bySetPos !== undefined) {
      parts.push(`BYSETPOS=${pattern.bySetPos}`);
    }

    return `RRULE:${parts.join(';')}`;
  }

  


  async updateRecurringSeries(
    event: EventWithCalendar,
    update: RecurrenceUpdate
  ): Promise<void> {
    const logger = getLogger();

    switch (update.scope) {
      case 'this':
        logger.debug(`Creating exception for ${event.slug}`);
        break;
      case 'future':
        logger.debug(`Splitting series for ${event.slug}`);
        break;
      case 'all':
        logger.debug(`Updating entire series for ${event.slug}`);
        break;
    }
  }

  


  async handleException(
    event: EventWithCalendar,
    date: Date,
    _changes: Partial<EventWithCalendar>
  ): Promise<void> {
    const logger = getLogger();
    logger.debug(`Exception created for ${event.slug} on ${date.toISOString()}`);
  }

  


  validatePattern(pattern: RecurrencePattern): boolean {
    if (pattern.interval < 1) return false;

    if (pattern.count && pattern.until) {
      return false;
    }

    if (pattern.count && pattern.count > 365) {
      return false;
    }

    if (pattern.until) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 10);
      if (pattern.until > maxDate) {
        return false;
      }
    }

    return true;
  }

  


  getDescription(pattern: RecurrencePattern): string {
    let desc = `Repeats ${pattern.frequency}`;

    if (pattern.interval > 1) {
      desc += ` every ${pattern.interval} ${pattern.frequency}s`;
    }

    if (pattern.byDay && pattern.byDay.length > 0) {
      desc += ` on ${pattern.byDay.join(', ')}`;
    }

    if (pattern.count) {
      desc += `, ${pattern.count} times`;
    } else if (pattern.until) {
      desc += `, until ${pattern.until.toLocaleDateString()}`;
    }

    return desc;
  }

  
  
  

  



  private expandPattern(
    pattern: RecurrencePattern,
    dtstart: Date,
    rangeStart: Date,
    rangeEnd: Date,
    maxOccurrences = 365
  ): Date[] {
    const dates: Date[] = [];
    let current = new Date(dtstart);
    let count = 0;

    while (current <= rangeEnd && count < maxOccurrences) {
      if (pattern.count && count >= pattern.count) break;
      if (pattern.until && current > pattern.until) break;

      if (current >= rangeStart) {
        dates.push(new Date(current));
      }

      
      switch (pattern.frequency) {
        case 'daily':
          current.setDate(current.getDate() + (pattern.interval || 1));
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7 * (pattern.interval || 1));
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + (pattern.interval || 1));
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + (pattern.interval || 1));
          break;
      }

      count++;
    }

    return dates;
  }
}


export const recurrenceEngine = new RecurrenceEngine();
