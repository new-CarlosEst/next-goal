// ── UI Elements ──────────────────────────────────────────────────────────────
const noMatchMsg     = document.getElementById('no-match-message');
const scoreboardList = document.getElementById('scoreboard-list');

// ── State ─────────────────────────────────────────────────────────────────────
// matchScores[id] = { home, away, clockSeconds, isLive, isBreak, periodLabel }
let matchScores           = {};
// matchClockIntervals[id] = setInterval handle – local 1-second ticker
let matchClockIntervals   = {};
let lastCheckedStorageStr = null;
let pollIntervalId        = null;

// ── Translations ──────────────────────────────────────────────────────────────
const TEAM_TRANSLATIONS = {
    "norway":"Noruega","france":"Francia","saudi arabia":"Arabia Saudí",
    "cape verde":"Cabo Verde","spain":"España","uruguay":"Uruguay",
    "iraq":"Irak","senegal":"Senegal","united states":"Estados Unidos",
    "england":"Inglaterra","germany":"Alemania","italy":"Italia",
    "argentina":"Argentina","brazil":"Brasil","netherlands":"Países Bajos",
    "croatia":"Croacia","portugal":"Portugal","belgium":"Bélgica",
    "switzerland":"Suiza","japan":"Japón","mexico":"México",
    "morocco":"Marruecos","colombia":"Colombia","denmark":"Dinamarca",
    "south korea":"Corea del Sur","ukraine":"Ucrania","sweden":"Suecia",
    "poland":"Polonia","peru":"Perú","chile":"Chile","ecuador":"Ecuador",
    "venezuela":"Venezuela","paraguay":"Paraguay","bolivia":"Bolivia",
    "canada":"Canadá","costa rica":"Costa Rica","panama":"Panamá",
    "honduras":"Honduras","el salvador":"El Salvador","jamaica":"Jamaica",
    "cameroon":"Camerún","ghana":"Ghana","nigeria":"Nigeria",
    "algeria":"Argelia","tunisia":"Túnez","egypt":"Egipto","turkey":"Turquía",
    "greece":"Grecia","austria":"Austria","czechia":"República Checa",
    "czech republic":"República Checa","slovakia":"Eslovaquia",
    "slovenia":"Eslovenia","hungary":"Hungría","romania":"Rumanía",
    "bulgaria":"Bulgaria","finland":"Finlandia","ireland":"Irlanda",
    "republic of ireland":"Irlanda","northern ireland":"Irlanda del Norte",
    "scotland":"Escocia","wales":"Gales","iceland":"Islandia",
    "new zealand":"Nueva Zelanda","australia":"Australia","china":"China",
    "south africa":"Sudáfrica","ivory coast":"Costa de Marfil",
    "cote d'ivoire":"Costa de Marfil","qatar":"Catar","iran":"Irán",
    "uk":"Reino Unido","united kingdom":"Reino Unido",
    "bayern munich":"Bayern Múnich","fc bayern munchen":"Bayern Múnich",
    "ac milan":"Milán","inter milan":"Inter de Milán",
    "sporting cp":"Sporting de Portugal","braga":"Sporting de Braga",
    "maritimo":"Marítimo","malmo ff":"Malmö",
    "shakhtar donetsk":"Shakhtar Donetsk","dynamo kyiv":"Dinamo de Kiev"
};

