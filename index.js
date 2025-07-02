// 애플리케이션의 현재 상태를 관리하는 객체
let appState = {
    currentPage: 'main', // 'main', 'registerParticipants', 'setup', 'score', 'results'
    participantsInput: '', // Used for the textarea in registerParticipants screen
    registeredParticipants: [], // Array of participant names loaded from localStorage
    numTeams: 2,
    teams: [], // [{ name: '팀 A', score: 0, members: ['홍길동', '김철수'] }]
    assignmentMethod: 'random', // New: 'random' or 'manual'
};

// DOM 요소 가져오기
const appDiv = document.getElementById('app');
const customModal = document.getElementById('customModal');
const modalMessage = document.getElementById('modalMessage');
const modalButtons = document.getElementById('modalButtons');

// 참가자 명단 저장 (localStorage 사용)
function saveParticipantsToLocalStorage() {
    try {
        // `appState.participantsInput`에서 참가자 목록을 파싱하여 저장합니다.
        const participantsToSave = appState.participantsInput.split(/\s+/).filter(name => name.trim() !== '');
        localStorage.setItem('recreationParticipants', JSON.stringify(participantsToSave));
        appState.registeredParticipants = participantsToSave; // 상태 업데이트
        console.log("참가자 명단이 성공적으로 저장되었습니다.");
        showAlert("참가자 명단이 성공적으로 저장되었습니다.");
    } catch (e) {
        console.error("참가자 명단 저장 중 오류 발생:", e);
        showAlert("참가자 명단 저장 중 오류가 발생했습니다.");
    }
}

// 참가자 명단 불러오기 (localStorage 사용)
function loadParticipantsFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('recreationParticipants');
        if (savedData) {
            const data = JSON.parse(savedData);
            if (Array.isArray(data)) {
                appState.registeredParticipants = data;
                appState.participantsInput = data.join(' '); // 텍스트 필드에 표시하기 위해
                console.log("참가자 명단이 성공적으로 불러와졌습니다:", appState.registeredParticipants);
            } else {
                appState.registeredParticipants = [];
                appState.participantsInput = '';
            }
        } else {
            console.log("저장된 참가자 명단이 없습니다.");
            appState.registeredParticipants = [];
            appState.participantsInput = '';
        }
    } catch (e) {
        console.error("참가자 명단 불러오기 중 오류 발생:", e);
        showAlert("참가자 명단 불러오기 중 오류가 발생했습니다.");
    }
}

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
        <div class="space-y-4">
            <button id="registerParticipantsBtn" class="btn btn-primary w-full">참가자 등록</button>
            <button id="assignTeamsBtn" class="btn btn-primary w-full">팀 설정</button>
            <button id="startGameBtn" class="btn btn-primary w-full">게임 시작</button>
        </div>
        <!-- userId display removed as it's not relevant for localStorage -->
    `;
    document.getElementById('registerParticipantsBtn').addEventListener('click', () => {
        appState.currentPage = 'registerParticipants';
        renderApp();
    });
    document.getElementById('assignTeamsBtn').addEventListener('click', () => {
        if (appState.registeredParticipants.length === 0) {
            showAlert("먼저 참가자 등록 화면에서 참가자를 등록해주세요.");
            return;
        }
        appState.currentPage = 'setup';
        renderApp();
    });
    document.getElementById('startGameBtn').addEventListener('click', () => {
        if (appState.teams.length === 0) {
            showAlert("먼저 팀 설정 화면에서 팀을 배정해주세요.");
            return;
        }
        appState.currentPage = 'score';
        renderApp();
    });
}

// 참가자 등록 화면 렌더링
function renderRegisterParticipantsScreen() {
    appDiv.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">참가자 등록</h2>
        <div class="mb-4 text-left">
            <label for="participantsInput" class="block text-gray-700 text-sm font-bold mb-2">
                참가자 이름 입력 (띄어쓰기로 구분)
            </label>
            <textarea id="participantsInput" class="input-field h-32 resize-y" placeholder="예: 홍길동 김철수 이영희 박지민">${appState.participantsInput}</textarea>
        </div>
        <button id="saveParticipantsBtn" class="btn btn-primary w-full mb-4">참가자 명단 저장</button>
        <button id="backToMainBtn" class="btn btn-secondary w-full">메인으로 돌아가기</button>
    `;

    const participantsInput = document.getElementById('participantsInput');
    participantsInput.addEventListener('input', (e) => {
        appState.participantsInput = e.target.value;
    });

    document.getElementById('saveParticipantsBtn').addEventListener('click', saveParticipantsToLocalStorage);
    document.getElementById('backToMainBtn').addEventListener('click', () => {
        appState.currentPage = 'main';
        renderApp();
    });
}


