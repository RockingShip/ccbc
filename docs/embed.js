/*
 *  This file is part of ccbc, Closed Continuous Bézier Curves.
 *  Copyright (C) 2012, xyzzy@rockingship.org
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

let path1 = document.getElementById("path1");
let path2 = document.getElementById("path2");
let path3 = document.getElementById("path3");
let path4 = document.getElementById("path4");
let path5 = document.getElementById("path5");
let pads = [
	document.getElementById("pad1"),
	document.getElementById("pad2"),
	document.getElementById("pad3"),
	document.getElementById("pad4"),
	document.getElementById("pad5")
];
let width = 1;
let height = 1;
let R = 1; // stroke width

function Curve() {

	this.A = [{"x": 0.076, "y": 0.352}, {"x": 0.462, "y": 0.918}, {"x": 0.430, "y": 0.376}, {"x": 0.878, "y": 0.736}, {"x": 0.644, "y": 0.164}];
	this.B = [{"x": 0, "y": 0}, {"x": 0, "y": 0}, {"x": 0, "y": 0}, {"x": 0, "y": 0}, {"x": 0, "y": 0}];
	this.C = [{"x": 0, "y": 0}, {"x": 0, "y": 0}, {"x": 0, "y": 0}, {"x": 0, "y": 0}, {"x": 0, "y": 0}];

	this.calc = function () {

		const A = this.A;
		const B = this.B;
		const C = this.C;
		const N = A.length;

		B.length = N;
		C.length = N;

		// coefficients for a 5 point closed path
		const c0 = 3.0 / 11.0;
		const c1 = -1.0 / 11.0;
		const c2 = 1.0 / 11.0;
		const c3 = -3.0 / 11.0;
		const c4 = 1;

		// determine first control point
		for (let i = 0; i < N; i++) {
			B[i].x = A[(i + 1) % N].x * c0 + A[(i + 2) % N].x * c1 + A[(i + 3) % N].x * c2 + A[(i + 4) % N].x * c3 + A[i].x * c4;
			B[i].y = A[(i + 1) % N].y * c0 + A[(i + 2) % N].y * c1 + A[(i + 3) % N].y * c2 + A[(i + 4) % N].y * c3 + A[i].y * c4;
		}

		// snap to grid
		for (let i = 0; i < N; i++)
			B[i] = {x: Math.round(B[i].x), y: Math.round(B[i].y)};

		// mirror to second control point (only needed for encoded path string)
		for (let i = 0; i < N; i++) {
			C[i].x = 2 * A[(i + 1) % N].x - B[(i + 1) % N].x;
			C[i].y = 2 * A[(i + 1) % N].y - B[(i + 1) % N].y;
		}
	};

	this.draw = function (t) {
		const A = this.A;
		const B = this.B;
		const C = this.C;
		const N = A.length;
		let d;

		/*
		 * control net
		 */
		d = 'M' + A[0].x + ',' + A[0].y + 'L' + B[0].x + ',' + B[0].y + 'L' + C[0].x + ',' + C[0].y +
			'L' + A[1].x + ',' + A[1].y + 'L' + B[1].x + ',' + B[1].y + 'L' + C[1].x + ',' + C[1].y +
			'L' + A[2].x + ',' + A[2].y + 'L' + B[2].x + ',' + B[2].y + 'L' + C[2].x + ',' + C[2].y +
			'L' + A[3].x + ',' + A[3].y + 'L' + B[3].x + ',' + B[3].y + 'L' + C[3].x + ',' + C[3].y +
			'L' + A[4].x + ',' + A[4].y + 'L' + B[4].x + ',' + B[4].y + 'L' + C[4].x + ',' + C[4].y + 'z';
		path2.setAttribute("d", d); // hint1

		/*
		 * display curve
		 */
		d = 'M' + A[0].x + ',' + A[0].y +
			' C' + B[0].x + ',' + B[0].y + ' ' + C[0].x + ',' + C[0].y + ' ' + A[1].x + ',' + A[1].y +
			' S' + C[1].x + ',' + C[1].y + ' ' + A[2].x + ',' + A[2].y +
			' S' + C[2].x + ',' + C[2].y + ' ' + A[3].x + ',' + A[3].y +
			' S' + C[3].x + ',' + C[3].y + ' ' + A[4].x + ',' + A[4].y +
			' S' + C[4].x + ',' + C[4].y + ' ' + A[0].x + ',' + A[0].y +
			' z';
		path1.setAttribute("d", d);

		/*
		 * first derivative
		 */
		let D1 = [];
		for (let i = 0; i < N; i++) {
			D1[i] = [{x: Math.round(A[i].x * (1 - t) + B[i].x * t), y: Math.round(A[i].y * (1 - t) + B[i].y * t)},
				 {x: Math.round(B[i].x * (1 - t) + C[i].x * t), y: Math.round(B[i].y * (1 - t) + C[i].y * t)},
				 {x: Math.round(C[i].x * (1 - t) + A[(i + 1) % N].x * t), y: Math.round(C[i].y * (1 - t) + A[(i + 1) % N].y * t)}];
		}
		d = '';
		for (let i = 0; i < N; i++) {
			const d1 = D1[i];
			d += 'M' + d1[0].x + ',' + (d1[0].y - R) + 'a' + R + ',' + R + ' 0 1,0 0,' + (R * 2) + ' a' + R + ',' + R + ' 0 1,0 0,-' + (R * 2); // dot1 (two half arcs)
			d += 'M' + d1[0].x + ',' + d1[0].y + 'L' + d1[1].x + ',' + d1[1].y; // line1
			d += 'M' + d1[1].x + ',' + (d1[1].y - R) + 'a' + R + ',' + R + ' 0 1,0 0,' + (R * 2) + ' a' + R + ',' + R + ' 0 1,0 0,-' + (R * 2); // dot2
			d += 'M' + d1[1].x + ',' + d1[1].y + 'L' + d1[2].x + ',' + d1[2].y; // line1
			d += 'M' + d1[2].x + ',' + (d1[2].y - R) + 'a' + R + ',' + R + ' 0 1,0 0,' + (R * 2) + ' a' + R + ',' + R + ' 0 1,0 0,-' + (R * 2); // dot3
		}
		path3.setAttribute("d", d);

		/*
		 * second derivative
		 */
		let D2 = [];
		for (let i = 0; i < N; i++) {
			D2[i] = [{x: Math.round(D1[i][0].x * (1 - t) + D1[i][1].x * t), y: Math.round(D1[i][0].y * (1 - t) + D1[i][1].y * t)},
				 {x: Math.round(D1[i][1].x * (1 - t) + D1[i][2].x * t), y: Math.round(D1[i][1].y * (1 - t) + D1[i][2].y * t)}];
		}
		d = '';
		for (let i = 0; i < N; i++) {
			const d2 = D2[i];
			d += 'M' + d2[0].x + ',' + (d2[0].y - R) + 'a' + R + ',' + R + ' 0 1,0 0,' + (R * 2) + ' a' + R + ',' + R + ' 0 1,0 0,-' + (R * 2); // dot1
			d += 'M' + d2[0].x + ',' + d2[0].y + 'L' + d2[1].x + ',' + d2[1].y; // line1
			d += 'M' + d2[1].x + ',' + (d2[1].y - R) + 'a' + R + ',' + R + ' 0 1,0 0,' + (R * 2) + ' a' + R + ',' + R + ' 0 1,0 0,-' + (R * 2); // dot2
		}
		path4.setAttribute("d", d);

		/*
		 * third derivative
		 */
		let D3 = [];
		for (let i = 0; i < N; i++) {
			D3[i] = [{x: Math.round(D2[i][0].x * (1 - t) + D2[i][1].x * t), y: Math.round(D2[i][0].y * (1 - t) + D2[i][1].y * t)}];
		}
		d = '';
		for (let i = 0; i < N; i++) {
			const d3 = D3[i];
			d += 'M' + d3[0].x + ',' + (d3[0].y - 2) + 'a' + R + ',' + R + ' 0 1,0 0,' + (R * 2) + ' a' + R + ',' + R + ' 0 1,0 0,-' + (R * 2); // dot1
		}
		path5.setAttribute("d", d);
	}
}

