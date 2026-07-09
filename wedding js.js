/* --- JAVASCRIPT FOR DIGITAL WEDDING CARD INTERACTIVE LOGIC & LIVE CUSTOMIZATION --- */

// --- 1. DEFAULT DATA BACKUP & DATA INITIALIZATION ---
const SECRET_PASSCODE = "2026";
const DEFAULT_WISHES = [
    { name: "Jessica & Michael", attendance: "attending", wishes: "Congratulations Arthur and Evelyn! We are so excited to see you two tie the knot. Wishing you a lifetime of love and happiness!", timestamp: "2026-07-08 14:32:00" },
    { name: "Uncle David & Aunt Clara", attendance: "attending", wishes: "What a beautiful love story. We still remember when Arthur spoke about meeting Evelyn in the bookstore! So happy to be there to witness your vows.", timestamp: "2026-07-06 09:12:00" },
    { name: "Sophia Martinez", attendance: "attending", wishes: "Sending you both the warmest wishes for the future. May your life together be filled with joy, adventure, and lots of laughter!", timestamp: "2026-07-05 18:45:00" }
];

// Initialize database
function getRSVPs() {
    const list = localStorage.getItem("wedding_rsvps");
    return list ? JSON.parse(list) : [];
}

function saveRSVPs(list) {
    localStorage.setItem("wedding_rsvps", JSON.stringify(list));
}

// Ensure default wishes exist on initial load
if (getRSVPs().length === 0) {
    saveRSVPs(DEFAULT_WISHES);
}

// --- 2. CONFIG LOAD & BINDING SYSTEM ---
// Load saved customizations from localStorage (merges on top of defaults)
const STORAGE_KEY = "wedding_custom_config";

function saveConfigToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) { /* storage full or unavailable */ }
}

function loadConfigFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Deep merge saved values onto the default config
            Object.assign(config, parsed);
            if (parsed.events) {
                config.events = config.events || {};
                Object.assign(config.events, parsed.events);
                if (parsed.events.ceremony) Object.assign(config.events.ceremony, parsed.events.ceremony);
                if (parsed.events.reception) Object.assign(config.events.reception, parsed.events.reception);
            }
        }
    } catch (e) { /* parse error or storage unavailable */ }
}

const config = window.WEDDING_CONFIG || {};

function loadConfigValues() {
    // Page Title
    document.title = `${config.groomName} & ${config.brideName} - Wedding Invitation`;

    // Couple Names
    document.querySelectorAll(".couple-names").forEach(el => el.textContent = `${config.groomName} & ${config.brideName}`);
    document.querySelectorAll(".couple-names-mini").forEach(el => el.textContent = `${config.groomName} & ${config.brideName}`);

    // Wax Seal Text
    const sealTextEl = document.querySelector(".seal-text");
    if (sealTextEl) sealTextEl.textContent = config.initials || `${config.groomName.charAt(0)} & ${config.brideName.charAt(0)}`;

    // Envelope Dates and texts
    document.querySelectorAll(".invite-msg").forEach(el => el.textContent = config.cardInviteMsg);
    document.querySelectorAll(".invite-date").forEach(el => el.textContent = config.weddingDateText);
    document.querySelectorAll(".hero-date").forEach(el => el.textContent = config.weddingDateText.replace(/,/g, ' .').replace(/\s+/g, ' '));
    document.querySelectorAll(".marriage-date").forEach(el => el.textContent = `${config.weddingDateText} · ${config.events?.ceremony?.address.split(',').pop().trim()}`);

    // RSVP Deadlines
    const deadlineEl = document.querySelector(".rsvp-tagline");
    if (deadlineEl) deadlineEl.textContent = `Kindly respond by ${config.rsvpDeadlineText}`;

    // Event 1: Ceremony
    const cer = config.events?.ceremony;
    if (cer) {
        const card = document.querySelectorAll(".event-card")[0];
        if (card) {
            card.querySelector("h3").textContent = cer.title;
            card.querySelector(".time").textContent = cer.time;
            card.querySelector(".venue").textContent = cer.venue;
            card.querySelector(".address").textContent = cer.address;
            const link = card.querySelector("a.event-btn");
            if (link) link.href = cer.mapLink;
        }
    }

    // Event 2: Reception
    const rec = config.events?.reception;
    if (rec) {
        const card = document.querySelectorAll(".event-card")[1];
        if (card) {
            card.querySelector("h3").textContent = rec.title;
            card.querySelector(".time").textContent = rec.time;
            card.querySelector(".venue").textContent = rec.venue;
            card.querySelector(".address").textContent = rec.address;
            const link = card.querySelector("a.event-btn");
            if (link) link.href = rec.mapLink;
        }
    }

    // Apply theme
    applyThemePreset(config.themePreset || "gold-cream");
}

