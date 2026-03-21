/**
 * Logický otisk klíče. 
 * Slouží jako jediný zdroj pravdy pro porovnávání i vykreslování.
 */
export interface KeyBlueprint {
  // --- IDENTITA (Esence) ---
  /** Unikátní ID instance pro potřeby herní smyčky a eventů */
  readonly id: string;
  
  /** * Klíčový parametr identity. 
   * Počet zubů (1-5). Shoda v tomto čísle znamená shodu klíčů.
   */
  readonly teethCount: number;

  /** Příznak, zda tento klíč patří do cílové skupiny (target) nebo je distraktorem */
  readonly isTarget: boolean;

  // --- VIZUÁLNÍ TRANSFORMACE (Šum) ---
  /** Metadata, která neovlivňují logiku, pouze zobrazení */
  readonly visualMetadata: {
    readonly rotation: number;   // Úhel v radiánech nebo stupních
    readonly isMirrored: boolean; // Zrcadlení zubů v ose Y (směr zubů)
    readonly scale: number;       // Měřítko (velikost celého klíče)
    readonly opacity: number;     // Případná průhlednost (pokud by byla v configu)
  };
}