import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search as SearchIcon, FileText, MessageSquare } from 'lucide-react';

interface SearchResult {
  result_type: 'artifact' | 'contribution';
  id: string;
  title: string;
  snippet: string;
  rank: number;
  created_at: string;
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== query) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .rpc('search_content', { query_text: searchQuery });

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults((data || []) as SearchResult[]);
      }
    } catch (err) {
      console.error('Search exception:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      performSearch(query.trim());
    }
  };

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artifacts and contributions..."
            className="w-full px-4 py-3 pl-12 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50]"
            autoFocus
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] text-sm font-medium"
          >
            Search
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <SearchIcon className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Searching...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No results found for "{query}"</p>
          <p className="text-sm text-gray-500">Try different keywords or check your spelling</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-500">
            {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
          </div>
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={`${result.result_type}-${result.id}`}
                className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 hover:border-[#333] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {result.result_type === 'artifact' ? (
                      <FileText className="w-5 h-5 text-[#c3fd50]" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-cyan-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        to={result.result_type === 'artifact' ? `/artifact/${result.id}` : '/me'}
                        className="font-medium text-white hover:text-[#c3fd50] transition-colors"
                      >
                        {result.title}
                      </Link>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {timeAgo(result.created_at)}
                      </span>
                    </div>
                    <div
                      className="text-sm text-gray-400 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: result.snippet }}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#262626] text-gray-400">
                        {result.result_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions (when not searched yet) */}
      {!searched && !loading && (
        <div className="text-center py-12">
          <SearchIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Search the knowledge graph</p>
          <p className="text-sm text-gray-500">
            Enter keywords to find artifacts and contributions
          </p>
        </div>
      )}
    </div>
  );
}
