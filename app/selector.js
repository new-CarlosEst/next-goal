const TEAM_TRANSLATIONS = {
    // Países
    "norway": "Noruega",
    "france": "Francia",
    "saudi arabia": "Arabia Saudí",
    "cape verde": "Cabo Verde",
    "spain": "España",
    "uruguay": "Uruguay",
    "iraq": "Irak",
    "senegal": "Senegal",
    "united states": "Estados Unidos",
    "england": "Inglaterra",
    "germany": "Alemania",
    "italy": "Italia",
    "argentina": "Argentina",
    "brazil": "Brasil",
    "netherlands": "Países Bajos",
    "croatia": "Croacia",
    "portugal": "Portugal",
    "belgium": "Bélgica",
    "switzerland": "Suiza",
    "japan": "Japón",
    "mexico": "México",
    "morocco": "Marruecos",
    "colombia": "Colombia",
    "denmark": "Dinamarca",
    "south korea": "Corea del Sur",
    "ukraine": "Ucrania",
    "sweden": "Suecia",
    "poland": "Polonia",
    "peru": "Perú",
    "chile": "Chile",
    "ecuador": "Ecuador",
    "venezuela": "Venezuela",
    "paraguay": "Paraguay",
    "bolivia": "Bolivia",
    "canada": "Canadá",
    "costa rica": "Costa Rica",
    "panama": "Panamá",
    "honduras": "Honduras",
    "el salvador": "El Salvador",
    "jamaica": "Jamaica",
    "cameroon": "Camerún",
    "ghana": "Ghana",
    "nigeria": "Nigeria",
    "algeria": "Argelia",
    "tunisia": "Túnez",
    "egypt": "Egipto",
    "turkey": "Turquía",
    "greece": "Grecia",
    "austria": "Austria",
    "czechia": "República Checa",
    "czech republic": "República Checa",
    "slovakia": "Eslovaquia",
    "slovenia": "Eslovenia",
    "hungary": "Hungría",
    "romania": "Rumanía",
    "bulgaria": "Bulgaria",
    "finland": "Finlandia",
    "ireland": "Irlanda",
    "republic of ireland": "Irlanda",
    "northern ireland": "Irlanda del Norte",
    "scotland": "Escocia",
    "wales": "Gales",
    "iceland": "Islandia",
    "new zealand": "Nueva Zelanda",
    "australia": "Australia",
    "china": "China",
    "south africa": "Sudáfrica",
    "ivory coast": "Costa de Marfil",
    "cote d'ivoire": "Costa de Marfil",
    "qatar": "Catar",
    "iran": "Irán",
    "uk": "Reino Unido",
    "united kingdom": "Reino Unido",
    
    // Clubes comunes
    "bayern munich": "Bayern Múnich",
    "fc bayern munchen": "Bayern Múnich",
    "ac milan": "Milán",
    "inter milan": "Inter de Milán",
    "sporting cp": "Sporting de Portugal",
    "braga": "Sporting de Braga",
    "maritimo": "Marítimo",
    "malmo ff": "Malmö",
    "galatasaray": "Galatasaray",
    "fenerbahce": "Fenerbahçe",
    "shakhtar donetsk": "Shakhtar Donetsk",
    "dynamo kyiv": "Dinamo de Kiev"
};

function translateTeamName(name) {
    if (!name) return "";
    const lowerName = name.toLowerCase().trim();
    if (TEAM_TRANSLATIONS[lowerName]) {
        return TEAM_TRANSLATIONS[lowerName];
    }
    return name;
}

// Función para formatear fecha a yyyymmdd para la API (convertir local a UTC)
function formatDateForAPI(date) {
    // Crear fecha UTC basada en la fecha local
    const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ));
    
    const year = utcDate.getUTCFullYear();
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// Función para convertir hora UTC a hora de España
function formatToSpainTime(utcDateString) {
    const date = new Date(utcDateString);
    const options = {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return date.toLocaleTimeString('es-ES', options);
}

// Función para obtener el estado del partido
function getMatchStatus(event) {
    const now = new Date();
    const matchDate = new Date(event.date);
    const status = event.status?.type?.state;
    const statusName = event.status?.type?.name;
    const clock = event.status?.clock || 0;
    const displayClock = event.status?.displayClock || "0'";
    
    // Si el partido está en vivo según la API
    if (status === 'in') {
        // Verificar si es descanso
        if (statusName === 'STATUS_HALFTIME' || statusName === 'STATUS_HALF_TIME') {
            return { text: 'DESCANSO', class: 'live' };
        }
        
        // Verificar si es penaltis
        if (statusName === 'STATUS_PENALTY_SHOOTOUT') {
            return { text: 'PENALTIS', class: 'live' };
        }
        
        // Para cualquier otro estado en vivo, mostrar "En directo"
        return { text: 'En directo', class: 'live' };
    }
    
    // Si el partido está finalizado según la API
    if (status === 'post') {
        return { text: 'FINAL', class: 'final' };
    }
    
    // Si el partido no ha empezado, mostrar hora
    if (status === 'pre') {
        const diffMs = matchDate - now;
        
        if (diffMs <= 0) {
            return { text: 'En directo', class: 'live' };
        }
        
        return { text: formatToSpainTime(event.date), class: 'upcoming' };
    }
    
    // Fallback: calcular por fecha
    const diffMs = matchDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < -2) {
        return { text: 'FINAL', class: 'final' };
    } else if (diffMs <= 0) {
        return { text: 'En directo', class: 'live' };
    } else {
        return { text: formatToSpainTime(event.date), class: 'upcoming' };
    }
}

