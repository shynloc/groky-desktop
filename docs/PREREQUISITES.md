# Groky Development Prerequisites

## Required Tools

### 1. Node.js + npm (you already have this)
- Node 20+
- Confirmed working

### 2. Rust Toolchain (CRITICAL - this is why `tauri dev` is failing)

**Error you're seeing:**
```
failed to run 'cargo metadata' command...
No such file or directory (os error 2)
```

This means **Cargo (Rust) is not installed**.

### Install Rust on macOS

```bash
# Option A: Recommended (official installer)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# After the installer finishes, restart your terminal completely
# OR run this in the current terminal:
source "$HOME/.cargo/env"

# Verify
cargo --version
rustc --version
```

### 3. Xcode Command Line Tools (macOS)

```bash
xcode-select --install
```

If it says already installed, you're good.

### 4. After Installing Rust

```bash
cd ~/groky

# Install any missing Rust targets (usually not needed on first try)
rustup target add aarch64-apple-darwin x86_64-apple-darwin

# Now run
npm run tauri:dev
```

## Quick Verification

```bash
which cargo
which rustc
cargo --version
```

If any of these are missing → install Rust first.

## Common Issues

| Problem                          | Solution                                      |
|----------------------------------|-----------------------------------------------|
| `cargo` command not found        | Run `source "$HOME/.cargo/env"` or restart terminal |
| First build is very slow         | Normal. Rust compiles the Tauri runtime once |
| "xcrun: error" on macOS          | Run `xcode-select --install`                  |
| Permission issues                | The rustup installer usually handles this   |

Once Cargo is available, `npm run tauri:dev` will work and compile the Rust side (`src-tauri`).
