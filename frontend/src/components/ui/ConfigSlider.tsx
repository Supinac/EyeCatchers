import styles from "./ConfigSlider.module.css";

export function ConfigSlider({
  title,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
  children,
}: {
  title: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  children?: React.ReactNode; // slot pro vizualizaci vedle slideru
}) {
  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <section className={styles.section}>
      <div className={styles.sliderHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {hint && <p className={styles.hint}>{hint}</p>}
        </div>
        <div className={styles.valueBox}>{displayValue}</div>
      </div>
      <div className={styles.panel}>
        <input
          className={styles.slider}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className={styles.scale}>
          <span>{formatValue ? formatValue(min) : min}</span>
          <span>{formatValue ? formatValue(max) : max}</span>
        </div>
        {children}
      </div>
    </section>
  );
}