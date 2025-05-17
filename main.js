const board = document.getElementById('board');
const gameStatus = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const backwardBtn = document.getElementById('backwardBtn');
const forwardBtn = document.getElementById('forwardBtn');

const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

const cellIndexs = [6, 7, 8, 3, 4, 5, 0, 1, 2];
let currentPlayer = 'X';
let gameActive = true;
let gameState = Array(9).fill('');
let xMoves = [];
let oMoves = [];
let moves = 0;

// Crear casillas del tablero
cellIndexs.forEach((i) => {
    const cell = document.createElement('button');
    cell.classList.add('cell');
    cell.setAttribute('data-index', i);
    cell.setAttribute('aria-label', `Casilla ${i + 1}`);
    cell.setAttribute('aria-live', 'polite');
    cell.setAttribute('role', 'gridcell');
    cell.addEventListener('click', () => handleCellClick(i, cell));
    board.appendChild(cell);
    updateCellContent(cell, i + 1, true);
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

    moves++;
    currentMoves.push(cellIndex);
    gameState[cellIndex] = currentPlayer;
    updateCellContent(cell, moves, false, currentPlayer);

    if (checkWin()) {
        gameStatus.textContent = `¡El jugador ${currentPlayer} gana!`;
        document.querySelectorAll(`.cell`).forEach(cell => {
            cell.setAttribute('aria-disabled', true);
            if (cell.textContent.includes(`${currentPlayer}`)) cell.classList.add('winning');
        });
        gameActive = false;
        resetBtn.focus();
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    gameStatus.textContent = `Turno del Jugador ${currentPlayer}`;
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
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('old'));
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

resetBtn.addEventListener('click', resetGame);

function resetGame() {
    currentPlayer = 'X';
    gameActive = true;
    gameState = Array(9).fill('');
    xMoves = [];
    oMoves = [];
    moves = 0;

    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.setAttribute('aria-disabled', false);
        updateCellContent(cell, cellIndexs[index] + 1, true);
    });

    gameStatus.textContent = "Turno del Jugador X";
}

document.addEventListener('keydown', handleKeyDown);

function handleKeyDown(event) {
    if (event.key >= '1' && event.key <= '9') {
        const cell = document.querySelector(`.cell[data-index="${event.key - 1}"]`);
        cell.focus();
    } else if (event.key === '0') {
        resetBtn.focus();
    }
}