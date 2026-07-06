"use client";

import { useTheme } from "../../lib/theme-context";
import { DiscIcon } from "./DiscIcon";

/** DiscIcon that follows the site's current theme - for one-off decorative accents dropped into server-component pages. */
export function ThemedDiscIcon({
  size,
  className,
  spin,
}: {
  size?: number;
  className?: string;
  spin?: boolean;
}) {
  const { theme } = useTheme();
  return <DiscIcon variant={theme} size={size} className={className} spin={spin} />;
}
