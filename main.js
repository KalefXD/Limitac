const currentLang = document.documentElement.lang || "en";
const translation = {
    en: {
        statusTurn: () =>  `Player ${currentPlayer}'s turn`,
        statusWin: () => `Player ${currentPlayer} wins!`,
        statusDraw: 'It\'s a draw!',
    },
    es: {
        statusTurn: () => `Turno del Jugador ${currentPlayer}`,
        statusWin: () => `¡El jugador ${currentPlayer} gana!`,
        statusDraw: '¡Empate!',
    }
};

const STORAGE_KEY = 'limitac:game';

function saveGame() {
    const data = {
        currentPlayer,
        gameActive,
        gameState,
        movesCount,
        moves,
        config
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (err) { console.warn('No fue posible guardar la partida:', err); }
}

// Guardar al cerrar o recargar
window.addEventListener('beforeunload', saveGame);

// Opciones del juego
let config = {};
['showNumber', 'limitMark', 'limitTime', 'limitMove'].forEach(option => {
    const checkboxOption = document.getElementById(option);
    config[option] = checkboxOption.checked;
    checkboxOption.addEventListener('change', () => {
        config[option] = checkboxOption.checked;
    });
});

limitMark.addEventListener('change', () => {
    if (gameActive) {
        if (limitMark.checked) {
            highlightOldestMove(moves[currentPlayer]);
        } else {
            const oldCell = document.querySelector('.old');
            if (oldCell) oldCell.classList.remove('old');
        }
    }
});

limitMove.addEventListener('change', () => {
    if (gameActive) {
        const freeCells = document.querySelectorAll('.cell:not(:has(.marker-count))');
        if (limitMove.checked) {
            if (moves.total.length === 0) return document.querySelector('[data-index="4"]').disabled = true;
            const neigh = getNeighbors(moves.total[moves.total.length - 1]);
            const emptyNeigh = neigh.filter(i => gameState[i] === '');
            freeCells.forEach(cell => {
                emptyNeigh.includes(parseInt(cell.dataset.index)) ? cell.disabled = false : cell.disabled = true;
            });
        } else freeCells.forEach(cell => cell.disabled = false);
    } 
});

/* limitTime (Aún en desarrollo) */ limitTime.indeterminate = true;

// Estado del juego
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];
let currentPlayer = 'X';
let gameActive = true;
let gameState = Array(9).fill('');
let movesCount = 0;
let moves = { X: [], O: [], total: [] };

// Cargar juego guardado
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
    const { currentPlayer: cp, gameActive: ga, gameState: gs, movesCount: mc, moves: mv, config: cfg } = JSON.parse(saved);
    // Restauramos
    currentPlayer = cp;
    gameActive = ga;
    gameState = gs;
    movesCount = mc;
    moves = mv;
    config = cfg;
    showNumber.checked = config.showNumber;
    limitMark.checked = config.limitMark;
    limitTime.checked = config.limitTime;
    limitMove.checked = config.limitMove;

    // Actualizar el estado del juego
    gameState.forEach(cellPlayer => {
        if (cellPlayer !== '') movesCount--;
    });
    moves.total.forEach(cellIndex => {
        movesCount++;
        const cell = document.querySelector(`[data-index="${cellIndex}"]`);
        updateCellContent(cell, false, gameState[cellIndex]);
    });

    // Actualizar mensaje y resaltar
    if (gameActive) {
        gameStatus.textContent = translation[currentLang].statusTurn();
        if (config.limitMark) highlightOldestMove(moves[currentPlayer]);
        if (config.limitMove) {
            if (moves.total.length === 0) return document.querySelector('[data-index="4"]').disabled = true;

            const neigh = getNeighbors(moves.total[moves.total.length - 1]);
            const emptyNeigh = neigh.filter(i => gameState[i] === '');
            document.querySelectorAll('.cell:not(:has(.marker-count))').forEach(cell => {
                emptyNeigh.includes(parseInt(cell.dataset.index)) ? cell.disabled = false : cell.disabled = true;
            });
        }
    } else {
        const { checking, winners } = checkWin();
        if (checking) {
            gameStatus.textContent = translation[currentLang].statusWin();
            document.querySelectorAll('.cell').forEach(cell => {
                cell.disabled = true;
                if (winners.includes(parseInt(cell.dataset.index))) cell.classList.add('winning');
            });
        } else gameStatus.textContent = translation[currentLang].statusDraw;
    }

    localStorage.clear();
}

