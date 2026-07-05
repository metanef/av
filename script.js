"use strict";

// ==========================================
// TRANSLATIONS (static UI text)
// ==========================================

const translations = {
    fr: {
        chooseUniverse: "Choisissez votre univers",
        friendsTitle: "Amis & Chill",
        friendsDesc: "Secrets, nostalgie et rires.",
        hotDesc: "Flirt, tension et audace.",
        start: "COMMENCER",
        yourTurn: "C'est ton tour...",
        truthTitle: "VÉRITÉ",
        truthSub: "Avoue tout",
        orWord: "OU",
        dareTitle: "ACTION",
        dareSub: "Relève le défi",
        nextPlayer: "JOUEUR SUIVANT",
        deckProgress: "PROGRÈS DU PAQUET",
        modeFriends: "AMIS",
        modeSoft: "SOFT",
        modeFlirt: "FLIRT",
        modeHard: "HARD",
        deckEmpty: "Paquet vide ! On remélange.",
        cardsExplored: (seen, total) => `${seen} / ${total} cartes explorées`,
        loadError: "Erreur : impossible de charger cards.json. Sers le site via un serveur local (voir README.md)."
    },
    en: {
        chooseUniverse: "Choose your universe",
        friendsTitle: "Friends & Chill",
        friendsDesc: "Secrets, nostalgia and laughs.",
        hotDesc: "Flirting, tension and boldness.",
        start: "START",
        yourTurn: "Your turn...",
        truthTitle: "TRUTH",
        truthSub: "Confess everything",
        orWord: "OR",
        dareTitle: "DARE",
        dareSub: "Take the challenge",
        nextPlayer: "NEXT PLAYER",
        deckProgress: "DECK PROGRESS",
        modeFriends: "FRIENDS",
        modeSoft: "SOFT",
        modeFlirt: "FLIRT",
        modeHard: "HARD",
        deckEmpty: "Deck empty! Reshuffling.",
        cardsExplored: (seen, total) => `${seen} / ${total} cards explored`,
        loadError: "Error: could not load cards.json. Serve the site via a local server (see README.md)."
    }
};

// ==========================================
// CARDS DATA (loaded from cards.json)
// ==========================================

let allCards = null; // { fr: {...}, en: {...} }

async function loadCards() {
    const response = await fetch('cards.json');
    if (!response.ok) {
        throw new Error(`Could not load cards.json (HTTP ${response.status})`);
    }
    return await response.json();
}

// ==========================================
// APP STATE
// ==========================================

let currentMode = null;
let currentDifficulty = 1;
let currentLang = 'fr';
let usedCards = { truth: [], dare: [] };
let chart = null; // Chart.js instance

// ==========================================
// LANGUAGE
// ==========================================

function setLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    document.getElementById('lang-fr').classList.toggle('text-white', lang === 'fr');
    document.getElementById('lang-fr').classList.toggle('border-white', lang === 'fr');
    document.getElementById('lang-en').classList.toggle('text-white', lang === 'en');
    document.getElementById('lang-en').classList.toggle('border-white', lang === 'en');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.innerText = translations[lang][key];
    });
}

// ==========================================
// GAME LOGIC
// ==========================================

function setMode(mode) {
    if (!allCards) return; // cards not loaded yet
    currentMode = mode;
    const startBtn = document.getElementById('btn-start');
    startBtn.classList.remove('hidden');
    const indicators = {
        friends: 'var(--accent-friends)',
        hot: 'var(--accent-hot)'
    };
    startBtn.style.backgroundColor = indicators[mode];
    startBtn.style.color = 'white';
}

function updateDifficulty(val) {
    currentDifficulty = parseInt(val, 10);
    const labels = ['label-soft', 'label-flirt', 'label-hard'];
    labels.forEach((l, i) => {
        const el = document.getElementById(l);
        if (el) el.style.opacity = (i + 1 === parseInt(val, 10)) ? '1' : '0.3';
    });
    if (currentMode !== 'hot') setMode('hot');
}

