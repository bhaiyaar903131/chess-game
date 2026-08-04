"use strict";

const boardElement = document.getElementById("board");
const turnElement = document.getElementById("turn");
const fileLetters = ["a", "b", "c", "d", "e", "f", "g", "h"];

function squareKey(x, y) {
    return `${x}_${y}`;
}

function buildBoard() {
    boardElement.innerHTML = "";

    for (let y = 8; y >= 1; y -= 1) {
        const rank = document.createElement("div");
        rank.className = "cellprefix";
        rank.textContent = String(y);
        boardElement.appendChild(rank);

        for (let x = 1; x <= 8; x += 1) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = `gamecell ${(x + y) % 2 === 0 ? "grey" : ""}`.trim();
            cell.id = squareKey(x, y);
            cell.dataset.x = String(x);
            cell.dataset.y = String(y);
            cell.setAttribute("aria-label", `${fileLetters[x - 1]}${y}`);
            boardElement.appendChild(cell);
        }
    }

    const corner = document.createElement("div");
    corner.className = "cellprefix";
    boardElement.appendChild(corner);

    fileLetters.forEach((letter) => {
        const file = document.createElement("div");
        file.className = "cellprefix";
        file.textContent = letter;
        boardElement.appendChild(file);
    });
}

buildBoard();


const symbols = {
    white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
    black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" }
};

const backRank = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
let pieces = [];
let currentTurn = "white";

function createStartingPieces() {
    const startingPieces = [];

    for (let x = 1; x <= 8; x += 1) {
        const whiteType = backRank[x - 1];
        const blackType = backRank[x - 1];

        startingPieces.push({
            id: `white-${whiteType}-${x}`,
            color: "white",
            type: whiteType,
            x,
            y: 1,
            moved: false,
            captured: false,
            pawnFile: null
        });

        startingPieces.push({
            id: `white-pawn-${fileLetters[x - 1]}`,
            color: "white",
            type: "pawn",
            x,
            y: 2,
            moved: false,
            captured: false,
            pawnFile: fileLetters[x - 1]
        });

        startingPieces.push({
            id: `black-pawn-${fileLetters[x - 1]}`,
            color: "black",
            type: "pawn",
            x,
            y: 7,
            moved: false,
            captured: false,
            pawnFile: fileLetters[x - 1]
        });

        startingPieces.push({
            id: `black-${blackType}-${x}`,
            color: "black",
            type: blackType,
            x,
            y: 8,
            moved: false,
            captured: false,
            pawnFile: null
        });
    }

    return startingPieces;
}

function pieceAt(x, y) {
    return pieces.find((piece) => !piece.captured && piece.x === x && piece.y === y) || null;
}

function renderPieces() {
    document.querySelectorAll(".gamecell").forEach((cell) => {
        cell.replaceChildren();
    });

    pieces.filter((piece) => !piece.captured).forEach((piece) => {
        const cell = document.getElementById(squareKey(piece.x, piece.y));
        const pieceElement = document.createElement("span");
        pieceElement.className = `piece ${piece.color}`;
        pieceElement.dataset.pieceId = piece.id;
        pieceElement.textContent = symbols[piece.color][piece.type];
        pieceElement.setAttribute("aria-hidden", "true");
        cell.appendChild(pieceElement);
        cell.setAttribute("aria-label", `${fileLetters[piece.x - 1]}${piece.y}, ${piece.color} ${piece.type}`);
    });
}

pieces = createStartingPieces();
renderPieces();


let selectedPiece = null;
let legalTargets = [];
let capturedPieces = [];
let lastMove = null;

function insideBoard(x, y) {
    return x >= 1 && x <= 8 && y >= 1 && y <= 8;
}

function canLand(piece, x, y) {
    if (!insideBoard(x, y)) {
        return false;
    }

    const occupant = pieceAt(x, y);
    return !occupant || occupant.color !== piece.color;
}

function getMoves(piece) {
    switch (piece.type) {
        case "pawn": return pawnMoves(piece);
        case "rook": return rookMoves(piece);
        case "bishop": return bishopMoves(piece);
        case "queen": return queenMoves(piece);
        case "knight": return knightMoves(piece);
        case "king": return kingMoves(piece);
        default: return [];
    }
}

function clearHighlights() {
    document.querySelectorAll(".gamecell").forEach((cell) => {
        cell.classList.remove("selected", "green", "capture-target");
    });
}

