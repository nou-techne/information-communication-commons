# Server Performance and Security Plan

**Host:** openclaw-kelp-molt (Hetzner US-West)
**OS:** Ubuntu 24.04.3 LTS, kernel 6.8.0-90-generic
**Public IP:** 5.78.181.202 / 2a01:4ff:1f0:7e86::1
**Date:** 2026-02-13 (ETHBoulder Day 1)

---

## Audit Summary

| Category | Status | Severity |
|----------|--------|----------|
| **Firewall** | NONE — no ufw, no iptables, no nftables | CRITICAL |
| **SSH** | Root login with password possible (defaults) | CRITICAL |
| **OpenClaw group policy** | Open on Telegram + Discord with elevated tools | CRITICAL |
| **Pending reboot** | 2 kernel upgrades + libc6 waiting | HIGH |
| **Syncthing** | Port 22000 open to public internet | MEDIUM |
| **Disk encryption** | None (ext4 on bare disk) | MEDIUM |
| **Fail2ban** | Inactive / not running | MEDIUM |
| **OpenClaw update** | Available (2026.2.12) | LOW |
| **Haiku fallback model** | Weak tier in model fallbacks | LOW |
| **Auto-updates** | Enabled and current | OK |
| **OpenClaw gateway** | Bound to localhost only | OK |
| **Gateway service** | Systemd, enabled, running | OK |
| **Only root has shell** | No other user accounts | OK |

---

## LOW RISK — Safe to apply during event

### L1. OpenClaw group policy: set to allowlist

**Issue:** Telegram and Discord groupPolicy="open" with elevated tools enabled. Any group that adds the bot can trigger tool execution. This is the #1 attack surface.

**Risk:** LOW — restricts where the bot responds, doesn't affect direct messages or existing allowed groups.

**Action:** Patch OpenClaw config to set groupPolicy="allowlist" on both Telegram and Discord. Need Todd to provide the allowed group/guild IDs.

**Implementation:** 
```
gateway config.patch:
  channels.telegram.groupPolicy = "allowlist"
  channels.discord.groupPolicy = "allowlist"
```

### L2. OpenClaw update

**Issue:** Update available (2026.2.12), currently running older version.

**Risk:** LOW — OpenClaw updates are designed for in-place application with restart.

**Action:** `openclaw update run` (requires Todd's approval per workspace rules).

### L3. Remove Haiku from model fallbacks

**Issue:** anthropic/claude-haiku-4-5 in fallback chain is more susceptible to prompt injection.

**Risk:** LOW — only removes a fallback; primary model unaffected.

**Action:** Patch config to remove Haiku from agents.defaults.model.fallbacks.

---

## MEDIUM RISK — Apply after event hours or post-event

### M1. Enable firewall (ufw)

**Issue:** NO firewall is running. The server is directly exposed to the internet with zero packet filtering. Only SSH (22) and Syncthing (22000) are listening publicly, but there is nothing preventing port scans or future services from being exposed.

**Risk:** MEDIUM — enabling ufw with allow rules for current services is standard, but a misconfiguration could lock out SSH access.

**Implementation plan:**
```bash
# 1. Install ufw if needed
apt install -y ufw

# 2. Set default policies
ufw default deny incoming
ufw default allow outgoing

# 3. Allow SSH (CRITICAL — do this before enabling)
ufw allow 22/tcp comment 'SSH'

# 4. Allow Syncthing (if needed externally)
ufw allow 22000/tcp comment 'Syncthing sync'

# 5. Enable
ufw enable
```

**Rollback:** If locked out, Hetzner console access can disable ufw.

### M2. Harden SSH configuration

**Issue:** SSH is using Ubuntu defaults. PasswordAuthentication is not explicitly disabled (defaults to yes). PermitRootLogin is not explicitly set (defaults to prohibit-password on Ubuntu, but should be explicit). There are 2 authorized keys, so key-based auth is available.

**Risk:** MEDIUM — SSH config changes can lock you out if done wrong.

**Implementation plan:**
```bash
# Create hardened config
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
X11Forwarding no
AllowAgentForwarding no
EOF

# Test config before restart
sshd -t

# Restart (only if test passes)
systemctl restart sshd
```

**Rollback:** Delete the config file via Hetzner console.

### M3. Activate fail2ban

**Issue:** fail2ban is installed but inactive. Without it, SSH is vulnerable to brute-force attempts (especially with password auth currently enabled).

**Risk:** MEDIUM — could block legitimate IPs if misconfigured.

**Implementation:**
```bash
systemctl enable --now fail2ban
# Default jail.conf covers SSH
```

### M4. Restrict Syncthing to localhost or Tailscale

**Issue:** Syncthing sync protocol (port 22000) is listening on all interfaces. The web UI (8384) is correctly bound to localhost.

**Risk:** MEDIUM — Syncthing has its own auth, but reducing exposure is better.

**Action:** Configure Syncthing to sync only over Tailscale or specific IPs, or firewall-restrict port 22000.

---

## HIGH RISK — Apply only with planned maintenance window

### H1. Reboot for kernel updates

**Issue:** 2 kernel versions (6.8.0-94 and 6.8.0-100) plus libc6 are pending reboot. These include security patches.

**Risk:** HIGH during event — server downtime for 1-2 minutes during reboot.

**Action:** Schedule reboot for post-ETHBoulder (Feb 17+), or during a low-traffic overnight window.

```bash
# When ready:
reboot
```

### H2. Disk encryption (LUKS)

**Issue:** Root filesystem is unencrypted ext4 on bare disk. If physical access or Hetzner disk images are compromised, all data (including OpenClaw credentials, workspace files, secrets) is readable.

**Risk:** HIGH — requires full reinstall or complex migration to enable.

**Action:** Document as accepted risk for now. Hetzner data center physical security provides some mitigation. Long-term, consider encrypted volume or switching to Hetzner's encrypted disk offering.

### H3. Enable Tailscale and restrict SSH

**Issue:** OpenClaw status shows Tailscale is "off". If Tailscale were enabled, SSH could be restricted to the tailnet only, eliminating public SSH exposure entirely.

**Risk:** HIGH — if Tailscale fails, SSH access is lost unless Hetzner console is available.

**Action:** Post-event consideration. Would require:
1. Install/configure Tailscale
2. Verify tailnet connectivity
3. Then restrict SSH to tailnet IPs only

---

## Current Security Posture Summary

```
GOOD:
  [x] OpenClaw gateway on localhost only
  [x] Auto security updates enabled + current (last: today 00:50 UTC)
  [x] Only root account with shell
  [x] 2 SSH authorized keys present
  [x] OpenClaw systemd service managed
  [x] Syncthing GUI on localhost only

NEEDS WORK:
  [ ] No firewall (CRITICAL)
  [ ] SSH password auth not explicitly disabled (CRITICAL)
  [ ] OpenClaw open group policy + elevated tools (CRITICAL)
  [ ] Kernel reboot pending (HIGH)
  [ ] fail2ban inactive (MEDIUM)
  [ ] Syncthing port public (MEDIUM)
  [ ] No disk encryption (MEDIUM)
  [ ] No Tailscale (LOW)
  [ ] OpenClaw update available (LOW)
```

---

## Recommended Sequence

**Now (event morning):** L1, L2, L3 — OpenClaw config only, no OS changes
**Tonight (low traffic):** M1, M2, M3 — firewall + SSH hardening + fail2ban
**Post-event (Feb 17+):** H1 (reboot), H3 (Tailscale), M4 (Syncthing)
**Long-term:** H2 (disk encryption evaluation)
