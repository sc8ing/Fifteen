// pass an element from the dom for where to place the game
let fifteen = function(gameElement, rows, cols) {
	// options
	let boardSize = arguments.length >= 3 ? { rows: rows, cols: cols } : { rows: 4, cols: 4 };
	let boxBorder = 4; // px
	let fontSize = 40; // px
	let font = "Arial";
	let speed = 700; // slide speed, px/s
	//////////

	// destroy everything else
	gameElement.innerHTML = "";

	// create the canvas
	let can = document.createElement("canvas");
	// set the "instrinsic" width by not using css
	can.width = gameElement.clientWidth;
	can.height = gameElement.clientHeight;
	can.addEventListener("click", function(e) {
		let box = boxClicked(relCoords(e, gameElement));
		move(box);
	});
	gameElement.appendChild(can);

	// initialize the model
	let state = {
		board: []
	};
	for (let i=0; i<boardSize.rows; i++) {
		state.board[i] = [];
		for (let j=0; j<boardSize.cols; j++) {
			state.board[i][j] = new Block(boardSize.cols*i + j + 1);
		}
	}

	// scramble the board
	scramble();

	// display & wait for clicks
	render();

// ------------
	// check if the board's in order
	function checkForWin() {
		let b = state.board;
		let prev = 0;
		for (let i=0; i<b.length; i++) {
			for (let j=0; j<b[i].length; j++) {
				if (b[i][j].num != ++prev) return;
			}
		}
		alert("congratulations!");
	}
	// figure out the box clicked based on coordinates
	function boxClicked(coords) {
		let c = coords;
		let w = gameElement.clientWidth;
		let h = gameElement.clientHeight;
		let rowH = h / boardSize.rows;
		let colW = w / boardSize.cols;
		let rowClicked = 0;
		let colClicked = 0;
		
		for (let i=0;
		     i < boardSize.rows
		     && !(c.y > i*rowH
		          && c.y < (i+1)*rowH);
		     i++) {
			rowClicked = i+1;
		}
		for (let i=0;
		     i < boardSize.cols
		     && !(c.x > i*colW
		     	  && c.x < (i+1)*colW);
		     i++) {
			colClicked = i+1;
		}
		return { row: rowClicked, col: colClicked };
	}
	// determine the box to move & slide() it
	function move(box) {
		let b = state.board;
		// the blank space number
		let m = boardSize.rows * boardSize.cols;

		// empty square next to this one?
		if (box.row > 0
		    && b[box.row-1][box.col].num == m) { // above
			slide(-1, 0, box);
		} else if (box.row < boardSize.rows - 1
			   && b[box.row+1][box.col].num == m) { // below
			slide(1, 0, box);
		} else if (box.col > 0
			   && b[box.row][box.col-1].num == m) { // left
			slide(0, -1, box);
		} else if (box.col < boardSize.cols -1
			   && b[box.row][box.col+1].num == m) { // right
			slide(0, 1, box);
		} else l("no empty adjacent box");
	}
	// put a box into a sliding state
	function slide(rowC, colC, box) { // rowChange & colChange
		let b = state.board;
		let c = can.getContext("2d");

		b[box.row][box.col].sliding = true;
		b[box.row][box.col].slideCoords = function(pos, delta) {
			this.slideX += speed * (delta/1000) * colC;
			this.slideY += speed * (delta/1000) * rowC;
			return { x: pos.x + this.slideX, y: pos.y + this.slideY };
		}

		let endSlideFunc = function() {
			let temp = b[box.row + rowC][box.col + colC];
			b[box.row + rowC][box.col + colC] = b[box.row][box.col];
			b[box.row][box.col] = temp;
		}
		render(endSlideFunc, Date.now());
	}
	// draw the board
	function render(endSlideFunc, then) {
		let b = state.board;
		let w = gameElement.clientWidth;
		let h = gameElement.clientHeight;
		let rowH = h / boardSize.rows;
		let colW = w / boardSize.cols;
		let bdr = boxBorder;
		let c = can.getContext("2d");
		let m = boardSize.rows * boardSize.cols;
		let recurse = false;

		c.clearRect(0, 0, can.width, can.height);
		for (let i=0; i<b.length; i++) {
			for (let j=0; j<b[i].length; j++) {
				let pos = {
					x: j * colW + bdr,
					y: i * rowH + bdr
				}
				let width = colW - 2*bdr;
				let height = rowH - 2*bdr;

				// don't paint the empty square
				if (b[i][j].num == m) continue;

				// special treatment
				if (b[i][j].sliding) {
					// keep rendering for the slide
					recurse = true;
					let delta = Date.now() - then;
					let oldPos = pos;
					pos = b[i][j].slideCoords(pos, delta);
					// check when to stop sliding
					if (Math.abs(pos.x - oldPos.x) >= width ||
					    Math.abs(pos.y - oldPos.y) >= height) {
						b[i][j].reset();
						endSlideFunc();
					}
				}
				// the actual painting
				c.beginPath();
					c.rect(pos.x, pos.y, width, height);
					c.fillStyle = "blue";
					c.fill()
					c.font = fontSize + "px " + font;
					c.fillStyle = "white";
					c.textAlign = "center";
					c.textBaseline = "middle";
					c.fillText(b[i][j].num, pos.x+colW/2, pos.y+rowH/2);
				c.closePath();
			}
		}
		if (recurse) {
			then = Date.now();
			setTimeout(function() { render(endSlideFunc, then); }, 10);
		} else checkForWin();
	}
	// scramble the board
	function scramble() {
		let b = state.board;
		let moves = 1000000;
		let empty = { row: boardSize.rows-1, col: boardSize.cols-1 };

		for (let i=0; i<moves; i++) {
			let rand = Math.floor(Math.random() * 4);
			let toSwap = empty;
			switch (rand) { // up right down left
				case 0:
					if (empty.row == 0) break;
					toSwap = { row: empty.row - 1, col: empty.col };
					break;
				case 1:
					if (empty.col == boardSize.cols-1) break;
					toSwap = { row: empty.row, col: empty.col + 1 };
					break;
				case 2:
					if (empty.row == boardSize.rows-1) break;
					toSwap = { row: empty.row + 1, col: empty.col };
					break;
				case 3:
					if (empty.col == 0) break;
					toSwap = { row: empty.row, col: empty.col - 1 };
					break;
			}

			let temp = b[toSwap.row][toSwap.col];
			b[toSwap.row][toSwap.col] = b[empty.row][empty.col];
			b[empty.row][empty.col] = temp;

			empty = toSwap;
		}
		// the below code allows for possible boards that can't be solved!
		/*for (let i=0; i<b.length; i++) {
			for (let j=0; j<b[i].length; j++) {
				let row = Math.floor(Math.random()*boardSize.rows);
				let col = Math.floor(Math.random()*boardSize.cols);

				let temp = b[i][j];
				b[i][j] = b[row][col];
				b[row][col] = temp;
			}
		}*/
	}
	function l(s) { console.log(s); }

	// the block object (record?) in each spot
	function Block(num) {
		this.num = num;
		this.sliding = false;
		this.slideX = 0;
		this.slideY = 0;
		this.slideCoords = function(pos, delta) {
			// dynamically created function that returns coordinates
			// specific to the sliding direction (made in slide())
		}
		this.reset = function() { // for after a slide
			this.sliding = false;
			this.slideX = 0;
			this.slideY = 0;
		}
	}

	// taken from http://acko.net/blog/mouse-handling-and-absolute-positions-in-javascript/
	// get mouse coordinates relative to an element (gameElement)
	function relCoords(event, reference) {
		var x, y;
		event = event || window.event;
		var el = event.target || event.srcElement;

		if (!window.opera && typeof event.offsetX != 'undefined') {
			// Use offset coordinates and find common offsetParent
			var pos = { x: event.offsetX, y: event.offsetY };

			// Send the coordinates upwards through the offsetParent chain.
			var e = el;
			while (e) {
				e.mouseX = pos.x;
				e.mouseY = pos.y;
				pos.x += e.offsetLeft;
				pos.y += e.offsetTop;
				e = e.offsetParent;
			}

			// Look for the coordinates starting from the reference element.
			var e = reference;
			var offset = { x: 0, y: 0 }
			while (e) {
				if (typeof e.mouseX != 'undefined') {
					x = e.mouseX - offset.x;
					y = e.mouseY - offset.y;
					break;
				}
				offset.x += e.offsetLeft;
				offset.y += e.offsetTop;
				e = e.offsetParent;
			}

			// Reset stored coordinates
			e = el;
			while (e) {
				e.mouseX = undefined;
				e.mouseY = undefined;
				e = e.offsetParent;
			}
		}
		else {
			// Use absolute coordinates
			var pos = getAbsolutePosition(reference);
			x = event.pageX  - pos.x;
			y = event.pageY - pos.y;
		}
		// Subtract distance to middle
		return { x: x, y: y };
	}
	// helper function for relCoords()
	function getAbsolutePosition(element) {
		var r = { x: element.offsetLeft, y: element.offsetTop };
		if (element.offsetParent) {
			var tmp = getAbsolutePosition(element.offsetParent);
			r.x += tmp.x;
			r.y += tmp.y;
		}
		return r;
	};
}
