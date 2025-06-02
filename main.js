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

const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

const STORAGE_KEY = 'limitac:game';

function saveGame() {
    const data = {
      currentPlayer,
      gameActive,
      gameState,
      movesCount,
      moves
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (err) { console.warn('No fue posible guardar la partida:', err); }
}

// Guardar al cerrar o recargar
window.addEventListener('beforeunload', saveGame);

// Estado del juego
let currentPlayer = 'X';
let gameActive = true;
let gameState = Array(9).fill('');
let movesCount = 0;
let moves = { X: [], O: [], total: [] };

// Cargar juego guardado
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
    const { currentPlayer: cp, gameActive: ga, gameState: gs, movesCount: mc, moves: mv } = JSON.parse(saved);
    // Restauramos
    currentPlayer = cp;
    gameActive = ga;
    gameState = gs;
    movesCount = (mc - 6) > 0 ? mc - 6 : 0;
    moves = mv;

    // Actualizar el estado del juego
    moves.total.forEach(index => {
        movesCount++;
        const cell = document.querySelector(`[data-index="${index}"]`);
        updateCellContent(cell, false, gameState[index]);
    });

    // Actualizar mensaje y resaltar
    if (gameActive) {
        gameStatus.textContent = translation[currentLang].statusTurn();
        highlightOldestMove(moves[currentPlayer]);
    } else {
        gameStatus.textContent = translation[currentLang].statusWin();
        document.querySelectorAll('.cell').forEach(cell => {
            cell.disabled = true;
            if (cell.textContent.includes(`${currentPlayer}`)) cell.classList.add('winning');
        });
    }

    localStorage.removeItem(STORAGE_KEY);
}

function handleCellClick(cellIndex, cell) {
    if (!gameActive || gameState[cellIndex] !== '') return;

    const currentMoves = moves[currentPlayer];

    // Elimina la última jugada si el jugador tiene más de 3 jugadas.
    if (currentMoves.length >= 3) {
        const oldestMoveIndex = currentMoves.shift();
        moves.total.shift();
        gameState[oldestMoveIndex] = '';
        updateCellContent(document.querySelector(`[data-index="${oldestMoveIndex}"]`), true);
    }

    movesCount++;
    currentMoves.push(cellIndex);
    moves.total.push(cellIndex);
    gameState[cellIndex] = currentPlayer;
    updateCellContent(cell, false, currentPlayer);

    if (checkWin()) {
        gameStatus.textContent = translation[currentLang].statusWin();
        document.querySelectorAll(`.cell`).forEach(cell => {
            cell.disabled = true;
            if (cell.textContent.includes(`${currentPlayer}`)) cell.classList.add('winning');
        });
        gameActive = false;
        resetBtn.focus();
        return;
    }

    // Cambiar el jugador
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    gameStatus.textContent = translation[currentLang].statusTurn();
    highlightOldestMove(moves[currentPlayer]);
}

function updateCellContent(cell, reset, player = '') {
    if (reset && !cell.disabled) return;
    const cellIndex = parseInt(cell.dataset.index);
    reset ? cell.className = 'cell'
        : cell.classList.add(`marker-${player}`);
    cell.tabIndex = reset ? 0 : -1;
    cell.disabled = !reset;
    cell.innerHTML = reset ? `<span class="marker-cell">${cellIndex + 1}</span>`
        : `<span class="marker">${player}</span><span class="marker-order">${movesCount}</span>`;
}

function highlightOldestMove(moves) {
    const oldCell = document.querySelector('.old');
    if (oldCell) oldCell.classList.remove('old');
    if (moves.length >= 3) document.querySelector(`[data-index="${moves[0]}"]`).classList.add('old');
}

// Chequear si el jugador actual ganó
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
    moves = { X: [], O: [], total: [] };

    document.querySelectorAll('.cell').forEach(cell => updateCellContent(cell, true));

    gameStatus.textContent = translation[currentLang].statusTurn();
}

document.addEventListener('keydown', event => {
    if (event.key >= '1' && event.key <= '9') {
        const cell = document.querySelector(`.cell[data-index="${event.key - 1}"]`);
        cell.focus();
    } else if (event.key === '0') resetBtn.focus();
});