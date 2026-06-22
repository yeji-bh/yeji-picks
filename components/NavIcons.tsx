import Link from "next/link";

type IconProps = { className?: string };

export const NAV_ACTION_CLASS =
  "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-2 text-sm text-foreground-secondary transition-colors hover:bg-subtle";

export function IconSubmit({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M12 4v9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 8.5 12 5l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClipboard({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHeart({
  className = "h-[18px] w-[18px]",
  filled = false,
  strokeWidth = 1.5,
}: IconProps & { filled?: boolean; strokeWidth?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBook({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconInfo({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconGlobe({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" strokeLinecap="round" />
      <path
        d="M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9c-2.5-2.8-4-6-4-9s1.5-6.2 4-9z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconRankings({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 20V10" strokeLinecap="round" />
      <path d="M10 20V4" strokeLinecap="round" />
      <path d="M16 20v-7" strokeLinecap="round" />
      <path d="M22 20H2" strokeLinecap="round" />
    </svg>
  );
}

export function IconGallery({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconMessage({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconUser({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path
        d="M5.5 19.5c0-3 2.9-5.5 6.5-5.5s6.5 2.5 6.5 5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconLogout({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSort({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 7h16M4 12h10M4 17h6" strokeLinecap="round" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="17" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NavItem({
  href,
  icon,
  label,
  onClick,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={NAV_ACTION_CLASS}
        title={label}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link href={href!} className={NAV_ACTION_CLASS} title={label}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
