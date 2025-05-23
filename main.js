const currentLang = document.documentElement.lang || "en";
const translation = {
    en: {
        statusTurn: () =>  `Player ${currentPlayer}'s turn`,
        statusWin: () => `Player ${currentPlayer} wins!`,
    },
    es: {
        statusTurn: () => `Turno del Jugador ${currentPlayer}`,
        statusWin: () => `¡El jugador ${currentPlayer} gana!`,
    }
};

const board = document.getElementById('board');
const gameStatus = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

const cellIndexs = [6, 7, 8, 3, 4, 5, 0, 1, 2];
let currentPlayer = 'X';
let gameActive = true;
let gameState = Array(9).fill('');
let movesCount = 0;
let xMoves = [];
let oMoves = [];

document.querySelectorAll('.cell').forEach((cell, index) => {
    updateCellContent(cell, cellIndexs[index] + 1, true);
});

function handleCellClick(cellIndex, cell) {
    if (!gameActive || gameState[cellIndex] !== '') return;

    const currentMoves = currentPlayer === 'X' ? xMoves : oMoves;

    // Eliminar la celda más antigua
    if (currentMoves.length >= 3) {
        const oldestMoveIndex = currentMoves.shift();
        gameState[oldestMoveIndex] = '';
        updateCellContent(document.querySelector(`[data-index="${oldestMoveIndex}"]`), oldestMoveIndex + 1, true);
    }

    movesCount++;
    currentMoves.push(cellIndex);
    gameState[cellIndex] = currentPlayer;
    updateCellContent(cell, movesCount, false, currentPlayer);

    if (checkWin()) {
        gameStatus.textContent = translation[currentLang].statusWin();
        document.querySelectorAll(`.cell`).forEach(cell => {
            cell.setAttribute('aria-disabled', true);
            if (cell.textContent.includes(`${currentPlayer}`)) cell.classList.add('winning');
        });
        gameActive = false;
        resetBtn.focus();
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    gameStatus.textContent = translation[currentLang].statusTurn();
    highlightOldestMove(currentPlayer === 'X' ? xMoves : oMoves);
}

function updateCellContent(cell, content, reset = false, player = '') {
    if (reset && cell.getAttribute('tabindex') === '0') return;
    if (reset) cell.className = 'cell';
    cell.setAttribute('aria-disabled', !reset);
    cell.setAttribute('tabindex', reset ? '0' : '-1');
    cell.classList.toggle(`marker-${player}`, !reset && player !== '');
    cell.innerHTML = reset
        ? `<span class="marker-cell">${content}</span>`
        : `${player}<span class="marker-order">${content}</span>`;
}

function highlightOldestMove(moves) {
    if (document.querySelector('.old')) document.querySelector('.old').classList.remove('old');
    if (moves.length >= 3) {
        const oldestMoveIndex = moves[0];
        document.querySelector(`[data-index="${oldestMoveIndex}"]`).classList.add('old');
    }
}

function checkWin() {
    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return gameState[a] !== '' &&
            gameState[a] === gameState[b] &&
            gameState[a] === gameState[c];
    });
}

function resetGame() {
    currentPlayer = 'X';
    gameActive = true;
    gameState = Array(9).fill('');
    movesCount = 0;
    xMoves = [];
    oMoves = [];

    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.setAttribute('aria-disabled', false);
        updateCellContent(cell, cellIndexs[index] + 1, true);
    });

    gameStatus.textContent = translation[currentLang].statusTurn();
}

document.addEventListener('keydown', handleKeyDown);

function handleKeyDown(event) {
    if (event.key >= '1' && event.key <= '9') {
        const cell = document.querySelector(`.cell[data-index="${event.key - 1}"]`);
        if (cell.getAttribute('aria-disabled') === 'false') cell.focus();
    } else if (event.key === '0') {
        resetBtn.focus();
    }
}