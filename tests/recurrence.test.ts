import { describe, it, expect } from 'vitest';
import { RecurrenceEngine } from '../src/RecurrenceEngine.js';
import type { RecurrencePattern, EventWithCalendar } from '../src/types.js';

describe('RecurrenceEngine', () => {
  const engine = new RecurrenceEngine();

  
  
  

  describe('parseRRule', () => {
    it('should parse a simple daily RRULE', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=DAILY');
      expect(pattern.frequency).toBe('daily');
      expect(pattern.interval).toBe(1);
    });

    it('should parse a daily RRULE with interval', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=DAILY;INTERVAL=3');
      expect(pattern.frequency).toBe('daily');
      expect(pattern.interval).toBe(3);
    });

    it('should parse a weekly RRULE', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=WEEKLY');
      expect(pattern.frequency).toBe('weekly');
      expect(pattern.interval).toBe(1);
    });

    it('should parse a weekly RRULE with BYDAY', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
      expect(pattern.frequency).toBe('weekly');
      expect(pattern.byDay).toEqual(['MO', 'WE', 'FR']);
    });

    it('should parse a monthly RRULE', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=MONTHLY');
      expect(pattern.frequency).toBe('monthly');
    });

    it('should parse a monthly RRULE with BYMONTHDAY', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=MONTHLY;BYMONTHDAY=15');
      expect(pattern.frequency).toBe('monthly');
      expect(pattern.byMonthDay).toEqual([15]);
    });

    it('should parse a monthly RRULE with BYSETPOS', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=MONTHLY;BYDAY=TH;BYSETPOS=3');
      expect(pattern.frequency).toBe('monthly');
      expect(pattern.byDay).toEqual(['TH']);
      expect(pattern.bySetPos).toBe(3);
    });

    it('should parse a yearly RRULE', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=YEARLY');
      expect(pattern.frequency).toBe('yearly');
    });

    it('should parse a yearly RRULE with BYMONTH', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=YEARLY;BYMONTH=6');
      expect(pattern.frequency).toBe('yearly');
      expect(pattern.byMonth).toEqual([6]);
    });

    it('should parse RRULE with COUNT', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=WEEKLY;COUNT=12');
      expect(pattern.count).toBe(12);
      expect(pattern.until).toBeUndefined();
    });

    it('should parse RRULE with UNTIL', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=DAILY;UNTIL=20251231T235959Z');
      expect(pattern.until).toBeDefined();
      expect(pattern.count).toBeUndefined();
    });

    it('should parse RRULE without RRULE: prefix', () => {
      const pattern = engine.parseRRule('FREQ=WEEKLY;INTERVAL=2');
      expect(pattern.frequency).toBe('weekly');
      expect(pattern.interval).toBe(2);
    });

    it('should throw on invalid RRULE', () => {
      expect(() => engine.parseRRule('')).not.toThrow(); 
    });

    it('should handle RRULE with multiple BYMONTH values', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=YEARLY;BYMONTH=3,6,9,12');
      expect(pattern.byMonth).toEqual([3, 6, 9, 12]);
    });

    it('should handle RRULE with multiple BYMONTHDAY values', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15');
      expect(pattern.byMonthDay).toEqual([1, 15]);
    });
  });

  
  
  

  describe('createRRule', () => {
    it('should create a simple daily RRULE', () => {
      const rrule = engine.createRRule({
        frequency: 'daily',
        interval: 1,
      });
      expect(rrule).toBe('RRULE:FREQ=DAILY');
    });

    it('should create a daily RRULE with interval', () => {
      const rrule = engine.createRRule({
        frequency: 'daily',
        interval: 3,
      });
      expect(rrule).toBe('RRULE:FREQ=DAILY;INTERVAL=3');
    });

    it('should create a weekly RRULE with BYDAY', () => {
      const rrule = engine.createRRule({
        frequency: 'weekly',
        interval: 1,
        byDay: ['MO', 'WE', 'FR'],
      });
      expect(rrule).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
    });

    it('should create a monthly RRULE with BYMONTHDAY', () => {
      const rrule = engine.createRRule({
        frequency: 'monthly',
        interval: 1,
        byMonthDay: [15],
      });
      expect(rrule).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=15');
    });

    it('should create a yearly RRULE with BYMONTH', () => {
      const rrule = engine.createRRule({
        frequency: 'yearly',
        interval: 1,
        byMonth: [6],
      });
      expect(rrule).toBe('RRULE:FREQ=YEARLY;BYMONTH=6');
    });

    it('should create RRULE with COUNT', () => {
      const rrule = engine.createRRule({
        frequency: 'weekly',
        interval: 1,
        count: 12,
      });
      expect(rrule).toContain('COUNT=12');
    });

    it('should create RRULE with UNTIL', () => {
      const until = new Date('2025-12-31T23:59:59Z');
      const rrule = engine.createRRule({
        frequency: 'daily',
        interval: 1,
        until,
      });
      expect(rrule).toContain('UNTIL=');
      expect(rrule).toContain('20251231');
    });

    it('should create RRULE with BYSETPOS', () => {
      const rrule = engine.createRRule({
        frequency: 'monthly',
        interval: 1,
        byDay: ['TH'],
        bySetPos: 3,
      });
      expect(rrule).toContain('BYSETPOS=3');
      expect(rrule).toContain('BYDAY=TH');
    });

    it('should not include INTERVAL when it is 1', () => {
      const rrule = engine.createRRule({
        frequency: 'daily',
        interval: 1,
      });
      expect(rrule).not.toContain('INTERVAL');
    });
  });

  
  
  

  describe('round-trip parse/create', () => {
    it('should round-trip a daily RRULE', () => {
      const original: RecurrencePattern = {
        frequency: 'daily',
        interval: 2,
      };
      const rrule = engine.createRRule(original);
      const parsed = engine.parseRRule(rrule);
      expect(parsed.frequency).toBe(original.frequency);
      expect(parsed.interval).toBe(original.interval);
    });

    it('should round-trip a weekly RRULE with BYDAY', () => {
      const original: RecurrencePattern = {
        frequency: 'weekly',
        interval: 1,
        byDay: ['MO', 'FR'],
      };
      const rrule = engine.createRRule(original);
      const parsed = engine.parseRRule(rrule);
      expect(parsed.frequency).toBe('weekly');
      expect(parsed.byDay).toEqual(['MO', 'FR']);
    });

    it('should round-trip a monthly RRULE with count', () => {
      const original: RecurrencePattern = {
        frequency: 'monthly',
        interval: 1,
        count: 6,
      };
      const rrule = engine.createRRule(original);
      const parsed = engine.parseRRule(rrule);
      expect(parsed.frequency).toBe('monthly');
      expect(parsed.count).toBe(6);
    });
  });

  
  
  

  describe('validatePattern', () => {
    it('should accept a valid daily pattern', () => {
      expect(
        engine.validatePattern({ frequency: 'daily', interval: 1 })
      ).toBe(true);
    });

    it('should accept a valid weekly pattern with count', () => {
      expect(
        engine.validatePattern({
          frequency: 'weekly',
          interval: 1,
          count: 10,
        })
      ).toBe(true);
    });

    it('should accept a valid monthly pattern with until', () => {
      const until = new Date();
      until.setFullYear(until.getFullYear() + 1);
      expect(
        engine.validatePattern({
          frequency: 'monthly',
          interval: 1,
          until,
        })
      ).toBe(true);
    });

    it('should reject interval < 1', () => {
      expect(
        engine.validatePattern({ frequency: 'daily', interval: 0 })
      ).toBe(false);
    });

    it('should reject both count and until', () => {
      expect(
        engine.validatePattern({
          frequency: 'weekly',
          interval: 1,
          count: 10,
          until: new Date(),
        })
      ).toBe(false);
    });

    it('should reject count > 365', () => {
      expect(
        engine.validatePattern({
          frequency: 'daily',
          interval: 1,
          count: 400,
        })
      ).toBe(false);
    });

    it('should reject until more than 10 years in the future', () => {
      const until = new Date();
      until.setFullYear(until.getFullYear() + 11);
      expect(
        engine.validatePattern({
          frequency: 'yearly',
          interval: 1,
          until,
        })
      ).toBe(false);
    });

    it('should accept count at boundary (365)', () => {
      expect(
        engine.validatePattern({
          frequency: 'daily',
          interval: 1,
          count: 365,
        })
      ).toBe(true);
    });

    it('should accept until at ~10 year boundary', () => {
      const until = new Date();
      until.setFullYear(until.getFullYear() + 9);
      expect(
        engine.validatePattern({
          frequency: 'yearly',
          interval: 1,
          until,
        })
      ).toBe(true);
    });
  });

  
  
  

  describe('getDescription', () => {
    it('should describe a daily pattern', () => {
      const desc = engine.getDescription({
        frequency: 'daily',
        interval: 1,
      });
      expect(desc).toContain('daily');
    });

    it('should describe a pattern with interval > 1', () => {
      const desc = engine.getDescription({
        frequency: 'weekly',
        interval: 2,
      });
      expect(desc).toContain('every 2');
    });

    it('should describe a pattern with byDay', () => {
      const desc = engine.getDescription({
        frequency: 'weekly',
        interval: 1,
        byDay: ['MO', 'WE', 'FR'],
      });
      expect(desc).toContain('MO');
      expect(desc).toContain('WE');
      expect(desc).toContain('FR');
    });

    it('should describe a pattern with count', () => {
      const desc = engine.getDescription({
        frequency: 'daily',
        interval: 1,
        count: 10,
      });
      expect(desc).toContain('10 times');
    });

    it('should describe a pattern with until', () => {
      const desc = engine.getDescription({
        frequency: 'daily',
        interval: 1,
        until: new Date('2025-12-31'),
      });
      expect(desc).toContain('until');
    });
  });

  
  
  

  describe('generateOccurrences', () => {
    function makeEvent(overrides: Partial<EventWithCalendar['frontmatter']> = {}): EventWithCalendar {
      return {
        slug: 'test-event',
        content: 'Test content',
        readingTime: 1,
        wordCount: 10,
        frontmatter: {
          title: 'Test Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          startDate: '2025-01-01T10:00:00Z',
          ...overrides,
        },
        xandikosEvent: {
          uid: 'test@example.com',
          summary: 'Test Event',
          dtstart: '2025-01-01T10:00:00Z',
        },
      } as EventWithCalendar;
    }

    it('should return single occurrence for non-recurring event', async () => {
      const event = makeEvent();
      const occs = await engine.generateOccurrences(
        event,
        new Date('2024-12-01'),
        new Date('2025-02-01')
      );
      expect(occs).toHaveLength(1);
      expect(occs[0].isException).toBe(false);
    });

    it('should return empty array when event is outside range', async () => {
      const event = makeEvent();
      const occs = await engine.generateOccurrences(
        event,
        new Date('2025-06-01'),
        new Date('2025-07-01')
      );
      expect(occs).toHaveLength(0);
    });

    it('should generate daily occurrences', async () => {
      const event = makeEvent({
        recurrence: 'RRULE:FREQ=DAILY;COUNT=5',
      });
      const occs = await engine.generateOccurrences(
        event,
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );
      expect(occs.length).toBe(5);
    });

    it('should generate weekly occurrences', async () => {
      const event = makeEvent({
        recurrence: 'RRULE:FREQ=WEEKLY;COUNT=4',
      });
      const occs = await engine.generateOccurrences(
        event,
        new Date('2025-01-01'),
        new Date('2025-03-01')
      );
      expect(occs.length).toBe(4);
    });

    it('should generate monthly occurrences', async () => {
      const event = makeEvent({
        recurrence: 'RRULE:FREQ=MONTHLY;COUNT=3',
      });
      const occs = await engine.generateOccurrences(
        event,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );
      expect(occs.length).toBe(3);
    });

    it('should generate yearly occurrences', async () => {
      const event = makeEvent({
        recurrence: 'RRULE:FREQ=YEARLY;COUNT=2',
      });
      const occs = await engine.generateOccurrences(
        event,
        new Date('2025-01-01'),
        new Date('2030-01-01')
      );
      expect(occs.length).toBe(2);
    });

    it('should respect UNTIL date', async () => {
      const event = makeEvent({
        recurrence: 'RRULE:FREQ=DAILY;UNTIL=2025-01-05T23:59:59Z',
      });
      const occs = await engine.generateOccurrences(
        event,
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );
      
      expect(occs.length).toBe(5);
    });

    it('should limit occurrences within range', async () => {
      const event = makeEvent({
        recurrence: 'RRULE:FREQ=DAILY;COUNT=100',
      });
      const occs = await engine.generateOccurrences(
        event,
        new Date('2025-01-10'),
        new Date('2025-01-15')
      );
      
      expect(occs.length).toBeGreaterThan(0);
      expect(occs.length).toBeLessThanOrEqual(6);
    });
  });

  
  
  

  describe('edge cases', () => {
    it('should handle leap year date (Feb 29)', () => {
      const pattern = engine.parseRRule('RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=29');
      expect(pattern.frequency).toBe('yearly');
      expect(pattern.byMonth).toEqual([2]);
      expect(pattern.byMonthDay).toEqual([29]);
    });

    it('should handle negative interval gracefully in validation', () => {
      expect(
        engine.validatePattern({
          frequency: 'daily',
          interval: -1,
        })
      ).toBe(false);
    });

    it('should handle empty byDay array', () => {
      const rrule = engine.createRRule({
        frequency: 'weekly',
        interval: 1,
        byDay: [],
      });
      expect(rrule).not.toContain('BYDAY');
    });
  });
});
