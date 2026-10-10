/**
 * View-model for the home screen's meal tabs.
 *
 * The server decides what "today" is (Sri Lanka date) and whether each session is
 * upcoming, open or closed, using its own clock, so nothing here depends on the
 * phone's clock or timezone. This file only turns that answer into what to render.
 */
import { FoodItem, TodayMenu } from '../types/api.types';

export type MealType = 'breakfast' | 'lunch' | 'dinner';
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export type TabView = {
  /** 'empty' = nothing published for this meal today */
  state: 'upcoming' | 'open' | 'closed' | 'empty';
  /** only an open session can be ordered from */
  orderable: boolean;
  sessionDate: string | null;
  veg: FoodItem[];
  nonVeg: FoodItem[];
  /** short text under the tab title */
  hint: string;
  /** explanation shown above the items when ordering isn't possible */
  banner: string | null;
};

// ponytail: fixed +05:30 like the backend helper; Sri Lanka has no DST.
const OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date (YYYY-MM-DD) in Sri Lanka, for the rare fallback when an order has no date. */
export const colomboToday = (now: Date = new Date()): string =>
  new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);

const nextDate = (date: string): string => new Date(Date.parse(`${date}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);

/** '18:00:00' -> '6:00 PM' */
export const formatClock = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const label = (meal: MealType) => meal.charAt(0).toUpperCase() + meal.slice(1);

export function buildTabs(menu: TodayMenu): Record<MealType, TabView> {
  const tabs = {} as Record<MealType, TabView>;

  for (const meal of MEAL_TYPES) {
    const session = menu.sessions[meal];

    if (!session) {
      tabs[meal] = {
        state: 'empty',
        orderable: false,
        sessionDate: null,
        veg: [],
        nonVeg: [],
        hint: 'No menu',
        banner: `No ${label(meal).toLowerCase()} menu has been published for today.`,
      };
      continue;
    }

    const foods = session.items.map((i) => i.foodItem).filter((f): f is FoodItem => !!f);
    const base = {
      orderable: session.state === 'open',
      sessionDate: session.date,
      veg: foods.filter((f) => f.meal_type === 'veg'),
      nonVeg: foods.filter((f) => f.meal_type === 'non-veg'),
    };

    if (session.state === 'open') {
      tabs[meal] = { ...base, state: 'open', hint: 'Open now', banner: null };
    } else if (session.state === 'upcoming') {
      const opens = formatClock(session.start_time);
      tabs[meal] = { ...base, state: 'upcoming', hint: `Opens ${opens}`, banner: `Ordering opens today at ${opens}.` };
    } else {
      tabs[meal] = {
        ...base,
        state: 'closed',
        hint: 'Closed',
        banner: `Ordering closed today at ${formatClock(session.end_time)}.`,
      };
    }
  }
  return tabs;
}

/**
 * Milliseconds (by the server's clock) until something on screen changes: a session opens,
 * a session closes, or the Sri Lanka day rolls over. null if nothing is ahead.
 */
export function nextTransitionMs(menu: TodayMenu): number | null {
  const now = Date.parse(menu.now);
  const upcoming: number[] = [Date.parse(`${nextDate(menu.date)}T00:00:00+05:30`)];
  for (const meal of MEAL_TYPES) {
    const s = menu.sessions[meal];
    if (!s) continue;
    upcoming.push(Date.parse(s.opens_at), Date.parse(s.closes_at));
  }
  const ahead = upcoming.filter((t) => t > now);
  return ahead.length ? Math.min(...ahead) - now : null;
}
