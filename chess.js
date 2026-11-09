const winOverlay = document.getElementById('winner-overlay');
const closeBtn = document.getElementById('close-popup-btn');
const who = document.querySelector("#who"); // white or black or draw
const how = document.querySelector("#how"); // by checkmate, by stalemate, .....
const no_of_moves = document.querySelector("#moves");
const square = Array.from(document.getElementsByClassName("square")); // array of 64 squares
const container = document.querySelector(".promotion-container");
const startPos = [ // starting configuration of pieces
    "Pieces/rook-black.svg", "Pieces/knight-black.svg", "Pieces/bishop-black.svg", "Pieces/queen-black.svg", "Pieces/king-black.svg", "Pieces/bishop-black.svg", "Pieces/knight-black.svg", "Pieces/rook-black.svg",
    "Pieces/pawn-black.svg", "Pieces/pawn-black.svg", "Pieces/pawn-black.svg", "Pieces/pawn-black.svg", "Pieces/pawn-black.svg", "Pieces/pawn-black.svg", "Pieces/pawn-black.svg", "Pieces/pawn-black.svg",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "Pieces/pawn-white.svg", "Pieces/pawn-white.svg", "Pieces/pawn-white.svg", "Pieces/pawn-white.svg", "Pieces/pawn-white.svg", "Pieces/pawn-white.svg", "Pieces/pawn-white.svg", "Pieces/pawn-white.svg",
    "Pieces/rook-white.svg", "Pieces/knight-white.svg", "Pieces/bishop-white.svg", "Pieces/queen-white.svg", "Pieces/king-white.svg", "Pieces/bishop-white.svg", "Pieces/knight-white.svg", "Pieces/rook-white.svg"
];
const storedMoves = []; // stores every last move
const storedPositions = []; // stores all positions
const storeNotations = []; // stores all notations
const notations = document.querySelector(".notations");
const count = arr => arr.filter(p => p !== "").length;
let w_s_c_right = true;
let w_l_c_right = true;
let b_s_c_right = true;
let b_l_c_right = true;
let storedCaslingRights = [];
storedCaslingRights.push([w_s_c_right, w_l_c_right, b_s_c_right, b_l_c_right]);
let promotedPiece; // stores the piece which was if promoted on the last move, used in notations 
let promoTimer;
let gameOverTimer;
let promotionSquare = -1;
let moveCount = 1; // counts the no. of moves
let whiteTurn = true; // true -> white's turn | false -> black's turn
let pieces = [...startPos]; // stores the current position of the pieces
let lastPosition = [];
let last_move = {}; // piece, color, from, to, capture
let currentMoveNotation;
let attacked_Squares = []; // stores those squares which are currently attacked by current turn's opponent 
render();

function removeClass() {
    document.querySelector(".selected")?.classList.remove("selected");
    document.querySelectorAll(".highlight, .enPassant, .short_castle, .long_castle").forEach(h => {
        h.classList.remove("highlight", "enPassant", "short_castle", "long_castle");
    });
}

function storeMoves(selected, i) {
    last_move.piece = `${selected.querySelector("img").getAttribute("src")}`.split("/")[1].split(".")[0].split("-")[0];
    last_move.color = `${selected.querySelector("img").getAttribute("src")}`.split("/")[1].split(".")[0].split("-")[1];
    last_move.from = square.indexOf(selected);
    last_move.to = i;
    last_move.capture = count(pieces) < count(lastPosition); // true or false
    storedMoves.push([last_move.piece, last_move.color, last_move.from, last_move.to, last_move.capture]);
}

function markCheck() {
    if (isCheck()) {
        let color = whiteTurn ? "white" : "black";
        square[pieces.indexOf(`Pieces/king-${color}.svg`)].classList.add("check");
    }
}

function render() { // places the pieces into the board from 'pieces' array
    storedPositions.push([...pieces]);
    document.querySelector(".check")?.classList.remove("check");
    document.querySelector("#undo").disabled = (storedMoves.length === 0);
    square.forEach((s, i) => {
        s.innerHTML = "";
        if (pieces[i] !== "") {
            let img = document.createElement("img");
            img.src = pieces[i];
            img.classList.add("piece");
            s.appendChild(img);
        }
    });
}

