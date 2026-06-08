//ui.js
let draggedCardId = null;
let draggedBoardId = null;


function renderBoard() {
    if (!currentLang.mainTitle) return; 
    renderSidebar();
    renderGrid();
}

function handleDrop(e, targetIndex) {
    e.preventDefault();
    const activeBoard = appState.boards.find(b => b.id === appState.activeBoardId);
    
    // Calculate index of the card dropped ON
    const targetGlobalIndex = (currentPage * 16) + targetIndex;
    const targetCard = activeBoard.cards[targetGlobalIndex];

    if (targetCard && draggedCardId !== targetCard.id) {
        // Use the function you defined in script.js
        window.swapCards(draggedCardId, targetCard.id);
    }
}

function renderSidebar() {
    sidebarTabs.innerHTML = "";

    appState.boards.forEach((board) => {
        const tabRow = document.createElement('div');
        tabRow.className = 'tab-row';
        
        // --- Drag and Drop Logic ---
        if (isEditMode) {
            tabRow.draggable = true;
            tabRow.dataset.id = board.id;
            
            tabRow.addEventListener('dragstart', (e) => {
                draggedBoardId = board.id;
            });

            tabRow.addEventListener('dragover', (e) => e.preventDefault());
            
            tabRow.addEventListener('drop', (e) => {
                e.preventDefault();
                swapBoards(draggedBoardId, board.id);
            });
        }
        
        // --- Bullet and Tab Content ---
        const bullet = document.createElement('span');
        bullet.className = 'tab-bullet';
        bullet.textContent = '•';
        tabRow.appendChild(bullet);

        const tab = document.createElement('span');
        tab.className = `tab-item ${board.id === appState.activeBoardId ? 'active' : ''}`;
        tab.textContent = board.title;
        
        tab.addEventListener('click', () => {
            appState.activeBoardId = board.id;
            currentPage = 0;
            if (isEditMode) boardTitleInput.value = board.title;
            saveState();
            renderBoard();
        });
        tabRow.appendChild(tab);

        // --- RESTORED: Delete Button Logic ---
        if (isEditMode) {
            const deleteBoardBtn = document.createElement('button');
            deleteBoardBtn.className = 'delete-board-btn';
            deleteBoardBtn.innerHTML = '✕'; 
            deleteBoardBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (board.cards.length > 0 && !confirm((currentLang.confirmDeleteBoard || "Delete board?"))) return;
                appState.boards = appState.boards.filter(b => b.id !== board.id);
                if (appState.activeBoardId === board.id) appState.activeBoardId = appState.boards.length > 0 ? appState.boards[0].id : null;
                saveState();
                renderBoard();
            });
            tabRow.appendChild(deleteBoardBtn);
        }

        sidebarTabs.appendChild(tabRow);
    });
    renderPatreonLink();
}

function renderGrid() {
    const activeBoard = appState.boards.find(b => b.id === appState.activeBoardId);
    gridDisplay.innerHTML = "";
    boardHeader.textContent = activeBoard ? activeBoard.title : currentLang.emptyBoardState;

    if (!activeBoard) return;

    const pageSize = 16;
    const start = currentPage * pageSize;
    const pageCards = activeBoard.cards.slice(start, start + pageSize);

    for (let i = 0; i < pageSize; i++) {
        const slot = document.createElement('div');
        slot.className = 'grid-slot';
        
        // 4. Add drop listeners to the SLOT
        if (isEditMode) {
            slot.addEventListener('dragover', (e) => e.preventDefault());
            slot.addEventListener('drop', (e) => handleDrop(e, i));
        }
        
        const card = pageCards[i];
        if (isEditMode && card) slot.classList.add('edit-active');

        if (card) {
            const cardElement = document.createElement('div');
            cardElement.className = 'aac-card';
            cardElement.innerHTML = `<h3>${card.word}</h3><img src="${card.image}" alt="${card.word}">`;

            if (isEditMode) {
                cardElement.draggable = true;
                cardElement.dataset.id = card.id;
                
                cardElement.addEventListener('dragstart', (e) => {
                    draggedCardId = card.id;
                });

                const deleteBtn = document.createElement('div');
                deleteBtn.className = 'delete-badge';
                deleteBtn.textContent = '✕';
                deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteCard(activeBoard.id, card.id); });
                slot.appendChild(deleteBtn);
            } else {
                cardElement.addEventListener('click', () => speakWord(card.word));
            }
            slot.appendChild(cardElement);
        }
        gridDisplay.appendChild(slot);
    } // <--- THIS BRACE WAS MISSING
    
    const pageIndicator = document.createElement('div');
    pageIndicator.style.textAlign = 'center';
    pageIndicator.style.width = '100%';
    pageIndicator.textContent = `Page ${currentPage + 1}`;
    gridDisplay.appendChild(pageIndicator);

    setTimeout(adjustFontSize, 20);
}

// Add these lines at the bottom of ui.js
window.renderBoard = renderBoard;
window.renderSidebar = renderSidebar;
window.renderGrid = renderGrid;