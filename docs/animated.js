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
function Curve() {

	this.A = [{"x": 36, "y": 181}, {"x": 243, "y": 477}, {"x": 216, "y": 190}, {"x": 441, "y": 366}, {"x": 323, "y": 78}];
	this.B = [];
	this.C = [];

	this.calc = function () {

		let A = this.A;
		let B = this.B;
		let C = this.C;

		// coefficients for a 5 point closed path
		let c0 = 3.0 / 11.0;
		let c1 = -1.0 / 11.0;
		let c2 = 1.0 / 11.0;
		let c3 = -3.0 / 11.0;
		let c4 = 1;

		// determine first control point
		B = this.B = [
			{ x: A[1].x*c0 + A[2].x*c1 + A[3].x*c2 + A[4].x*c3 + A[0].x*c4 ,
			  y: A[1].y*c0 + A[2].y*c1 + A[3].y*c2 + A[4].y*c3 + A[0].y*c4 },
			{ x: A[2].x*c0 + A[3].x*c1 + A[4].x*c2 + A[0].x*c3 + A[1].x*c4 ,
			  y: A[2].y*c0 + A[3].y*c1 + A[4].y*c2 + A[0].y*c3 + A[1].y*c4 },
			{ x: A[3].x*c0 + A[4].x*c1 + A[0].x*c2 + A[1].x*c3 + A[2].x*c4 ,
			  y: A[3].y*c0 + A[4].y*c1 + A[0].y*c2 + A[1].y*c3 + A[2].y*c4 },
			{ x: A[4].x*c0 + A[0].x*c1 + A[1].x*c2 + A[2].x*c3 + A[3].x*c4 ,
			  y: A[4].y*c0 + A[0].y*c1 + A[1].y*c2 + A[2].y*c3 + A[3].y*c4 },
			{ x: A[0].x*c0 + A[1].x*c1 + A[2].x*c2 + A[3].x*c3 + A[4].x*c4 ,
			  y: A[0].y*c0 + A[1].y*c1 + A[2].y*c2 + A[3].y*c3 + A[4].y*c4 }
		];

		// snap to grid
		for (let i = 0; i < 5; i++)
			B[i] = {x: Math.round(B[i].x), y: Math.round(B[i].y)};

		// mirror to second control point (only needed for encoded path string)
		for (let i = 0; i < 5; i++) {
			C[i] = { x: 2 * A[(i + 1) % 5].x - B[(i + 1) % 5].x,
				 y: 2 * A[(i + 1) % 5].y - B[(i + 1) % 5].y };
		}
	};

	this.draw = function (ctx, t, animatedVanilla) {
		let A = this.A;
		let B = this.B;
		let C = this.C;

		// display curve
		ctx.beginPath();
		ctx.strokeStyle = '#00f';
		ctx.lineWidth = 2;
		ctx.moveTo(A[0].x, A[0].y);
		ctx.bezierCurveTo(B[0].x, B[0].y, C[0].x, C[0].y, A[1].x, A[1].y);
		ctx.bezierCurveTo(B[1].x, B[1].y, C[1].x, C[1].y, A[2].x, A[2].y);
		ctx.bezierCurveTo(B[2].x, B[2].y, C[2].x, C[2].y, A[3].x, A[3].y);
		ctx.bezierCurveTo(B[3].x, B[3].y, C[3].x, C[3].y, A[4].x, A[4].y);
		ctx.bezierCurveTo(B[4].x, B[4].y, C[4].x, C[4].y, A[0].x, A[0].y);
		ctx.stroke();

		if (!animatedVanilla) {
			// draw traditional control spoke

			ctx.beginPath();
			ctx.strokeStyle = '#0f0';
			ctx.lineWidth = 2;
			for (let i = 0; i < 5; i++) {
				ctx.moveTo(A[(i+1)%5].x, A[(i+1)%5].y);
				ctx.lineTo(B[(i+1)%5].x, B[(i+1)%5].y);
				ctx.lineTo(C[i].x, C[i].y);
			}
			ctx.closePath();
			ctx.stroke();

			return;
		}

		/*
		 * outer guides
		 */
		ctx.beginPath();
		ctx.strokeStyle = '#ccc';
		ctx.lineWidth = 2;
		ctx.moveTo(A[0].x, A[0].y);
		for (let i = 0; i < 5; i++) {
			ctx.lineTo(A[i].x, A[i].y);
			ctx.lineTo(B[i].x, B[i].y);
			ctx.lineTo(C[i].x, C[i].y);
		}
		ctx.closePath();
		ctx.stroke();

		/*
		 * first derivative
		 */
		let D1 = [];
		for (let i = 0; i < 5; i++) {
			D1[i] = [{x: A[i].x * (1 - t) + B[i].x * t, y: A[i].y * (1 - t) + B[i].y * t},
				{x: B[i].x * (1 - t) + C[i].x * t, y: B[i].y * (1 - t) + C[i].y * t},
				{x: C[i].x * (1 - t) + A[(i + 1) % 5].x * t, y: C[i].y * (1 - t) + A[(i + 1) % 5].y * t}];
		}

		ctx.beginPath();
		ctx.strokeStyle = '#0f0';
		ctx.fillStyle = '#0f0';
		ctx.lineWidth = 2;
		for (let i = 0; i < 5; i++) {
			let d = D1[i];

			ctx.moveTo(d[0].x, d[0].y);
			for (let j = 0; j < 3; j++) {
				ctx.lineTo(d[j].x, d[j].y);
				ctx.arc(d[j].x, d[j].y, 2, 0, 2 * Math.PI);
				ctx.moveTo(d[j].x, d[j].y);
			}
		}
		ctx.stroke();

		/*
		 * second derivative
		 */
		let D2 = [];
		for (let i = 0; i < 5; i++) {
			D2[i] = [{x: D1[i][0].x * (1 - t) + D1[i][1].x * t, y: D1[i][0].y * (1 - t) + D1[i][1].y * t},
				{x: D1[i][1].x * (1 - t) + D1[i][2].x * t, y: D1[i][1].y * (1 - t) + D1[i][2].y * t}];
		}

		ctx.beginPath();
		ctx.strokeStyle = '#f00';
		ctx.fillStyle = '#f00';
		ctx.lineWidth = 2;
		for (let i = 0; i < 5; i++) {
			let d = D2[i];

			ctx.moveTo(d[0].x, d[0].y);
			for (let j = 0; j < 2; j++) {
				ctx.lineTo(d[j].x, d[j].y);
				ctx.arc(d[j].x, d[j].y, 2, 0, 2 * Math.PI);
				ctx.moveTo(d[j].x, d[j].y);
			}
		}
		ctx.stroke();

		/*
		 * third derivative
		 */
		let D3 = [];
		for (let i = 0; i < 5; i++) {
			D3[i] = [{x: D2[i][0].x * (1 - t) + D2[i][1].x * t, y: D2[i][0].y * (1 - t) + D2[i][1].y * t}];
		}

		ctx.beginPath();
		ctx.strokeStyle = '#000';
		ctx.fillStyle = '#000';
		ctx.lineWidth = 2;
		for (let i = 0; i < 5; i++) {
			let d = D3[i];

			ctx.moveTo(d[0].x, d[0].y);
			for (let j = 0; j < 1; j++) {
				ctx.lineTo(d[j].x, d[j].y);
				ctx.arc(d[j].x, d[j].y, 2, 0, 2 * Math.PI);
				ctx.moveTo(d[j].x, d[j].y);
			}
		}
		ctx.stroke();
	}
}

if (typeof window === 'undefined') {
	let {createCanvas} = require('canvas')
	let fs = require('fs')

	let width = 500;
	let height = 500;

	// create the curve
	let curve = new Curve();
	curve.calc();

	// create the canvas
	let canvas = createCanvas(width, height)
	canvas.width = width;
	canvas.height = height;

	let ctx = canvas.getContext('2d')

	// 50mSec / frame = 20fps
	for (let t = 0; t < 100; t++) {
		// erase canvas
		ctx.fillStyle = '#eee'
		ctx.fillRect(0, 0, width, height)

		// draw
		curve.draw(ctx, t / 100, true);

		// save
		let buffer = canvas.toBuffer('image/png')
		fs.writeFileSync('animated-' + Math.trunc(t / 10) + (t % 10) + '.png', buffer)
	}
}
