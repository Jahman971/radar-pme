'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Building2, Users, TrendingDown, TrendingUp, Minus, BookmarkPlus, BookmarkCheck, AlertTriangle } from 'lucide-react';
import { CompanyListItem, formatEuros, formatPct, employeeLabel, eventTypeLabel, api } from '@/lib/api';
import { ScoreBadge, ScoreBar } from './ScoreBadge';
import clsx from 'clsx';

interface CompanyCardProps {
  company: CompanyListItem;
  onWatchlistChange?: () => void;
  isInWatchlist?: boolean;
}

export function CompanyCard({ company, onWatchlistChange, isInWatchlist = false }: CompanyCardProps) {
  const [inList, setInList] = useState(isInWatchlist);
  const [loading, setLoading] = useState(false);

  const revenueChange = company.revenueChange1Y;
  const hasBoth = company.latestRevenue !== null && company.previousRevenue !== null;

  const hasProcedure = company.recentEvents.some(e => e.eventType === 'PROCEDURE_COLLECTIVE');
  const otherEvents = company.recentEvents.filter(e => e.eventType !== 'PROCEDURE_COLLECTIVE');

  async function toggleWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (inList) {
        await api.watchlist.remove(company.id);
        setInList(false);
      } else {
        await api.watchlist.add(company.id);
        setInList(true);
      }
      onWatchlistChange?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <Link href={`/companies/${company.siren}`} className="hover:text-blue-600 transition-colors">
            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">{company.name}</h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <MapPin size={13} className="flex-shrink-0" />
            <span>{company.city ?? '—'}</span>
            {company.distanceKm !== null && (
              <span className="text-gray-400">· {company.distanceKm.toFixed(0)} km</span>
            )}
            {!company.active && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Fermée</span>
            )}
          </div>
        </div>
        <ScoreBadge score={company.score} size="sm" />
      </div>

      {/* Secteur + effectif */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Building2 size={12} />
          <span className="truncate max-w-[180px]">{company.nafLabel}</span>
        </div>
        {company.employeeRange && (
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{employeeLabel(company.employeeRange)} sal.</span>
          </div>
        )}
      </div>

      {/* Financials */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">CA {company.latestFiscalYear ?? '—'}</div>
          <div className="font-semibold text-gray-900">{formatEuros(company.latestRevenue)}</div>
          {hasBoth && (
            <div className="text-xs text-gray-400 mt-0.5">
              vs {formatEuros(company.previousRevenue)}
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Variation CA</div>
          <div className={clsx('font-semibold flex items-center gap-1', {
            'text-green-700': revenueChange !== null && revenueChange > 0,
            'text-red-700': revenueChange !== null && revenueChange < -10,
            'text-orange-700': revenueChange !== null && revenueChange <= 0 && revenueChange >= -10,
            'text-gray-500': revenueChange === null,
          })}>
            {revenueChange !== null ? (
              <>
                {revenueChange > 0 ? <TrendingUp size={14} /> : revenueChange < -5 ? <TrendingDown size={14} /> : <Minus size={14} />}
                {formatPct(revenueChange)}
              </>
            ) : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Résultat : {formatEuros(company.latestNetIncome)}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Score de rupture</div>
        <ScoreBar score={company.score} />
      </div>

      {/* Procédure collective — alerte dédiée */}
      {hasProcedure && (
        <div className="flex items-center gap-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-3">
          <AlertTriangle size={13} className="flex-shrink-0" />
          <span>Procédure collective en cours — voir fiche</span>
        </div>
      )}

      {/* Événements récents (hors procédure) */}
      {otherEvents.length > 0 && (
        <div className="mb-4 space-y-1">
          {otherEvents.slice(0, 2).map((evt) => (
            <div key={evt.eventDate + evt.eventType} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
              <span>{eventTypeLabel(evt.eventType)}</span>
              <span className="text-gray-400">
                {new Date(evt.eventDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Link
          href={`/companies/${company.siren}`}
          className="flex-1 text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
        >
          Voir l'analyse
        </Link>
        <button
          onClick={toggleWatchlist}
          disabled={loading}
          className={clsx(
            'flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors border',
            inList
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          {inList ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
          {inList ? 'Dans ma liste' : 'Ajouter'}
        </button>
      </div>
    </div>
  );
}
