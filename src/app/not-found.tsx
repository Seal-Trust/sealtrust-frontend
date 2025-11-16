import Link from 'next/link';
import Image from 'next/image';

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="currentColor"
              viewBox="0 0 256 256"
              className="text-primary"
            >
              <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"></path>
            </svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z"></path>
            </svg>
            Go Home
          </Link>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all"
          >
            Explore Datasets
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
            </svg>
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