function setDimensions() {
	// how much to scale
	let scaleW = document.documentElement.clientWidth / width;
	let scaleH = document.documentElement.clientHeight / height;

	// get current width/height
	width = document.documentElement.clientWidth;
	height = document.documentElement.clientHeight;
	R = Math.min(width, height) / 200; // stroke width

	// scale coordinates
	for (let i = 0; i < window.curve.A.length; i++) {
		window.curve.A[i].x = Math.round(window.curve.A[i].x * scaleW);
		window.curve.A[i].y = Math.round(window.curve.A[i].y * scaleH);
	}

	// set line heights
	path1.setAttribute("stroke-width", R.toString());
	path2.setAttribute("stroke-width", R.toString());
	path3.setAttribute("stroke-width", R.toString());
	path4.setAttribute("stroke-width", R.toString());
	path5.setAttribute("stroke-width", R.toString());
	// set pads
	for (let i = 0; i < pads.length; i++) {
		pads[i].setAttribute("cx", window.curve.A[i].x.toString());
		pads[i].setAttribute("cy", window.curve.A[i].y.toString());
		pads[i].setAttribute("r", (R * 4).toString());
		// give pads theid index for event handler
		pads[i].padNr = i;

	}
}

let fps = 25;
let t = 0;

// create curve
window.curve = new Curve();
// scale coordinates to svg size
setDimensions();
// setup curve
window.curve.calc(width, height);

