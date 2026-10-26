// Expected refusals (a 4xx answer, or no connection) log at warn level, so React Native's LogBox shows a
// yellow toast instead of the red full-screen overlay. Anything else (a 5xx, a thrown Error) stays an error.
export const logApiError = (label: string, error: any) => {
  const expected = error?.status === 0 || (error?.status >= 400 && error?.status < 500);
  (expected ? console.warn : console.error)(label, error);
};
