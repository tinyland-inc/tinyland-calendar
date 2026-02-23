








import type {
  RecurringPattern,
  RecurringEventForm,
  RRuleValidationResult,
} from './types.js';

export class RRuleGenerator {
  
  
  

  


  fromPattern(_pattern: RecurringPattern): string {
    throw new Error('Not implemented: fromPattern');
  }

  


  fromForm(_data: RecurringEventForm): string {
    throw new Error('Not implemented: fromForm');
  }

  
  
  

  


  toPattern(_rrule: string): RecurringPattern {
    throw new Error('Not implemented: toPattern');
  }

  


  toHumanReadable(_rrule: string): string {
    throw new Error('Not implemented: toHumanReadable');
  }

  
  
  

  


  validate(_rrule: string): RRuleValidationResult {
    throw new Error('Not implemented: validate');
  }

  
  
  

  


  calculateOccurrences(
    _dtstart: Date,
    _rrule: string,
    _until?: Date,
    _count?: number
  ): Date[] {
    throw new Error('Not implemented: calculateOccurrences');
  }

  
  
  

  


  private buildByDay(_weekdays: string[]): string {
    throw new Error('Not implemented: buildByDay');
  }

  


  private buildEndCondition(_count?: number, _until?: string): string {
    throw new Error('Not implemented: buildEndCondition');
  }

  


  private formatUntilDate(_date: string): string {
    throw new Error('Not implemented: formatUntilDate');
  }
}