function update() {
    white_castle_update();
    black_castle_update();
    checkPromotion();
    whiteTurn = !whiteTurn;
    if (whiteTurn) moveCount++;
    render();
    attacked_Squares = attackedSquares(pieces, whiteTurn); // it calculates the attacked squares of !whiteTurn
    if (last_move.piece) {
        currentMoveNotation = moveNotation(last_move);
        storeNotations.push(currentMoveNotation);
        document.querySelector(".recent")?.classList.remove("recent");
        if (last_move.color === "white") {
            let num = document.createElement("span");
            num.classList.add("num");
            num.innerText = `${moveCount}.`;
            notations.appendChild(num);
        }
        let span = document.createElement("span");
        span.innerText = currentMoveNotation;
        span.classList.add("recent");
        notations.appendChild(span);
        notations.scrollTop = notations.scrollHeight;
    }
    storedCaslingRights.push([w_s_c_right, w_l_c_right, b_s_c_right, b_l_c_right]);
    markCheck();
    if (last_move.piece === "pawn" && [0, 1, 2, 3, 4, 5, 6, 7, 56, 57, 58, 59, 60, 61, 62, 63].includes(last_move.to)) {
        gameOverTimer = setTimeout(() => {
            checkGameOver();
        }, 5000)
    }
    else {
        checkGameOver();
    }
}

square.forEach((s, i) => {
    s.addEventListener("click", () => {
        lastPosition = [...pieces];
        const selected = document.querySelector(".selected");
        if (selected) {
            if (s === selected) return removeClass();
            if (!s.classList.contains("highlight")) {
                removeClass();
                return s.click();
            }
            const from = square.indexOf(selected);
            const src = selected.querySelector("img").getAttribute("src");
            if (s.classList.contains("enPassant")) pieces[src.includes("white") ? i + 8 : i - 8] = "";
            if (s.classList.contains("short_castle")) { pieces[i - 1] = pieces[i + 1]; pieces[i + 1] = ""; } // move the rook
            if (s.classList.contains("long_castle")) { pieces[i + 1] = pieces[i - 2]; pieces[i - 2] = ""; }   // move the rook
            pieces[from] = "";
            pieces[i] = src;
            storeMoves(selected, i);
            removeClass();
            update();
            return;
        }
        else {
            if (pieces[i] !== "") {
                if (pieces[i].includes(whiteTurn ? "white" : "black")) {
                    s.classList.add("selected");
                }
                let isWhite = pieces[i].includes("white");
                let piece = pieces[i].split("/")[1].split("-")[0];
                let move = piece === "knight" ? knight_move(i).map(m => [m]) : piece === "bishop" ? bishop_move(i) : piece === "rook" ? rook_move(i) : piece === "queen" ? queen_move(i) : piece === "king" ? king_move(i).map(m => [m]) : null;

                if (piece !== "pawn") {
                    if (whiteTurn === isWhite) {
                        for (let j of move) {
                            for (let k of j) {
                                if (pieces[k].includes(whiteTurn ? "white" : "black")) break;
                                if (pieces[k].includes(!whiteTurn ? "white" : "black")) {
                                    square[k].classList.add("highlight");
                                    break;
                                }
                                square[k].classList.add("highlight");
                            }
                        }
                        if (piece === "king") {
                            if (pieces[i + 1] === "" && pieces[i + 2] === "" && (whiteTurn ? w_s_c_right : b_s_c_right) && !isCheck() && !attacked_Squares.includes(i + 1) && !attacked_Squares.includes(i + 2)) {
                                square[i + 2].classList.add("highlight");
                                square[i + 2].classList.add("short_castle");
                            }
                            if (pieces[i - 1] === "" && pieces[i - 2] === "" && pieces[i - 3] === "" && (whiteTurn ? w_l_c_right : b_l_c_right) && !isCheck() && !attacked_Squares.includes(i - 1) && !attacked_Squares.includes(i - 2)) {
                                square[i - 2].classList.add("highlight");
                                square[i - 2].classList.add("long_castle");
                            }
                        }
                    }
                }
                else {
                    if (whiteTurn === isWhite) {
                        let pmove = whiteTurn ? white_pawn_move(i) : black_pawn_move(i);
                        for (let k of pmove[0]) {
                            if (pieces[k] !== "") break;
                            square[k].classList.add("highlight");
                        }
                        for (let k of pmove[1]) {
                            if (pieces[k].includes(whiteTurn ? "black" : "white")) square[k].classList.add("highlight");
                        }
                        if (whiteTurn ? is_white_en_passant(i) : is_black_en_passant(i)) {
                            let enSquare = whiteTurn ? last_move.from + 8 : last_move.from - 8;
                            square[enSquare].classList.add("highlight");
                            square[enSquare].classList.add("enPassant");
                        }
                    }
                }
            }
            removeIllegalHighlights();
        }
    })
});

