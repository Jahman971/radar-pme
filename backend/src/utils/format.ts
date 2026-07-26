/**
 * Formate un montant en euros lisible
 */
export function formatEuros(amount: number | null): string {
  if (amount === null || amount === undefined) return 'NC';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')} M€`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)} k€`;
  }
  return `${sign}${abs.toLocaleString('fr-FR')} €`;
}

/**
 * Variation en % arrondie à 1 décimale
 */
export function formatPct(value: number | null): string {
  if (value === null || value === undefined) return 'NC';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} %`;
}

/**
 * Génère le label du score
 */
export function scoreLabel(score: number): string {
  if (score >= 60) return 'Rupture forte';
  if (score >= 30) return 'Rupture modérée';
  return 'Stable';
}

export function scoreColor(score: number): 'red' | 'orange' | 'green' {
  if (score >= 60) return 'red';
  if (score >= 30) return 'orange';
  return 'green';
}
