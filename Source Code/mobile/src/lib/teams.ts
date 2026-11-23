/** Accept only HTTPS Microsoft Teams meeting hosts before handing URLs to the OS. */
export const isTeamsMeetingUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)teams\.(microsoft\.com|live\.com)$/i.test(url.hostname);
  } catch { return false; }
};
