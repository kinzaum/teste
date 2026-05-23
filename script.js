const STORAGE_KEY = 'aac_multi_canvas_system';
let currentLang = {}; 

let appState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
activeBoardId: null,
boards: []
};

function checkDeviceCompatibility() {
    if (window.innerWidth < 375) {
        document.getElementById('deviceWarning').style.display = 'block';
    }
}
// --- FUNÇÃO ADICIONADA ---
async function initSystem() {
    // 1. Verifica se o sistema já tem dados salvos
    if (!localStorage.getItem(STORAGE_KEY)) {
        
        // 2. Detecta o idioma (pega os 2 primeiros caracteres: 'en', 'pt', 'es', etc.)
        const userLang = (navigator.language || navigator.userLanguage || "en").substring(0, 2);
        
        // 3. Define o nome do arquivo dinamicamente (ex: sample_pt.json, sample_en.json)
        const fileName = `sample_${userLang}.json`;

        try {
            const response = await fetch(fileName);
            
            // 4. Se o arquivo do idioma não existir, faz um fallback para 'en'
            if (!response.ok) {
                console.warn(`Arquivo ${fileName} não encontrado, tentando fallback para sample_en.json`);
                const fallbackResponse = await fetch('sample_en.json');
                appState = await fallbackResponse.json();
            } else {
                appState = await response.json();
            }
            
            saveState();
        } catch (err) {
            console.error("Erro ao carregar o arquivo de exemplo:", err);
        }
    }
}

let isEditMode = false;
let pendingAction = null;

const mainTitle = document.getElementById('mainTitle');
const adminToggleBtn = document.getElementById('adminToggleBtn');
const creatorPanel = document.getElementById('creatorPanel');
const mainLayoutContainer = document.getElementById('mainLayoutContainer');
const lblBoardTitle = document.getElementById('lblBoardTitle');
const boardTitleInput = document.getElementById('boardTitle');
const lblCardWord = document.getElementById('lblCardWord');
const cardWordInput = document.getElementById('cardWord');
const lblCardImage = document.getElementById('lblCardImage');
const cardImageInput = document.getElementById('cardImage');
const addCardBtn = document.getElementById('addCardBtn');
const clearBoardBtn = document.getElementById('clearBoardBtn');
const sidebarTabs = document.getElementById('sidebarTabs');
const boardHeader = document.getElementById('boardHeader');
const gridDisplay = document.getElementById('gridDisplay');

const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

const parentalModal = document.getElementById('parentalModal');
const parentalSlider = document.getElementById('parentalSlider');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalInstruction = document.getElementById('modalInstruction');
const sliderLabel = document.getElementById('sliderLabel');

// --- ALTERAÇÃO NO DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", async () => {
    await initSystem();
    loadLocalization();
    window.addEventListener('resize', adjustFontSize);
});

adminToggleBtn.addEventListener('click', () => {
if (!isEditMode) {
openParentalGate('toggleEdit');
} else {
executeSecureAction('toggleEdit');
}
});

clearBoardBtn.addEventListener('click', () => {
openParentalGate('resetAll');
});

function openParentalGate(actionType) {
pendingAction = actionType;
parentalSlider.value = 0;

modalTitle.textContent = currentLang.modalTitle || "Parental Control";
modalInstruction.textContent = currentLang.modalInstruction || "Slide to the right to confirm you are an adult.";
sliderLabel.textContent = currentLang.sliderLabel || "Slide >>";

parentalModal.style.display = "flex";
}

closeModalBtn.addEventListener('click', () => {
parentalModal.style.display = "none";
pendingAction = null;
});

parentalSlider.addEventListener('input', () => {
if (parseInt(parentalSlider.value) === 100) {
parentalModal.style.display = "none";
if (pendingAction) {
executeSecureAction(pendingAction);
}
pendingAction = null;
}
});

parentalSlider.addEventListener('change', () => {
if (parseInt(parentalSlider.value) < 100) {
parentalSlider.value = 0;
}
});

function executeSecureAction(action) {
if (action === 'toggleEdit') {
isEditMode = !isEditMode;
if (isEditMode) {
creatorPanel.style.display = "block";
adminToggleBtn.textContent = currentLang.doneEditing || "✓ Done Editing";
adminToggleBtn.classList.add('editing');
const activeBoard = appState.boards.find(b => b.id === appState.activeBoardId);
if (activeBoard) {
boardTitleInput.value = activeBoard.title;
} else {
boardTitleInput.value = ""; 
}

} else {
creatorPanel.style.display = "none";
adminToggleBtn.textContent = "⚙️ Setup / Edit";
adminToggleBtn.classList.remove('editing');
}
renderBoard();
} 
else if (action === 'resetAll') {
appState = { activeBoardId: null, boards: [] };
localStorage.removeItem(STORAGE_KEY);
boardTitleInput.value = "";
cardWordInput.value = "";
cardImageInput.value = "";
isEditMode = false;
creatorPanel.style.display = "none";
adminToggleBtn.textContent = "⚙️ Setup / Edit";
adminToggleBtn.classList.remove('editing');
initStaticTexts();
renderBoard();
}
}