function removeIllegalHighlights() {
    document.querySelectorAll(".highlight").forEach(h => {
        let tempPos = [...pieces];
        let to = square.indexOf(h);
        let from = square.indexOf(document.querySelector(".selected"));
        tempPos[to] = tempPos[from];
        tempPos[from] = "";
        if (h.classList.contains("enPassant")) tempPos[whiteTurn ? to + 8 : to - 8] = "";
        if (!isLegalPos(tempPos, !whiteTurn)) h.classList.remove("highlight", "enPassant");
    })
}

const KNIGHT_OFFSETS = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
];

const KING_OFFSETS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
];

const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRS = [[-1, 0], [0, -1], [0, 1], [1, 0]];

const onBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function stepMoves(index, offsets) {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const pmove = [];
    for (const [dr, dc] of offsets) {
        const r = row + dr;
        const c = col + dc;
        if (onBoard(r, c)) pmove.push(r * 8 + c);
    }
    return pmove;
}

function slideMoves(index, dirs) {
    const row = Math.floor(index / 8);
    const col = index % 8;
    return dirs.map(([dr, dc]) => {
        const line = [];
        let r = row + dr;
        let c = col + dc;
        while (onBoard(r, c)) {
            line.push(r * 8 + c);
            r += dr;
            c += dc;
        }
        return line;
    });
}

const knight_move = (index) => stepMoves(index, KNIGHT_OFFSETS);
const king_move = (index) => stepMoves(index, KING_OFFSETS);
const bishop_move = (index) => slideMoves(index, BISHOP_DIRS);
const rook_move = (index) => slideMoves(index, ROOK_DIRS);
const queen_move = (index) => [...bishop_move(index), ...rook_move(index)];

function white_pawn_move(index) {
    let col = (index % 8) + 1;
    let pindex = [[], []];
    const w_start_index = [48, 49, 50, 51, 52, 53, 54, 55];
    if (w_start_index.includes(index)) {
        pindex[0].push(index - 8, index - 16);
    } else {
        pindex[0].push(index - 8);
    }
    if (col == 1) {
        pindex[1].push(index - 7);
    } else if (col == 8) {
        pindex[1].push(index - 9)
    } else {
        pindex[1].push(index - 9, index - 7);
    }
    return pindex;
}

function black_pawn_move(index) {
    let col = (index % 8) + 1;
    let pindex = [[], []];
    const b_start_index = [8, 9, 10, 11, 12, 13, 14, 15];
    if (b_start_index.includes(index)) {
        pindex[0].push(index + 8, index + 16);
    } else {
        pindex[0].push(index + 8);
    }
    if (col == 1) {
        pindex[1].push(index + 9);
    } else if (col == 8) {
        pindex[1].push(index + 7)
    } else {
        pindex[1].push(index + 7, index + 9);
    }
    return pindex;
}

function checkPromotion() {
    const i = pieces.findIndex((p, i) => p.includes("pawn") && (i < 8 || i > 55));
    if (i === -1) return;                      // no pawn on the last row, so do nothing
    const color = pieces[i].includes("white") ? "white" : "black";
    // 1. turn the pawn into a queen right now, so the game can carry on normally
    pieces[i] = `Pieces/queen-${color}.svg`;
    promotedPiece = "Q";
    promotionSquare = i;
    // 2. show the popup, with images in the pawn's color
    document.querySelectorAll(".promotion img").forEach(img => {
        img.src = `Pieces/${img.parentElement.id}-${color}.svg`;
    });
    container.classList.remove("hidden");
    // 3. if nobody clicks within 5 seconds, close the popup (the queen stays)
    clearTimeout(promoTimer);
    promoTimer = setTimeout(() => {
        container.classList.add("hidden");
    }, 5000);
}