// 게임 설정 (팀 설정) 화면 렌더링
function renderSetupScreen() {
    if (appState.registeredParticipants.length === 0) {
        showAlert("팀을 배정하려면 먼저 참가자 등록 화면에서 참가자를 등록해주세요.");
        appState.currentPage = 'registerParticipants'; // 참가자 등록 화면으로 유도
        renderApp();
        return;
    }

    appDiv.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">팀 설정</h2>
        <div class="mb-4 text-left">
            <label class="block text-gray-700 text-sm font-bold mb-2">
                등록된 참가자: <span class="font-normal text-gray-600">${appState.registeredParticipants.join(', ') || '없음'}</span>
            </label>
        </div>
        <div class="mb-6 text-left">
            <label class="block text-gray-700 text-sm font-bold mb-2">
                팀 배정 방식 선택:
            </label>
            <div class="flex items-center space-x-4 mb-4">
                <label class="inline-flex items-center">
                    <input type="radio" name="assignmentMethod" value="random" class="form-radio text-indigo-600" ${appState.assignmentMethod === 'random' ? 'checked' : ''}>
                    <span class="ml-2 text-gray-700">무작위 배정</span>
                </label>
                <label class="inline-flex items-center">
                    <input type="radio" name="assignmentMethod" value="manual" class="form-radio text-indigo-600" ${appState.assignmentMethod === 'manual' ? 'checked' : ''}>
                    <span class="ml-2 text-gray-700">직접 배정</span>
                </label>
            </div>
        </div>
        <div id="assignmentMethodOptionsContainer">
            <!-- Dynamic content based on assignment method -->
        </div>
        <button id="createTeamsBtn" class="btn btn-primary w-full mb-4">팀 설정 및 게임 시작</button>
        <button id="backToMainBtn" class="btn btn-secondary w-full">메인으로 돌아가기</button>
    `;

    const createTeamsBtn = document.getElementById('createTeamsBtn');
    const backToMainBtn = document.getElementById('backToMainBtn');

    // Event listeners for radio buttons
    document.querySelectorAll('input[name="assignmentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            appState.assignmentMethod = e.target.value;
            renderAssignmentMethodOptions(); // Re-render the dynamic part
        });
    });

    renderAssignmentMethodOptions(); // Initial render of dynamic part

    createTeamsBtn.addEventListener('click', createTeams);
    backToMainBtn.addEventListener('click', () => {
        appState.currentPage = 'main';
        renderApp();
    });
}

// 배정 방식에 따라 동적 옵션 렌더링
function renderAssignmentMethodOptions() {
    const container = document.getElementById('assignmentMethodOptionsContainer');
    if (!container) return; // 컨테이너가 존재하지 않으면 함수 종료

    // Ensure appState.teams array is correctly sized for the current numTeams
    // Preserve existing team data if possible, add new empty teams if numTeams increased
    const newTeamsArray = [];
    for (let i = 0; i < appState.numTeams; i++) {
        if (appState.teams[i]) {
            newTeamsArray.push(appState.teams[i]);
        } else {
            // Create a new default team if expanding the number of teams
            newTeamsArray.push({ name: `팀 ${String.fromCharCode(65 + i)}`, score: 0, members: [] });
        }
    }
    appState.teams = newTeamsArray; // Update appState.teams

    container.innerHTML = ''; // 이전 내용 모두 초기화

    let htmlContent = `
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
    `;
    container.insertAdjacentHTML('beforeend', htmlContent);

    // numTeamsSelect에 이벤트 리스너 연결 (DOM에 추가된 후에)
    document.getElementById('numTeamsSelect').addEventListener('change', (e) => {
        appState.numTeams = parseInt(e.target.value);
        // 팀 개수 변경 시 전체 동적 섹션을 다시 렌더링하여 팀 이름 입력 필드 및 직접 배정 입력 필드 업데이트
        renderAssignmentMethodOptions();
    });

    // 팀 이름 입력 필드 렌더링 (teamNameInputsContainer 안에)
    renderTeamNameInputs();

    // 직접 배정 방식이 선택된 경우, 해당 입력 필드 렌더링
    if (appState.assignmentMethod === 'manual') {
        renderDragAndDropAssignmentInputs(); // 드래그 앤 드롭 UI 렌더링 함수 호출
    }
}

// 팀 이름 입력 필드를 렌더링하는 함수
function renderTeamNameInputs() {
    const container = document.getElementById('teamNameInputsContainer');
    container.innerHTML = ''; // 기존 입력 필드 초기화

    for (let i = 0; i < appState.numTeams; i++) {
        // Ensure appState.teams[i] exists and has a name property
        // If appState.teams[i] doesn't exist (e.g., increased numTeams), initialize it
        if (!appState.teams[i]) {
            appState.teams[i] = { name: `팀 ${String.fromCharCode(65 + i)}`, score: 0, members: [] };
        }
        const teamName = appState.teams[i].name || `팀 ${String.fromCharCode(65 + i)}`;

        const inputHtml = `
            <div class="mb-3">
                <label for="teamName-${i}" class="block text-gray-700 text-sm font-bold mb-1">
                    팀 ${String.fromCharCode(65 + i)} 이름
                </label>
                <input type="text" id="teamName-${i}" class="input-field" placeholder="예: ${teamName}" value="${teamName}">
            </div>
        `;
        container.insertAdjacentHTML('beforeend', inputHtml);

        // Add event listener to update appState.teams immediately on input
        document.getElementById(`teamName-${i}`).addEventListener('input', (e) => {
            appState.teams[i].name = e.target.value.trim();
        });
    }
}

// 드래그 앤 드롭 배정 입력 필드를 렌더링하는 함수
function renderDragAndDropAssignmentInputs() {
    const container = document.getElementById('assignmentMethodOptionsContainer'); // Use the main dynamic container
    let dragDropHtml = `
        <div id="dragDropAssignmentSection" class="mt-6 border-t pt-6 border-gray-200">
            <h3 class="text-xl font-bold text-gray-800 mb-4">참가자 직접 배정</h3>
            <p class="text-gray-600 mb-4">아래 참가자들을 각 팀으로 끌어다 놓으세요.</p>

            <div class="mb-4">
                <h4 class="text-lg font-semibold text-gray-700 mb-2">미배정 참가자</h4>
                <div id="unassignedPool" class="unassigned-pool drop-zone">
                    <!-- Unassigned participants will be rendered here -->
                </div>
            </div>

            <div id="teamDropZonesContainer">
                <!-- Team drop zones will be rendered here -->
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', dragDropHtml);

    // 팀 드롭 존 렌더링
    const teamDropZonesContainer = document.getElementById('teamDropZonesContainer');
    for (let i = 0; i < appState.numTeams; i++) {
        const teamNameInput = document.getElementById(`teamName-${i}`);
        const teamName = teamNameInput ? teamNameInput.value.trim() : `팀 ${String.fromCharCode(65 + i)}`;
        const teamId = `team-drop-zone-${i}`;

        const teamDropZoneHtml = `
            <div class="mb-4">
                <h4 class="text-lg font-semibold text-gray-700 mb-2">${teamName}</h4>
                <div id="${teamId}" class="drop-zone" data-team-index="${i}">
                    <!-- Participants assigned to this team will be dropped here -->
                </div>
            </div>
        `;
        teamDropZonesContainer.insertAdjacentHTML('beforeend', teamDropZoneHtml);
    }

    // 모든 드롭 존에 이벤트 리스너 추가
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', dragOver);
        zone.addEventListener('dragenter', dragEnter);
        zone.addEventListener('dragleave', dragLeave);
        zone.addEventListener('drop', drop);
    });

    // 참가자 렌더링 및 초기 배정
    renderParticipantsForDragAndDrop();
}

