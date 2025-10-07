// --- ELEMEN DOM ---
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const page3 = document.getElementById('page3');
const giftBox = document.getElementById('giftBox');
const clickCountEl = document.getElementById('clickCount');
const progressFill = document.getElementById('progressFill');
const birthdayCard = document.getElementById('birthdayCard');
const birthdayCardInner = document.querySelector('.birthday-card-inner');
const birthdayGreeting = document.getElementById('birthdayGreeting');
const tapIndicator = document.getElementById('tapIndicator');
const nextPageBtn = document.getElementById('nextPageBtn');
const backToPage2Btn = document.getElementById('backToPage2Btn');
const balloonContainer = document.getElementById('balloonContainer');

// --- ELEMEN AUDIO ---
const bgMusic = document.getElementById('bgMusic');
const voiceMessage = document.getElementById('voiceMessage');
const popSound = document.getElementById('popSound');

// --- ELEMEN PEMAIN MEDIA BARU ---
const voicePlayPauseBtn = document.getElementById('voicePlayPauseBtn');
const iconPlay = voicePlayPauseBtn.querySelector('.icon-play');
const iconPause = voicePlayPauseBtn.querySelector('.icon-pause');
const voiceProgressContainer = document.getElementById('voiceProgressContainer');
const voiceProgressFill = document.getElementById('voiceProgressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const musicText = document.getElementById('musicText');
const musicIcon = document.getElementById('musicIcon');

// --- ELEMEN KANVAS ---
const fireworksCanvas = document.getElementById('fireworksCanvas');
const f_ctx = fireworksCanvas.getContext('2d');
const starCanvas = document.getElementById('starCanvas');
const s_ctx = starCanvas.getContext('2d');

// --- PEMBOLEH UBAH STATE ---
let clickCount = 0;
const maxClicks = 5;
let isGiftOpened = false;
let isMusicPlaying = false;
let isVoicePlaying = false;
let balloonInterval;
let fireworks = [], particles = [];
let fireworkAnimationId;
let starAnimationId;
let stars = [];
let isCardFlipped = false;

// --- FUNGSI UTAMA ---

function goToPage(targetPage) {
    const currentPage = document.querySelector('.page.active');
    
    if (currentPage) {
        if (currentPage === targetPage) return;
        currentPage.classList.remove('active');
        if (currentPage === page2) {
            stopFireworks();
            stopStars();
        }
        if (currentPage === page3) {
            clearInterval(balloonInterval);
            balloonInterval = null;
            balloonContainer.innerHTML = '';
            // Hentikan dan reset mesej suara jika keluar dari page 3
            voiceMessage.pause();
            voiceMessage.currentTime = 0;
            isVoicePlaying = false;
            updateVoicePlayerUI();
        }
    }
    
    window.scrollTo(0, 0);
    document.body.style.overflow = targetPage === page3 ? 'auto' : 'hidden';

    targetPage.classList.add('active');
    
    if (targetPage === page2) {
        isCardFlipped = false;
        birthdayCardInner.classList.remove('is-flipped');
        tapIndicator.classList.remove('hidden');
        document.querySelectorAll('.penguin-wrapper').forEach(p => p.classList.remove('enter'));
        startFireworks();
        setupStarCanvas();
        drawStars();
    } else if (targetPage === page3) {
        createBalloons();
        animateMessageEntry();
    }
}

// --- FUNGSI-FUNGSI HADIAH ---

giftBox.addEventListener('click', handleGiftClick);

function handleGiftClick() {
    if (isGiftOpened) return;
    clickCount++;
    clickCountEl.textContent = clickCount;
    progressFill.style.width = `${(clickCount / maxClicks) * 100}%`;
    giftBox.classList.remove('shake');
    void giftBox.offsetWidth;
    giftBox.classList.add('shake');
    if (window.confetti) {
        confetti({ 
            particleCount: 30 + (clickCount * 10), 
            spread: 70 + (clickCount * 10),
            origin: { y: 0.6 },
            colors: ['#FF6B81', '#ffb3ba', '#ffdfba', '#baffc9', '#fecfef'],
        });
    }
    if (clickCount >= maxClicks) openGift();
}

function openGift() {
    isGiftOpened = true;
    giftBox.classList.add('opened');
    if (window.confetti) {
        const duration = 1500;
        const end = Date.now() + duration;
        const colors = ['#FF6B81', '#ffb3ba', '#ffdfba', '#baffc9', '#fecfef'];
        (function frame() {
            confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
            confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
    startBackgroundMusic();
    setTimeout(() => goToPage(page2), 1200);
}

// --- FUNGSI-FUNGSI KAD HARI LAHIR ---

birthdayCard.addEventListener('click', handleCardClick);

function handleCardClick() {
    if (isCardFlipped) return;
    isCardFlipped = true;
    tapIndicator.classList.add('hidden');
    birthdayCardInner.classList.add('is-flipped');
    animateGreetingText();
    animatePenguins();
}

nextPageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    goToPage(page3);
});

backToPage2Btn.addEventListener('click', () => goToPage(page2));

// --- LOGIK PEMAIN MEDIA BARU ---

// Fungsi untuk format masa dari saat ke MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Fungsi untuk main/jeda mesej suara
function toggleVoicePlay() {
    isVoicePlaying = !isVoicePlaying;
    if (isVoicePlaying) {
        if (isMusicPlaying) bgMusic.pause();
        voiceMessage.play();
    } else {
        voiceMessage.pause();
        if (isMusicPlaying) bgMusic.play();
    }
    updateVoicePlayerUI();
}

// Kemas kini UI pemain media (ikon butang)
function updateVoicePlayerUI() {
    iconPlay.style.display = isVoicePlaying ? 'none' : 'block';
    iconPause.style.display = isVoicePlaying ? 'block' : 'none';
}

// Kemas kini progress bar dan masa semasa
function updateProgress() {
    const { duration, currentTime } = voiceMessage;
    const progressPercent = (currentTime / duration) * 100;
    voiceProgressFill.style.width = `${progressPercent}%`;
    currentTimeEl.textContent = formatTime(currentTime);
}

// Tetapkan durasi penuh apabila audio dimuatkan
function setAudioDuration() {
    totalDurationEl.textContent = formatTime(voiceMessage.duration);
}

// Fungsi untuk 'seek' audio apabila progress bar diklik
function seek(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = voiceMessage.duration;
    voiceMessage.currentTime = (clickX / width) * duration;
}

// Event listeners untuk pemain media suara
voicePlayPauseBtn.addEventListener('click', toggleVoicePlay);
voiceMessage.addEventListener('timeupdate', updateProgress);
voiceMessage.addEventListener('loadedmetadata', setAudioDuration);
voiceMessage.addEventListener('ended', () => {
    isVoicePlaying = false;
    updateVoicePlayerUI();
    if (isMusicPlaying) bgMusic.play();
});
voiceProgressContainer.addEventListener('click', seek);

// --- LOGIK MUZIK LATAR ---
musicToggleBtn.addEventListener('click', () => {
    isMusicPlaying = !isMusicPlaying;
    if (isMusicPlaying) {
        // Jangan mainkan muzik jika mesej suara sedang dimainkan
        if (!isVoicePlaying) bgMusic.play();
    } else {
        bgMusic.pause();
    }
    updateMusicButtonUI(isMusicPlaying);
});

function startBackgroundMusic() {
    if (isMusicPlaying || !bgMusic) return;
    bgMusic.volume = 0.25;
    bgMusic.play().then(() => {
        isMusicPlaying = true; 
        updateMusicButtonUI(true);
    }).catch(() => {
        document.body.addEventListener('click', function playMusicHandler() {
            if (!isMusicPlaying) { 
                isMusicPlaying = true; 
                bgMusic.play(); 
                updateMusicButtonUI(true); 
            }
        }, { once: true });
    });
}

function updateMusicButtonUI(isPlaying) {
    if (musicText) musicText.textContent = isPlaying ? 'Hentikan Muzik' : 'Mainkan Muzik';
    if (musicIcon) musicIcon.textContent = isPlaying ? '⏸' : '♫';
}

// --- FUNGSI ANIMASI & LAIN-LAIN ---
function createBalloons() {
    clearInterval(balloonInterval);
    balloonInterval = setInterval(() => {
        if(document.visibilityState === 'visible') {
            balloonContainer.appendChild(createBalloon());
        }
    }, 1500);
}

function createBalloon() {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    const colors = [
        { main: 'linear-gradient(135deg, #FF9A8B, #FF6A88)', pop: '#FF6A88', knot: '#C75369' },
        { main: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', pop: '#a1c4fd', knot: '#89A9D1' },
        { main: 'linear-gradient(135deg, #f6d365, #fda085)', pop: '#f6d365', knot: '#C49A4C' },
        { main: 'linear-gradient(135deg, #84fab0, #8fd3f4)', pop: '#84fab0', knot: '#6FB496' }
    ];
    const colorSet = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.setProperty('--balloon-color', colorSet.main);
    balloon.style.setProperty('--balloon-knot-color', colorSet.knot);
    balloon.innerHTML = `<div class="balloon-body"></div><div class="balloon-tail"></div><div class="pop-text" style="color: ${colorSet.pop};">POP!</div>`;
    balloon.style.setProperty('--balloon-drift', `${Math.random() * 200 - 100}px`);
    balloon.style.left = `${Math.random() * 90 + 5}%`;
    balloon.style.animationDuration = `${Math.random() * 8 + 12}s`;
    
    balloon.addEventListener('click', () => {
        if (balloon.classList.contains('popped')) return;
        if (popSound) { popSound.currentTime = 0; popSound.volume = 0.4; popSound.play(); }
        balloon.classList.add('popped');
        setTimeout(() => balloon.remove(), 1000);
    });
    return balloon;
}

function animateMessageEntry() {
    const messageContainer = document.querySelector('.message-container');
    if (messageContainer) messageContainer.classList.add('enter');
}

function animateGreetingText() {
    const text = birthdayGreeting.textContent;
    birthdayGreeting.innerHTML = '';
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.animationDelay = `${0.5 + index * 0.08}s`;
        birthdayGreeting.appendChild(span);
    });
}

function animatePenguins() {
    document.querySelectorAll('.penguin-wrapper').forEach((penguin, index) => {
        penguin.style.animationDelay = `${1 + index * 0.2}s`;
        penguin.classList.add('enter');
    });
}


// --- FUNGSI KANVAS (BINTANG & BUNGA API) ---
window.addEventListener('resize', () => {
    if (page2.classList.contains('active')) {
        setupFireworksCanvas();
        setupStarCanvas();
    }
});

function setupStarCanvas() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    stars = [];
    const starCount = window.innerWidth < 768 ? 150 : 300;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * starCanvas.width,
            y: Math.random() * starCanvas.height,
            vy: Math.random() * 0.4 + 0.1,
            radius: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.5,
            twinkle: Math.random() * 0.02
        });
    }
}