async function loadLocalization() {
try {
const response = await fetch('languages.json');
if (!response.ok) throw new Error("Erro na resposta");
const languagesData = await response.json();

const userLang = (navigator.language || navigator.userLanguage || "en").substring(0, 2);
currentLang = languagesData[userLang] ? languagesData[userLang] : languagesData.en;

initStaticTexts();
renderBoard();
} catch (error) {
console.error("Usando fallback de idiomas local:", error);
currentLang = {
mainTitle: "AAC Board",
lblBoardTitle: "1. Board Title:",
phBoardTitle: "e.g., Family, Routine",
lblCardWord: "2. Card Word / Caption:",
phCardWord: "e.g., Help, Eat",
lblCardImage: "3. Choose Picture from Device:",
addCardBtn: "Add to Board",
clearBoardBtn: "Reset All",
emptyBoardState: "No active board",
alertNoTitle: "Please enter a board title.",
alertNoWord: "Please enter a card word.",
alertNoFile: "Please select an image file.",
alertFull: "This board is full (max 16 cards).",
langCode: "en",
modalTitle: "Controle Parental",
modalInstruction: "Arraste o botão totalmente para a direita para desbloquear.",
sliderLabel: "Deslize >>",
doneEditing: "✓ Concluir Edição"
};
initStaticTexts();
renderBoard();
}
}

function initStaticTexts() {
mainTitle.textContent = currentLang.mainTitle;
lblBoardTitle.textContent = currentLang.lblBoardTitle;
boardTitleInput.placeholder = currentLang.phBoardTitle;
lblCardWord.textContent = currentLang.lblCardWord;
cardWordInput.placeholder = currentLang.phCardWord;
lblCardImage.textContent = currentLang.lblCardImage;
addCardBtn.textContent = currentLang.addCardBtn;
clearBoardBtn.textContent = currentLang.clearBoardBtn;

if (currentLang.isRtl) {
mainLayoutContainer.classList.add('rtl-layout');
gridDisplay.style.direction = "rtl";
} else {
mainLayoutContainer.classList.remove('rtl-layout');
gridDisplay.style.direction = "ltr";
}
}

function compressImage(file, maxWidth, maxHeight, quality) {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = function(event) {
const img = new Image();
img.src = event.target.result;
img.onload = function() {
const canvas = document.createElement('canvas');
let width = img.width;
let height = img.height;

if (width > height) {
if (width > maxWidth) {
height = Math.round((height * maxWidth) / width);
width = maxWidth;
}
} else {
if (height > maxHeight) {
width = Math.round((width * maxHeight) / height);
height = maxHeight;
}
}

canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0, width, height);

const dataUrl = canvas.toDataURL('image/jpeg', quality);
resolve(dataUrl);
};
img.onerror = error => reject(error);
};
reader.onerror = error => reject(error);
});
}

function saveState() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
} catch (e) {
console.error("Erro no LocalStorage:", e);
alert("Aviso: Memória do navegador cheia!");
}
}

function speakWord(text) {
if ('speechSynthesis' in window) {
window.speechSynthesis.cancel();
    
// Xacho pra parar de falar "Capital I"
        let textToSpeak = text;
        if (text.trim().toUpperCase() === "I") {
            textToSpeak = "eye"; 
        }
    
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = currentLang.langCode || "en"; 
window.speechSynthesis.speak(utterance);
}
}

function adjustFontSize() {
const titles = document.querySelectorAll('.aac-card h3');
titles.forEach(title => {
const parentHeight = title.parentElement.clientHeight;
let fontSize = Math.max(12, Math.floor(parentHeight * 0.14)); 
title.style.fontSize = fontSize + 'px';

while (title.scrollWidth > title.clientWidth && fontSize > 10) {
fontSize--;
title.style.fontSize = fontSize + 'px';
}
});
}

function deleteCard(boardId, cardId) {
const board = appState.boards.find(b => b.id === boardId);
if (!board) return;
board.cards = board.cards.filter(c => c.id !== cardId);
saveState();
renderBoard();
}

