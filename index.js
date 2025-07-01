// 애플리케이션의 현재 상태를 관리하는 객체
let appState = {
    currentPage: 'main', // 'main', 'setup', 'score', 'results'
    participantsInput: '',
    numTeams: 3,
    teams: [], // [{ name: '팀 A', score: 0, members: ['홍길동', '김철수'] }]
};

// DOM 요소 가져오기
const appDiv = document.getElementById('app');
const customModal = document.getElementById('customModal');
const modalMessage = document.getElementById('modalMessage');
const modalButtons = document.getElementById('modalButtons');

// --- 커스텀 모달 함수 ---

// 모달을 숨기는 함수
function hideModal() {
    customModal.classList.remove('show');
    // 이벤트 리스너 정리 (메모리 누수 방지 및 중복 호출 방지)
    const oldConfirmBtn = document.getElementById('modalConfirmBtn');
    const oldCancelBtn = document.getElementById('modalCancelBtn');
    if (oldConfirmBtn) oldConfirmBtn.removeEventListener('click', null);
    if (oldCancelBtn) oldCancelBtn.removeEventListener('click', null);
}

// alert 대체 함수
function showAlert(message) {
    modalMessage.innerText = message;
    modalButtons.innerHTML = `
        <button id="modalConfirmBtn" class="modal-btn modal-btn-confirm">확인</button>
    `;
    customModal.classList.add('show');

    document.getElementById('modalConfirmBtn').addEventListener('click', hideModal);
}

// confirm 대체 함수 (Promise 반환)
function showConfirm(message) {
    return new Promise((resolve) => {
        modalMessage.innerText = message;
        modalButtons.innerHTML = `
            <button id="modalCancelBtn" class="modal-btn modal-btn-cancel">취소</button>
            <button id="modalConfirmBtn" class="modal-btn modal-btn-confirm">확인</button>
        `;
        customModal.classList.add('show');

        document.getElementById('modalConfirmBtn').addEventListener('click', () => {
            hideModal();
            resolve(true); // 확인 버튼 클릭 시 true 반환
        });

        document.getElementById('modalCancelBtn').addEventListener('click', () => {
            hideModal();
            resolve(false); // 취소 버튼 클릭 시 false 반환
        });
    });
}

// --- 뷰 렌더링 함수 ---

// 메인 화면 렌더링
function renderMainScreen() {
    appDiv.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">레크리에이션 이벤트 도우미</h1>
        <p class="text-gray-600 mb-8">팀 배정, 점수 기록, 우승팀 선정을 한 번에!</p>
        <button id="startGameBtn" class="btn btn-primary w-full">새 게임 시작</button>
    `;
    document.getElementById('startGameBtn').addEventListener('click', () => {
        appState.currentPage = 'setup';
        renderApp();
    });
}

// 게임 설정 화면 렌더링
function renderSetupScreen() {
    appDiv.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">게임 설정</h2>
        <div class="mb-4 text-left">
            <label for="participantsInput" class="block text-gray-700 text-sm font-bold mb-2">
                참가자 이름 입력 (띄어쓰기로 구분)
            </label>
            <textarea id="participantsInput" class="input-field h-32 resize-y" placeholder="예: 홍길동 김철수 이영희 박지민">${appState.participantsInput}</textarea>
        </div>
        <div class="mb-6 text-left">
            <label for="numTeamsSelect" class="block text-gray-700 text-sm font-bold mb-2">
                몇 개의 팀으로 나눌까요?
            </label>
            <select id="numTeamsSelect" class="input-field">
                <option value="2" ${appState.numTeams === 2 ? 'selected' : ''}>2팀</option>
                <option value="3" ${appState.numTeams === 3 ? 'selected' : ''}>3팀</option>
                <option value="4" ${appState.numTeams === 4 ? 'selected' : ''}>4팀</option>
                <option value="5" ${appState.numTeams === 5 ? 'selected' : ''}>5팀</option>
            </select>
        </div>
        <div id="teamNameInputsContainer" class="mb-6 text-left">
            <!-- Team name input fields will be rendered here -->
        </div>
        <button id="createTeamsBtn" class="btn btn-primary w-full mb-4">팀 생성 및 게임 시작</button>
        <button id="backToMainBtn" class="btn btn-secondary w-full">메인으로 돌아가기</button>
    `;

    const participantsInput = document.getElementById('participantsInput');
    const numTeamsSelect = document.getElementById('numTeamsSelect');
    const createTeamsBtn = document.getElementById('createTeamsBtn');
    const backToMainBtn = document.getElementById('backToMainBtn');

    participantsInput.addEventListener('input', (e) => {
        appState.participantsInput = e.target.value;
    });

    numTeamsSelect.addEventListener('change', (e) => {
        appState.numTeams = parseInt(e.target.value);
        renderTeamNameInputs(); // 팀 개수 변경 시 팀 이름 입력 필드 다시 렌더링
    });

    renderTeamNameInputs(); // 초기 팀 이름 입력 필드 렌더링

    createTeamsBtn.addEventListener('click', createTeams);
    backToMainBtn.addEventListener('click', () => {
        appState.currentPage = 'main';
        renderApp();
    });
}

