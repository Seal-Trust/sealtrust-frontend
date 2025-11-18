# Seal Key Server Quick Reference

## Essential Commands

### Initial Setup

```bash
# Generate master seed (KEEP SECRET!)
cargo run --release --bin seal-cli gen-seed

# Discover derived public keys
export MASTER_KEY=0xYourSeed
export CONFIG_PATH=/path/to/config.yaml
cargo run --release --bin key-server
```

### On-Chain Registration

```bash
# Testnet
sui client call \
  --package 0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682 \
  --module key_server \
  --function create_and_transfer_v1 \
  --args "ServerName" "https://your-url.com" 0 "0xPubKey..." \
  --gas-budget 50000000

# Mainnet
sui client call \
  --package 0xa212c4c6c7183b911d0be8768f4cb1df7a383025b5d0ba0c014009f0f30f5f8d \
  --module key_server \
  --function create_and_transfer_v1 \
  --args "ServerName" "https://your-url.com" 0 "0xPubKey..." \
  --gas-budget 50000000
```

### Docker Operations

```bash
# Build
docker build -t seal-key-server:v0.9.4 . --build-arg GIT_REVISION="$(git describe --always)"

# Run
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

## Configuration Templates

### Permissioned Mode (Production)

```yaml
network: !Mainnet

server_mode: !Permissioned

client_configs:
  - client_master_key: !Derived
    derivation_index: 0
    key_server_object_id: "0x..."
    package_ids:
      - "0xClientPolicyPackageId..."
```

### Environment Variables

```bash
MASTER_KEY=0xYourMasterSeed
CONFIG_PATH=/path/to/config.yaml
RUST_LOG=info
```

## Key Operations

### Export Client Key

```bash
cargo run --release --bin seal-cli derive-key --seed 0xSeed --index 0
```

### Transfer Key Server Object

```bash
sui client transfer --object-id 0x... --to 0xNewOwner... --gas-budget 10000000
```

### Update Server URL

```bash
sui client call \
  --package 0xa212c4c6... \
  --module key_server \
  --function update \
  --args 0xObjectId... "https://new-url.com" \
  --gas-budget 10000000
```

## Monitoring

```bash
# Health check
curl http://localhost:2024/health

# Metrics
curl http://localhost:9184/metrics
```

## Package IDs

- **Testnet:** `0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682`
- **Mainnet:** `0xa212c4c6c7183b911d0be8768f4cb1df7a383025b5d0ba0c014009f0f30f5f8d`

## Ports

- **2024** - Key server API (internal only)
- **9184** - Prometheus metrics (internal only)
- **443** - HTTPS (public via reverse proxy)

## Client SDK Example

```typescript
import { SealClient } from '@mysten/seal';

const sealClient = new SealClient({
  suiClient,
  keyServers: [{
    url: 'https://seal.mycompany.com',
    objectId: '0x...',
  }],
  threshold: 1,
});
```

## Resources

- **Docs:** https://seal-docs.wal.app/
- **GitHub:** https://github.com/MystenLabs/seal
- **NPM:** https://www.npmjs.com/package/@mysten/seal
- **Discord:** https://discord.com/channels/916379725201563759/1356767654265880586
