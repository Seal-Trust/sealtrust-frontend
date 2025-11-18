# Seal Key Server Production Deployment Guide

## Research Summary

**Research Date:** 2025-11-18
**Seal Version:** v0.9.4
**Target Networks:** Sui Testnet & Mainnet
**Mode:** Permissioned (Production)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Key Server Modes](#key-server-modes)
4. [Deployment Steps](#deployment-steps)
5. [Configuration](#configuration)
6. [Security Best Practices](#security-best-practices)
7. [Client Integration](#client-integration)
8. [Monitoring & Operations](#monitoring--operations)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Seal?

Seal is a decentralized secrets management (DSM) product by Mysten Labs that enables:
- Identity-based encryption (IBE) for sensitive data
- Onchain access control policies on Sui blockchain
- Threshold-based decryption using distributed key servers
- Time-locks, token-gating, and role-based access controls

### Architecture

```
┌─────────────┐
│   Client    │ Encrypts data with master public keys
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Threshold Key Server Committee (t/n)   │
│  - Server 1: Ruby Nodes                 │
│  - Server 2: NodeInfra                  │
│  - Server 3: Your Custom Server         │
│  - Server 4: Triton One                 │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  Sui Chain   │ Validates access policies
        │  (Move)      │ Issues key server objects
        └──────────────┘
```

### Key Server Modes

| Mode | Use Case | Master Key | Access Control |
|------|----------|------------|----------------|
| **Open** | Testing, development | Single shared key | Anyone can request keys |
| **Permissioned** | Production, commercial | Dedicated per-client keys | Approved packages only |

---

## Prerequisites

### System Requirements

**Infrastructure:**
- Linux server (Ubuntu 20.04+ or similar)
- Minimum 2 CPU cores, 4GB RAM
- SSD storage for fast I/O
- Stable internet connection
- Access to Sui Full Node (nearby for low latency)

**Software Dependencies:**
- Rust toolchain (latest stable)
- Docker & Docker Compose (optional, recommended)
- Git
- OpenSSL

**Network Requirements:**
- Public HTTPS endpoint (TLS/SSL certificate required)
- Load balancer with TLS termination
- Firewall rules:
  - Port 2024: Key server API (internal/behind load balancer)
  - Port 9184: Prometheus metrics (internal only)

### Sui Network Configuration

**Seal Package IDs:**
- **Testnet:** `0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682`
- **Mainnet:** `0xa212c4c6c7183b911d0be8768f4cb1df7a383025b5d0ba0c014009f0f30f5f8d`

**Sui CLI Setup:**
```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# Configure for testnet
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet

# Or for mainnet
sui client new-env --alias mainnet --rpc https://fullnode.mainnet.sui.io:443
sui client switch --env mainnet

# Verify configuration
sui client envs
```

---

## Key Server Modes

### Open Mode (Development/Testing)

**Use Case:**
- Development and testing
- Public testnet experimentation
- No access restrictions needed

**Characteristics:**
- Single master key for all packages
- Anyone can request decryption keys
- No approval process for clients
- Suitable for testnet only

**Security Level:** Low (Not for production data)

### Permissioned Mode (Production)

**Use Case:**
- Production deployments
- Commercial services
- Dedicated client services
- Controlled access to sensitive data

**Characteristics:**
- Separate master key per client
- Clients pre-approved by operator
- Package IDs allowlisted in configuration
- Supports key rotation and revocation
- Dedicated key derivation per client

**Security Level:** High (Production-ready)

---

## Deployment Steps

### Step 1: Clone Seal Repository

```bash
# Clone the repository
git clone https://github.com/MystenLabs/seal.git
cd seal

# Checkout specific version (v0.9.4)
git checkout v0.9.4

# Build the project
cargo build --release
```

### Step 2: Generate Master Seed (Permissioned Mode)

```bash
# Generate a new BLS master seed
cargo run --release --bin seal-cli gen-seed

# Output example:
# Master Seed (KEEP SECRET): 0xabcd1234...
#
# IMPORTANT:
# 1. Store this seed in a secure vault (AWS KMS, HashiCorp Vault, etc.)
# 2. Never commit to version control
# 3. This seed derives ALL client keys
# 4. Loss = permanent loss of access to encrypted data
```

**Secure Storage Options:**
- AWS Secrets Manager or KMS
- HashiCorp Vault
- Azure Key Vault
- Hardware Security Module (HSM)
- Air-gapped cold storage for backup

### Step 3: Initial Server Configuration

Create initial `config.yaml`:

```yaml
# Network configuration
network: !Testnet  # Or !Mainnet for production

# Server mode
server_mode: !Permissioned

# Client configurations (initially empty)
client_configs: []
```

**Alternate network configuration:**
```yaml
network:
  !Custom:
    node_url: "https://your-sui-fullnode.example.com:443"
```

### Step 4: Discover Derived Public Keys

```bash
# Set environment variables
export CONFIG_PATH=/path/to/config.yaml
export MASTER_KEY=0xYourMasterSeedHere

# Run server (it will display available derived keys and exit)
cargo run --release --bin key-server

# Output will show:
# Available unassigned derived public keys:
# Index 0: 0x9a4b2c8e...
# Index 1: 0x5d7f3e1a...
# Index 2: 0x8c2b4f9d...
# ...
#
# No clients configured. Server shutting down.
```

### Step 5: Client Onboarding Workflow

#### A. Client Provides Information

Client must provide:
1. Their Seal access policy package ID(s)
2. Desired service name for identification

**Important:** Use the FIRST published version ID of the package, not upgraded versions.

#### B. Register Key Server On-Chain

```bash
# Choose an unassigned derived key index (e.g., 0)
# Get the public key from Step 4 output

# For Testnet:
sui client call \
  --package 0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682 \
  --module key_server \
  --function create_and_transfer_v1 \
  --args \
    "MyCompany-Client1" \
    "https://seal.mycompany.com" \
    0 \
    "0x9a4b2c8e..." \
  --gas-budget 50000000

# For Mainnet:
sui client call \
  --package 0xa212c4c6c7183b911d0be8768f4cb1df7a383025b5d0ba0c014009f0f30f5f8d \
  --module key_server \
  --function create_and_transfer_v1 \
  --args \
    "MyCompany-Client1" \
    "https://seal.mycompany.com" \
    0 \
    "0x9a4b2c8e..." \
  --gas-budget 50000000

# Save the returned key_server_object_id from transaction output
# Example: 0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d...
```

#### C. Update Configuration

Add client to `config.yaml`:

```yaml
network: !Testnet

server_mode: !Permissioned

client_configs:
  - client_master_key: !Derived
    derivation_index: 0
    key_server_object_id: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d..."
    package_ids:
      - "0xclient_policy_package_v1_id..."
      # Add more package IDs if client has multiple policy packages
```

#### D. Restart Server

```bash
export CONFIG_PATH=/path/to/config.yaml
export MASTER_KEY=0xYourMasterSeedHere

cargo run --release --bin key-server

# Server should start successfully and log:
# Loaded 1 client configuration(s)
# Key server listening on 0.0.0.0:2024
# Prometheus metrics on 0.0.0.0:9184
```

#### E. Share Configuration with Client

Provide client with:
- Key server URL: `https://seal.mycompany.com`
- Key server object ID: `0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d...`

### Step 6: Docker Deployment (Recommended)

#### Build Docker Image

```bash
cd seal

# Build with Git revision tag
docker build -t seal-key-server:v0.9.4 . \
  --build-arg GIT_REVISION="$(git describe --always)"
```

#### Create docker-compose.yaml

```yaml
version: '3.8'

services:
  seal-key-server:
    image: seal-key-server:v0.9.4
    container_name: seal-key-server
    restart: unless-stopped

    ports:
      - "127.0.0.1:2024:2024"    # API (internal only)
      - "127.0.0.1:9184:9184"    # Metrics (internal only)

    volumes:
      - ./config.yaml:/config/key-server-config.yaml:ro
      - ./logs:/var/log/seal:rw

    environment:
      - CONFIG_PATH=/config/key-server-config.yaml
      - MASTER_KEY=${MASTER_KEY}
      - RUST_LOG=info

    # Security hardening
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:2024/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    networks:
      - seal-internal

networks:
  seal-internal:
    driver: bridge
```

#### Create .env file

```bash
# .env file (DO NOT COMMIT TO GIT)
MASTER_KEY=0xYourMasterSeedHere
```

Add to `.gitignore`:
```
.env
config.yaml
logs/
```

#### Deploy

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost:2024/health

# View metrics
curl http://localhost:9184/metrics
```

---

## Configuration

### Complete Configuration Example (Permissioned Mode)

```yaml
# config.yaml

# Network: Testnet, Mainnet, or Custom
network: !Mainnet

# Server mode: Permissioned for production
server_mode: !Permissioned

# Client configurations
client_configs:
  # Client 1: TruthMarket allowlist
  - client_master_key: !Derived
    derivation_index: 0
    key_server_object_id: "0x1a2b3c4d..."
    package_ids:
      - "0xtruthmarket_allowlist_v1..."

  # Client 2: Premium content service
  - client_master_key: !Derived
    derivation_index: 1
    key_server_object_id: "0x2b3c4d5e..."
    package_ids:
      - "0xpremium_content_policy_v1..."
      - "0xpremium_subscription_policy_v1..."

  # Client 3: Imported key (migrated from another server)
  - client_master_key: !Imported
    env_var: "CLIENT3_BLS_KEY"
    key_server_object_id: "0x3c4d5e6f..."
    package_ids:
      - "0xmigrated_service_policy_v1..."

  # Client 4: Exported/Disabled (key moved to another server)
  - client_master_key: !Exported
    deprecated_derivation_index: 3
    key_server_object_id: "0x4d5e6f7a..."
    package_ids:
      - "0xold_service_policy_v1..."
```

### Environment Variables

```bash
# Required
MASTER_KEY=0x...          # Master seed for Permissioned mode
CONFIG_PATH=/path/to/config.yaml

# Optional
RUST_LOG=info             # Log level: error, warn, info, debug, trace
CLIENT3_BLS_KEY=0x...     # Imported client keys (if using !Imported)
```

### Open Mode Configuration (Testnet Only)

```yaml
# config-open.yaml (NOT FOR PRODUCTION)

network: !Testnet

server_mode: !Open

key_server_object_id: "0xabcd1234..."  # From on-chain registration
```

---

## Security Best Practices

### 1. Master Seed Security

**CRITICAL: Master seed compromise = complete system compromise**

- Store in enterprise-grade secret management system
- Use hardware security modules (HSM) for production
- Implement key rotation procedures
- Maintain encrypted backups in geographically distributed locations
- Never log, print, or transmit in plaintext
- Use environment variables only, never config files

### 2. Infrastructure Security

**Network Security:**
```nginx
# Nginx reverse proxy configuration
upstream seal_backend {
    least_conn;
    server 127.0.0.1:2024 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:2025 max_fails=3 fail_timeout=30s;  # Additional instance
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name seal.mycompany.com;

    # TLS configuration
    ssl_certificate /etc/nginx/certs/seal.mycompany.com.crt;
    ssl_certificate_key /etc/nginx/certs/seal.mycompany.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers (required for Seal)
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Request-Id, Client-Sdk-Type, Client-Sdk-Version" always;
    add_header Access-Control-Expose-Headers "x-keyserver-version" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=seal_limit:10m rate=100r/s;
    limit_req zone=seal_limit burst=200 nodelay;

    location / {
        proxy_pass http://seal_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://seal_backend/health;
        access_log off;
    }
}

# Metrics endpoint (internal only)
server {
    listen 127.0.0.1:9184;

    location /metrics {
        proxy_pass http://127.0.0.1:9184/metrics;
        allow 127.0.0.1;
        allow 10.0.0.0/8;  # Internal network
        deny all;
    }
}
```

**Firewall Rules:**
```bash
# UFW example
sudo ufw allow from any to any port 443 proto tcp  # HTTPS only
sudo ufw allow from 10.0.0.0/8 to any port 9184 proto tcp  # Metrics (internal)
sudo ufw deny 2024  # Block direct access to key server
```

### 3. High Availability Setup

**Stateless Architecture:**
- Multiple key server instances behind load balancer
- No persistent storage required
- Each instance reads same configuration
- Scales horizontally

**Load Balancer Configuration:**
```yaml
# docker-compose-ha.yaml
version: '3.8'

services:
  seal-key-server-1:
    image: seal-key-server:v0.9.4
    <<: *seal-server-config  # Anchor for shared config
    container_name: seal-key-server-1
    ports:
      - "127.0.0.1:2024:2024"

  seal-key-server-2:
    image: seal-key-server:v0.9.4
    <<: *seal-server-config
    container_name: seal-key-server-2
    ports:
      - "127.0.0.1:2025:2024"

  seal-key-server-3:
    image: seal-key-server:v0.9.4
    <<: *seal-server-config
    container_name: seal-key-server-3
    ports:
      - "127.0.0.1:2026:2024"
```

### 4. Monitoring & Alerting

**Required Metrics:**
- Request rate (requests/second)
- Error rate (4xx/5xx responses)
- Response latency (p50, p95, p99)
- Key derivation failures
- Sui RPC connection status
- Health check status

**Prometheus Configuration:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'seal-key-server'
    scrape_interval: 15s
    static_configs:
      - targets:
          - 'localhost:9184'
          - 'localhost:9185'  # Additional instances
          - 'localhost:9186'
```

### 5. Access Control & Authentication

**API Gateway Integration:**
- Implement API key authentication
- Rate limiting per client
- Request logging and audit trails
- DDoS protection

**Client Authentication Example:**
```typescript
// Client SDK configuration with API key
const sealClient = new SealClient({
  keyServerUrl: 'https://seal.mycompany.com',
  apiKey: process.env.SEAL_API_KEY,  // Your custom auth
});
```

---

## Key Server Operations

### Key Rotation & Migration

#### Export Client Key

```bash
# Derive and export a specific client's master key
cargo run --release --bin seal-cli derive-key \
  --seed 0xYourMasterSeed \
  --index 0

# Output: 0xClientMasterKey...
# Share securely with new key server operator
```

#### Disable Key on Current Server

Update `config.yaml`:
```yaml
client_configs:
  - client_master_key: !Exported
    deprecated_derivation_index: 0
    key_server_object_id: "0x1a2b3c4d..."
    package_ids:
      - "0xtruthmarket_allowlist_v1..."
```

Restart server - it will no longer serve this client.

#### Transfer Key Server Object

```bash
# Transfer ownership to new operator
sui client transfer \
  --object-id 0x1a2b3c4d... \
  --to 0xNewOperatorAddress... \
  --gas-budget 10000000
```

#### New Operator Updates URL

```bash
# New operator updates key server URL
sui client call \
  --package 0xa212c4c6c7183b911d0be8768f4cb1df7a383025b5d0ba0c014009f0f30f5f8d \
  --module key_server \
  --function update \
  --args \
    0x1a2b3c4d... \
    "https://new-seal.example.com" \
  --gas-budget 10000000
```

#### Import Key on New Server

New operator's `config.yaml`:
```yaml
client_configs:
  - client_master_key: !Imported
    env_var: "IMPORTED_CLIENT_KEY"
    key_server_object_id: "0x1a2b3c4d..."
    package_ids:
      - "0xtruthmarket_allowlist_v1..."
```

Start server:
```bash
export MASTER_KEY=0xNewServerMasterSeed
export IMPORTED_CLIENT_KEY=0xClientMasterKeyFromExport
export CONFIG_PATH=/path/to/config.yaml

cargo run --release --bin key-server
```

### Adding New Clients

```bash
# 1. Client provides package ID
# 2. Check available derived key indices (run server with no clients)
# 3. Register on-chain with new index
# 4. Add to config.yaml
# 5. Restart server
# 6. Share key_server_object_id with client
```

### Package Upgrades

**IMPORTANT:** Upgrades don't require configuration changes!

- Seal uses the FIRST published version ID
- Upgraded packages inherit access from original ID
- No server restart needed for package upgrades
- Client continues using same key server object

---

## Client Integration

### Client Configuration

Clients need to configure their Seal SDK with your key server:

```typescript
// TypeScript SDK example
import { SealClient } from '@mysten/seal';
import { SuiClient } from '@mysten/sui.js/client';

const suiClient = new SuiClient({
  url: 'https://fullnode.mainnet.sui.io:443'
});

const sealClient = new SealClient({
  suiClient,
  keyServers: [
    {
      url: 'https://seal.mycompany.com',
      objectId: '0x1a2b3c4d...',  // From registration
    },
    {
      url: 'https://seal.partner1.com',
      objectId: '0x2b3c4d5e...',  // Additional server for threshold
    },
    {
      url: 'https://seal.partner2.com',
      objectId: '0x3c4d5e6f...',  // Third server
    },
  ],
  threshold: 2,  // Require 2 out of 3 key servers
});

// Client can now encrypt/decrypt with threshold security
const encrypted = await sealClient.encrypt(data, policyPackageId);
const decrypted = await sealClient.decrypt(encrypted, userAddress);
```

### Threshold Configuration

**Example: 2-of-3 Threshold**
- Client chooses 3 key servers
- Sets threshold = 2
- Encryption uses public keys from all 3 servers
- Decryption requires at least 2 servers to respond
- System tolerates 1 server failure

**Benefits:**
- No single point of failure
- Distribute trust across operators
- Geographic redundancy
- Regulatory compliance (different jurisdictions)

---

## Monitoring & Operations

### Health Check

```bash
# Basic health check
curl http://localhost:2024/health

# Expected response:
# HTTP/1.1 200 OK
# Content-Type: application/json
# {"status": "healthy"}
```

### Prometheus Metrics

```bash
# Fetch all metrics
curl http://localhost:9184/metrics

# Example metrics:
# seal_requests_total{method="GET",status="200"} 1234
# seal_request_duration_seconds{quantile="0.5"} 0.042
# seal_request_duration_seconds{quantile="0.95"} 0.153
# seal_key_derivations_total{client="0"} 567
# seal_sui_rpc_errors_total 3
```

### Grafana Dashboard

**Key Panels:**
1. Request Rate (requests/sec)
2. Error Rate (% of failed requests)
3. Response Latency (p50, p95, p99)
4. Active Clients
5. Sui RPC Health
6. Server Uptime

### Log Analysis

```bash
# Follow logs
docker-compose logs -f seal-key-server

# Key events to monitor:
# - "Loaded N client configuration(s)" - Server start
# - "Key derivation successful for client X" - Normal operation
# - "Invalid package ID for request" - Unauthorized access attempt
# - "Sui RPC connection failed" - Infrastructure issue
# - "Health check failed" - Server degradation
```

### Backup & Disaster Recovery

**What to Backup:**
1. Master seed (CRITICAL - offline encrypted backup)
2. Configuration file (config.yaml)
3. Key server object IDs (on-chain, but good to record)
4. Derived key indices (for audit trail)

**Recovery Procedure:**
1. Restore master seed from secure vault
2. Restore configuration file
3. Deploy server infrastructure
4. Start server with restored configuration
5. Verify health checks and metrics
6. Test decryption with known encrypted data

**DO NOT BACKUP:**
- Running server state (stateless design)
- Logs (ephemeral, can be replayed)
- Metrics (time-series, not critical)

---

## Troubleshooting

### Common Issues

#### 1. Server Won't Start - "No clients configured"

**Symptom:**
```
Available unassigned derived public keys:
Index 0: 0x9a4b2c8e...
No clients configured. Server shutting down.
```

**Solution:**
This is expected behavior when first configuring the server. Use the displayed indices to register clients on-chain.

#### 2. "Invalid package ID" Error

**Symptom:**
```
ERROR: Request denied - package ID 0xabcd... not allowlisted for client
```

**Cause:**
Client requesting keys for a package not in their `package_ids` list.

**Solution:**
```yaml
# Add missing package ID to client config
client_configs:
  - client_master_key: !Derived
    derivation_index: 0
    key_server_object_id: "0x1a2b3c4d..."
    package_ids:
      - "0xexisting_package..."
      - "0xabcd..."  # Add new package
```

Restart server.

#### 3. Sui RPC Connection Failures

**Symptom:**
```
ERROR: Failed to connect to Sui RPC at https://fullnode.mainnet.sui.io:443
```

**Solutions:**
1. Check network connectivity
2. Verify Sui node URL in config
3. Consider running your own Sui full node for reliability:

```yaml
network:
  !Custom:
    node_url: "https://your-sui-node.internal:443"
```

#### 4. Key Server Object Not Found

**Symptom:**
```
ERROR: Key server object 0x1a2b3c4d... not found on chain
```

**Cause:**
- Wrong network (testnet vs mainnet)
- Object ID typo in configuration
- Object was deleted or transferred

**Solution:**
1. Verify network configuration matches where object was created
2. Check object ID in Sui Explorer
3. Re-register if necessary

#### 5. Docker Container Exits Immediately

**Symptom:**
```bash
docker-compose up -d
# Container exits with code 1
```

**Debug:**
```bash
# Check logs
docker-compose logs seal-key-server

# Common causes:
# - Missing MASTER_KEY environment variable
# - Invalid config.yaml path
# - Syntax error in config.yaml
# - Permission issues reading config file
```

**Solution:**
```bash
# Verify environment
docker-compose config

# Test config file syntax
cargo run --release --bin key-server -- --help

# Fix permissions
chmod 644 config.yaml
```

#### 6. CORS Errors from Client

**Symptom:**
```
Access to fetch at 'https://seal.mycompany.com' from origin 'https://app.example.com'
has been blocked by CORS policy
```

**Solution:**
Ensure reverse proxy sets correct CORS headers (see Security Best Practices section).

#### 7. Rate Limiting Issues

**Symptom:**
Client receives 429 Too Many Requests

**Solution:**
Adjust rate limits in API gateway/reverse proxy based on client needs:
```nginx
limit_req_zone $binary_remote_addr zone=seal_limit:10m rate=200r/s;  # Increase rate
```

---

## Production Checklist

### Pre-Deployment

- [ ] Master seed generated and securely stored in vault
- [ ] Backup of master seed in geographically separate location
- [ ] Sui full node accessible and tested
- [ ] SSL/TLS certificates obtained and configured
- [ ] Domain name configured (seal.yourdomain.com)
- [ ] Load balancer configured with health checks
- [ ] Firewall rules configured (allow 443, block 2024)
- [ ] Docker images built and tested
- [ ] Configuration file validated
- [ ] Monitoring and alerting configured
- [ ] Log aggregation set up

### Deployment

- [ ] Deploy initial server instance
- [ ] Verify health check responds
- [ ] Register first client on-chain
- [ ] Add client to configuration
- [ ] Restart server and verify client works
- [ ] Deploy additional instances for HA
- [ ] Configure load balancer with all instances
- [ ] Test failover scenarios

### Post-Deployment

- [ ] Client integration tested end-to-end
- [ ] Monitoring dashboards showing data
- [ ] Alerts triggered and verified
- [ ] Performance benchmarks recorded
- [ ] Backup procedures documented
- [ ] Incident response plan created
- [ ] Team trained on operations
- [ ] Documentation shared with clients

---

## Support & Resources

### Official Resources

| Resource | URL |
|----------|-----|
| Documentation | https://seal-docs.wal.app/ |
| GitHub Repository | https://github.com/MystenLabs/seal |
| TypeScript SDK | https://www.npmjs.com/package/@mysten/seal |
| SDK Documentation | https://sdk.mystenlabs.com/seal |
| Sui Documentation | https://docs.sui.io/ |
| Sui Explorer (Mainnet) | https://suiscan.xyz/mainnet/home |
| Sui Explorer (Testnet) | https://suiscan.xyz/testnet/home |

### Community Support

- **Sui Discord:** https://discord.com/channels/916379725201563759/1356767654265880586
- **GitHub Issues:** https://github.com/MystenLabs/seal/issues
- **Project Showcase:** https://github.com/MystenLabs/awesome-seal/

### Commercial Key Server Providers (Mainnet)

At mainnet launch, the following providers offer managed Seal key server services:

- Ruby Nodes
- NodeInfra
- Studio Mirai
- Overclock
- H2O Nodes
- Triton One
- Enoki by Mysten Labs

For pricing information: https://seal-docs.wal.app/Pricing/

### Contact

For deployment assistance or questions about operating a key server:
- Contact Sui Foundation
- Reach out via Sui Discord #seal channel
- Email Mysten Labs team

---

## Research Citations

[1] Mysten Labs. "Seal - Decentralized Secrets Management." GitHub, 2024-2025. https://github.com/MystenLabs/seal

[2] Mysten Labs. "Seal Documentation - Key Server Operations." Seal Docs, 2024-2025. https://seal-docs.wal.app/KeyServerOps/

[3] Mysten Labs. "Seal Mainnet Launch: Bringing Data Privacy and Access Control to Web3." Mysten Labs Blog, 2025. https://www.mystenlabs.com/blog/seal-mainnet-launch-privacy-access-control

[4] Mysten Labs. "Mysten Labs Launches Seal Decentralized Secrets Management on Testnet." Mysten Labs Blog, 2024. https://www.mystenlabs.com/blog/mysten-labs-launches-seal-decentralized-secrets-management-on-testnet

[5] Mysten Labs. "Seal | Data encryption and onchain access control." Seal Product Page, 2025. https://seal.mystenlabs.com/

[6] Mysten Labs. "@mysten/seal - TypeScript SDK." NPM Registry, 2024-2025. https://www.npmjs.com/package/@mysten/seal

[7] Mysten Labs. "Seal SDK Documentation." TypeScript SDK Docs, 2024-2025. https://sdk.mystenlabs.com/seal

---

## Appendix

### A. Configuration Schema

```rust
// Simplified Rust types for reference

enum Network {
    Testnet,
    Mainnet,
    Custom { node_url: String },
}

enum ServerMode {
    Open,
    Permissioned,
}

enum ClientMasterKey {
    Derived,
    Imported { env_var: String },
    Exported,
}

struct ClientConfig {
    client_master_key: ClientMasterKey,
    derivation_index: Option<u32>,
    deprecated_derivation_index: Option<u32>,
    key_server_object_id: String,
    package_ids: Vec<String>,
}

struct KeyServerConfig {
    network: Network,
    server_mode: ServerMode,
    client_configs: Vec<ClientConfig>,
}
```

### B. API Endpoints

**Key Server API:**
- `GET /health` - Health check endpoint
- `POST /derive` - Key derivation endpoint (used by Seal SDK)

**Metrics:**
- `GET /metrics` - Prometheus metrics (port 9184)

### C. Example Client Integration

See full example in `/examples` directory of Seal repository:
- Allowlist example: Demonstrates package-based access control
- Subscription example: Time-based and payment-based access

### D. Threshold Encryption Explained

**Mathematical Background:**
- Uses BLS signatures and Shamir's Secret Sharing
- (t, n) threshold scheme: t-out-of-n servers needed
- Client encrypts with n public keys
- Each server holds 1/n of master secret
- t servers must cooperate to decrypt

**Security Properties:**
- No single server can decrypt alone
- System tolerates n-t server failures
- Collusion of t servers required to compromise

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Maintained By:** Technical Research Team
**Status:** Production Ready
