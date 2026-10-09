import { describe, expect, it } from 'vitest';
import { calendarDate, calendarToday, calendarValue } from '../../src/components/ui/date-value';

describe('calendar presentation preserves civil values', () => {
  it.each(['2026-01-31','2024-02-29','1000-01-01','9998-12-31'])('round-trips %s without UTC conversion', value => {
    expect(calendarValue(calendarDate(value)!, 'date', '')).toBe(value);
  });
  it.each(['2026-02-29','2026-04-31','2026-13-01','','2026-01'])('rejects invalid civil value %s', value => {
    expect(calendarDate(value)).toBeUndefined();
  });
  it('keeps the complete local time when choosing another civil day', () => {
    expect(calendarValue(calendarDate('2026-11-01')!, 'datetime-local', '2026-10-31T23:45:30')).toBe('2026-11-01T23:45:30');
  });
  it('uses the profile timezone for today at the month boundary', () => {
    const instant=new Date('2026-11-01T01:30:00Z');
    expect(calendarValue(calendarToday('America/Sao_Paulo',instant),'date','')).toBe('2026-10-31');
    expect(calendarValue(calendarToday('Pacific/Auckland',instant),'date','')).toBe('2026-11-01');
  });
  it('does not convert a DST civil day or time to an instant', () => {
    const instant=new Date('2026-11-01T05:30:00Z');
    expect(calendarValue(calendarToday('America/New_York',instant),'datetime-local','2026-10-31T01:30')).toBe('2026-11-01T01:30');
  });
});
