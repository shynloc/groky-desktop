#!/bin/bash
echo "=== Groky Environment Check ==="
echo ""

if command -v cargo &> /dev/null; then
  echo "✅ cargo found: $(cargo --version)"
else
  echo "❌ cargo NOT found"
  echo ""
  echo "Please install Rust:"
  echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  echo "  source \"\$HOME/.cargo/env\""
  exit 1
fi

if command -v grok &> /dev/null; then
  echo "✅ grok CLI found: $(grok --version)"
else
  echo "⚠️  grok CLI not found in PATH (real integration may fail)"
fi

echo ""
echo "Environment looks good for Tauri development!"