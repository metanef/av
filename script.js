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
        dominationTitle: "Domination",
        dominationDesc: "Uniquement des gages, à ton service.",
        domCatNonSexy: "Normal",
        domCatSexy: "Sexy",
        dareTitleDom: "GAGE",
        dareSubDom: "Obéis à l'ordre",
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
        dominationTitle: "Domination",
        dominationDesc: "Dares only, at your service.",
        domCatNonSexy: "Normal",
        domCatSexy: "Sexy",
        dareTitleDom: "DARE",
        dareSubDom: "Obey the command",
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
let dominationCategory = 'nonsexy';
let dominationDifficulty = 1;
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
        hot: 'var(--accent-hot)',
        domination: 'var(--accent-domination)'
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

function setDominationCategory(category) {
    dominationCategory = category;
    const nonSexyBtn = document.getElementById('dom-cat-nonsexy');
    const sexyBtn = document.getElementById('dom-cat-sexy');
    nonSexyBtn.classList.toggle('bg-purple-500/20', category === 'nonsexy');
    nonSexyBtn.classList.toggle('text-white', category === 'nonsexy');
    nonSexyBtn.classList.toggle('text-purple-300/50', category !== 'nonsexy');
    sexyBtn.classList.toggle('bg-purple-500/20', category === 'sexy');
    sexyBtn.classList.toggle('text-white', category === 'sexy');
    sexyBtn.classList.toggle('text-purple-300/50', category !== 'sexy');
    if (currentMode !== 'domination') setMode('domination');
}

function updateDominationDifficulty(val) {
    dominationDifficulty = parseInt(val, 10);
    const labels = ['dom-label-1', 'dom-label-2', 'dom-label-3'];
    labels.forEach((l, i) => {
        const el = document.getElementById(l);
        if (el) el.style.opacity = (i + 1 === dominationDifficulty) ? '1' : '0.3';
    });
    if (currentMode !== 'domination') setMode('domination');
}

function initGame() {
    switchView('view-home', 'view-game');
    const indicator = document.getElementById('mode-indicator');
    const t = translations[currentLang];
    const truthOption = document.getElementById('truth-option');
    const dareTitleEl = document.getElementById('dare-title');
    const dareSubEl = document.getElementById('dare-sub');

    if (currentMode === 'friends') {
        indicator.innerText = t.modeFriends;
        indicator.style.borderColor = 'rgba(99, 102, 241, 0.2)';
        indicator.style.color = '#818cf8';
        truthOption.classList.remove('hidden');
        dareTitleEl.innerText = t.dareTitle;
        dareSubEl.innerText = t.dareSub;
    } else if (currentMode === 'hot') {
        indicator.innerText = [t.modeSoft, t.modeFlirt, t.modeHard][currentDifficulty - 1];
        indicator.style.borderColor = 'rgba(244, 63, 94, 0.2)';
        indicator.style.color = '#fb7185';
        truthOption.classList.remove('hidden');
        dareTitleEl.innerText = t.dareTitle;
        dareSubEl.innerText = t.dareSub;
    } else if (currentMode === 'domination') {
        const catLabel = dominationCategory === 'sexy' ? t.domCatSexy : t.domCatNonSexy;
        indicator.innerText = `${catLabel.toUpperCase()} ${dominationDifficulty}`;
        indicator.style.borderColor = 'rgba(168, 85, 247, 0.2)';
        indicator.style.color = '#c084fc';
        truthOption.classList.add('hidden');
        dareTitleEl.innerText = t.dareTitleDom;
        dareSubEl.innerText = t.dareSubDom;
    }

    usedCards = { truth: [], dare: [] };
    initChart();
}

function getActiveTypes() {
    return currentMode === 'domination' ? ['dare'] : ['truth', 'dare'];
}

function getPoolKey() {
    if (currentMode === 'friends') return 'friends';
    if (currentMode === 'hot') return `hot${currentDifficulty}`;
    if (currentMode === 'domination') return `dom_${dominationCategory}${dominationDifficulty}`;
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
    const total = getTotalCards();
    chart = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Vues', 'Restantes'],
            datasets: [{
                data: [0, total],
                backgroundColor: [currentMode === 'friends' ? '#6366f1' : (currentMode === 'domination' ? '#a855f7' : '#f43f5e'), '#1f2937'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });
}

function getTotalCards() {
    const pool = allCards[currentLang][getPoolKey()];
    return getActiveTypes().reduce((sum, type) => sum + (pool[type] ? pool[type].length : 0), 0);
}

function updateChart() {
    const total = getTotalCards();
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
window.setDominationCategory = setDominationCategory;
window.updateDominationDifficulty = updateDominationDifficulty;
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