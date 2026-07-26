'use client';
import { useEffect, useState } from 'react';
import { api, CompanyListItem } from '@/lib/api';
import { CompanyCard } from '@/components/ui/CompanyCard';
import { Bookmark } from 'lucide-react';

export default function WatchlistPage() {
  const [list, setList] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadList = () => {
    setLoading(true);
    api.watchlist.get()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadList(); }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Bookmark className="text-blue-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ma liste de suivi</h1>
          <p className="text-sm text-gray-500">{list.length} entreprise{list.length !== 1 ? 's' : ''} enregistrée{list.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <Bookmark size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Votre liste est vide</p>
          <p className="text-gray-300 text-xs mt-1">
            Ajoutez des entreprises depuis le Radar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              isInWatchlist={true}
              onWatchlistChange={loadList}
            />
          ))}
        </div>
      )}
    </div>
  );
}
