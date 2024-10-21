const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = 460;
const canvasHeight = 520;
const rows = 3;
const cols = 3;
const gapSize = 2;

let pieces = [];
let images = [new Image(), new Image(), new Image()];
let currentImageIndex = 0;
let selectedPiece = null;
let offsetX, offsetY;

const colors = {
    background: '#0a192f',
    pieceStroke: '#4A90E2',
    correctPiece: '#4A90E2',
    highlightPiece: '#FFC300'
};

images[0].src = 'imagen1.jpg';
images[1].src = 'imagen2.jpg';
images[2].src = 'imagen3.jpg';

images.forEach((img, index) => {
    img.onload = () => {
        if (index === 0) {
            createPuzzle();
            drawPuzzle();
        }
    };
    img.onerror = () => {
        console.error(`No se pudo cargar la imagen ${index + 1}. Revisa la ruta.`);
    };
});

function createPuzzle() {
    const pieceWidth = (canvasWidth - (cols + 1) * gapSize) / cols;
    const pieceHeight = (canvasHeight - (rows + 1) * gapSize) / rows;

    pieces = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            pieces.push({
                row: row,
                col: col,
                x: col * (pieceWidth + gapSize) + gapSize,
                y: row * (pieceHeight + gapSize) + gapSize,
                correctRow: row,
                correctCol: col,
                width: pieceWidth,
                height: pieceHeight,
                isCorrect: false,
                rotation: 0,
                scale: 1
            });
        }
    }
    shufflePuzzle();
}

function shufflePuzzle() {
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i].x, pieces[j].x] = [pieces[j].x, pieces[i].x];
        [pieces[i].y, pieces[j].y] = [pieces[j].y, pieces[i].y];
        pieces[i].isCorrect = false;
        pieces[j].isCorrect = false;
        pieces[i].rotation = Math.random() * 0.2 - 0.1;
    }
    drawPuzzle();
}

function drawPuzzle() {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const piece of pieces) {
        ctx.save();
        ctx.translate(piece.x + piece.width / 2, piece.y + piece.height / 2);
        ctx.rotate(piece.rotation);
        ctx.scale(piece.scale, piece.scale);

        ctx.beginPath();
        drawPieceShape(ctx, -piece.width / 2, -piece.height / 2, piece.width, piece.height);
        ctx.clip();

        ctx.drawImage(
            images[currentImageIndex],
            piece.correctCol * (images[currentImageIndex].width / cols),
            piece.correctRow * (images[currentImageIndex].height / rows),
            images[currentImageIndex].width / cols,
            images[currentImageIndex].height / rows,
            -piece.width / 2,
            -piece.height / 2,
            piece.width,
            piece.height
        );

        ctx.restore();

        ctx.save();
        ctx.translate(piece.x + piece.width / 2, piece.y + piece.height / 2);
        ctx.rotate(piece.rotation);
        ctx.beginPath();
        drawPieceShape(ctx, -piece.width / 2, -piece.height / 2, piece.width, piece.height);
        ctx.strokeStyle = piece.isCorrect ? colors.correctPiece : colors.pieceStroke;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
}

function drawPieceShape(ctx, x, y, width, height) {
    const radius = 20;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

canvas.addEventListener('mousedown', (event) => {
    const mousePos = getMousePos(canvas, event);
    selectedPiece = getMovablePieceAt(mousePos.x, mousePos.y);
    if (selectedPiece) {
        offsetX = mousePos.x - selectedPiece.x;
        offsetY = mousePos.y - selectedPiece.y;
        selectedPiece.scale = 1.1;
        pieces = pieces.filter(p => p !== selectedPiece).concat(selectedPiece);
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (selectedPiece) {
        const mousePos = getMousePos(canvas, event);
        selectedPiece.x = mousePos.x - offsetX;
        selectedPiece.y = mousePos.y - offsetY;
        drawPuzzle();
    }
});

canvas.addEventListener('mouseup', () => {
    if (selectedPiece) {
        snapToGrid(selectedPiece);
        selectedPiece.scale = 1;
        selectedPiece.rotation = 0;
        selectedPiece = null;
        drawPuzzle();
        checkPuzzleCompletion();
    }
});

function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function getMovablePieceAt(x, y) {
    for (let i = pieces.length - 1; i >= 0; i--) {
        const piece = pieces[i];
        if (x >= piece.x && x <= piece.x + piece.width &&
            y >= piece.y && y <= piece.y + piece.height &&
            !piece.isCorrect) {
            return piece;
        }
    }
    return null;
}

function snapToGrid(piece) {
    const pieceWidth = (canvasWidth - (cols + 1) * gapSize) / cols;
    const pieceHeight = (canvasHeight - (rows + 1) * gapSize) / rows;
    
    let col = Math.round((piece.x - gapSize) / (pieceWidth + gapSize));
    let row = Math.round((piece.y - gapSize) / (pieceHeight + gapSize));
    
    col = Math.max(0, Math.min(col, cols - 1));
    row = Math.max(0, Math.min(row, rows - 1));
    
    const occupiedPiece = pieces.find(p => p !== piece && p.col === col && p.row === row && p.isCorrect);
    if (!occupiedPiece) {
        piece.x = col * (pieceWidth + gapSize) + gapSize;
        piece.y = row * (pieceHeight + gapSize) + gapSize;
        piece.col = col;
        piece.row = row;
        
        if (piece.col === piece.correctCol && piece.row === piece.correctRow) {
            piece.isCorrect = true;
            animateCorrectPlacement(piece);
        }
    }
}

function animateCorrectPlacement(piece) {
    let scale = 1;
    let growing = true;
    const animate = () => {
        if (growing) {
            scale += 0.01;
            if (scale >= 1.1) growing = false;
        } else {
            scale -= 0.01;
            if (scale <= 1) {
                piece.scale = 1;
                drawPuzzle();
                return;
            }
        }
        piece.scale = scale;
        drawPuzzle();
        requestAnimationFrame(animate);
    };
    animate();
}

function checkPuzzleCompletion() {
    const isComplete = pieces.every(piece => piece.isCorrect);
    if (isComplete) {
        setTimeout(() => {
            alert("¡Felicidades! Has completado el rompecabezas.");
        }, 500);
    }
}

function changeImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    createPuzzle();
    drawPuzzle();
}

document.getElementById("shuffleButton").addEventListener("click", shufflePuzzle);
document.getElementById("changeImageButton").addEventListener("click", changeImage);

