'use client';
import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { SearchFilters } from '@/lib/api';

const RADIUS_OPTIONS = [10, 25, 50, 100];

const NAF_OPTIONS = [
  { value: '', label: 'Tous secteurs' },
  { value: '41', label: 'Construction' },
  { value: '46', label: 'Commerce de gros' },
  { value: '47', label: 'Commerce de détail' },
  { value: '49', label: 'Transport routier' },
  { value: '56', label: 'Restauration' },
  { value: '62', label: 'Informatique / Logiciels' },
  { value: '69', label: 'Activités juridiques' },
  { value: '70', label: 'Conseil / Management' },
  { value: '71', label: 'Ingénierie / Études' },
  { value: '82', label: 'Services aux entreprises' },
];

const SORT_OPTIONS = [
  { value: 'score', label: 'Score de rupture' },
  { value: 'revenueChange', label: 'Baisse CA' },
  { value: 'distance', label: 'Distance' },
  { value: 'revenue', label: 'Chiffre d\'affaires' },
];

const IDF_LOCATIONS = [
  { label: 'Paris (centre)', lat: 48.8566, lng: 2.3522 },
  { label: 'Boulogne-Billancourt', lat: 48.8352, lng: 2.2407 },
  { label: 'Saint-Denis', lat: 48.9362, lng: 2.3574 },
  { label: 'Créteil', lat: 48.7904, lng: 2.4556 },
  { label: 'Versailles', lat: 48.8014, lng: 2.1301 },
  { label: 'Massy', lat: 48.7302, lng: 2.2713 },
  { label: 'Cergy', lat: 49.0359, lng: 2.0630 },
];

interface FilterPanelProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

export function FilterPanel({ onSearch, loading }: FilterPanelProps) {
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [radius, setRadius] = useState(25);
  const [naf, setNaf] = useState('');
  const [revenueChangeMax, setRevenueChangeMax] = useState('');
  const [scoreMin, setScoreMin] = useState('');
  const [sort, setSort] = useState<SearchFilters['sort']>('score');
  const [showAdvanced, setShowAdvanced] = useState(false);

  function handleLocationSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setLocation(val);
    if (val === '') { setLat(undefined); setLng(undefined); return; }
    const found = IDF_LOCATIONS.find((l) => l.label === val);
    if (found) { setLat(found.lat); setLng(found.lng); }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const filters: SearchFilters = { sort };
    if (lat !== undefined) filters.latitude = lat;
    if (lng !== undefined) filters.longitude = lng;
    if (lat !== undefined) filters.radius = radius;
    if (naf) filters.naf = naf;
    if (revenueChangeMax !== '') filters.revenueChangeMax = parseFloat(revenueChangeMax);
    if (scoreMin !== '') filters.scoreMin = parseInt(scoreMin, 10);
    onSearch(filters);
  }

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Localisation */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            <MapPin size={12} className="inline mr-1" />Localisation
          </label>
          <select
            value={location}
            onChange={handleLocationSelect}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">— Sélectionner —</option>
            {IDF_LOCATIONS.map((loc) => (
              <option key={loc.label} value={loc.label}>{loc.label}</option>
            ))}
          </select>
        </div>

        {/* Rayon */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Rayon</label>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-colors ${
                  radius === r
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Secteur */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Activité</label>
          <select
            value={naf}
            onChange={(e) => setNaf(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {NAF_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Tri */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Trier par</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SearchFilters['sort'])}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <SlidersHorizontal size={13} />
          {showAdvanced ? 'Masquer les filtres avancés' : 'Filtres avancés'}
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Baisse CA max (%)
            </label>
            <input
              type="number"
              value={revenueChangeMax}
              onChange={(e) => setRevenueChangeMax(e.target.value)}
              placeholder="ex : -20"
              max={0}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-0.5">Valeur négative, ex : -20 pour &gt;20%</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Score minimum
            </label>
            <input
              type="number"
              value={scoreMin}
              onChange={(e) => setScoreMin(e.target.value)}
              placeholder="ex : 30"
              min={0}
              max={100}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setLocation(''); setLat(undefined); setLng(undefined);
            setNaf(''); setRevenueChangeMax(''); setScoreMin('');
            setSort('score');
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Réinitialiser
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Search size={15} />
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>
    </form>
  );
}
