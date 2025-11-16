import Link from 'next/link';
import Image from 'next/image';
import { Warning, ArrowLeft, House } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo.svg"
            alt="TruthMarket"
            width={80}
            height={80}
            className="filter drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          />
        </div>

        {/* 404 Error */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
            <Warning weight="duotone" size={48} className="text-primary" />
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
            404
          </h1>

          <h2 className="text-3xl font-bold text-gray-900">
            Page Not Found
          </h2>

          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            <House weight="regular" size={20} />
            Go Home
          </Link>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all"
          >
            <ArrowLeft weight="regular" size={20} className="rotate-180" />
            Explore Datasets
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-muted-foreground mb-4">
            Or try one of these pages:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Register Dataset
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/verify"
              className="text-primary hover:underline font-medium"
            >
              Verify Dataset
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/explore"
              className="text-primary hover:underline font-medium"
            >
              Browse Datasets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