document.querySelectorAll(".promotion").forEach(btn => {
    btn.addEventListener("click", (e) => {
        clearTimeout(promoTimer);
        clearTimeout(gameOverTimer);                              // stop the 5-second timer
        const id = e.currentTarget.id;                         // queen, rook, bishop or knight
        const letter = id === "knight" ? "N" : id[0].toUpperCase();
        const color = pieces[promotionSquare].includes("white") ? "white" : "black";
        pieces[promotionSquare] = `Pieces/${id}-${color}.svg`; // replace the temporary queen
        storedPositions.pop();
        render();
        attacked_Squares = attackedSquares(pieces, whiteTurn);
        if (isCheck()) {
            const k = whiteTurn ? "white" : "black";
            square[pieces.indexOf(`Pieces/king-${k}.svg`)].classList.add("check");
        }
        // fix the last move in the notation list
        const recent = document.querySelector(".recent");
        let text = recent.innerText.replace(/[+#]$/, "").replace(/=.$/, `=${letter}`);
        if (isCheck()) text += hasMoves(whiteTurn) ? "+" : "#";
        recent.innerText = text;
        storeNotations[storeNotations.length - 1] = text;
        container.classList.add("hidden");
        checkGameOver();
    });
});

function is_white_en_passant(index) {
    if ([24, 25, 26, 27, 28, 29, 30, 31].includes(index) && last_move.piece == "pawn" && last_move.color == "black" && [8, 9, 10, 11, 12, 13, 14, 15].includes(last_move.from) && [24, 25, 26, 27, 28, 29, 30, 31].includes(last_move.to)) {
        let col = (index % 8) + 1;
        if ((col == 1 && last_move.from == 9) || (col == 8 && last_move.from == 14) || (col < 8 && col > 1 && [index - 17, index - 15].includes(last_move.from))) {
            return true;
        } else {
            return false;
        }
    }
}

function is_black_en_passant(index) {
    if ([32, 33, 34, 35, 36, 37, 38, 39].includes(index) && last_move.piece == "pawn" && last_move.color == "white" && [48, 49, 50, 51, 52, 53, 54, 55].includes(last_move.from) && [32, 33, 34, 35, 36, 37, 38, 39].includes(last_move.to)) {
        let col = (index % 8) + 1;
        if ((col == 1 && last_move.from == 49) || (col == 8 && last_move.from == 54) || (col < 8 && col > 1 && [index + 17, index + 15].includes(last_move.from))) {
            return true;
        } else {
            return false;
        }
    }
}

function white_castle_update() {
    if (pieces[63] !== "Pieces/rook-white.svg") {
        w_s_c_right = false;
    }
    if (pieces[56] !== "Pieces/rook-white.svg") {
        w_l_c_right = false;
    }
    if (pieces[60] !== "Pieces/king-white.svg") {
        w_s_c_right = false;
        w_l_c_right = false;
    }
}

function black_castle_update() {
    if (pieces[7] !== "Pieces/rook-black.svg") {
        b_s_c_right = false;
    }
    if (pieces[0] !== "Pieces/rook-black.svg") {
        b_l_c_right = false;
    }
    if (pieces[4] !== "Pieces/king-black.svg") {
        b_s_c_right = false;
        b_l_c_right = false;
    }
}

function attackedSquares(pieces, whiteTurn) {
    const opponent = whiteTurn ? "black" : "white"
    let attacked_squares = [];
    let pos = [[], [], [], [], [], []]; // pawn, knight, bishop, rook, queen, king
    pieces.forEach((p, i) => {
        if (p == `Pieces/pawn-${opponent}.svg`) pos[0].push(i);
        else if (p == `Pieces/knight-${opponent}.svg`) pos[1].push(i);
        else if (p == `Pieces/bishop-${opponent}.svg`) pos[2].push(i);
        else if (p == `Pieces/rook-${opponent}.svg`) pos[3].push(i);
        else if (p == `Pieces/queen-${opponent}.svg`) pos[4].push(i);
        else if (p == `Pieces/king-${opponent}.svg`) pos[5].push(i);
    })
    for (let j = 0; j < 6; j++) {
        for (let k = 0; k < pos[j].length; k++) {
            let move = j === 1 ? knight_move(pos[j][k]).map(m => [m]) : j === 2 ? bishop_move(pos[j][k]) : j === 3 ? rook_move(pos[j][k]) : j === 4 ? queen_move(pos[j][k]) : j === 5 ? king_move(pos[j][k]).map(m => [m]) : null;
            if (j === 0) {
                let pmove = whiteTurn ? black_pawn_move(pos[j][k]) : white_pawn_move(pos[j][k]);
                for (let m = 0; m < pmove[1].length; m++) {
                    attacked_squares.push(pmove[1][m]);
                }
            }
            else {
                for (let m = 0; m < move.length; m++) {
                    for (let n = 0; n < move[m].length; n++) {
                        if (pieces[move[m][n]] == "") {
                            attacked_squares.push(move[m][n]);
                        } else {
                            attacked_squares.push(move[m][n]);
                            break;
                        }
                    }
                }
            }
        }
    }
    attacked_squares = [...new Set(attacked_squares)];
    return attacked_squares;
}

function isCheck() {
    return attacked_Squares.includes(pieces.indexOf(`Pieces/king-${whiteTurn ? "white" : "black"}.svg`));
}

function isLegalPos(pieces, whiteTurn) {
    return !attackedSquares(pieces, !whiteTurn).includes(pieces.indexOf(`Pieces/king-${whiteTurn ? "black" : "white"}.svg`));
}

function hasMoves(whiteTurn) {
    let color = whiteTurn ? "white" : "black";
    for (let i = 0; i < 64; i++) {
        if (!pieces[i].includes(color)) continue;
        let s = square[i];
        removeClass();
        s.click();
        if (document.querySelector(".highlight")) {
            removeClass();
            return true;
        }
    }
    removeClass();
    return false;
}

function checkGameOver() {
    if (hasMoves(whiteTurn)) {
        if (isThreeFold()) {
            showWinnerPopup();
            who.innerText = "Draw!";
            how.innerText = "by 3 FOLD REPETITION";
            no_of_moves.innerText = Math.ceil(storedMoves.length / 2);
        }
        if (isFiftyMoveRule()) {
            showWinnerPopup();
            who.innerText = "Draw!";
            how.innerText = "by 50 MOVE RULE";
            no_of_moves.innerText = Math.ceil(storedMoves.length / 2);
        }
        if (isInsufficientMaterial()) {
            showWinnerPopup();
            who.innerText = "Draw!";
            how.innerText = "by INSUFFICIENT MATERIAL";
            no_of_moves.innerText = Math.ceil(storedMoves.length / 2);
        }
    }
    else {
        let check = isCheck();
        showWinnerPopup();
        who.innerText = check ? (whiteTurn ? "BLACK won!" : "WHITE won!") : "Draw!";
        how.innerText = check ? "by CHECKMATE" : "By STALEMATE";
        no_of_moves.innerText = Math.ceil(storedMoves.length / 2);
    }
}

function showWinnerPopup() {
    winOverlay.classList.add('active');
}

function hideWinnerPopup() {
    pieces = [...startPos]
    winOverlay.classList.remove('active');
    removeClass();
    storedPositions.length = 0;
    container.classList.add("hidden");
    clearTimeout(promoTimer);
    clearTimeout(gameOverTimer);
    storedMoves.length = 0;
    render();
    lastPosition.length = 0;
    whiteTurn = true;
    w_s_c_right = w_l_c_right = b_s_c_right = b_l_c_right = true;
    storedCaslingRights.length = 0;
    storedCaslingRights.push([w_s_c_right, w_l_c_right, b_s_c_right, b_l_c_right]);
    attacked_Squares = attackedSquares(pieces, whiteTurn);
    last_move = {};
    storeNotations.length = 0;
    currentMoveNotation = "";
    document.querySelector(".notations").innerHTML = "";
    moveCount = 1;
}

closeBtn.addEventListener("click", hideWinnerPopup);

function resign() {
    showWinnerPopup();
    who.innerText = `${whiteTurn ? "BLACK" : "WHITE"} won`;
    how.innerText = "By RESIGNATION";
    no_of_moves.innerText = Math.ceil(storedMoves.length / 2);
}

function moveNotation(last_move) {
    let piece = last_move.piece;
    let from = last_move.from;
    let to = last_move.to;
    let moveNot = "";
    const file = { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e", 6: "f", 7: "g", 8: "h" };
    let move = piece === "knight" ? knight_move(to).map(m => [m]) : piece === "bishop" ? bishop_move(to) : piece === "rook" ? rook_move(to) : piece === "queen" ? queen_move(to) : null;
    if (piece === "pawn") {
        if ((Math.max(from, to) - Math.min(from, to)) % 8 == 0) {
            moveNot += `${square[to].id}`;
        } else {
            let f = square[from].id.slice(0, 1);
            let l = square[to].id;
            moveNot += `${f}x${l}`;
        }
        if (last_move.piece == "pawn" && ([0, 1, 2, 3, 4, 5, 6, 7].includes(last_move.to) || [56, 57, 58, 59, 60, 61, 62, 63].includes(last_move.to))) {
            moveNot += `=${promotedPiece}`;
        }
    }
    else if (piece === "king") {
        if (from + 2 == to) {
            moveNot = "O-O";
        } else if (from - 2 == to) {
            moveNot = "O-O-O";
        } else {
            moveNot += "K";
            if (last_move.capture) {
                moveNot += "x";
            }
            moveNot += `${square[to].id}`;
        }
    }
    else {
        moveNot += piece === "knight" ? "N" : piece[0].toUpperCase();
        let dupPieces = [];
        let oppColor = !whiteTurn ? "black" : "white";
        for (let i = 0; i < move.length; i++) {
            for (let j = 0; j < move[i].length; j++) {
                if (move[i][j] === from) break;
                if (pieces[move[i][j]] == "") continue;
                else {
                    if (pieces[move[i][j]].includes(`${oppColor}`)) break;
                    else {
                        if (!pieces[move[i][j]].includes(piece)) break;
                        else {
                            dupPieces.push(move[i][j]);
                            break;
                        }
                    }
                }
            }
        }
        let fromRow = Math.floor(from / 8) + 1;
        let fromCol = (from % 8) + 1;
        if (dupPieces.length !== 0) {
            let rows = [];
            let cols = [];
            for (let i = 0; i < dupPieces.length; i++) {
                let row = Math.floor(dupPieces[i] / 8) + 1;
                let col = (dupPieces[i] % 8) + 1;
                rows.push(row);
                cols.push(col);
            }
            if (!cols.includes(fromCol)) {
                moveNot += `${file[fromCol]}`;
            } else if (!rows.includes(fromRow)) {
                moveNot += `${9 - fromRow}`;
            } else {
                moveNot += `${square[from].id}`;
            }
        }
        if (last_move.capture) {
            moveNot += "x";
        }
        moveNot += `${square[to].id}`;
    }
    if (isCheck()) {
        if (hasMoves(whiteTurn)) {
            moveNot += "+";
        } else {
            moveNot += "#";
        }
    }
    return moveNot;
}

function flip() {
    let board = document.querySelector(".board");
    board.classList.toggle("flip");
}

function mostRepeated(arr) {
    let max = 0;
    for (let i = 0; i < arr.length; i++) {
        let count = 0;
        for (let j = 0; j < arr.length; j++) {
            if (arr[j] === arr[i]) count++;
        }
        if (count > max) {
            max = count;
        }
    }
    return max;
}

function isThreeFold() {
    const times = mostRepeated(storedPositions.map(p => p.join(",")));
    return times >= 3;
}

function isFiftyMoveRule() {
    if (storedMoves.length < 100) return false;
    for (let i=1; i<=100; i++) {
        if (storedMoves[storedMoves.length-i][0] === "pawn" || storedMoves[storedMoves.length-i][4]) return false;
    }
    return true;
}

function undo() {
    if (storedMoves.length === 0) return;
    pieces = [...storedPositions[storedPositions.length - 2]];
    whiteTurn = !whiteTurn;
    storedPositions.pop();
    storedPositions.pop();
    storedMoves.pop();
    render();
    attacked_Squares = attackedSquares(pieces, whiteTurn)
    markCheck();
    lastPosition = storedPositions[storedPositions.length - 1];
    if (storedMoves.length !== 0) {
        last_move = {
            piece: storedMoves[storedMoves.length - 1][0],
            color: storedMoves[storedMoves.length - 1][1],
            from: storedMoves[storedMoves.length - 1][2],
            to: storedMoves[storedMoves.length - 1][3],
            capture: storedMoves[storedMoves.length - 1][4]
        }
    }
    else last_move = {};
    notations.lastChild.remove();
    if (whiteTurn) {
        notations.lastChild.remove();
    }
    else moveCount--;
    notations.lastChild?.classList.add("recent");
    storeNotations.pop()
    storedCaslingRights.pop();
    w_s_c_right = storedCaslingRights[storedCaslingRights.length - 1][0];
    w_l_c_right = storedCaslingRights[storedCaslingRights.length - 1][1];
    b_s_c_right = storedCaslingRights[storedCaslingRights.length - 1][2];
    b_l_c_right = storedCaslingRights[storedCaslingRights.length - 1][3];
    removeClass();
    clearTimeout(promoTimer);
    clearTimeout(gameOverTimer);
}

function isInsufficientMaterial() {
    const pieceCount = count(pieces);
    if (pieceCount === 2) return true;
    else if (pieceCount === 3) {
        const minorPieces = pieces.filter(p => p.includes("knight") || p.includes("bishop"));
        if (minorPieces.length === 1) return true;
    }
    else if (pieceCount === 4) {
        const minorPieces = pieces.filter(p=>p.includes("knight"));
        if (minorPieces.length === 2) return true;
    }
    return false;
}