function initGame() {
    switchView('view-home', 'view-game');
    const indicator = document.getElementById('mode-indicator');
    const t = translations[currentLang];

    if (currentMode === 'friends') {
        indicator.innerText = t.modeFriends;
        indicator.style.borderColor = 'rgba(99, 102, 241, 0.2)';
        indicator.style.color = '#818cf8';
    } else {
        indicator.innerText = [t.modeSoft, t.modeFlirt, t.modeHard][currentDifficulty - 1];
        indicator.style.borderColor = 'rgba(244, 63, 94, 0.2)';
        indicator.style.color = '#fb7185';
    }

    usedCards = { truth: [], dare: [] };
    initChart();
}

function getPoolKey() {
    return currentMode === 'friends' ? 'friends' : `hot${currentDifficulty}`;
}

function drawCard(type) {
    if (!allCards) return;
    const pool = allCards[currentLang][getPoolKey()];
    const available = pool[type].filter((_, i) => !usedCards[type].includes(i));

    if (available.length === 0) {
        alert(translations[currentLang].deckEmpty);
        usedCards[type] = [];
        return drawCard(type);
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const cardText = available[randomIndex];
    const originalIndex = pool[type].indexOf(cardText);

    usedCards[type].push(originalIndex);

    document.getElementById('card-text').innerText = cardText;
    document.getElementById('choice-screen').classList.add('hidden');
    const revealScreen = document.getElementById('reveal-screen');
    revealScreen.classList.remove('hidden');
    setTimeout(() => revealScreen.classList.add('opacity-100'), 50);

    updateChart();
}

function nextPlayer() {
    const revealScreen = document.getElementById('reveal-screen');
    revealScreen.classList.remove('opacity-100');
    setTimeout(() => {
        revealScreen.classList.add('hidden');
        document.getElementById('choice-screen').classList.remove('hidden');
    }, 300);
}

// ==========================================
// NAVIGATION / VIEWS
// ==========================================

function switchView(from, to) {
    const f = document.getElementById(from);
    const t = document.getElementById(to);
    f.classList.add('opacity-0');
    setTimeout(() => {
        f.classList.add('hidden');
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('opacity-100'), 50);
    }, 400);
}

function goBack() {
    location.reload();
}

function toggleStats() {
    const s = document.getElementById('view-stats');
    s.classList.toggle('hidden');
    if (!s.classList.contains('hidden')) updateChart();
}

// ==========================================
// CHART (Chart.js)
// ==========================================

function initChart() {
    const canvas = document.getElementById('deckChart');
    const ctx = canvas.getContext('2d');
    chart = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Vues', 'Restantes'],
            datasets: [{
                data: [0, 40],
                backgroundColor: [currentMode === 'friends' ? '#6366f1' : '#f43f5e', '#1f2937'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });
}

function updateChart() {
    const total = 40;
    const seen = usedCards.truth.length + usedCards.dare.length;
    chart.data.datasets[0].data = [seen, total - seen];
    chart.update();
    document.getElementById('stats-info').innerText = translations[currentLang].cardsExplored(seen, total);
}

// ==========================================
// GLOBAL EXPOSURE (for the onclick= handlers in the HTML)
// ==========================================

window.setMode = setMode;
window.updateDifficulty = updateDifficulty;
window.initGame = initGame;
window.drawCard = drawCard;
window.nextPlayer = nextPlayer;
window.goBack = goBack;
window.toggleStats = toggleStats;
window.setLang = setLang;

// ==========================================
// STARTUP: load cards.json and set default language
// ==========================================

window.addEventListener('DOMContentLoaded', async () => {
    setLang('fr');
    try {
        allCards = await loadCards();
    } catch (err) {
        console.error(err);
        alert(translations[currentLang].loadError);
    }
});