function applyThemePreset(preset) {
    document.body.className = `theme-${preset}`;
    config.themePreset = preset;

    // Sync theme selector
    const selector = document.getElementById("theme-preset");
    if (selector) selector.value = preset;
}

// Draw story timeline dynamically
function buildTimeline() {
    const list = config.storyTimeline || [];
    const container = document.querySelector(".timeline");
    if (!container) return;

    container.innerHTML = "";
    list.forEach((item, idx) => {
        const sideClass = idx % 2 === 0 ? "left-item" : "right-item";
        const div = document.createElement("div");
        div.className = `timeline-item ${sideClass}`;
        div.innerHTML = `
            <div class="timeline-badge"><i class="fas ${item.icon}"></i></div>
            <div class="timeline-card">
                <span class="timeline-date">${item.date}</span>
                <h3>${item.title}</h3>
                <p>${item.text}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// --- 3. LIVE CUSTOMIZER CONTROL DRAWER LOGIC ---
const customPanel = document.getElementById("customizer-panel");
const customToggle = document.getElementById("customizer-toggle");

if (customToggle) {
    customToggle.addEventListener("click", () => {
        customPanel.classList.toggle("active");
    });
}

// Helper to pre-populate customizer fields
function populateCustomizerInputs() {
    // Set text values
    document.getElementById("input-groom").value = config.groomName;
    document.getElementById("input-bride").value = config.brideName;
    document.getElementById("input-date").value = config.weddingDateText;
    document.getElementById("input-deadline").value = config.rsvpDeadlineText;

    const cer = config.events?.ceremony;
    if (cer) {
        document.getElementById("input-cer-title").value = cer.title;
        document.getElementById("input-cer-time").value = cer.time;
        document.getElementById("input-cer-venue").value = cer.venue;
        document.getElementById("input-cer-addr").value = cer.address;
    }

    const rec = config.events?.reception;
    if (rec) {
        document.getElementById("input-rec-title").value = rec.title;
        document.getElementById("input-rec-time").value = rec.time;
        document.getElementById("input-rec-venue").value = rec.venue;
        document.getElementById("input-rec-addr").value = rec.address;
    }
}

// Live Update functions (auto-save every change to localStorage)
function updateDetail(key, val) {
    config[key] = val;
    loadConfigValues();
    saveConfigToStorage();
}

function updateEventDetail(eventKey, detailKey, val) {
    if (!config.events[eventKey]) config.events[eventKey] = {};
    config.events[eventKey][detailKey] = val;
    loadConfigValues();
    saveConfigToStorage();
}

function updateTheme(val) {
    applyThemePreset(val);
    saveConfigToStorage();
}

// Reset all customizations back to original defaults
function resetCustomization() {
    if (!confirm("Reset all customizations back to the original default values?")) return;
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(config, window.WEDDING_CONFIG);
    config.events = JSON.parse(JSON.stringify(window.WEDDING_CONFIG.events));
    loadConfigValues();
    populateCustomizerInputs();
    buildTimeline();
}

// Exporter: download updated config.js file
function downloadNewConfig() {
    const backupObj = Object.assign({}, config);
    // Return standard template configuration code block
    const fileContent = `// --- WEDDING DIGITAL CARD CONFIGURATION DATA ---
const WEDDING_CONFIG = ${JSON.stringify(backupObj, null, 4)};
window.WEDDING_CONFIG = WEDDING_CONFIG;
`;
    const blob = new Blob([fileContent], { type: 'text/javascript;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "config.js");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 4. ENVELOPE OPENING TRANSITIONS ---
const envelopeCover = document.getElementById("envelope-cover");
const mainContent = document.getElementById("main-content");
const waxSeal = document.getElementById("wax-seal");

waxSeal.addEventListener("click", () => {
    envelopeCover.classList.add("open");
    initSynthAndPlay();

    setTimeout(() => {
        envelopeCover.classList.add("fade-out");
        mainContent.classList.remove("hidden");

        resizeCanvas();
        startScrollTracking();
        startCountdown();
        musicPlayer.play();
    }, 1800);
});

// --- 5. RESPONSIVE FLOWER PETAL CANVAS ENGINE ---
const canvas = document.getElementById("petals-canvas");
const ctx = canvas.getContext("2d");
let petalsArray = [];
let animFrame;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);

class Petal {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -canvas.height;
        this.size = Math.random() * 8 + 6;
        this.speedX = Math.random() * 1.5 - 0.75;
        this.speedY = Math.random() * 1.2 + 0.8;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.02 - 0.01;
        this.opacity = Math.random() * 0.4 + 0.4;

        const colorPalette = [
            `rgba(240, 210, 215, ${this.opacity})`,
            `rgba(255, 232, 236, ${this.opacity})`,
            `rgba(235, 192, 197, ${this.opacity})`,
            `rgba(250, 240, 235, ${this.opacity - 0.1})`
        ];
        this.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.angle) * 0.3;
        this.angle += this.rotationSpeed;

        if (this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) {
            this.y = -20;
            this.x = Math.random() * canvas.width;
            this.speedX = Math.random() * 1.5 - 0.75;
            this.speedY = Math.random() * 1.2 + 0.8;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size / 1.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function initPetals() {
    petalsArray = [];
    const count = canvas.width < 768 ? 25 : 60;
    for (let i = 0; i < count; i++) {
        petalsArray.push(new Petal());
    }
}

function animatePetals() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < petalsArray.length; i++) {
        petalsArray[i].update();
        petalsArray[i].draw();
    }
    animFrame = requestAnimationFrame(animatePetals);
}

resizeCanvas();
initPetals();
animatePetals();

// --- 6. WEB AUDIO AMBIENT SYSTEM ---
let audioCtx = null;
let isMuted = true;
let synthIntervalId = null;

class AmbientMusicPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentChordIndex = 0;
        this.step = 0;

        this.chords = [
            [65.41, 130.81, 164.81, 196.00, 246.94, 293.66, 329.63, 392.00], // Cmaj9
            [55.00, 110.00, 146.83, 164.81, 220.00, 261.63, 329.63, 392.00], // Am9
            [43.65, 87.31, 130.81, 174.61, 220.00, 261.63, 329.63, 440.00],  // Fmaj9
            [49.00, 98.00, 146.83, 196.00, 246.94, 293.66, 329.63, 392.00]   // G6/9
        ];
    }

    startScheduler() {
        if (synthIntervalId) clearInterval(synthIntervalId);
        synthIntervalId = setInterval(() => {
            if (!this.isPlaying) return;
            this.playStep();
        }, 400);
    }

    playStep() {
        const chord = this.chords[this.currentChordIndex];
        const now = audioCtx.currentTime;

        switch (this.step) {
            case 0:
                this.playTone(chord[0], now, 3.2, 0.08); // low bass
                this.playTone(chord[3], now, 0.8, 0.04);
                break;
            case 1:
                this.playTone(chord[5], now, 0.8, 0.03);
                break;
            case 2:
                this.playTone(chord[4], now, 0.8, 0.03);
                break;
            case 3:
                this.playTone(chord[6], now, 0.8, 0.04);
                break;
            case 4:
                this.playTone(chord[1], now, 2.5, 0.06);
                this.playTone(chord[3], now, 0.8, 0.04);
                break;
            case 5:
                this.playTone(chord[5], now, 0.8, 0.03);
                break;
            case 6:
                this.playTone(chord[7], now, 0.8, 0.05);
                break;
            case 7:
                this.playTone(chord[6], now, 0.8, 0.03);
                break;
        }

        this.step = (this.step + 1) % 8;
        if (this.step === 0) {
            this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
        }
    }

    playTone(frequency, startTime, duration, velocity = 0.05) {
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const oscHelper = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);

        oscHelper.type = 'sine';
        oscHelper.frequency.setValueAtTime(frequency * 2, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(filter);
        oscHelper.connect(filter);

        const delay = audioCtx.createDelay();
        delay.delayTime.value = 0.3;
        const delayGain = audioCtx.createGain();
        delayGain.gain.value = 0.25;

        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(audioCtx.destination);

        osc.start(startTime);
        oscHelper.start(startTime);
        osc.stop(startTime + duration + 0.5);
        oscHelper.stop(startTime + duration + 0.5);
    }

    play() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        this.isPlaying = true;
        isMuted = false;
        musicToggle.classList.add("playing");
        this.startScheduler();
    }

    stop() {
        this.isPlaying = false;
        isMuted = true;
        musicToggle.classList.remove("playing");
        if (synthIntervalId) {
            clearInterval(synthIntervalId);
            synthIntervalId = null;
        }
    }
}

const musicPlayer = new AmbientMusicPlayer();

function initSynthAndPlay() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

const musicToggle = document.getElementById("music-toggle");
musicToggle.addEventListener("click", () => {
    initSynthAndPlay();
    if (isMuted) {
        musicPlayer.play();
    } else {
        musicPlayer.stop();
    }
});

// --- 7. ELEGANT COUNTDOWN TIMER ---
function startCountdown() {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    function update() {
        const targetDate = new Date(config.countdownTarget || "2026-10-10T16:00:00").getTime();
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            document.getElementById("timer").innerHTML = `<h2 class="section-title text-center">We Are Married!</h2><div class="elegant-line-sub"></div>`;
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

// --- 8. SCROLL REVEAL TRIGGERS ---
function startScrollTracking() {
    const storyItems = document.querySelectorAll(".timeline-item");
    const eventCards = document.querySelectorAll(".event-card");
    const galleryItems = document.querySelectorAll(".gallery-item");

    const elementsToReveal = [...storyItems, ...eventCards, ...galleryItems];
    elementsToReveal.forEach(el => el.classList.add("hidden-scroll"));

    function checkReveal() {
        const triggerPos = window.innerHeight * 0.85;

        elementsToReveal.forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < triggerPos) {
                el.classList.add("reveal-scroll");
                el.classList.add("visible");
            }
        });
    }

    window.addEventListener("scroll", checkReveal);
    checkReveal();
}

// --- 9. PHOTO GALLERY LIGHTBOX ---
const galleryPhotos = [
    { url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop", caption: "Engagement Portrait Session" },
    { url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop", caption: "Our Favorite Nature Walks" },
    { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop", caption: "Coffee Shop Cozy Talks" },
    { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop", caption: "Eternity Smiles" },
    { url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop", caption: "Exploring the Golden Gate Cliffs" },
    { url: "https://images.unsplash.com/photo-1482575832494-771f74bf6857?q=80&w=1200&auto=format&fit=crop", caption: "Holding Hands into Tomorrow" }
];

let activeLightboxIndex = 0;
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");

function openLightbox(index) {
    activeLightboxIndex = index;
    lightbox.style.display = "flex";
    updateLightboxPic();
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    lightbox.style.display = "none";
    document.body.style.overflow = "auto";
}

function changeLightboxPic(val) {
    activeLightboxIndex += val;
    if (activeLightboxIndex >= galleryPhotos.length) activeLightboxIndex = 0;
    if (activeLightboxIndex < 0) activeLightboxIndex = galleryPhotos.length - 1;
    updateLightboxPic();
}

function updateLightboxPic() {
    lightboxImg.src = galleryPhotos[activeLightboxIndex].url;
    lightboxCaption.textContent = galleryPhotos[activeLightboxIndex].caption;
}

document.addEventListener("keydown", (e) => {
    if (lightbox.style.display === "flex") {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") changeLightboxPic(-1);
        if (e.key === "ArrowRight") changeLightboxPic(1);
    }
});

// --- 10. RSVP SUBMISSIONS & GUESTBOOK WISHES WALL RENDER ---
function compileWishesWall() {
    const list = getRSVPs();
    const guestWall = document.getElementById("guestbook-wall");
    if (!guestWall) return;
    guestWall.innerHTML = "";

    const wishesList = list
        .filter(entry => entry.wishes && entry.wishes.trim() !== "")
        .reverse();

    if (wishesList.length === 0) {
        guestWall.innerHTML = `<div class="text-center" style="grid-column: 1/-1; font-style: italic; color: #a89c97;">No messages shared yet. Leave your best wishes in the RSVP form!</div>`;
        return;
    }

    wishesList.forEach(entry => {
        const card = document.createElement("div");
        card.className = "wish-card";
        const timestamp = entry.timestamp ? entry.timestamp.split(" ")[0] : "";
        card.innerHTML = `
            <p class="wish-text">"${escapeHtml(entry.wishes)}"</p>
            <p class="wish-author">${escapeHtml(entry.name)}</p>
            <p class="wish-meta">${timestamp}</p>
        `;
        guestWall.appendChild(card);
    });
}

const attendanceRadios = document.getElementsByName("attendance");
const detailsDiv = document.getElementById("rsvp-details");
const guestCountSelect = document.getElementById("guest-count");
const dietPrefSelect = document.getElementById("diet-pref");

if (attendanceRadios.length) {
    attendanceRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "declined") {
                detailsDiv.style.maxHeight = "0px";
                detailsDiv.style.opacity = "0";
                detailsDiv.style.overflow = "hidden";
                detailsDiv.style.marginTop = "0px";
                guestCountSelect.value = "1";
                dietPrefSelect.value = "none";
            } else {
                detailsDiv.style.maxHeight = "300px";
                detailsDiv.style.opacity = "1";
                detailsDiv.style.marginTop = "1.5rem";
            }
        });
    });
}

function handleRSVPSubmit(event) {
    event.preventDefault();

    const nameVal = document.getElementById("guest-name").value.trim();
    const emailVal = document.getElementById("guest-email").value.trim();
    const attendanceVal = document.querySelector('input[name="attendance"]:checked').value;
    const guestCountVal = parseInt(guestCountSelect.value, 10);
    const dietVal = dietPrefSelect.value;
    const wishesVal = document.getElementById("wishes").value.trim();

    if (!nameVal || !emailVal) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newRSVP = {
        name: nameVal,
        email: emailVal,
        attendance: attendanceVal,
        guests: attendanceVal === "attending" ? guestCountVal : 0,
        diet: attendanceVal === "attending" ? dietVal : "none",
        wishes: wishesVal,
        timestamp: formattedDate
    };

    const currentList = getRSVPs();
    currentList.push(newRSVP);
    saveRSVPs(currentList);

    compileWishesWall();

    const modalSuccessMsg = document.getElementById("rsvp-success-msg");
    if (attendanceVal === "attending") {
        modalSuccessMsg.textContent = `${nameVal}, your invitation acceptance has been joyfully received. We can't wait to celebrate with you!`;
    } else {
        modalSuccessMsg.textContent = `${nameVal}, thank you for letting us know. You will be missed, but we appreciate your warm thoughts!`;
    }

    document.getElementById("rsvp-modal").classList.add("active");

    document.getElementById("rsvp-form").reset();
    detailsDiv.style.maxHeight = "300px";
    detailsDiv.style.opacity = "1";
}

function closeRSVPModal() {
    document.getElementById("rsvp-modal").classList.remove("active");
}

// --- 11. CALENDAR GENERATION FOR OUTLOOK/APPLE ---
function addToCalendar(type) {
    let title = "";
    let description = "Please join us to celebrate our wedding!";
    let location = "";
    let startDate = "";
    let endDate = "";

    if (type === 'ceremony') {
        const cer = config.events?.ceremony;
        title = `${config.groomName} and ${config.brideName} - ${cer?.title || "Wedding Ceremony"}`;
        location = cer?.address || "The Glasshouse Conservatory, San Francisco";
        startDate = "20261010T160000";
        endDate = "20261010T170000";
    } else {
        const rec = config.events?.reception;
        title = `${config.groomName} and ${config.brideName} - ${rec?.title || "Grand Reception"}`;
        location = rec?.address || "The Golden Gate Ballroom, San Francisco";
        startDate = "20261010T180000";
        endDate = "20261010T230000";
    }

    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Wedding Invitation//NONSGML v1.0//EN",
        "BEGIN:VEVENT",
        `UID:${type}-20261010-wedding-rsvp`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${type}_event.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 12. ADMIN GUESTLIST DASHBOARD ---
const adminModal = document.getElementById("admin-modal");

function promptAdmin() {
    const code = prompt("Enter the secure Administrator Access Passcode:");
    if (code === null) return;

    if (code === (config.adminPasscode || SECRET_PASSCODE)) {
        openAdminModal();
    } else {
        alert("Incorrect administrator authentication code. Access Denied.");
    }
}

function openAdminModal() {
    renderAdminTable();
    adminModal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeAdminModal() {
    adminModal.classList.remove("active");
    document.body.style.overflow = "auto";
}

function renderAdminTable() {
    const list = getRSVPs();
    const tbody = document.getElementById("rsvp-table-body");
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="font-style: italic;">No RSVP records registered yet.</td></tr>`;
        return;
    }

    list.forEach(entry => {
        const row = document.createElement("tr");
        const isAttending = entry.attendance === "attending";
        const statusBadge = isAttending
            ? `<span class="status-pill status-attending">Yes</span>`
            : `<span class="status-pill status-declined">No</span>`;

        row.innerHTML = `
            <td><strong>${escapeHtml(entry.name)}</strong></td>
            <td>${escapeHtml(entry.email)}</td>
            <td>${statusBadge}</td>
            <td>${isAttending ? entry.guests : "0"}</td>
            <td style="text-transform: capitalize;">${isAttending ? escapeHtml(entry.diet) : "N/A"}</td>
            <td><div style="max-height: 80px; overflow-y: auto; max-width: 250px;" title="${escapeHtml(entry.wishes)}">${escapeHtml(entry.wishes) || "-"}</div></td>
            <td>${escapeHtml(entry.timestamp || "")}</td>
        `;
        tbody.appendChild(row);
    });
}

function clearRSVPs() {
    if (confirm("Are you absolutely sure you want to delete all RSVP guest entries? This action is permanent!")) {
        saveRSVPs(DEFAULT_WISHES);
        renderAdminTable();
        compileWishesWall();
        alert("Database cleared and reset to sample entries.");
    }
}

function exportRSVPs() {
    const list = getRSVPs();
    let csvContent = "\ufeff";
    csvContent += "Guest Name,Email,Attending,Guests,Dietary Preference,Wishes,Timestamp\r\n";

    list.forEach(r => {
        const name = `"${r.name.replace(/"/g, '""')}"`;
        const email = `"${r.email.replace(/"/g, '""')}"`;
        const status = r.attendance === 'attending' ? "Yes" : "No";
        const guests = r.attendance === 'attending' ? r.guests : 0;
        const diet = r.attendance === 'attending' ? `"${r.diet.replace(/"/g, '""')}"` : "N/A";
        const wishes = `"${(r.wishes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
        const time = `"${r.timestamp || ''}"`;

        csvContent += `${name},${email},${status},${guests},${diet},${wishes},${time}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "wedding_rsvp_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility: simple regex HTML escaping to block cross-site inputs in comment boards
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- 13. ONLOAD INITIALIZATIONS ---
window.addEventListener("DOMContentLoaded", () => {
    loadConfigFromStorage();   // Restore any saved customizations first
    loadConfigValues();
    buildTimeline();
    populateCustomizerInputs();
    compileWishesWall();
});
