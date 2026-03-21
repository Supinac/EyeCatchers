import styles from "./ConfigTileGroup.module.css";

export type TileOption<T extends string | number> = {
    id: T;
    label: string;
    description: string;
};

export function ConfigTileGroup<T extends string | number>({
    title,
    options,
    selected,
    onChange,
    columns,
}: {
    title: string;
    options: TileOption<T>[];
    selected: T;
    onChange: (value: T) => void;
    columns?: number;
}) {
    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <div
                className={styles.grid}
                style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
            >
                {options.map((option) => (
                    <button
                        key={String(option.id)}
                        type="button"
                        className={`${styles.tile} ${selected === option.id ? styles.tileSelected : ""}`}
                        onClick={() => onChange(option.id)}
                        aria-pressed={selected === option.id}
                    >
                        <span className={styles.tileLabel}>{option.label}</span>
                        <span className={styles.tileDescription}>{option.description}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}