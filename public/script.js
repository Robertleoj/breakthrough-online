const socket = io();
const board = document.getElementById("game-board");
const rows = 8;
const cols = 8;
let currentPlayer = 1;
let selectedPiece = null;
const status = document.getElementById("status");
const restart = document.getElementById("restart");
const flipButton = document.getElementById("flip");

let roomId;


// Initialize game board
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const cell = document.createElement("div");
        cell.className = "cell " + (i % 2 === j % 2 ? "white" : "black");
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.onclick = handleClick;
        if (i < 2) {
            const piece = document.createElement("div");
            piece.className = "piece player1";
            piece.dataset.row = i;
            piece.dataset.col = j;
            cell.appendChild(piece);
        } else if (i > rows - 3) {
            const piece = document.createElement("div");
            piece.className = "piece player2";
            piece.dataset.row = i;
            piece.dataset.col = j;
            cell.appendChild(piece);
        }
        board.appendChild(cell);
    }
}

function handleClick(e) {
    const cell = e.target.closest(".cell");
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    console.log("Clicked on cell", row, col)
    const piece = cell.querySelector(".piece");
    console.log(piece)

    if (selectedPiece && isValidMove(selectedPiece, row, col)) {
        // Emit move event to the server
        socket.emit("move", {
            roomId,
            fromRow: parseInt(selectedPiece.dataset.row),
            fromCol: parseInt(selectedPiece.dataset.col),
            toRow: row,
            toCol: col,
        });


        movePiece(selectedPiece, row, col);
        if (checkWin(row)) {
            status.textContent = `Player ${currentPlayer} wins!`;
            board.style.pointerEvents = "none"; // Disable further moves
        } else {
            currentPlayer = 3 - currentPlayer; // Switch to the other player
            status.textContent = `Player ${currentPlayer}'s turn`;
        }
        selectedPiece = null;
        // currentPlayer = 3 - currentPlayer; // Switch to the other player
        // console.log("moved")
    } else if (piece && piece.classList.contains("player" + currentPlayer)) {
        selectedPiece = piece;
    }
}


function isValidMove(piece, newRow, newCol) {
    const oldRow = parseInt(piece.dataset.row);
    const oldCol = parseInt(piece.dataset.col);
    const rowDiff = newRow - oldRow;
    const colDiff = newCol - oldCol;

    // Ensure the piece is moving forward
    if ((currentPlayer === 1 && rowDiff !== 1) || (currentPlayer === 2 && rowDiff !== -1)) {
        return false;
    }

    // Ensure the piece is moving to an adjacent or diagonal cell
    if (Math.abs(colDiff) > 1) {
        return false;
    }

    const destinationCell = document.querySelector(`[data-row='${newRow}'][data-col='${newCol}']`);
    const destinationPiece = destinationCell.querySelector(".piece");

    // Check for diagonal capture or empty cell
    if (destinationPiece) {
        if (destinationPiece.classList.contains("player" + (3 - currentPlayer)) && Math.abs(colDiff) === 1) {
            return true;
        }
    } else {
        return true;
    }

    return false;
}


function movePiece(piece, newRow, newCol) {
    const oldCell = document.querySelector(`[data-row='${piece.dataset.row}'][data-col='${piece.dataset.col}']`);
    const newCell = document.querySelector(`[data-row='${newRow}'][data-col='${newCol}']`);
    const capturedPiece = newCell.querySelector(".piece");

    if (capturedPiece) {
        newCell.removeChild(capturedPiece);
    }

    oldCell.removeChild(piece);
    newCell.appendChild(piece);
    piece.dataset.row = newRow;
    piece.dataset.col = newCol;
}


// Listen for opponent's move
socket.on("move", function (data) {
    const piece = document.querySelector(`[data-row='${data.fromRow}'][data-col='${data.fromCol}'] .piece`);
    movePiece(piece, data.toRow, data.toCol);

    if (checkWin(data.toRow)) {
        status.textContent = `Player ${3 - currentPlayer} wins!`;
        board.style.pointerEvents = "none"; // Disable further moves
    } else {
        currentPlayer = 3 - currentPlayer; // Switch to the other player
        status.textContent = `Player ${currentPlayer}'s turn`;
    }
});

socket.on("created", (data) => {
  roomId = data.roomId;
  currentPlayer = data.player;
  status.textContent = `You are Player ${currentPlayer}. Share this room ID with your friend: ${roomId}`;
});

socket.on("joined", (data) => {
  roomId = data.roomId;
  currentPlayer = data.player;
  status.textContent = `You are Player ${currentPlayer}. Waiting for Player ${(3 - currentPlayer)}...`;
});

socket.on("start", () => {
  status.textContent = `Player ${currentPlayer}'s turn`;
  board.style.pointerEvents = "auto";
});

socket.on("error", (message) => {
  alert(message);
});




// Add a new function to check for a win
function checkWin(row) {
    return currentPlayer === 1 ? row === rows - 1 : row === 0;
}

// Add a function to restart the game
function restartGame() {
    location.reload();
}

function flipBoard() {
    board.classList.toggle("flipped");
}

// Add a function to create a new room
function createRoom() {
  socket.emit("create");
}

// Add a function to join an existing room
function joinRoom() {
    // get room id 
    roomId = document.getElementById("room-id").value;
    console.log("joining room " + roomId)
    socket.emit("join", roomId);
}

