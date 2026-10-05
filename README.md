# CyberAim FPS - 3D Tactical Aim Trainer

A 3D tactical FPS aim training game built with HTML, CSS, JavaScript, and Three.js.

## 🎯 Weapons Included
1. **ARC-4 Assault Rifle (Key 1)**
   - **Type**: Full-Automatic
   - **Magazine**: 30 rounds (150 reserve)
   - **Fire Rate**: 110ms (~550 RPM)
   - **Sight**: Holographic optic sight with moderate zoom (ADS)
   - **Traits**: Recoil kick, continuous spray on holding Left Mouse Button.

2. **APEX-9 Tactical Pistol (Key 2)**
   - **Type**: Semi-Automatic
   - **Magazine**: 15 rounds (90 reserve)
   - **Fire Rate**: 180ms
   - **Sight**: Tritium night iron sights
   - **Traits**: Snappy handling, crisp semi-auto fire.

3. **TITAN .50 Scoped Sniper (Key 3)**
   - **Type**: Bolt-Action High Caliber
   - **Magazine**: 5 rounds (25 reserve)
   - **Fire Rate**: 980ms
   - **Sight**: Fullscreen 12x magnification telescopic scope with tactical mil-dot reticle
   - **Traits**: Extreme precision, one-shot bullseye power, heavy recoil and sound.

---

## 🎮 How to Play
- **Launch**: Double-click [start.bat](file:///c:/Users/neond/Desktop/chemi%20priveli%20proekti/start.bat) or open [index.html](file:///c:/Users/neond/Desktop/chemi%20priveli%20proekti/index.html) in any modern browser (Chrome, Edge, Firefox, Brave).
- **Start**: Click **"CLICK TO START TRAINING"** to lock the mouse cursor and begin.

### Controls:
| Action | Key / Input |
|---|---|
| **Look / Aim** | Mouse (Sensitivity adjustable in menu) |
| **Shoot** | **Left Mouse Button** (Hold for full-auto rifle) |
| **Aim Down Sights / Scope** | **Right Mouse Button** (Hold to zoom/scope) |
| **Move / Strafe** | **W, A, S, D** |
| **Reload** | **R** |
| **Switch Weapon** | **1, 2, 3** or **Mouse Wheel** |
| **Pause / Settings** | **ESC** |

---

## 🎯 Aim Training Modes
- **Gridshot**: Classic 4-target target field. Shoot one and another instantly spawns. Great for flicking speed and target acquisition.
- **Tracking**: Dynamic targets moving along smooth horizontal and vertical oscillating trajectories. Great for smooth crosshair tracking.
- **Reflex Pop**: Targets appear for a limited time and shrink before vanishing. Tests reaction speed under pressure.

---

## 📦 Features
- **Procedural 3D Weapon Models**: Matte gunmetal receiver, magazine, tactical attachments, sights, and muzzle light flashes.
- **Synthesized Audio Engine**: 100% self-contained Web Audio API sounds for gunshots, bolt cycles, reloads, dry clicks, and crisp hit pings.
- **Ammo System**: Current mag, reserve count, reload cooldown progress bar, and shootable ammo refill crates in the range.
- **Instant Hit Feedback**: Dynamic hitmarkers (white for hit, red for bullseye), floating point popups, and glowing particle shatter.
