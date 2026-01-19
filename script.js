// Глобальные переменные
let gameData = null;
let currentSort = 'points';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    createSnowflakes();
});

// Создание снежинок
function createSnowflakes() {
    const snowflakesContainer = document.querySelector('.snowflakes');
    const snowflakeSymbols = ['❄', '❅', '❆'];
    
    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 3 + 7) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.opacity = Math.random() * 0.5 + 0.3;
        snowflakesContainer.appendChild(snowflake);
    }
}

// Загрузка данных из JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        gameData = await response.json();
        
        // Расчет баллов для всех команд
        calculatePoints();
        
        // Рендеринг всех секций
        renderLeaderboard();
        renderAchievements();
        renderTeams();
        renderChallenges();
        renderPhotos();
        renderResults();
        updateFooter();
        
        // Обновление даты последнего обновления
        updateLastUpdated();
        
        // Запуск таймера
        startUpdateTimer();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
    }
}

// Сортировка команд (баллы уже есть в data.json, не пересчитываем)
function calculatePoints() {
    if (!gameData || !gameData.teams) return;
    
    // Сортировка команд по баллам или выручке
    gameData.teams.sort((a, b) => {
        if (currentSort === 'points') {
            return b.points - a.points;
        } else {
            return b.totalRevenue - a.totalRevenue;
        }
    });
}

