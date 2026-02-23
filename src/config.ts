




















export interface CalendarLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}





export interface EventContentLike {
  slug: string;
  content: string;
  frontmatter: {
    title: string;
    startDate?: string;
    startDateTime?: string;
    date?: string;
    endDate?: string;
    endDateTime?: string;
    excerpt?: string;
    organizer?: string | { name?: string; email?: string };
    location?: string | { name?: string; address?: string };
    categories?: string[];
    registrationUrl?: string;
    calendarUid?: string;
    recurrence?: string;
    contactEmail?: string;
    [key: string]: unknown;
  };
}




export interface CalendarConfig {
  
  logger?: CalendarLogger;
  
  calDavUrl?: string;
  
  calDavUsername?: string;
  
  calDavPassword?: string;
  
  dataDir?: string;
  



  loadEvents?: () => Promise<EventContentLike[]>;
}

const defaultLogger: CalendarLogger = {
  info: (msg, meta) => console.log(`[calendar] ${msg}`, meta ?? ''),
  warn: (msg, meta) => console.warn(`[calendar] ${msg}`, meta ?? ''),
  error: (msg, meta) => console.error(`[calendar] ${msg}`, meta ?? ''),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[calendar:debug] ${msg}`, meta ?? '');
    }
  },
};

let config: CalendarConfig = {};




export function configureCalendar(c: CalendarConfig): void {
  config = { ...config, ...c };
}




export function getCalendarConfig(): CalendarConfig {
  return config;
}




export function resetCalendarConfig(): void {
  config = {};
}




export function getLogger(): CalendarLogger {
  return config.logger ?? defaultLogger;
}




export function getLoadEvents(): () => Promise<EventContentLike[]> {
  return config.loadEvents ?? (async () => []);
}
