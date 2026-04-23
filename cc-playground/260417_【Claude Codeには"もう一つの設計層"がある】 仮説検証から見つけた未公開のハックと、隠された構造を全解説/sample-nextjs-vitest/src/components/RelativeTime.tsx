import type { FC } from "react";
import { formatRelativeTime } from "../lib/formatRelativeTime";

export interface RelativeTimeProps {
  date: Date | number;
  now?: Date | number;
  className?: string;
}

export const RelativeTime: FC<RelativeTimeProps> = ({ date, now, className }) => {
  const iso =
    date instanceof Date ? date.toISOString() : new Date(date).toISOString();
  const label = formatRelativeTime(date, now);

  return (
    <time dateTime={iso} className={className}>
      {label}
    </time>
  );
};
