'use client';
import { useState, useCallback } from 'react';
import { api, CompanyListItem, PaginatedResponse, SearchFilters } from '@/lib/api';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { CompanyCard } from '@/components/ui/CompanyCard';
import { Radar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function RadarPage() {
  const [results, setResults] = useState<PaginatedResponse<CompanyListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});

  const doSearch = useCallback(async (filters: SearchFilters, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.companies.list({ ...filters, page, pageSize: 12 });
      setResults(data);
      setCurrentFilters(filters);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion à l\'API');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((filters: SearchFilters) => {
    doSearch(filters, 1);
  }, [doSearch]);

  const handlePage = (page: number) => {
    doSearch(currentFilters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Radar className="text-blue-600" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Radar PME</h1>
        </div>
        <p className="text-gray-500 text-sm max-w-xl">
          Détecter les PME dont la trajectoire économique évolue sur votre territoire.
          Les données présentées sont issues de sources publiques (SIRENE, INPI, BODACC).
        </p>
      </div>

      {/* Filtres */}
      <FilterPanel onSearch={handleSearch} loading={loading} />

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {/* Résultats */}
      {results !== null && (
        <div>
          {/* Résumé */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{results.total}</span>
              {' '}entreprise{results.total !== 1 ? 's' : ''} détectée{results.total !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-400">
              Page {results.page} / {results.totalPages}
            </div>
          </div>

          {results.data.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400 text-sm">Aucune entreprise ne correspond aux critères sélectionnés.</p>
              <p className="text-gray-300 text-xs mt-1">Élargissez le rayon ou assouplissez les filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {results.data.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePage(results.page - 1)}
                disabled={results.page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <span className="text-sm text-gray-500 px-3">
                {results.page} / {results.totalPages}
              </span>
              <button
                onClick={() => handlePage(results.page + 1)}
                disabled={results.page >= results.totalPages || loading}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* État initial */}
      {results === null && !loading && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <Radar size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sélectionnez une localisation et lancez une recherche</p>
        </div>
      )}

      {loading && results === null && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-400">Analyse en cours...</p>
        </div>
      )}
    </div>
  );
}
