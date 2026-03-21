import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>) {
  return (
    <button {...props} className={`${styles.button} ${styles[variant]} ${className}`.trim()}>
      {children}
    </button>
  );
}
