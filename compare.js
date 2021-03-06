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

	this.AX = [];		// on-curve control points
	this.AY = [];
	this.BX = [];		// off-curve control points
	this.BY = [];
	this.CX = [];		// off-curve mirrored control point
	this.CY = [];
	this.rgb = [];		// colour palette
	this.dt = 0;		// `dt` used for forward/reverse coefficients
	this.FCOEF2X = [];	// when moving `t` forward
	this.FCOEF2Y = [];
	this.FCOEF1X = [];
	this.FCOEF1Y = [];
	this.FCOEF0X = [];
	this.FCOEF0Y = [];
	this.RCOEF2X = [];	// when moving `t` reverse
	this.RCOEF2Y = [];
	this.RCOEF1X = [];
	this.RCOEF1Y = [];
	this.RCOEF0X = [];
	this.RCOEF0Y = [];
	this.contourX = [];	// contour coordinate vector to apply `compare()` to
	this.contourY = [];
	this.fragLen = [];	// length of curve fragment
	this.fragX = [];	// starting x/y of curve fragment
	this.fragY = [];
	this.segI = [];		// starting fragment of contour segment
	this.segDir = [];	// when updating the segment/fragment mapping, which direction do the segments move
	this.segLen = [];	// length of segment
	this.numCompare = 0;	// # times `compare()` is called
	this.totalError = 0;	// total length of all curve/contour mapping lines
	this.changed = 0;	// some curve points changed
	this.pt = 0;		// current control point being updated
	this.radius = 1;	// current radius to test alternative control locations
	// settings
	this.maxRatio = 1.18;	// adjacent segments may not exceed this distance difference
	this.maxRadius = 3;	// maximum radius
	this.ratioContour = 1.0 / 6.0; // density controlNetLength:numContour for `captureContour()` -- used to determine number of contours
	this.ratioCompare = 8.0 / 1.0; // density numContour:numFragment for `compareInit()` -- used to determine # curve fragments per contour segment

	/*
	 * Create a rgb gradient palette
	 */
	for (let i = 0; i < 256; i++) {
		let r = Math.round(128.0 + 127 * Math.sin(Math.PI * i / 32.0));
		let g = Math.round(128.0 + 127 * Math.sin(Math.PI * i / 64.0));
		let b = Math.round(128.0 + 127 * Math.sin(Math.PI * i / 128.0));

		this.rgb[i] = "#" +
			"0123456789abcdef"[r >> 4] +
			"0123456789abcdef"[r % 16] +
			"0123456789abcdef"[g >> 4] +
			"0123456789abcdef"[g % 16] +
			"0123456789abcdef"[b >> 4] +
			"0123456789abcdef"[b % 16];
	}

	/*
	 * Draw curve control points
	 */
	this.drawCurvePoints = function (ctx, radius, colour) {
		let AX = this.AX;
		let AY = this.AY;
		let N = AX.length;

		ctx.beginPath();
		ctx.strokeStyle = colour;
		ctx.fillStyle = colour;
		ctx.lineWidth = 1;
		for (let i = 0; i < N; i++) {
			ctx.moveTo(AX[i], AY[i]);
			ctx.arc(AX[i], AY[i], radius, 0, 2 * Math.PI);
			ctx.moveTo(AX[i], AY[i]);
		}
		ctx.fill();
	}

	/*
	 * Draw bezier curve
	 */
	this.drawCurve = function (ctx, colour) {
		let AX = this.AX;
		let AY = this.AY;
		let BX = this.BX;
		let BY = this.BY;
		let CX = this.CX;
		let CY = this.CY;
		let N = AX.length;

		ctx.beginPath();
		ctx.strokeStyle = colour;
		ctx.lineWidth = 2;
		ctx.moveTo(AX[0], AY[0]);
		for (let i = 0; i < N; i++)
			ctx.bezierCurveTo(BX[i], BY[i], CX[i], CY[i], AX[(i + 1) % N], AY[(i + 1) % N]);
		ctx.stroke();
	}

	/*
	 * Draw hints of where B[]/C[] are located
	 */
	this.drawHints = function (ctx, colour) {
		let AX = this.AX;
		let AY = this.AY;
		let BX = this.BX;
		let BY = this.BY;
		let CX = this.CX;
		let CY = this.CY;
		let N = AX.length;

		ctx.beginPath();
		ctx.strokeStyle = colour;
		ctx.lineWidth = 2;
		for (let i = 0; i < N; i++) {
			ctx.moveTo(AX[i], AY[i]);
			ctx.lineTo(BX[i], BY[i]);
			ctx.lineTo(CX[(i - 1 + N) % N], CY[(i - 1 + N) % N]);
		}
		ctx.stroke();
	};

	/*
	 * Draw contour coordinate vector
	 */
	this.drawContour = function (ctx, contourX, contourY, colour) {
		ctx.beginPath();
		ctx.strokeStyle = colour;
		ctx.fillStyle = colour;
		for (let i = 0; i < contourX.length; i++)
			ctx.fillRect(contourX[i] - 1, contourY[i] - 1, 2, 2);
		ctx.stroke();
	};

	/*
	 * Draw contour/curve mapping
	 */
	this.drawCompare = function (ctx) {
		const contourX = this.contourX;
		const contourY = this.contourY;
		const segI = this.segI;
		const segLen = this.segLen;
		const sN = segLen.length;

		for (let i = 0; i < sN; i++) {
			// draw line. each stoke has its own colour
			ctx.beginPath();
			ctx.strokeStyle = this.rgb[i % 256];
			ctx.fillStyle = this.rgb[i % 256];
			ctx.lineWidth = 1;
			ctx.moveTo(contourX[i], contourY[i]);
			ctx.lineTo(this.fragX[segI[i]], this.fragY[segI[i]]);
			ctx.stroke();
		}
	}

	/*
	 * Draw complete frame
	 */
	this.draw = function (ctx) {
		// draw initial state
		this.drawCompare(ctx);
		this.drawContour(ctx, this.contourX, this.contourY, "#f00");
		this.drawCurvePoints(ctx, 2, "#00f");
		this.drawCurve(ctx, "#00f");
		// curve.drawHints(ctx, "#0f0");
	}

	/*
	 * Create coefficients and determine B/C for a Closed Continuous Bezier Curve
	 */
	this.calcControlsClosed = function (A, B, C) {
		const N = A.length;
		const round = Math.round;

		B.length = N;
		C.length = N;

		if (N >= 10 && !(N & 1)) {
			// Even N
			for (let j = 0; j < N; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j - 1 + N) % N]) * 56 - (A[(j + 2) % N] - A[(j - 2 + N) % N]) * 15 + (A[(j + 3) % N] - A[(j - 3 + N) % N]) * 4 - (A[(j + 4) % N] - A[(j - 4 + N) % N])) / 209;
		} else if (N >= 9) {
			// Odd N
			for (let j = 0; j < N; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j - 1 + N) % N]) * 41 - (A[(j + 2) % N] - A[(j - 2 + N) % N]) * 11 + (A[(j + 3) % N] - A[(j - 3 + N) % N]) * 3 - (A[(j + 4) % N] - A[(j - 4 + N) % N])) / 153;
		} else if (N == 8) {
			for (let j = 0; j < 8; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j + 7) % N]) * 15 - (A[(j + 2) % N] - A[(j + 6) % N]) * 4 + (A[(j + 3) % N] - A[(j + 5) % N])) / 56;
		} else if (N == 7) {
			for (let j = 0; j < 7; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j + 6) % N]) * 11 - (A[(j + 2) % N] - A[(j + 5) % N]) * 3 + (A[(j + 3) % N] - A[(j + 4) % N])) / 41;
		} else if (N == 6) {
			for (let j = 0; j < 6; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j + 5) % N]) * 4 - (A[(j + 2) % N] - A[(j + 4) % N])) / 15;
		} else if (N == 5) {
			for (let j = 0; j < 5; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j + 4) % N]) * 3 - (A[(j + 2) % N] - A[(j + 3) % N])) / 11;
		} else if (N == 4) {
			for (let j = 0; j < 4; j++)
				B[j] = A[j] + (A[(j + 1) % N] - A[(j + 3) % N]) / 4;
		} else if (N == 3) {
			for (let j = 0; j < 3; j++)
				B[j] = A[j] + (A[(j + 1) % N] - A[(j + 2) % N]) / 3;
		} else {
			for (let j = 0; j < N; j++)
				B[j] = A[j];
		}

		for (let i = 0; i < N; i++)
			C[i] = 2 * A[(i + 1) % N] - B[(i + 1) % N];
	};

	/*
	 * Perform a fast and rough approximation of the control net length
	 */
	this.calcControlLength = function () {
		const AX = this.AX;
		const AY = this.AY;
		const BX = this.BX;
		const BY = this.BY;
		const CX = this.CX;
		const CY = this.CY;
		const N = AX.length;

		/*
		 * Determine length of control net sides
		 */
		let controlLength = 0;
		for (let i = 0; i < N; i++) {
			const iPlus1 = (i + 1) % N;

			let dx = BX[i] - AX[i];
			let dy = BY[i] - AY[i];
			controlLength += Math.sqrt(dx * dx + dy * dy);
			dx = CX[i] - BX[i];
			dy = CY[i] - BY[i];
			controlLength += Math.sqrt(dx * dx + dy * dy);
			dx = AX[iPlus1] - CX[i];
			dy = AY[iPlus1] - CY[i];
			controlLength += Math.sqrt(dx * dx + dy * dy);
		}

		return controlLength;
	}

	/*
	 * Capture contour
	 * Walk the contour and save coordinates after every integer unit distance
	 */
	this.captureContour = function (numContour, contourX, contourY) {
		const AX = this.AX;
		const AY = this.AY;
		const BX = this.BX;
		const BY = this.BY;
		const CX = this.CX;
		const CY = this.CY;
		const N = AX.length;

		// determine `dt`
		let dt = 1 / numContour; // `dt` for complete composite curve
		dt *= N; // `dt` for a composite section

		// erase arrays
		contourX.length = 0;
		contourY.length = 0;

		/*
		 * Walk the path
		 */
		let contourLength = 0;

		for (let i = 0; i < N; i++) {

			let iPlus1 = (i + 1) % N;
			const COEF2X = AX[i] * (-3 * dt) + BX[i] * (9 * dt) + CX[i] * (-9 * dt) + AX[iPlus1] * (3 * dt);
			const COEF2Y = AY[i] * (-3 * dt) + BY[i] * (9 * dt) + CY[i] * (-9 * dt) + AY[iPlus1] * (3 * dt);
			const COEF1X = AX[i] * (6 * dt - 3 * dt * dt) + BX[i] * (-12 * dt + 9 * dt * dt) + CX[i] * (6 * dt - 9 * dt * dt) + AX[iPlus1] * (3 * dt * dt);
			const COEF1Y = AY[i] * (6 * dt - 3 * dt * dt) + BY[i] * (-12 * dt + 9 * dt * dt) + CY[i] * (6 * dt - 9 * dt * dt) + AY[iPlus1] * (3 * dt * dt);
			const COEF0X = AX[i] * (-3 * dt + 3 * dt * dt - dt * dt * dt) + BX[i] * (3 * dt - 6 * dt * dt + 3 * dt * dt * dt) + CX[i] * (3 * dt * dt - 3 * dt * dt * dt) + AX[iPlus1] * (dt * dt * dt);
			const COEF0Y = AY[i] * (-3 * dt + 3 * dt * dt - dt * dt * dt) + BY[i] * (3 * dt - 6 * dt * dt + 3 * dt * dt * dt) + CY[i] * (3 * dt * dt - 3 * dt * dt * dt) + AY[iPlus1] * (dt * dt * dt);

			for (let t = 0, x = AX[i], y = AY[i]; t < 1; t += dt) {

				// Determine step increments
				const dx = COEF2X * t * t + COEF1X * t + COEF0X;
				const dy = COEF2Y * t * t + COEF1Y * t + COEF0Y;

				// add length
				contourLength += Math.sqrt(dx * dx + dy * dy);
				if (contourLength >= 1) {
					contourX.push(x);
					contourY.push(y);
					// javascript does IEEE float remainder
					contourLength %= 1; // get fraction
				}

				x += dx;
				y += dy;
			}
		}
	}

	/*
	 * Call when either dt or control points change
	 */
	this.updateControls = function () {
		const AX = this.AX;
		const AY = this.AY;
		const BX = this.BX;
		const BY = this.BY;
		const CX = this.CX;
		const CY = this.CY;
		const bN = AX.length;
		const dt = this.dt;

		// calculate plotting coefficients
		for (let i = 0; i < bN; i++) {
			const iPlus1 = (i + 1) % bN;

			this.FCOEF2X[i] = AX[i] * (-3 * dt) + BX[i] * (9 * dt) + CX[i] * (-9 * dt) + AX[iPlus1] * (3 * dt);
			this.FCOEF2Y[i] = AY[i] * (-3 * dt) + BY[i] * (9 * dt) + CY[i] * (-9 * dt) + AY[iPlus1] * (3 * dt);
			this.FCOEF1X[i] = AX[i] * (6 * dt - 3 * dt * dt) + BX[i] * (-12 * dt + 9 * dt * dt) + CX[i] * (6 * dt - 9 * dt * dt) + AX[iPlus1] * (3 * dt * dt);
			this.FCOEF1Y[i] = AY[i] * (6 * dt - 3 * dt * dt) + BY[i] * (-12 * dt + 9 * dt * dt) + CY[i] * (6 * dt - 9 * dt * dt) + AY[iPlus1] * (3 * dt * dt);
			this.FCOEF0X[i] = AX[i] * (-3 * dt + 3 * dt * dt - dt * dt * dt) + BX[i] * (3 * dt - 6 * dt * dt + 3 * dt * dt * dt) + CX[i] * (3 * dt * dt - 3 * dt * dt * dt) + AX[iPlus1] * (dt * dt * dt);
			this.FCOEF0Y[i] = AY[i] * (-3 * dt + 3 * dt * dt - dt * dt * dt) + BY[i] * (3 * dt - 6 * dt * dt + 3 * dt * dt * dt) + CY[i] * (3 * dt * dt - 3 * dt * dt * dt) + AY[iPlus1] * (dt * dt * dt);

			this.RCOEF2X[i] = AX[i] * (-3 * -dt) + BX[i] * (9 * -dt) + CX[i] * (-9 * -dt) + AX[iPlus1] * (3 * -dt);
			this.RCOEF2Y[i] = AY[i] * (-3 * -dt) + BY[i] * (9 * -dt) + CY[i] * (-9 * -dt) + AY[iPlus1] * (3 * -dt);
			this.RCOEF1X[i] = AX[i] * (6 * -dt - 3 * -dt * -dt) + BX[i] * (-12 * -dt + 9 * -dt * -dt) + CX[i] * (6 * -dt - 9 * -dt * -dt) + AX[iPlus1] * (3 * -dt * -dt);
			this.RCOEF1Y[i] = AY[i] * (6 * -dt - 3 * -dt * -dt) + BY[i] * (-12 * -dt + 9 * -dt * -dt) + CY[i] * (6 * -dt - 9 * -dt * -dt) + AY[iPlus1] * (3 * -dt * -dt);
			this.RCOEF0X[i] = AX[i] * (-3 * -dt + 3 * -dt * -dt + dt * -dt * -dt) + BX[i] * (3 * -dt - 6 * -dt * -dt + 3 * -dt * -dt * -dt) + CX[i] * (3 * -dt * -dt - 3 * -dt * -dt * -dt) + AX[iPlus1] * (-dt * -dt * -dt);
			this.RCOEF0Y[i] = AY[i] * (-3 * -dt + 3 * -dt * -dt + dt * -dt * -dt) + BY[i] * (3 * -dt - 6 * -dt * -dt + 3 * -dt * -dt * -dt) + CY[i] * (3 * -dt * -dt - 3 * -dt * -dt * -dt) + AY[iPlus1] * (-dt * -dt * -dt);
		}

		const fragLen = this.fragLen;
		const fragX = this.fragX;
		const fragY = this.fragY;
		const segI = this.segI;
		const segLen = this.segLen;
		const sN = segLen.length;
		const fN = fragLen.length;

		// calculate curve fragment positions and lengths.
		for (let i = 0, k = 0; i < bN; i++) {
			for (let t = 0, x = AX[i], y = AY[i]; t < 1; t += dt, k++) {

				// Determine step increments
				const dx = this.FCOEF2X[i] * t * t + this.FCOEF1X[i] * t + this.FCOEF0X[i];
				const dy = this.FCOEF2Y[i] * t * t + this.FCOEF1Y[i] * t + this.FCOEF0Y[i];

				// add length
				fragX[k] = x;
				fragY[k] = y;
				fragLen[k] = Math.sqrt(dx * dx + dy * dy);

				x += dx;
				y += dy;
			}
		}

		// update segment lengths
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			segLen[i] = 0;
			for (let k = segI[i]; k !== segI[iPlus1]; k = (k + 1) % fN)
				segLen[i] += fragLen[k];
		}
	}

	/*
	 * Call this to setup progressive compare
	 */
	this.compareInit = function (numFragments, contourX, contourY) {
		const AX = this.AX;
		const AY = this.AY;
		const bN = AX.length; // number of bezier sections
		const sN = contourX.length; // number of contour segments
		const fragLen = this.fragLen;
		const segI = this.segI;
		const segLen = this.segLen;
		const segDir = this.segDir;

		// determine `dt`
		this.dt = 1 / numFragments; // `dt` for complete composite curve
		this.dt *= bN; // `dt` for a composite section

		// go through loop in case there might be rounding errors to excessive additions
		numFragments = 0;
		for (let i = 0, k = 0; i < bN; i++)
			for (let t = 0, x = AX[i], y = AY[i]; t < 1; t += this.dt, k++)
				numFragments++;

		// please don't
		if (numFragments < sN)
			console.log(JSON.stringify({error: "# curve fragments < # contour segments", dt: this.dt, numFragments: numFragments, dN: bN, sN: sN}));

		// set array sizes
		this.FCOEF2X.length = bN;
		this.FCOEF2Y.length = bN;
		this.FCOEF1X.length = bN;
		this.FCOEF1Y.length = bN;
		this.FCOEF0X.length = bN;
		this.FCOEF0Y.length = bN;
		this.RCOEF2X.length = bN;
		this.RCOEF2Y.length = bN;
		this.RCOEF1X.length = bN;
		this.RCOEF1Y.length = bN;
		this.RCOEF0X.length = bN;
		this.RCOEF0Y.length = bN;
		this.fragX.length = numFragments;
		this.fragY.length = numFragments;
		this.fragLen.length = numFragments;
		this.contourX = contourX;
		this.contourY = contourY;
		this.segI.length = sN;
		this.segDir.length = sN;
		this.segLen.length = sN;

		// initial mapping
		for (let i = 0; i < sN; i++) {
			segI[i] = Math.trunc(i * numFragments / sN);
			segDir[i] = 0;
		}

		// populate the above arrays
		this.updateControls();

		// validate segment length
		for (let i = 0; i < segI.length; i++) {
			const iPlus1 = (i + 1) % segI.length;

			let len = 0;
			for (let k = segI[i]; k !== segI[iPlus1]; k = (k + 1) % fragLen.length)
				len += fragLen[k];

			if (Math.abs((len - segLen[i])) > 1e-10)
				console.log("ERROR1A: " + i + " " + (len - segLen[i]));
		}

	}

	/*
	 * Call after `updateControls()` to spread segment overflow across neighbours
	 */
	this.compareBalance = function () {

		const fragLen = this.fragLen;
		const segI = this.segI;
		const segLen = this.segLen;
		const sN = segLen.length;
		const fN = fragLen.length;
		const maxRatio = this.maxRatio;

		// validate segment length
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			let len = 0;
			for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fN) {
				if (fragLen[k] > 5000)
					console.log("ERROR3G: " + i + " " + (len - segLen[i]));
				len += fragLen[k];
			}

			if (Math.abs((len - segLen[i])) > 1e-10)
				console.log("ERROR3F: " + i + " " + (len - segLen[i]));
		}

		this.xdir = +1;

		// console.log('balance');
		let changed = false;
		let rounds = 0;
		do {
			changed = false;
			rounds++;

			if (this.xdir != +1) {
				// test if relocating last fragment of segment will lower error
				for (let iCurr = 0; iCurr < sN; iCurr++) {
					const iPrev = (iCurr - 1 + sN) % sN; // previous contour segment
					const iNext = (iCurr + 1) % sN; // next contour segment

					const jFirstCurr = segI[iCurr]; // first fragment of current segment
					const jSecondCurr = (jFirstCurr + 1) % fN; // second fragment of current segment
					const jFirstNext = segI[iNext]; // first fragment of next segment
					const jLastCurr = (jFirstNext - 1 + fN) % fN; // last fragment of current segment

					// only examine current segment that has fragments to export
					if (jFirstCurr != jLastCurr) {

						// only export if balancing constraints need to be met
						// <prev> <curr-frag> <next+frag>

						if (segLen[iCurr] >= segLen[iNext] * maxRatio || segLen[iPrev] >= segLen[iCurr] * maxRatio) {
							// export/relocate last fragment to next segment

							// export/relocate fragment
							segLen[iCurr] -= fragLen[jLastCurr]; // remove fragment length from current
							segLen[iNext] += fragLen[jLastCurr]; // add fragment length to next
							segI[iNext] = jLastCurr;

							// redo previous iteration
							iCurr = (iPrev - 1 + sN) % sN;
							;

							changed = true;
							//known issue: console.log("balance+ "+iCurr);
						}
					}
				}
			} else {
				// test if relocating last fragment of segment will lower error
				for (let iCurr = sN - 1; iCurr >= 0; iCurr--) {
					const iPrev = (iCurr - 1 + sN) % sN; // previous contour segment
					const iNext = (iCurr + 1) % sN; // next contour segment

					const jFirstCurr = segI[iCurr]; // first fragment of current segment
					const jSecondCurr = (jFirstCurr + 1) % fN; // second fragment of current segment
					const jFirstNext = segI[iNext]; // first fragment of next segment
					const jLastCurr = (jFirstNext - 1 + fN) % fN; // last fragment of current segment

					// only examine current segment that has fragments to export
					if (jFirstCurr != jLastCurr) {

						// only export if balancing constraints need to be met
						// <prev+frag> <curr-frag> <next>

						if (segLen[iPrev] * maxRatio <= segLen[iCurr] || segLen[iCurr] * maxRatio <= segLen[iNext]) {
							// export/relocate first fragment to previous segment

							// export/relocate fragment
							segLen[iCurr] -= fragLen[jFirstCurr];
							segLen[iPrev] += fragLen[jFirstCurr];
							segI[iCurr] = jSecondCurr;

							// redo previous iteration
							iCurr = (iNext + 1) % sN;
							;

							changed = true;
							//known issue: console.log("balance- "+iCurr);
						}
					}
				}
			}
			// change direction
			this.xdir = -this.xdir;
		} while (changed);

		// validate segment length
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			let len = 0;
			for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fN)
				len += fragLen[k];

			if (Math.abs((len - segLen[i])) > 1e-10) {
				console.log(JSON.stringify({id: "ERROR3E", i: i, len: len, seglen: segLen[i]}));
				console.log(JSON.stringify(segLen));
				console.log(JSON.stringify(segI));
				console.log(JSON.stringify(fragLen));
				for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fN)
					console.log(fragLen[k]);
				console.log('*');

			}
		}
	}

	/*
	 * Perform progressive compare
	 */
	this.compare = function () {
		const AX = this.AX;
		const AY = this.AY;
		const BX = this.BX;
		const BY = this.BY;
		const CX = this.CX;
		const CY = this.CY;
		const bN = AX.length;
		const contourX = this.contourX;
		const contourY = this.contourY;
		const fragLen = this.fragLen;
		const fragX = this.fragX;
		const fragY = this.fragY;
		const segDir = this.segDir;
		const segI = this.segI;
		const segLen = this.segLen;
		const maxRatio = this.maxRatio;
		const sN = segLen.length;

		this.numCompare++;

		// validate segment length
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			let len = 0;
			for (let k = segI[i]; k !== segI[iPlus1]; k = (k + 1) % fragLen.length)
				len += fragLen[k];

			if (Math.abs((len - segLen[i])) > 1e-10)
				console.log("ERROR1C: " + i + " " + (len - segLen[i]));
		}


		/*
		 * Core part
		 */


		let changed = false;
		let totalError = 0;
		do {
			changed = false;
			totalError = 0;

			// test if relocating last fragment of segment will lower error
			for (let iCurr = 0; iCurr < sN; iCurr++) {
				const iPrev = (iCurr - 1 + sN) % sN; // previous contour segment
				const iPrevPrev = (iPrev - 1 + sN) % sN; // previous contour segment before previous
				const iNext = (iCurr + 1) % sN; // next contour segment
				const iNextNext = (iNext + 1) % sN; // next contour segment after next

				const jFirstCurr = segI[iCurr]; // first fragment of current segment
				const jSecondCurr = (jFirstCurr + 1) % fragLen.length; // second fragment of current segment
				const jFirstNext = segI[iNext]; // first fragment of next segment
				const jLastCurr = (jFirstNext - 1 + fragLen.length) % fragLen.length; // last fragment of current segment

				// calculate error for LEADING(iCurr) seam
				let dx = (contourX[iCurr] - fragX[jFirstCurr]);
				let dy = (contourY[iCurr] - fragY[jFirstCurr]);
				const errFirstCurr = (dx * dx) + (dy * dy);

				// update return value
				totalError += errFirstCurr;

				// only examine current segment that have fragments to export
				if (jFirstCurr !== jLastCurr) {

					if (segDir[iCurr] !== -1) {
						dx = (contourX[iCurr] - fragX[jSecondCurr]);
						dy = (contourY[iCurr] - fragY[jSecondCurr]);
						const errSecondCurr = (dx * dx) + (dy * dy);

						// test if improvement. The current segment would benefit with an export
						if (errFirstCurr < errSecondCurr) {
							// improvement, export/relocate first fragment to previous segment

							// only export if balancing constraints are met
							// <prevprev> <prev+frag> <curr-frag> <next>

							// previous must comply to its neighbour before
							const newPrevLen = segLen[iPrev] + fragLen[jFirstCurr];
							const newCurrLen = segLen[iCurr] - fragLen[jFirstCurr];

							if (segLen[iPrevPrev] * maxRatio >= newPrevLen &&
								newPrevLen <= newCurrLen * maxRatio &&
								newCurrLen * maxRatio >= segLen[iNext]) {

								// export/relocate fragment
								segLen[iCurr] -= fragLen[jFirstCurr];
								segLen[iPrev] += fragLen[jFirstCurr];
								segI[iCurr] = jSecondCurr;
								segDir[iCurr] = +1;
								// console.log('CHA:' + iCurr);
								// console.log(JSON.stringify({errFirstCurr:errFirstCurr, errSecondCurr:errSecondCurr}))
								changed = true;
							}
						}
					}

					if (segDir[iNext] !== +1) {
						// calculate error for TRAILING(iNext) seam
						let dx = (contourX[iNext] - fragX[jLastCurr]);
						let dy = (contourY[iNext] - fragY[jLastCurr]);
						const errLastCurr = (dx * dx) + (dy * dy);
						dx = (contourX[iNext] - fragX[jFirstNext]);
						dy = (contourY[iNext] - fragY[jFirstNext]);
						const errFirstNext = (dx * dx) + (dy * dy);

						// test if improvement. The next segment would benefit with an export
						if (errLastCurr < errFirstNext) {
							// improvement, export/relocate last fragment to next segment

							// only export if balancing constraints are met
							// <prev> <curr-frag> <next+frag> <nextnext>

							// previous must comply to its neighbour before
							const newCurrLen = segLen[iCurr] - fragLen[jLastCurr];
							const newNextLen = segLen[iNext] + fragLen[jLastCurr];

							if (segLen[iPrev] <= newCurrLen * maxRatio &&
								newCurrLen * maxRatio >= newNextLen &&
								newNextLen <= segLen[iNextNext] * maxRatio) {

								// export/relocate fragment
								segLen[iCurr] -= fragLen[jLastCurr]; // remove fragment length from current
								segLen[iNext] += fragLen[jLastCurr]; // add fragment length to next
								segI[iNext] = jLastCurr;
								segDir[iNext] = -1;
								// console.log('CHB:' + iCurr);
								// console.log(JSON.stringify({errLastCurr:errLastCurr, errFirstNext:errFirstNext}))
								changed = true;
							}
						}
					}
				}
			}
			// console.log('changed:' + totalError + ' ' + x++)
		} while (changed);


		// validate segment length
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			let len = 0;
			for (let k = segI[i]; k !== segI[iPlus1]; k = (k + 1) % fragLen.length)
				len += fragLen[k];

			if (Math.abs((len - segLen[i])) > 1e-10)
				console.log("ERROR1B: " + i + " " + (len - segLen[i]));
		}

		return totalError;
	}

	/*
	 * Timer update
	 */
	this.tick = function () {
		const AX = this.AX;
		const AY = this.AY;
		const BX = this.BX;
		const BY = this.BY;
		const CX = this.CX;
		const CY = this.CY;
		const bN = AX.length;
		const contourX = this.contourX;
		const contourY = this.contourY;
		const ms = Date.now();

		// update current control point
		for (let dx = -1; dx <= +1; dx++) {
			for (let dy = -1; dy <= +1; dy++) {
				if (dx || dy) {
					// tweak curve
					AX[this.pt] += dx * this.radius;
					AY[this.pt] += dy * this.radius;
					this.calcControlsClosed(AX, BX, CX);
					this.calcControlsClosed(AY, BY, CY);
					this.updateControls();

					// determine effect of change
					this.compareBalance();
					let err = this.compare();

					if (err < this.totalError) {
						// effectuate immediately, continue directional scan
						this.totalError = err;
						this.radius = 1;
						this.changed++;
					} else {
						// undo change
						this.AX[this.pt] -= dx * this.radius;
						this.AY[this.pt] -= dy * this.radius;
					}
				}
			}
		}

		// console.log(JSON.stringify({ms: Date.now(), frame: this.frameNr, totalError: this.totalError, pt: this.pt, numCompare: this.numCompare}));


		// if (this.radius <= this.maxRadius) {
		// 	this.radius++;
		// 	return 0; // call again. wait 0ms.
		// }
		// this.radius = 1;

		// bump control point
		this.pt++;
		if (this.pt < bN)
			return 1; // call again
		// wrap
		this.pt = 0;

		if (this.changed) {
			this.changed = 0;
			return 2; // call again, frame complete
		}

		return 0; // nothing changed
	};

}

