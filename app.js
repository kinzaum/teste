// app.js
const STORAGE_KEY = 'aac_multi_canvas_system';
let currentLang = {}; 
let isEditMode = false;
let pendingAction = null;
let currentPage = 0; // Keep it here!
let selectedSwapId = null;
// Selection states
let selectedSwapCardId = null;
let selectedSwapBoardId = null;

let appState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    activeBoardId: null,
    boards: []
};
