import type { WeeklyHours } from '@/lib/domain/types';
import { WEEKDAY_NAMES, WEEK_ORDER, formatRange } from './hours';

const short = (d: number) => WEEKDAY_NAMES[d]!.slice(0, 3);

/**
 * One line for the hero and footer: "Mon–Fri 9:30 am – 9 pm · Sat 9:30 am – 6 pm · Sun 11 am – 5 pm".
 * Runs of days with the same hours are joined. Reads from the settings, so it never drifts from the Visit page.
 */
export function summarizeWeeklyHours(weekly: WeeklyHours): string {
  const groups: { days: number[]; text: string }[] = [];
  for (const d of WEEK_ORDER) {
    const text = formatRange(weekly[String(d) as keyof WeeklyHours]);
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.days.push(d);
    else groups.push({ days: [d], text });
  }
  return groups
    .map((g) => {
      const first = g.days[0]!;
      const lastDay = g.days[g.days.length - 1]!;
      const label = g.days.length === 1 ? short(first) : `${short(first)}–${short(lastDay)}`;
      return `${label} ${g.text}`;
    })
    .join(' · ');
}
