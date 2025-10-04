// =================================
// DOM Elements & State
// =================================
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const page3 = document.getElementById('page3');
const giftBox = document.getElementById('giftBox');
const clickCountEl = document.getElementById('clickCount');
const birthdayCard = document.getElementById('birthdayCard');
const birthdayGreeting = document.getElementById('birthdayGreeting');
const tapIndicator = document.getElementById('tapIndicator');
const nextPageBtn = document.getElementById('nextPageBtn');
const backToPage2Btn = document.getElementById('backToPage2Btn');
const playVoiceBtn = document.getElementById('playVoiceBtn');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const voiceText = document.getElementById('voiceText');
const musicText = document.getElementById('musicText');
const bgMusic = document.getElementById('bgMusic');
const voiceMessage = document.getElementById('voiceMessage');
const popSound = document.getElementById('popSound');
const fireworkLaunchSound = document.getElementById('fireworkLaunchSound');
const fireworkExplodeSound = document.getElementById('fireworkExplodeSound');
const fireworksCanvas = document.getElementById('fireworksCanvas');
const ctx = fireworksCanvas.getContext('2d');

let clickCount = 0;
const maxClicks = 5;
let isGiftOpened = false;
let isMusicPlaying = false;
let isVoicePlaying = false;
let balloonInterval;
let fireworks = [], particles = [];
let animationFrameId;

// =================================
// On Load
// =================================
document.addEventListener('DOMContentLoaded', () => {
    function generateStars(selector, count, size) {
        const el = document.querySelector(selector);
        if (!el) return;
        let boxShadow = '';
        for(let i = 0; i < count; i++) {
            boxShadow += `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`;
            if (i < count - 1) boxShadow += ', ';
        }
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.boxShadow = boxShadow;
    }
    generateStars('#stars', 700, 1);
    generateStars('#stars2', 200, 2);
    generateStars('#stars3', 100, 3);
});


// =================================
// Core Navigation
// =================================
function goToPage(targetPage) {
    const currentPage = document.querySelector('.page.active');
    
    if (currentPage) {
        if (currentPage === targetPage) return;
        currentPage.classList.remove('active');
        if (currentPage === page2) {
            setTimeout(stopFireworks, 600);
        }
    }

    targetPage.classList.add('active');
    if (targetPage === page2) {
        birthdayCard.classList.remove('is-flipped');
        tapIndicator.classList.remove('hidden');
        startFireworks();
    }
}

// =================================
// Page 1 Logic: Gift Box
// =================================
giftBox.addEventListener('click', () => {
    if (isGiftOpened) return;
    clickCount++;
    clickCountEl.textContent = clickCount;
    giftBox.classList.add('shake');
    setTimeout(() => giftBox.classList.remove('shake'), 500);
    if (window.confetti) confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    if (clickCount >= maxClicks) {
        isGiftOpened = true;
        giftBox.classList.add('opened');
        startBackgroundMusic();
        setTimeout(() => {
            goToPage(page2);
        }, 800);
    }
});

// =================================
// Page 2 Logic: Birthday Card & Fireworks
// =================================
function animateGreetingText() {
    const text = birthdayGreeting.textContent;
    birthdayGreeting.innerHTML = '';
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.animationDelay = `${0.5 + index * 0.05}s`;
        birthdayGreeting.appendChild(span);
    });
}

birthdayCard.addEventListener('click', () => {
    if (birthdayCard.classList.contains('is-flipped')) return;
    
    tapIndicator.classList.add('hidden');
    birthdayCard.classList.add('pop-out');
    
    setTimeout(() => {
        birthdayCard.classList.remove('pop-out');
        birthdayCard.classList.add('is-flipped');
        animateGreetingText();
        
        const end = Date.now() + (1 * 1000);
        const colors = ['#ff6f69', '#ffb3ba', '#ffdfba', '#baffc9', '#fecfef'];
        (function frame() {
            if (Date.now() > end) return;
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
            requestAnimationFrame(frame);
        }());
    }, 500);
});

nextPageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    goToPage(page3);
    document.body.style.overflow = 'auto';
    createBalloons();
});

backToPage2Btn.addEventListener('click', () => {
    goToPage(page2);
});

// --- Fireworks Physics ---
function setupCanvas() {
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
}
window.addEventListener('resize', setupCanvas);

function startFireworks() {
    if (animationFrameId) return;
    setupCanvas();
    loop();
}
function stopFireworks() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    fireworks = [];
    particles = [];
    setTimeout(() => {
        ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    }, 100);
}

function loop() {
    animationFrameId = requestAnimationFrame(loop);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 16, 0.15)';
    ctx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    ctx.globalCompositeOperation = 'lighter';
    if (Math.random() < 0.04) fireworks.push(new Firework());
    fireworks.forEach((fw, i) => fw.done ? fireworks.splice(i, 1) : (fw.update(), fw.draw()));
    particles.forEach((p, i) => p.done ? particles.splice(i, 1) : (p.update(), p.draw()));
}

