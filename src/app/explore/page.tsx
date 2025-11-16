'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import {
  MagnifyingGlass,
  Calendar,
  User,
  Shield,
  Database,
  ArrowRight,
  Files,
  Hash,
  CircleNotch,
  Download
} from '@phosphor-icons/react';
import { formatAddress, formatHash } from '@/lib/utils';
import { useTruthMarket } from '@/hooks/useTruthMarket';
import { RegistryEntry } from '@/lib/types';
import { walrusService } from '@/lib/walrus-service';

export default function ExplorePage() {
  const { getAllDatasets } = useTruthMarket();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'size'>('recent');
  const [datasets, setDatasets] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      setLoading(true);
      try {
        const data = await getAllDatasets();
        setDatasets(data);
      } catch (error) {
        console.error('Error fetching datasets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, [getAllDatasets]);

  // Calculate stats from datasets
  const stats = {
    totalDatasets: datasets.length,
    totalDataSize: datasets.reduce((sum, entry) => sum + (entry.nft.size || 0), 0),
    todaysRegistrations: datasets.filter(entry => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return entry.registered_at >= today.getTime();
    }).length,
  };

  // Filter and sort datasets
  const filteredDatasets = datasets
    .filter(entry => {
      // Filter by format
      if (selectedFormat !== 'All' && entry.nft.format !== selectedFormat) return false;

      // Search by name or hash
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = entry.nft.name?.toLowerCase().includes(query);
        const hashMatch = entry.nft.original_hash?.toLowerCase().includes(query);
        if (!nameMatch && !hashMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return b.registered_at - a.registered_at;
      if (sortBy === 'size') return (b.nft.size || 0) - (a.nft.size || 0);
      return 0;
    });

  // Get unique formats from datasets
  const formats = ['All', ...new Set(datasets.map(entry => entry.nft.format).filter(Boolean))];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white pt-24 pb-16">
        <div className="container-fluid">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Explore Verified Datasets
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Browse cryptographically verified AI training datasets with encrypted storage.
              Each dataset is timestamped, encrypted with Seal, and immutably recorded on Sui blockchain.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database weight="duotone" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.totalDatasets.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Datasets</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Shield weight="duotone" size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.todaysRegistrations.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Today&apos;s Registrations</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Files weight="duotone" size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {walrusService.formatFileSize(stats.totalDataSize)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Data Size</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-border p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlass
                    weight="regular"
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Search datasets by name or hash..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="flex gap-2">
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:border-primary transition-colors"
                >
                  {formats.map((format) => (
                    <option key={format} value={format}>
                      {format === 'All' ? 'All Formats' : format}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="recent">Most Recent</option>
                  <option value="size">Largest Size</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dataset Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <CircleNotch weight="bold" size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDatasets.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-border hover:shadow-xl hover:border-primary/50 transition-all p-6 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {entry.nft.name || 'Untitled Dataset'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.nft.format || 'Unknown format'}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Shield weight="fill" size={16} className="text-green-600" />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash weight="regular" size={14} className="text-muted-foreground" />
                      <code className="text-xs font-mono">
                        {formatHash(entry.nft.original_hash || '', 12)}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Files weight="regular" size={14} className="text-muted-foreground" />
                      <span>{walrusService.formatFileSize(entry.nft.size || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User weight="regular" size={14} className="text-muted-foreground" />
                      <span className="font-mono text-xs">{formatAddress(entry.nft.owner)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar weight="regular" size={14} className="text-muted-foreground" />
                      <span>{new Date(entry.registered_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Link
                      href={`/dataset/${entry.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm"
                    >
                      <Download weight="regular" size={16} />
                      Download
                    </Link>
                    <Link
                      href={`/verify?hash=${entry.nft.original_hash}`}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-border hover:bg-gray-50 transition-colors text-sm"
                    >
                      Verify
                      <ArrowRight weight="bold" size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredDatasets.length === 0 && (
            <div className="text-center py-16">
              <Database weight="light" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Datasets Found</h3>
              <p className="text-muted-foreground mb-6">
                {datasets.length === 0
                  ? 'No datasets have been registered yet. Be the first to register a dataset!'
                  : 'Try adjusting your search criteria or browse all datasets'}
              </p>
              {datasets.length > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFormat('All');
                  }}
                  className="px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  Clear Filters
                </button>
              )}
              {datasets.length === 0 && (
                <Link
                  href="/register"
                  className="inline-block px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  Register First Dataset
                </Link>
              )}
            </div>
          )}

          {/* Results Count */}
          {!loading && filteredDatasets.length > 0 && (
            <div className="text-center mt-8 text-muted-foreground">
              Showing {filteredDatasets.length} of {datasets.length} datasets
            </div>
          )}
        </div>
      </main>
    </>
  );
}
