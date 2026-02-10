import { describe, it, expect, beforeEach } from 'vitest';
import {
  configureCalendar,
  getCalendarConfig,
  resetCalendarConfig,
  getLogger,
  getLoadEvents,
} from '../src/config.js';

describe('CalendarConfig', () => {
  beforeEach(() => {
    resetCalendarConfig();
  });

  describe('configureCalendar', () => {
    it('should set configuration values', () => {
      configureCalendar({ calDavUrl: 'http://localhost:8081' });
      const config = getCalendarConfig();
      expect(config.calDavUrl).toBe('http://localhost:8081');
    });

    it('should merge with existing configuration', () => {
      configureCalendar({ calDavUrl: 'http://localhost:8081' });
      configureCalendar({ calDavUsername: 'admin' });
      const config = getCalendarConfig();
      expect(config.calDavUrl).toBe('http://localhost:8081');
      expect(config.calDavUsername).toBe('admin');
    });

    it('should override existing values', () => {
      configureCalendar({ calDavUrl: 'http://localhost:8081' });
      configureCalendar({ calDavUrl: 'http://xandikos:8000' });
      const config = getCalendarConfig();
      expect(config.calDavUrl).toBe('http://xandikos:8000');
    });

    it('should accept a custom logger', () => {
      const customLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
      configureCalendar({ logger: customLogger });
      expect(getLogger()).toBe(customLogger);
    });

    it('should accept a loadEvents callback', async () => {
      const mockEvents = [
        {
          slug: 'test-event',
          content: 'Test content',
          frontmatter: { title: 'Test Event' },
        },
      ];
      configureCalendar({ loadEvents: async () => mockEvents });
      const loader = getLoadEvents();
      const events = await loader();
      expect(events).toEqual(mockEvents);
    });

    it('should accept all config properties at once', () => {
      configureCalendar({
        calDavUrl: 'http://localhost:8081',
        calDavUsername: 'admin',
        calDavPassword: 'secret',
        dataDir: '/tmp/calendar-data',
      });
      const config = getCalendarConfig();
      expect(config.calDavUrl).toBe('http://localhost:8081');
      expect(config.calDavUsername).toBe('admin');
      expect(config.calDavPassword).toBe('secret');
      expect(config.dataDir).toBe('/tmp/calendar-data');
    });
  });

  describe('resetCalendarConfig', () => {
    it('should clear all configuration', () => {
      configureCalendar({
        calDavUrl: 'http://localhost:8081',
        calDavUsername: 'admin',
      });
      resetCalendarConfig();
      const config = getCalendarConfig();
      expect(config.calDavUrl).toBeUndefined();
      expect(config.calDavUsername).toBeUndefined();
    });

    it('should reset logger to default', () => {
      const customLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
      configureCalendar({ logger: customLogger });
      resetCalendarConfig();
      const logger = getLogger();
      expect(logger).not.toBe(customLogger);
    });
  });

  describe('getLogger', () => {
    it('should return default logger when none configured', () => {
      const logger = getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should return custom logger when configured', () => {
      const customLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
      configureCalendar({ logger: customLogger });
      expect(getLogger()).toBe(customLogger);
    });
  });

  describe('getLoadEvents', () => {
    it('should return a no-op loader when none configured', async () => {
      const loader = getLoadEvents();
      const events = await loader();
      expect(events).toEqual([]);
    });

    it('should return configured loader', async () => {
      const mockEvents = [
        {
          slug: 'event-1',
          content: 'Content 1',
          frontmatter: { title: 'Event 1' },
        },
      ];
      configureCalendar({ loadEvents: async () => mockEvents });
      const loader = getLoadEvents();
      const events = await loader();
      expect(events).toHaveLength(1);
      expect(events[0].slug).toBe('event-1');
    });
  });
});
