// Weapons definition and procedural 3D viewmodel generator
class WeaponManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.weapons = {
            rifle: {
                id: 'rifle',
                name: 'ARC-4 ASSAULT RIFLE',
                slot: 1,
                automatic: true,
                fireRate: 110, // ms between shots
                magSize: 30,
                currentAmmo: 30,
                reserveAmmo: 150,
                reloadTime: 1800, // ms
                damage: 35,
                hipFov: 75,
                adsFov: 50,
                adsSpread: 0.001,
                hipSpread: 0.015,
                recoilV: 0.04,
                recoilH: 0.01,
                recoilKick: 0.08,
                modelOffset: new THREE.Vector3(0.24, -0.22, -0.45),
                adsOffset: new THREE.Vector3(0.0, -0.165, -0.32),
                soundMethod: () => window.soundManager.playRifle()
            },
            pistol: {
                id: 'pistol',
                name: 'APEX-9 TACTICAL PISTOL',
                slot: 2,
                automatic: false,
                fireRate: 180,
                magSize: 15,
                currentAmmo: 15,
                reserveAmmo: 90,
                reloadTime: 1300,
                damage: 50,
                hipFov: 75,
                adsFov: 62,
                adsSpread: 0.002,
                hipSpread: 0.02,
                recoilV: 0.06,
                recoilH: 0.008,
                recoilKick: 0.09,
                modelOffset: new THREE.Vector3(0.2, -0.19, -0.38),
                adsOffset: new THREE.Vector3(0.0, -0.145, -0.28),
                soundMethod: () => window.soundManager.playPistol()
            },
            sniper: {
                id: 'sniper',
                name: 'TITAN .50 SCOPED SNIPER',
                slot: 3,
                automatic: false,
                fireRate: 980,
                magSize: 5,
                currentAmmo: 5,
                reserveAmmo: 25,
                reloadTime: 2300,
                damage: 150,
                hipFov: 75,
                adsFov: 16, // Heavy zoom
                adsSpread: 0.0001,
                hipSpread: 0.06, // Inaccurate if no-scoped
                recoilV: 0.12,
                recoilH: 0.02,
                recoilKick: 0.16,
                isScoped: true,
                modelOffset: new THREE.Vector3(0.25, -0.24, -0.55),
                adsOffset: new THREE.Vector3(0.0, -0.18, -0.4),
                soundMethod: () => window.soundManager.playSniper()
            }
        };

        this.currentWeaponKey = 'rifle';
        this.isReloading = false;
        this.isADS = false;
        this.lastShotTime = 0;
        this.recoilOffset = new THREE.Vector3();
        this.recoilRotation = new THREE.Euler();
        this.swayOffset = new THREE.Vector2();

        // 3D Viewmodel container attached directly to camera
        this.viewmodelRoot = new THREE.Group();
        this.camera.add(this.viewmodelRoot);

        // Muzzle flash dynamic light
        this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 8);
        this.camera.add(this.muzzleLight);

        // Create models for each weapon
        this.models = {};
        this.createModels();

        // Activate initial weapon
        this.switchWeapon('rifle', true);
    }

    get currentWeapon() {
        return this.weapons[this.currentWeaponKey];
    }

    createMaterials() {
        return {
            gunmetal: new THREE.MeshStandardMaterial({
                color: 0x1a1c22,
                roughness: 0.35,
                metalness: 0.85
            }),
            darkPolymer: new THREE.MeshStandardMaterial({
                color: 0x101114,
                roughness: 0.7,
                metalness: 0.2
            }),
            accentCyan: new THREE.MeshStandardMaterial({
                color: 0x00f3ff,
                emissive: 0x00a3cc,
                emissiveIntensity: 0.8,
                roughness: 0.2
            }),
            tritiumGreen: new THREE.MeshStandardMaterial({
                color: 0x39ff14,
                emissive: 0x39ff14,
                emissiveIntensity: 1.2
            }),
            amberGlow: new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xff8800,
                emissiveIntensity: 0.9
            }),
            opticGlass: new THREE.MeshPhysicalMaterial({
                color: 0x05101a,
                transmission: 0.85,
                opacity: 0.9,
                transparent: true,
                roughness: 0.1
            })
        };
    }

    createModels() {
        const mats = this.createMaterials();

        // 1. ARC-4 RIFLE
        const rifleGroup = new THREE.Group();

        // Receiver / body
        const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.42), mats.gunmetal);
        rifleGroup.add(rifleBody);

        // Handguard / barrel shroud
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.28), mats.darkPolymer);
        handguard.position.set(0, 0.005, -0.32);
        rifleGroup.add(handguard);

        // Barrel + Muzzle brake
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 12), mats.gunmetal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.01, -0.5);
        rifleGroup.add(barrel);

        const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8), mats.darkPolymer);
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.set(0, 0.01, -0.66);
        rifleGroup.add(muzzleBrake);

        // Curved Magazine
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.09), mats.darkPolymer);
        mag.position.set(0, -0.12, -0.06);
        mag.rotation.x = 0.18;
        rifleGroup.add(mag);

        // Pistol grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.07), mats.darkPolymer);
        grip.position.set(0, -0.09, 0.14);
        grip.rotation.x = -0.32;
        rifleGroup.add(grip);

        // Tactical stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.22), mats.darkPolymer);
        stock.position.set(0, -0.01, 0.28);
        rifleGroup.add(stock);

        // Holographic Sight Mount & Glass
        const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.12), mats.gunmetal);
        opticBase.position.set(0, 0.065, -0.05);
        rifleGroup.add(opticBase);

        const opticRing = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.02), mats.darkPolymer);
        opticRing.position.set(0, 0.09, -0.1);
        rifleGroup.add(opticRing);

        const holoReticle = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 8), mats.accentCyan);
        holoReticle.position.set(0, 0.09, -0.09);
        rifleGroup.add(holoReticle);

        // Cyber neon strip
        const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.01, 0.22), mats.accentCyan);
        neonStrip.position.set(0, 0.02, -0.1);
        rifleGroup.add(neonStrip);

        this.models.rifle = rifleGroup;
        this.viewmodelRoot.add(rifleGroup);

        // 2. APEX-9 PISTOL
        const pistolGroup = new THREE.Group();

        // Slide
        const pSlide = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.24), mats.gunmetal);
        pSlide.position.set(0, 0.04, 0);
        pistolGroup.add(pSlide);

        // Frame / lower
        const pFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), mats.darkPolymer);
        pFrame.position.set(0, 0, 0);
        pistolGroup.add(pFrame);

        // Grip
        const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.13, 0.06), mats.darkPolymer);
        pGrip.position.set(0, -0.07, 0.07);
        pGrip.rotation.x = -0.22;
        pistolGroup.add(pGrip);

        // Trigger guard
        const pTriggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.06), mats.gunmetal);
        pTriggerGuard.position.set(0, -0.03, 0.01);
        pistolGroup.add(pTriggerGuard);

        // Front & rear tritium night sights
        const pFrontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.01), mats.tritiumGreen);
        pFrontSight.position.set(0, 0.07, -0.11);
        pistolGroup.add(pFrontSight);

        const pRearSightL = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.01), mats.tritiumGreen);
        pRearSightL.position.set(-0.012, 0.07, 0.11);
        pistolGroup.add(pRearSightL);

        const pRearSightR = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.01), mats.tritiumGreen);
        pRearSightR.position.set(0.012, 0.07, 0.11);
        pistolGroup.add(pRearSightR);

        this.models.pistol = pistolGroup;
        this.viewmodelRoot.add(pistolGroup);

        // 3. TITAN .50 SNIPER
        const sniperGroup = new THREE.Group();

        // Massive receiver
        const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.55), mats.gunmetal);
        sniperGroup.add(sBody);

        // Long heavy fluted barrel
        const sBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 16), mats.gunmetal);
        sBarrel.rotation.x = Math.PI / 2;
        sBarrel.position.set(0, 0.01, -0.56);
        sniperGroup.add(sBarrel);

        // Aggressive muzzle brake
        const sMuzzle = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 0.1), mats.darkPolymer);
        sMuzzle.position.set(0, 0.01, -0.88);
        sniperGroup.add(sMuzzle);

        // Large high-powered telescopic scope
        const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.32, 16), mats.darkPolymer);
        scopeTube.rotation.x = Math.PI / 2;
        scopeTube.position.set(0, 0.1, -0.06);
        sniperGroup.add(scopeTube);

        // Scope objective & eyepiece bells
        const scopeObjective = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.026, 0.08, 16), mats.gunmetal);
        scopeObjective.rotation.x = Math.PI / 2;
        scopeObjective.position.set(0, 0.1, -0.23);
        sniperGroup.add(scopeObjective);

        const scopeEyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.035, 0.07, 16), mats.gunmetal);
        scopeEyepiece.rotation.x = Math.PI / 2;
        scopeEyepiece.position.set(0, 0.1, 0.1);
        sniperGroup.add(scopeEyepiece);

        // Scope rings
        const scopeRing1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), mats.gunmetal);
        scopeRing1.position.set(0, 0.07, -0.15);
        sniperGroup.add(scopeRing1);
        const scopeRing2 = scopeRing1.clone();
        scopeRing2.position.set(0, 0.07, 0.03);
        sniperGroup.add(scopeRing2);

        // Heavy box magazine
        const sMag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.12), mats.darkPolymer);
        sMag.position.set(0, -0.13, -0.05);
        sniperGroup.add(sMag);

        // Heavy ergonomic stock with cheek pad
        const sStock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.32), mats.darkPolymer);
        sStock.position.set(0, -0.02, 0.38);
        sniperGroup.add(sStock);

        const sCheekPad = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.04, 0.16), mats.amberGlow);
        sCheekPad.position.set(0, 0.06, 0.32);
        sniperGroup.add(sCheekPad);

        // Bolt action handle
        const boltHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), mats.gunmetal);
        boltHandle.rotation.z = Math.PI / 2.5;
        boltHandle.position.set(0.06, 0.04, 0.08);
        sniperGroup.add(boltHandle);

        this.models.sniper = sniperGroup;
        this.viewmodelRoot.add(sniperGroup);
    }

    switchWeapon(key, force = false) {
        if (!this.weapons[key]) return;
        if (!force && this.currentWeaponKey === key && this.models[key] && this.models[key].visible) return;
        if (this.isReloading) this.cancelReload();

        // Reset ADS on weapon switch
        this.setADS(false);

        this.currentWeaponKey = key;
        if (!force) window.soundManager.playSwitch();

        // Update 3D model visibility
        Object.keys(this.models).forEach(k => {
            if (this.models[k]) {
                this.models[k].visible = (k === key);
            }
        });

        this.updateHUD();
    }

    canShoot(time) {
        if (this.isReloading) return false;
        const w = this.currentWeapon;
        if (time - this.lastShotTime < w.fireRate) return false;
        return true;
    }

    shoot(time, hitCallback) {
        if (!this.canShoot(time)) return false;

        const w = this.currentWeapon;
        if (w.currentAmmo <= 0) {
            window.soundManager.playDryFire();
            this.lastShotTime = time + 200; // Small delay
            if (w.reserveAmmo > 0) {
                this.startReload();
            }
            return false;
        }

        // Consume ammo
        w.currentAmmo--;
        this.lastShotTime = time;

        // Play sound
        w.soundMethod();

        // Recoil kick
        this.applyRecoil();

        // Muzzle flash light
        this.muzzleLight.intensity = 3.5;
        setTimeout(() => { this.muzzleLight.intensity = 0; }, 55);

        // Update HUD
        this.updateHUD();

        // Calculate bullet spread
        const spread = this.isADS ? w.adsSpread : w.hipSpread;
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;

        // Trigger hit detection via callback
        if (hitCallback) {
            hitCallback(spreadX, spreadY, w.damage);
        }

        return true;
    }

    applyRecoil() {
        const w = this.currentWeapon;
        // Gun physical kickback
        this.recoilOffset.z += w.recoilKick;
        this.recoilOffset.y += w.recoilKick * 0.4;
        this.recoilRotation.x += w.recoilV;
        this.recoilRotation.y += (Math.random() - 0.5) * w.recoilH;
    }

    startReload() {
        const w = this.currentWeapon;
        if (this.isReloading) return;
        if (w.currentAmmo >= w.magSize) return; // Full mag
        if (w.reserveAmmo <= 0) return; // No ammo left

        this.isReloading = true;
        window.soundManager.playReload();

        // UI reload indicator
        const reloadBar = document.getElementById('reload-progress-bar');
        const reloadContainer = document.getElementById('reload-indicator');
        if (reloadContainer) reloadContainer.classList.add('active');
        if (reloadBar) {
            reloadBar.style.transition = 'none';
            reloadBar.style.width = '0%';
            setTimeout(() => {
                reloadBar.style.transition = `width ${w.reloadTime}ms linear`;
                reloadBar.style.width = '100%';
            }, 20);
        }

        this.reloadTimeout = setTimeout(() => {
            const needed = w.magSize - w.currentAmmo;
            const toAdd = Math.min(needed, w.reserveAmmo);
            w.currentAmmo += toAdd;
            w.reserveAmmo -= toAdd;
            this.isReloading = false;
            if (reloadContainer) reloadContainer.classList.remove('active');
            this.updateHUD();
        }, w.reloadTime);
    }

    cancelReload() {
        if (!this.isReloading) return;
        clearTimeout(this.reloadTimeout);
        this.isReloading = false;
        const reloadContainer = document.getElementById('reload-indicator');
        if (reloadContainer) reloadContainer.classList.remove('active');
    }

    addAmmo(amount) {
        const w = this.currentWeapon;
        w.reserveAmmo += amount;
        this.updateHUD();
    }

    setADS(state) {
        if (this.isADS === state) return;
        this.isADS = state;

        const scopeOverlay = document.getElementById('sniper-scope-overlay');
        const crosshair = document.getElementById('crosshair');

        if (this.currentWeaponKey === 'sniper' && this.isADS) {
            if (scopeOverlay) scopeOverlay.classList.add('active');
            if (crosshair) crosshair.classList.add('scoped');
            // Hide sniper model during full-screen scope for clean sight picture
            if (this.models.sniper) this.models.sniper.visible = false;
        } else {
            if (scopeOverlay) scopeOverlay.classList.remove('active');
            if (crosshair) crosshair.classList.remove('scoped');
            if (this.models.sniper && this.currentWeaponKey === 'sniper') {
                this.models.sniper.visible = true;
            }
        }
    }

    update(delta, moveVelocity, mouseDelta) {
        const w = this.currentWeapon;
        const currentModel = this.models[this.currentWeaponKey];

        // Smooth camera FOV zoom
        const targetFov = this.isADS ? w.adsFov : w.hipFov;
        this.camera.fov += (targetFov - this.camera.fov) * (delta * 14);
        this.camera.updateProjectionMatrix();

        // Mouse sway
        if (mouseDelta) {
            this.swayOffset.x += (mouseDelta.x * 0.0003 - this.swayOffset.x) * (delta * 12);
            this.swayOffset.y += (mouseDelta.y * 0.0003 - this.swayOffset.y) * (delta * 12);
        }

        // Recoil decay / spring recovery
        this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), delta * 12);
        this.recoilRotation.x = THREE.MathUtils.lerp(this.recoilRotation.x, 0, delta * 14);
        this.recoilRotation.y = THREE.MathUtils.lerp(this.recoilRotation.y, 0, delta * 14);

        // Movement bobbing
        const speed = moveVelocity ? moveVelocity.length() : 0;
        const bobTime = performance.now() * 0.008;
        const bobX = Math.cos(bobTime) * (speed * 0.008);
        const bobY = Math.abs(Math.sin(bobTime)) * (speed * 0.008);

        // Target base offset: Hip vs ADS
        const targetBase = this.isADS ? w.adsOffset : w.modelOffset;

        if (currentModel) {
            // Lerp model position
            currentModel.position.x = THREE.MathUtils.lerp(
                currentModel.position.x,
                targetBase.x + this.recoilOffset.x - this.swayOffset.x + (this.isADS ? 0 : bobX),
                delta * 16
            );
            currentModel.position.y = THREE.MathUtils.lerp(
                currentModel.position.y,
                targetBase.y + this.recoilOffset.y - this.swayOffset.y - (this.isADS ? 0 : bobY),
                delta * 16
            );
            currentModel.position.z = THREE.MathUtils.lerp(
                currentModel.position.z,
                targetBase.z + this.recoilOffset.z,
                delta * 16
            );

            // Lerp model rotation
            currentModel.rotation.x = THREE.MathUtils.lerp(
                currentModel.rotation.x,
                this.recoilRotation.x + this.swayOffset.y * 0.6,
                delta * 18
            );
            currentModel.rotation.y = THREE.MathUtils.lerp(
                currentModel.rotation.y,
                this.recoilRotation.y - this.swayOffset.x * 0.6,
                delta * 18
            );
        }
    }

    updateHUD() {
        const w = this.currentWeapon;
        const currentAmmoEl = document.getElementById('hud-current-ammo');
        const reserveAmmoEl = document.getElementById('hud-reserve-ammo');
        const weaponNameEl = document.getElementById('hud-weapon-name');
        const weaponTypeEl = document.getElementById('hud-weapon-type');

        if (currentAmmoEl) currentAmmoEl.innerText = w.currentAmmo;
        if (reserveAmmoEl) reserveAmmoEl.innerText = `/ ${w.reserveAmmo}`;
        if (weaponNameEl) weaponNameEl.innerText = w.name;
        if (weaponTypeEl) {
            weaponTypeEl.innerText = w.automatic ? 'FULL-AUTO' : (w.isScoped ? 'BOLT-ACTION .50' : 'SEMI-AUTO');
        }

        // Low ammo warning highlight
        if (currentAmmoEl) {
            if (w.currentAmmo === 0) {
                currentAmmoEl.style.color = '#ff3355';
            } else if (w.currentAmmo <= Math.floor(w.magSize * 0.25)) {
                currentAmmoEl.style.color = '#ffaa00';
            } else {
                currentAmmoEl.style.color = '#00f3ff';
            }
        }

        // Active weapon slot indicator
        const slots = document.querySelectorAll('.slot-btn');
        slots.forEach(slot => {
            if (slot.dataset.weapon === this.currentWeaponKey) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }
}

window.WeaponManager = WeaponManager;