// 드래그 앤 드롭을 위한 참가자 렌더링 및 초기 배정
function renderParticipantsForDragAndDrop() {
    const unassignedPool = document.getElementById('unassignedPool');
    const assignedParticipantsNames = new Set();

    // 이전에 배정된 팀이 있다면 해당 팀에 참가자들을 배치
    if (appState.teams.length > 0 && appState.assignmentMethod === 'manual') {
        appState.teams.forEach((team, teamIndex) => {
            const teamDropZone = document.getElementById(`team-drop-zone-${teamIndex}`);
            if (teamDropZone) {
                team.members.forEach(member => {
                    const participantDiv = createParticipantDraggable(member);
                    teamDropZone.appendChild(participantDiv);
                    assignedParticipantsNames.add(member);
                });
            }
        });
    }

    // 미배정된 참가자들을 풀에 배치
    appState.registeredParticipants.forEach(participant => {
        if (!assignedParticipantsNames.has(participant)) {
            const participantDiv = createParticipantDraggable(participant);
            unassignedPool.appendChild(participantDiv);
        }
    });
}

// 드래그 가능한 참가자 DIV 생성
function createParticipantDraggable(name) {
    const div = document.createElement('div');
    div.className = 'participant-draggable';
    div.draggable = true;
    div.id = `participant-${name.replace(/\s+/g, '-')}`; // Unique ID for each participant
    div.textContent = name;
    div.addEventListener('dragstart', dragStart);
    return div;
}

