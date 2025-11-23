'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { WorldMapAnimation } from '@/components/animations/WorldMapAnimation';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  ShieldCheck,
  Database,
  Lock,
  CloudArrowUp
} from '@phosphor-icons/react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'register' | 'verify'>('register');

  const features = [
    {
      icon: Lock,
      title: 'Seal Encryption',
      description: 'Datasets encrypted before storage. Only wallets you authorize can decrypt and download.',
    },
    {
      icon: ShieldCheck,
      title: 'TEE Verification',
      description: 'Metadata verified in AWS Nitro Enclaves with hardware-backed signatures.',
    },
    {
      icon: CloudArrowUp,
      title: 'Walrus Storage',
      description: 'Encrypted datasets stored on decentralized network. No single point of failure.',
    },
    {
      icon: Database,
      title: 'Sui Blockchain',
      description: 'Immutable record of your dataset with proof of integrity and ownership.',
    },
  ];

  const benefits = [
    { icon: CheckCircle, text: 'Encrypt datasets so only authorized users can access' },
    { icon: CheckCircle, text: 'Prove dataset integrity with hardware-backed verification' },
    { icon: CheckCircle, text: 'Control access with on-chain allowlists you manage' },
    { icon: CheckCircle, text: 'Store securely on decentralized infrastructure' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white">
        {/* Hero Section with Verification Form */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          
          <div className="container-fluid relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <span className="text-sm font-medium text-orange-900">Powered by Sui x Walrus x Seal x Nautilus</span>
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                    <span className="block">Cryptographic Verification</span>
                    <span className="block">and Encrypted Storage</span>
                    <span className="block gradient-text">for AI Training Datasets</span>
                  </h1>

                  <p className="text-xl text-muted-foreground max-w-xl">
                    Hash, encrypt, store on Walrus, verify in TEE, record on Sui. Only authorized wallets can decrypt.
                  </p>

                  <p className="text-xl font-bold text-primary mt-4">
                    Trust. Encrypt. Verify.
                  </p>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Lock weight="duotone" size={24} className="text-primary" />
                    <span className="font-medium">Encrypted Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck weight="duotone" size={24} className="text-primary" />
                    <span className="font-medium">TEE Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database weight="duotone" size={24} className="text-primary" />
                    <span className="font-medium">Access Control</span>
                  </div>
                </div>

                {/* World Map Animation */}
                <div className="my-8">
                  <WorldMapAnimation />
                </div>
              </div>

              {/* Right Card */}
              <div className="lg:pl-8">
                <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
                  {/* Tab Selector */}
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setActiveTab('register')}
                      className={`flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'register'
                          ? 'bg-orange-50 text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Database weight="regular" size={20} />
                      Register Dataset
                    </button>
                    <button
                      onClick={() => setActiveTab('verify')}
                      className={`flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'verify'
                          ? 'bg-orange-50 text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ShieldCheck weight="regular" size={20} />
                      Verify Dataset
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6 min-h-[400px] flex flex-col">
                    {activeTab === 'register' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">How it works:</h3>
                          <ol className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-primary">1.</span>
                              <span>Upload dataset and set who can access it</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-primary">2.</span>
                              <span>Dataset is hashed, encrypted, and stored on Walrus</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-primary">3.</span>
                              <span>Nautilus TEE verifies and signs the metadata</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-primary">4.</span>
                              <span>Proof recorded on Sui. Only you control access.</span>
                            </li>
                          </ol>
                        </div>
                        <Link
                          href="/register"
                          className="w-full px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                          Register Your Dataset
                          <ArrowRight weight="bold" size={20} />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Verify authenticity:</h3>
                          <ol className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-primary">1.</span>
                              <span>Provide dataset URL or hash to verify</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-primary">2.</span>
                              <span>Hash computed and compared with on-chain record</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-primary">3.</span>
                              <span>TEE signature validation confirms authenticity</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-primary">4.</span>
                              <span>View complete verification history and timestamp</span>
                            </li>
                          </ol>
                        </div>
                        <Link
                          href="/verify"
                          className="w-full px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                          Verify a Dataset
                          <ArrowRight weight="bold" size={20} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-white">
          <div className="container-fluid">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-4xl font-bold">
                Why AI teams choose SealTrust
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Encrypted storage with access control, verified by hardware, recorded on blockchain
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group p-6 rounded-xl bg-white border border-border hover:border-primary/50 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                      <Icon weight="bold" size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="container-fluid">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  Your data, your rules
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Stop worrying about unauthorized access or data tampering.
                  With SealTrust, datasets are encrypted and only accessible to wallets you approve.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <li key={index} className="flex items-center gap-3">
                        <Icon weight="fill" size={24} className="text-success flex-shrink-0" />
                        <span className="text-lg">{benefit.text}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Register Your First Dataset
                    <ArrowRight weight="bold" size={20} />
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Manual checksums</span>
                      <span className="font-semibold text-red-600">No proof</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Centralized registries</span>
                      <span className="font-semibold text-orange-600">Can be altered</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Simple blockchain storage</span>
                      <span className="font-semibold text-yellow-600">No TEE verification</span>
                    </div>
                    <div className="border-t-2 border-primary pt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">SealTrust</span>
                        <span className="font-bold text-success">Encrypted + Verified + Decentralized</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
          <div className="container-fluid text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to secure your AI datasets?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Encrypt, verify, and control access. Your data stays yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-orange-600 font-semibold hover:shadow-xl hover:scale-105 transition-all"
              >
                Get Started
                <ArrowRight weight="bold" size={20} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/20 text-white border-2 border-white/50 font-semibold hover:bg-white/30 transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-50 border-t border-border">
          <div className="container-fluid">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="SealTrust"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="font-semibold">SealTrust</span>
                <span className="text-muted-foreground">© 2025</span>
              </div>

              <div className="flex gap-8 text-sm">
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
                <Link href="/register" className="text-muted-foreground hover:text-primary transition-colors">
                  Register
                </Link>
                <Link href="/verify" className="text-muted-foreground hover:text-primary transition-colors">
                  Verify
                </Link>
                <a
                  href="https://docs.sealtrust.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Docs
                </a>
                <a
                  href="https://github.com/Seal-Trust"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://x.com/sealtrust"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  X (Twitter)
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}