function drawStars() {
    s_ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    stars.forEach(star => {
        star.y -= star.vy;
        if (star.y < -star.radius) {
            star.y = starCanvas.height + star.radius;
            star.x = Math.random() * starCanvas.width;
        }
        if (Math.random() > 0.99) star.twinkle *= -1;
        star.alpha += star.twinkle;
        if (star.alpha > 1) star.alpha = 1;
        if (star.alpha < 0.3) star.alpha = 0.3;
        s_ctx.beginPath();
        s_ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        s_ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        s_ctx.fill();
    });
    starAnimationId = requestAnimationFrame(drawStars);
}

function stopStars() {
    cancelAnimationFrame(starAnimationId);
}

function setupFireworksCanvas() {
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
}

function startFireworks() {
    if (fireworkAnimationId) return;
    setupFireworksCanvas();
    fireworkLoop();
}

function stopFireworks() {
    cancelAnimationFrame(fireworkAnimationId);
    fireworkAnimationId = null;
    fireworks = [];
    particles = [];
    setTimeout(() => f_ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height), 100);
}

function fireworkLoop() {
    fireworkAnimationId = requestAnimationFrame(fireworkLoop);
    f_ctx.globalCompositeOperation = 'destination-out';
    f_ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
    f_ctx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    f_ctx.globalCompositeOperation = 'lighter';
    if (Math.random() < 0.04) fireworks.push(new Firework());
    fireworks.forEach((fw, i) => fw.done ? fireworks.splice(i, 1) : (fw.update(), fw.draw()));
    particles.forEach((p, i) => p.done ? particles.splice(i, 1) : (p.update(), p.draw()));
}

