import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import buttonStyles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";

export function ButtonLink({
  to,
  variant = "primary",
  children,
  className = "",
}: PropsWithChildren<{ to: string; variant?: Variant; className?: string }>) {
  return (
    <Link to={to} className={`${buttonStyles.button} ${buttonStyles[variant]} ${className}`.trim()}>
      {children}
    </Link>
  );
}
