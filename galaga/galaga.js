class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 30,
            height: 20,
            speed: 3  // Reduced from 4 to 3
        };
        
        this.bullets = [];
        this.enemies = [];
        this.formations = [];
        this.score = 0;
        this.keys = {};
        this.attackWave = [];
        this.attackTimer = 0;
        
        // Add sprite animation frames counter
        this.frameCount = 0;
        
        // Add enemy types
        this.enemyTypes = {
            BOSS: 0,
            ESCORT: 1,
            GRUNT: 2
        };
        
        // Add stars for background
        this.stars = Array.from({length: 50}, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            speed: 0.5 + Math.random() * 1,
            size: 1 + Math.random() * 2
        }));
        
        // Add lives and game state
        this.lives = 3;
        this.gameState = 'title';  // Change initial state to 'title'
        this.gameMode = null; // Selected game mode
        
        // Delta time for frame-rate independent movement
        this.lastFrameTime = performance.now();
        this.targetFPS = 60;
        this.deltaTime = 1.0; // Normalized delta time (1.0 = 60fps)
        
        // Game mode configurations
        this.gameModes = {
            classic: {
                name: 'CLASSIC',
                lives: 3,
                enemySpeedMultiplier: 1.0,
                enemyAttackFrequency: 1.0,
                enemyShootFrequency: 1.0,
                waveDifficulty: 1.0,
                endless: false,
                description: 'Classic space shooter experience'
            },
            arcade: {
                name: 'ARCADE',
                lives: 3,
                enemySpeedMultiplier: 1.3,
                enemyAttackFrequency: 1.5,
                enemyShootFrequency: 1.4,
                waveDifficulty: 1.2,
                endless: false,
                description: 'Fast-paced action'
            },
            survival: {
                name: 'SURVIVAL',
                lives: 3,
                enemySpeedMultiplier: 1.1,
                enemyAttackFrequency: 1.2,
                enemyShootFrequency: 1.1,
                waveDifficulty: 1.15,
                endless: true,
                description: 'Endless waves challenge'
            },
            challenge: {
                name: 'CHALLENGE',
                lives: 1,
                enemySpeedMultiplier: 1.5,
                enemyAttackFrequency: 2.0,
                enemyShootFrequency: 1.8,
                waveDifficulty: 1.5,
                endless: false,
                description: 'Hardcore difficulty'
            }
        };
        
        // Add power-ups
        this.powerUps = [];
        this.powerUpTypes = {
            DOUBLE_SHOT: 0,
            SPEED_UP: 1,
            SHIELD: 2,
            EXTRA_LIFE: 3,
            PERMANENT_SPEED: 4,
            PERMANENT_SHOT: 5,
            BULLET_SPEED: 6,      // New: Faster bullets
            SMALL_SHIP: 7,        // New: Smaller hitbox
            DRONE: 8,             // New: Helper drone
            PERMANENT_BULLET: 9,  // New: Permanent bullet speed
            PERMANENT_SIZE: 10,   // New: Permanent small size
            PERMANENT_DRONE: 11   // New: Permanent drone
        };
        this.playerPowerUps = {
            doubleShot: false,
            speedUp: false,
            shield: false,
            bulletSpeed: false,
            smallShip: false,
            drone: false,
            // Track stacks for permanent upgrades
            permanentSpeedStacks: 0,
            permanentShotStacks: 0,
            permanentBulletStacks: 0,
            permanentSizeStacks: 0,
            permanentDroneStacks: 0
        };
        
        // Initialize sounds with fallbacks for missing files
        this.sounds = {
            shoot: this.createAudio('galaga/sounds/shoot.wav'),
            explosion: this.createAudio('galaga/sounds/explosion.wav'),
            powerUp: this.createAudio('galaga/sounds/powerup.wav'),
            playerHit: this.createAudio('galaga/sounds/playerhit.wav'),
            gameOver: this.createAudio('galaga/sounds/gameover.wav'),
            waveComplete: this.createAudio('galaga/sounds/explosion.wav'), // Fallback to explosion
            bonus: this.createAudio('galaga/sounds/powerup.wav'), // Fallback to powerup
            levelUp: this.createAudio('galaga/sounds/powerup.wav'), // Fallback to powerup
            powerupHit: this.createAudio('galaga/sounds/powerup.wav'), // Fallback
            powerupCollect: this.createAudio('galaga/sounds/powerup.wav'), // Fallback
            powerupExpire: this.createAudio('galaga/sounds/powerup.wav'), // Fallback
            clash: this.createAudio('galaga/sounds/explosion.wav') // Fallback to explosion
        };
        
        // Track mute state
        this.isMuted = true;
        
        // Mute all sounds initially (unmute on first click)
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
            sound.volume = 0.3;
            sound.muted = true;
            }
        });
        
        // Add death animation states
        this.deathAnimations = [];
        
        // Add tractor beam state
        this.tractorBeam = null;
        
        // Add sprite rotation tracking
        this.rotationAngles = new Map();
        
        // Add capture state for player
        this.playerCaptured = false;
        
        // Add debug mode
        this.debugMode = false;
        
        // Adjust attack timing for more deliberate attacks
        this.attackCooldown = 150; // Increased from 90 to 150 for more deliberate timing
        this.maxSimultaneousAttackers = 2; // Limit number of attacking enemies
        
        // Add difficulty settings
        this.difficulties = {
            easy: {
                enemySpeed: 1,
                attackCooldown: 200,
                maxAttackers: 1,
                enemyAccuracy: 0.5,
                scoreMultiplier: 0.8
            },
            normal: {
                enemySpeed: 1.5,
                attackCooldown: 180,
                maxAttackers: 2,
                enemyAccuracy: 0.8,
                scoreMultiplier: 1
            },
            hard: {
                enemySpeed: 2,
                attackCooldown: 150,
                maxAttackers: 3,
                enemyAccuracy: 1,
                scoreMultiplier: 1.5
            }
        };
        
        // Add attack pattern indicators
        this.attackIndicators = [];
        
        // Add wave system
        this.wave = 1;
        this.waveConfig = {
            getConfig: function(wave) {
                // Base configuration for wave 1
                const baseConfig = {
                    totalEnemies: 15,
                    bossCount: 1,
                    escortCount: 4,  // Increased from 2 to 4
                    speedMultiplier: 1
                };
                
                // For waves beyond 1, scale up the difficulty
                if (wave > 1) {
                    return {
                        totalEnemies: baseConfig.totalEnemies + ((wave - 1) * 3),
                        bossCount: Math.min(5, Math.floor(1 + (wave / 3))),
                        escortCount: Math.min(8, Math.floor(4 + (wave / 2))), // More escorts per wave
                        speedMultiplier: 1 + ((wave - 1) * 0.2)
                    };
                }
                
                return baseConfig;
            }
        };
        
        // Add wave transition effect
        this.waveTransition = {
            active: false,
            timer: 0,
            duration: 180,  // 3 seconds
            text: ''
        };
        
        // Add wave completion effects
        this.waveCompletion = {
            active: false,
            timer: 0,
            duration: 120,
            particles: [],
            bonus: 0
        };
        
        // Add wave statistics tracking
        this.waveStats = {
            enemiesDefeated: 0,
            accuracyHits: 0,
            shotsFired: 0,
            timeElapsed: 0,
            startTime: 0
        };
        
        // Add high score tracking
        this.highScores = {
            easy: this.loadHighScore('easy'),
            normal: this.loadHighScore('normal'),
            hard: this.loadHighScore('hard')
        };
        
        // Add power-up effects
        this.powerUpEffects = [];
        
        // Add enemy bullets array
        this.enemyBullets = [];
        
        // Add enemy shooting properties
        this.enemyShootingConfig = {
            BOSS: { 
                chance: 0.008, // Reduced from 0.015 for more deliberate shooting
                bulletSpeed: 2.5, // Reduced from 3
                color: '#f00',
                trackingChance: 0.4  // Increased tracking for more tactical shots
            },
            ESCORT: { 
                chance: 0.005, // Reduced from 0.01
                bulletSpeed: 2, // Reduced from 2.5
                color: '#f80',
                trackingChance: 0.3  // Increased tracking
            },
            GRUNT: { 
                chance: 0.003, // Reduced from 0.005
                bulletSpeed: 1.8, // Reduced from 2
                color: '#ff0',
                trackingChance: 0.2  // Increased tracking
            }
        };
        
        // Add bullet effects configuration
        this.bulletEffects = {
            player: {
                trail: true,
                color: '#0ff',
                tailLength: 10,
                width: 2,
                height: 8,
                glow: true
            },
            enemy: {
                BOSS: { color: '#f00', glow: true, size: 10 },
                ESCORT: { color: '#f80', glow: true, size: 8 },
                GRUNT: { color: '#ff0', glow: true, size: 6 }
            }
        };
        
        // Add boss wave announcement
        this.bossAnnouncement = {
            active: false,
            timer: 0,
            duration: 180,
            scale: 0,
            alpha: 0
        };
        
        // Add more music tracks
        this.music = {
            normal: new Audio('galaga/sounds/normal-theme.wav'),
            boss: new Audio('galaga/sounds/boss-theme.wav'),
            menu: new Audio('galaga/sounds/menu-theme.wav'),
            gameover: new Audio('galaga/sounds/gameover-theme.wav')
        };

        // Configure music
        Object.values(this.music).forEach(track => {
            track.volume = 0;  // Start at 0 for fading
            track.loop = true;
            track.muted = true;
        });
        
        // Add music state tracking
        this.currentTrack = null;
        this.fadeInterval = null;
        
        // Add enemy attack and shooting limits for more deliberate gameplay
        this.enemyAttackConfig = {
            maxAttacksPerWave: 10,  // Further reduced from 15 for more deliberate attacks
            currentAttacks: 0,
            maxShotsPerWave: 40,    // Further reduced from 60 for more deliberate shooting
            currentShots: 0
        };
        
        // Add boss health configuration
        this.bossConfig = {
            baseHealth: {
                easy: 10,
                normal: 15,
                hard: 20
            },
            healthMultiplier: {
                easy: 1.3,   // Increased from 1.2
                normal: 1.5, // Increased from 1.3
                hard: 1.8    // Increased from 1.5
            },
            shootInterval: {
                easy: 90,
                normal: 60,
                hard: 45
            },
            currentHealth: 0,
            maxHealth: 0,
            powerScale: 1,
            updatePowerScale: function(wave, difficulty) {
                // More aggressive power scaling
                const baseScale = {
                    easy: 0.3,    // Increased from 0.2
                    normal: 0.4,  // Increased from 0.3
                    hard: 0.5     // Increased from 0.4
                }[difficulty];
                
                // Exponential power scaling with wave number
                const waveBonus = Math.pow(1.2, Math.floor(wave / 3));
                this.powerScale = 1 + (Math.floor(wave / 3) * baseScale * waveBonus);
                
                // Health scales more aggressively with wave number
                const healthScale = Math.pow(this.healthMultiplier[difficulty], Math.floor(wave / 3));
                this.maxHealth = Math.ceil(this.baseHealth[difficulty] * healthScale * waveBonus);
                this.currentHealth = this.maxHealth;
            }
        };
        
        // Add movement patterns
        this.movementPatterns = {
            LOOP: {
                steps: 60,
                getPosition: (progress, startX, startY, targetX, targetY) => {
                    const angle = progress * Math.PI * 2;
                    const radius = 50;
                    return {
                        x: startX + Math.cos(angle) * radius,
                        y: startY + Math.sin(angle) * radius
                    };
                }
            },
            DIVE: {
                steps: 120,
                getPosition: (progress, startX, startY, targetX, targetY) => {
                    const angle = progress * Math.PI;
                    return {
                        x: startX + (targetX - startX) * Math.sin(progress * Math.PI),
                        y: startY + (targetY - startY) * progress + Math.sin(angle) * 100
                    };
                }
            }
        };
        
        // Add target indicators for escorts tracking player
        this.targetIndicators = [];
        
        // Add explosion particles array
        this.explosions = [];
        
        // Add shockwaves array for bullet clash effects
        this.shockwaves = [];
        
        // Detect if on computer (non-touch device)
        this.isComputer = !('ontouchstart' in window);
        
        // Add new boss attack patterns configuration
        this.bossAttackPatterns = {
            SINGLE: {
                cooldown: 1000,
                execute: (boss) => {
                    // Random angle within 60 degree cone
                    const angle = Math.PI/2 + (Math.random() - 0.5) * Math.PI/3;
                    this.createEnemyBullet(boss, angle);
                }
            },
            SPREAD: {
                cooldown: 800,
                execute: (boss) => {
                    // Random number of bullets between 2-4
                    const bulletCount = 2 + Math.floor(Math.random() * 3);
                    const baseAngle = Math.PI/2 + (Math.random() - 0.5) * Math.PI/6;
                    const spread = Math.PI/4; // 45 degree spread
                    
                    for (let i = 0; i < bulletCount; i++) {
                        const angle = baseAngle + (spread * (i/(bulletCount-1) - 0.5));
                        this.createEnemyBullet(boss, angle);
                    }
                }
            },
            BURST: {
                cooldown: 150,
                burstCount: 3, // Reduced from 5
                burstDelay: 100,
                execute: (boss) => {
                    if (boss.burstCount === undefined) boss.burstCount = 0;
                    if (boss.burstCount < this.bossAttackPatterns.BURST.burstCount) {
                        // Random angle within 45 degree cone
                        const angle = Math.PI/2 + (Math.random() - 0.5) * Math.PI/4;
                        this.createEnemyBullet(boss, angle);
                        boss.burstCount++;
                    } else {
                        boss.burstCount = 0;
                        boss.currentPattern = (boss.currentPattern + 1) % 4;
                    }
                }
            },
            CIRCLE: {
                cooldown: 1200,
                execute: (boss) => {
                    // Random number of bullets between 6-8
                    const bulletCount = 6 + Math.floor(Math.random() * 3);
                    const startAngle = Math.random() * Math.PI * 2; // Random starting angle
                    
                    for (let i = 0; i < bulletCount; i++) {
                        const angle = startAngle + (i * Math.PI * 2 / bulletCount);
                        this.createEnemyBullet(boss, angle);
                    }
                }
            }
        };
        
        // Add auto-fire state
        this.autoFire = false;
        this.autoFireCooldown = 0;
        this.autoFireRate = 150; // Time between shots in milliseconds
        
        // Add drone shooting cooldown
        this.droneCooldown = 0;
        this.droneReloadTime = 120; // 2 seconds at 60fps
        
        // Add touch control variables
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.swipeThreshold = 30; // minimum distance for swipe
        
        // Add touch event listeners
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing') return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            
            // Update player position based on touch movement
            this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, 
                this.player.x + deltaX));
                
            this.touchStartX = touch.clientX;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing') return;
            
            // Fire on touch release
            this.createPlayerBullet(this.player.x + this.player.width / 2, this.player.y);
        });
        
        this.init();
    }
    
    createAudio(src) {
        const audio = new Audio(src);
        audio.addEventListener('error', () => {
            // Silently handle missing audio files
            console.warn(`Audio file not found: ${src}`);
        });
        return audio;
    }
    
    init() {
        // Event listeners for keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            // Add WASD keys to movement
            if (e.key.toLowerCase() === 'a') this.keys['ArrowLeft'] = true;
            if (e.key.toLowerCase() === 'd') this.keys['ArrowRight'] = true;
            if (e.key.toLowerCase() === 'w') this.keys['ArrowUp'] = true;
            if (e.key.toLowerCase() === 's') this.keys['ArrowDown'] = true;
            
            // Start game when space is pressed (handled in initGameModeSelection)
            if (e.key === ' ') {
                if (this.gameState === 'gameover') {
                    this.restart();
                }
            }
            
            // Toggle debug mode with 'H' key
            if (e.key.toLowerCase() === 'h') {
                this.debugMode = !this.debugMode;
            }
            
            // Remove the keyboard difficulty selection
            if (this.gameState === 'start') {
                // Difficulty selection
                if (e.key === 'ArrowUp' || e.key === 'w') {
                    this.changeDifficulty(-1);
                }
                if (e.key === 'ArrowDown' || e.key === 's') {
                    this.changeDifficulty(1);
                }
            }
            
            // Toggle auto-fire with 'F' key
            if (e.key.toLowerCase() === 'f') {
                this.autoFire = !this.autoFire;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            // Add WASD keys to movement
            if (e.key.toLowerCase() === 'a') this.keys['ArrowLeft'] = false;
            if (e.key.toLowerCase() === 'd') this.keys['ArrowRight'] = false;
            if (e.key.toLowerCase() === 'w') this.keys['ArrowUp'] = false;
            if (e.key.toLowerCase() === 's') this.keys['ArrowDown'] = false;
        });
        
        // Remove click listener since we're using spacebar now
        this.canvas.removeEventListener('click', () => {});
        
        // Initialize UI controls
        this.initControls();
        
        // Show loading screen and load assets
        this.loadAssets();
        
        // Start game loop
        this.gameLoop();
        
        // Initialize game mode selection
        this.initGameModeSelection();
        
        // Initialize mobile controls
        this.initMobileControls();

        // Add click handler for shooting
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') {
                if (this.playerPowerUps.doubleShot) {
                    this.bullets.push(this.createPlayerBullet(
                        this.player.x + this.player.width / 4,
                        this.player.y
                    ));
                    this.bullets.push(this.createPlayerBullet(
                        this.player.x + (this.player.width * 3) / 4,
                        this.player.y
                    ));
                } else {
                    this.bullets.push(this.createPlayerBullet(
                        this.player.x + this.player.width / 2,
                        this.player.y
                    ));
                }
                if (this.sounds.shoot && !this.isMuted) {
                    this.sounds.shoot.play().catch(() => {});
                }
            }
        });
    }
    
    createFormations() {
        const formations = [];
        const baseConfig = this.waveConfig.getConfig(Math.min(this.wave, 5));
        const maxY = this.canvas.height * 0.4;
        
        const patterns = {
            ARROW: (count) => {
                const centerX = this.canvas.width/2;
                const startY = Math.min(80, maxY);
                const spacing = 35;
                
                // Create arrow shape pointing down
                for (let row = 0; row < 4; row++) {
                    const width = (row + 1) * 2 - 1;
                    for (let col = 0; col < width; col++) {
                        const x = centerX + (col - width/2 + 0.5) * spacing;
                        const y = startY + row * spacing;
                        formations.push(this.createEnemy(x, y,
                            row === 0 ? this.enemyTypes.BOSS :
                            row === 1 ? this.enemyTypes.ESCORT :
                            this.enemyTypes.GRUNT,
                            {
                                startX: x < centerX ? -50 : this.canvas.width + 50,
                                startY: -50,
                                controlX: x,
                                controlY: y - 30
                            }
                        ));
                    }
                }
            },
            
            SPIRAL: (count) => {
                const centerX = this.canvas.width/2;
                const startY = Math.min(80, maxY);
                const spacing = 30;
                const spiralCount = 12;
                
                for (let i = 0; i < spiralCount; i++) {
                    const angle = (i / spiralCount) * Math.PI * 4;
                    const radius = (i / spiralCount) * 100;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = startY + Math.sin(angle) * radius;
                    
                    formations.push(this.createEnemy(x, y,
                        i === 0 ? this.enemyTypes.BOSS :
                        i < 5 ? this.enemyTypes.ESCORT : // Increased from 3 to 5 escorts
                        this.enemyTypes.GRUNT,
                        {
                            startX: centerX,
                            startY: -50,
                            controlX: x,
                            controlY: y - 30
                        }
                    ));
                }
            },
            
            FORTRESS: (count) => {
                const centerX = this.canvas.width/2;
                const startY = Math.min(60, maxY);
                const spacing = 40;
                
                // Create outer wall
                for (let i = -2; i <= 2; i++) {
                    for (let j = -2; j <= 2; j++) {
                        if (Math.abs(i) === 2 || Math.abs(j) === 2) {
                            const x = centerX + i * spacing;
                            const y = startY + j * spacing;
                            formations.push(this.createEnemy(x, y,
                                this.enemyTypes.GRUNT,
                                {
                                    startX: x < centerX ? -50 : this.canvas.width + 50,
                                    startY: -50,
                                    controlX: x,
                                    controlY: y - 30
                                }
                            ));
                        }
                    }
                }
                
                // Create escorts at corners
                for (let i = -1; i <= 1; i += 2) {
                    for (let j = -1; j <= 1; j += 2) {
                        const x = centerX + i * spacing;
                        const y = startY + j * spacing;
                        formations.push(this.createEnemy(x, y,
                            this.enemyTypes.ESCORT,
                            {
                                startX: x < centerX ? -50 : this.canvas.width + 50,
                                startY: -50,
                                controlX: x,
                                controlY: y - 30
                            }
                        ));
                    }
                }
                
                // Boss in center
                formations.push(this.createEnemy(centerX, startY,
                    this.enemyTypes.BOSS,
                    {
                        startX: centerX,
                        startY: -50,
                        controlX: centerX,
                        controlY: startY - 30
                    }
                ));
            },  // <-- Added missing comma here
            
            BOSS_WAVE: () => {
                const centerX = this.canvas.width/2;
                const startY = Math.min(60, maxY);
                
                // Create the mega boss in the center
                formations.push(this.createEnemy(centerX, startY, 
                    this.enemyTypes.BOSS,
                    {
                        startX: centerX,
                        startY: -90,
                        controlX: centerX,
                        controlY: startY/2
                    },
                    true  // isMegaBoss
                ));
                
                // Create escort formation around the boss
                const escortCount = 4;
                for (let i = 0; i < escortCount; i++) {
                    const angle = (i / escortCount) * Math.PI * 2;
                    const radius = 60;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = startY + Math.sin(angle) * radius;
                    
                    formations.push(this.createEnemy(x, y,
                        this.enemyTypes.ESCORT,
                        {
                            startX: centerX + Math.cos(angle) * 200,
                            startY: -50,
                            controlX: x,
                            controlY: y/2
                        }
                    ));
                }

                // Update boss power scaling
                this.bossConfig.updatePowerScale(this.wave, 'normal');
            },
            
            DIAMOND: (count) => {
                const centerX = this.canvas.width/2;
                const startY = Math.min(80, maxY);
                const spacing = 40;
                
                // Create diamond shape
                for (let layer = 0; layer < 4; layer++) {
                    const width = layer < 2 ? layer + 1 : 4 - layer;
                    for (let i = 0; i < width; i++) {
                        const x = centerX + (i - (width-1)/2) * spacing;
                        const y = startY + layer * spacing;
                        formations.push(this.createEnemy(x, y,
                            layer === 0 ? this.enemyTypes.BOSS :
                            layer === 1 ? this.enemyTypes.ESCORT :
                            this.enemyTypes.GRUNT,
                            {
                                startX: x < centerX ? -50 : this.canvas.width + 50,
                                startY: -50,
                                controlX: x,
                                controlY: y - 30
                            }
                        ));
                    }
                }
            },
            
            CROSS: (count) => {
                const centerX = this.canvas.width/2;
                const startY = Math.min(80, maxY);
                const spacing = 35;
                
                // Create cross shape
                for (let i = -2; i <= 2; i++) {
                    // Horizontal line
                    formations.push(this.createEnemy(
                        centerX + i * spacing,
                        startY,
                        i === 0 ? this.enemyTypes.BOSS :
                        Math.abs(i) === 1 ? this.enemyTypes.ESCORT :
                        this.enemyTypes.GRUNT,
                        {
                            startX: centerX + i * spacing,
                            startY: -50,
                            controlX: centerX + i * spacing,
                            controlY: startY - 30
                        }
                    ));
                    
                    // Vertical line (skip center to avoid overlap)
                    if (i !== 0) {
                        formations.push(this.createEnemy(
                            centerX,
                            startY + i * spacing,
                            Math.abs(i) === 1 ? this.enemyTypes.ESCORT :
                            this.enemyTypes.GRUNT,
                            {
                                startX: centerX,
                                startY: -50,
                                controlX: centerX,
                                controlY: startY + i * spacing - 30
                            }
                        ));
                    }
                }
            },
            
            WINGS: (count) => {
                const centerX = this.canvas.width/2;
                const startY = Math.min(80, maxY);
                const spacing = 35;
                
                // Boss in center
                formations.push(this.createEnemy(centerX, startY,
                    this.enemyTypes.BOSS,
                    {
                        startX: centerX,
                        startY: -50,
                        controlX: centerX,
                        controlY: startY - 30
                    }
                ));
                
                // Create wing shapes on both sides
                for (let side = -1; side <= 1; side += 2) {
                    for (let row = 0; row < 3; row++) {
                        for (let col = 1; col <= 3-row; col++) {
                            formations.push(this.createEnemy(
                                centerX + (col * spacing * side),
                                startY + (row * spacing),
                                row === 0 ? this.enemyTypes.ESCORT : this.enemyTypes.GRUNT,
                                {
                                    startX: side < 0 ? -50 : this.canvas.width + 50,
                                    startY: -50,
                                    controlX: centerX + (col * spacing * side),
                                    controlY: startY + (row * spacing) - 30
                                }
                            ));
                        }
                    }
                }
            },
            
            HEXAGON: (count) => {
                const centerX = this.canvas.width/2;
                const startY = Math.min(80, maxY);
                const radius = 60;
                const sides = 6;
                
                // Boss in center
                formations.push(this.createEnemy(centerX, startY,
                    this.enemyTypes.BOSS,
                    {
                        startX: centerX,
                        startY: -50,
                        controlX: centerX,
                        controlY: startY - 30
                    }
                ));
                
                // Create hexagon points
                for (let i = 0; i < sides; i++) {
                    const angle = (i / sides) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = startY + Math.sin(angle) * radius;
                    
                    formations.push(this.createEnemy(x, y,
                        i % 2 === 0 ? this.enemyTypes.ESCORT : this.enemyTypes.GRUNT,
                        {
                            startX: x < centerX ? -50 : this.canvas.width + 50,
                            startY: -50,
                            controlX: x,
                            controlY: y - 30
                        }
                    ));
                }
            }
        };

        // Choose pattern based on wave number
        if (this.wave % 3 === 0) {
            patterns.BOSS_WAVE();
        } else {
            const patternKeys = ['ARROW', 'SPIRAL', 'FORTRESS', 'DIAMOND', 'CROSS', 'WINGS', 'HEXAGON'];
            const pattern = patterns[patternKeys[this.wave % patternKeys.length]];
            pattern(baseConfig.totalEnemies);
        }

        return formations;
    }

    createEnemy(targetX, targetY, type, path, isMegaBoss = false) {
        // Add margin to keep enemies on screen
        const margin = 30;
        const boundedX = Math.min(Math.max(targetX, margin), this.canvas.width - margin);
        const boundedY = Math.min(Math.max(targetY, margin), this.canvas.height * 0.4);

        // Add back the scaling factors with game mode multiplier
        const mode = this.gameMode ? this.gameModes[this.gameMode] : null;
        const waveMultiplier = mode ? mode.waveDifficulty : 1.0;
        const powerScale = (1 + (this.wave * 0.1)) * waveMultiplier;  // 10% stronger each wave
        const speedScale = (1 + (this.wave * 0.05)) * waveMultiplier; // 5% faster each wave
        const healthScale = (1 + (Math.floor(this.wave / 3) * 0.2)) * waveMultiplier; // 20% more health every 3 waves

        const enemy = {
            currentX: path ? path.startX : boundedX,
            currentY: path ? path.startY : -50,
            targetX: boundedX,
            targetY: boundedY,
            width: isMegaBoss ? 135 : 30,  // Increased from 90 to 135 for mega boss
            height: isMegaBoss ? 135 : 30, // Increased from 90 to 135 for mega boss
            speed: (this.difficulties['normal'].enemySpeed * speedScale) * 
                   (this.gameMode ? this.gameModes[this.gameMode].enemySpeedMultiplier : 1.0),
            inPosition: false,
            attacking: false,
            type: type,
            animationFrame: 0,
            bulletSpeed: (2 + (this.wave * 0.2)) * powerScale,
            bulletDamage: Math.ceil(1 * powerScale),
            path: path,
            pathProgress: 0,
            isMegaBoss: isMegaBoss,
            shootInterval: Math.max(20, isMegaBoss ? 60 : 45 - this.wave * 2),
            shootCooldown: Math.floor(Math.random() * 120) + 60,
            canShoot: false,
            health: isMegaBoss ? 
                this.bossConfig.maxHealth : 
                Math.ceil(type === this.enemyTypes.ESCORT ? 2 * healthScale : 1 * healthScale)
        };
        
        if (type === this.enemyTypes.BOSS) {
            enemy.currentPattern = 0;
            enemy.patternTimer = 0;
            enemy.lastShot = 0;
            enemy.burstCount = 0;
        }
        
        return enemy;
    }
    
    createDeathAnimation(x, y, type) {
        // Create a simple flash effect
        this.deathAnimations.push({
            x,
            y,
            type,
            frame: 0,
            maxFrames: 8,
            timer: 0
        });
    }

    createTractorBeam(boss) {
        this.tractorBeam = {
            x: boss.currentX + boss.width / 2,
            y: boss.currentY + boss.height / 2,
            width: 4,
            height: 0,
            maxHeight: this.canvas.height - boss.currentY,
            boss: boss,
            alpha: 1
        };
    }
    
    update() {
        // Only update game if not in title screen
        if (this.gameState === 'title') return;
        
        if (this.gameState !== 'playing') return;
        
        // Update attacking enemies with advanced movement patterns
        this.formations.forEach(enemy => {
            if (enemy.attacking) {
                if (enemy.isMegaBoss) {
                    // Boss stays in position but can shoot
                    const dx = enemy.targetX - enemy.currentX;
                    const moveSpeed = 1;
                    
                    // Gentle side-to-side movement (frame-rate independent)
                    enemy.currentX += Math.sin(Date.now() / 1000) * moveSpeed * this.deltaTime;
                    
                    // Keep boss within screen bounds
                    enemy.currentX = Math.max(enemy.width/2, Math.min(this.canvas.width - enemy.width/2, enemy.currentX));
                    
                    // Boss shooting is handled in the shooting update section
                } else {
                    // Advanced movement patterns for regular enemies
                    this.updateEnemyAttackPattern(enemy);
                }
            }
        });
        
        // Check for wave completion
        const anyEnemiesLeft = this.formations.some(enemy => {
            // For boss wave, only check if boss exists and is alive
            if (this.wave % 3 === 0) {
                return enemy.isMegaBoss && enemy.currentX > -50;
            }
            // For regular waves, check all enemies
            return enemy.currentX > -50;
        });
        
        // If no enemies left and wave has started
        if (!anyEnemiesLeft && this.formations.length > 0) {
            // Clear everything
            this.formations = [];
            this.enemyBullets = [];
            this.attackIndicators = [];
            
            // Reset boss state
            this.bossConfig = {
                baseHealth: {
                    easy: 10,    // Less health on easy
                    normal: 15,  // Current base health
                    hard: 20     // More health on hard
                },
                healthMultiplier: {
                    easy: 1.2,   // Slower health scaling
                    normal: 1.3, // Current multiplier
                    hard: 1.5    // Faster health scaling
                },
                shootInterval: {
                    easy: 90,    // Shoots slower
                    normal: 60,  // Current interval
                    hard: 45     // Shoots faster
                },
                currentHealth: 0,
                maxHealth: 0,
                powerScale: 1,
                updatePowerScale: function(wave, difficulty) {
                    // Scale boss power based on difficulty
                    const baseScale = {
                        easy: 0.2,    // 20% increase per boss wave
                        normal: 0.3,  // 30% increase per boss wave
                        hard: 0.4     // 40% increase per boss wave
                    }[difficulty];
                    
                    this.powerScale = 1 + (Math.floor(wave / 3) * baseScale);
                    this.maxHealth = Math.ceil(
                        this.baseHealth[difficulty] * 
                        Math.pow(this.healthMultiplier[difficulty], Math.floor(wave / 3))
                    );
                    this.currentHealth = this.maxHealth;
                }
            };
            
            // Advance wave
            this.wave++;
            
            // Reset attack config for new wave
            this.enemyAttackConfig.currentAttacks = 0;
            this.enemyAttackConfig.currentShots = 0;
            this.attackTimer = 0;
            
            // Create new wave with delay
            setTimeout(() => {
                if (this.gameState === 'playing') {
                this.formations = this.createFormations();
                }
            }, 1000);
        }

        // Update and clean up attack indicators
        this.attackIndicators = this.attackIndicators.filter(indicator => {
            indicator.alpha -= 0.05;  // Fade out
            return indicator.alpha > 0;  // Remove when fully faded
        });

        // Update enemy attacks with enhanced formation attacks
        if (this.formations.length > 0) {
            this.attackTimer++;
            const mode = this.gameMode ? this.gameModes[this.gameMode] : null;
            const attackCooldown = mode ? 
                this.difficulties['normal'].attackCooldown / mode.enemyAttackFrequency :
                this.difficulties['normal'].attackCooldown;
            
            if (this.attackTimer >= attackCooldown && 
                this.enemyAttackConfig.currentAttacks < this.enemyAttackConfig.maxAttacksPerWave) {
                
                const availableEnemies = this.formations.filter(enemy => 
                    enemy.inPosition && !enemy.attacking && enemy.currentX > -50
                );
                
                if (availableEnemies.length > 0) {
                    const attackingCount = this.formations.filter(e => e.attacking).length;
                    if (attackingCount < this.difficulties['normal'].maxAttackers) {
                        
        // More deliberate formation attacks
        const formationChance = 0.2 + (this.wave * 0.03); // Reduced from 0.3 to 0.2
        if (Math.random() < formationChance && availableEnemies.length >= 2) {
            this.startFormationAttack(availableEnemies);
        } else {
            // Single enemy attack
                        const enemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
                        this.startAttack(enemy);
        }
                        this.enemyAttackConfig.currentAttacks++;
                    }
                }
                this.attackTimer = 0;
            }
        }

        // Update enemy shooting with limits and delay
        this.formations.forEach(enemy => {
            // Only allow shooting once enemy is in position and after initial delay
            if (!enemy.canShoot && enemy.inPosition) {
                enemy.shootCooldown--;
                if (enemy.shootCooldown <= 0) {
                    enemy.canShoot = true;
                }
            }

            if (enemy.canShoot && enemy.currentX > -50 && 
                this.enemyAttackConfig.currentShots < this.enemyAttackConfig.maxShotsPerWave) {
                
                // Enhanced shooting based on enemy type and attack pattern
                this.handleEnemyShooting(enemy);
            }
        });

        // Check enemy collisions with player
        this.formations.forEach(enemy => {
            if (enemy.currentX > -50 && !this.player.invulnerable) {
                if (this.checkCollision(enemy, this.player)) {
                    // Only take damage from charging enemies or boss
                    if (enemy.attacking || enemy.isMegaBoss) {
                        this.playerHit();
                        
                        // Move charging enemy off screen after collision
                        if (enemy.attacking) {
                            enemy.currentX = -100;
                            enemy.currentY = -100;
                            enemy.attacking = false;
                            enemy.inPosition = false;
                        }
                    }
                }
            }
        });

        // Update enemy bullets and check for collisions
        this.enemyBullets = this.enemyBullets.filter((bullet, index) => {
            if (bullet.dx !== undefined) {
                // Move bullets according to their angle (frame-rate independent)
                bullet.x += bullet.dx * this.deltaTime;
                bullet.y += bullet.dy * this.deltaTime;
            } else {
                // Regular straight-down movement for normal enemies
                bullet.y += bullet.speed * this.deltaTime;
            }
            
            // Remove bullets that are off screen
            if (bullet.y > this.canvas.height || bullet.x < 0 || bullet.x > this.canvas.width) {
                return false;
            }
            
            // Check collision with player
            if (!this.player.invulnerable && this.checkCollision(bullet, this.player)) {
                this.playerHit();
                return false;
            }
            
            return true;
        });

        // Update bullet collisions with power-ups
        this.bullets.forEach((bullet, bulletIndex) => {
            this.powerUps.forEach((powerUp, powerUpIndex) => {
                if (this.checkCollision(bullet, powerUp)) {
                    this.bullets.splice(bulletIndex, 1);
                    powerUp.health--;
                    if (this.sounds.powerupHit && !this.isMuted) {
                        this.sounds.powerupHit.play().catch(() => {});
                    }
                    
                    if (powerUp.health <= 0) {
                        this.handlePowerUp(powerUp.type);
                        this.powerUps.splice(powerUpIndex, 1);
                    }
                    return;
                }
            });
        });

        // Update player movement (frame-rate independent)
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed * this.deltaTime;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed * this.deltaTime;
        }

        // Update shooting
        const now = Date.now();
        if (this.keys[' '] || (this.autoFire && now - this.autoFireCooldown >= this.autoFireRate)) {
            if (!this.shooting) {
                // Main ship bullets
                if (this.playerPowerUps.doubleShot) {
                    const shotCount = Math.min(5, 2 + Math.floor(this.playerPowerUps.permanentShotStacks / 3)); // Cap at 5 shots
                    for (let i = 0; i < shotCount; i++) {
                        const spread = (i - (shotCount - 1) / 2) * 0.15; // Reduced spread
                        this.bullets.push(this.createPlayerBullet(
                            this.player.x + this.player.width * ((i + 1) / (shotCount + 1)),
                            this.player.y,
                            spread
                        ));
                    }
                } else {
                    this.bullets.push(this.createPlayerBullet(
                        this.player.x + this.player.width / 2,
                        this.player.y
                    ));
                }

                // Drone bullets
                if (this.playerPowerUps.drone && this.droneCooldown <= 0) {
                    const droneCount = 1 + this.playerPowerUps.permanentDroneStacks;
                    for (let i = 0; i < droneCount; i++) {
                        const offset = 25 + (i * 15);
                        // Left drone
                        this.bullets.push(this.createDroneBullet(
                            this.player.x - offset,
                            this.player.y + 5,
                            0.2
                        ));
                        // Right drone
                        this.bullets.push(this.createDroneBullet(
                            this.player.x + this.player.width + offset,
                            this.player.y + 5,
                            -0.2
                        ));
                    }
                    this.droneCooldown = this.droneReloadTime;
                } else if (this.droneCooldown > 0) {
                    this.droneCooldown--;
                }

                if (this.sounds.shoot && !this.isMuted) {
                    this.sounds.shoot.play().catch(() => {});
                }
                this.shooting = true;
                if (this.autoFire) {
                    this.autoFireCooldown = now;
                }
            }
        } else {
            this.shooting = false;
        }

        // Update bullets (revert to original)
        this.bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            
            // Update bullet trail
            if (this.bulletEffects.player.trail) {
                bullet.trail.unshift({ x: bullet.x, y: bullet.y });
                if (bullet.trail.length > this.bulletEffects.player.tailLength) {
                    bullet.trail.pop();
                }
            }
            
            // Remove bullets that are off screen
            if (bullet.y < 0) {
                this.bullets.splice(index, 1);
                return;
            }
        });

        // Update enemy bullets (frame-rate independent)
        this.enemyBullets = this.enemyBullets.filter((bullet) => {
            bullet.x += bullet.dx * this.deltaTime;
            bullet.y += bullet.dy * this.deltaTime;

            // Update trail for enemy bullets
            bullet.trail = bullet.trail || [];
            bullet.trail.unshift({ x: bullet.x, y: bullet.y });
            if (bullet.trail.length > 16) { // Even longer trail for enemy bullets
                bullet.trail.pop();
            }

            // Remove bullets that are off screen
            return !(bullet.y > this.canvas.height || bullet.x < 0 || bullet.x > this.canvas.width);
        });

        // Update bullet collisions with enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            this.formations.forEach((enemy, enemyIndex) => {
                // Only check collisions for active enemies
                if (enemy.currentX > -50 && this.checkCollision(bullet, enemy)) {
                    this.handleEnemyDestruction(enemy, bulletIndex);
                    return;  // Exit after handling destruction
                }
            });
        });

        // Update formations with smooth path following
        this.formations.forEach(enemy => {
            if (enemy.currentX <= -50) return;  // Skip destroyed enemies

            if (!enemy.inPosition && enemy.path) {
                // Use quadratic bezier curve for smooth movement (frame-rate independent)
                enemy.pathProgress = Math.min(1, enemy.pathProgress + 0.01 * this.deltaTime);
                const t = enemy.pathProgress;
                const p0x = enemy.path.startX;
                const p0y = enemy.path.startY;
                const p1x = enemy.path.controlX;
                const p1y = enemy.path.controlY;
                const p2x = enemy.targetX;
                const p2y = enemy.targetY;
                
                // Quadratic bezier curve calculation
                enemy.currentX = Math.pow(1-t, 2) * p0x + 2 * (1-t) * t * p1x + Math.pow(t, 2) * p2x;
                enemy.currentY = Math.pow(1-t, 2) * p0y + 2 * (1-t) * t * p1y + Math.pow(t, 2) * p2y;
                
                if (enemy.pathProgress >= 1) {
                    enemy.inPosition = true;
                }
            } else if (enemy.inPosition && !enemy.attacking) {
                // Gentle swaying motion when in formation
                enemy.currentX = enemy.targetX + Math.sin(Date.now() / 2000) * 10;
            }
            // ... rest of enemy update code ...
        });

        // Update stars movement (frame-rate independent)
        this.stars.forEach(star => {
            star.y += star.speed * this.deltaTime;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });

        // Update power-ups
        this.powerUps.forEach((powerUp, index) => {
            powerUp.y += powerUp.speed;
            
            // Remove if off screen
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(index, 1);
                return;
            }
        });

        // Update boss shooting pattern with enhanced patterns
        this.formations.forEach(enemy => {
            if (enemy.isMegaBoss && enemy.inPosition) {
                enemy.shootCooldown++;
                if (enemy.shootCooldown >= enemy.shootInterval) {
                    this.handleBossShooting(enemy);
                    enemy.shootCooldown = 0;
                    if (this.sounds.shoot && !this.isMuted) {
                    this.sounds.shoot.play().catch(() => {});
                }
                }
            }
        });

        // Update fleeing enemies
        this.formations.forEach(enemy => {
            if (enemy.fleeing) {
                const dx = enemy.fleeTargetX - enemy.currentX;
                const dy = enemy.fleeTargetY - enemy.currentY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > enemy.speed * 2) {
                    enemy.currentX += (dx / distance) * enemy.speed * 2;
                    enemy.currentY += (dy / distance) * enemy.speed * 2;
                } else {
                    // Enemy has reached flee target, remove it
                    enemy.currentX = -100;
                    this.createDeathAnimation(
                        enemy.currentX + enemy.width/2,
                        enemy.currentY + enemy.height/2,
                        enemy.type
                    );
                }
            }
        });

        // Check for escort collisions with player
        this.formations.forEach(enemy => {
            if (enemy.attacking && enemy.type === this.enemyTypes.ESCORT) {
                // Check if escort hits player
                if (this.checkCollision(this.player, enemy)) {
                    // Create explosion
                    this.createExplosion(
                        enemy.currentX + enemy.width/2,
                        enemy.currentY + enemy.height/2,
                        enemy.type
                    );
                    
                    // Remove escort
                    enemy.currentX = -100;
                    enemy.currentY = -100;
                    enemy.attacking = false;
                    
                    // Play explosion sound
                    if (this.sounds.explosion && !this.isMuted) {
                        this.sounds.explosion.play().catch(() => {});
                    }
                    
                    // Damage player
                    this.playerHit();
                }
            }
        });

        // Update target indicators
        this.targetIndicators = this.targetIndicators.filter(indicator => {
            const enemy = indicator.enemy;
            
            // Remove if enemy is gone, destroyed, or hits player
            if (enemy.currentX <= -50 || enemy.currentY > this.canvas.height || !enemy.attacking) {
                return false;
            }
            
            // Update visual effects
            indicator.alpha = Math.min(indicator.alpha + 0.05, 1);
            indicator.scale = 1 + Math.sin(Date.now() / 200) * 0.2;
            indicator.rotation += 0.05;
            
            // Update target position while enemy is diving
            if (enemy.attacking) {
                enemy.targetX = this.player.x;
            }
            
            return true;
        });

        // Update explosions
        this.explosions = this.explosions.filter(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.dx *= 0.95;  // Slow down over time
            particle.dy *= 0.95;
            particle.alpha -= particle.decay;
            particle.rotation += 0.1;
            return particle.alpha > 0;
        });
        
        // Check for bullet clashes
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemyBullets.forEach((enemyBullet, enemyBulletIndex) => {
                if (this.checkBulletCollision(bullet, enemyBullet)) {
                    // Create shockwave effect
                    this.createShockwave(
                        (bullet.x + enemyBullet.x) / 2,
                        (bullet.y + enemyBullet.y) / 2
                    );
                    
                    // Remove both bullets
                    this.bullets.splice(bulletIndex, 1);
                    this.enemyBullets.splice(enemyBulletIndex, 1);
                    
                    // Play clash sound
                    if (this.sounds.clash && !this.isMuted) {
                        this.sounds.clash.play().catch(() => {});
                    }
                }
            });
        });
        
        // Update shockwaves
        this.shockwaves = this.shockwaves.filter(wave => {
            wave.radius += wave.speed;
            wave.speed *= 0.95;  // Slow down expansion
            wave.alpha -= 0.03;  // Fade out
            return wave.alpha > 0;
        });

        // Update boss shooting patterns
        this.formations.forEach(enemy => {
            if (enemy.type === this.enemyTypes.BOSS && enemy.inPosition) {
                const now = Date.now();
                const patterns = Object.values(this.bossAttackPatterns);
                const currentPattern = patterns[enemy.currentPattern];
                
                if (now - enemy.lastShot >= currentPattern.cooldown) {
                    currentPattern.execute(enemy);
                    enemy.lastShot = now;
                    
                    // Change pattern periodically
                    enemy.patternTimer += currentPattern.cooldown;
                    if (enemy.patternTimer >= 3000) { // Change pattern every 3 seconds
                        enemy.currentPattern = (enemy.currentPattern + 1) % patterns.length;
                        enemy.patternTimer = 0;
                        enemy.burstCount = 0;
                    }
                }
            }
        });
    }
    
    checkCollision(rect1, rect2) {
        // For bullets, use their direct x,y coordinates
        const r1x = rect1.x - (rect1.width / 2);
        const r1y = rect1.y;
        
        // For enemies and other objects, use their current positions
        const r2x = rect2.currentX || rect2.x;
        const r2y = rect2.currentY || rect2.y;

        return r1x < (r2x + rect2.width) &&
               (r1x + rect1.width) > r2x &&
               r1y < (r2y + rect2.height) &&
               (r1y + rect1.height) > r2y;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.drawStars();
        
        if (this.gameState === 'title') return;
        
        // Draw game elements
        this.drawPlayer();
        
        // Draw bullets with trails and glow
        this.bullets.forEach(bullet => {
            // Draw trail
            if (this.bulletEffects.player.trail && bullet.trail.length > 1) {
                this.ctx.save();
                for (let i = 1; i < bullet.trail.length; i++) {
                    const alpha = 1 - (i / bullet.trail.length);
                    this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
                    
                    // Calculate trail segment angle
                    const dx = bullet.trail[i].x - bullet.trail[i-1].x;
                    const dy = bullet.trail[i].y - bullet.trail[i-1].y;
                    const angle = Math.atan2(dy, dx);
                    
                    // Draw rotated trail segment
                    this.ctx.save();
                    this.ctx.translate(bullet.trail[i].x, bullet.trail[i].y);
                    this.ctx.rotate(angle);
                    this.ctx.fillRect(
                        -bullet.visualWidth/2,
                        -bullet.visualHeight/2,
                        bullet.visualWidth,
                        bullet.visualHeight * 0.8
                    );
                    this.ctx.restore();
                }
                this.ctx.restore();
            }

            // Draw glow effect
            if (this.bulletEffects.player.glow) {
                this.ctx.save();
                this.ctx.shadowColor = bullet.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = bullet.color;
                this.ctx.fillRect(
                    bullet.x - bullet.width / 2,
                    bullet.y,
                    bullet.width,
                    bullet.height
                );
                this.ctx.restore();
            }

            // Draw main bullet
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(
                bullet.x - bullet.width / 2,
                bullet.y,
                bullet.width,
                bullet.height
            );
        });
        
        // Draw enemy bullets
        this.enemyBullets.forEach(bullet => {
            this.ctx.save();
            this.ctx.fillStyle = bullet.color;
            // Draw a pixelated square instead of a circle
            this.ctx.fillRect(
                Math.round(bullet.x - bullet.width / 2),
                Math.round(bullet.y - bullet.height / 2),
                bullet.width,
                bullet.height
            );
            this.ctx.restore();
        });
        
        // Draw enemies
        this.formations.forEach(enemy => {
            if (enemy.currentX > -50) {
                this.drawEnemy(enemy);
            }
        });

        // Draw power-ups with health bars
        this.powerUps.forEach(powerUp => {
            // Draw glowing effect
            const glow = Math.sin(Date.now() / 200) * 0.2 + 0.8;
            this.ctx.globalAlpha = glow;
            this.ctx.fillStyle = powerUp.color;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + 10, powerUp.y + 10, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw main power-up
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + 10, powerUp.y + 10, 10, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw symbol
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.symbol, powerUp.x + 10, powerUp.y + 10);

            // Draw label above
            this.ctx.font = '8px "Press Start 2P"';
            this.ctx.fillText(powerUp.label, powerUp.x + 10, powerUp.y - 15);

            // Draw health bars
            const barWidth = 20;
            const barHeight = 3;
            const spacing = 2;
            
            for (let i = 0; i < powerUp.health; i++) {
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(
                    powerUp.x + (20 - barWidth) / 2,
                    powerUp.y - (spacing + barHeight) * (i + 1),
                    barWidth,
                    barHeight
                );
            }
        });

        // Draw shield if active
        if (this.playerPowerUps.shield) {
            this.ctx.strokeStyle = '#0ff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2, 
                         this.player.y + this.player.height / 2, 
                         30, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Draw tractor beam
        if (this.tractorBeam) {
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${this.tractorBeam.alpha})`;
            this.ctx.lineWidth = this.tractorBeam.width;
            this.ctx.beginPath();
            this.ctx.moveTo(this.tractorBeam.x, this.tractorBeam.y);
            this.ctx.lineTo(this.tractorBeam.x, this.tractorBeam.y + this.tractorBeam.height);
            this.ctx.stroke();
            
            // Draw zigzag pattern
            this.ctx.beginPath();
            let y = this.tractorBeam.y;
            const width = 15;
            while (y < this.tractorBeam.y + this.tractorBeam.height) {
                this.ctx.moveTo(this.tractorBeam.x - width, y);
                this.ctx.lineTo(this.tractorBeam.x + width, y + 10);
                y += 20;
            }
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.tractorBeam.alpha * 0.5})`;
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Draw death animations with simple flash effect
        this.deathAnimations.forEach(anim => {
            this.ctx.save();
            const alpha = 1 - (anim.frame / anim.maxFrames);
            this.ctx.globalAlpha = alpha;
            
            // Draw simple flash
            this.ctx.fillStyle = '#fff';  // White flash
            this.ctx.beginPath();
            this.ctx.arc(anim.x, anim.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
            
            // Update animation frame
            if (anim.timer % 2 === 0) {
                anim.frame++;
            }
            anim.timer++;
        });

        // Filter out completed animations
        this.deathAnimations = this.deathAnimations.filter(anim => anim.frame < anim.maxFrames);

        // Draw attack indicators
        this.ctx.save();
        this.attackIndicators.forEach(indicator => {
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${indicator.alpha})`;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(indicator.startX, indicator.startY);
            this.ctx.lineTo(indicator.endX, indicator.endY);
            this.ctx.stroke();
            
            // Draw arrow at end
            this.ctx.save();
            this.ctx.translate(indicator.endX, indicator.endY);
            this.ctx.rotate(Math.atan2(indicator.endY - indicator.startY, indicator.endX - indicator.startX));
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-10, -5);
            this.ctx.lineTo(-10, 5);
            this.ctx.closePath();
            this.ctx.fillStyle = `rgba(255, 0, 0, ${indicator.alpha})`;
            this.ctx.fill();
            this.ctx.restore();
        });
        this.ctx.restore();

        // Draw wave transition
        if (this.waveTransition.active) {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '24px "Press Start 2P"';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.waveTransition.text, this.canvas.width / 2, this.canvas.height / 2);
            
            // Draw wave details
            this.ctx.font = '12px "Press Start 2P"';
            const config = this.waveConfig.getConfig(Math.min(this.wave, 5));
            this.ctx.fillText(`ENEMIES: ${config.totalEnemies}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.fillText(`SPEED: ${config.speedMultiplier.toFixed(1)}x`, this.canvas.width / 2, this.canvas.height / 2 + 60);
            this.ctx.fillText(`BOSSES: ${config.bossCount}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
            
            this.ctx.restore();
        }

        // Draw wave completion effects
        this.drawWaveCompletion();

        // Draw current wave number
        this.ctx.font = '8px "Press Start 2P"';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`WAVE ${this.wave}`, this.canvas.width / 2, 20);

        // Draw power-up collection effects
        this.powerUpEffects.forEach(effect => {
            this.ctx.save();
            this.ctx.globalAlpha = effect.alpha;
            this.ctx.fillStyle = effect.color;
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.translate(this.canvas.width/2, effect.y);
            this.ctx.scale(effect.scale, effect.scale);
            this.ctx.fillText(effect.message, 0, 0);
            this.ctx.restore();
        });

        // Draw enhanced enemy bullets
        this.enemyBullets.forEach(bullet => {
            this.ctx.save();
            this.ctx.fillStyle = bullet.color;
            // Draw a pixelated square instead of a circle
            this.ctx.fillRect(
                Math.round(bullet.x - bullet.width / 2),
                Math.round(bullet.y - bullet.height / 2),
                bullet.width,
                bullet.height
            );
            this.ctx.restore();
        });
        
        // Draw enemies
        this.formations.forEach(enemy => {
            if (enemy.currentX > -50) {
                this.drawEnemy(enemy);
            }
        });

        // Draw target indicators
        this.targetIndicators.forEach(indicator => {
            this.ctx.save();
            this.ctx.translate(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
            this.ctx.rotate(indicator.rotation);
            this.ctx.scale(indicator.scale, indicator.scale);
            
            // Draw bullseye
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${indicator.alpha})`;
            this.ctx.lineWidth = 2;
            
            // Outer circle
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Inner circle
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Crosshairs
            this.ctx.beginPath();
            this.ctx.moveTo(-25, 0);
            this.ctx.lineTo(25, 0);
            this.ctx.moveTo(0, -25);
            this.ctx.lineTo(0, 25);
            this.ctx.stroke();
            
            this.ctx.restore();
        });

        // Draw death animations with simple flash effect
        this.deathAnimations.forEach(anim => {
            this.ctx.save();
            const alpha = 1 - (anim.frame / anim.maxFrames);
            this.ctx.globalAlpha = alpha;
            
            // Draw simple flash
            this.ctx.fillStyle = '#fff';  // White flash
            this.ctx.beginPath();
            this.ctx.arc(anim.x, anim.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
            
            // Update animation frame
            if (anim.timer % 2 === 0) {
                anim.frame++;
            }
            anim.timer++;
        });

        // Filter out completed animations
        this.deathAnimations = this.deathAnimations.filter(anim => anim.frame < anim.maxFrames);

        // Draw explosions
        this.explosions.forEach(particle => {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
            this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            this.ctx.restore();
        });

        // Draw shockwaves
        this.shockwaves.forEach(wave => {
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${wave.alpha})`;
            this.ctx.lineWidth = 2;
            
            // Draw outer ring
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw inner ring
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, wave.radius * 0.7, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw center glow
            const gradient = this.ctx.createRadialGradient(
                wave.x, wave.y, 0,
                wave.x, wave.y, wave.radius * 0.5
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${wave.alpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.restore();
        });

        // Draw debug info if enabled
        if (this.debugMode) {
            // Draw player hitbox
            this.drawHitbox(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                this.player.width,
                this.player.height,
                '#0f0'
            );

            // Draw bullet hitboxes
            this.bullets.forEach(bullet => {
                this.drawHitbox(
                    bullet.x,
                    bullet.y,
                    bullet.width,
                    bullet.height,
                    '#ff0'
                );
            });

            // Draw enemy hitboxes with labels
            this.formations.forEach(enemy => {
                if (enemy.currentX > -50) {
                    const enemyType = enemy.isMegaBoss ? 'MEGA BOSS' :
                                     enemy.type === this.enemyTypes.BOSS ? 'BOSS' :
                                     enemy.type === this.enemyTypes.ESCORT ? 'ESCORT' :
                                     'GRUNT';
                    
                    const healthLabel = `${enemyType} (${enemy.health})`;
                    
                    this.drawHitbox(
                        enemy.currentX + enemy.width / 2,
                        enemy.currentY + enemy.height / 2,
                        enemy.width * 0.8,
                        enemy.height * 0.8,
                        enemy.attacking ? '#f00' : '#f0f',
                        healthLabel
                    );
                }
            });

            // Draw debug info in bottom right
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '6px "Press Start 2P"';
            this.ctx.textAlign = 'right';
            
            const rightEdge = this.canvas.width - 10;
            const bottomStart = this.canvas.height - 60;
            const lineHeight = 8;
            
            this.ctx.fillText('DEBUG MODE (H)', rightEdge, bottomStart);
            
            // Add current formation pattern
            const currentPattern = this.wave % 3 === 0 ? 'BOSS WAVE' : 
                ['ARROW', 'SPIRAL', 'FORTRESS'][this.wave % 3];
            this.ctx.fillText(`PATTERN: ${currentPattern}`, rightEdge, bottomStart + lineHeight);
            
            // Add enemies left counter
            const enemiesLeft = this.formations.filter(enemy => 
                enemy.currentX > -50 && enemy.currentY < this.canvas.height
            ).length;
            this.ctx.fillText(`ENEMIES: ${enemiesLeft}`, rightEdge, bottomStart + lineHeight * 2);
            
            this.ctx.fillText(`ENTITIES: ${this.formations.length + this.bullets.length + this.powerUps.length}`, 
                rightEdge, bottomStart + lineHeight * 3);
            
            // Add enemy type breakdown
            const bosses = this.formations.filter(e => e.type === this.enemyTypes.BOSS && e.currentX > -50).length;
            const escorts = this.formations.filter(e => e.type === this.enemyTypes.ESCORT && e.currentX > -50).length;
            const grunts = this.formations.filter(e => e.type === this.enemyTypes.GRUNT && e.currentX > -50).length;
            this.ctx.fillText(`B:${bosses} E:${escorts} G:${grunts}`, rightEdge, bottomStart + lineHeight * 4);
            
            this.ctx.fillText(`POS: ${Math.round(this.player.x)},${Math.round(this.player.y)}`, 
                rightEdge, bottomStart + lineHeight * 5);

            // Draw escort charging trajectories
            this.formations.forEach(enemy => {
                if (enemy.type === this.enemyTypes.ESCORT && enemy.attacking) {
                    // Draw predicted path
                    this.ctx.save();
                    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(enemy.currentX + enemy.width/2, enemy.currentY + enemy.height/2);
                    this.ctx.lineTo(enemy.targetX, enemy.targetY);
                    this.ctx.stroke();
                    
                    // Draw target point
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.targetX, enemy.targetY, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            });
        }

        // Draw vertical boss health bar on left side
        if (this.bossConfig.maxHealth > 0 && this.gameState === 'playing') {
            const bossExists = this.formations.some(enemy => enemy.isMegaBoss);
            
            if (bossExists) {
                const barWidth = 20;
                const barHeight = 200;
                const barX = 30;
                const barY = (this.canvas.height - barHeight) / 2;

                // Background
                this.ctx.fillStyle = '#400';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);

                // Health bar
                const healthPercent = this.bossConfig.currentHealth / this.bossConfig.maxHealth;
                const currentHeight = barHeight * healthPercent;
                this.ctx.fillStyle = `rgb(${255 * (1 - healthPercent)}, ${255 * healthPercent}, 0)`;
                this.ctx.fillRect(barX, barY + (barHeight - currentHeight), barWidth, currentHeight);

                // Border
                this.ctx.strokeStyle = '#fff';
                this.ctx.strokeRect(barX, barY, barWidth, barHeight);
            }
        }

        // Draw wave count in top center
        if (this.gameState === 'playing') {
            this.ctx.save();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '8px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`WAVE ${this.wave}`, this.canvas.width / 2, 20);
            this.ctx.restore();
        }
    }
    
    drawPlayer() {
        if (this.player.invulnerable && Math.floor(Date.now() / 100) % 2) return;
        
        this.ctx.save();
        this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        
        // Base ship model facing up (white/red/blue palette)
        // Main body
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(-1, -12, 2, 4);  // Top thin part
        this.ctx.fillRect(-3, -8, 6, 16);  // Center body
        this.ctx.fillRect(-6, 0, 12, 8);   // Wide base
        
        // Red accents
        this.ctx.fillStyle = '#f00';
        this.ctx.fillRect(-4, -4, 2, 12);  // Left red stripe
        this.ctx.fillRect(2, -4, 2, 12);   // Right red stripe
        this.ctx.fillRect(-8, 4, 2, 4);    // Left wing tip
        this.ctx.fillRect(6, 4, 2, 4);     // Right wing tip
        
        // Blue details
        this.ctx.fillStyle = '#00f';
        this.ctx.fillRect(-2, -8, 4, 4);   // Top blue section
        this.ctx.fillRect(-6, 4, 2, 4);    // Left blue wing
        this.ctx.fillRect(4, 4, 2, 4);     // Right blue wing
        
        this.ctx.restore();

        // Draw drone if active
        if (this.playerPowerUps.drone) {
            const droneOffset = 25;
            const droneY = this.player.y + 5;
            
            // Draw left drone
            this.ctx.save();
            this.ctx.translate(this.player.x - droneOffset, droneY);
            this.drawDrone();
            this.ctx.restore();
            
            // Draw right drone
            this.ctx.save();
            this.ctx.translate(this.player.x + this.player.width + droneOffset, droneY);
            this.drawDrone();
            this.ctx.restore();
        }
    }

    drawEnemy(enemy) {
        this.ctx.save();
        this.ctx.translate(enemy.currentX + enemy.width / 2, enemy.currentY + enemy.height / 2);
        
        if (enemy.attacking) {
            const rotation = this.rotationAngles.get(enemy) || 0;
            this.ctx.rotate(rotation);
        }

        if (enemy.type === this.enemyTypes.BOSS) {
            this.drawBossEnemy(enemy.animationFrame);
        } else if (enemy.type === this.enemyTypes.ESCORT) {
            this.drawEscortEnemy(enemy.animationFrame);
        } else {
            this.drawGruntEnemy(enemy.animationFrame);
        }
        
        this.ctx.restore();
    }

    drawBossEnemy(frame) {
        // Aircraft carrier/starship design facing down
        const scale = this.isMegaBoss ? 4.5 : 1;  // Increased mega boss scale to 4.5x
        
        // Main hull (gradient effect)
        const gradient = this.ctx.createLinearGradient(0, -16 * scale, 0, 16 * scale);
        gradient.addColorStop(0, '#555');
        gradient.addColorStop(1, '#333');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-10 * scale, -16 * scale, 20 * scale, 32 * scale);
        
        // Armor plating details
        this.ctx.fillStyle = '#444';
        for (let i = -12; i <= 12; i += 4) {
            this.ctx.fillRect(i * scale, -14 * scale, 2 * scale, 28 * scale);
        }
        
        // Command tower with windows
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(-6 * scale, -10 * scale, 12 * scale, 14 * scale);
        this.ctx.fillStyle = '#88f';
        this.ctx.fillRect(-4 * scale, -8 * scale, 8 * scale, 2 * scale);
        
        // Flight deck with detailed markings
        this.ctx.fillStyle = '#800';
        this.ctx.fillRect(-14 * scale, 0 * scale, 28 * scale, 16 * scale);
        
        // Runway lights (blinking)
        this.ctx.fillStyle = frame % 4 < 2 ? '#ff0' : '#880';
        for (let i = -12; i <= 12; i += 4) {
            this.ctx.fillRect(i * scale, 2 * scale, 2 * scale, 2 * scale);
            this.ctx.fillRect(i * scale, 8 * scale, 2 * scale, 2 * scale);
            this.ctx.fillRect(i * scale, 14 * scale, 2 * scale, 2 * scale);
        }
        
        // Side cannons with energy glow
        this.ctx.fillStyle = '#006';
        this.ctx.fillRect(-16 * scale, -6 * scale, 6 * scale, 12 * scale);
        this.ctx.fillRect(10 * scale, -6 * scale, 6 * scale, 12 * scale);
        
        // Energy glow on cannon tips (pulsing)
        const glowIntensity = Math.sin(Date.now() / 200) * 0.5 + 0.5;
        this.ctx.fillStyle = `rgba(0, 128, 255, ${glowIntensity})`;
        this.ctx.fillRect(-16 * scale, -2 * scale, 6 * scale, 4 * scale);
        this.ctx.fillRect(10 * scale, -2 * scale, 6 * scale, 4 * scale);
        
        // Engine exhausts with animated glow
        const engineGlow = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        const engineColor = frame % 2 ? 
            `rgba(255, 128, 0, ${engineGlow})` : 
            `rgba(255, 200, 0, ${engineGlow})`;
        this.ctx.fillStyle = engineColor;
        this.ctx.fillRect(-8 * scale, -18 * scale, 16 * scale, 4 * scale);
        this.ctx.fillRect(-12 * scale, -16 * scale, 4 * scale, 2 * scale);
        this.ctx.fillRect(8 * scale, -16 * scale, 4 * scale, 2 * scale);
    }

    drawEscortEnemy(frame) {
        // Escort ship model facing down (green/white theme)
        // Main body
        this.ctx.fillStyle = '#0c0';
        this.ctx.fillRect(-1, 8, 2, 4);    // Bottom thin part
        this.ctx.fillRect(-3, -8, 6, 16);  // Center body
        this.ctx.fillRect(-6, -8, 12, 8);  // Wide top
        
        // White accents
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(-4, -8, 2, 12);  // Left stripe
        this.ctx.fillRect(2, -8, 2, 12);   // Right stripe
        this.ctx.fillRect(-8, -8, 2, 4);   // Left wing tip
        this.ctx.fillRect(6, -8, 2, 4);    // Right wing tip
        
        // Energy details (animated)
        const glowIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        this.ctx.fillStyle = frame % 2 ? '#0f0' : '#0a0';
        this.ctx.fillRect(-2, 4, 4, 4);    // Bottom section
        this.ctx.fillRect(-6, -8, 2, 4);   // Left wing
        this.ctx.fillRect(4, -8, 2, 4);    // Right wing
        
        // Engine glow
        this.ctx.fillStyle = `rgba(0, 255, 0, ${glowIntensity})`;
        this.ctx.fillRect(-2, -12, 4, 4);  // Engine exhaust at top
    }

    drawGruntEnemy(frame) {
        // Grunt ship model facing down (blue/cyan theme)
        // Main body
        this.ctx.fillStyle = '#00f';
        this.ctx.fillRect(-1, 8, 2, 4);    // Bottom thin part
        this.ctx.fillRect(-3, -8, 6, 16);  // Center body
        this.ctx.fillRect(-6, -8, 12, 8);  // Wide top
        
        // Cyan accents
        this.ctx.fillStyle = '#0ff';
        this.ctx.fillRect(-4, -8, 2, 12);  // Left stripe
        this.ctx.fillRect(2, -8, 2, 12);   // Right stripe
        this.ctx.fillRect(-8, -8, 2, 4);   // Left wing tip
        this.ctx.fillRect(6, -8, 2, 4);    // Right wing tip
        
        // Energy details (animated)
        const glowIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        this.ctx.fillStyle = frame % 2 ? '#00f' : '#008';
        this.ctx.fillRect(-2, 4, 4, 4);    // Bottom section
        this.ctx.fillRect(-6, -8, 2, 4);   // Left wing
        this.ctx.fillRect(4, -8, 2, 4);    // Right wing
        
        // Engine glow
        this.ctx.fillStyle = `rgba(0, 128, 255, ${glowIntensity})`;
        this.ctx.fillRect(-2, -12, 4, 4);  // Engine exhaust at top
    }
    
    gameLoop() {
        // Calculate delta time for frame-rate independent movement
        const currentTime = performance.now();
        const elapsedTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Normalize delta time to target 60 FPS (1.0 = 60fps)
        // If running at 120fps, dt will be 0.5, if at 30fps it will be 2.0
        this.deltaTime = Math.min(elapsedTime / (1000 / this.targetFPS), 3.0); // Cap at 3x to prevent huge jumps
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    createPowerUp(x, y) {
        const type = Math.floor(Math.random() * Object.keys(this.powerUpTypes).length);
        const powerUpSymbols = {
            [this.powerUpTypes.DOUBLE_SHOT]: '2X',
            [this.powerUpTypes.SPEED_UP]: '>>',
            [this.powerUpTypes.SHIELD]: '⚡',
            [this.powerUpTypes.EXTRA_LIFE]: '♥',
            [this.powerUpTypes.PERMANENT_SPEED]: '∞S',
            [this.powerUpTypes.PERMANENT_SHOT]: '∞2',
            [this.powerUpTypes.BULLET_SPEED]: '→+',
            [this.powerUpTypes.SMALL_SHIP]: '◊',
            [this.powerUpTypes.DRONE]: '★',
            [this.powerUpTypes.PERMANENT_BULLET]: '∞→',
            [this.powerUpTypes.PERMANENT_SIZE]: '∞◊',
            [this.powerUpTypes.PERMANENT_DRONE]: '∞★'
        };
        
        const powerUpLabels = {
            [this.powerUpTypes.DOUBLE_SHOT]: 'DOUBLE',
            [this.powerUpTypes.SPEED_UP]: 'SPEED',
            [this.powerUpTypes.SHIELD]: 'SHIELD',
            [this.powerUpTypes.EXTRA_LIFE]: 'LIFE',
            [this.powerUpTypes.PERMANENT_SPEED]: 'PERM SPEED',
            [this.powerUpTypes.PERMANENT_SHOT]: 'PERM SHOT',
            [this.powerUpTypes.BULLET_SPEED]: 'FAST SHOT',
            [this.powerUpTypes.SMALL_SHIP]: 'SMALL',
            [this.powerUpTypes.DRONE]: 'DRONE',
            [this.powerUpTypes.PERMANENT_BULLET]: 'PERM FAST',
            [this.powerUpTypes.PERMANENT_SIZE]: 'PERM SMALL',
            [this.powerUpTypes.PERMANENT_DRONE]: 'PERM DRONE'
        };

        this.powerUps.push({
            x: Math.min(Math.max(x, 20), this.canvas.width - 40),
            y: Math.min(Math.max(y, 20), this.canvas.height - 100),
            type,
            width: 20,
            height: 20,
            speed: 1,
            health: 3,
            requiresShot: true,
            color: type === this.powerUpTypes.DOUBLE_SHOT ? '#0ff' :
                   type === this.powerUpTypes.SPEED_UP ? '#0f0' :
                   type === this.powerUpTypes.SHIELD ? '#ff0' :
                   type === this.powerUpTypes.EXTRA_LIFE ? '#f00' :
                   type === this.powerUpTypes.PERMANENT_SPEED ? '#f0f' :
                   type === this.powerUpTypes.PERMANENT_SHOT ? '#00f' :
                   type === this.powerUpTypes.BULLET_SPEED ? '#fa0' :
                   type === this.powerUpTypes.SMALL_SHIP ? '#0fa' :
                   type === this.powerUpTypes.DRONE ? '#a0f' :
                   type === this.powerUpTypes.PERMANENT_BULLET ? '#f80' :
                   type === this.powerUpTypes.PERMANENT_SIZE ? '#8ff' :
                   '#f0a',
            symbol: powerUpSymbols[type],
            label: powerUpLabels[type]
        });
    }

    handlePowerUp(type) {
        if (this.sounds.powerupCollect && !this.isMuted) {
            this.sounds.powerupCollect.play().catch(() => {});
        }
        this.createPowerUpEffect(type);

        switch(type) {
            case this.powerUpTypes.DOUBLE_SHOT:
                if (!this.playerPowerUps.permanentShot) {
                    this.playerPowerUps.doubleShot = true;
                    setTimeout(() => {
                        if (!this.playerPowerUps.permanentShot) {
                            this.playerPowerUps.doubleShot = false;
                            if (this.sounds.powerupExpire && !this.isMuted) {
                                this.sounds.powerupExpire.play().catch(() => {});
                            }
                        }
                    }, 10000);
                }
                break;
            case this.powerUpTypes.SPEED_UP:
                if (!this.playerPowerUps.permanentSpeed) {
                    this.player.speed *= 1.5;
                    setTimeout(() => {
                        if (!this.playerPowerUps.permanentSpeed) {
                            this.player.speed /= 1.5;
                            if (this.sounds.powerupExpire && !this.isMuted) {
                                this.sounds.powerupExpire.play().catch(() => {});
                            }
                        }
                    }, 8000);
                }
                break;
            case this.powerUpTypes.SHIELD:
                this.playerPowerUps.shield = true;
                setTimeout(() => {
                    this.playerPowerUps.shield = false;
                    if (this.sounds.powerupExpire && !this.isMuted) {
                        this.sounds.powerupExpire.play().catch(() => {});
                    }
                }, 5000);
                break;
            case this.powerUpTypes.EXTRA_LIFE:
                this.lives++;
                document.getElementById('livesValue').textContent = this.lives;
                break;
            case this.powerUpTypes.PERMANENT_SPEED:
                this.playerPowerUps.permanentSpeedStacks++;
                this.player.speed *= 1.1; // Reduced from 1.2 to 1.1
                break;
            case this.powerUpTypes.PERMANENT_SHOT:
                this.playerPowerUps.permanentShotStacks++;
                this.playerPowerUps.doubleShot = true;
                break;
            case this.powerUpTypes.BULLET_SPEED:
                if (!this.playerPowerUps.permanentBullet) {
                    this.playerPowerUps.bulletSpeed = true;
                    setTimeout(() => {
                        if (!this.playerPowerUps.permanentBullet) {
                            this.playerPowerUps.bulletSpeed = false;
                            if (this.sounds.powerupExpire && !this.isMuted) {
                                this.sounds.powerupExpire.play().catch(() => {});
                            }
                        }
                    }, 10000);
                }
                break;
            case this.powerUpTypes.SMALL_SHIP:
                if (!this.playerPowerUps.permanentSize) {
                    this.playerPowerUps.smallShip = true;
                    this.player.width *= 0.7;
                    this.player.height *= 0.7;
                    setTimeout(() => {
                        if (!this.playerPowerUps.permanentSize) {
                            this.playerPowerUps.smallShip = false;
                            this.player.width /= 0.7;
                            this.player.height /= 0.7;
                            if (this.sounds.powerupExpire && !this.isMuted) {
                                this.sounds.powerupExpire.play().catch(() => {});
                            }
                        }
                    }, 12000);
                }
                break;
            case this.powerUpTypes.DRONE:
                if (!this.playerPowerUps.permanentDrone) {
                    this.playerPowerUps.drone = true;
                    setTimeout(() => {
                        if (!this.playerPowerUps.permanentDrone) {
                            this.playerPowerUps.drone = false;
                            if (this.sounds.powerupExpire && !this.isMuted) {
                                this.sounds.powerupExpire.play().catch(() => {});
                            }
                        }
                    }, 15000);
                }
                break;
            case this.powerUpTypes.PERMANENT_BULLET:
                this.playerPowerUps.permanentBulletStacks++;
                this.playerPowerUps.bulletSpeed = true;
                break;
            case this.powerUpTypes.PERMANENT_SIZE:
                this.playerPowerUps.permanentSizeStacks++;
                this.player.width *= 0.95; // Less reduction per stack (from 0.9)
                this.player.height *= 0.95;
                break;
            case this.powerUpTypes.PERMANENT_DRONE:
                this.playerPowerUps.permanentDroneStacks = Math.min(3, this.playerPowerUps.permanentDroneStacks + 1); // Cap at 3 drones
                this.playerPowerUps.drone = true;
                break;
        }

        // Update power-up effect message to show stacks
        if (type >= this.powerUpTypes.PERMANENT_SPEED) {
            const stacks = this.getStackCount(type);
            this.createStackEffect(type, stacks);
        }
    }

    createPowerUpEffect(type) {
        const colors = ['#0ff', '#0f0', '#ff0'];  // Removed red color
        const messages = ['DOUBLE!', 'SPEED!', 'SHIELD!'];  // Removed 'RAPID!'
        
        this.powerUpEffects.push({
            message: messages[type],
            color: colors[type],
            alpha: 1,
            scale: 0,
            y: this.player.y
        });
    }

    playerHit() {
        if (this.playerPowerUps.shield) return;
        
        // Create explosion at player position
        this.createExplosion(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height/2,
            this.enemyTypes.ESCORT
        );
        
        this.lives--;
        document.getElementById('livesValue').textContent = this.lives;
        if (this.sounds.playerHit && !this.isMuted) {
            this.sounds.playerHit.play().catch(() => {});
        }
        
        // Add invulnerability frames
        this.player.invulnerable = true;
        setTimeout(() => {
            this.player.invulnerable = false;
        }, 2000); // 2 seconds of invulnerability
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    async gameOver() {
        this.gameState = 'gameover';
        if (this.sounds.gameOver && !this.isMuted) {
            this.sounds.gameOver.play().catch(() => {});
        }

        // Show game over screen
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.querySelector('.final-score').textContent = this.score;

        // Check and display high score for current mode
        const modeKey = this.gameMode || 'normal';
        const isNewHighScore = this.saveHighScore(modeKey, this.score);
        document.querySelector('.high-score').textContent = 
            `HIGH SCORE: ${this.highScores[modeKey] || 0}` +
            (isNewHighScore ? ' NEW!' : '');

        // Fade to game over music
        this.fadeMusic(this.currentTrack, this.music.gameover);
    }

    initControls() {
        // Audio/Mute button
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                this.toggleMute();
            });
        }
        
        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Update mute button state
        this.updateMuteButton();
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        // Mute/unmute all sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.muted = this.isMuted;
            }
        });
        
        // Mute/unmute music
        Object.values(this.music).forEach(track => {
            if (track) {
                track.muted = this.isMuted;
            }
        });
        
        this.updateMuteButton();
    }
    
    updateMuteButton() {
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            if (this.isMuted) {
                muteBtn.classList.add('muted');
                muteBtn.querySelector('.control-icon').textContent = '🔇';
            } else {
                muteBtn.classList.remove('muted');
                muteBtn.querySelector('.control-icon').textContent = '🔊';
            }
        }
    }
    
    toggleFullscreen() {
        const container = document.querySelector('.game-container');
        
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    loadAssets() {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingProgress = document.getElementById('loadingProgress');
        
        if (!loadingScreen || !loadingProgress) return;
        
        let loaded = 0;
        const total = Object.keys(this.sounds).length;
        
        // Load audio files
        Object.values(this.sounds).forEach((sound, index) => {
            if (sound) {
                sound.addEventListener('canplaythrough', () => {
                    loaded++;
                    const progress = (loaded / total) * 100;
                    if (loadingProgress) {
                        loadingProgress.style.width = progress + '%';
                    }
                    
                    if (loaded >= total) {
                        // All assets loaded, hide loading screen
                        setTimeout(() => {
                            loadingScreen.classList.add('hidden');
                            document.getElementById('startScreen').classList.remove('hidden');
                        }, 500);
                    }
                });
                
                sound.addEventListener('error', () => {
                    loaded++;
                    const progress = (loaded / total) * 100;
                    if (loadingProgress) {
                        loadingProgress.style.width = progress + '%';
                    }
                    
                    if (loaded >= total) {
                        setTimeout(() => {
                            loadingScreen.classList.add('hidden');
                            document.getElementById('startScreen').classList.remove('hidden');
                        }, 500);
                    }
                });
                
                // Trigger load
                sound.load();
            } else {
                loaded++;
            }
        });
        
        // Fallback: if all audio fails, still show start screen after 2 seconds
        setTimeout(() => {
            if (loaded < total) {
                loadingScreen.classList.add('hidden');
                document.getElementById('startScreen').classList.remove('hidden');
            }
        }, 2000);
    }
    
    initMobileControls() {
        // Only show on mobile devices
        if (window.innerWidth <= 768) {
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.classList.remove('hidden');
            }
            
            // Update controls notice
            const notice = document.getElementById('controlsNotice');
            if (notice) {
                notice.textContent = '📱 TOUCH CONTROLS';
            }
        }
        
        // Mobile left button
        const leftBtn = document.getElementById('mobileLeft');
        if (leftBtn) {
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys['ArrowLeft'] = true;
            });
            leftBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['ArrowLeft'] = false;
            });
        }
        
        // Mobile right button
        const rightBtn = document.getElementById('mobileRight');
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys['ArrowRight'] = true;
            });
            rightBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['ArrowRight'] = false;
            });
        }
        
        // Mobile shoot button
        const shootBtn = document.getElementById('mobileShoot');
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.keys[' '] = true;
                    // Also trigger immediate shot
                    if (this.playerPowerUps.doubleShot) {
                        this.bullets.push(this.createPlayerBullet(
                            this.player.x + this.player.width / 4,
                            this.player.y
                        ));
                        this.bullets.push(this.createPlayerBullet(
                            this.player.x + (this.player.width * 3) / 4,
                            this.player.y
                        ));
                    } else {
                        this.bullets.push(this.createPlayerBullet(
                            this.player.x + this.player.width / 2,
                            this.player.y
                        ));
                    }
                    if (this.sounds.shoot && !this.isMuted) {
                        this.sounds.shoot.play().catch(() => {});
                    }
                }
            });
            shootBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[' '] = false;
            });
        }
    }
    
    initGameModeSelection() {
        const startScreen = document.getElementById('startScreen');
        const gameModes = startScreen.querySelectorAll('.game-mode');
        
        gameModes.forEach(modeElement => {
            modeElement.addEventListener('click', () => {
                const mode = modeElement.getAttribute('data-mode');
                this.selectGameMode(mode);
            });
            
            // Add keyboard navigation
            modeElement.addEventListener('mouseenter', () => {
                modeElement.focus();
            });
        });
        
        // Allow space/enter to start after mode selection
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'title' && this.gameMode && (e.key === 'Enter' || e.key === ' ')) {
                this.startGame();
            }
        });
    }
    
    selectGameMode(mode) {
        if (!this.gameModes[mode]) return;
        
        // Remove previous selection
        document.querySelectorAll('.game-mode').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Select new mode
        const modeElement = document.querySelector(`[data-mode="${mode}"]`);
        if (modeElement) {
            modeElement.classList.add('selected');
            this.gameMode = mode;
            
            // Update prompt
            const prompt = document.querySelector('.mode-prompt');
            if (prompt) {
                prompt.textContent = `PRESS SPACE OR ENTER TO START`;
            }
            
            // Play selection sound
            if (this.sounds && this.sounds.shoot) {
                this.sounds.shoot.play().catch(() => {});
            }
        }
    }
    
    startGame() {
        if (!this.gameMode || this.gameState !== 'title') return;
        
        const mode = this.gameModes[this.gameMode];
        
        // Apply mode settings
        this.lives = mode.lives;
        this.wave = 1;
        this.score = 0;
        
        // Update lives display
        document.getElementById('livesValue').textContent = this.lives;
        document.getElementById('scoreValue').textContent = this.score;
        
        // Hide start screen
        document.getElementById('startScreen').classList.add('hidden');
        this.gameState = 'playing';
        
        // Start game music (respect mute state)
        this.music.normal.volume = 0.2;
        this.music.normal.muted = this.isMuted;
        this.music.normal.play().catch(() => {});
        this.currentTrack = this.music.normal;
        
        // Create initial formations
        this.formations = this.createFormations();
        
        // Reset attack config
        this.enemyAttackConfig.currentAttacks = 0;
        this.enemyAttackConfig.currentShots = 0;
    }

    restart() {
        this.fadeMusic(this.currentTrack, this.music.normal);
        this.gameState = 'title';
        this.gameMode = null; // Reset mode selection
        
        // Show/hide screens
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        
        // Reset mode selection UI
        document.querySelectorAll('.game-mode').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Reset prompt
        const prompt = document.querySelector('.mode-prompt');
        if (prompt) {
            prompt.textContent = 'SELECT A MODE TO BEGIN';
        }
        
        // Update high score on start screen (show overall highest)
        const allHighScores = Object.values(this.highScores);
        const overallHigh = allHighScores.length > 0 ? Math.max(...allHighScores) : 0;
        document.querySelector('.start-high-score span').textContent = overallHigh;
        
        // Reset game state
        this.lives = 3;
        this.score = 0;
        this.wave = 1;
        this.formations = [];  // Don't create formations until game starts
        this.powerUps = [];
        this.bullets = [];
        this.deathAnimations = [];
        this.playerPowerUps = {
            doubleShot: false,
            speedUp: false,
            shield: false,
            bulletSpeed: false,
            smallShip: false,
            drone: false,
            // Track stacks for permanent upgrades
            permanentSpeedStacks: 0,
            permanentShotStacks: 0,
            permanentBulletStacks: 0,
            permanentSizeStacks: 0,
            permanentDroneStacks: 0
        };
        
        // Reset UI
        document.getElementById('scoreValue').textContent = '0';
        document.getElementById('livesValue').textContent = '3';
        this.enemyBullets = [];
    }

    handleEnemyDestruction(enemy, bulletIndex) {
        this.bullets.splice(bulletIndex, 1);
        
        if (enemy.isMegaBoss) {
            // Boss takes damage
            this.bossConfig.currentHealth--;
            if (this.bossConfig.currentHealth <= 0) {
                // Create death animation
                this.createDeathAnimation(
                    enemy.currentX + enemy.width/2, 
                    enemy.currentY + enemy.height/2,
                    enemy.type
                );
                
                // Award score
                const bossScore = 1000 * Math.floor(this.wave / 3);
                this.score += bossScore;
                document.getElementById('scoreValue').textContent = this.score;
                
                // Create power-up
                this.createPowerUp(
                    enemy.currentX + enemy.width/2,
                    enemy.currentY + enemy.height/2
                );
                
                // Clear all enemies
                this.formations = this.formations.map(e => {
                    e.currentX = -100;
                    return e;
                });
                
                if (this.sounds.explosion && !this.isMuted) {
                    this.sounds.explosion.play().catch(() => {});
                }
            } else {
                // Hit effect for boss not destroyed
                if (this.sounds.powerupHit && !this.isMuted) {
                    this.sounds.powerupHit.play().catch(() => {});
                }
            }
            return;
        }
        
        // Regular enemy damage
        enemy.health--;
        if (enemy.health <= 0) {
            // Create explosion effect
            this.createExplosion(
                enemy.currentX + enemy.width/2,
                enemy.currentY + enemy.height/2,
                enemy.type
            );
            
            // Create death animation
            this.createDeathAnimation(
                enemy.currentX + enemy.width/2, 
                enemy.currentY + enemy.height/2,
                enemy.type
            );
            
            // Remove enemy
            enemy.currentX = -100;
            enemy.currentY = -100;
            enemy.inPosition = false;
            enemy.attacking = false;
            
            // Award score
            const baseScore = enemy.type === this.enemyTypes.BOSS ? 300 :
                             enemy.type === this.enemyTypes.ESCORT ? 200 : 100;
            const scoreMultiplier = 1 + (this.wave * 0.1);
            this.score += Math.floor(baseScore * this.difficulties['normal'].scoreMultiplier * scoreMultiplier);
            document.getElementById('scoreValue').textContent = this.score;
            
            if (this.sounds.explosion && !this.isMuted) {
                this.sounds.explosion.play().catch(() => {});
            }
            this.waveStats.enemiesDefeated++;
        } else {
            // Hit effect for enemy not destroyed
            if (this.sounds.powerupHit && !this.isMuted) {
                this.sounds.powerupHit.play().catch(() => {});
            }
        }
    }

    // Add debug drawing method
    drawHitbox(x, y, width, height, color = '#0f0', label = '') {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        
        // Draw actual collision box
        this.ctx.strokeRect(
            x - width/2,
            y - height/2,
            width,
            height
        );

        // Draw center point
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.stroke();

        if (label) {
            this.ctx.fillStyle = color;
            this.ctx.font = '8px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, x, y - height/2 - 5);
        }
    }

    updateEnemyAttackPattern(enemy) {
        const time = Date.now() - enemy.attackStartTime;
        const maxSpeed = enemy.maxSpeed || 2;
        
        // Smooth acceleration to max speed (frame-rate independent)
        if (enemy.currentSpeed < maxSpeed) {
            enemy.currentSpeed = Math.min(maxSpeed, enemy.currentSpeed + enemy.acceleration * this.deltaTime);
        }
        const speed = enemy.currentSpeed;
        
        // Update pattern progress more slowly for smoother movement (frame-rate independent)
        enemy.patternProgress += 0.01 * this.deltaTime;
        
        // Handle different attack patterns
        switch (enemy.pattern) {
            case 'DIVE':
                this.handleDivePattern(enemy, speed);
                break;
            case 'SWEEP':
                this.handleSweepPattern(enemy, speed, time);
                break;
            case 'ZIGZAG':
                this.handleZigzagPattern(enemy, speed, time);
                break;
            case 'SPIRAL':
                this.handleSpiralPattern(enemy, speed, time);
                break;
            case 'SPIRAL_DIVE':
                this.handleSpiralDivePattern(enemy, speed, time);
                break;
            case 'STRAFE':
                this.handleStrafePattern(enemy, speed, time);
                break;
            case 'STRAFE_RUN':
                this.handleStrafeRunPattern(enemy, speed, time);
                break;
            case 'SWEEP_BOMBARD':
                this.handleSweepBombardPattern(enemy, speed, time);
                break;
            case 'CIRCLE_STRAFE':
                this.handleCircleStrafePattern(enemy, speed, time);
                break;
            // Formation attack patterns
            case 'WAVE':
                this.handleWavePattern(enemy, speed, time);
                break;
            case 'PINCER':
                this.handlePincerPattern(enemy, speed, time);
                break;
            case 'BOMBARDMENT':
                this.handleBombardmentPattern(enemy, speed, time);
                break;
            case 'COORDINATED_DIVE':
                this.handleCoordinatedDivePattern(enemy, speed, time);
                break;
            default:
                // Fallback to simple dive
                this.handleDivePattern(enemy, speed);
        }
        
        // Check if attack is complete
        if (enemy.currentY > this.canvas.height + 50 || 
            enemy.currentX < -50 || 
            enemy.currentX > this.canvas.width + 50) {
            enemy.attacking = false;
            enemy.currentX = -100; // Move off screen
        }
    }
    
    handleDivePattern(enemy, speed) {
        // Momentum-based dive towards target with natural curves
        const dx = enemy.targetX - enemy.currentX;
        const dy = enemy.targetY - enemy.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // Only apply force if not too close
            // Calculate desired velocity towards target
            const desiredVelX = (dx / distance) * speed;
            const desiredVelY = (dy / distance) * speed;
            
            // Add slight curve for natural movement
            const curveFactor = Math.sin(enemy.patternProgress * 2) * 0.2;
            const finalDesiredVelX = desiredVelX + curveFactor;
            
            // Apply force towards desired velocity
            const forceX = (finalDesiredVelX - enemy.velocityX) * 0.1;
            const forceY = (desiredVelY - enemy.velocityY) * 0.1;
            
            // Update velocity with force (frame-rate independent)
            enemy.velocityX += forceX * this.deltaTime;
            enemy.velocityY += forceY * this.deltaTime;
            
            // Apply friction (frame-rate independent)
            const friction = Math.pow(enemy.friction, this.deltaTime);
            enemy.velocityX *= friction;
            enemy.velocityY *= friction;
            
            // Limit maximum velocity
            const currentSpeed = Math.sqrt(enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY);
            if (currentSpeed > enemy.maxVelocity) {
                enemy.velocityX = (enemy.velocityX / currentSpeed) * enemy.maxVelocity;
                enemy.velocityY = (enemy.velocityY / currentSpeed) * enemy.maxVelocity;
            }
            
            // Update position (frame-rate independent)
            enemy.currentX += enemy.velocityX * this.deltaTime;
            enemy.currentY += enemy.velocityY * this.deltaTime;
        }
    }
    
    handleSweepPattern(enemy, speed, time) {
        // Smooth horizontal sweep with gradual downward movement
        const sweepSpeed = speed * 0.6; // Reduced for smoother movement
        const downwardSpeed = speed * 0.2; // Slower downward movement
        
        // Determine sweep direction based on starting position
        const sweepDirection = enemy.patternStartX < this.canvas.width / 2 ? 1 : -1;
        
        enemy.currentX += sweepDirection * sweepSpeed * this.deltaTime;
        enemy.currentY += downwardSpeed * this.deltaTime;
        
        // Add gentle wave motion
        enemy.currentY += Math.sin(time * 0.005) * 1.5 * this.deltaTime; // Slower, smaller wave
    }
    
    handleZigzagPattern(enemy, speed, time) {
        // Smooth zigzag movement with gradual amplitude changes
        const baseSpeed = speed * 0.5; // Much slower forward movement
        const zigzagAmplitude = (enemy.amplitude || 40) * 0.7; // Reduced amplitude
        const zigzagFrequency = (enemy.frequency || 0.01) * 0.5; // Much slower frequency
        
        // Move forward slowly (frame-rate independent)
        enemy.currentY += baseSpeed * this.deltaTime;
        
        // Add smooth zigzag motion with easing
        const zigzagOffset = Math.sin(time * zigzagFrequency) * zigzagAmplitude;
        const targetX = enemy.patternStartX + zigzagOffset;
        
        // Smooth interpolation to target position (frame-rate independent)
        const lerpFactor = 0.1 * this.deltaTime;
        enemy.currentX += (targetX - enemy.currentX) * lerpFactor;
    }
    
    handleSpiralPattern(enemy, speed, time) {
        // Smooth spiral movement with gradual shrinking
        const spiralRadius = (enemy.spiralRadius || 50) * 0.8; // Reduced radius
        const spiralSpeed = (enemy.spiralSpeed || 0.03) * 0.5; // Much slower spiral
        const centerX = enemy.patternStartX;
        const centerY = enemy.patternStartY;
        
        const angle = time * spiralSpeed;
        const radius = spiralRadius * (1 - enemy.patternProgress * 0.3); // Slower shrinking
        
        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius + (time * 0.05); // Slower downward drift
        
        // Smooth interpolation (frame-rate independent)
        const lerpFactor = 0.08 * this.deltaTime;
        enemy.currentX += (targetX - enemy.currentX) * lerpFactor;
        enemy.currentY += (targetY - enemy.currentY) * lerpFactor;
    }
    
    handleSpiralDivePattern(enemy, speed, time) {
        // Smooth spiral dive with gradual approach
        const spiralRadius = (enemy.spiralRadius || 60) * 0.7; // Reduced radius
        const spiralSpeed = (enemy.spiralSpeed || 0.05) * 0.4; // Much slower spiral
        const centerX = enemy.patternStartX;
        const centerY = enemy.patternStartY;
        
        const angle = time * spiralSpeed;
        const radius = spiralRadius * (1 - enemy.patternProgress * 0.2); // Slower shrinking
        
        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius + (time * 0.08); // Slower downward movement
        
        // Smooth interpolation (frame-rate independent)
        const lerpFactor = 0.06 * this.deltaTime;
        enemy.currentX += (targetX - enemy.currentX) * lerpFactor;
        enemy.currentY += (targetY - enemy.currentY) * lerpFactor;
        
        // Gentle tracking towards player (frame-rate independent)
        if (enemy.tracking) {
            const trackStrength = 0.02; // Much weaker tracking
            const dx = this.player.x - enemy.currentX;
            enemy.currentX += dx * trackStrength * this.deltaTime;
        }
    }
    
    handleStrafePattern(enemy, speed, time) {
        // Smooth side-to-side strafing with gradual forward movement
        const forwardSpeed = speed * 0.3; // Much slower forward movement
        const strafeAmplitude = (enemy.amplitude || 40) * 0.6; // Reduced amplitude
        
        // Move forward slowly (frame-rate independent)
        enemy.currentY += forwardSpeed * this.deltaTime;
        
        // Smooth strafing motion
        const strafeOffset = Math.sin(time * 0.008) * strafeAmplitude; // Much slower strafing
        const targetX = enemy.patternStartX + strafeOffset;
        
        // Smooth interpolation (frame-rate independent)
        const lerpFactor = 0.12 * this.deltaTime;
        enemy.currentX += (targetX - enemy.currentX) * lerpFactor;
    }
    
    handleStrafeRunPattern(enemy, speed, time) {
        // Smooth strafe run with controlled direction changes
        const runSpeed = speed * 0.8; // Reduced from 1.2 to 0.8
        const strafeAmplitude = (enemy.amplitude || 50) * 0.7; // Reduced amplitude
        
        // Move forward at moderate speed (frame-rate independent)
        enemy.currentY += runSpeed * 0.6 * this.deltaTime;
        
        // Smooth strafing with controlled frequency
        const strafeOffset = Math.sin(time * 0.015) * strafeAmplitude; // Slower than before
        const targetX = enemy.patternStartX + strafeOffset;
        
        // Smooth interpolation with slight randomness (frame-rate independent)
        const lerpFactor = 0.15 * this.deltaTime;
        enemy.currentX += (targetX - enemy.currentX) * lerpFactor;
        
        // Add subtle randomness for unpredictability
        enemy.currentX += (Math.random() - 0.5) * 0.8 * this.deltaTime; // Much smaller randomness
    }
    
    handleSweepBombardPattern(enemy, speed, time) {
        // Smooth sweep with deliberate bombardment pauses
        const sweepSpeed = speed * 0.4; // Slower sweep
        const bombardSpeed = speed * 0.5; // Slower bombardment
        
        // Smooth sweep motion (frame-rate independent)
        const sweepDirection = enemy.patternStartX < this.canvas.width / 2 ? 1 : -1;
        enemy.currentX += sweepDirection * sweepSpeed * this.deltaTime;
        
        // Deliberate bombardment-style downward movement with longer pauses
        if (Math.sin(time * 0.015) > 0.2) { // Longer pauses, less frequent movement
            enemy.currentY += bombardSpeed * this.deltaTime;
        }
    }
    
    handleCircleStrafePattern(enemy, speed, time) {
        // Smooth circling around player
        const circleRadius = enemy.circleRadius || 80; // Reduced radius
        const circleSpeed = (enemy.circleSpeed || 0.02) * 0.6; // Much slower circling
        const centerX = enemy.circleCenterX || this.player.x;
        const centerY = enemy.circleCenterY || this.player.y;
        
        const angle = time * circleSpeed;
        
        const targetX = centerX + Math.cos(angle) * circleRadius;
        const targetY = centerY + Math.sin(angle) * circleRadius;
        
        // Smooth interpolation to circle position (frame-rate independent)
        const lerpFactor = 0.08 * this.deltaTime;
        enemy.currentX += (targetX - enemy.currentX) * lerpFactor;
        enemy.currentY += (targetY - enemy.currentY) * lerpFactor;
        
        // Gradually and smoothly move closer to player (frame-rate independent)
        const approachSpeed = 0.2; // Much slower approach
        enemy.circleRadius = Math.max(40, enemy.circleRadius - approachSpeed * this.deltaTime);
    }
    
    handleWavePattern(enemy, speed, time) {
        // Wave attack with delay
        if (enemy.attackDelay && time < enemy.attackDelay) {
            return; // Wait for delay
        }
        
        // Move towards target with wave motion
        const dx = enemy.targetX - enemy.currentX;
        const dy = enemy.targetY - enemy.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > speed) {
            enemy.currentX += (dx / distance) * speed * this.deltaTime;
            enemy.currentY += (dy / distance) * speed * this.deltaTime;
            
            // Add wave motion (frame-rate independent)
            enemy.currentY += Math.sin(time * 0.02) * 3 * this.deltaTime;
        }
    }
    
    handlePincerPattern(enemy, speed, time) {
        // Pincer movement - approach from sides
        const dx = enemy.targetX - enemy.currentX;
        const dy = enemy.targetY - enemy.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > speed) {
            enemy.currentX += (dx / distance) * speed * this.deltaTime;
            enemy.currentY += (dy / distance) * speed * this.deltaTime;
        }
    }
    
    handleBombardmentPattern(enemy, speed, time) {
        // Bombardment run - move to position and stay there
        const dx = enemy.targetX - enemy.currentX;
        const dy = enemy.targetY - enemy.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > speed) {
            enemy.currentX += (dx / distance) * speed * this.deltaTime;
            enemy.currentY += (dy / distance) * speed * this.deltaTime;
        } else {
            // In position, add slight hovering motion (frame-rate independent)
            enemy.currentX += Math.sin(time * 0.01) * 1 * this.deltaTime;
            enemy.currentY += Math.cos(time * 0.015) * 0.5 * this.deltaTime;
        }
    }
    
    handleCoordinatedDivePattern(enemy, speed, time) {
        // Coordinated dive with slight delay variations
        const delay = enemy.attackDelay || 0;
        if (time < delay) {
            return;
        }
        
        const dx = enemy.targetX - enemy.currentX;
        const dy = enemy.targetY - enemy.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > speed) {
            enemy.currentX += (dx / distance) * speed * this.deltaTime;
            enemy.currentY += (dy / distance) * speed * this.deltaTime;
        }
    }

    startFormationAttack(availableEnemies) {
        // Select 2-4 enemies for formation attack
        const formationSize = Math.min(2 + Math.floor(Math.random() * 3), availableEnemies.length);
        const selectedEnemies = [];
        
        // Select enemies that are close to each other
        const centerEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
        selectedEnemies.push(centerEnemy);
        
        // Find nearby enemies
        const nearbyEnemies = availableEnemies.filter(enemy => 
            enemy !== centerEnemy && 
            Math.abs(enemy.currentX - centerEnemy.currentX) < 100 &&
            Math.abs(enemy.currentY - centerEnemy.currentY) < 50
        );
        
        // Add nearby enemies to formation
        for (let i = 0; i < formationSize - 1 && i < nearbyEnemies.length; i++) {
            selectedEnemies.push(nearbyEnemies[i]);
        }
        
        // If we don't have enough nearby enemies, add random ones
        while (selectedEnemies.length < formationSize && selectedEnemies.length < availableEnemies.length) {
            const remainingEnemies = availableEnemies.filter(e => !selectedEnemies.includes(e));
            if (remainingEnemies.length > 0) {
                selectedEnemies.push(remainingEnemies[Math.floor(Math.random() * remainingEnemies.length)]);
            } else {
                break;
            }
        }
        
        // Choose formation attack pattern
        const formationPatterns = ['WAVE_ATTACK', 'PINCER_MOVEMENT', 'BOMBARDMENT_RUN', 'COORDINATED_DIVE'];
        const pattern = formationPatterns[Math.floor(Math.random() * formationPatterns.length)];
        
        // Execute formation attack
        this.executeFormationAttack(selectedEnemies, pattern);
    }
    
    executeFormationAttack(enemies, pattern) {
        const centerX = enemies.reduce((sum, e) => sum + e.currentX, 0) / enemies.length;
        const centerY = enemies.reduce((sum, e) => sum + e.currentY, 0) / enemies.length;
        
        switch (pattern) {
            case 'WAVE_ATTACK':
                this.executeWaveAttack(enemies, centerX, centerY);
                break;
            case 'PINCER_MOVEMENT':
                this.executePincerMovement(enemies, centerX, centerY);
                break;
            case 'BOMBARDMENT_RUN':
                this.executeBombardmentRun(enemies, centerX, centerY);
                break;
            case 'COORDINATED_DIVE':
                this.executeCoordinatedDive(enemies, centerX, centerY);
                break;
        }
    }
    
    executeWaveAttack(enemies, centerX, centerY) {
        // Enemies attack in a wave formation
        enemies.forEach((enemy, index) => {
            enemy.attacking = true;
            enemy.pattern = 'WAVE';
            enemy.patternProgress = 0;
            enemy.patternStartX = enemy.currentX;
            enemy.patternStartY = enemy.currentY;
            enemy.attackStartTime = Date.now();
            
            // Stagger the attacks slightly
            enemy.attackDelay = index * 200; // 200ms delay between each enemy
            
            // Target spread across player area
            const spread = 150;
            enemy.targetX = this.player.x + (index - enemies.length/2) * (spread / enemies.length);
            enemy.targetY = this.canvas.height + 50;
            
            enemy.speed = 1.5 + Math.random() * 0.5; // Much slower wave attacks
            enemy.maxSpeed = enemy.speed;
            enemy.currentSpeed = 0;
            enemy.acceleration = 0.03;
            enemy.canShoot = true;
        });
    }
    
    executePincerMovement(enemies, centerX, centerY) {
        // Enemies attack from both sides
        const leftEnemies = enemies.filter((_, index) => index % 2 === 0);
        const rightEnemies = enemies.filter((_, index) => index % 2 === 1);
        
        [...leftEnemies, ...rightEnemies].forEach((enemy, index) => {
            enemy.attacking = true;
            enemy.pattern = 'PINCER';
            enemy.patternProgress = 0;
            enemy.patternStartX = enemy.currentX;
            enemy.patternStartY = enemy.currentY;
            enemy.attackStartTime = Date.now();
            
            // Alternate sides
            const isLeft = index < leftEnemies.length;
            enemy.targetX = isLeft ? this.player.x - 100 : this.player.x + 100;
            enemy.targetY = this.player.y;
            
            enemy.speed = 1.8; // Slower pincer movement
            enemy.maxSpeed = enemy.speed;
            enemy.currentSpeed = 0;
            enemy.acceleration = 0.04;
            enemy.canShoot = true;
        });
    }
    
    executeBombardmentRun(enemies, centerX, centerY) {
        // Enemies perform a coordinated bombardment
        enemies.forEach((enemy, index) => {
            enemy.attacking = true;
            enemy.pattern = 'BOMBARDMENT';
            enemy.patternProgress = 0;
            enemy.patternStartX = enemy.currentX;
            enemy.patternStartY = enemy.currentY;
            enemy.attackStartTime = Date.now();
            
            // Spread across the top of the screen
            const spread = this.canvas.width * 0.8;
            enemy.targetX = (index / (enemies.length - 1)) * spread + (this.canvas.width * 0.1);
            enemy.targetY = this.canvas.height * 0.3; // Stop at 30% down
            
            enemy.speed = 1.2; // Slower bombardment positioning
            enemy.maxSpeed = enemy.speed;
            enemy.currentSpeed = 0;
            enemy.acceleration = 0.02;
            enemy.canShoot = true;
            enemy.bombardmentMode = true;
        });
    }
    
    executeCoordinatedDive(enemies, centerX, centerY) {
        // Enemies dive in a coordinated pattern
        enemies.forEach((enemy, index) => {
            enemy.attacking = true;
            enemy.pattern = 'COORDINATED_DIVE';
            enemy.patternProgress = 0;
            enemy.patternStartX = enemy.currentX;
            enemy.patternStartY = enemy.currentY;
            enemy.attackStartTime = Date.now();
            
            // Create a diamond formation dive
            const angle = (index / enemies.length) * Math.PI * 2;
            const radius = 80;
            enemy.targetX = this.player.x + Math.cos(angle) * radius;
            enemy.targetY = this.canvas.height + 50;
            
            enemy.speed = 1.6; // Slower coordinated dives
            enemy.maxSpeed = enemy.speed;
            enemy.currentSpeed = 0;
            enemy.acceleration = 0.035;
            enemy.canShoot = true;
        });
    }

    startAttack(enemy) {
        // Allow all enemy types to attack, not just escorts
        const currentAttackers = this.formations.filter(e => e.attacking).length;
        const maxAttackers = Math.min(6, Math.floor(2 + this.wave/2)); // Increased max attackers
        
        if (currentAttackers >= maxAttackers) return;
        
        // More deliberate attack chances based on enemy type
        let attackChance;
        if (enemy.type === this.enemyTypes.BOSS) {
            attackChance = 0.2 + (this.wave * 0.03); // Bosses attack much less frequently but more strategically
        } else if (enemy.type === this.enemyTypes.ESCORT) {
            attackChance = 0.4 + (this.wave * 0.05); // Reduced from 0.6 to 0.4
        } else {
            attackChance = 0.25 + (this.wave * 0.04); // Reduced from 0.4 to 0.25
        }
        
        // Apply game mode multiplier
        const mode = this.gameMode ? this.gameModes[this.gameMode] : null;
        if (mode) {
            attackChance *= mode.enemyAttackFrequency;
        }
        
        if (Math.random() > attackChance) return;
        
        if (enemy.inPosition) {
            enemy.attacking = true;
            
            // Enhanced attack pattern selection based on enemy type
            let patterns;
            if (enemy.type === this.enemyTypes.BOSS) {
                patterns = ['SPIRAL_DIVE', 'SWEEP_BOMBARD', 'STRAFE_RUN', 'CIRCLE_STRAFE'];
            } else if (enemy.type === this.enemyTypes.ESCORT) {
                patterns = ['DIVE', 'SWEEP', 'ZIGZAG', 'SPIRAL', 'STRAFE'];
            } else {
                patterns = ['DIVE', 'ZIGZAG', 'STRAFE']; // Simpler patterns for grunts
            }
            
            enemy.pattern = patterns[Math.floor(Math.random() * patterns.length)];
            enemy.patternProgress = 0;
            enemy.patternStartX = enemy.currentX;
            enemy.patternStartY = enemy.currentY;
            enemy.attackStartTime = Date.now();
            
            // Enhanced targeting with different strategies
            const spreadX = 120; // Increased spread
            enemy.targetX = this.player.x + (Math.random() - 0.5) * spreadX;
            enemy.targetY = this.canvas.height + 50;
            
            // Pattern-specific parameters with smoother, more realistic values
            enemy.amplitude = 40 + Math.random() * 60; // Reduced amplitude for smoother movement
            enemy.frequency = 0.008 + Math.random() * 0.015; // Slower frequency for smoother waves
            enemy.speed = 1.2 + Math.random() * 0.8; // Much slower, more realistic speed
            enemy.maxSpeed = enemy.speed; // Store max speed for acceleration
            enemy.currentSpeed = 0; // Start from 0 for smooth acceleration
            enemy.acceleration = 0.05; // Gradual acceleration
            
            // Add momentum and inertia for more natural movement
            enemy.velocityX = 0;
            enemy.velocityY = 0;
            enemy.friction = 0.95; // Friction to slow down movement
            enemy.maxVelocity = 2; // Maximum velocity
            enemy.tracking = Math.random() < 0.6; // Reduced tracking for more natural movement
            enemy.canShoot = true;
            enemy.shotsFired = 0;
            enemy.maxShots = 1 + Math.floor(Math.random() * 2); // Fewer shots for more deliberate attacks
            
            // Add pattern-specific behaviors
            if (enemy.pattern === 'SPIRAL_DIVE' || enemy.pattern === 'SPIRAL') {
                enemy.spiralRadius = 80 + Math.random() * 40;
                enemy.spiralSpeed = 0.05 + Math.random() * 0.03;
            }
            
            if (enemy.pattern === 'CIRCLE_STRAFE') {
                enemy.circleRadius = 100 + Math.random() * 50;
                enemy.circleSpeed = 0.03 + Math.random() * 0.02;
                enemy.circleCenterX = this.player.x;
                enemy.circleCenterY = this.player.y;
            }
            
            // Add attack indicator with enhanced visuals
            this.attackIndicators.push({
                startX: enemy.currentX + enemy.width / 2,
                startY: enemy.currentY + enemy.height / 2,
                endX: enemy.targetX + enemy.width / 2,
                endY: this.canvas.height - 50,
                alpha: 1,
                pattern: enemy.pattern,
                color: enemy.type === this.enemyTypes.BOSS ? '#ff0000' : 
                       enemy.type === this.enemyTypes.ESCORT ? '#00ffff' : '#ffff00'
            });
            
            this.targetIndicators.push({
                enemy: enemy,
                alpha: 0,
                scale: 2,
                rotation: 0
            });
        }
    }

    startNextWave() {
        this.wave++;
        
        // Start wave transition
        this.waveTransition = {
            active: true,
            timer: 0,
            duration: 180,
            text: `WAVE ${this.wave}`
        };

        // Create new formations for next wave
        this.formations = this.createFormations();

        // Check if it's a boss wave
        if (this.wave % 3 === 0) {
            this.bossAnnouncement = {
                active: true,
                timer: 0,
                duration: 180,
                scale: 0,
                alpha: 0
            };
            if (this.sounds.levelUp && !this.isMuted) {
                this.sounds.levelUp.play().catch(() => {});
            }
            
            // Fade to boss music
            this.fadeMusic(this.currentTrack, this.music.boss);
        } else {
            // Fade to normal music if coming from boss music
            if (this.currentTrack === this.music.boss) {
                this.fadeMusic(this.currentTrack, this.music.normal);
            }
        }

        // Reset attack and shot counters for new wave
        this.enemyAttackConfig.currentAttacks = 0;
        this.enemyAttackConfig.currentShots = 0;
    }

    createWaveCompletionParticles() {
        const particles = [];
        const numParticles = 100; // More particles
        
        // Different patterns for different waves
        switch(this.wave % 5) {
            case 0: // Spiral pattern
                for (let i = 0; i < numParticles; i++) {
                    const radius = (i / numParticles) * 100;
                    const angle = (i / numParticles) * Math.PI * 8;
                    particles.push({
                        x: this.canvas.width / 2 + Math.cos(angle) * radius,
                        y: this.canvas.height / 2 + Math.sin(angle) * radius,
                        angle: angle,
                        speed: 2 + Math.random() * 2,
                        color: `hsl(${(angle * 180 / Math.PI) % 360}, 100%, 50%)`,
                        size: 2 + Math.random() * 3,
                        life: 1
                    });
                }
                break;
                
            case 1: // Starburst pattern
                for (let i = 0; i < numParticles; i++) {
                    const angle = (i / numParticles) * Math.PI * 2;
                    particles.push({
                        x: this.canvas.width / 2,
                        y: this.canvas.height / 2,
                        angle: angle,
                        speed: 4 + Math.random() * 3,
                        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                        size: 2 + Math.random() * 3,
                        life: 1,
                        delay: i * 2 // Staggered launch
                    });
                }
                break;
                
            case 2: // Fountain pattern
                for (let i = 0; i < numParticles; i++) {
                    const angle = Math.PI + (Math.random() * Math.PI);
                    particles.push({
                        x: this.canvas.width / 2,
                        y: this.canvas.height / 2,
                        angle: angle,
                        speed: 3 + Math.random() * 4,
                        color: `hsl(${Math.random() * 60 + 30}, 100%, 50%)`,
                        size: 2 + Math.random() * 3,
                        life: 1,
                        gravity: 0.1
                    });
                }
                break;
                
            default: // Circular explosion
                for (let i = 0; i < numParticles; i++) {
                    const angle = (i / numParticles) * Math.PI * 2;
                    particles.push({
                        x: this.canvas.width / 2,
                        y: this.canvas.height / 2,
                        angle: angle,
                        speed: 2 + Math.random() * 3,
                        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                        size: 2 + Math.random() * 3,
                        life: 1,
                        pulse: Math.random() * Math.PI * 2 // Pulsing effect
                    });
                }
        }
        
        return particles;
    }

    drawWaveCompletion() {
        if (!this.waveCompletion.active) return;
        
        this.ctx.save();
        
        // Darken background with wave-specific color tint
        const tintColor = this.wave % 5 === 0 ? '0, 100, 255' : '255, 255, 0';
        this.ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles with special effects
        this.waveCompletion.particles.forEach(particle => {
            if (particle.life > 0) {
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = particle.life;
                
                // Apply different effects based on wave type
                if (particle.pulse) {
                    particle.size = 2 + Math.sin(Date.now() / 100 + particle.pulse) * 2;
                }
                if (particle.gravity) {
                    particle.angle += 0.02;
                    particle.y += particle.gravity;
                }
                if (particle.delay > 0) {
                    particle.delay--;
                    return;
                }
                
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw wave completion text with effects
        const progress = this.waveCompletion.timer / this.waveCompletion.duration;
        const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
        
        this.ctx.globalAlpha = 1;
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.scale(scale, scale);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WAVE COMPLETE!', 0, 0);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Draw enhanced statistics
        this.ctx.font = '12px "Press Start 2P"';
        const centerX = this.canvas.width / 2;
        const startY = this.canvas.height / 2 + 20;
        const spacing = 25;
        
        // Animate stats appearing
        if (progress > 0.3) this.drawStat('BONUS', this.waveCompletion.bonus, '#ff0', centerX, startY);
        if (progress > 0.4) this.drawStat('ACCURACY', `${Math.round(this.waveStats.accuracyHits / Math.max(1, this.waveStats.shotsFired) * 100)}%`, '#0f0', centerX, startY + spacing);
        if (progress > 0.5) this.drawStat('TIME', this.formatTime(this.waveStats.timeElapsed), '#0ff', centerX, startY + spacing * 2);
        if (progress > 0.6) this.drawStat('ENEMIES', this.waveStats.enemiesDefeated, '#f0f', centerX, startY + spacing * 3);
        
        this.ctx.restore();
    }

    drawStat(label, value, color, x, y) {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(label + ':', x, y);
        this.ctx.fillStyle = color;
        this.ctx.fillText(value.toString(), x, y + 15);
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    loadHighScore(difficulty) {
        return parseInt(localStorage.getItem(`galaga_highscore_${difficulty}`)) || 0;
    }

    saveHighScore(difficulty, score) {
        if (score > this.highScores[difficulty]) {
            this.highScores[difficulty] = score;
            localStorage.setItem(`galaga_highscore_${difficulty}`, score);
            return true;
        }
        return false;
    }

    createPlayerBullet(x, y, angle = 0) {
        const baseSpeed = 7;
        const speedBonus = this.playerPowerUps.bulletSpeed ? 2 : 0; // Reduced from 3
        const stackBonus = Math.min(3, this.playerPowerUps.permanentBulletStacks * 0.3); // Cap stack bonus
        const totalSpeed = baseSpeed + speedBonus + stackBonus;

        return {
            x: x,
            y: y,
            width: this.bulletEffects.player.width * 1.2,
            height: this.bulletEffects.player.height * 1.2,
            speed: totalSpeed,
            dx: Math.sin(angle) * totalSpeed,
            dy: -Math.cos(angle) * totalSpeed,
            trail: [],
            color: this.bulletEffects.player.color,
            visualWidth: this.bulletEffects.player.width,
            visualHeight: this.bulletEffects.player.height
        };
    }

    fadeMusic(from, to, duration = 1000) {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = 0.2 / steps;  // Max volume is 0.2
        let currentStep = 0;

        if (from) {
            from.muted = this.isMuted;
            from.play().catch(() => {});
        }
        if (to) {
            to.muted = this.isMuted;
            to.play().catch(() => {});
        }

        this.fadeInterval = setInterval(() => {
            currentStep++;
            
            if (from) from.volume = Math.max(0, 0.2 - (volumeStep * currentStep));
            if (to) to.volume = Math.min(0.2, volumeStep * currentStep);

            if (currentStep >= steps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                if (from) {
                    from.pause();
                    from.currentTime = 0;
                }
                this.currentTrack = to;
            }
        }, stepTime);
    }

    handleEnemyShooting(enemy) {
        let shootChance = this.enemyShootingConfig[
            Object.keys(this.enemyTypes)[enemy.type]
        ].chance;
        
        // Apply game mode multiplier
        const mode = this.gameMode ? this.gameModes[this.gameMode] : null;
        if (mode) {
            shootChance *= mode.enemyShootFrequency;
        }
        
        // Reduce shooting frequency in early waves (first 10 waves)
        if (this.wave <= 10) {
            const earlyWaveReduction = 0.5 + (this.wave * 0.05); // 50% reduction at wave 1, gradually increasing
            shootChance *= earlyWaveReduction;
        }
        
        // Slight increase in shooting chance for attacking enemies
        const attackingBonus = enemy.attacking ? 0.005 : 0; // Reduced from 0.02 to 0.005
        const finalChance = shootChance + attackingBonus;
        
        if (Math.random() < finalChance) {
            // Different shooting patterns based on enemy type and attack pattern
            if (enemy.attacking && enemy.pattern) {
                this.handleAttackPatternShooting(enemy);
            } else {
                this.handleStandardShooting(enemy);
            }
            
            // Reset cooldown
            enemy.shootCooldown = enemy.shootInterval || 60;
        }
    }
    
    handleStandardShooting(enemy) {
        // Standard shooting patterns for non-attacking enemies
        const dx = this.player.x - enemy.currentX;
        const dy = this.player.y - enemy.currentY;
        const baseAngle = Math.atan2(dy, dx);
        
        // Add random spread based on enemy type
        const spread = enemy.type === this.enemyTypes.BOSS ? Math.PI/8 : // 22.5 degrees
                      enemy.type === this.enemyTypes.ESCORT ? Math.PI/6 : // 30 degrees
                      Math.PI/4; // 45 degrees for grunts
        
        const finalAngle = baseAngle + (Math.random() - 0.5) * spread;
        
        const bulletSpeed = this.enemyShootingConfig[
            Object.keys(this.enemyTypes)[enemy.type]
        ].bulletSpeed;
        
        this.createEnemyBullet(enemy, finalAngle, bulletSpeed);
        this.enemyAttackConfig.currentShots++;
    }
    
    handleAttackPatternShooting(enemy) {
        // Special shooting patterns during attacks
        const bulletSpeed = this.enemyShootingConfig[
            Object.keys(this.enemyTypes)[enemy.type]
        ].bulletSpeed;
        
        switch (enemy.pattern) {
            case 'SPIRAL_DIVE':
            case 'SPIRAL':
                // Spiral shooting pattern
                this.createSpiralBullets(enemy, bulletSpeed);
                break;
            case 'SWEEP':
            case 'SWEEP_BOMBARD':
                // Sweep shooting pattern
                this.createSweepBullets(enemy, bulletSpeed);
                break;
            case 'STRAFE':
            case 'STRAFE_RUN':
                // Strafe shooting pattern
                this.createStrafeBullets(enemy, bulletSpeed);
                break;
            case 'CIRCLE_STRAFE':
                // Circle strafe shooting
                this.createCircleStrafeBullets(enemy, bulletSpeed);
                break;
            case 'ZIGZAG':
                // Zigzag shooting pattern
                this.createZigzagBullets(enemy, bulletSpeed);
                break;
            default:
                // Default attack shooting
                this.createAttackBullets(enemy, bulletSpeed);
        }
    }
    
    createSpiralBullets(enemy, bulletSpeed) {
        // Create bullets in a spiral pattern
        let bulletCount = 3 + Math.floor(Math.random() * 2);
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(1, bulletCount - Math.floor((11 - this.wave) / 3));
        }
        
        const startAngle = Math.random() * Math.PI * 2;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = startAngle + (i * Math.PI * 2 / bulletCount);
            this.createEnemyBullet(enemy, angle, bulletSpeed * 0.8);
        }
        this.enemyAttackConfig.currentShots += bulletCount;
    }
    
    createSweepBullets(enemy, bulletSpeed) {
        // Create bullets in a sweeping pattern
        let bulletCount = 2 + Math.floor(Math.random() * 2);
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(1, bulletCount - Math.floor((11 - this.wave) / 4));
        }
        
        const baseAngle = Math.PI / 2; // Downward
        const spread = Math.PI / 6; // 30 degree spread
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle + (spread * (i / (bulletCount - 1) - 0.5));
            this.createEnemyBullet(enemy, angle, bulletSpeed);
        }
        this.enemyAttackConfig.currentShots += bulletCount;
    }
    
    createStrafeBullets(enemy, bulletSpeed) {
        // Create bullets while strafing
        const dx = this.player.x - enemy.currentX;
        const dy = this.player.y - enemy.currentY;
        const baseAngle = Math.atan2(dy, dx);
        
        // Add some spread for strafing
        const spread = Math.PI / 8;
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        
        this.createEnemyBullet(enemy, angle, bulletSpeed * 1.1);
        this.enemyAttackConfig.currentShots++;
    }
    
    createCircleStrafeBullets(enemy, bulletSpeed) {
        // Create bullets while circling
        let bulletCount = 4;
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(2, bulletCount - Math.floor((11 - this.wave) / 5));
        }
        
        const centerX = enemy.circleCenterX || this.player.x;
        const centerY = enemy.circleCenterY || this.player.y;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            this.createEnemyBullet(enemy, angle, bulletSpeed * 0.9);
        }
        this.enemyAttackConfig.currentShots += bulletCount;
    }
    
    createZigzagBullets(enemy, bulletSpeed) {
        // Create bullets in zigzag pattern
        let bulletCount = 2;
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(1, bulletCount - Math.floor((11 - this.wave) / 6));
        }
        
        const baseAngle = Math.PI / 2; // Downward
        const zigzagOffset = Math.sin(Date.now() * 0.01) * Math.PI / 6;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle + zigzagOffset + (i - 0.5) * Math.PI / 12;
            this.createEnemyBullet(enemy, angle, bulletSpeed);
        }
        this.enemyAttackConfig.currentShots += bulletCount;
    }
    
    createAttackBullets(enemy, bulletSpeed) {
        // Standard attack bullets with tracking
        const dx = this.player.x - enemy.currentX;
        const dy = this.player.y - enemy.currentY;
        const baseAngle = Math.atan2(dy, dx);
        
        // Tighter spread for attacking enemies
        const spread = Math.PI / 12; // 15 degrees
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        
        this.createEnemyBullet(enemy, angle, bulletSpeed * 1.2);
        this.enemyAttackConfig.currentShots++;
    }

    handleBossShooting(enemy) {
        // Enhanced boss shooting patterns
        const patterns = [
            'CIRCLE_BARRAGE',
            'SPIRAL_BARRAGE', 
            'TRACKING_SHOTS',
            'WAVE_BARRAGE',
            'EXPLOSIVE_RING',
            'LASER_SWEEP'
        ];
        
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        switch (pattern) {
            case 'CIRCLE_BARRAGE':
                this.createCircleBarrage(enemy);
                break;
            case 'SPIRAL_BARRAGE':
                this.createSpiralBarrage(enemy);
                break;
            case 'TRACKING_SHOTS':
                this.createTrackingShots(enemy);
                break;
            case 'WAVE_BARRAGE':
                this.createWaveBarrage(enemy);
                break;
            case 'EXPLOSIVE_RING':
                this.createExplosiveRing(enemy);
                break;
            case 'LASER_SWEEP':
                this.createLaserSweep(enemy);
                break;
        }
    }
    
    createCircleBarrage(enemy) {
        // Create a full circle of bullets
        let bulletCount = 20;
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(8, bulletCount - Math.floor((11 - this.wave) * 1.5));
        }
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            this.createEnemyBullet(enemy, angle, 4);
        }
    }
    
    createSpiralBarrage(enemy) {
        // Create bullets in a spiral pattern
        let bulletCount = 12;
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(4, bulletCount - Math.floor((11 - this.wave) * 0.8));
        }
        
        const spiralAngle = Date.now() * 0.01; // Rotating spiral
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = spiralAngle + (i * Math.PI * 2 / bulletCount);
            this.createEnemyBullet(enemy, angle, 3.5);
        }
    }
    
    createTrackingShots(enemy) {
        // Create multiple tracking shots
        let bulletCount = 5;
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(2, bulletCount - Math.floor((11 - this.wave) / 3));
        }
        
        const baseAngle = Math.atan2(this.player.y - enemy.currentY, this.player.x - enemy.currentX);
        const spread = Math.PI / 6; // 30 degree spread
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle + (spread * (i / (bulletCount - 1) - 0.5));
            this.createEnemyBullet(enemy, angle, 5);
        }
    }
    
    createWaveBarrage(enemy) {
        // Create bullets in a wave pattern
        let bulletCount = 8;
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(3, bulletCount - Math.floor((11 - this.wave) / 2));
        }
        
        const waveOffset = Math.sin(Date.now() * 0.005) * Math.PI / 4;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = Math.PI / 2 + waveOffset + (i / bulletCount - 0.5) * Math.PI / 2;
            this.createEnemyBullet(enemy, angle, 4.5);
        }
    }
    
    createExplosiveRing(enemy) {
        // Create an expanding ring of bullets
        let bulletCount = 16;
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(6, bulletCount - Math.floor((11 - this.wave) * 1.2));
        }
        
        const expansionSpeed = 0.1;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            const bullet = {
                x: enemy.currentX + enemy.width / 2,
                y: enemy.currentY + enemy.height / 2,
                width: 6,
                height: 6,
                speed: 2,
                angle: angle,
                color: '#ff6600',
                expansionRadius: 0,
                expansionSpeed: expansionSpeed
            };
            
            bullet.dx = Math.cos(bullet.angle) * bullet.speed;
            bullet.dy = Math.sin(bullet.angle) * bullet.speed;
            this.enemyBullets.push(bullet);
        }
    }
    
    createLaserSweep(enemy) {
        // Create a sweeping laser pattern
        let bulletCount = 10;
        
        // Reduce bullet count in early waves
        if (this.wave <= 10) {
            bulletCount = Math.max(4, bulletCount - Math.floor((11 - this.wave) / 1.5));
        }
        
        const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2);
        const sweepWidth = Math.PI / 3; // 60 degree sweep
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = sweepAngle + (sweepWidth * (i / (bulletCount - 1) - 0.5));
            this.createEnemyBullet(enemy, angle, 6);
        }
    }

    createEnemyBullet(enemy, angle, speed = 5) {
        const bullet = {
            x: (enemy.currentX !== undefined ? enemy.currentX : enemy.x) + enemy.width / 2,
            y: (enemy.currentY !== undefined ? enemy.currentY : enemy.y) + enemy.height,
            width: 4,
            height: 6,
            speed: speed,
            angle: angle || Math.PI / 2,
            color: this.enemyShootingConfig[
                Object.keys(this.enemyTypes)[enemy.type]
            ].color || '#f00'
        };
        
        // Add velocity components based on angle
        bullet.dx = Math.cos(bullet.angle) * bullet.speed;
        bullet.dy = Math.sin(bullet.angle) * bullet.speed;
        this.enemyBullets.push(bullet);
    }

    createExplosion(x, y, type) {
        const colors = type === this.enemyTypes.BOSS ? ['255,200,0', '255,100,0', '255,50,0'] :  // Yellow-orange fire
                      type === this.enemyTypes.ESCORT ? ['0,255,255', '100,150,255', '255,255,255'] :  // Blue-white energy
                      ['255,100,100', '255,255,255', '255,0,0'];  // Red-white burst
        
        // Create two layers of particles for more density
        // Inner explosion (dense, fast particles)
        for (let i = 0; i < 40; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 3 + Math.random() * 3;  // Faster inner particles
            const distance = Math.random() * 10;  // Tighter inner radius
            
            this.explosions.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 1.5,  // Smaller inner particles
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                rotation: Math.random() * Math.PI * 2,
                decay: 0.04 + Math.random() * 0.02  // Faster decay for inner particles
            });
        }
        
        // Outer explosion (scattered, slower particles)
        for (let i = 0; i < 20; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 1 + Math.random() * 2;  // Slower outer particles
            const distance = 10 + Math.random() * 20;  // Wider outer radius
            
            this.explosions.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 2,  // Larger outer particles
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 0.8,  // Start slightly transparent
                rotation: Math.random() * Math.PI * 2,
                decay: 0.02 + Math.random() * 0.01  // Slower decay for outer particles
            });
        }
    }

    drawStars() {
        this.ctx.fillStyle = '#fff';
        this.stars.forEach(star => {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    checkBulletCollision(bullet1, bullet2) {
        const dx = bullet1.x - bullet2.x;
        const dy = bullet1.y - bullet2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (bullet1.width + bullet2.width) / 2;
    }

    createShockwave(x, y) {
        this.shockwaves.push({
            x: x,
            y: y,
            radius: 2,
            speed: 4,
            alpha: 1,
            color: '#fff'
        });
    }

    // Add drone drawing method
    drawDrone() {
        // Animate drone hover
        const hoverOffset = Math.sin(Date.now() / 200) * 2;
        
        // Draw drone body
        this.ctx.fillStyle = '#0ff';
        this.ctx.fillRect(-4, -4 + hoverOffset, 8, 8);
        
        // Draw core with color based on reload state
        const reloadProgress = 1 - (this.droneCooldown / this.droneReloadTime);
        this.ctx.fillStyle = reloadProgress >= 1 ? '#fff' : `rgba(255, 255, 255, ${reloadProgress})`;
        this.ctx.fillRect(-2, -2 + hoverOffset, 4, 4);
        
        // Draw energy glow
        this.ctx.globalAlpha = 0.5 * reloadProgress;
        this.ctx.shadowColor = '#0ff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(0, 0 + hoverOffset, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }

    // Add new method for creating drone bullets
    createDroneBullet(x, y, angle) {
        const speed = this.playerPowerUps.bulletSpeed ? 10 : 7;
        return {
            x: x,
            y: y,
            width: this.bulletEffects.player.width * 1.2,
            height: this.bulletEffects.player.height * 1.2,
            speed: speed,
            dx: Math.sin(angle) * speed,  // Add horizontal movement
            dy: -Math.cos(angle) * speed, // Maintain upward movement
            trail: [],
            color: '#0ff',  // Cyan color to match drones
            visualWidth: this.bulletEffects.player.width,
            visualHeight: this.bulletEffects.player.height
        };
    }

    // Add method to get stack count for a power-up type
    getStackCount(type) {
        switch(type) {
            case this.powerUpTypes.PERMANENT_SPEED:
                return this.playerPowerUps.permanentSpeedStacks;
            case this.powerUpTypes.PERMANENT_SHOT:
                return this.playerPowerUps.permanentShotStacks;
            case this.powerUpTypes.PERMANENT_BULLET:
                return this.playerPowerUps.permanentBulletStacks;
            case this.powerUpTypes.PERMANENT_SIZE:
                return this.playerPowerUps.permanentSizeStacks;
            case this.powerUpTypes.PERMANENT_DRONE:
                return this.playerPowerUps.permanentDroneStacks;
            default:
                return 0;
        }
    }

    // Add method to create stack effect message
    createStackEffect(type, stacks) {
        const baseMessages = {
            [this.powerUpTypes.PERMANENT_SPEED]: 'SPEED',
            [this.powerUpTypes.PERMANENT_SHOT]: 'SHOT',
            [this.powerUpTypes.PERMANENT_BULLET]: 'BULLET',
            [this.powerUpTypes.PERMANENT_SIZE]: 'SIZE',
            [this.powerUpTypes.PERMANENT_DRONE]: 'DRONE'
        };

        this.powerUpEffects.push({
            message: `${baseMessages[type]} x${stacks}`,
            color: '#f0f',
            alpha: 1,
            scale: 0,
            y: this.player.y
        });
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 