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

// Расчет баллов на основе достижений
function calculatePoints() {
    if (!gameData || !gameData.teams) return;
    
    // Находим команду с максимальной выручкой для "Топ-выручка"
    const maxRevenue = Math.max(...gameData.teams.map(team => team.totalRevenue));
    
    gameData.teams.forEach(team => {
        let points = 0;
        
        // Топ-выручка (5 баллов)
        if (team.totalRevenue === maxRevenue && maxRevenue > 0) {
            points += 5;
        }
        
        // Проверка других достижений на основе данных участников
        // Примечание: для полной реализации нужны дополнительные данные о транзакциях
        // Здесь реализована базовая логика
        
        // Супер счёт (2 балла) - проверяем участников с выручкой >= 100000
        team.members.forEach(member => {
            if (member.revenue >= 100000) {
                points += 2;
            }
        });
        
        // Быстрый дожим (1 балл) - нужны данные о датах оплаты
        // Супер лид (3 балла) - нужны данные о лидах
        // Кросс-продажа (2 балла) - нужны данные о клиентах и продуктах
        
        team.points = points;
    });
    
    // Сортировка команд по баллам
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
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${team.members.map(member => `
                            <tr>
                                <td class="${member.status === 'капитан' ? 'member-captain' : ''}">${member.fio}</td>
                                <td>${member.product}</td>
                                <td>${formatCurrency(member.revenue)}</td>
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
                <img src="${photo.url}" alt="${photo.description}" class="photo-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'250\' height=\'200\'%3E%3Crect fill=\'%23ccc\' width=\'250\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3EНет фото%3C/text%3E%3C/svg%3E'">
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
    
    // Модальные окна
    setupModals();
}

// Настройка модальных окон
function setupModals() {
    // Челленджи
    const openChallengeBtn = document.getElementById('openChallengeForm');
    const challengeModal = document.getElementById('challengeModal');
    const closeChallengeBtn = document.getElementById('closeChallengeModal');
    const challengeForm = document.getElementById('challengeForm');
    
    if (openChallengeBtn && challengeModal) {
        openChallengeBtn.addEventListener('click', () => {
            populateTeamSelects();
            challengeModal.classList.add('active');
        });
    }
    
    if (closeChallengeBtn && challengeModal) {
        closeChallengeBtn.addEventListener('click', () => {
            challengeModal.classList.remove('active');
        });
    }
    
    if (challengeForm) {
        challengeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Вызов отправлен! Администратор проверит и обновит данные.');
            challengeModal.classList.remove('active');
            challengeForm.reset();
        });
    }
    
    // Фото
    const openPhotoBtn = document.getElementById('openPhotoForm');
    const photoModal = document.getElementById('photoModal');
    const closePhotoBtn = document.getElementById('closePhotoModal');
    const photoForm = document.getElementById('photoForm');
    
    if (openPhotoBtn && photoModal) {
        openPhotoBtn.addEventListener('click', () => {
            populatePhotoTeamSelect();
            photoModal.classList.add('active');
        });
    }
    
    if (closePhotoBtn && photoModal) {
        closePhotoBtn.addEventListener('click', () => {
            photoModal.classList.remove('active');
        });
    }
    
    if (photoForm) {
        photoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Фото отправлено! Администратор проверит и обновит данные.');
            photoModal.classList.remove('active');
            photoForm.reset();
        });
    }
    
    // Закрытие модальных окон по клику вне области
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Заполнение селектов команд
function populateTeamSelects() {
    if (!gameData) return;
    
    const fromSelect = document.getElementById('challengeFrom');
    const toSelect = document.getElementById('challengeTo');
    
    if (fromSelect) {
        fromSelect.innerHTML = '<option value="">Выберите команду</option>';
        gameData.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            fromSelect.appendChild(option);
        });
    }
    
    if (toSelect) {
        toSelect.innerHTML = '<option value="">Выберите команду</option>';
        gameData.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            toSelect.appendChild(option);
        });
    }
}

function populatePhotoTeamSelect() {
    if (!gameData) return;
    
    const select = document.getElementById('photoTeam');
    if (select) {
        select.innerHTML = '<option value="">Выберите команду</option>';
        gameData.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });
    }
}


// Экспорт функции для использования в HTML
window.toggleTeam = toggleTeam;

