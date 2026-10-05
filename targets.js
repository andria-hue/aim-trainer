// Target management, humanoid dummy construction, hit registration, particle explosions and scoring
class TargetManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.targets = [];
        this.particles = [];
        this.floatingTexts = [];

        // Game state
        this.score = 0;
        this.hits = 0;
        this.shots = 0;
        this.headshots = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.currentMode = 'gridshot'; // 'gridshot', 'tracking', 'reflex'
        this.maxTargets = 4;

        // Shared materials for tactical humanoid training dummy
        this.targetMaterials = {
            armorMain: new THREE.MeshStandardMaterial({
                color: 0x1b202a,
                roughness: 0.42,
                metalness: 0.65
            }),
            armorSlate: new THREE.MeshStandardMaterial({
                color: 0x283244,
                roughness: 0.5,
                metalness: 0.45
            }),
            undersuit: new THREE.MeshStandardMaterial({
                color: 0x0f1116,
                roughness: 0.8,
                metalness: 0.2
            }),
            metalJoint: new THREE.MeshStandardMaterial({
                color: 0x364052,
                roughness: 0.3,
                metalness: 0.85
            }),
            visor: new THREE.MeshStandardMaterial({
                color: 0x00f3ff,
                emissive: 0x00d8f0,
                emissiveIntensity: 1.4,
                roughness: 0.1,
                metalness: 0.5
            }),
            bullseyeCore: new THREE.MeshStandardMaterial({
                color: 0xff0055,
                emissive: 0xff0055,
                emissiveIntensity: 1.4,
                roughness: 0.2,
                metalness: 0.4
            }),
            bullseyeRing: new THREE.MeshStandardMaterial({
                color: 0x00f3ff,
                emissive: 0x00b8d4,
                emissiveIntensity: 0.9,
                roughness: 0.25,
                metalness: 0.7
            }),
            basePlate: new THREE.MeshStandardMaterial({
                color: 0x141822,
                roughness: 0.55,
                metalness: 0.75
            }),
            ammoCrate: new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xff7700,
                emissiveIntensity: 0.8,
                roughness: 0.3
            })
        };

        // Shared geometries for performance
        this.targetGeos = {
            basePlate: new THREE.CylinderGeometry(0.48, 0.52, 0.04, 20),
            basePost: new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10),
            boot: new THREE.BoxGeometry(0.14, 0.12, 0.26),
            shin: new THREE.CylinderGeometry(0.065, 0.055, 0.40, 10),
            kneePad: new THREE.BoxGeometry(0.12, 0.10, 0.06),
            thigh: new THREE.CylinderGeometry(0.08, 0.065, 0.42, 10),
            pelvis: new THREE.BoxGeometry(0.36, 0.16, 0.22),
            belt: new THREE.BoxGeometry(0.38, 0.08, 0.24),
            pouch: new THREE.BoxGeometry(0.08, 0.07, 0.05),
            abdomen: new THREE.BoxGeometry(0.32, 0.18, 0.20),
            chest: new THREE.BoxGeometry(0.42, 0.34, 0.24),
            plateCarrier: new THREE.BoxGeometry(0.34, 0.30, 0.07),
            bullseyeOuter: new THREE.CylinderGeometry(0.115, 0.115, 0.015, 24),
            bullseyeInner: new THREE.CylinderGeometry(0.08, 0.08, 0.016, 24),
            bullseyeCore: new THREE.CylinderGeometry(0.048, 0.048, 0.018, 20),
            strap: new THREE.BoxGeometry(0.08, 0.04, 0.26),
            shoulder: new THREE.BoxGeometry(0.12, 0.12, 0.14),
            upperArm: new THREE.CylinderGeometry(0.055, 0.05, 0.26, 10),
            elbowPad: new THREE.BoxGeometry(0.08, 0.08, 0.05),
            forearm: new THREE.CylinderGeometry(0.05, 0.045, 0.24, 10),
            glove: new THREE.BoxGeometry(0.08, 0.08, 0.10),
            neck: new THREE.CylinderGeometry(0.065, 0.075, 0.11, 10),
            headBase: new THREE.BoxGeometry(0.19, 0.21, 0.19),
            helmetDome: new THREE.SphereGeometry(0.142, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
            helmetBrim: new THREE.BoxGeometry(0.21, 0.04, 0.09),
            earCup: new THREE.CylinderGeometry(0.042, 0.042, 0.05, 10),
            visor: new THREE.BoxGeometry(0.165, 0.032, 0.04)
        };

        // Raycaster for shooting
        this.raycaster = new THREE.Raycaster();

        // Spawn initial targets & ammo pickups
        this.initAmmoPickups();
        this.resetTargets();
    }

    setMode(mode) {
        this.currentMode = mode;
        this.resetTargets();
    }

    resetTargets() {
        // Clear existing targets
        this.targets.forEach(t => {
            this.scene.remove(t.mesh);
        });
        this.targets = [];

        for (let i = 0; i < this.maxTargets; i++) {
            this.spawnTarget();
        }
    }

    // Ammo pickups in the range
    initAmmoPickups() {
        this.ammoPickups = [];
        const positions = [
            new THREE.Vector3(-4.5, 0.8, -6),
            new THREE.Vector3(4.5, 0.8, -6)
        ];

        positions.forEach((pos) => {
            const group = new THREE.Group();
            const crate = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.4, 0.4),
                this.targetMaterials.ammoCrate
            );
            crate.castShadow = true;
            group.add(crate);

            // Glowing halo ring
            const halo = new THREE.Mesh(
                new THREE.TorusGeometry(0.4, 0.02, 8, 24),
                this.targetMaterials.bullseyeCore
            );
            halo.rotation.x = Math.PI / 2;
            halo.position.y = 0.3;
            group.add(halo);

            group.position.copy(pos);
            this.scene.add(group);

            this.ammoPickups.push({
                mesh: group,
                respawnTime: 0,
                isPickup: true
            });
        });
    }

    // Create a detailed, human-proportioned tactical combat training mannequin / dummy
    createHumanoidTarget() {
        const root = new THREE.Group();
        const mats = this.targetMaterials;
        const geos = this.targetGeos;

        // Base / Mounting Platform on the range floor (Y = 0)
        const basePlate = new THREE.Mesh(geos.basePlate, mats.basePlate);
        basePlate.position.set(0, 0.02, 0);
        basePlate.receiveShadow = true;
        basePlate.userData.hitZone = 'limb';
        root.add(basePlate);

        // --- LOWER BODY & LEGS ---
        // Left & Right Combat Boots
        const bootL = new THREE.Mesh(geos.boot, mats.armorMain);
        bootL.position.set(-0.16, 0.06, 0.03);
        bootL.castShadow = true;
        bootL.userData.hitZone = 'limb';
        root.add(bootL);

        const bootR = new THREE.Mesh(geos.boot, mats.armorMain);
        bootR.position.set(0.16, 0.06, 0.03);
        bootR.castShadow = true;
        bootR.userData.hitZone = 'limb';
        root.add(bootR);

        // Lower legs (Shins)
        const shinL = new THREE.Mesh(geos.shin, mats.undersuit);
        shinL.position.set(-0.16, 0.32, 0);
        shinL.castShadow = true;
        shinL.userData.hitZone = 'limb';
        root.add(shinL);

        const shinR = new THREE.Mesh(geos.shin, mats.undersuit);
        shinR.position.set(0.16, 0.32, 0);
        shinR.castShadow = true;
        shinR.userData.hitZone = 'limb';
        root.add(shinR);

        // Tactical Knee Armor Pads
        const kneeL = new THREE.Mesh(geos.kneePad, mats.armorSlate);
        kneeL.position.set(-0.16, 0.52, 0.07);
        kneeL.castShadow = true;
        kneeL.userData.hitZone = 'limb';
        root.add(kneeL);

        const kneeR = new THREE.Mesh(geos.kneePad, mats.armorSlate);
        kneeR.position.set(0.16, 0.52, 0.07);
        kneeR.castShadow = true;
        kneeR.userData.hitZone = 'limb';
        root.add(kneeR);

        // Upper legs (Thighs)
        const thighL = new THREE.Mesh(geos.thigh, mats.armorMain);
        thighL.position.set(-0.15, 0.74, 0);
        thighL.castShadow = true;
        thighL.userData.hitZone = 'limb';
        root.add(thighL);

        const thighR = new THREE.Mesh(geos.thigh, mats.armorMain);
        thighR.position.set(0.15, 0.74, 0);
        thighR.castShadow = true;
        thighR.userData.hitZone = 'limb';
        root.add(thighR);

        // Pelvis & Tactical Combat Belt
        const pelvis = new THREE.Mesh(geos.pelvis, mats.undersuit);
        pelvis.position.set(0, 0.95, 0);
        pelvis.castShadow = true;
        pelvis.userData.hitZone = 'chest';
        root.add(pelvis);

        const belt = new THREE.Mesh(geos.belt, mats.armorSlate);
        belt.position.set(0, 1.05, 0);
        belt.castShadow = true;
        belt.userData.hitZone = 'chest';
        root.add(belt);

        // Belt Utility Pouches
        [-0.14, 0.14].forEach(xOff => {
            const pouch = new THREE.Mesh(geos.pouch, mats.armorMain);
            pouch.position.set(xOff, 1.05, 0.13);
            pouch.userData.hitZone = 'chest';
            root.add(pouch);
        });

        // --- TORSO & CHEST GROUP (Rotates / Breathes) ---
        const chestGroup = new THREE.Group();
        chestGroup.position.set(0, 1.38, 0);
        root.add(chestGroup);

        // Abdomen / Lower Spine
        const abdomen = new THREE.Mesh(geos.abdomen, mats.undersuit);
        abdomen.position.set(0, -0.22, 0);
        abdomen.castShadow = true;
        abdomen.userData.hitZone = 'chest';
        chestGroup.add(abdomen);

        // Main Chest Ribcage
        const chest = new THREE.Mesh(geos.chest, mats.armorMain);
        chest.position.set(0, 0.04, 0);
        chest.castShadow = true;
        chest.userData.hitZone = 'chest';
        chestGroup.add(chest);

        // Ballistic Plate Carrier Vest (Front & Back)
        const plateFront = new THREE.Mesh(geos.plateCarrier, mats.armorSlate);
        plateFront.position.set(0, 0.04, 0.125);
        plateFront.castShadow = true;
        plateFront.userData.hitZone = 'chest';
        chestGroup.add(plateFront);

        const plateBack = new THREE.Mesh(geos.plateCarrier, mats.armorSlate);
        plateBack.position.set(0, 0.04, -0.125);
        plateBack.castShadow = true;
        plateBack.userData.hitZone = 'chest';
        chestGroup.add(plateBack);

        // Shoulder straps connecting vest
        [-0.14, 0.14].forEach(xOff => {
            const strap = new THREE.Mesh(geos.strap, mats.undersuit);
            strap.position.set(xOff, 0.22, 0);
            strap.userData.hitZone = 'chest';
            chestGroup.add(strap);
        });

        // --- CENTER MASS TARGET BULLSEYE ON CHEST ---
        // Outer scoring ring
        const bullseyeRing = new THREE.Mesh(geos.bullseyeOuter, mats.bullseyeRing);
        bullseyeRing.rotation.x = Math.PI / 2;
        bullseyeRing.position.set(0, 0.04, 0.165);
        bullseyeRing.userData.hitZone = 'bullseye';
        chestGroup.add(bullseyeRing);

        // Dark contrast separator ring
        const bullseyeInner = new THREE.Mesh(geos.bullseyeInner, mats.undersuit);
        bullseyeInner.rotation.x = Math.PI / 2;
        bullseyeInner.position.set(0, 0.04, 0.168);
        bullseyeInner.userData.hitZone = 'bullseye';
        chestGroup.add(bullseyeInner);

        // Glowing heart bullseye core (Ten-Ring)
        const bullseyeCore = new THREE.Mesh(geos.bullseyeCore, mats.bullseyeCore);
        bullseyeCore.rotation.x = Math.PI / 2;
        bullseyeCore.position.set(0, 0.04, 0.172);
        bullseyeCore.userData.hitZone = 'bullseye';
        chestGroup.add(bullseyeCore);

        // --- ARMS IN TACTICAL READY GUARD STANCE ---
        [-1, 1].forEach(side => {
            const x = side * 0.28;
            // Shoulder pauldron
            const shoulder = new THREE.Mesh(geos.shoulder, mats.armorSlate);
            shoulder.position.set(x, 0.16, 0);
            shoulder.castShadow = true;
            shoulder.userData.hitZone = 'limb';
            chestGroup.add(shoulder);

            // Upper arm angled forward
            const arm = new THREE.Mesh(geos.upperArm, mats.undersuit);
            arm.position.set(side * 0.29, -0.04, 0.04);
            arm.rotation.x = 0.35;
            arm.rotation.z = -side * 0.12;
            arm.castShadow = true;
            arm.userData.hitZone = 'limb';
            chestGroup.add(arm);

            // Elbow armor pad
            const elbow = new THREE.Mesh(geos.elbowPad, mats.armorMain);
            elbow.position.set(side * 0.29, -0.18, 0.08);
            elbow.userData.hitZone = 'limb';
            chestGroup.add(elbow);

            // Forearm angled inward
            const forearm = new THREE.Mesh(geos.forearm, mats.armorMain);
            forearm.position.set(side * 0.22, -0.22, 0.18);
            forearm.rotation.x = 0.7;
            forearm.rotation.y = side * 0.4;
            forearm.castShadow = true;
            forearm.userData.hitZone = 'limb';
            chestGroup.add(forearm);

            // Tactical Combat Glove
            const glove = new THREE.Mesh(geos.glove, mats.undersuit);
            glove.position.set(side * 0.15, -0.24, 0.26);
            glove.castShadow = true;
            glove.userData.hitZone = 'limb';
            chestGroup.add(glove);
        });

        // --- NECK & HEAD GROUP (Critical Headshot Zone) ---
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.74, 0);
        root.add(headGroup);

        // Cybernetic / Anatomical Neck
        const neck = new THREE.Mesh(geos.neck, mats.metalJoint);
        neck.position.set(0, -0.12, 0);
        neck.castShadow = true;
        neck.userData.hitZone = 'head';
        headGroup.add(neck);

        // Head Base / Faceplate
        const headBase = new THREE.Mesh(geos.headBase, mats.armorMain);
        headBase.position.set(0, 0.02, 0);
        headBase.castShadow = true;
        headBase.userData.hitZone = 'head';
        headGroup.add(headBase);

        // Tactical Combat Ballistic Helmet Shell
        const helmetDome = new THREE.Mesh(geos.helmetDome, mats.armorSlate);
        helmetDome.position.set(0, 0.08, 0);
        helmetDome.castShadow = true;
        helmetDome.userData.hitZone = 'head';
        headGroup.add(helmetDome);

        // Helmet Brow / Sun-Brim
        const helmetBrim = new THREE.Mesh(geos.helmetBrim, mats.armorMain);
        helmetBrim.position.set(0, 0.07, 0.095);
        helmetBrim.castShadow = true;
        helmetBrim.userData.hitZone = 'head';
        headGroup.add(helmetBrim);

        // Tactical Communications Headset Ear Cups
        [-0.115, 0.115].forEach(xOff => {
            const earCup = new THREE.Mesh(geos.earCup, mats.metalJoint);
            earCup.position.set(xOff, 0.02, 0);
            earCup.rotation.z = Math.PI / 2;
            earCup.userData.hitZone = 'head';
            headGroup.add(earCup);
        });

        // Glowing Tactical Visor / Sensor Slit (Adds unmistakable human silhouette!)
        const visor = new THREE.Mesh(geos.visor, mats.visor);
        visor.position.set(0, 0.025, 0.105);
        visor.userData.hitZone = 'head';
        headGroup.add(visor);

        return {
            group: root,
            headGroup: headGroup,
            chestGroup: chestGroup,
            bullseyeCore: bullseyeCore,
            visor: visor
        };
    }

    spawnTarget() {
        const dummy = this.createHumanoidTarget();
        const group = dummy.group;

        // Position standing on range floor (Y = 0)
        // X: -5.2 to +5.2 (within arena bounds)
        // Z: -10 to -28 (close, medium, and long sniper lanes)
        const x = (Math.random() - 0.5) * 10.4;
        const y = 0; // Grounded standing height
        const z = -10 - Math.random() * 18;

        group.position.set(x, y, z);

        // Look toward player camera on horizontal plane (keeping upright stance)
        group.lookAt(this.camera.position.x, 0, this.camera.position.z);

        this.scene.add(group);

        const isReflex = this.currentMode === 'reflex';
        const targetData = {
            mesh: group,
            headGroup: dummy.headGroup,
            chestGroup: dummy.chestGroup,
            basePos: group.position.clone(),
            moveSpeed: 0.9 + Math.random() * 1.5,
            moveRange: 2.0 + Math.random() * 2.5,
            movePhase: Math.random() * Math.PI * 2,
            spawnTime: performance.now(),
            lifetime: 2800, // Reaction window for reflex mode
            flinch: 0,
            scale: 0.01,
            popProgress: isReflex ? 0.0 : 1.0,
            isPoppingUp: isReflex
        };

        if (isReflex) {
            group.position.y = -1.85; // Start hidden below floor level
        }

        this.targets.push(targetData);
    }

    processShot(spreadX, spreadY, damage, playerPos) {
        this.shots++;

        // Set raycaster from screen center with weapon spread applied
        const screenCenter = new THREE.Vector2(spreadX * 2, spreadY * 2);
        this.raycaster.setFromCamera(screenCenter, this.camera);

        // Gather all target meshes for hit detection
        const checkObjects = [];
        this.targets.forEach(t => checkObjects.push(t.mesh));
        this.ammoPickups.forEach(p => {
            if (p.mesh.visible) checkObjects.push(p.mesh);
        });

        const intersects = this.raycaster.intersectObjects(checkObjects, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            let topGroup = hit.object;
            while (topGroup.parent && topGroup.parent !== this.scene) {
                topGroup = topGroup.parent;
            }

            // Check if ammo pickup
            const pickup = this.ammoPickups.find(p => p.mesh === topGroup);
            if (pickup && pickup.mesh.visible) {
                this.hitAmmoPickup(pickup, hit.point);
                return;
            }

            // Find matching target
            const targetIndex = this.targets.findIndex(t => t.mesh === topGroup);
            if (targetIndex !== -1) {
                const target = this.targets[targetIndex];

                // Determine anatomical hit zone
                let hitZone = hit.object.userData.hitZone || 'chest';

                // Height check relative to target base as bullet-proof secondary verification:
                // Head is ~1.58m to 1.95m
                const relY = hit.point.y - target.mesh.position.y;
                if (relY >= 1.56) {
                    hitZone = 'head';
                } else if (hitZone !== 'bullseye' && relY >= 1.10) {
                    hitZone = 'chest';
                }

                this.hitTarget(target, targetIndex, hit.point, damage, hitZone);
                return;
            }
        }

        // Missed shot
        this.streak = 0;
        this.updateHUDStats();
    }

    hitAmmoPickup(pickup, hitPoint) {
        pickup.mesh.visible = false;
        pickup.respawnTime = performance.now() + 6000;

        window.soundManager.playHit(true);
        this.createExplosion(hitPoint, 0xffaa00, 15);
        this.createFloatingText("+AMMO REFILL", hitPoint, '#ffaa00');

        if (window.gameApp && window.gameApp.weaponManager) {
            window.gameApp.weaponManager.addAmmo(60);
        }
    }

    hitTarget(target, index, hitPoint, damage, hitZone) {
        this.hits++;
        this.streak++;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;

        let earnedScore = 0;
        let isHeadshot = (hitZone === 'head');
        let isBullseye = (hitZone === 'bullseye' || isHeadshot);

        if (isHeadshot) {
            this.headshots++;
            const basePoints = 280;
            const streakBonus = Math.min(this.streak * 15, 120);
            earnedScore = basePoints + streakBonus;

            // Audio: crisp metallic helmet ding
            window.soundManager.playHeadshot();

            // Hitmarker UI: critical gold/red
            this.triggerHitmarker(true, 'headshot');

            // Floating text
            this.createFloatingText(`HEADSHOT! +${earnedScore}`, hitPoint, '#ffd700', true);

            // Explosive golden spark burst
            this.createExplosion(hitPoint, 0xffd700, 36, 0xff0055);

        } else if (hitZone === 'bullseye') {
            const basePoints = 180;
            const streakBonus = Math.min(this.streak * 10, 80);
            earnedScore = basePoints + streakBonus;

            window.soundManager.playHit(true);
            this.triggerHitmarker(true, 'bullseye');
            this.createFloatingText(`BULLSEYE! +${earnedScore}`, hitPoint, '#ff0055');
            this.createExplosion(hitPoint, 0xff0055, 30);

        } else if (hitZone === 'chest') {
            const basePoints = 130;
            const streakBonus = Math.min(this.streak * 8, 60);
            earnedScore = basePoints + streakBonus;

            window.soundManager.playHit(false);
            this.triggerHitmarker(true, 'chest');
            this.createFloatingText(`CHEST HIT +${earnedScore}`, hitPoint, '#00f3ff');
            this.createExplosion(hitPoint, 0x00f3ff, 25);

        } else {
            // Limb hit (arms, legs, boots)
            const basePoints = 80;
            const streakBonus = Math.min(this.streak * 5, 40);
            earnedScore = basePoints + streakBonus;

            window.soundManager.playHit(false);
            this.triggerHitmarker(false);
            this.createFloatingText(`+${earnedScore}`, hitPoint, '#a2c4e2');
            this.createExplosion(hitPoint, 0x6888aa, 18);
        }

        this.score += earnedScore;

        // Remove old target and spawn a new humanoid dummy
        this.scene.remove(target.mesh);
        this.targets.splice(index, 1);
        this.spawnTarget();

        this.updateHUDStats();
    }

    triggerHitmarker(isCrit, type = 'normal') {
        const hm = document.getElementById('hitmarker');
        if (!hm) return;
        hm.classList.remove('active', 'bullseye', 'headshot');
        void hm.offsetWidth; // Force reflow
        hm.classList.add('active');

        if (type === 'headshot') {
            hm.classList.add('headshot');
        } else if (isCrit) {
            hm.classList.add('bullseye');
        }

        setTimeout(() => {
            hm.classList.remove('active', 'bullseye', 'headshot');
        }, 130);
    }

    createExplosion(pos, colorHex, count = 28, secondaryColorHex = null) {
        const pGeo = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const colors = [];
        const baseColor = new THREE.Color(colorHex);
        const secondColor = secondaryColorHex ? new THREE.Color(secondaryColorHex) : baseColor;

        for (let i = 0; i < count; i++) {
            positions.push(pos.x, pos.y, pos.z);
            const speed = 2.8 + Math.random() * 5.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            velocities.push(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta) + 1.2,
                speed * Math.cos(phi)
            );

            const c = (Math.random() > 0.4) ? baseColor : secondColor;
            colors.push(c.r, c.g, c.b);
        }

        pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        pGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const pMat = new THREE.PointsMaterial({
            size: 0.16,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const pointCloud = new THREE.Points(pGeo, pMat);
        this.scene.add(pointCloud);

        this.particles.push({
            mesh: pointCloud,
            positions: positions,
            velocities: velocities,
            createdAt: performance.now(),
            life: 0.45 // seconds
        });
    }

    createFloatingText(text, worldPos, color, isHeadshot = false) {
        const el = document.createElement('div');
        el.className = 'floating-score-text' + (isHeadshot ? ' headshot' : '');
        el.innerText = text;
        el.style.color = color;
        document.getElementById('floating-ui-container').appendChild(el);

        this.floatingTexts.push({
            el: el,
            pos: worldPos.clone(),
            createdAt: performance.now(),
            life: isHeadshot ? 950 : 800 // ms
        });
    }

    update(delta, now) {
        // Update Humanoid Targets
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];

            // Spawn scale-in
            if (t.scale < 1.0) {
                t.scale = Math.min(1.0, t.scale + delta * 7);
                t.mesh.scale.setScalar(t.scale);
            }

            // Keep dummy facing player horizontally (standing firmly on floor)
            t.mesh.lookAt(this.camera.position.x, t.mesh.position.y, this.camera.position.z);

            // Natural Idle Breathing Micro-Motion
            const breathe = Math.sin(now * 0.0032 + t.movePhase) * 0.012;
            if (t.chestGroup) {
                t.chestGroup.position.y = 1.38 + breathe;
            }
            if (t.headGroup) {
                t.headGroup.position.y = 1.74 + breathe * 0.7;
            }

            // Hit flinch recovery
            if (t.flinch > 0) {
                t.flinch = Math.max(0, t.flinch - delta * 4);
                if (t.chestGroup) t.chestGroup.rotation.x = -t.flinch * 0.16;
                if (t.headGroup) t.headGroup.rotation.x = -t.flinch * 0.32;
            }

            // Mode behaviors
            if (this.currentMode === 'tracking') {
                // Tactical ground strafe (walking/running pacing on floor)
                const timeFactor = (now * 0.001) * t.moveSpeed + t.movePhase;
                t.mesh.position.x = t.basePos.x + Math.sin(timeFactor) * t.moveRange;
                // Subtle walking stride bobbing
                t.mesh.position.y = Math.abs(Math.sin(timeFactor * 3.0)) * 0.03;

            } else if (this.currentMode === 'reflex') {
                // Pop-up target animation
                if (t.isPoppingUp) {
                    t.popProgress = Math.min(1.0, t.popProgress + delta * 7.5);
                    t.mesh.position.y = THREE.MathUtils.lerp(-1.85, 0, t.popProgress);
                    if (t.popProgress >= 1.0) {
                        t.isPoppingUp = false;
                    }
                }

                // Reaction timer
                const age = now - t.spawnTime;
                if (age > t.lifetime) {
                    // Target timed out
                    this.scene.remove(t.mesh);
                    this.targets.splice(i, 1);
                    this.streak = 0;
                    this.spawnTarget();
                    this.updateHUDStats();
                    continue;
                }
            }
        }

        // Update Ammo Pickups respawn
        this.ammoPickups.forEach(p => {
            if (!p.mesh.visible && now > p.respawnTime) {
                p.mesh.visible = true;
                p.mesh.scale.set(0.01, 0.01, 0.01);
            }
            if (p.mesh.visible) {
                p.mesh.rotation.y += delta * 1.5;
                if (p.mesh.scale.x < 1.0) {
                    p.mesh.scale.addScalar(delta * 4);
                    if (p.mesh.scale.x > 1) p.mesh.scale.set(1, 1, 1);
                }
            }
        });

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const age = (now - p.createdAt) * 0.001;
            if (age >= p.life) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            const posAttr = p.mesh.geometry.attributes.position;
            const positions = posAttr.array;
            for (let j = 0; j < p.velocities.length / 3; j++) {
                const idx = j * 3;
                positions[idx] += p.velocities[idx] * delta;
                positions[idx + 1] += p.velocities[idx + 1] * delta - 4.8 * delta * delta; // Gravity
                positions[idx + 2] += p.velocities[idx + 2] * delta;
            }
            posAttr.needsUpdate = true;
            p.mesh.material.opacity = 1.0 - (age / p.life);
        }

        // Update Floating 2D/3D Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            const age = now - ft.createdAt;
            if (age >= ft.life) {
                ft.el.remove();
                this.floatingTexts.splice(i, 1);
                continue;
            }

            // Project 3D pos to 2D screen coordinates
            const screenPos = ft.pos.clone().project(this.camera);
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

            // Float upwards
            const floatOffset = (age / ft.life) * 45;
            ft.el.style.left = `${x}px`;
            ft.el.style.top = `${y - floatOffset}px`;
            ft.el.style.opacity = `${1 - (age / ft.life)}`;
        }
    }

    updateHUDStats() {
        const accuracy = this.shots > 0 ? ((this.hits / this.shots) * 100).toFixed(1) : '100.0';
        const scoreEl = document.getElementById('hud-score');
        const accEl = document.getElementById('hud-accuracy');
        const streakEl = document.getElementById('hud-streak');
        const hitsEl = document.getElementById('hud-hits');

        if (scoreEl) scoreEl.innerText = this.score;
        if (accEl) accEl.innerText = `${accuracy}%`;
        if (streakEl) streakEl.innerText = `x${this.streak}`;
        if (hitsEl) hitsEl.innerText = `${this.hits} / ${this.shots}`;
    }
}

window.TargetManager = TargetManager;
