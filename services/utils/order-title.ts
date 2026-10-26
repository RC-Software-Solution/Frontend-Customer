import { Order } from '../types/api.types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Mon, 26 Oct, Lunch" from the meal's own date (YYYY-MM-DD, or a full ISO string: only its first 10 characters are read), read from its parts so no timezone can shift the day.
// ponytail: the created_at fallback takes its UTC date, which can be a day off Colombo late in the evening; target_date is always present in practice.
export const mealTitle = (o: Pick<Order, 'target_date' | 'created_at' | 'meal_time'>) => {
  const [y, m, d] = String(o.target_date || o.created_at).slice(0, 10).split('-').map(Number);
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${day}, ${d} ${MONTHS[m - 1]}, ${o.meal_time.charAt(0).toUpperCase()}${o.meal_time.slice(1)}`;
};
