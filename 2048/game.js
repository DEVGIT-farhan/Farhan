class Game2048 {
    constructor() {
        this.size = 4;
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.bestElement = document.getElementById('best');
        this.score = 0;
        this.best = parseInt(localStorage.getItem('farhan-2048-test-best')) || 0;
        this.grid = [];
        
        // Initialize CSS variables
        this.init();
        this.setupEventListeners();
        
        // Update cell size on resize
        this.updateCellSize();
        window.addEventListener('resize', () => {
            this.updateCellSize();
            this.updateDisplay();
        });
    }

    updateCellSize() {
        const cell = document.querySelector('.cell');
        if (cell) {
            const cellSize = cell.offsetWidth;
            document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
            const boardPadding = parseInt(window.getComputedStyle(this.gameBoard).padding);
            document.documentElement.style.setProperty('--board-padding', `${boardPadding}px`);
        }
    }

    init() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.gameBoard.innerHTML = '';
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', 'Empty cell');
            this.gameBoard.appendChild(cell);
        }
        this.addNewTile();
        this.addNewTile();
        this.updateDisplay();
        this.bestElement.textContent = this.best;
        this.updateCellSize();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
                e.preventDefault();
                let direction = e.key;
                if (e.key === 'w') direction = 'ArrowUp';
                if (e.key === 's') direction = 'ArrowDown';
                if (e.key === 'a') direction = 'ArrowLeft';
                if (e.key === 'd') direction = 'ArrowRight';
                
                const moved = this.move(direction);
                if (moved) {
                    this.afterMove();
                }
            }
        });

        let touchStartX, touchStartY;
        const minSwipeDistance = 50;

        this.gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.gameBoard.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.gameBoard.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    const direction = deltaX > 0 ? 'ArrowRight' : 'ArrowLeft';
                    const moved = this.move(direction);
                    if (moved) this.afterMove();
                } else {
                    const direction = deltaY > 0 ? 'ArrowDown' : 'ArrowUp';
                    const moved = this.move(direction);
                    if (moved) this.afterMove();
                }
            }
        }, { passive: true });

        document.getElementById('new-game').addEventListener('click', () => {
            this.score = 0;
            this.scoreElement.textContent = '0';
            this.init();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGameState();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });
    }

    saveGameState() {
        localStorage.setItem('farhan-2048-test-best', this.best.toString());
    }

    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }
        if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[x][y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    updateDisplay() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());

        const cell = document.querySelector('.cell');
        const cellSize = cell.offsetWidth;
        const gap = parseInt(window.getComputedStyle(this.gameBoard).gridGap);
        const boardPadding = parseInt(window.getComputedStyle(this.gameBoard).padding);

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.dataset.value = this.grid[i][j];
                    tile.textContent = this.grid[i][j];
                    
                    const x = boardPadding + j * (cellSize + gap);
                    const y = boardPadding + i * (cellSize + gap);
                    tile.style.transform = `translate(${x}px, ${y}px)`;
                    
                    this.gameBoard.appendChild(tile);
                }
            }
        }
    }

    move(direction) {
        let moved = false;
        const originalGrid = JSON.stringify(this.grid);

        switch (direction) {
            case 'ArrowUp': moved = this.moveUp(); break;
            case 'ArrowDown': moved = this.moveDown(); break;
            case 'ArrowLeft': moved = this.moveLeft(); break;
            case 'ArrowRight': moved = this.moveRight(); break;
        }

        return moved && originalGrid !== JSON.stringify(this.grid);
    }

    moveLeft() {
        return this.processTiles((row) => {
            const newRow = row.filter(cell => cell !== 0);
            for (let i = 0; i < newRow.length - 1; i++) {
                if (newRow[i] === newRow[i + 1]) {
                    newRow[i] *= 2;
                    this.score += newRow[i];
                    this.scoreElement.textContent = this.score;
                    newRow.splice(i + 1, 1);
                }
            }
            while (newRow.length < this.size) newRow.push(0);
            return newRow;
        });
    }

    moveRight() {
        return this.processTiles((row) => {
            const newRow = row.filter(cell => cell !== 0);
            for (let i = newRow.length - 1; i > 0; i--) {
                if (newRow[i] === newRow[i - 1]) {
                    newRow[i] *= 2;
                    this.score += newRow[i];
                    this.scoreElement.textContent = this.score;
                    newRow.splice(i - 1, 1);
                    i--;
                }
            }
            while (newRow.length < this.size) newRow.unshift(0);
            return newRow;
        });
    }

    moveUp() {
        return this.processTiles((col) => {
            const newCol = col.filter(cell => cell !== 0);
            for (let i = 0; i < newCol.length - 1; i++) {
                if (newCol[i] === newCol[i + 1]) {
                    newCol[i] *= 2;
                    this.score += newCol[i];
                    this.scoreElement.textContent = this.score;
                    newCol.splice(i + 1, 1);
                }
            }
            while (newCol.length < this.size) newCol.push(0);
            return newCol;
        }, true);
    }

    moveDown() {
        return this.processTiles((col) => {
            const newCol = col.filter(cell => cell !== 0);
            for (let i = newCol.length - 1; i > 0; i--) {
                if (newCol[i] === newCol[i - 1]) {
                    newCol[i] *= 2;
                    this.score += newCol[i];
                    this.scoreElement.textContent = this.score;
                    newCol.splice(i - 1, 1);
                    i--;
                }
            }
            while (newCol.length < this.size) newCol.unshift(0);
            return newCol;
        }, true);
    }

    processTiles(processor, isVertical = false) {
        let moved = false;
        const gridCopy = JSON.parse(JSON.stringify(this.grid));

        for (let i = 0; i < this.size; i++) {
            const line = isVertical
                ? this.grid.map(row => row[i])
                : this.grid[i];
            
            const processedLine = processor(line.slice());
            
            for (let j = 0; j < this.size; j++) {
                if (isVertical) {
                    if (this.grid[j][i] !== processedLine[j]) {
                        moved = true;
                        this.grid[j][i] = processedLine[j];
                    }
                } else {
                    if (this.grid[i][j] !== processedLine[j]) {
                        moved = true;
                        this.grid[i][j] = processedLine[j];
                    }
                }
            }
        }

        return moved;
    }

    afterMove() {
        this.addNewTile();
        this.updateDisplay();
        if (this.score > this.best) {
            this.best = this.score;
            this.bestElement.textContent = this.best;
            this.saveGameState();
        }
        if (this.isGameOver()) {
            setTimeout(() => {
                alert('Game Over! Your score: ' + this.score);
            }, 300);
        }
    }

    isGameOver() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) return false;
                if (j < this.size - 1 && this.grid[i][j] === this.grid[i][j + 1]) return false;
                if (i < this.size - 1 && this.grid[i][j] === this.grid[i + 1][j]) return false;
            }
        }
        return true;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Game2048());
} else {
    new Game2048();
}