/**
 * Format the difference between `input` and `now` as a human-readable
 * relative time string (e.g. "5 minutes ago", "in 1 hour", "just now").
 */
export function formatRelativeTime(
  input: Date | number,
  now?: Date | number,
): string {
  const inputMs = toMs(input, "input");
  const nowMs = now === undefined ? Date.now() : toMs(now, "now");

  const diffSec = Math.floor((nowMs - inputMs) / 1000);
  const absSec = Math.abs(diffSec);
  const isFuture = diffSec < 0;

  if (absSec < 5) return "just now";

  const [count, unit] = pickUnit(absSec);
  const label = count === 1 ? unit : `${unit}s`;

  return isFuture ? `in ${count} ${label}` : `${count} ${label} ago`;
}

function toMs(value: Date | number, paramName: "input" | "now"): number {
  if (value instanceof Date) {
    const ms = value.getTime();
    if (Number.isNaN(ms)) {
      throw new RangeError(`formatRelativeTime: ${paramName} is an invalid Date`);
    }
    return ms;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new RangeError(
        `formatRelativeTime: ${paramName} must be a finite number`,
      );
    }
    return value;
  }
  throw new TypeError(
    `formatRelativeTime: ${paramName} must be Date or number`,
  );
}

function pickUnit(absSec: number): [number, string] {
  if (absSec < 60) return [absSec, "second"];
  if (absSec < 3600) return [Math.floor(absSec / 60), "minute"];
  if (absSec < 86400) return [Math.floor(absSec / 3600), "hour"];
  if (absSec < 604800) return [Math.floor(absSec / 86400), "day"];
  if (absSec < 2592000) return [Math.floor(absSec / 604800), "week"];
  if (absSec < 31536000) return [Math.floor(absSec / 2592000), "month"];
  return [Math.floor(absSec / 31536000), "year"];
}
