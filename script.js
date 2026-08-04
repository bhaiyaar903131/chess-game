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

function clearSelection() {
    selectedPiece = null;
    document.querySelectorAll(".gamecell").forEach((cell) => {
        cell.classList.remove("selected", "green");
    });
}

function handleSelection(event) {
    const cell = event.target.closest(".gamecell");
    if (!cell) {
        return;
    }

    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const piece = pieceAt(x, y);

    clearSelection();

    if (!piece || piece.color !== currentTurn) {
        return;
    }

    selectedPiece = piece;
    cell.classList.add("selected");
    turnElement.textContent = `${piece.color === "white" ? "White" : "Black"} ${piece.type} selected`;
}

boardElement.addEventListener("click", handleSelection);