// state for event handlers
let curel = 0, x0, y0, elx, ely;

function mouseDown(event) {
//        event.stopPropagation();
	x0 = event.x;
	y0 = event.y;
	if (!x0 && !y0 && event.touches) {
		// touchstart event
		x0 = event.touches[0].clientX;
		y0 = event.touches[0].clientY;
	}
	curel = event.target;
	elx = curel.getAttribute("cx") * 1;
	ely = curel.getAttribute("cy") * 1;
}

function mouseMove(event) {
	if (curel) {
		let evx = event.x;
		let evy = event.y;
		if (!evx && !evy && event.touches) {
			// touchstart event
			evx = event.touches[0].clientX;
			evy = event.touches[0].clientY;
		}

		const x = elx + evx - x0;
		const y = ely + evy - y0;

		console.log(x + ' ' + y);
		curel.setAttribute("cx", x.toString());
		curel.setAttribute("cy", y.toString());
		window.curve.A[curel.padNr] = {x: x, y: y};
		window.curve.calc();
	}
}

function mouseUp(event) {
	curel = 0;
}

function run() {
	setInterval(function () {
		window.curve.draw(t);
		// IEEE modulo to bound 0<=t<1
		t = (t + 0.01) % 1;
	}, 1000 / fps);

	addEventListener("resize", function () {
		// scale coordinates to svg size
		setDimensions();

		window.curve.calc(width, height);
	});

	// state for event handlers
	let curel = 0, x0, y0, elx, ely;

	// attach mouse events
	for (let i = 0; i < pads.length; i++) {
		pads[i].addEventListener("mousedown", mouseDown);
		pads[i].addEventListener("mousemove", mouseMove);
		pads[i].addEventListener("mouseup", mouseUp);
		pads[i].addEventListener("touchstart", mouseDown);
		pads[i].addEventListener("touchmove", mouseMove);
		pads[i].addEventListener("touchend", mouseUp);
	}

	// container mousemove handler (in case mouse moves outside dot during gesture)
	addEventListener("mousemove", mouseMove);
	addEventListener("mouseup", mouseUp);
	addEventListener("touchmove", mouseMove);
	addEventListener("touchend", mouseUp);

}