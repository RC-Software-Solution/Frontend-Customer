import { buildTabs, nextTransitionMs, formatClock, colomboToday } from '../menu/todayMenu';
import { TodayMenu, TodaySession } from '../types/api.types';

const food = (id: number, meal_type: 'veg' | 'non-veg' | 'other', name = `Food ${id}`) =>
  ({ id, name, description: '', price: '300', meal_type, created_at: '', updated_at: '' }) as any;

const session = (over: Partial<TodaySession> & { meal_time: TodaySession['meal_time'] }): TodaySession => ({
  id: 1,
  date: '2026-10-11',
  start_time: '06:00:00',
  end_time: '09:30:00',
  state: 'open',
  opens_at: '2026-10-11T00:30:00.000Z',
  closes_at: '2026-10-11T04:00:00.000Z',
  items: [],
  ...over,
});

const menu = (sessions: Partial<TodayMenu['sessions']>, now = '2026-10-11T02:00:00.000Z'): TodayMenu => ({
  date: '2026-10-11',
  now,
  sessions: { breakfast: null, lunch: null, dinner: null, ...sessions },
});

describe('buildTabs', () => {
  it('an unpublished meal is an empty tab with an explanation (e.g. Sunday breakfast missing)', () => {
    const t = buildTabs(menu({ lunch: session({ meal_time: 'lunch' }) })).breakfast;
    expect(t.state).toBe('empty');
    expect(t.orderable).toBe(false);
    expect(t.veg).toEqual([]);
    expect(t.banner).toMatch(/no breakfast menu has been published for today/i);
  });

  it('an open session is orderable, shows its items split into veg and non-veg, and has no banner', () => {
    const items = [
      { id: 1, food_item_id: 1, available_quantity: 5, foodItem: food(1, 'veg') },
      { id: 2, food_item_id: 2, available_quantity: 5, foodItem: food(2, 'non-veg') },
      { id: 3, food_item_id: 3, available_quantity: 5, foodItem: food(3, 'other') },
    ];
    const t = buildTabs(menu({ breakfast: session({ meal_time: 'breakfast', items }) })).breakfast;
    expect(t.state).toBe('open');
    expect(t.orderable).toBe(true);
    expect(t.banner).toBeNull();
    expect(t.hint).toBe('Open now');
    expect(t.veg.map((f) => f.id)).toEqual([1]);
    expect(t.nonVeg.map((f) => f.id)).toEqual([2]);
    expect(t.sessionDate).toBe('2026-10-11');
  });

  it('an upcoming session is visible but not orderable, and says when it opens', () => {
    const items = [{ id: 1, food_item_id: 1, available_quantity: 5, foodItem: food(1, 'veg') }];
    const t = buildTabs(menu({ dinner: session({ meal_time: 'dinner', state: 'upcoming', start_time: '18:00:00', items }) })).dinner;
    expect(t.state).toBe('upcoming');
    expect(t.orderable).toBe(false);
    expect(t.hint).toBe('Opens 6:00 PM');
    expect(t.banner).toBe('Ordering opens today at 6:00 PM.');
    expect(t.veg).toHaveLength(1); // still listed, shown disabled
  });

  it('a closed session is visible but not orderable, and says when it closed', () => {
    const t = buildTabs(menu({ breakfast: session({ meal_time: 'breakfast', state: 'closed', end_time: '09:30:00' }) })).breakfast;
    expect(t.state).toBe('closed');
    expect(t.orderable).toBe(false);
    expect(t.banner).toBe('Ordering closed today at 9:30 AM.');
  });

  it('ignores session items whose food details are missing', () => {
    const items = [{ id: 1, food_item_id: 1, available_quantity: 1, foodItem: undefined }];
    expect(buildTabs(menu({ lunch: session({ meal_time: 'lunch', items }) })).lunch.veg).toEqual([]);
  });
});

describe('formatClock', () => {
  it.each([
    ['00:00:00', '12:00 AM'],
    ['06:05:00', '6:05 AM'],
    ['12:00:00', '12:00 PM'],
    ['18:00:00', '6:00 PM'],
    ['23:59:00', '11:59 PM'],
  ])('%s -> %s', (input, expected) => expect(formatClock(input)).toBe(expected));
});

describe('nextTransitionMs', () => {
  const NOW = '2026-10-11T02:00:00.000Z'; // 07:30 Colombo

  it('is the time to the nearest open/close, by the server clock', () => {
    const m = menu(
      {
        breakfast: session({ meal_time: 'breakfast', opens_at: '2026-10-11T00:30:00.000Z', closes_at: '2026-10-11T04:00:00.000Z' }),
        lunch: session({ meal_time: 'lunch', opens_at: '2026-10-11T05:30:00.000Z', closes_at: '2026-10-11T08:30:00.000Z' }),
      },
      NOW
    );
    expect(nextTransitionMs(m)).toBe(2 * 60 * 60 * 1000); // breakfast closes at 04:00Z
  });

  it('ignores moments already in the past', () => {
    const m = menu({ breakfast: session({ meal_time: 'breakfast', opens_at: '2026-10-11T00:30:00.000Z', closes_at: '2026-10-11T01:00:00.000Z' }) }, NOW);
    // nothing left today but midnight in Colombo (18:30Z) rolls the day over
    expect(nextTransitionMs(m)).toBe(Date.parse('2026-10-11T18:30:00.000Z') - Date.parse(NOW));
  });

  it('with nothing published it still wakes at Colombo midnight to switch to the next day', () => {
    expect(nextTransitionMs(menu({}, NOW))).toBe(16.5 * 60 * 60 * 1000);
  });
});

describe('colomboToday', () => {
  it('uses the Sri Lanka date, not the UTC date', () => {
    expect(colomboToday(new Date('2026-10-10T18:29:59Z'))).toBe('2026-10-10');
    expect(colomboToday(new Date('2026-10-10T18:30:00Z'))).toBe('2026-10-11');
  });
});
