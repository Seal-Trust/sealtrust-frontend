'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SuiWalletButton } from '@/components/wallet/SuiWalletButton';
import {
  List,
  X,
  Database,
  ShieldCheck,
  Info,
  Compass,
  BookOpen
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useCurrentAccount(); // Keep for reactivity

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/register', label: 'Register', icon: Database },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/verify', label: 'Verify', icon: ShieldCheck },
    { href: '/about', label: 'About', icon: Info },
    { href: 'https://docs.sealtrust.app', label: 'Docs', icon: BookOpen, external: true },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container-fluid">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.svg"
              alt="SealTrust"
              width={40}
              height={40}
              className="rounded-lg"
              priority
            />
            <span className="text-xl font-bold gradient-text">
              SealTrust
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const linkProps = link.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {};
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  {...linkProps}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Icon weight="regular" size={18} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Wallet Button */}
          <div className="hidden md:flex items-center gap-2">
            <SuiWalletButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X weight="regular" size={24} />
            ) : (
              <List weight="regular" size={24} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-border">
          <div className="container-fluid py-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const linkProps = link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {};
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    {...linkProps}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted"
                  >
                    <Icon weight="regular" size={20} className="text-primary" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-border">
              <SuiWalletButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}