// 팀 이름 입력 필드를 렌더링하는 함수
function renderTeamNameInputs() {
    const container = document.getElementById('teamNameInputsContainer');
    container.innerHTML = ''; // 기존 입력 필드 초기화

    for (let i = 0; i < appState.numTeams; i++) {
        // 기존 팀 이름이 있다면 가져오고, 없으면 기본 이름 사용
        const defaultTeamName = `팀 ${String.fromCharCode(65 + i)}`;
        const currentTeamName = appState.teams[i] ? appState.teams[i].name : defaultTeamName;

        const inputHtml = `
            <div class="mb-3">
                <label for="teamName-${i}" class="block text-gray-700 text-sm font-bold mb-1">
                    팀 ${String.fromCharCode(65 + i)} 이름
                </label>
                <input type="text" id="teamName-${i}" class="input-field" placeholder="예: ${defaultTeamName}" value="${currentTeamName}">
            </div>
        `;
        container.insertAdjacentHTML('beforeend', inputHtml);
    }
}

// 점수 기록 화면 렌더링
function renderScoreScreen() {
    if (appState.teams.length === 0) {
        // 팀이 없으면 설정 화면으로 리다이렉트
        appState.currentPage = 'setup';
        renderApp();
        return;
    }

    let teamsHtml = appState.teams.map((team, index) => `
        <div class="team-card">
            <div class="text-left">
                <div class="team-name">${team.name}</div>
                <div class="participant-list">${team.members.join(', ')}</div>
            </div>
            <div class="flex items-center space-x-3">
                <button class="score-btn bg-red-500 hover:bg-red-600" data-team-index="${index}" data-action="minus">-</button>
                <span class="score-display" id="score-${index}">${team.score}</span>
                <button class="score-btn bg-green-500 hover:bg-green-600" data-team-index="${index}" data-action="plus">+</button>
            </div>
        </div>
    `).join('');

    appDiv.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">점수 기록</h2>
        <div class="mb-8">
            ${teamsHtml}
        </div>
        <button id="showResultsBtn" class="btn btn-primary w-full mb-4">결과 확인</button>
        <button id="resetGameBtn" class="btn btn-secondary w-full">게임 초기화</button>
    `;

    document.querySelectorAll('.score-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const teamIndex = parseInt(e.target.dataset.teamIndex);
            const action = e.target.dataset.action;
            updateScore(teamIndex, action);
        });
    });

    document.getElementById('showResultsBtn').addEventListener('click', () => {
        appState.currentPage = 'results';
        renderApp();
    });

    document.getElementById('resetGameBtn').addEventListener('click', async () => {
        // 게임 초기화 확인 (커스텀 confirm 사용)
        const confirmed = await showConfirm("정말로 게임을 초기화하시겠습니까? 현재 점수가 모두 사라집니다.");
        if (confirmed) {
            appState.teams = [];
            appState.participantsInput = '';
            appState.numTeams = 3;
            appState.currentPage = 'main';
            renderApp();
        }
    });
}

// 결과 화면 렌더링
function renderResultsScreen() {
    if (appState.teams.length === 0) {
        appState.currentPage = 'main';
        renderApp();
        return;
    }

    // 점수를 기준으로 팀 정렬 (내림차순)
    const sortedTeams = [...appState.teams].sort((a, b) => b.score - a.score);

    // 우승 팀 결정 (공동 우승 고려)
    const maxScore = sortedTeams[0] ? sortedTeams[0].score : 0;
    const winningTeams = sortedTeams.filter(team => team.score === maxScore && maxScore > 0);

    let resultsHtml = sortedTeams.map((team, index) => `
        <div class="team-card ${winningTeams.includes(team) ? 'winner-card' : ''}">
            <div class="text-left">
                <div class="team-name">${index + 1}. ${team.name}</div>
                <div class="participant-list">${team.members.join(', ')}</div>
            </div>
            <div class="score-display ${winningTeams.includes(team) ? 'winner-text' : ''}">${team.score}점</div>
        </div>
    `).join('');

    let winnerMessage = '';
    if (winningTeams.length > 0) {
        if (winningTeams.length === 1) {
            winnerMessage = `<p class="text-2xl font-bold text-green-600 mb-4">🎉 우승 팀: ${winningTeams[0].name} 🎉</p>`;
        } else {
            const winnerNames = winningTeams.map(team => team.name).join(', ');
            winnerMessage = `<p class="text-2xl font-bold text-green-600 mb-4">🎉 공동 우승 팀: ${winnerNames} 🎉</p>`;
        }
    } else {
         winnerMessage = `<p class="text-xl font-bold text-gray-600 mb-4">아직 우승 팀이 없습니다 (점수 없음).</p>`;
    }


    appDiv.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">게임 결과</h2>
        ${winnerMessage}
        <div class="mb-8">
            ${resultsHtml}
        </div>
        <button id="backToScoreBtn" class="btn btn-secondary w-full mb-4">점수 기록으로 돌아가기</button>
        <button id="startNewGameBtn" class="btn btn-primary w-full">새 게임 시작</button>
    `;

    document.getElementById('backToScoreBtn').addEventListener('click', () => {
        appState.currentPage = 'score';
        renderApp();
    });

    document.getElementById('startNewGameBtn').addEventListener('click', async () => {
        const confirmed = await showConfirm("새 게임을 시작하시겠습니까? 팀 설정과 점수가 초기화됩니다.");
        if (confirmed) {
            appState.teams = []; // 새 게임 시작 시 팀 초기화
            appState.participantsInput = '';
            appState.numTeams = 3;
            appState.currentPage = 'main';
            renderApp();
        }
    });
}

