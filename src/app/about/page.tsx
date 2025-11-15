'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, ShieldCheck, Cpu, Database, Globe, Lock, CloudArrowUp } from '@phosphor-icons/react';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white pt-24 pb-16">
        <div className="container-fluid">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft weight="regular" size={20} />
            <span>Back to Home</span>
          </Link>

          <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <div className="mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                About TruthMarket
              </h1>
              <p className="text-xl text-muted-foreground">
                Cryptographic timestamp verification for AI training datasets using Trusted Execution Environments and blockchain.
              </p>
            </div>

            {/* Mission Section */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Our Mission</h2>

              <div className="prose prose-lg text-muted-foreground space-y-4">
                <p>
                  As AI models become more powerful and prevalent, the provenance and authenticity of training data
                  has become critical. Dataset tampering, backdooring, and disputes over data ownership threaten
                  the integrity of AI systems.
                </p>

                <p>
                  TruthMarket provides cryptographic proof of dataset authenticity by combining three cutting-edge
                  technologies: AWS Nitro Enclaves (Nautilus), Sui blockchain, and Walrus decentralized storage.
                </p>

                <p>
                  Every dataset registered through TruthMarket receives a tamper-proof timestamp that proves
                  exactly what data existed at a specific point in time, verified by hardware-backed cryptography
                  and recorded immutably on-chain.
                </p>
              </div>
            </section>

            {/* Technical Architecture */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Technical Architecture</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-border p-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck weight="duotone" size={24} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Nautilus TEE Verification</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• AWS Nitro Enclave isolation</li>
                        <li>• Hardware-backed hash computation</li>
                        <li>• Cryptographic signature generation</li>
                        <li>• Attestation document validation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border p-6">
                  <div className="flex items-start gap-3">
                    <Database weight="duotone" size={24} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Sui Blockchain Registry</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Immutable timestamp records</li>
                        <li>• On-chain signature verification</li>
                        <li>• Complete audit trail</li>
                        <li>• Sub-second finality</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border p-6">
                  <div className="flex items-start gap-3">
                    <CloudArrowUp weight="duotone" size={24} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Walrus Decentralized Storage</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Censorship-resistant metadata</li>
                        <li>• Distributed blob storage</li>
                        <li>• Efficient erasure coding</li>
                        <li>• No single point of failure</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border p-6">
                  <div className="flex items-start gap-3">
                    <Lock weight="duotone" size={24} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Security Guarantees</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Hardware root of trust</li>
                        <li>• Cryptographic non-repudiation</li>
                        <li>• Tamper-evident records</li>
                        <li>• Verifiable computation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">How Verification Works</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Dataset Submission</h3>
                    <p className="text-muted-foreground text-sm">
                      User provides dataset URL or uploads file. Frontend sends request to Nautilus enclave.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">TEE Hash Computation</h3>
                    <p className="text-muted-foreground text-sm">
                      Inside AWS Nitro Enclave, SHA-256 hash is computed. Hardware attestation document proves
                      the hash was generated in isolated environment.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Cryptographic Signature</h3>
                    <p className="text-muted-foreground text-sm">
                      Enclave signs the hash with ephemeral keypair. Signature proves authenticity and prevents tampering.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Blockchain Registration</h3>
                    <p className="text-muted-foreground text-sm">
                      Move contract on Sui validates signature and stores timestamp record. NFT certificate minted to user.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Decentralized Storage</h3>
                    <p className="text-muted-foreground text-sm">
                      Dataset metadata stored on Walrus for censorship-resistant access. BlobID linked to on-chain record.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Use Cases */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Use Cases</h2>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">AI Model Training</h3>
                  <p className="text-sm text-orange-800">
                    Prove which exact dataset version was used to train a model. Essential for reproducibility and audit compliance.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Dataset Marketplaces</h3>
                  <p className="text-sm text-orange-800">
                    Verify dataset authenticity before purchase. Prevent sellers from tampering with advertised data.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Regulatory Compliance</h3>
                  <p className="text-sm text-orange-800">
                    Demonstrate compliance with data governance requirements. Immutable audit trail for all training data.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Research Reproducibility</h3>
                  <p className="text-sm text-orange-800">
                    Academic researchers can timestamp datasets to ensure reproducibility and prevent disputes.
                  </p>
                </div>
              </div>
            </section>

            {/* Security Considerations */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Security Model</h2>

              <div className="bg-white rounded-xl border border-border p-6">
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Threat Model:</strong> TruthMarket protects against dataset
                    tampering, backdooring, and provenance disputes. It does NOT protect against malicious dataset
                    creators or content validation (garbage in = garbage out).
                  </p>

                  <p>
                    <strong className="text-foreground">Trust Assumptions:</strong> Users trust AWS Nitro hardware,
                    Sui blockchain validators, and Walrus storage nodes. No trust required in TruthMarket operators.
                  </p>

                  <p>
                    <strong className="text-foreground">Cryptographic Guarantees:</strong> SHA-256 collision
                    resistance, Ed25519 signature security, and hardware attestation ensure tamper-evidence.
                  </p>

                  <p>
                    <strong className="text-foreground">Privacy:</strong> Dataset URLs and metadata are public.
                    Future versions will support Seal encryption for private verification.
                  </p>
                </div>
              </div>
            </section>

            {/* Network Stats */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Platform Stats</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-2xl font-bold text-primary">TEE</div>
                  <div className="text-sm text-muted-foreground">Hardware Verified</div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-2xl font-bold text-primary">Sub-1s</div>
                  <div className="text-sm text-muted-foreground">Sui Finality</div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-2xl font-bold text-primary">SHA-256</div>
                  <div className="text-sm text-muted-foreground">Hash Algorithm</div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-2xl font-bold text-primary">Testnet</div>
                  <div className="text-sm text-muted-foreground">Live Now</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
