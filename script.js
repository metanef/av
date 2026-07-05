"use strict";
// ==========================================
// DONNÉES DES CARTES (chargées depuis cards.json)
// ==========================================
let cards = null;
async function loadCards() {
    const response = await fetch('cards.json');
    if (!response.ok) {
        throw new Error(`Impossible de charger cards.json (HTTP ${response.status})`);
    }
    return await response.json();
}
// ==========================================
// ÉTAT DE L'APPLICATION
// ==========================================
let currentMode = null;
let currentDifficulty = 1;
let usedCards = { truth: [], dare: [] };
let chart = null; // instance Chart.js
// ==========================================
// LOGIQUE DE JEU
// ==========================================
function setMode(mode) {
    if (!cards)
        return; // les cartes ne sont pas encore chargées
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
        if (el)
            el.style.opacity = (i + 1 === parseInt(val, 10)) ? '1' : '0.3';
    });
    if (currentMode !== 'hot')
        setMode('hot');
}
function initGame() {
    switchView('view-home', 'view-game');
    const indicator = document.getElementById('mode-indicator');
    if (currentMode === 'friends') {
        indicator.innerText = "AMIS";
        indicator.style.borderColor = 'rgba(99, 102, 241, 0.2)';
        indicator.style.color = '#818cf8';
    }
    else {
        indicator.innerText = ["SOFT", "FLIRT", "HARD"][currentDifficulty - 1];
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
    if (!cards)
        return;
    const poolKey = getPoolKey();
    const available = cards[poolKey][type].filter((_, i) => !usedCards[type].includes(i));
    if (available.length === 0) {
        alert("Paquet vide ! On remélange.");
        usedCards[type] = [];
        return drawCard(type);
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    const cardText = available[randomIndex];
    const originalIndex = cards[poolKey][type].indexOf(cardText);
    usedCards[type].push(originalIndex);
    const cardTextEl = document.getElementById('card-text');
    cardTextEl.innerText = cardText;
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
// NAVIGATION / VUES
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
    if (!s.classList.contains('hidden'))
        updateChart();
}
// ==========================================
// GRAPHIQUE (Chart.js)
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
    const statsInfo = document.getElementById('stats-info');
    statsInfo.innerText = `${seen} / ${total} cartes explorées`;
}
// ==========================================
// EXPOSITION GLOBALE (pour les onclick= dans le HTML)
// ==========================================
window.setMode = setMode;
window.updateDifficulty = updateDifficulty;
window.initGame = initGame;
window.drawCard = drawCard;
window.nextPlayer = nextPlayer;
window.goBack = goBack;
window.toggleStats = toggleStats;
// ==========================================
// DÉMARRAGE : chargement des cartes au lancement
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    try {
        cards = await loadCards();
    }
    catch (err) {
        console.error(err);
        alert("Erreur : impossible de charger cards.json. Sers le site via un serveur local (voir README.md).");
    }
});