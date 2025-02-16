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
        
        // Initialize sounds
        this.sounds = {
            shoot: new Audio('sounds/shoot.wav'),
            explosion: new Audio('sounds/explosion.wav'),
            powerUp: new Audio('sounds/powerup.wav'),
            playerHit: new Audio('sounds/playerhit.wav'),
            gameOver: new Audio('sounds/gameover.wav'),
            waveComplete: new Audio('sounds/wave-complete.wav'),
            bonus: new Audio('sounds/bonus.wav'),
            levelUp: new Audio('sounds/level-up.wav'),
            powerupHit: new Audio('sounds/powerup-hit.wav'),
            powerupCollect: new Audio('sounds/powerup-collect.wav'),
            powerupExpire: new Audio('sounds/powerup-expire.wav'),
            clash: new Audio('sounds/clash.wav')
        };
        
        // Mute all sounds initially (unmute on first click)
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
            sound.muted = true;
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
        
        // Adjust attack timing
        this.attackCooldown = 90; // Reduced from 180 to 90 for more frequent attacks
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
                chance: 0.015, 
                bulletSpeed: 3, 
                color: '#f00',
                trackingChance: 0.3  // 30% chance for tracking bullets
            },
            ESCORT: { 
                chance: 0.01, 
                bulletSpeed: 2.5, 
                color: '#f80',
                trackingChance: 0.2  // 20% chance for tracking bullets
            },
            GRUNT: { 
                chance: 0.005, 
                bulletSpeed: 2, 
                color: '#ff0',
                trackingChance: 0.1  // 10% chance for tracking bullets
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
            normal: new Audio('sounds/normal-theme.wav'),
            boss: new Audio('sounds/boss-theme.wav'),
            menu: new Audio('sounds/menu-theme.wav'),
            gameover: new Audio('sounds/gameover-theme.wav')
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
        
        // Add enemy attack and shooting limits
        this.enemyAttackConfig = {
            maxAttacksPerWave: 15,  // Reduced from 20
            currentAttacks: 0,
            maxShotsPerWave: 60,    // Reduced from 100
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
        
        this.init();
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
            
            // Start game when space is pressed
            if (e.key === ' ') {
                if (this.gameState === 'start') {
                    this.gameState = 'playing';
                    this.formations = this.createFormations();
                    document.getElementById('startScreen').classList.add('hidden');
                    
                    // Unmute sounds on start
                    Object.values(this.sounds).forEach(sound => sound.muted = false);
                    Object.values(this.music).forEach(track => track.muted = false);
                    this.music.normal.currentTime = 0;
                    this.music.normal.play();
                } else if (this.gameState === 'gameover') {
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
        
        // Create initial formations immediately
        this.formations = this.createFormations();
        
        // Start game loop
        this.gameLoop();
        
        // Start normal music immediately
        this.music.normal.volume = 0.2;
        this.music.normal.muted = false;
        this.music.normal.play();
        this.currentTrack = this.music.normal;
        
        // Add click handler for logo
        const startScreen = document.getElementById('startScreen');
        const logoContainer = startScreen.querySelector('.logo-container');
        
        logoContainer.addEventListener('click', () => {
            if (this.gameState === 'title') {
                startScreen.classList.add('hidden');
                this.gameState = 'playing';
                
                // Start game music
                this.music.normal.volume = 0.2;
                this.music.normal.muted = false;
                this.music.normal.play();
                this.currentTrack = this.music.normal;
                
                // Create initial formations
                this.formations = this.createFormations();
            }
        });

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
                this.sounds.shoot.play();
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

        // Add back the scaling factors
        const powerScale = 1 + (this.wave * 0.1);  // 10% stronger each wave
        const speedScale = 1 + (this.wave * 0.05); // 5% faster each wave
        const healthScale = 1 + (Math.floor(this.wave / 3) * 0.2); // 20% more health every 3 waves

        const enemy = {
            currentX: path ? path.startX : boundedX,
            currentY: path ? path.startY : -50,
            targetX: boundedX,
            targetY: boundedY,
            width: isMegaBoss ? 135 : 30,  // Increased from 90 to 135 for mega boss
            height: isMegaBoss ? 135 : 30, // Increased from 90 to 135 for mega boss
            speed: this.difficulties['normal'].enemySpeed * speedScale,
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
        
        // Update attacking enemies with simpler movement
        this.formations.forEach(enemy => {
            if (enemy.attacking) {
                if (enemy.isMegaBoss) {
                    // Boss stays in position but can shoot
                    const dx = enemy.targetX - enemy.currentX;
                    const moveSpeed = 1;
                    
                    // Gentle side-to-side movement
                    enemy.currentX += Math.sin(Date.now() / 1000) * moveSpeed;
                    
                    // Keep boss within screen bounds
                    enemy.currentX = Math.max(enemy.width/2, Math.min(this.canvas.width - enemy.width/2, enemy.currentX));
                    
                    // Boss shooting is handled in the shooting update section
                } else {
                    // Regular enemy diving attack
                    const speed = 3;
                    const dx = enemy.targetX - enemy.currentX;
                    const dy = enemy.targetY - enemy.currentY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > speed) {
                        enemy.currentX += (dx / distance) * speed;
                        enemy.currentY += (dy / distance) * speed;
                    } else {
                        enemy.currentX = -100; // Move off screen when done
                    }
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
            
            // Create new wave with delay
            setTimeout(() => {
                this.formations = this.createFormations();
            }, 1000);
        }

        // Update and clean up attack indicators
        this.attackIndicators = this.attackIndicators.filter(indicator => {
            indicator.alpha -= 0.05;  // Fade out
            return indicator.alpha > 0;  // Remove when fully faded
        });

        // Update enemy attacks with limits
        if (this.formations.length > 0) {
            this.attackTimer++;
            if (this.attackTimer >= this.difficulties['normal'].attackCooldown && 
                this.enemyAttackConfig.currentAttacks < this.enemyAttackConfig.maxAttacksPerWave) {
                
                const availableEnemies = this.formations.filter(enemy => 
                    enemy.inPosition && !enemy.attacking && enemy.currentX > -50
                );
                
                if (availableEnemies.length > 0) {
                    const attackingCount = this.formations.filter(e => e.attacking).length;
                    if (attackingCount < this.difficulties['normal'].maxAttackers) {
                        const enemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
                        this.startAttack(enemy);
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
                const shootChance = this.enemyShootingConfig[
                    Object.keys(this.enemyTypes)[enemy.type]
                ].chance;
                
                if (Math.random() < shootChance) {
                    // Calculate angle towards player with random spread
                    const dx = this.player.x - enemy.currentX;
                    const dy = this.player.y - enemy.currentY;
                    const baseAngle = Math.atan2(dy, dx);
                    
                    // Add random spread based on enemy type
                    const spread = enemy.type === this.enemyTypes.BOSS ? Math.PI/6 : // 30 degrees
                                  enemy.type === this.enemyTypes.ESCORT ? Math.PI/4 : // 45 degrees
                                  Math.PI/3; // 60 degrees for grunts
                    
                    const finalAngle = baseAngle + (Math.random() - 0.5) * spread;
                    
                    const bulletSpeed = this.enemyShootingConfig[
                        Object.keys(this.enemyTypes)[enemy.type]
                    ].bulletSpeed;
                    
                    this.enemyBullets.push({
                        x: enemy.currentX + enemy.width / 2,
                        y: enemy.currentY + enemy.height,
                        width: 4,
                        height: 8,
                        speed: bulletSpeed,
                        dx: Math.cos(finalAngle) * bulletSpeed,
                        dy: Math.sin(finalAngle) * bulletSpeed,
                        color: this.enemyShootingConfig[
                            Object.keys(this.enemyTypes)[enemy.type]
                        ].color
                    });
                    this.enemyAttackConfig.currentShots++;
                }
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
                // Move bullets according to their angle
                bullet.x += bullet.dx;
                bullet.y += bullet.dy;
            } else {
                // Regular straight-down movement for normal enemies
                bullet.y += bullet.speed;
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
                    this.sounds.powerupHit.play();
                    
                    if (powerUp.health <= 0) {
                        this.handlePowerUp(powerUp.type);
                        this.powerUps.splice(powerUpIndex, 1);
                    }
                    return;
                }
            });
        });

        // Update player movement
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
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

                this.sounds.shoot.play();
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

        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter((bullet) => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;

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
                // Use quadratic bezier curve for smooth movement
                enemy.pathProgress = Math.min(1, enemy.pathProgress + 0.01);
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

        // Update stars movement
        this.stars.forEach(star => {
            star.y += star.speed;
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

        // Update boss shooting pattern
        this.formations.forEach(enemy => {
            if (enemy.isMegaBoss && enemy.inPosition) {
                enemy.shootCooldown++;
                if (enemy.shootCooldown >= enemy.shootInterval) {
                    // Create multiple bullet patterns
                    const patterns = [
                        // Spread shot (reduced bullets)
                        () => {
                            const bulletCount = 3;  // Reduced from 5
                            const spreadAngle = Math.PI / 6;  // Narrower spread (was PI/4)
                            for (let i = 0; i < bulletCount; i++) {
                                const angle = -Math.PI/2 + spreadAngle * (i - (bulletCount-1)/2);
                                this.createEnemyBullet(enemy, angle);
                            }
                        },
                        // Circle shot (reduced bullets)
                        () => {
                            const bulletCount = 6;  // Reduced from 8
                            for (let i = 0; i < bulletCount; i++) {
                                const angle = (i / bulletCount) * Math.PI * 2;
                                this.createEnemyBullet(enemy, angle);
                            }
                        },
                        // Aimed shot (reduced spread)
                        () => {
                            const dx = this.player.x - (enemy.currentX + enemy.width/2);
                            const dy = this.player.y - (enemy.currentY + enemy.height);
                            const angle = Math.atan2(dy, dx);
                            this.createEnemyBullet(enemy, angle);
                            this.createEnemyBullet(enemy, angle + 0.1);  // Reduced spread (was 0.2)
                            this.createEnemyBullet(enemy, angle - 0.1);  // Reduced spread (was 0.2)
                        }
                    ];

                    // Randomly choose a pattern
                    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
                    pattern();
                    
                    enemy.shootCooldown = 0;
                    this.sounds.shoot.play();
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
                    this.sounds.explosion.play();
                    
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
                    this.sounds.clash.play();
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
            // Add warning trail effect
            this.ctx.save();
            this.ctx.strokeStyle = bullet.color;
            this.ctx.lineWidth = 3;  // Thicker trail
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x, bullet.y);
            // Calculate trail end point based on bullet direction
            const trailLength = 20;
            this.ctx.lineTo(
                bullet.x - (bullet.dx/bullet.speed) * trailLength, 
                bullet.y - (bullet.dy/bullet.speed) * trailLength
            );
            this.ctx.stroke();
            this.ctx.restore();

            // Draw glow effect
            this.ctx.save();
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.width, 0, Math.PI * 2);
            this.ctx.fillStyle = bullet.color;
            this.ctx.fill();
            this.ctx.restore();

            // Draw bright core
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.width * 0.7, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
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
            // Add warning trail effect
            this.ctx.save();
            this.ctx.strokeStyle = bullet.color;
            this.ctx.lineWidth = 3;  // Thicker trail
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x, bullet.y);
            // Calculate trail end point based on bullet direction
            const trailLength = 20;
            this.ctx.lineTo(
                bullet.x - (bullet.dx/bullet.speed) * trailLength, 
                bullet.y - (bullet.dy/bullet.speed) * trailLength
            );
            this.ctx.stroke();
            this.ctx.restore();

            // Draw glow effect
            this.ctx.save();
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.width, 0, Math.PI * 2);
            this.ctx.fillStyle = bullet.color;
            this.ctx.fill();
            this.ctx.restore();

            // Draw bright core
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.width * 0.7, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
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
        this.sounds.powerupCollect.play();
        this.createPowerUpEffect(type);

        switch(type) {
            case this.powerUpTypes.DOUBLE_SHOT:
                if (!this.playerPowerUps.permanentShot) {
                    this.playerPowerUps.doubleShot = true;
                    setTimeout(() => {
                        if (!this.playerPowerUps.permanentShot) {
                            this.playerPowerUps.doubleShot = false;
                            this.sounds.powerupExpire.play();
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
                            this.sounds.powerupExpire.play();
                        }
                    }, 8000);
                }
                break;
            case this.powerUpTypes.SHIELD:
                this.playerPowerUps.shield = true;
                setTimeout(() => {
                    this.playerPowerUps.shield = false;
                    this.sounds.powerupExpire.play();
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
                            this.sounds.powerupExpire.play();
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
                            this.sounds.powerupExpire.play();
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
                            this.sounds.powerupExpire.play();
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
        this.sounds.playerHit.play();
        
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
        this.sounds.gameOver.play();

        // Show game over screen
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.querySelector('.final-score').textContent = this.score;

        // Check and display high score
        const isNewHighScore = this.saveHighScore('normal', this.score);
        document.querySelector('.high-score').textContent = 
            `HIGH SCORE: ${this.highScores['normal']}` +
            (isNewHighScore ? ' NEW!' : '');

        // Fade to game over music
        this.fadeMusic(this.currentTrack, this.music.gameover);
    }

    restart() {
        this.fadeMusic(this.currentTrack, this.music.normal);
        this.gameState = 'title';  // Change to title instead of playing
        
        // Show/hide screens
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        
        // Update high score on start screen
        document.querySelector('.start-high-score span').textContent = this.highScores['normal'] || 0;
        
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
                
                this.sounds.explosion.play();
            } else {
                // Hit effect for boss not destroyed
                this.sounds.powerupHit.play();
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
            
            this.sounds.explosion.play();
            this.waveStats.enemiesDefeated++;
        } else {
            // Hit effect for enemy not destroyed
            this.sounds.powerupHit.play();
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

    startAttack(enemy) {
        if (enemy.type !== this.enemyTypes.ESCORT) return;
        
        const currentAttackers = this.formations.filter(e => e.attacking).length;
        const maxAttackers = Math.min(4, Math.floor(1 + this.wave/2));
        
        if (currentAttackers >= maxAttackers) return;
        
        const attackChance = 0.7 + (this.wave * 0.1);
        if (Math.random() > attackChance) return;
        
        if (enemy.inPosition) {
            enemy.attacking = true;
            
            // Random attack pattern selection
            const patterns = ['DIVE', 'SWEEP', 'ZIGZAG'];
            enemy.pattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            enemy.patternProgress = 0;
            enemy.patternStartX = enemy.currentX;
            enemy.patternStartY = enemy.currentY;
            
            // Add some randomness to target position
            const spreadX = 100; // pixels of horizontal spread
            enemy.targetX = this.player.x + (Math.random() - 0.5) * spreadX;
            enemy.targetY = this.canvas.height + 50;
            
            // Add random movement modifiers
            enemy.amplitude = 50 + Math.random() * 50; // For zigzag/sweep patterns
            enemy.frequency = 0.02 + Math.random() * 0.03; // Movement frequency
            
            enemy.tracking = Math.random() < 0.7; // 70% chance to track player
            enemy.canShoot = true;
            
            // Add attack indicator
            this.attackIndicators.push({
                startX: enemy.currentX + enemy.width / 2,
                startY: enemy.currentY + enemy.height / 2,
                endX: enemy.targetX + enemy.width / 2,
                endY: this.canvas.height - 50,
                alpha: 1
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
            this.sounds.levelUp.play();
            
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

        if (from) from.play();
        if (to) to.play();

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

    createEnemyBullet(enemy, angle) {
        const speed = Math.min(enemy.bulletSpeed, 4);
        const isTracking = Math.random() < enemy.trackingChance;
        
        let dx, dy;
        if (isTracking) {
            // Calculate direction to player
            const toPlayerX = this.player.x - enemy.currentX;
            const toPlayerY = this.player.y - enemy.currentY;
            const dist = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
            dx = (toPlayerX / dist) * (speed * 0.7); // Slower tracking bullets
            dy = (toPlayerY / dist) * (speed * 0.7);
        } else {
            dx = Math.cos(angle) * speed;
            dy = Math.sin(angle) * speed;
        }

        this.enemyBullets.push({
            x: enemy.currentX + enemy.width/2,
            y: enemy.currentY + enemy.height,
            width: (enemy.isMegaBoss ? 6 : 4) * 1.2,
            height: (enemy.isMegaBoss ? 8 : 6) * 1.2,
            visualWidth: enemy.isMegaBoss ? 8 : 6,
            visualHeight: enemy.isMegaBoss ? 10 : 8,
            speed: speed,
            dx: dx,
            dy: dy,
            color: isTracking ? '#f0f' : (enemy.isMegaBoss ? '#f00' : '#ff0'), // Purple for tracking bullets
            trail: [],
            isTracking: isTracking
        });
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