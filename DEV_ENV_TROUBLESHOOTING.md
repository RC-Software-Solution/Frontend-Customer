# Dev Environment Troubleshooting (Windows)

Runbook for the two recurring blockers on this machine:

1. [Test device can't reach the Expo dev server](#1-test-device-cant-reach-the-expo-dev-server)
2. [`node` dies with an OpenSSL configuration error](#2-node-dies-with-an-openssl-configuration-error)

Both have been diagnosed to root cause and fixed before. Start with the **Fast fix**; only drop into the diagnostic ladder if it doesn't take.

Environment this was written against: Expo SDK 57, React Native 0.86.3, Metro on `8081`, RC backend services on `4001-4007`.

---

## 1. Test device can't reach the Expo dev server

**Symptom:** Laptop and phone are on the same Wi-Fi. `expo start` shows a QR code and a LAN URL, but the device times out — "Something went wrong", "Could not connect to development server", or the QR scan just hangs.

### Fast fix

Open **PowerShell as Administrator** and run:

```powershell
Set-NetFirewallProfile -Profile Public,Private -AllowInboundRules True
```

Verify from the **test device's browser** (not the laptop — the laptop short-circuits via loopback and will pass even when broken):

```
http://<LAPTOP_LAN_IP>:8081/status
```

Expected response: `packager-status:running`

That's it in the overwhelming majority of cases. No Expo restart needed — the setting takes effect immediately.

### Why this happens

Windows Firewall has a setting called *"Block all incoming connections, including those in the list of allowed apps."* When it's on, Windows **discards the entire inbound allow-rule table** rather than evaluating it.

The distinction is invisible in most tooling:

| `netsh` shows | Meaning |
|---|---|
| `BlockInbound` | Default deny, **then consult allow rules** |
| `BlockInboundAlways` | Deny, **skip allow rules entirely** |

So the rule `Expo Dev (Metro 8081 + RC services 4001-4007)` can be present, enabled, correctly scoped to TCP 8081 + 4001-4007, `Any` profile, `Any` remote address — and still do absolutely nothing.

**This is why adding more firewall rules never fixes it.** The rules aren't wrong; they're not being read.

> **Trap:** the standard internet advice is "change your network from Public to Private." On this machine that does **not** help — `Private` had `AllowInboundRules = False` too. Only `Domain` (the corporate LAN) honoured rules, which is exactly why Expo works at the office and fails on a hotspot. The command above fixes Public *and* Private.

### Diagnostic ladder

Only needed if the fast fix didn't resolve it. Work top to bottom — each step eliminates one layer.

**Step 1 — Is Metro actually running and bound to all interfaces?**

```bash
netstat -ano | grep ":8081"
```

Want to see `0.0.0.0:8081 ... LISTENING`. If it says `127.0.0.1:8081`, Metro is localhost-only and no device will ever reach it.

Confirm which project owns it (easy to have a stale server from another repo squatting on 8081):

```powershell
Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object CommandLine
```

**Step 2 — Is the server healthy?**

```bash
curl -s http://127.0.0.1:8081/status
```

Expect `packager-status:running`.

**Step 3 — Which IP is Expo advertising?**

SDK 57 uses the `lan-network` package, which is gateway-aware and picks correctly even with Hyper-V, WSL and Mobile Hotspot adapters present. Confirm what it resolves to:

```bash
node -e "console.log(require('lan-network').lanNetworkSync({}))"
```

You want `iname: 'Wi-Fi'` and your real LAN address. If it returns a `172.x` (Hyper-V / WSL) or `192.168.137.x` (Windows Mobile Hotspot) address, force the right one:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="<LAPTOP_LAN_IP>"; npx expo start --clear
```

Turning off **Windows Mobile Hotspot** also removes a decoy adapter and makes this deterministic.

**Step 4 — Can the two machines reach each other at all?**

Find the device's IP (Android: Settings → About → Status), or read the ARP table:

```bash
arp -a | grep <YOUR_SUBNET_PREFIX>
ping <DEVICE_IP>
```

- **Ping succeeds** → no AP client isolation; the network is fine and the problem is host-local (firewall). Go back to the fast fix.
- **Ping fails** → AP client isolation. The access point is refusing to forward client-to-client traffic. See Step 5.

**Step 5 — AP client isolation (only if ping fails)**

Common on phone hotspots and guest / corporate Wi-Fi. Fixes, in order of preference:

- Secure the hotspot with **WPA2 or WPA3**. Open/unprotected hotspots enable client isolation by default on Android — this bit us before.
- Use a different network (a home router, or a second phone's hotspot).
- Last resort, works on any network: `npx expo start --tunnel` (slower, but routes around the LAN entirely).

**Step 6 — Confirm the firewall state directly**

```powershell
Get-NetFirewallProfile -PolicyStore ActiveStore |
  Select-Object Name,DefaultInboundAction,AllowInboundRules
```

Healthy (current, verified-working) state:

```
Name     DefaultInboundAction  AllowInboundRules
Domain   Block                 True
Private  Block                 True
Public   Block                 True
```

If `AllowInboundRules` is `False` anywhere, re-run the fast fix.

Check the allow rule itself still exists:

```powershell
Get-NetFirewallRule -DisplayName 'Expo Dev (Metro 8081 + RC services 4001-4007)' |
  Select-Object DisplayName,Enabled,Direction,Action,Profile
```

If it's gone, recreate it (single line, run as Administrator):

```powershell
New-NetFirewallRule -DisplayName 'Expo Dev (Metro 8081 + RC services 4001-4007)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081,4001-4007 -Profile Any
```

### Security note

`AllowInboundRules = True` restores *normal* firewall behaviour (default-deny plus explicit allows) — it does **not** open the machine up wholesale. But it does mean ports 8081 and 4001-4007 become genuinely reachable by anything on the same network. On an untrusted network (café, airport, conference Wi-Fi), prefer `--tunnel` over opening inbound ports.

---

## 2. `node` dies with an OpenSSL configuration error

**Symptom:** every `node` / `npm` / `npx` command fails immediately:

```
C:\Program Files\nodejs\node.exe: OpenSSL configuration error:
...error:80000005:system library:BIO_new_file:Input/output error:
...calling fopen(C:\Program Files\OpenSSL-Win64\bin, rb)
```

### Fast fix

Clear it for the current shell:

```bash
# Git Bash
unset OPENSSL_CONF
```

```powershell
# PowerShell
Remove-Item Env:OPENSSL_CONF
```

`node -e "console.log('ok')"` should now work. **This only fixes the shell you ran it in.**

### Permanent fix

**Log off and log back on** (or reboot).

That is genuinely the whole fix — no registry edit required, because the registry is already clean. See below for why.

### Why this happens

`OPENSSL_CONF` is supposed to point at an OpenSSL config **file** (`openssl.cnf`). Here it points at a **directory** (`C:\Program Files\OpenSSL-Win64\bin`), so `fopen()` fails and Node aborts before running any JavaScript.

The confusing part is where it comes from. When this last occurred:

```
HKCU\Environment                        -> OPENSSL_CONF absent
HKLM\...\Session Manager\Environment    -> OPENSSL_CONF absent
Process environment (VSCode + children) -> OPENSSL_CONF SET
```

The registry was clean, yet every shell still had it. The reason is **environment block inheritance**:

- Windows builds your session's environment block once, at **logon**, by reading the registry.
- `explorer.exe` inherits that block, and every app launched from the taskbar or Start menu inherits it from Explorer.
- Deleting the registry value afterwards does **not** retroactively update any already-running process — including the logon session itself.

So a value removed from the registry keeps propagating into brand-new terminals until the session is torn down. Restarting VSCode isn't enough if it's relaunched from the same stale Explorer. Restarting Explorer isn't enough either, since it re-inherits from `userinit` / `winlogon` from logon time.

**Only a logoff/logon or reboot rebuilds the environment block.**

This is exactly why the problem appeared to "come back" after being fixed once — it was never actually back; the stale session had simply never been recycled.

### Verify it's really gone

After logging back in, from a **fresh** terminal:

```bash
echo "${OPENSSL_CONF:-<unset>}"    # want: <unset>
node -e "console.log('node OK')"   # want: node OK
```

And confirm nothing has re-persisted it:

```powershell
[Environment]::GetEnvironmentVariable('OPENSSL_CONF','User')
[Environment]::GetEnvironmentVariable('OPENSSL_CONF','Machine')
```

Both should return empty. If either has a value, an installer put it back — delete it there, then log off and on again:

```powershell
[Environment]::SetEnvironmentVariable('OPENSSL_CONF',$null,'User')     # or 'Machine' (needs admin)
```

### If you actually need OpenSSL on PATH

Don't unset it — point it at the real config file instead of the `bin` directory:

```powershell
[Environment]::SetEnvironmentVariable('OPENSSL_CONF','C:\Program Files\OpenSSL-Win64\bin\openssl.cnf','User')
```

Check that file exists first. If it doesn't, leaving `OPENSSL_CONF` unset is the correct state — Node ships its own OpenSSL and needs no external config.

---

## 30-second triage

| Symptom | Almost certainly |
|---|---|
| Device times out, but laptop `curl` to its own LAN IP works | Firewall `AllowInboundRules = False` → §1 fast fix |
| `ping <device>` fails from the laptop | AP client isolation → secure the hotspot, or `--tunnel` |
| Expo prints a `172.x` / `192.168.137.x` URL | Wrong adapter picked → `REACT_NATIVE_PACKAGER_HOSTNAME` |
| Every `node` / `npm` command errors on OpenSSL | Stale env block → `unset OPENSSL_CONF`, then log off/on |
| Worked yesterday, broken today, nothing changed | Check the firewall profile first — a network category flip moves you onto a different profile |

---

## Diagnostic principle worth keeping

Test reachability **from the device**, never from the laptop. Traffic a machine sends to its own LAN IP is short-circuited through the loopback path and never traverses the inbound firewall — so `curl http://<own-lan-ip>:8081/status` returns `200` on a machine that is comprehensively firewalled off from the entire network. That one false-positive is what makes this class of bug feel unfalsifiable.
