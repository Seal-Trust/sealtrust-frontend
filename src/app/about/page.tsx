'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, ShieldCheck, Database, Lock, CloudArrowUp } from '@phosphor-icons/react';

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
                About SealTrust
              </h1>
              <p className="text-xl text-muted-foreground">
                Cryptographic Verification and Encrypted Storage for AI Training Datasets
              </p>
              <p className="text-lg text-primary font-semibold mt-2">
                Trust. Encrypt. Verify.
              </p>
            </div>

            {/* Mission Section */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Our Mission</h2>

              <div className="prose prose-lg text-muted-foreground space-y-4">
                <p>
                  AI teams need secure storage for training datasets. Unauthorized access, data tampering, and
                  lack of access control put valuable data at risk.
                </p>

                <p>
                  SealTrust encrypts your datasets with Seal before storing them on Walrus. Only wallet addresses
                  you authorize can decrypt and download the data. The Nautilus TEE verifies metadata with
                  hardware-backed signatures, and Sui blockchain records an immutable proof of integrity.
                </p>

                <p>
                  The result: encrypted storage with on-chain access control. Your data stays private and
                  tamper-proof, and you decide who gets access.
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
                      <h3 className="font-semibold mb-2">Seal Encryption</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Encrypt before storage</li>
                        <li>• On-chain allowlist access control</li>
                        <li>• Only authorized wallets decrypt</li>
                        <li>• Session keys for UX</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">How It Works</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Upload & Hash</h3>
                    <p className="text-muted-foreground text-sm">
                      Upload your dataset. SHA-256 hash is computed on the original file before encryption.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Encrypt with Seal</h3>
                    <p className="text-muted-foreground text-sm">
                      Dataset is encrypted using Seal. An allowlist is created on-chain to control who can decrypt.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Store on Walrus</h3>
                    <p className="text-muted-foreground text-sm">
                      Encrypted blob is uploaded to Walrus decentralized storage. No single point of failure.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">TEE Verification</h3>
                    <p className="text-muted-foreground text-sm">
                      Nautilus (AWS Nitro Enclave) verifies metadata and signs it with hardware-backed keys.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Record on Sui</h3>
                    <p className="text-muted-foreground text-sm">
                      DatasetNFT minted on Sui with hash, blob ID, and access control info. Immutable proof of integrity.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-primary">
                    6
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Authorized Users Decrypt</h3>
                    <p className="text-muted-foreground text-sm">
                      Users on your allowlist can download and decrypt with Session Keys. Others cannot access.
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
                  <h3 className="font-semibold text-orange-900 mb-2">Secure Dataset Sharing</h3>
                  <p className="text-sm text-orange-800">
                    Share training data with specific teams or partners. Add their wallets to your allowlist. They can decrypt. Others cannot.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Integrity Verification</h3>
                  <p className="text-sm text-orange-800">
                    Prove your dataset has not been tampered with. Hash is computed before encryption and recorded on-chain.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Access Control</h3>
                  <p className="text-sm text-orange-800">
                    Manage who can download your datasets. Add or remove wallets from allowlist at any time.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Audit Trail</h3>
                  <p className="text-sm text-orange-800">
                    Every registration is recorded on Sui blockchain. Immutable proof of what data existed and when.
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
                    <strong className="text-foreground">Encryption:</strong> All datasets are encrypted with Seal
                    before upload. Only wallets on your allowlist can decrypt and download the original data.
                  </p>

                  <p>
                    <strong className="text-foreground">Access Control:</strong> You create an on-chain allowlist
                    during registration. Add or remove wallets anytime. Decryption keys are only released to
                    authorized addresses.
                  </p>

                  <p>
                    <strong className="text-foreground">Integrity:</strong> Hash computed on original file before
                    encryption. TEE signs metadata with hardware-backed keys. On-chain record is immutable.
                  </p>

                  <p>
                    <strong className="text-foreground">Decentralization:</strong> Encrypted data stored on Walrus
                    (no single point of failure). Records on Sui blockchain. No trust in SealTrust operators.
                  </p>
                </div>
              </div>
            </section>

            {/* Network Stats */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Platform Stats</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-2xl font-bold text-primary">Seal</div>
                  <div className="text-sm text-muted-foreground">Encrypted Storage</div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-2xl font-bold text-primary">Walrus</div>
                  <div className="text-sm text-muted-foreground">Decentralized</div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-2xl font-bold text-primary">TEE</div>
                  <div className="text-sm text-muted-foreground">Hardware Verified</div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-2xl font-bold text-primary">Sui</div>
                  <div className="text-sm text-muted-foreground">On-chain Records</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