function renderBoard() {
if (!currentLang.mainTitle) return; 

sidebarTabs.innerHTML = "";
appState.boards.forEach(board => {
const tabRow = document.createElement('div');
tabRow.className = 'tab-row';

const bullet = document.createElement('span');
bullet.className = 'tab-bullet';
bullet.textContent = '•';
tabRow.appendChild(bullet);

const tab = document.createElement('span');
tab.className = `tab-item ${board.id === appState.activeBoardId ? 'active' : ''}`;
tab.textContent = board.title;

tab.addEventListener('click', () => {
appState.activeBoardId = board.id;
          
          if (isEditMode) {
            boardTitleInput.value = board.title;
          }

saveState();
renderBoard();
});
tabRow.appendChild(tab);

if (isEditMode) {
const deleteBoardBtn = document.createElement('button');
deleteBoardBtn.className = 'delete-board-btn';
deleteBoardBtn.innerHTML = '✕'; 
deleteBoardBtn.addEventListener('click', (e) => {
e.stopPropagation(); 
if (board.cards.length > 0) {
const msg = (currentLang.confirmDeleteBoard || "Delete board {title}?")
.replace("{title}", board.title);
if (!confirm(msg)) return;
}
appState.boards = appState.boards.filter(b => b.id !== board.id);
if (appState.activeBoardId === board.id) {
appState.activeBoardId = appState.boards.length > 0 ? appState.boards[0].id : null;
}
saveState();
renderBoard();
});
tabRow.appendChild(deleteBoardBtn);
}
sidebarTabs.appendChild(tabRow);
});

const activeBoard = appState.boards.find(b => b.id === appState.activeBoardId);
gridDisplay.innerHTML = "";
boardHeader.textContent = activeBoard ? activeBoard.title : currentLang.emptyBoardState;

for (let i = 0; i < 16; i++) {
const slot = document.createElement('div');
slot.className = 'grid-slot';

if (isEditMode && activeBoard && activeBoard.cards[i]) {
slot.classList.add('edit-active');
}

if (activeBoard && activeBoard.cards[i]) {
const card = activeBoard.cards[i];
const cardElement = document.createElement('div');
cardElement.className = 'aac-card';
cardElement.innerHTML = `<h3>${card.word}</h3><img src="${card.image}" alt="${card.word}">`;

if (isEditMode) {
const deleteBtn = document.createElement('div');
deleteBtn.className = 'delete-badge';
deleteBtn.textContent = '✕';
deleteBtn.addEventListener('click', (e) => {
e.stopPropagation(); 
deleteCard(activeBoard.id, card.id);
});
slot.appendChild(deleteBtn);
} else {
cardElement.addEventListener('click', () => speakWord(card.word));
}
slot.appendChild(cardElement);
}
gridDisplay.appendChild(slot);
}

setTimeout(adjustFontSize, 20);
}

addCardBtn.addEventListener('click', async () => {
const targetTitle = boardTitleInput.value.trim();
const word = cardWordInput.value.trim();
const file = cardImageInput.files[0];

if (!targetTitle) return alert(currentLang.alertNoTitle);
if (!word) return alert(currentLang.alertNoWord);
if (!file) return alert(currentLang.alertNoFile);

let targetBoard = appState.boards.find(b => b.title.toLowerCase() === targetTitle.toLowerCase());
if (!targetBoard) {
targetBoard = { id: 'board_' + Date.now(), title: targetTitle, cards: [] };
appState.boards.push(targetBoard);
appState.activeBoardId = targetBoard.id;
}

if (targetBoard.cards.length >= 16) return alert(currentLang.alertFull);

try {
addCardBtn.disabled = true;
const compressedBase64 = await compressImage(file, 350, 350, 0.75);

targetBoard.cards.push({
id: 'card_' + Date.now(),
word: word,
image: compressedBase64
});

saveState();
cardWordInput.value = "";
cardImageInput.value = "";
renderBoard();
} catch (error) {
console.error(error);
} finally {
addCardBtn.disabled = false;
}
});

exportBtn.addEventListener('click', () => {
if (appState.boards.length === 0) {
alert("Não há pranchas para exportar.");
return;
}

const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState));
const downloadAnchor = document.createElement('a');
downloadAnchor.setAttribute("href", dataStr);
downloadAnchor.setAttribute("download", `aac_boards_backup_${Date.now()}.json`);
document.body.appendChild(downloadAnchor);
downloadAnchor.click();
downloadAnchor.remove();
});

importFile.addEventListener('change', (e) => {
const file = e.target.files[0];
if (!file) return;

const reader = new FileReader();
reader.onload = function(event) {
try {
const importedData = JSON.parse(event.target.result);

if (importedData && Array.isArray(importedData.boards)) {
appState = importedData;
saveState();
renderBoard();
alert("Backup importado com sucesso! Todas as pranchas foram restauradas.");
} else {
alert("Erro: O ficheiro selecionado não possui um formato de backup válido.");
}
} catch (err) {
console.error(err);
alert("Erro ao ler o ficheiro de backup. Certifique-se de que é um ficheiro .json válido.");
} finally {
importFile.value = "";
}
};
reader.readAsText(file);
});
