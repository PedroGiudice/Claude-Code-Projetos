import React, { useState, useEffect } from 'react';
import { Search, Clock, FileText, Database, AlertCircle } from 'lucide-react';

const CCuiSearchView = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/memory/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
        setTotal(data.total || 0);
        if (data.error) {
          setError(data.error);
        }
      } else {
        setError(data.error || 'Search failed');
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to connect to search service');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renderResultPreview = (result) => {
    const contentFields = Object.keys(result).filter(key =>
      typeof result[key] === 'string' &&
      result[key].length > 10 &&
      !key.toLowerCase().includes('id') &&
      !key.toLowerCase().includes('date')
    );

    if (contentFields.length === 0) {
      return JSON.stringify(result, null, 2);
    }

    const mainContent = result[contentFields[0]];
    return mainContent.substring(0, 150) + (mainContent.length > 150 ? '...' : '');
  };

  const renderResultDetail = (result) => {
    return (
      <div className="space-y-3">
        {Object.entries(result).map(([key, value]) => (
          <div key={key} className="border-b border-ccui-border-primary pb-2">
            <div className="text-xs font-mono text-ccui-text-muted mb-1">{key}</div>
            <div className="text-sm text-ccui-text-primary whitespace-pre-wrap">
              {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-ccui-bg-primary">
      {/* Search Input */}
      <div className="p-4 border-b border-ccui-border-primary">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ccui-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search context memories..."
            className="w-full pl-10 pr-4 py-2 bg-ccui-bg-tertiary border border-ccui-border-primary rounded text-ccui-text-primary placeholder:text-ccui-text-muted focus:outline-none focus:border-ccui-accent font-mono text-sm"
            disabled={loading}
          />
        </div>

        {/* Search Stats */}
        {total > 0 && (
          <div className="text-xs text-ccui-text-muted flex items-center gap-2">
            <Database className="w-3 h-3" />
            <span>Found {total} result{total !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-600/30 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-300">{error}</div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 flex overflow-hidden">
        {/* Results List */}
        <div className="w-1/2 border-r border-ccui-border-primary overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-ccui-text-muted flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-ccui-accent border-t-transparent rounded-full animate-spin" />
              <span>Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-ccui-text-muted">
              {query ? 'No results found' : 'Enter a search term to begin'}
            </div>
          ) : (
            results.map((result, i) => (
              <button
                key={i}
                onClick={() => setSelectedResult(result)}
                className={`w-full p-3 text-left border-b border-ccui-border-primary hover:bg-ccui-bg-hover transition-colors ${
                  selectedResult === result ? 'bg-ccui-bg-active' : ''
                }`}
              >
                <div className="text-xs font-mono text-ccui-text-primary mb-1 line-clamp-2">
                  {renderResultPreview(result)}
                </div>
                <div className="text-xs text-ccui-text-muted flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3" />
                  {result.created_at || result.timestamp || result.date || 'No date'}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-1/2 p-4 overflow-y-auto bg-ccui-bg-secondary">
          {selectedResult ? (
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ccui-border-primary">
                <FileText className="w-4 h-4 text-ccui-accent" />
                <h3 className="text-sm font-semibold text-ccui-text-primary">Memory Details</h3>
              </div>
              {renderResultDetail(selectedResult)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-ccui-text-muted">
              <FileText className="w-12 h-12 mb-3 opacity-50" />
              <div className="text-sm">Select a result to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CCuiSearchView;
