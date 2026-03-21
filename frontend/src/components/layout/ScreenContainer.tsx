import type { PropsWithChildren } from "react";
import styles from "./ScreenContainer.module.css";

export function ScreenContainer({ children }: PropsWithChildren) {
  return <div className={styles.container}>{children}</div>;
}
