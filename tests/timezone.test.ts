import { describe, it, expect } from 'vitest';
import { TimezoneHandler } from '../src/TimezoneHandler.js';

describe('TimezoneHandler', () => {
  const handler = new TimezoneHandler();

  describe('getCommonTimezones', () => {
    it('should return a non-empty list', () => {
      const timezones = handler.getCommonTimezones();
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should include major US timezones', () => {
      const timezones = handler.getCommonTimezones();
      expect(timezones).toContain('America/New_York');
      expect(timezones).toContain('America/Chicago');
      expect(timezones).toContain('America/Denver');
      expect(timezones).toContain('America/Los_Angeles');
    });

    it('should include UTC', () => {
      const timezones = handler.getCommonTimezones();
      expect(timezones).toContain('UTC');
    });

    it('should include non-US timezones', () => {
      const timezones = handler.getCommonTimezones();
      expect(timezones).toContain('Europe/London');
      expect(timezones).toContain('Asia/Tokyo');
      expect(timezones).toContain('Australia/Sydney');
    });

    it('should include no-DST timezones', () => {
      const timezones = handler.getCommonTimezones();
      expect(timezones).toContain('America/Phoenix');
      expect(timezones).toContain('Pacific/Honolulu');
    });

    it('should return IANA-format strings', () => {
      const timezones = handler.getCommonTimezones();
      for (const tz of timezones) {
        if (tz !== 'UTC') {
          expect(tz).toMatch(/^[A-Za-z]+\/[A-Za-z_]+$/);
        }
      }
    });
  });

  describe('not-implemented stubs', () => {
    it('toUTC should throw', () => {
      expect(() => handler.toUTC(new Date(), 'America/New_York')).toThrow(
        'Not implemented'
      );
    });

    it('fromUTC should throw', () => {
      expect(() => handler.fromUTC(new Date(), 'America/New_York')).toThrow(
        'Not implemented'
      );
    });

    it('isValidTimezone should throw', () => {
      expect(() => handler.isValidTimezone('America/New_York')).toThrow(
        'Not implemented'
      );
    });

    it('getTimezoneInfo should throw', () => {
      expect(() => handler.getTimezoneInfo('America/New_York')).toThrow(
        'Not implemented'
      );
    });

    it('isDST should throw', () => {
      expect(() => handler.isDST(new Date(), 'America/New_York')).toThrow(
        'Not implemented'
      );
    });

    it('getDSTTransitions should throw', () => {
      expect(() => handler.getDSTTransitions(2025, 'America/New_York')).toThrow(
        'Not implemented'
      );
    });

    it('formatWithTimezone should throw', () => {
      expect(() =>
        handler.formatWithTimezone(new Date(), 'America/New_York', 'yyyy-MM-dd')
      ).toThrow('Not implemented');
    });

    it('parseWithTimezone should throw', () => {
      expect(() =>
        handler.parseWithTimezone('2025-06-01', 'America/New_York')
      ).toThrow('Not implemented');
    });

    it('searchTimezones should throw', () => {
      expect(() => handler.searchTimezones('New_York')).toThrow(
        'Not implemented'
      );
    });
  });
});