// --- 핵심 로직 함수 ---

// 참가자를 팀으로 무작위 배정
async function createTeams() {
    const participantsText = appState.participantsInput.trim();
    if (!participantsText) {
        await showAlert("참가자 이름을 입력해주세요."); // 사용자에게 알림
        return;
    }

    const allParticipants = participantsText.split(/\s+/).filter(name => name); // 띄어쓰기로 분리하고 빈 문자열 제거
    if (allParticipants.length === 0) {
        await showAlert("유효한 참가자 이름이 없습니다.");
        return;
    }

    if (allParticipants.length < appState.numTeams) {
        await showAlert(`참가자 수가 팀 개수(${appState.numTeams}개)보다 적습니다. 참가자를 더 입력하거나 팀 개수를 줄여주세요.`);
        return;
    }

    // 팀 이름 입력 필드에서 사용자 정의 팀 이름 가져오기
    const customTeamNames = [];
    for (let i = 0; i < appState.numTeams; i++) {
        const inputElement = document.getElementById(`teamName-${i}`);
        let name = inputElement ? inputElement.value.trim() : '';
        if (!name) {
            name = `팀 ${String.fromCharCode(65 + i)}`; // 입력되지 않았으면 기본 이름 사용
        }
        customTeamNames.push(name);
    }

    // 참가자 목록 섞기 (Fisher-Yates shuffle)
    for (let i = allParticipants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allParticipants[i], allParticipants[j]] = [allParticipants[j], allParticipants[i]];
    }

    // 팀 초기화 (사용자 정의 이름 사용)
    appState.teams = Array.from({ length: appState.numTeams }, (_, i) => ({
        name: customTeamNames[i],
        score: 0,
        members: []
    }));

    // 참가자를 각 팀에 순서대로 배정
    allParticipants.forEach((participant, index) => {
        const teamIndex = index % appState.numTeams;
        appState.teams[teamIndex].members.push(participant);
    });

    appState.currentPage = 'score'; // 팀 생성 후 점수 기록 화면으로 전환
    renderApp();
}

// 팀 점수 업데이트
function updateScore(teamIndex, action) {
    if (appState.teams[teamIndex]) {
        if (action === 'plus') {
            appState.teams[teamIndex].score++;
        } else if (action === 'minus') {
            appState.teams[teamIndex].score = Math.max(0, appState.teams[teamIndex].score - 1); // 점수가 음수가 되지 않도록
        }
        // 점수만 업데이트하고 화면을 다시 렌더링하여 변경 사항 반영
        document.getElementById(`score-${teamIndex}`).innerText = appState.teams[teamIndex].score;
    }
}

// --- 앱 전체 렌더링 및 초기화 ---

// 현재 appState.currentPage에 따라 적절한 화면 렌더링
function renderApp() {
    switch (appState.currentPage) {
        case 'main':
            renderMainScreen();
            break;
        case 'setup':
            renderSetupScreen();
            break;
        case 'score':
            renderScoreScreen();
            break;
        case 'results':
            renderResultsScreen();
            break;
        default:
            renderMainScreen();
    }
}

// 페이지 로드 시 앱 초기 렌더링
window.onload = renderApp; 