// Función para formatear fecha en español
function formatDateSpanish(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// Función para generar opciones de fecha
function generateDateOptions() {
    const dateSelect = document.getElementById('date-select');
    const today = new Date();
    
    // Opciones: Hoy, Mañana, y siguientes 30 días (fechas locales)
    const options = [
        { label: 'Hoy', date: today },
        { label: 'Mañana', date: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    ];
    
    // Añadir siguientes días
    for (let i = 2; i <= 30; i++) {
        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        options.push({
            label: formatDateSpanish(date),
            date: date
        });
    }
    
    // Llenar el select
    dateSelect.innerHTML = '';
    options.forEach((opt, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = opt.label;
        dateSelect.appendChild(option);
    });
    
    // Guardar las fechas en el elemento para referencia
    dateSelect.dates = options.map(opt => opt.date);
    
    return options[0].date; // Retornar hoy por defecto
}

// Establecer fecha de hoy por defecto
const dateSelect = document.getElementById('date-select');
const competitionSelect = document.getElementById('competition-select');
const today = generateDateOptions();

// Seleccionar automáticamente el Mundial y cargar partidos de hoy
competitionSelect.value = 'fifa.world';
fetchMatches('fifa.world', today).then(data => displayMatches(data));

// Actualización automática cada 15 segundos (para marcadores y datos completos)
setInterval(async () => {
    // Eliminar partidos finalizados hace más de 5 minutos
    removeFinishedMatches();
    
    const competition = competitionSelect.value;
    const dateIndex = dateSelect.value;
    const date = dateSelect.dates[dateIndex];
    
    if (competition && date) {
        const data = await fetchMatches(competition, date);
        displayMatches(data);
    }
}, 15000); // 15 segundos


// Función para obtener partidos
async function fetchMatches(competition, date) {
    const formattedDate = formatDateForAPI(date);
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${competition}/scoreboard?dates=${formattedDate}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching matches:', error);
        return null;
    }
}

// Función para eliminar partidos finalizados después de 1 hora
function removeFinishedMatches() {
    const selectedMatchesStr = localStorage.getItem('selectedMatches');
    if (!selectedMatchesStr) return;
    
    let selectedMatches = JSON.parse(selectedMatchesStr);
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;
    
    // Filtrar partidos que han finalizado hace más de 1 hora
    const filteredMatches = selectedMatches.filter(match => {
        if (match.statusClass === 'final' && match.finishedAt) {
            const timeSinceFinish = now - match.finishedAt;
            return timeSinceFinish < oneHourMs;
        }
        return true;
    });
    
    // Si hubo cambios, actualizar localStorage
    if (filteredMatches.length !== selectedMatches.length) {
        localStorage.setItem('selectedMatches', JSON.stringify(filteredMatches));
        return true; // Hubo cambios
    }
    return false; // No hubo cambios
}

// Función para mostrar partidos
function displayMatches(data) {
    const container = document.getElementById('matches-container');
    container.innerHTML = '';
    
    if (!data || !data.events || data.events.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #8892b0;">No hay partidos para esta fecha</div>';
        return;
    }
    
    // Check which matches are currently selected in localStorage
    const selectedMatchesStr = localStorage.getItem('selectedMatches');
    let selectedMatches = selectedMatchesStr ? JSON.parse(selectedMatchesStr) : [];
    let needsUpdate = false;
    
    data.events.forEach(event => {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'match';
        matchDiv.dataset.eventId = event.id; // used by syncButtonStates()
        
        const homeTeam = event.competitions[0].competitors[0];
        const awayTeam = event.competitions[0].competitors[1];
        const matchStatus = getMatchStatus(event);
        
        // Define team logos
        const homeLogoUrl = homeTeam.team.logo || 'https://a.espncdn.com/i/teamlogos/default-soccer.png';
        const awayLogoUrl = awayTeam.team.logo || 'https://a.espncdn.com/i/teamlogos/default-soccer.png';
        
        // Create scores markup based on match status
        let scoreMarkup = '';
        if (matchStatus.class === 'upcoming') {
            scoreMarkup = `<span class="match-score-center vs">VS</span>`;
        } else {
            scoreMarkup = `<span class="match-score-center">${homeTeam.score || 0}–${awayTeam.score || 0}</span>`;
        }
        
        // Check if this match is already added to the list
        const isAdded = selectedMatches.some(m => m.id === event.id);
        if (isAdded) {
            matchDiv.classList.add('selected');
            
            // Actualizar estado del partido en localStorage si cambió
            const matchIndex = selectedMatches.findIndex(m => m.id === event.id);
            if (matchIndex > -1) {
                const storedMatch = selectedMatches[matchIndex];
                
                // Si el partido cambió a finalizado y no tenía finishedAt
                if (matchStatus.class === 'final' && storedMatch.statusClass !== 'final') {
                    selectedMatches[matchIndex].statusClass = 'final';
                    selectedMatches[matchIndex].status = matchStatus.text;
                    selectedMatches[matchIndex].finishedAt = Date.now();
                    selectedMatches[matchIndex].homeScore = homeTeam.score || 0;
                    selectedMatches[matchIndex].awayScore = awayTeam.score || 0;
                    needsUpdate = true;
                }
            }
        }
        
        matchDiv.innerHTML = `
            <div class="match-row">
                <span class="match-status ${matchStatus.class}">${matchStatus.text}</span>
                <div class="match-details">
                    <span class="home-team">
                        ${translateTeamName(homeTeam.team.displayName)}
                        <img class="team-logo" src="${homeLogoUrl}" alt="${homeTeam.team.abbreviation}">
                    </span>
                    ${scoreMarkup}
                    <span class="away-team">
                        <img class="team-logo" src="${awayLogoUrl}" alt="${awayTeam.team.abbreviation}">
                        ${translateTeamName(awayTeam.team.displayName)}
                    </span>
                </div>
                <button class="add-match-btn ${isAdded ? 'added' : ''}">${isAdded ? 'Quitar' : 'Añadir'}</button>
            </div>
        `;
        
        // Add click listener to the Add/Remove button
        const addBtn = matchDiv.querySelector('.add-match-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const currentListStr = localStorage.getItem('selectedMatches');
            let currentList = currentListStr ? JSON.parse(currentListStr) : [];
            const index = currentList.findIndex(m => m.id === event.id);
            
            if (index > -1) {
                // Already added, so remove it
                currentList.splice(index, 1);
                addBtn.textContent = 'Añadir';
                addBtn.classList.remove('added');
                matchDiv.classList.remove('selected');
            } else {
                // Not added yet, so append it to the list
                const selectedMatch = {
                    id: event.id,
                    date: event.date,
                    homeTeam: translateTeamName(homeTeam.team.displayName),
                    awayTeam: translateTeamName(awayTeam.team.displayName),
                    homeScore: homeTeam.score || 0,
                    awayScore: awayTeam.score || 0,
                    homeLogo: homeLogoUrl,
                    awayLogo: awayLogoUrl,
                    competition: competitionSelect.value,
                    competitionName: competitionSelect.options[competitionSelect.selectedIndex].text.toUpperCase(),
                    status: matchStatus.text,
                    statusClass: matchStatus.class,
                    finishedAt: matchStatus.class === 'final' ? Date.now() : null
                };
                currentList.push(selectedMatch);
                addBtn.textContent = 'Quitar';
                addBtn.classList.add('added');
                matchDiv.classList.add('selected');
            }
            
            localStorage.setItem('selectedMatches', JSON.stringify(currentList));
            // Keep every visible button in this tab in sync too
            syncButtonStates();
        });
        
        container.appendChild(matchDiv);
    });
}

