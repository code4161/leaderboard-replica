#!/usr/bin/env bash
# Checks the deployed site: the API contract against the original, and parity on four pages of the live URL.
set -euo pipefail
cd "$(dirname "$0")/.."
live="$1"
node evals/api_contract.mjs --base "$live"
REPLICA="$live" node evals/parity.mjs --only home,kalshi,terms,acct_poly --vp d
node evals/live_smoke.mjs "$live"
