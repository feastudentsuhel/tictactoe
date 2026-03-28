  const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  let board = Array(9).fill(null);
  let current = 'O'; // O = Player 1 (red), X = Player 2 (blue)
  let gameOver = false;
  let scores = { O: 0, X: 0, D: 0 };
  let history = []; // for undo

  const boardEl    = document.getElementById('board');
  const playerBar  = document.getElementById('player-bar');
  const statusEl   = document.getElementById('status');
  const scO        = document.getElementById('sc-o');
  const scX        = document.getElementById('sc-x');
  const scD        = document.getElementById('sc-d');
  const dot1       = document.getElementById('dot1');
  const dot2       = document.getElementById('dot2');
  const dot3       = document.getElementById('dot3');
  const dots       = [dot1, dot2, dot3];

  function makeSVG(sym) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    if (sym === 'X') {
      const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l1.setAttribute('x1','18'); l1.setAttribute('y1','18');
      l1.setAttribute('x2','82'); l1.setAttribute('y2','82');
      l1.setAttribute('class', 'x-line');
      const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l2.setAttribute('x1','82'); l2.setAttribute('y1','18');
      l2.setAttribute('x2','18'); l2.setAttribute('y2','82');
      l2.setAttribute('class', 'x-line');
      svg.append(l1, l2);
    } else {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx','50'); c.setAttribute('cy','50'); c.setAttribute('r','34');
      c.setAttribute('class', 'o-circle');
      svg.append(c);
    }
    return svg;
  }

  // Build cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;

    // Pre-build both SVGs, hide them
    const svgX = makeSVG('X'); svgX.dataset.sym = 'X'; svgX.style.display = 'none';
    const svgO = makeSVG('O'); svgO.dataset.sym = 'O'; svgO.style.display = 'none';
    cell.append(svgO, svgX);

    cell.addEventListener('click', () => handleClick(i));
    boardEl.append(cell);
  }

  const strikeSvg = document.getElementById('strike-svg');

  // Maps each winning combo to start/end points in the 0-100 viewBox
  // Each cell center: col*33.33+16.67, row*33.33+16.67
  const STRIKE_COORDS = {
    '0,1,2': [16.67, 16.67, 83.33, 16.67],   // top row
    '3,4,5': [16.67, 50,    83.33, 50   ],    // mid row
    '6,7,8': [16.67, 83.33, 83.33, 83.33],   // bot row
    '0,3,6': [16.67, 16.67, 16.67, 83.33],   // left col
    '1,4,7': [50,    16.67, 50,    83.33],    // mid col
    '2,5,8': [83.33, 16.67, 83.33, 83.33],   // right col
    '0,4,8': [16.67, 16.67, 83.33, 83.33],   // diag \
    '2,4,6': [83.33, 16.67, 16.67, 83.33],   // diag /
  };

  function drawStrike(combo) {
    const key = combo.join(',');
    const coords = STRIKE_COORDS[key];
    if (!coords) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', coords[0]);
    line.setAttribute('y1', coords[1]);
    line.setAttribute('x2', coords[2]);
    line.setAttribute('y2', coords[3]);
    line.setAttribute('class', 'strike-line');
    strikeSvg.innerHTML = '';
    strikeSvg.appendChild(line);
  }

  function clearStrike() { strikeSvg.innerHTML = ''; }



  function updateDots() {
    const moves = board.filter(Boolean).length;
    const remaining = Math.max(0, 3 - moves);
    dots.forEach((d, i) => d.classList.toggle('filled', i < remaining));
  }

  function setStatus(txt, cls = '') {
    statusEl.textContent = txt;
    statusEl.className = 'status ' + cls;
  }

  function handleClick(idx) {
    if (gameOver || board[idx]) return;
    history.push({ board: [...board], current });
    board[idx] = current;

    const cell = boardEl.children[idx];
    const svg = cell.querySelector(`[data-sym="${current}"]`);
    svg.style.display = '';
    requestAnimationFrame(() => {
      cell.classList.add('filled', 'taken');
    });

    updateDots();
    const result = checkWinner();
    if (result) {
      gameOver = true;
      playerBar.classList.remove('turn-x','turn-o');
      if (result.winner) {
        result.combo.forEach(i => boardEl.children[i].classList.add(`winner-${result.winner.toLowerCase()}`));
        drawStrike(result.combo);
        scores[result.winner]++;
        scO.textContent = scores.O;
        scX.textContent = scores.X;
        const p = result.winner === 'O' ? 'Player 1' : 'Player 2';
        setStatus(`${p} Wins! 🎉`, result.winner === 'O' ? 'win-o' : 'win-x');
      } else {
        scores.D++;
        scD.textContent = scores.D;
        setStatus('Draw!', 'draw');
      }
      return;
    }

    current = current === 'O' ? 'X' : 'O';
    playerBar.classList.toggle('turn-x', current === 'X');
    playerBar.classList.toggle('turn-o', current === 'O');
    const p = current === 'O' ? 'Player 1' : 'Player 2';
    setStatus(`${p}'s Turn`);
  }

  function checkWinner() {
    for (const [a,b,c] of WINS) {
      if (board[a] && board[a] === board[b] && board[b] === board[c])
        return { winner: board[a], combo: [a,b,c] };
    }
    if (board.every(Boolean)) return { winner: null, draw: true };
    return null;
  }

  function resetGame() {
    board.fill(null);
    gameOver = false;
    current = 'O';
    history = [];
    boardEl.querySelectorAll('.cell').forEach(c => {
      c.className = 'cell';
      c.querySelectorAll('svg').forEach(s => s.style.display = 'none');
    });
    playerBar.classList.remove('turn-x','turn-o');
    playerBar.classList.add('turn-o');
    clearStrike();
    setStatus("Player 1's Turn", '');
    updateDots();
  }

  function undoMove() {
    if (!history.length || gameOver) return;
    const prev = history.pop();
    board = prev.board;
    current = prev.current;
    gameOver = false;

    boardEl.querySelectorAll('.cell').forEach((c, i) => {
      c.className = 'cell';
      c.querySelectorAll('svg').forEach(s => s.style.display = 'none');
      if (board[i]) {
        const svg = c.querySelector(`[data-sym="${board[i]}"]`);
        svg.style.display = '';
        c.classList.add('filled','taken');
      }
    });

    playerBar.className = 'player-bar ' + (current === 'X' ? 'turn-o' : 'turn-x');
    const p = current === 'O' ? 'Player 1' : 'Player 2';
    clearStrike();
    setStatus(`${p}'s Turn`, '');
    updateDots();
  }

  document.getElementById('btn-reset').addEventListener('click', resetGame);
  document.getElementById('btn-undo').addEventListener('click', undoMove);

  // Init
  playerBar.classList.add('turn-o');
  updateDots();
