'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  api, CompanyDetail, formatEuros, formatPct,
  employeeLabel, eventTypeLabel, scoreColor, scoreLabel,
} from '@/lib/api';
import { RevenueChart, NetIncomeChart } from '@/components/charts/FinancialChart';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import {
  ArrowLeft, Building2, MapPin, Users, Calendar, BookmarkPlus, BookmarkCheck,
  AlertTriangle, ExternalLink, TrendingDown, TrendingUp, Minus, Info,
} from 'lucide-react';
import clsx from 'clsx';

const EVENT_COLORS: Record<string, string> = {
  PROCEDURE_COLLECTIVE: 'bg-red-100 text-red-700 border-red-200',
  CHANGEMENT_DIRIGEANT: 'bg-orange-100 text-orange-700 border-orange-200',
  FERMETURE_ETABLISSEMENT: 'bg-orange-100 text-orange-700 border-orange-200',
  RADIATION: 'bg-red-100 text-red-700 border-red-200',
  CESSION: 'bg-purple-100 text-purple-700 border-purple-200',
  CREATION: 'bg-green-100 text-green-700 border-green-200',
  DEPOT_COMPTES: 'bg-blue-50 text-blue-600 border-blue-200',
  MODIFICATION: 'bg-gray-100 text-gray-600 border-gray-200',
  AUTRE: 'bg-gray-100 text-gray-600 border-gray-200',
};

function VariationBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-400">—</span>;
  const color = value > 0 ? 'text-green-700' : value < -10 ? 'text-red-700' : 'text-orange-700';
  const Icon = value > 0 ? TrendingUp : value < -5 ? TrendingDown : Minus;
  return (
    <span className={clsx('flex items-center gap-1 font-semibold', color)}>
      <Icon size={14} />
      {formatPct(value)}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function CompanyDetailPage() {
  const { siren } = useParams<{ siren: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    if (!siren) return;
    setLoading(true);
    api.companies.getBySiren(siren)
      .then((data) => { setCompany(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });

    // Vérifier si dans la watchlist
    api.watchlist.get().then((list) => {
      if (list.some((c) => c.siren === siren)) setInWatchlist(true);
    }).catch(() => {});
  }, [siren]);

  async function toggleWatchlist() {
    if (!company) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await api.watchlist.remove(company.id);
        setInWatchlist(false);
      } else {
        await api.watchlist.add(company.id);
        setInWatchlist(true);
      }
    } finally {
      setWatchlistLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-gray-400">Chargement de la fiche...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 text-sm mb-4">{error ?? 'Entreprise introuvable'}</p>
        <button onClick={() => router.back()} className="text-blue-600 text-sm hover:underline">
          ← Retour
        </button>
      </div>
    );
  }

  const sorted3 = [...company.financialStatements].sort((a, b) => b.fiscalYear - a.fiscalYear).slice(0, 3);
  const latest = sorted3[0];
  const previous = sorted3[1];
  const hasProcedure = company.events.some((e) => e.eventType === 'PROCEDURE_COLLECTIVE');
  const score = company.trajectoryScore;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Retour */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Retour aux résultats
      </button>

      {/* Header entreprise */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!company.active && (
                <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">Fermée</span>
              )}
              {hasProcedure && (
                <span className="flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={11} /> Procédure collective
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">SIREN {company.siren}</span>
              {company.legalForm && <span>{company.legalForm}</span>}
              {company.headquartersAddress && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {company.headquartersAddress}, {company.postalCode} {company.city}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleWatchlist}
            disabled={watchlistLoading}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors flex-shrink-0',
              inWatchlist
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {inWatchlist ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
            {inWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
          </button>
        </div>

        {/* Identité */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
          <StatCard
            label="Secteur d'activité"
            value={<span className="text-sm">{company.nafLabel}</span>}
            sub={`Code NAF ${company.nafCode}`}
          />
          <StatCard
            label="Effectif estimé"
            value={employeeLabel(company.employeeRange)}
            sub="salariés"
          />
          <StatCard
            label="Statut"
            value={company.active ? 'Active' : 'Fermée'}
          />
          <StatCard
            label="Dernière mise à jour"
            value={new Date(company.updatedAt).toLocaleDateString('fr-FR')}
          />
        </div>
      </div>

      {/* Score de rupture */}
      {score && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Score de rupture de trajectoire</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className={clsx(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0',
              score.color === 'red' ? 'bg-red-50 text-red-700' :
              score.color === 'orange' ? 'bg-orange-50 text-orange-700' :
              'bg-green-50 text-green-700'
            )}>
              {score.score}
            </div>
            <div>
              <ScoreBadge score={score.score} size="lg" />
              <p className="text-xs text-gray-400 mt-1.5">
                Calculé le {new Date(score.calculatedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Décomposition du score */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Variation CA 1 an" value={<VariationBadge value={score.revenueChange1Y} />} />
            <StatCard label="Variation CA 2 ans" value={<VariationBadge value={score.revenueChange2Y} />} />
            <StatCard label="Évolution résultat" value={<VariationBadge value={score.netIncomeChange} />} />
            <StatCard label="Points événements" value={`+${score.eventScore}`} sub="sur score total" />
          </div>
        </div>
      )}

      {/* Analyse textuelle */}
      {company.trajectoryAnalysis && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-5">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-blue-700 mb-1.5 uppercase tracking-wide">Analyse de trajectoire</div>
              <p className="text-sm text-blue-900 leading-relaxed">{company.trajectoryAnalysis}</p>
              <p className="text-xs text-blue-500 mt-2">
                Cette analyse est générée de façon déterministe à partir des données observables.
                Elle ne constitue pas un avis financier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Graphiques */}
      {sorted3.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Trajectoire financière</h2>

          {/* Tableau des 3 derniers exercices */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Exercice</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 pr-4">Chiffre d'affaires</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 pr-4">Variation</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 pr-4">Résultat net</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {sorted3.map((fs, i) => {
                  const prev = sorted3[i + 1];
                  const change = fs.revenue && prev?.revenue
                    ? ((fs.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100
                    : null;
                  return (
                    <tr key={fs.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{fs.fiscalYear}</td>
                      <td className="py-3 pr-4 text-right">{formatEuros(fs.revenue)}</td>
                      <td className="py-3 pr-4 text-right">
                        {change !== null ? (
                          <span className={clsx('text-xs font-medium', {
                            'text-green-700': change > 0,
                            'text-red-700': change < -10,
                            'text-orange-700': change <= 0 && change >= -10,
                          })}>
                            {formatPct(change)}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className={clsx('py-3 pr-4 text-right', {
                        'text-red-700': (fs.netIncome ?? 0) < 0,
                        'text-gray-900': (fs.netIncome ?? 0) >= 0,
                      })}>
                        {formatEuros(fs.netIncome)}
                      </td>
                      <td className="py-3 text-right text-xs text-gray-400">{fs.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-medium text-gray-600 mb-3">Chiffre d'affaires (€)</div>
              <RevenueChart statements={sorted3} />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-600 mb-3">Résultat net (€)</div>
              <NetIncomeChart statements={sorted3} />
            </div>
          </div>
        </div>
      )}

      {/* Événements BODACC */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Événements
          <span className="ml-2 text-xs font-normal text-gray-400">({company.events.length})</span>
        </h2>

        {company.events.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun événement enregistré</p>
        ) : (
          <div className="relative">
            {/* Ligne verticale timeline */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100" />
            <div className="space-y-4">
              {company.events.map((evt) => (
                <div key={evt.id} className="flex gap-4 relative">
                  <div className={clsx(
                    'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs z-10 bg-white',
                    evt.eventType === 'PROCEDURE_COLLECTIVE' ? 'border-red-400' :
                    evt.eventType === 'CHANGEMENT_DIRIGEANT' || evt.eventType === 'FERMETURE_ETABLISSEMENT' ? 'border-orange-400' :
                    'border-gray-300'
                  )} />
                  <div className="flex-1 pb-4">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className={clsx(
                        'text-xs border px-2 py-0.5 rounded-full font-medium',
                        EVENT_COLORS[evt.eventType] ?? EVENT_COLORS.AUTRE
                      )}>
                        {eventTypeLabel(evt.eventType)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(evt.eventDate).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{evt.title}</p>
                    {evt.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{evt.description}</p>
                    )}
                    {evt.sourceUrl && (
                      <a
                        href={evt.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1"
                      >
                        <ExternalLink size={11} /> Source ({evt.source})
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sources */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Sources de données</h2>
        <div className="space-y-3 text-sm">
          {[
            { name: 'SIRENE / INSEE', desc: 'Identité, adresse, activité, effectif', url: 'https://www.sirene.fr' },
            { name: 'INPI / RNE', desc: 'Comptes annuels, chiffre d\'affaires, résultat', url: 'https://registre-national-entreprises.inpi.fr' },
            { name: 'BODACC', desc: 'Annonces légales, procédures collectives, modifications', url: 'https://www.bodacc.fr' },
          ].map((src) => (
            <div key={src.name} className="flex items-start justify-between gap-3">
              <div>
                <span className="font-medium text-gray-800">{src.name}</span>
                <span className="text-gray-500 ml-2">— {src.desc}</span>
              </div>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:text-blue-700 flex-shrink-0 text-xs"
              >
                <ExternalLink size={11} /> Accéder
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
          Les données financières présentées sont issues des derniers comptes déposés au greffe.
          Elles peuvent ne pas refléter la situation actuelle de l'entreprise.
          Cette application ne fournit pas de conseil financier ou juridique.
        </p>
      </div>
    </div>
  );
}