function translateTeamName(name) {
    if (!name) return "";
    return TEAM_TRANSLATIONS[name.toLowerCase().trim()] || name;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format elapsed seconds → "MM:SS" */
function formatClock(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function formatToSpainTime(utcDateString) {
    return new Date(utcDateString).toLocaleTimeString('es-ES', {
        timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false
    });
}

/**
 * Returns:
 *   { class, text, periodLabel, isLive, isBreak }
 *
 * - isLive  → clock ticker should run
 * - isBreak → pause state (halftime / ET halftime / penalties): no ticker, show label only
 * - periodLabel → "1ª" | "2ª" | "DESCANSO" | "P. EXTRA 1" | "P. EXTRA 2" | "DESC. ET" | "PENALTIS"
 */
function getMatchStatus(event) {
    const state    = event.status?.type?.state;
    const typeName = event.status?.type?.name   || '';
    const period   = event.status?.period        || 1;

    // ── Finished ────────────────────────────────────────────────────────────
    if (state === 'post' ||
        typeName === 'STATUS_FINAL' ||
        typeName === 'STATUS_FULL_TIME') {
        return { class: 'final', text: 'FINAL', periodLabel: 'FINAL', isLive: false, isBreak: false };
    }

    // ── Not started ─────────────────────────────────────────────────────────
    if (state === 'pre' || typeName === 'STATUS_SCHEDULED') {
        const diffMs = new Date(event.date) - new Date();
        if (diffMs > 0) {
            return { class: 'upcoming', text: formatToSpainTime(event.date),
                     periodLabel: '', isLive: false, isBreak: false };
        }
        // Kickoff time passed but still 'pre' → treat as live
        return { class: 'live', text: 'VIVO', periodLabel: '1ª', isLive: true, isBreak: false };
    }

    // ── In progress ─────────────────────────────────────────────────────────
    if (state === 'in') {
        // ── Break states (no clock running) ─────────────────────────────────
        if (typeName === 'STATUS_HALFTIME') {
            return { class: 'live', text: 'DESCANSO',
                     periodLabel: 'DESCANSO', isLive: false, isBreak: true };
        }
        if (typeName === 'STATUS_EXTRA_TIME_HALF_TIME') {
            return { class: 'live', text: 'DESC. PRÓRROGA',
                     periodLabel: 'DESC. ET', isLive: false, isBreak: true };
        }
        if (typeName === 'STATUS_PENALTY' || typeName === 'STATUS_PENALTIES') {
            return { class: 'live', text: 'PENALTIS',
                     periodLabel: 'PENALTIS', isLive: false, isBreak: true };
        }

        // ── Running states ───────────────────────────────────────────────────
        if (typeName === 'STATUS_FIRST_HALF')         return { class:'live', text:'VIVO', periodLabel:'1ª',        isLive:true, isBreak:false };
        if (typeName === 'STATUS_SECOND_HALF')        return { class:'live', text:'VIVO', periodLabel:'2ª',        isLive:true, isBreak:false };
        if (typeName === 'STATUS_FIRST_EXTRA_TIME')   return { class:'live', text:'VIVO', periodLabel:'P. EXT 1',  isLive:true, isBreak:false };
        if (typeName === 'STATUS_SECOND_EXTRA_TIME')  return { class:'live', text:'VIVO', periodLabel:'P. EXT 2',  isLive:true, isBreak:false };
        if (typeName === 'STATUS_OVERTIME')           return { class:'live', text:'VIVO', periodLabel:'PRÓRROGA',  isLive:true, isBreak:false };

        // Generic STATUS_IN_PROGRESS — derive period from the period number
        if (period === 1) return { class:'live', text:'VIVO', periodLabel:'1ª',       isLive:true, isBreak:false };
        if (period === 2) return { class:'live', text:'VIVO', periodLabel:'2ª',       isLive:true, isBreak:false };
        if (period === 3) return { class:'live', text:'VIVO', periodLabel:'P. EXT 1', isLive:true, isBreak:false };
        if (period === 4) return { class:'live', text:'VIVO', periodLabel:'P. EXT 2', isLive:true, isBreak:false };
        if (period >= 5)  return { class:'live', text:'VIVO', periodLabel:'PENALTIS', isLive:false, isBreak:true };

        return { class:'live', text:'VIVO', periodLabel:'', isLive:true, isBreak:false };
    }

    // ── Fallback by elapsed time ─────────────────────────────────────────────
    const diffMs = new Date(event.date) - new Date();
    if (diffMs > 0)         return { class:'upcoming', text: formatToSpainTime(event.date), periodLabel:'', isLive:false, isBreak:false };
    if (diffMs < -7_200_000) return { class:'final',   text:'FINAL',  periodLabel:'FINAL', isLive:false, isBreak:false };
    return                         { class:'live',    text:'VIVO',   periodLabel:'1ª',   isLive:true,  isBreak:false };
}

function getFormattedDateString(dateString) {
    const d = new Date(dateString);
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

// ── Build pill label string ───────────────────────────────────────────────────
function buildPillLabel(status, clockSecs) {
    if (status.isBreak)  return status.periodLabel;              // DESCANSO / DESC. ET / PENALTIS
    if (!status.isLive)  return status.text;                     // FINAL / HH:MM hora
    if (status.periodLabel) {
        return `${status.periodLabel} · ${formatClock(clockSecs)}`;
    }
    return formatClock(clockSecs);
}

// ── Clock ticker ──────────────────────────────────────────────────────────────

function startClockTicker(matchId) {
    if (matchClockIntervals[matchId]) clearInterval(matchClockIntervals[matchId]);

    matchClockIntervals[matchId] = setInterval(() => {
        const state = matchScores[matchId];
        if (!state || !state.isLive) {
            clearInterval(matchClockIntervals[matchId]);
            delete matchClockIntervals[matchId];
            return;
        }

        state.clockSeconds += 1;

        const card = document.getElementById('card-' + matchId);
        if (!card) { clearInterval(matchClockIntervals[matchId]); delete matchClockIntervals[matchId]; return; }

        const pill = card.querySelector('.bug-time-pill');
        if (pill) {
            const label = state.periodLabel
                ? `${state.periodLabel} · ${formatClock(state.clockSeconds)}`
                : formatClock(state.clockSeconds);
            // Replace text node only (::before CSS dot stays untouched)
            while (pill.lastChild && pill.lastChild.nodeType === Node.TEXT_NODE) pill.removeChild(pill.lastChild);
            pill.appendChild(document.createTextNode(label));
        }
    }, 1000);
}

function stopClockTicker(matchId) {
    if (matchClockIntervals[matchId]) {
        clearInterval(matchClockIntervals[matchId]);
        delete matchClockIntervals[matchId];
    }
}

// ── Set pill text without touching ::before ───────────────────────────────────
function setPillText(pill, label) {
    while (pill.lastChild && pill.lastChild.nodeType === Node.TEXT_NODE) pill.removeChild(pill.lastChild);
    pill.appendChild(document.createTextNode(label));
}

// ── Load / render matches ─────────────────────────────────────────────────────

function loadMatchesFromStorage() {
    const stored = localStorage.getItem('selectedMatches');

    if (!stored || JSON.parse(stored).length === 0) {
        noMatchMsg.classList.remove('hidden');
        scoreboardList.innerHTML = '';
        Object.keys(matchClockIntervals).forEach(stopClockTicker);
        matchScores = {};
        if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
        return;
    }

    const matches = JSON.parse(stored);
    noMatchMsg.classList.add('hidden');

    const currentIds = new Set(matches.map(m => m.id));

    // Remove stale cards
    scoreboardList.querySelectorAll('.match-bug').forEach(card => {
        const id = card.id.replace('card-', '');
        if (!currentIds.has(id)) { card.remove(); delete matchScores[id]; stopClockTicker(id); }
    });

    // Add new cards (already-rendered ones are updated by pollLiveScores)
    matches.forEach(match => {
        if (document.getElementById('card-' + match.id)) return;

        const isUpcoming = match.statusClass === 'upcoming';

        const card = document.createElement('div');
        card.className = 'match-bug';
        card.id = 'card-' + match.id;
        card.innerHTML = `
            <div class="bug-score-row">
                <img class="bug-team-logo home-logo" src="${match.homeLogo}" alt="">
                <div class="bug-score-center">
                    <span class="bug-score home-score">${isUpcoming ? 0 : (match.homeScore || 0)}</span>
                    <span class="bug-score-dash">-</span>
                    <span class="bug-score away-score">${isUpcoming ? 0 : (match.awayScore || 0)}</span>
                </div>
                <img class="bug-team-logo away-logo" src="${match.awayLogo}" alt="">
            </div>
            <div class="bug-time-row">
                <span class="bug-time-pill ${match.statusClass || 'upcoming'}">${match.status || ''}</span>
            </div>
        `;
        scoreboardList.appendChild(card);

        matchScores[match.id] = {
            home: parseInt(match.homeScore) || 0,
            away: parseInt(match.awayScore) || 0,
            clockSeconds: 0,
            isLive: match.statusClass === 'live',
            isBreak: false,
            periodLabel: ''
        };
    });

    if (pollIntervalId) clearInterval(pollIntervalId);
    pollLiveScores();
    pollIntervalId = setInterval(pollLiveScores, 15000);
}

// ── Live polling ──────────────────────────────────────────────────────────────

async function pollLiveScores() {
    const stored = localStorage.getItem('selectedMatches');
    if (!stored) return;
    const matches = JSON.parse(stored);
    if (!matches.length) return;

    matches.forEach(async (match) => {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${match.competition}/scoreboard?dates=${getFormattedDateString(match.date)}`;

        let data = null;
        try {
            data = await (await fetch(url)).json();
        } catch {
            try { data = await (await fetch('./resources/scoreboard.json')).json(); } catch { return; }
        }

        if (!data?.events) return;
        const event = data.events.find(e => e.id === match.id);
        if (!event) return;

        const homeTeam = event.competitions[0].competitors[0];
        const awayTeam = event.competitions[0].competitors[1];

        const newHomeScore  = parseInt(homeTeam.score) || 0;
        const newAwayScore  = parseInt(awayTeam.score) || 0;
        const newStatus     = getMatchStatus(event);
        const apiClockSecs  = parseFloat(event.status?.clock) || 0;

        const card = document.getElementById('card-' + match.id);
        if (!card) return;

        const homeScoreEl = card.querySelector('.home-score');
        const awayScoreEl = card.querySelector('.away-score');
        const pillEl      = card.querySelector('.bug-time-pill');

        // ── Score flash ───────────────────────────────────────────────────────
        const prev = matchScores[match.id] || { home: 0, away: 0 };
        if (prev.home !== newHomeScore) {
            homeScoreEl.classList.remove('changed'); void homeScoreEl.offsetWidth; homeScoreEl.classList.add('changed');
        }
        if (prev.away !== newAwayScore) {
            awayScoreEl.classList.remove('changed'); void awayScoreEl.offsetWidth; awayScoreEl.classList.add('changed');
        }

        // ── Update state (resync clock from API) ──────────────────────────────
        matchScores[match.id] = {
            home: newHomeScore,
            away: newAwayScore,
            clockSeconds: apiClockSecs,
            isLive: newStatus.isLive,
            isBreak: newStatus.isBreak,
            periodLabel: newStatus.periodLabel
        };

        // ── Update scores ─────────────────────────────────────────────────────
        homeScoreEl.textContent = newHomeScore;
        awayScoreEl.textContent = newAwayScore;

        // ── Update pill ───────────────────────────────────────────────────────
        pillEl.className = `bug-time-pill ${newStatus.class}`;
        const label = buildPillLabel(newStatus, apiClockSecs);
        setPillText(pillEl, label);

        // ── Manage ticker ─────────────────────────────────────────────────────
        if (newStatus.isLive) {
            startClockTicker(match.id);   // restart synced to API clock
        } else {
            stopClockTicker(match.id);
        }

        updateStoredMatchData(match.id, newHomeScore, newAwayScore, newStatus.text, newStatus.class);
    });
}

// ── Persist to localStorage ───────────────────────────────────────────────────

function updateStoredMatchData(id, homeScore, awayScore, statusText, statusClass) {
    const listStr = localStorage.getItem('selectedMatches');
    if (!listStr) return;
    let list = JSON.parse(listStr);
    const m = list.find(m => m.id === id);
    if (m) {
        let changed = false;
        if (m.homeScore   !== homeScore)   { m.homeScore   = homeScore;   changed = true; }
        if (m.awayScore   !== awayScore)   { m.awayScore   = awayScore;   changed = true; }
        if (m.status      !== statusText)  { m.status      = statusText;  changed = true; }
        if (m.statusClass !== statusClass) { m.statusClass = statusClass; changed = true; }
        if (changed) localStorage.setItem('selectedMatches', JSON.stringify(list));
    }
}

// ── Cross-tab sync ────────────────────────────────────────────────────────────

window.addEventListener('storage', (e) => {
    if (e.key === 'selectedMatches') loadMatchesFromStorage();
});

setInterval(() => {
    const stored = localStorage.getItem('selectedMatches');
    if (stored !== lastCheckedStorageStr) {
        lastCheckedStorageStr = stored;
        loadMatchesFromStorage();
    }
}, 1000);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
loadMatchesFromStorage();