function showMoves(piece) {
    clearHighlights();
    legalTargets = getMoves(piece);

    const selectedCell = document.getElementById(squareKey(piece.x, piece.y));
    selectedCell.classList.add("selected");
    legalTargets.forEach((move) => {
        const cell = document.getElementById(squareKey(move.x, move.y));
        cell.classList.add("green");

        if (pieceAt(move.x, move.y)) {
            cell.classList.add("capture-target");
        }
    });
}

function targetMove(x, y) {
    return legalTargets.find((move) => move.x === x && move.y === y) || null;
}

function flashTurn() {
    turnElement.classList.add("turnhighlight");
    window.setTimeout(() => turnElement.classList.remove("turnhighlight"), 420);
}

function updateTurnText() {
    turnElement.textContent = `It's ${currentTurn === "white" ? "Whites" : "Blacks"} Turn!`;
}

function finishMove(piece, move) {
    const previous = { x: piece.x, y: piece.y };
    const captured = pieceAt(move.x, move.y);

    if (captured) {
        captured.captured = true;
        captured.capturedBy = piece.color;
        capturedPieces.push(captured);
    }

    piece.x = move.x;
    piece.y = move.y;
    piece.moved = true;
    lastMove = { from: previous, to: { x: piece.x, y: piece.y } };

    currentTurn = currentTurn === "white" ? "black" : "white";
    selectedPiece = null;
    legalTargets = [];
    clearHighlights();
    renderPieces();
    updateTurnText();
    flashTurn();
}

function handleBoardClick(event) {
    const cell = event.target.closest(".gamecell");
    if (!cell) {
        return;
    }

    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const clickedPiece = pieceAt(x, y);
    const move = selectedPiece ? targetMove(x, y) : null;

    if (selectedPiece && move) {
        finishMove(selectedPiece, move);
        return;
    }

    if (clickedPiece && clickedPiece.color === currentTurn) {
        selectedPiece = clickedPiece;
        showMoves(clickedPiece);
        return;
    }

    selectedPiece = null;
    legalTargets = [];
    clearHighlights();
    updateTurnText();
}

boardElement.addEventListener("click", handleBoardClick);


function pawnMoves(piece) {
    const moves = [];
    const direction = piece.color === "white" ? 1 : -1;
    const nextY = piece.y + direction;

    if (insideBoard(piece.x, nextY) && !pieceAt(piece.x, nextY)) {
        moves.push({ x: piece.x, y: nextY });

        const twoY = piece.y + direction * 2;
        if (!piece.moved && insideBoard(piece.x, twoY) && !pieceAt(piece.x, twoY)) {
            moves.push({ x: piece.x, y: twoY });
        }
    }

    [-1, 1].forEach((offset) => {
        const targetX = piece.x + offset;
        const target = pieceAt(targetX, nextY);

        if (target && target.color !== piece.color) {
            moves.push({ x: targetX, y: nextY });
        }
    });

    return moves;
}


function rayMoves(piece, directions) {
    const moves = [];

    directions.forEach(([stepX, stepY]) => {
        let x = piece.x + stepX;
        let y = piece.y + stepY;

        while (insideBoard(x, y)) {
            const occupant = pieceAt(x, y);

            if (!occupant) {
                moves.push({ x, y });
            } else {
                if (occupant.color !== piece.color) {
                    moves.push({ x, y });
                }
                break;
            }

            x += stepX;
            y += stepY;
        }
    });

    return moves;
}

function rookMoves(piece) {
    return rayMoves(piece, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
}


function bishopMoves(piece) {
    return rayMoves(piece, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
}

function queenMoves(piece) {
    return rayMoves(piece, [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
}


function knightMoves(piece) {
    const offsets = [
        [1, 2], [2, 1], [2, -1], [1, -2],
        [-1, -2], [-2, -1], [-2, 1], [-1, 2]
    ];

    return offsets
        .map(([offsetX, offsetY]) => ({ x: piece.x + offsetX, y: piece.y + offsetY }))
        .filter((move) => canLand(piece, move.x, move.y));
}

function kingMoves(piece) {
    const moves = [];

    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            if (offsetX === 0 && offsetY === 0) {
                continue;
            }

            const x = piece.x + offsetX;
            const y = piece.y + offsetY;

            if (canLand(piece, x, y)) {
                moves.push({ x, y });
            }
        }
    }

    return moves;
}