function setup(userCurve, followCurve, width, height) {

	const initialAX = [0.605, 0.317, 0.933, 0.365, 0.645, 0.573, 0.133, 0.633, 0.069, 0.453];
	const initialAY = [0.955, 0.435, 0.531, 0.647, 0.035, 0.651, 0.167, 0.423, 0.743, 0.307];

	// set initial coordinates
	userCurve.AX.length = 0;
	userCurve.AY.length = 0;
	for (let i = 0; i < initialAX.length; i++) {
		userCurve.AX.push(Math.round(initialAX[i] * width));
		userCurve.AY.push(Math.round(initialAY[i] * height));
	}

	// set initial control points
	userCurve.calcControlsClosed(userCurve.AX, userCurve.BX, userCurve.CX);
	userCurve.calcControlsClosed(userCurve.AY, userCurve.BY, userCurve.CY);

	/*
	 * Create smaller fitting bezier curve
	 */
	followCurve.AX.length = 0;
	followCurve.AY.length = 0;
	for (let j = 0; j < userCurve.AX.length; j++) {
		// skip 4th control
		if (j !== 4) {
			followCurve.AX.push(userCurve.AX[j]);
			followCurve.AY.push(userCurve.AY[j]);
		}
	}
	// determine initial control points
	followCurve.calcControlsClosed(followCurve.AX, followCurve.BX, followCurve.CX);
	followCurve.calcControlsClosed(followCurve.AY, followCurve.BY, followCurve.CY);

	// capture contour user and inject into follow
	let controlLength = userCurve.calcControlLength(); // determine control net length
	userCurve.captureContour(controlLength * followCurve.ratioContour, followCurve.contourX, followCurve.contourY);

	// initial compare contour/curve
	followCurve.compareInit(followCurve.contourX.length * followCurve.ratioCompare, followCurve.contourX, followCurve.contourY);
	followCurve.compareBalance();

	followCurve.totalError = followCurve.compare();
}

