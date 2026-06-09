//script.js

function checkDeviceCompatibility() {
    if (window.innerWidth < 375) {
        document.getElementById('deviceWarning').style.display = 'block';
    }
}

async function initSystem() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const userLang = (navigator.language || navigator.userLanguage || "en").substring(0, 2);
        const fileName = `sample_${userLang}.json`;

        try {
            const response = await fetch(fileName);
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

// Swipe support
let touchStartX = null; // Use null to signify "no active swipe"

document.addEventListener('touchstart', e => {
    // Check if the target is part of the parental modal or the slider
    const isInsideModal = e.target.closest('.parental-box') || e.target.closest('.ios-slider');
    
    // Only set touchStartX if we are NOT inside a modal
    if (!isInsideModal) {
        touchStartX = e.changedTouches[0].screenX;
    } else {
        touchStartX = null; // Explicitly nullify if they touch inside a modal
    }
});

document.addEventListener('touchend', e => {
    // If we didn't start a swipe on the main page, do nothing
    if (touchStartX === null) return;

    let touchEndX = e.changedTouches[0].screenX;
    
    // Calculate distance
    let diff = touchStartX - touchEndX;

    if (diff > 50) changePage(1);  // Swipe Left
    if (diff < -50) changePage(-1); // Swipe Right
    
    // Reset after processing
    touchStartX = null;
});

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
            adminToggleBtn.textContent = currentLang.doneEditing; 
            adminToggleBtn.classList.add('editing');
            const activeBoard = appState.boards.find(b => b.id === appState.activeBoardId);
            boardTitleInput.value = activeBoard ? activeBoard.title : "";
        } else {
            creatorPanel.style.display = "none";
            adminToggleBtn.textContent = currentLang.setupBtn; 
            adminToggleBtn.classList.remove('editing');
        }
        renderBoard(); // Now calls the function from ui.js
    } else if (action === 'resetAll') {
        appState = { activeBoardId: null, boards: [] };
        localStorage.removeItem(STORAGE_KEY);
        boardTitleInput.value = "";
        cardWordInput.value = "";
        cardImageInput.value = "";
        isEditMode = false;
        creatorPanel.style.display = "none";
        adminToggleBtn.textContent = currentLang.setupBtn; 
        adminToggleBtn.classList.remove('editing');
        initStaticTexts();
        renderBoard(); // Now calls the function from ui.js
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
    exportBtn.textContent = currentLang.exportBtn;
    importBtn.textContent = currentLang.importBtn;
    adminToggleBtn.textContent = currentLang.setupBtn; 

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
                let width = img.width, height = img.height;
                if (width > height) {
                    if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                } else {
                    if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
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
        let textToSpeak = (text.trim().toUpperCase() === "I") ? "eye" : text;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
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

addCardBtn.addEventListener('click', async () => {
    const targetTitle = boardTitleInput.value.trim();
    const word = cardWordInput.value.trim();
    const file = cardImageInput.files[0];
    if (!targetTitle || !word || !file) return alert(currentLang.alertNoTitle || "Please check inputs.");

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
        targetBoard.cards.push({ id: 'card_' + Date.now(), word, image: compressedBase64 });
        saveState();
        cardWordInput.value = ""; cardImageInput.value = "";
        renderBoard();
    } catch (error) { console.error(error); } finally { addCardBtn.disabled = false; }
});

function changePage(direction) {
    currentPage += direction;
    renderGrid(); // ui.js will use this updated currentPage variable
}

function renderPatreonLink() {
    const sidebarTabs = document.getElementById('sidebarTabs');
    if (!sidebarTabs) return;

    // Create a container for the image
    const patreonContainer = document.createElement('div');
    patreonContainer.className = 'patreon-container';
    patreonContainer.style.marginTop = '20px';
    patreonContainer.style.textAlign = 'center';

    // Create the image element
    const img = document.createElement('img');
    img.src = 'patreon.png'; // Ensure this file is in your project folder
    img.alt = 'Patreon';
    img.style.width = '80%'; // Adjust the size as needed
    img.style.maxWidth = '150px';

    patreonContainer.appendChild(img);
    sidebarTabs.appendChild(patreonContainer);
}

exportBtn.addEventListener('click', () => {
    if (appState.boards.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aac_boards_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

function swapCards(id1, id2) {
    const board = appState.boards.find(b => b.id === appState.activeBoardId);
    if (!board) return;

    const index1 = board.cards.findIndex(c => c.id === id1);
    const index2 = board.cards.findIndex(c => c.id === id2);

    if (index1 > -1 && index2 > -1) {
        [board.cards[index1], board.cards[index2]] = [board.cards[index2], board.cards[index1]];
        
        // ADD THIS RESET:
        selectedSwapCardId = null; 
        
        saveState();
        renderBoard();
    }
}

function swapBoards(id1, id2) {
    const index1 = appState.boards.findIndex(b => b.id === id1);
    const index2 = appState.boards.findIndex(b => b.id === id2);

    if (index1 > -1 && index2 > -1) {
        [appState.boards[index1], appState.boards[index2]] = [appState.boards[index2], appState.boards[index1]];
        
        // ADD THIS RESET:
        selectedSwapBoardId = null; 
        
        saveState();
        renderBoard();
    }
}


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
            }
        } catch (err) { console.error(err); } finally { importFile.value = ""; }
    };
    reader.readAsText(file);
});

