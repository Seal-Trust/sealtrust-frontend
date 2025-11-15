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
  Funnel,
  Clock,
  Fire,
  Star,
  ChartLine,
  Files,
  Hash,
  CircleNotch
} from '@phosphor-icons/react';
import { formatAddress, formatHash } from '@/lib/utils';
import { walrusService, type DatasetMetadata, type RegistryStats } from '@/lib/walrus-service';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'size'>('recent');
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [registryStats, setRegistryStats] = useState<RegistryStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch registry stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await walrusService.getRegistryStats();
        setRegistryStats(stats);
      } catch (error) {
        console.error('Error fetching registry stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Fetch datasets when filters change
  useEffect(() => {
    const fetchDatasets = async () => {
      setLoading(true);
      try {
        const data = await walrusService.queryDatasets(
          selectedCategory,
          searchQuery,
          sortBy
        );
        setDatasets(data);
      } catch (error) {
        console.error('Error fetching datasets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, [searchQuery, selectedCategory, sortBy]);

  // Load categories on mount
  useEffect(() => {
    setCategories(walrusService.getCategories());
  }, []);

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
              Browse through cryptographically verified AI training datasets registered on the blockchain.
              Each dataset is timestamped and immutably recorded.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database weight="duotone" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {registryStats ? registryStats.totalDatasets.toLocaleString() : '0'}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Datasets</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Shield weight="duotone" size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {registryStats ? registryStats.totalVerifications.toLocaleString() : '0'}
                  </p>
                  <p className="text-sm text-muted-foreground">Verifications</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Fire weight="duotone" size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {registryStats ? registryStats.todaysRegistrations.toLocaleString() : '0'}
                  </p>
                  <p className="text-sm text-muted-foreground">Today's Registrations</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ChartLine weight="duotone" size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {registryStats ? walrusService.formatFileSize(registryStats.totalDataSize) : '0 B'}
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
                    placeholder="Search datasets by name, category, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="size">Largest Size</option>
                </select>

                <button className="px-4 py-3 rounded-xl bg-gray-50 border border-border hover:border-primary transition-colors flex items-center gap-2">
                  <Funnel weight="regular" size={20} />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Dataset Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <CircleNotch weight="bold" size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {datasets.map((dataset) => (
                <div
                  key={dataset.hash}
                  className="bg-white rounded-xl border border-border hover:shadow-xl hover:border-primary/50 transition-all p-6 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {dataset.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dataset.description}
                      </p>
                    </div>
                    {dataset.isVerified && (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Shield weight="fill" size={16} className="text-green-600" />
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash weight="regular" size={14} className="text-muted-foreground" />
                      <code className="text-xs font-mono">{formatHash(dataset.hash, 12)}</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Files weight="regular" size={14} className="text-muted-foreground" />
                      <span>{dataset.sizeDisplay}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-primary font-medium">{dataset.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User weight="regular" size={14} className="text-muted-foreground" />
                      <span className="font-mono">{dataset.registrant}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar weight="regular" size={14} className="text-muted-foreground" />
                      <span>{new Date(dataset.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Shield weight="regular" size={14} className="text-success" />
                        <span className="text-sm font-medium">{dataset.verificationCount}</span>
                        <span className="text-xs text-muted-foreground">verifications</span>
                      </div>
                    </div>
                    <Link
                      href={`/verify?hash=${dataset.hash}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
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
          {!loading && datasets.length === 0 && (
            <div className="text-center py-16">
              <Database weight="light" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Datasets Found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or browse all datasets
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Load More */}
          {!loading && datasets.length > 0 && (
            <div className="text-center mt-12">
              <button className="px-8 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-all">
                Load More Datasets
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}