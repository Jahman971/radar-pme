import { ScoringParams } from '../../types';

/**
 * Paramètres par défaut du score de rupture de trajectoire.
 * Ces valeurs peuvent être surchargées via la table ScoringConfig en base.
 */
export const DEFAULT_SCORING_PARAMS: ScoringParams = {
  // ─── Variation CA ───────────────────────────────────────────────────────
  revenue_drop_mild: 10,          // -10 à -20% → 10 pts
  revenue_drop_moderate: 20,      // -20 à -30% → 20 pts
  revenue_drop_significant: 30,   // -30 à -50% → 30 pts
  revenue_drop_severe: 40,        // < -50%     → 40 pts

  // ─── Résultat net ───────────────────────────────────────────────────────
  income_drop_threshold: 30,      // seuil de baisse (%) déclenchant les points
  income_drop_points: 10,         // baisse > 30% → 10 pts
  income_turns_negative_points: 20,       // devient négatif → 20 pts
  income_two_years_negative_points: 25,   // négatif 2 années → 25 pts (cumulatif)

  // ─── Effectif ───────────────────────────────────────────────────────────
  employee_drop_mild: 5,          // baisse > 10% → 5 pts
  employee_drop_severe: 10,       // baisse > 20% → 10 pts

  // ─── Événements ─────────────────────────────────────────────────────────
  event_management_change: 5,     // changement dirigeant → 5 pts
  event_branch_closure: 10,       // fermeture établissement → 10 pts
  // Note : procédure collective → affichage dédié, non intégré au score global
};