// Event listeners
competitionSelect.addEventListener('change', async function() {
    const competition = this.value;
    const dateIndex = dateSelect.value;
    const date = dateSelect.dates[dateIndex];
    
    if (competition) {
        const data = await fetchMatches(competition, date);
        displayMatches(data);
    }
});

dateSelect.addEventListener('change', async function() {
    const competition = competitionSelect.value;
    const dateIndex = this.value;
    const date = dateSelect.dates[dateIndex];
    
    if (competition) {
        const data = await fetchMatches(competition, date);
        displayMatches(data);
    }
});

// Sync all visible add/remove buttons to reflect the current selectedMatches list
// Called whenever localStorage changes externally (cross-tab) or after each mutation
function syncButtonStates() {
    const stored = localStorage.getItem('selectedMatches');
    const selected = stored ? JSON.parse(stored) : [];
    const selectedIds = new Set(selected.map(m => m.id));

    document.querySelectorAll('.match').forEach(matchDiv => {
        const btn = matchDiv.querySelector('.add-match-btn');
        if (!btn) return;
        // Derive the event id from a data attribute we store on matchDiv
        const eventId = matchDiv.dataset.eventId;
        if (!eventId) return;

        if (selectedIds.has(eventId)) {
            btn.textContent = 'Quitar';
            btn.classList.add('added');
            matchDiv.classList.add('selected');
        } else {
            btn.textContent = 'Añadir';
            btn.classList.remove('added');
            matchDiv.classList.remove('selected');
        }
    });
}

// Listen to storage changes from other tabs/windows
window.addEventListener('storage', (e) => {
    if (e.key === 'selectedMatches') {
        syncButtonStates();
    }
});