// Рендеринг турнирной таблицы
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody || !gameData) return;
    
    tbody.innerHTML = '';
    
    gameData.teams.forEach((team, index) => {
        const row = document.createElement('tr');
        
        // Добавляем классы для топ-3
        if (index === 0) row.classList.add('top-1');
        else if (index === 1) row.classList.add('top-2');
        else if (index === 2) row.classList.add('top-3');
        
        const positionClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
        
        row.innerHTML = `
            <td>
                <span class="position-badge ${positionClass}">${index + 1}</span>
            </td>
            <td><strong>${team.name}</strong></td>
            <td>${team.captain}</td>
            <td><strong class="points-value">${team.points}</strong></td>
            <td>${formatCurrency(team.totalRevenue)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Рендеринг достижений
function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid || !gameData) return;
    
    grid.innerHTML = '';
    
    gameData.achievements.forEach(achievement => {
        const card = document.createElement('div');
        card.className = 'achievement-card';
        card.innerHTML = `
            <div class="achievement-header">
                <h3 class="achievement-name">${achievement.name}</h3>
                <div class="achievement-points">${achievement.points}</div>
            </div>
            <p class="achievement-description">${achievement.description}</p>
        `;
        grid.appendChild(card);
    });
}

// Рендеринг команд с аккордеоном
function renderTeams() {
    const accordion = document.getElementById('teamsAccordion');
    if (!accordion || !gameData) return;
    
    accordion.innerHTML = '';
    
    gameData.teams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        teamItem.dataset.teamName = team.name.toLowerCase();
        teamItem.dataset.captain = team.captain.toLowerCase();
        teamItem.dataset.members = team.members.map(m => m.fio.toLowerCase()).join(' ');
        teamItem.innerHTML = `
            <div class="team-header" onclick="toggleTeam(this)">
                <div class="team-info">
                    <div>
                        <div class="team-name">${team.name}</div>
                        <div class="team-captain">Капитан: ${team.captain}</div>
                    </div>
                </div>
                <div class="team-stats">
                    <div class="team-stat">
                        <div class="team-stat-label">Баллы</div>
                        <div class="team-stat-value">${team.points}</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-label">Выручка</div>
                        <div class="team-stat-value">${formatCurrency(team.totalRevenue)}</div>
                    </div>
                </div>
                <span class="team-toggle">▼</span>
            </div>
            <div class="team-members">
                <table class="members-table">
                    <thead>
                        <tr>
                            <th>ФИО</th>
                            <th>Продукт</th>
                            <th>Выручка</th>
                            <th>Баллы</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${team.members.map(member => `
                            <tr>
                                <td class="${member.status === 'капитан' ? 'member-captain' : ''}">${member.fio}</td>
                                <td>${member.product}</td>
                                <td>${formatCurrency(member.revenue)}</td>
                                <td><strong>${member.points || 0}</strong></td>
                                <td>${member.status === 'капитан' ? '⭐ Капитан' : 'Игрок'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        accordion.appendChild(teamItem);
    });
}

// Фильтрация команд по поисковому запросу
function filterTeams(searchQuery) {
    if (!gameData) return;
    
    const query = searchQuery.toLowerCase().trim();
    const teamItems = document.querySelectorAll('.team-item');
    
    if (!query) {
        // Показать все команды, если поиск пустой
        teamItems.forEach(item => {
            item.classList.remove('hidden');
        });
        return;
    }
    
    teamItems.forEach(item => {
        const teamName = item.dataset.teamName || '';
        const captain = item.dataset.captain || '';
        const members = item.dataset.members || '';
        
        // Проверяем совпадение по названию команды, капитану или участникам
        if (teamName.includes(query) || captain.includes(query) || members.includes(query)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// Переключение аккордеона команды
function toggleTeam(header) {
    const teamItem = header.parentElement;
    const isActive = teamItem.classList.contains('active');
    
    // Закрываем все другие команды
    document.querySelectorAll('.team-item').forEach(item => {
        if (item !== teamItem) {
            item.classList.remove('active');
        }
    });
    
    // Переключаем текущую команду
    teamItem.classList.toggle('active', !isActive);
}

// Рендеринг челленджей
function renderChallenges() {
    const list = document.getElementById('challengesList');
    if (!list || !gameData) return;
    
    if (gameData.challenges && gameData.challenges.length > 0) {
        list.innerHTML = '';
        gameData.challenges.forEach(challenge => {
            const item = document.createElement('div');
            item.className = 'challenge-item';
            const fromTeam = gameData.teams.find(t => t.id === challenge.from);
            const toTeam = gameData.teams.find(t => t.id === challenge.to);
            item.innerHTML = `
                <div class="challenge-header">
                    <div class="challenge-teams">
                        ${fromTeam ? fromTeam.name : 'Команда ' + challenge.from} → 
                        ${toTeam ? toTeam.name : 'Команда ' + challenge.to}
                    </div>
                    <span class="challenge-status ${challenge.status}">${challenge.status}</span>
                </div>
                <div class="challenge-description">${challenge.description}</div>
            `;
            list.appendChild(item);
        });
    } else {
        list.innerHTML = '<p class="empty-state">Пока нет активных челленджей</p>';
    }
}

// Рендеринг фото
function renderPhotos() {
    const gallery = document.getElementById('photosGallery');
    if (!gallery || !gameData) return;
    
    if (gameData.photos && gameData.photos.length > 0) {
        gallery.innerHTML = '';
        gameData.photos.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            const team = gameData.teams.find(t => t.id === photo.team);
            item.innerHTML = `
                <img src="${photo.url}" alt="${photo.description}" class="photo-image" onclick="openPhotoModal('${photo.url}', '${(team ? team.name : 'Команда ' + photo.team).replace(/'/g, "\\'")}', '${(photo.description || '').replace(/'/g, "\\'")}')" style="cursor: pointer;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'250\' height=\'200\'%3E%3Crect fill=\'%23ccc\' width=\'250\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3EНет фото%3C/text%3E%3C/svg%3E'">
                <div class="photo-info">
                    <div class="photo-team">${team ? team.name : 'Команда ' + photo.team}</div>
                    <div class="photo-description">${photo.description}</div>
                </div>
            `;
            gallery.appendChild(item);
        });
    } else {
        gallery.innerHTML = '<p class="empty-state">Пока нет загруженных фото</p>';
    }
}

// Открытие модального окна с фото
function openPhotoModal(imageUrl, teamName, description) {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalPhotoImage');
    const modalTeam = document.getElementById('modalPhotoTeam');
    const modalDesc = document.getElementById('modalPhotoDescription');
    
    if (modal && modalImg) {
        modalImg.src = imageUrl;
        if (modalTeam) modalTeam.textContent = teamName;
        if (modalDesc) modalDesc.textContent = description || '';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие модального окна
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Закрытие модального окна по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePhotoModal();
    }
});

// Обновление футера
function updateFooter() {
    if (!gameData) return;
    
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        totalRevenueEl.textContent = formatCurrency(gameData.totalRevenue || 0);
    }
}

// Обновление даты последнего обновления
function updateLastUpdated() {
    if (!gameData) return;
    
    const dateEl = document.getElementById('lastUpdated');
    if (dateEl && gameData.lastUpdated) {
        const date = new Date(gameData.lastUpdated);
        dateEl.textContent = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Таймер до следующего обновления
function startUpdateTimer() {
    if (!gameData || !gameData.nextUpdate) return;
    
    const timerEl = document.getElementById('nextUpdateTimer');
    if (!timerEl) return;
    
    function updateTimer() {
        const now = new Date();
        const nextUpdate = new Date(gameData.nextUpdate);
        const diff = nextUpdate - now;
        
        if (diff <= 0) {
            timerEl.textContent = 'Обновление ожидается';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        let timerText = '';
        if (days > 0) timerText += `${days} дн. `;
        if (hours > 0) timerText += `${hours} ч. `;
        timerText += `${minutes} мин.`;
        
        timerEl.textContent = timerText;
    }
    
    updateTimer();
    setInterval(updateTimer, 60000); // Обновление каждую минуту
}

// Форматирование валюты
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Мобильное меню
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Сортировка таблицы
    document.querySelectorAll('.btn-sort').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-sort').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSort = e.target.dataset.sort;
            calculatePoints();
            renderLeaderboard();
        });
    });
    
    // Кнопка обновления
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    
    // Поиск по командам
    const teamSearchInput = document.getElementById('teamSearch');
    if (teamSearchInput) {
        teamSearchInput.addEventListener('input', (e) => {
            filterTeams(e.target.value);
        });
        
        // Очистка поиска при Escape
        teamSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                filterTeams('');
            }
        });
    }
}



// Рендеринг итогов соревнования
function renderResults() {
    if (!gameData || !gameData.teams) return;
    
    // Сортируем команды по баллам, при равенстве - по выручке
    const sortedTeams = [...gameData.teams].sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        return b.totalRevenue - a.totalRevenue;
    });
    
    // Определяем места с учетом одинаковых баллов
    const teamsWithPlaces = [];
    let currentPlace = 1;
    let currentPoints = sortedTeams[0]?.points;
    
    sortedTeams.forEach((team, index) => {
        if (team.points !== currentPoints) {
            currentPlace = index + 1;
            currentPoints = team.points;
        }
        teamsWithPlaces.push({
            ...team,
            place: currentPlace,
            points: team.points
        });
    });
    
    // Победитель (1 место)
    const winner = teamsWithPlaces.find(t => t.place === 1);
    if (winner) {
        const winnerNameEl = document.getElementById('winnerName');
        const winnerCaptainEl = document.getElementById('winnerCaptain');
        const winnerPointsEl = document.getElementById('winnerPoints');
        const winnerRevenueEl = document.getElementById('winnerRevenue');
        
        if (winnerNameEl) winnerNameEl.textContent = winner.name;
        if (winnerCaptainEl) winnerCaptainEl.textContent = `Капитан: ${winner.captain}`;
        if (winnerPointsEl) winnerPointsEl.textContent = winner.points;
        if (winnerRevenueEl) winnerRevenueEl.textContent = formatCurrency(winner.totalRevenue);
    }
    
    // Пьедестал (топ-3 места)
    const podiumEl = document.getElementById('podium');
    if (podiumEl) {
        podiumEl.innerHTML = '';
        
        // Получаем команды для пьедестала (1, 2, 3 места)
        const firstPlace = teamsWithPlaces.filter(t => t.place === 1);
        const secondPlace = teamsWithPlaces.filter(t => t.place === 2);
        const thirdPlace = teamsWithPlaces.filter(t => t.place === 3);
        
        const podiumData = [];
        
        // Если есть 2 место, добавляем его слева
        if (secondPlace.length > 0) {
            secondPlace.forEach((team, index) => {
                podiumData.push({
                    team: team,
                    place: 'second',
                    label: '2'
                });
            });
        }
        
        // 1 место в центре
        if (firstPlace.length > 0) {
            firstPlace.forEach((team, index) => {
                podiumData.push({
                    team: team,
                    place: 'first',
                    label: '1'
                });
            });
        }
        
        // 3 место справа
        if (thirdPlace.length > 0) {
            thirdPlace.forEach((team, index) => {
                podiumData.push({
                    team: team,
                    place: 'third',
                    label: '3'
                });
            });
        }
        
        // Если есть несколько команд на 2 месте, показываем их рядом
        // Порядок: 2 место(и) слева, 1 место в центре, 3 место справа
        const reorderedPodium = [];
        
        // Добавляем все 2 места
        secondPlace.forEach(team => {
            reorderedPodium.push({ team, place: 'second', label: '2' });
        });
        
        // Добавляем 1 место
        firstPlace.forEach(team => {
            reorderedPodium.push({ team, place: 'first', label: '1' });
        });
        
        // Добавляем 3 место
        thirdPlace.forEach(team => {
            reorderedPodium.push({ team, place: 'third', label: '3' });
        });
        
        reorderedPodium.forEach(({ team, place, label }) => {
            if (!team) return;
            
            const item = document.createElement('div');
            item.className = 'podium-item';
            item.innerHTML = `
                <div class="podium-place ${place}">${label}</div>
                <div class="podium-card ${place}">
                    <div class="podium-team-name">${team.name}</div>
                    <div class="podium-captain">${team.captain}</div>
                    <div class="podium-stats">
                        <div class="podium-stat">
                            <span class="podium-stat-label">Баллы:</span>
                            <span class="podium-stat-value">${team.points}</span>
                        </div>
                        <div class="podium-stat">
                            <span class="podium-stat-label">Выручка:</span>
                            <span class="podium-stat-value">${formatCurrency(team.totalRevenue)}</span>
                        </div>
                    </div>
                </div>
            `;
            podiumEl.appendChild(item);
        });
    }
    
    // Общая статистика
    const statsGridEl = document.getElementById('statsGrid');
    if (statsGridEl) {
        const totalTeams = gameData.teams.length;
        const totalMembers = gameData.teams.reduce((sum, team) => sum + team.members.length, 0);
        const totalPoints = gameData.teams.reduce((sum, team) => sum + team.points, 0);
        const avgRevenue = Math.round(gameData.totalRevenue / totalTeams);
        const avgPoints = Math.round(totalPoints / totalTeams);
        
        statsGridEl.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-icon">👥</div>
                <div class="stat-card-label">Команд</div>
                <div class="stat-card-value">${totalTeams}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">🎯</div>
                <div class="stat-card-label">Участников</div>
                <div class="stat-card-value">${totalMembers}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">💰</div>
                <div class="stat-card-label">Общая выручка</div>
                <div class="stat-card-value">${formatCurrency(gameData.totalRevenue)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">⭐</div>
                <div class="stat-card-label">Всего баллов</div>
                <div class="stat-card-value">${totalPoints}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">📊</div>
                <div class="stat-card-label">Средняя выручка</div>
                <div class="stat-card-value">${formatCurrency(avgRevenue)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">🏅</div>
                <div class="stat-card-label">Средние баллы</div>
                <div class="stat-card-value">${avgPoints}</div>
            </div>
        `;
    }
    
    // Создание конфетти
    createConfetti();
}

// Создание конфетти
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    
    // Очищаем предыдущее конфетти
    container.innerHTML = '';
    
    // Создаем 50 конфетти
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        container.appendChild(confetti);
    }
}

// Экспорт функции для использования в HTML
window.toggleTeam = toggleTeam;
window.openPhotoModal = openPhotoModal;
window.closePhotoModal = closePhotoModal;

