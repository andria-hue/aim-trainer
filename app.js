// Main FPS Aim Training Application
class AimTrainerApp {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.isPointerLocked = false;
        this.isMouseDown = false;
        this.mouseSensitivity = 0.0022;
        this.scopedSensMultiplier = 0.35; // Lower sensitivity multiplier when scoped/ADS

        // Player physics & movement
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveState = { forward: false, backward: false, left: false, right: false };
        this.playerBounds = { minX: -5.5, maxX: 5.5, minZ: -3.5, maxZ: 2.0 };

        // Mouse look angles (Euler)
        this.pitch = 0;
        this.yaw = 0;
        this.mouseDelta = { x: 0, y: 0 };

        // Tracers & impacts
        this.tracers = [];

        this.initThree();
        this.initEnvironment();
        this.initManagers();
        this.initInput();
        this.initUI();

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c12);
        this.scene.fog = new THREE.FogExp2(0x0a0c12, 0.022);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
        this.camera.position.set(0, 1.7, 0); // Eye height 1.7m
        this.scene.add(this.camera);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);

        // Ambient & Directional Lights
        const ambientLight = new THREE.AmbientLight(0x283248, 0.9);
        this.scene.add(ambientLight);

        const mainDirLight = new THREE.DirectionalLight(0xddeeff, 1.4);
        mainDirLight.position.set(10, 20, 10);
        mainDirLight.castShadow = true;
        mainDirLight.shadow.mapSize.width = 2048;
        mainDirLight.shadow.mapSize.height = 2048;
        this.scene.add(mainDirLight);

        // Neon ceiling strips
        const neonLightLeft = new THREE.PointLight(0x00f3ff, 2.5, 30);
        neonLightLeft.position.set(-6, 6, -10);
        this.scene.add(neonLightLeft);

        const neonLightRight = new THREE.PointLight(0xff0055, 2.5, 30);
        neonLightRight.position.set(6, 6, -10);
        this.scene.add(neonLightRight);

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initEnvironment() {
        // High-tech Shooting Arena Floor
        const floorGeo = new THREE.PlaneGeometry(30, 60);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x0f121a,
            roughness: 0.25,
            metalness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -15);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Glowing Arena Floor Grid
        const grid = new THREE.GridHelper(60, 60, 0x00f3ff, 0x1f2b3e);
        grid.position.set(0, 0.01, -15);
        this.scene.add(grid);

        // Shooting Booth Raised Platform
        const boothGeo = new THREE.BoxGeometry(14, 0.2, 8);
        const boothMat = new THREE.MeshStandardMaterial({
            color: 0x161a24,
            roughness: 0.5,
            metalness: 0.6
        });
        const booth = new THREE.Mesh(boothGeo, boothMat);
        booth.position.set(0, 0.1, -0.5);
        booth.receiveShadow = true;
        this.scene.add(booth);

        // Safety Railings / Stall partitions
        const railMat = new THREE.MeshStandardMaterial({
            color: 0x222838,
            roughness: 0.3,
            metalness: 0.9
        });
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 7.5), railMat);
        leftWall.position.set(-6, 0.7, -0.5);
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 7.5), railMat);
        rightWall.position.set(6, 0.7, -0.5);
        this.scene.add(rightWall);

        // Front shooting counter / rest
        const frontDesk = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.9, 0.4), railMat);
        frontDesk.position.set(0, 0.45, -4.2);
        this.scene.add(frontDesk);

        // Cyber neon edge strip along shooting booth
        const edgeStripMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const edgeStrip = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.04, 0.04), edgeStripMat);
        edgeStrip.position.set(0, 0.92, -4.0);
        this.scene.add(edgeStrip);

        // Distant back wall with target backdrop
        const backWallGeo = new THREE.PlaneGeometry(35, 16);
        const backWallMat = new THREE.MeshStandardMaterial({
            color: 0x0c0e14,
            roughness: 0.6,
            metalness: 0.4
        });
        const backWall = new THREE.Mesh(backWallGeo, backWallMat);
        backWall.position.set(0, 7.5, -35);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Distance range marker lines on the range floor (10m, 15m, 20m, 25m, 30m)
        [-10, -15, -20, -25, -30].forEach(zPos => {
            const lineGeo = new THREE.BoxGeometry(16, 0.02, 0.1);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0x243b55 });
            const lineMesh = new THREE.Mesh(lineGeo, lineMat);
            lineMesh.position.set(0, 0.02, zPos);
            this.scene.add(lineMesh);
        });
    }

    initManagers() {
        this.weaponManager = new window.WeaponManager(this.scene, this.camera);
        this.targetManager = new window.TargetManager(this.scene, this.camera);
        window.gameApp = this;
    }

    initInput() {
        // Pointer Lock events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = (document.pointerLockElement === document.body);
            const overlay = document.getElementById('pause-modal');
            if (this.isPointerLocked) {
                if (overlay) overlay.classList.remove('active');
                window.soundManager.ensureContext();
            } else {
                if (overlay) overlay.classList.add('active');
                this.isMouseDown = false;
                this.weaponManager.setADS(false);
            }
        });

        // Mouse Look
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked) return;

            const movementX = e.movementX || 0;
            const movementY = e.movementY || 0;

            this.mouseDelta.x = movementX;
            this.mouseDelta.y = movementY;

            // Sensitivity scale (significantly lower when scoped/ADS for precision!)
            let sens = this.mouseSensitivity;
            if (this.weaponManager.isADS) {
                const currentW = this.weaponManager.currentWeapon;
                // Ratio of zoomed FOV to hipfire FOV (e.g. 16/75 = 0.213 for sniper, 50/75 = 0.667 for rifle)
                const fovRatio = (currentW && currentW.adsFov ? currentW.adsFov : 50) / 
                                 (currentW && currentW.hipFov ? currentW.hipFov : 75);

                if (this.weaponManager.currentWeaponKey === 'sniper') {
                    // Ultra-smooth sniper optic precision dampening
                    sens *= fovRatio * this.scopedSensMultiplier * 0.85;
                } else {
                    // Assault rifle and tactical pistol ADS precision
                    sens *= fovRatio * this.scopedSensMultiplier;
                }
            }

            this.yaw -= movementX * sens;
            this.pitch -= movementY * sens;

            // Clamp pitch to avoid gimbal flip (-85 to +85 deg)
            const maxPitch = Math.PI / 2 - 0.05;
            this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.set(this.pitch, this.yaw, 0);
        });

        // Mouse Down (Fire & ADS)
        window.addEventListener('mousedown', (e) => {
            if (!this.isPointerLocked) return;

            if (e.button === 0) {
                // Left Click: Shoot
                this.isMouseDown = true;
                this.triggerFire();
            } else if (e.button === 2) {
                // Right Click: ADS
                e.preventDefault();
                this.weaponManager.setADS(true);
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (!this.isPointerLocked) return;

            if (e.button === 0) {
                this.isMouseDown = false;
            } else if (e.button === 2) {
                e.preventDefault();
                this.weaponManager.setADS(false);
            }
        });

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard inputs
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.moveState.forward = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.moveState.backward = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.moveState.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.moveState.right = true;

            // Weapon slots
            if (e.code === 'Digit1') this.weaponManager.switchWeapon('rifle');
            if (e.code === 'Digit2') this.weaponManager.switchWeapon('pistol');
            if (e.code === 'Digit3') this.weaponManager.switchWeapon('sniper');

            // Reload
            if (e.code === 'KeyR') this.weaponManager.startReload();

            // ESC handled automatically by PointerLock
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.moveState.forward = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.moveState.backward = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.moveState.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.moveState.right = false;
        });

        // Mouse Wheel weapon cycle
        window.addEventListener('wheel', (e) => {
            if (!this.isPointerLocked) return;
            const weaponOrder = ['rifle', 'pistol', 'sniper'];
            let idx = weaponOrder.indexOf(this.weaponManager.currentWeaponKey);
            if (e.deltaY > 0) {
                idx = (idx + 1) % weaponOrder.length;
            } else {
                idx = (idx - 1 + weaponOrder.length) % weaponOrder.length;
            }
            this.weaponManager.switchWeapon(weaponOrder[idx]);
        });
    }

    triggerFire() {
        const now = performance.now();
        this.weaponManager.shoot(now, (spreadX, spreadY, damage) => {
            // Process hit on target
            this.targetManager.processShot(spreadX, spreadY, damage, this.camera.position);

            // Spawn tracer visual effect
            this.createTracer(spreadX, spreadY);
        });
    }

    createTracer(spreadX, spreadY) {
        // Barrel position
        const barrelPos = new THREE.Vector3(0.2, -0.15, -0.6);
        barrelPos.applyMatrix4(this.camera.matrixWorld);

        // Ray endpoint
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(spreadX * 2, spreadY * 2), this.camera);
        const targetPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(40));

        const curve = new THREE.LineCurve3(barrelPos, targetPoint);
        const geo = new THREE.TubeGeometry(curve, 2, 0.015, 4, false);
        const mat = new THREE.MeshBasicMaterial({
            color: this.weaponManager.currentWeaponKey === 'sniper' ? 0xffaa33 : 0x00f3ff,
            transparent: true,
            opacity: 0.85
        });

        const tracerMesh = new THREE.Mesh(geo, mat);
        this.scene.add(tracerMesh);

        this.tracers.push({
            mesh: tracerMesh,
            createdAt: performance.now(),
            life: 80 // ms
        });
    }

    initUI() {
        // Start / Resume button
        const startBtn = document.getElementById('btn-play');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                document.body.requestPointerLock();
            });
        }

        // Sensitivity slider
        const sensSlider = document.getElementById('setting-sens');
        const sensVal = document.getElementById('sens-value');
        if (sensSlider) {
            sensSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.mouseSensitivity = val * 0.001;
                if (sensVal) sensVal.innerText = val.toFixed(1);
            });
        }

        // Scoped / ADS Sensitivity slider
        const scopedSensSlider = document.getElementById('setting-scoped-sens');
        const scopedSensVal = document.getElementById('scoped-sens-value');
        if (scopedSensSlider) {
            scopedSensSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.scopedSensMultiplier = val;
                if (scopedSensVal) scopedSensVal.innerText = `${val.toFixed(2)}x`;
            });
        }

        // Volume slider
        const volSlider = document.getElementById('setting-volume');
        const volVal = document.getElementById('volume-value');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                window.soundManager.setVolume(val / 100);
                if (volVal) volVal.innerText = `${val}%`;
            });
        }

        // Game mode selector buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.mode;
                this.targetManager.setMode(mode);
            });
        });

        // Weapon quick switch bar clicks
        const slotButtons = document.querySelectorAll('.slot-btn');
        slotButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.weaponManager.switchWeapon(btn.dataset.weapon);
            });
        });

        // Reset score button
        const resetBtn = document.getElementById('btn-reset-stats');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.targetManager.score = 0;
                this.targetManager.hits = 0;
                this.targetManager.shots = 0;
                this.targetManager.streak = 0;
                this.targetManager.updateHUDStats();
            });
        }
    }

    updatePlayerMovement(delta) {
        const speed = 7.0; // m/s
        const inputZ = Number(this.moveState.backward) - Number(this.moveState.forward);
        const inputX = Number(this.moveState.right) - Number(this.moveState.left);

        const moveVector = new THREE.Vector3(inputX, 0, inputZ);
        if (moveVector.lengthSq() > 0) {
            moveVector.normalize().multiplyScalar(speed * delta);
            // Rotate movement relative to player yaw
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        }

        this.velocity.lerp(moveVector, delta * 12);
        this.camera.position.add(this.velocity);

        // Keep player inside shooting booth boundary
        this.camera.position.x = Math.max(this.playerBounds.minX, Math.min(this.playerBounds.maxX, this.camera.position.x));
        this.camera.position.z = Math.max(this.playerBounds.minZ, Math.min(this.playerBounds.maxZ, this.camera.position.z));
        this.camera.position.y = 1.7; // Maintain standing eye height
    }

    animate() {
        requestAnimationFrame(this.animate);

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const now = performance.now();

        // Handle full-auto continuous firing
        if (this.isPointerLocked && this.isMouseDown && this.weaponManager.currentWeapon.automatic) {
            this.triggerFire();
        }

        // Update player movement
        this.updatePlayerMovement(delta);

        // Update weapon viewmodel & ADS
        this.weaponManager.update(delta, this.velocity, this.mouseDelta);

        // Reset mouse delta per frame
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;

        // Update targets & particles
        this.targetManager.update(delta, now);

        // Update tracers
        for (let i = this.tracers.length - 1; i >= 0; i--) {
            const tr = this.tracers[i];
            if (now - tr.createdAt > tr.life) {
                this.scene.remove(tr.mesh);
                tr.mesh.geometry.dispose();
                tr.mesh.material.dispose();
                this.tracers.splice(i, 1);
            }
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Start application when DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    new AimTrainerApp();
});