/*
 * The following is an automated player for nodejs.
 *
 * Convert the frames to mp4 with:
 *	ffmpeg -r 25 -i compare-%03d.png  -c:v libx264 -preset slow -crf 22 -profile:v baseline -level 3.0 -movflags +faststart -pix_fmt yuv420p -an compare-400x400.mp4
 * Then merge both side by side and convert to webp
 *	ffmpeg -i compare-400x400.mp4 compare-400x400.webp
 */
if (typeof window === "undefined") {
	/*
	 * Request leading zero's
	 */
	Number.prototype.pad = function (size) {
		let s = String(this);
		while (s.length < (size || 2))
			s = "0" + s;
		return s;
	}

	let nodeCanvas = require("canvas");
	let fs = require("fs")

	let width = 400;
	let height = 400;

	// create the canvas
	let canvas = nodeCanvas.createCanvas(width, height)
	canvas.width = width;
	canvas.height = height;
	let ctx = canvas.getContext("2d")

	let userCurve = new Curve();
	let followCurve = new Curve();

	setup(userCurve, followCurve, width, height);

	followCurve.width = width;
	followCurve.height = height;

	for (let tickNr = 0, frameNr = 0; frameNr < 60*6;) {
		let ret = followCurve.tick();
		tickNr++;

		if (ret === 0) {
			// nothing changed
		} else if (ret === 1) {
			// call again
		} else {

			// draw frame
			ctx.fillStyle = "#eee"
			ctx.fillRect(0, 0, width, height);
			followCurve.draw(ctx);
			userCurve.drawCurvePoints(ctx, 10, "#f00");

			// modulo to generate only the last 60 frames
			let buffer = canvas.toBuffer("image/png")
			fs.writeFileSync("compare-" + (frameNr % 60).pad(3) + ".png", buffer)

			// move 2nd curve control for animated effect
			let x = Math.round(width * 0.94);
			let y = Math.round(height * (0.5 - 0.4 * Math.sin(frameNr * Math.PI * 2 / 60)));

			console.log(JSON.stringify({iTick: tickNr, iFrame: frameNr, x: x, y: y}))

			userCurve.AX[2] = x;
			userCurve.AY[2] = y;

			// prepare curve
			userCurve.calcControlsClosed(userCurve.AX, userCurve.BX, userCurve.CX);
			userCurve.calcControlsClosed(userCurve.AY, userCurve.BY, userCurve.CY);
			let controlLength = userCurve.calcControlLength();
			userCurve.captureContour(controlLength * followCurve.ratioContour, followCurve.contourX, followCurve.contourY);

			// initial compare contour/curve
			followCurve.compareInit(followCurve.contourX.length * followCurve.ratioCompare, followCurve.contourX, followCurve.contourY);
			followCurve.compareBalance();
			followCurve.totalError = followCurve.compare();

			// next frame
			frameNr++;
		}

	}
}