class Firework {
    constructor() {
        this.x = Math.random() * fireworksCanvas.width;
        this.y = fireworksCanvas.height;
        this.targetY = Math.random() * (fireworksCanvas.height / 2) + (fireworksCanvas.height / 4);
        this.hue = Math.random() * 360;
        this.vel = { y: -(Math.random() * 2 + 3) };
        this.done = false;
        fireworkLaunchSound.volume = 0.05;
        fireworkLaunchSound.play().catch(()=>{});
    }
    update() {
        this.y += this.vel.y;
        if (this.y < this.targetY) {
            this.explode();
            this.done = true;
        }
    }
    draw() {
        ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    explode() {
        fireworkExplodeSound.volume = 0.08;
        fireworkExplodeSound.play().catch(()=>{});
        const explosionSizeFactor = 1 - (this.y / fireworksCanvas.height);
        const particleCount = 70 * explosionSizeFactor + 50;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(this.x, this.y, this.hue, explosionSizeFactor));
        }
    }
}

class Particle {
    constructor(x, y, hue, sizeFactor) {
        this.x = x; this.y = y;
        this.hue = hue + (Math.random() * 40 - 20);
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 6 + 1) * sizeFactor;
        this.vel = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
        this.friction = 0.98; this.gravity = 0.08;
        this.alpha = 1; this.decay = Math.random() * 0.015 + 0.01;
        this.size = Math.random() * 1 + 1;
        this.done = false;
    }
    update() {
        this.vel.x *= this.friction; this.vel.y *= this.friction;
        this.vel.y += this.gravity; this.x += this.vel.x; this.y += this.vel.y;
        this.alpha -= this.decay;
        if (this.alpha <= this.decay) this.done = true;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// =================================
// Page 3 Logic: Message & Balloons
// =================================
playVoiceBtn.addEventListener('click', () => {
    isVoicePlaying = !isVoicePlaying;
    if (isVoicePlaying) {
        if (isMusicPlaying) bgMusic.pause(); voiceMessage.play();
    } else {
        voiceMessage.pause(); if (isMusicPlaying) bgMusic.play();
    }
    updateVoiceButtonUI(isVoicePlaying);
});

musicToggleBtn.addEventListener('click', () => {
    isMusicPlaying = !isMusicPlaying;
    isMusicPlaying ? bgMusic.play() : bgMusic.pause();
    updateMusicButtonUI(isMusicPlaying);
});

voiceMessage.addEventListener('ended', () => {
    isVoicePlaying = false;
    updateVoiceButtonUI(false);
    if (isMusicPlaying) bgMusic.play();
});

function createBalloons() {
    const container = document.querySelector('.balloon-container');
    if (!container || container.childElementCount > 0) return;
    const colors = [
        { main: 'rgba(149, 153, 226, 0.8)', pop: '#9599E2' },
        { main: 'rgba(240, 147, 251, 0.8)', pop: '#F093FB' },
        { main: 'rgba(245, 87, 108, 0.8)', pop: '#F5576C' }
    ];
    let createdCount = 0; const balloonCount = window.innerWidth < 768 ? 8 : 15;
    clearInterval(balloonInterval);
    balloonInterval = setInterval(() => {
        if (createdCount >= balloonCount) { clearInterval(balloonInterval); return; }
        const colorSet = colors[createdCount % colors.length];
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.innerHTML = `<div class="balloon-body"></div><div class="balloon-tail"></div><div class="pop-text">POP!</div>`;
        balloon.querySelector('.balloon-body').style.background = colorSet.main;
        balloon.querySelector('.pop-text').style.color = colorSet.pop;
        balloon.style.left = `${Math.random() * 90}%`;
        balloon.style.animationDuration = `${Math.random() * 10 + 15}s`;
        balloon.addEventListener('click', () => {
            if (balloon.classList.contains('popped')) return;
            popSound.currentTime = 0; popSound.volume = 0.5; popSound.play();
            balloon.classList.add('popped');
            setTimeout(() => balloon.remove(), 2000);
        });
        container.appendChild(balloon);
        createdCount++;
    }, 1500);
}

// =================================
// Audio & UI Helper Functions
// =================================
function startBackgroundMusic() {
    if (isMusicPlaying) return;
    bgMusic.volume = 0.3;
    bgMusic.play().then(() => {
        isMusicPlaying = true;
        updateMusicButtonUI(true);
    }).catch(() => {
        document.body.addEventListener('click', function playMusicHandler() {
            if (!isMusicPlaying) {
                bgMusic.play();
                isMusicPlaying = true;
                updateMusicButtonUI(true);
            }
        }, { once: true });
    });
}

function updateVoiceButtonUI(isPlaying) {
    voiceText.textContent = isPlaying ? 'Pause Voice Message' : 'Play My Voice Message';
}

function updateMusicButtonUI(isPlaying) {
    musicText.textContent = isPlaying ? 'Pause Music' : 'Play Music';
}