class Firework { /* ... (Kelas Firework kekal sama) ... */
    constructor() { this.x = Math.random() * fireworksCanvas.width; this.y = fireworksCanvas.height; this.targetY = Math.random() * (fireworksCanvas.height / 2); this.hue = Math.random() * 360; this.vel = { y: -(Math.random() * 3 + 4) }; this.done = false; }
    update() { this.y += this.vel.y; if (this.y < this.targetY) { this.explode(); this.done = true; } }
    draw() { f_ctx.beginPath(); f_ctx.moveTo(this.x, this.y); f_ctx.lineTo(this.x, this.y - 10); f_ctx.strokeStyle = `hsl(${this.hue}, 100%, 60%)`; f_ctx.lineWidth = 2; f_ctx.stroke(); }
    explode() { for (let i = 0; i < 100; i++) particles.push(new Particle(this.x, this.y, this.hue)); }
}
class Particle { /* ... (Kelas Particle kekal sama) ... */
    constructor(x, y, hue) { this.x = x; this.y = y; this.hue = hue + (Math.random() * 60 - 30); const angle = Math.random() * Math.PI * 2, speed = (Math.random() * 6 + 2); this.vel = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }; this.friction = 0.98; this.gravity = 0.08; this.alpha = 1; this.decay = Math.random() * 0.02 + 0.01; this.size = Math.random() * 2 + 1; this.done = false; }
    update() { this.vel.x *= this.friction; this.vel.y *= this.friction; this.vel.y += this.gravity; this.x += this.vel.x; this.y += this.vel.y; this.alpha -= this.decay; if (this.alpha <= this.decay) this.done = true; }
    draw() { f_ctx.beginPath(); f_ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); f_ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.alpha})`; f_ctx.fill(); }
}

const style = document.createElement('style');
style.textContent = `
    .char { display: inline-block; opacity: 0; animation: charFadeIn 0.5s ease forwards; }
    @keyframes charFadeIn { from { opacity: 0; transform: translateY(20px) rotate(15deg); } to { opacity: 1; transform: translateY(0) rotate(0); } }
    .penguin-wrapper { opacity: 0; transform: translateY(30px) scale(0); }
    .penguin-wrapper.enter { animation: penguinEntrance 0.6s ease forwards; }
    @keyframes penguinEntrance { to { opacity: 1; transform: translateY(0) scale(1); } }
    .message-container { opacity: 0; transform: translateY(50px) scale(0.9); }
    .message-container.enter { transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); opacity: 1; transform: translateY(0) scale(1); }
`;
document.head.appendChild(style);