// --- 드래그 앤 드롭 이벤트 핸들러 ---
let draggedElement = null;

function dragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.setData('text/plain', e.target.id);
    e.target.classList.add('dragging');
}

function dragOver(e) {
    e.preventDefault(); // Allow drop
    const targetZone = e.currentTarget;
    // Prevent dropping onto a participant, only onto the zone itself
    if (e.target.classList.contains('participant-draggable')) {
        return;
    }
    if (!targetZone.classList.contains('drag-over')) {
        targetZone.classList.add('drag-over');
    }
}

function dragEnter(e) {
    e.preventDefault();
    const targetZone = e.currentTarget;
    if (!targetZone.classList.contains('drag-over')) {
        targetZone.classList.add('drag-over');
    }
}

function dragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const data = e.dataTransfer.getData('text/plain');
    const draggable = document.getElementById(data);

    if (draggable && e.currentTarget.classList.contains('drop-zone')) {
        // Check if the dragged element is a participant
        if (!draggable.classList.contains('participant-draggable')) {
            return; // Not a draggable participant
        }

        // Append the dragged element to the target drop zone
        e.currentTarget.appendChild(draggable);
        draggable.classList.remove('dragging');
    }
}

// 점수 기록 화면 렌더링
function renderScoreScreen() {
    if (appState.teams.length === 0) {
        showAlert("게임 시작 전에 팀 설정 화면에서 팀을 먼저 배정해주세요.");
        appState.currentPage = 'setup'; // 팀 설정 화면으로 유도
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
            appState.numTeams = 2;
            appState.currentPage = 'main';
            renderApp();
            // localStorage에서도 참가자 명단 삭제
            // localStorage.removeItem('recreationParticipants');
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
            winnerMessage = `<p class="text-xl font-bold text-gray-600 mb-4">우승 팀이 없습니다. (점수 없음)</p>`;
    }


    appDiv.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">게임 결과</h2>
        ${winnerMessage}
        <div class="mb-8">
            ${resultsHtml}
        </div>
        <button id="backToScoreBtn" class="btn btn-secondary w-full mb-4">점수 기록으로 돌아가기</button>
        <button id="startNewGameBtn" class="btn btn-primary w-full">게임 종료</button>
    `;

    document.getElementById('backToScoreBtn').addEventListener('click', () => {
        appState.currentPage = 'score';
        renderApp();
    });

    document.getElementById('startNewGameBtn').addEventListener('click', async () => {
        const confirmed = await showConfirm("종료 시 점수가 초기화됩니다. 게임을 종료하고 메인 화면으로 돌아가시겠습니까?");
        if (confirmed) {
            appState.teams.forEach(team => team.score = 0);
            appState.currentPage = 'main';
            renderApp();
        }
    });
}

// --- 핵심 로직 함수 ---

// 참가자를 팀으로 무작위 배정
async function createTeams() {
    const allParticipants = appState.registeredParticipants; // 등록된 참가자 사용
    if (allParticipants.length === 0) {
        await showAlert("등록된 참가자가 없습니다. '참가자 등록' 화면에서 먼저 참가자를 입력해주세요.");
        appState.currentPage = 'registerParticipants';
        renderApp();
        return;
    }

    if (allParticipants.length < appState.numTeams) {
        await showAlert(`참가자 수가 팀 개수(${appState.numTeams}개)보다 적습니다. 참가자를 더 등록하거나 팀 개수를 줄여주세요.`);
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

    // 팀 초기화 (사용자 정의 이름 사용)
    appState.teams = Array.from({ length: appState.numTeams }, (_, i) => ({
        name: customTeamNames[i],
        score: 0,
        members: []
    }));

    if (appState.assignmentMethod === 'random') {
        // 무작위 배정 로직
        // 참가자 목록 섞기 (Fisher-Yates shuffle)
        const shuffledParticipants = [...allParticipants]; // 원본 배열을 변경하지 않도록 복사
        for (let i = shuffledParticipants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledParticipants[i], shuffledParticipants[j]] = [shuffledParticipants[j], shuffledParticipants[i]];
        }

        // 참가자를 각 팀에 순서대로 배정
        shuffledParticipants.forEach((participant, index) => {
            const teamIndex = index % appState.numTeams;
            appState.teams[teamIndex].members.push(participant);
        });

    } else if (appState.assignmentMethod === 'manual') {
        // 직접 배정 로직 (드래그 앤 드롭 결과 읽기)
        const assignedParticipants = new Set();
        const unassignedParticipants = new Set(allParticipants);

        for (let i = 0; i < appState.numTeams; i++) {
            const teamDropZone = document.getElementById(`team-drop-zone-${i}`);
            if (teamDropZone) {
                const membersInZone = Array.from(teamDropZone.children)
                                            .filter(el => el.classList.contains('participant-draggable'))
                                            .map(el => el.textContent.trim());

                for (const member of membersInZone) {
                    if (!allParticipants.includes(member)) {
                        await showAlert(`'${member}'은(는) 등록된 참가자가 아닙니다. 참가자 명단을 확인해주세요.`);
                        appState.teams = []; // 잘못된 배정 상태 초기화
                        return;
                    }
                    if (assignedParticipants.has(member)) {
                        await showAlert(`'${member}'은(는) 이미 다른 팀에 배정되었습니다. 한 참가자는 한 팀에만 배정될 수 있습니다.`);
                        appState.teams = []; // 잘못된 배정 상태 초기화
                        return;
                    }
                    appState.teams[i].members.push(member);
                    assignedParticipants.add(member);
                    unassignedParticipants.delete(member);
                }
            }
        }

        // 미배정 풀에 남은 참가자 확인
        const unassignedPool = document.getElementById('unassignedPool');
        if (unassignedPool) {
            Array.from(unassignedPool.children)
                    .filter(el => el.classList.contains('participant-draggable'))
                    .map(el => el.textContent.trim())
                    .forEach(unassignedMember => unassignedParticipants.add(unassignedMember));
        }


        if (unassignedParticipants.size > 0) {
            const unassignedList = Array.from(unassignedParticipants).join(', ');
            const confirmed = await showConfirm(`다음 참가자들이 팀에 배정되지 않았습니다: ${unassignedList}. 계속하시겠습니까?`);
            if (!confirmed) {
                appState.teams = []; // 사용자가 취소하면 팀 배정 상태 초기화
                return;
            }
        }
    }

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
        case 'registerParticipants':
            renderRegisterParticipantsScreen();
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

// 앱 초기화 (localStorage에서 데이터 로드)
function initializeApp() {
    loadParticipantsFromLocalStorage(); // localStorage에서 참가자 명단 불러오기
    renderApp(); // 앱 렌더링 시작
}

// 페이지 로드 시 앱 초기 렌더링
window.onload = initializeApp;