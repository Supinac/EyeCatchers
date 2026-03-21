import type { PropsWithChildren, ReactNode } from "react";
import styles from "./PageLayout.module.css";

export function PageLayout({ title, actions, children }: PropsWithChildren<{ title: string; actions?: ReactNode }>) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
        </div>
        <div className={styles.actions}>{actions}</div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
