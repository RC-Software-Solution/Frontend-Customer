import { mealTitle } from '../utils/order-title';

const o = (over: Record<string, any> = {}) =>
  ({ target_date: '2026-10-26', meal_time: 'lunch', created_at: '2026-10-20T08:00:00.000Z', ...over }) as any;

describe('mealTitle', () => {
  it('reads the weekday, day and month from the meal date', () => {
    expect(mealTitle(o())).toBe('Mon, 26 Oct, Lunch');
  });

  it('does not drift across a timezone at the start of a year', () => {
    expect(mealTitle(o({ target_date: '2026-01-01', meal_time: 'breakfast' }))).toBe('Thu, 1 Jan, Breakfast');
  });

  it('copes with a full ISO target_date', () => {
    expect(mealTitle(o({ target_date: '2026-10-26T00:00:00.000Z' }))).toBe('Mon, 26 Oct, Lunch');
  });

  it('falls back to the date part of created_at without a target_date', () => {
    expect(mealTitle(o({ target_date: undefined, created_at: '2026-10-25T08:00:00.000Z', meal_time: 'dinner' }))).toBe('Sun, 25 Oct, Dinner');
  });
});
