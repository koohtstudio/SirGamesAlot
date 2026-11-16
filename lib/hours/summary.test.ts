import { describe, expect, it } from 'vitest';
import { DEFAULT_HOURS } from './hours';
import { summarizeWeeklyHours } from './summary';

describe('summarizeWeeklyHours', () => {
  it('joins days with the same hours', () => {
    expect(summarizeWeeklyHours(DEFAULT_HOURS)).toBe(
      'Mon–Fri 9:30 am – 9 pm · Sat 9:30 am – 6 pm · Sun 11 am – 5 pm',
    );
  });
  it('splits a run when one day differs and shows closed days', () => {
    const weekly = { ...DEFAULT_HOURS, '3': null, '0': null };
    expect(summarizeWeeklyHours(weekly)).toBe(
      'Mon–Tue 9:30 am – 9 pm · Wed Closed · Thu–Fri 9:30 am – 9 pm · Sat 9:30 am – 6 pm · Sun Closed',
    );
  });
});