function handleCellClick(cellIndex, cell) {
    if (!gameActive || gameState[cellIndex] !== '') return; // Protección adicional

    const currentMoves = moves[currentPlayer];

    // Elimina la última jugada si el jugador tiene más de 3 marcas.
    if (config.limitMark && currentMoves.length >= 3) {
        const oldestMoveIndex = currentMoves.shift();
        moves.total.shift();
        gameState[oldestMoveIndex] = '';
        updateCellContent(document.querySelector(`[data-index="${oldestMoveIndex}"]`), true);
    }

    gameState[cellIndex] = currentPlayer;
    moves.total.push(cellIndex);
    const { checking, winners } = checkWin();

    // Limitar las casillas lejanas. Y aliminar las marcas cercanas si no hay casillas cercanas.
    if (config.limitMove && !checking) {
        const neigh = getNeighbors(cellIndex);
        const emptyNeigh = neigh.filter(i => gameState[i] === '');

        document.querySelectorAll('.cell:not(:has(.marker-count))').forEach(cell => {
            emptyNeigh.includes(parseInt(cell.dataset.index)) ? cell.disabled = false : cell.disabled = true;
        });

        if (emptyNeigh.length === 0) {
            const toRemove = neigh.filter(i => gameState[i] !== '');
            toRemove.forEach(i => {
                gameState[i] = '';
                // Quitar de los movimientos de los arrays
                [moves.X, moves.O, moves.total].forEach(arr => {
                    const idx = arr.indexOf(i);
                    if (idx !== -1) arr.splice(idx, 1);
                });
                updateCellContent(document.querySelector(`[data-index="${i}"]`), true);
            });
        }
    }

    movesCount++;
    currentMoves.push(cellIndex);
    updateCellContent(cell, false, currentPlayer);

    if (checking) {
        gameStatus.textContent = translation[currentLang].statusWin();
        document.querySelectorAll(`.cell`).forEach(cell => {
            cell.disabled = true;
            if (winners.includes(parseInt(cell.dataset.index))) cell.classList.add('winning');
        });

        gameActive = false;
        resetBtn.focus();
        return;
    } else if (gameState.every(cellPlayer => cellPlayer !== '')) {
        gameStatus.textContent = translation[currentLang].statusDraw;

        gameActive = false;
        resetBtn.focus();
        return;
    }

    // Cambiar el jugador
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    gameStatus.textContent = translation[currentLang].statusTurn();

    if (config.limitMark) highlightOldestMove(moves[currentPlayer]);
}

function updateCellContent(cell, reset, player = '') {
    if (reset && !cell.disabled) return;
    const cellIndex = parseInt(cell.dataset.index);
    reset ? cell.className = 'cell'
        : cell.classList.add(`marker-${player}`);
    cell.disabled = !reset;
    cell.innerHTML = reset ? `<span class="marker-cell">${cellIndex + 1}</span>`
        : `<span class="marker-player">${player}</span><span class="marker-count">${movesCount}</span>`;
}

function highlightOldestMove(moves) {
    const oldCell = document.querySelector('.old');
    if (oldCell) oldCell.classList.remove('old');
    if (moves.length >= 3) document.querySelector(`[data-index="${moves[0]}"]`).classList.add('old');
}

function getNeighbors(cellIndex) {
    const row = Math.floor(cellIndex / 3);
    const col = cellIndex % 3;
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < 3 && c >= 0 && c < 3) neighbors.push(r * 3 + c);
        }
    }
    return neighbors;
}

function checkWin() {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameState[a] !== '' &&
            gameState[a] === gameState[b] &&
            gameState[a] === gameState[c]) {
            return { checking: true, winners: [a, b, c] };
        }
    };
    return { checking: false, winners: [] };
}

function resetGame() {
    currentPlayer = 'X';
    gameActive = true;
    gameState = Array(9).fill('');
    movesCount = 0;
    moves = { X: [], O: [], total: [] };

    document.querySelectorAll('.cell').forEach(cell => updateCellContent(cell, true));
    if (config.limitMove) document.querySelector('[data-index="4"]').disabled = true;

    gameStatus.textContent = translation[currentLang].statusTurn();
}

document.addEventListener('keydown', event => {
    if (event.key >= '1' && event.key <= '9') {
        const cell = document.querySelector(`.cell[data-index="${event.key - 1}"]`);
        cell.focus();
    } else if (event.key === '0') resetBtn.focus();
});
