// ui.js

function renderBoard() {
    if (!currentLang.mainTitle) return; 
    renderSidebar();
    renderGrid();
}

function renderSidebar() {
    sidebarTabs.innerHTML = "";

    appState.boards.forEach((board) => {
        const tabRow = document.createElement('div');
        tabRow.className = `tab-row ${selectedSwapBoardId === board.id ? 'selected-for-swap' : ''}`;
        
        // --- TAP-TO-SWAP LOGIC FOR SIDEBAR ---
        if (isEditMode) {
            tabRow.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (!selectedSwapBoardId) {
                    // First tap: Select the board
                    selectedSwapBoardId = board.id;
                    renderSidebar();
                } else if (selectedSwapBoardId === board.id) {
                    // Second tap on same: Deselect
                    selectedSwapBoardId = null;
                    renderSidebar();
                } else {
                    // Second tap on different: Swap the boards
                    window.swapBoards(selectedSwapBoardId, board.id);
                    selectedSwapBoardId = null; 
                    // renderSidebar will be called by swapBoards()
                }
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
        
        // Normal navigation click only works if NOT in a swap-selection state
        if (!selectedSwapBoardId) {
            tab.addEventListener('click', () => {
                appState.activeBoardId = board.id;
                currentPage = 0;
                if (isEditMode) boardTitleInput.value = board.title;
                saveState();
                renderBoard();
            });
        }
        tabRow.appendChild(tab);

        // --- Delete Button Logic ---
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
        
        const card = pageCards[i];
        
        if (card) {
            const cardElement = document.createElement('div');
            cardElement.className = 'aac-card';
            
            // Add visual selection class if this card is currently selected
            if (isEditMode && selectedSwapCardId === card.id) {
                cardElement.classList.add('selected-for-swap');
            }

            cardElement.innerHTML = `<h3>${card.word}</h3><img src="${card.image}" alt="${card.word}">`;

            if (isEditMode) {
                // TAP-TO-SWAP LOGIC
                cardElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (!selectedSwapCardId) {
                        // First tap: Select the card
                        selectedSwapCardId = card.id;
                        renderGrid(); 
                    } else if (selectedSwapCardId === card.id) {
                        // Second tap on same card: Deselect
                        selectedSwapCardId = null;
                        renderGrid();
                    } else {
                        // Second tap on different card: Perform the swap
                        window.swapCards(selectedSwapCardId, card.id);
                        selectedSwapCardId = null;
                    }
                });

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
    
    const pageIndicator = document.createElement('div');
    pageIndicator.style.textAlign = 'center';
    pageIndicator.style.width = '100%';
    pageIndicator.textContent = `Page ${currentPage + 1}`;
    gridDisplay.appendChild(pageIndicator);

    setTimeout(adjustFontSize, 20);
}

// Global exports
window.renderBoard = renderBoard;
window.renderSidebar = renderSidebar;
window.renderGrid = renderGrid;
