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
	/*
	 * @date 2020-09-30 02:31:27
	 * NOTE: AX and friends somehow share references, do not assign directly but overwrite their contents.
	 */

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
	this.segErr = [];	// Error contribution segment
	this.numCompare = 0;	// # times `compare()` is called
	this.numRelocate = 0;	// # times `compare()` relocated a fragment
	this.bestError = 0;	// total length of all curve/contour mapping lines
	this.grandError = 0;
	this.grandAX = [];
	this.grandAY = [];
	this.changed = 0;	// some curve points changed
	this.pt = 0;		// current control point being updated
	// settings
	this.rescale = 1.1;	// amount to nudge controls to escape local minimum
	this.maxRatio = 1.2;	// adjacent segments may not exceed this distance difference
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
	 * Draw contour coordinate vector
	 */
	this.drawContourCongestion = function (ctx, contourX, contourY) {
		ctx.beginPath();
		ctx.strokeStyle = "#888";
		ctx.fillStyle =  "#888";
		for (let i = 0; i < contourX.length; i++)
			if (this.segDir[i] !== -2 && this.segDir[i] !== +2)
				ctx.fillRect(contourX[i] - 1, contourY[i] - 1, 2, 2);
		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = "#ff0";
		ctx.fillStyle =  "#ff0";
		for (let i = 0; i < contourX.length; i++)
			if (this.segDir[i] === -2)
				ctx.fillRect(contourX[i] - 1, contourY[i] - 1, 3, 3);
		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = "#f0f";
		ctx.fillStyle =  "#f0f";
		for (let i = 0; i < contourX.length; i++)
			if (this.segDir[i] === +2)
				ctx.fillRect(contourX[i] - 1, contourY[i] - 1, 3, 3);
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
		if (false) {
			// special version to illustrate where congestion is located.
			// contour is colour coded top level
			// draw initial state
			this.drawCompare(ctx);
			this.drawCurvePoints(ctx, 2, "#00f");
			this.drawCurve(ctx, "#00f");
			this.drawContourCongestion(ctx, this.contourX, this.contourY);
		} else {
			// draw initial state
			this.drawCompare(ctx);
			this.drawContour(ctx, this.contourX, this.contourY, "#f00");
			this.drawCurvePoints(ctx, 2, "#00f");
			this.drawCurve(ctx, "#00f");
		}
	}

	/*
	 * Create coefficients and determine B/C for a Closed Continuous Bezier Curve
	 */
	this.calcControlsClosed = function (A, B, C) {
		const N = A.length;

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
		} else if (N === 8) {
			for (let j = 0; j < 8; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j + 7) % N]) * 15 - (A[(j + 2) % N] - A[(j + 6) % N]) * 4 + (A[(j + 3) % N] - A[(j + 5) % N])) / 56;
		} else if (N === 7) {
			for (let j = 0; j < 7; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j + 6) % N]) * 11 - (A[(j + 2) % N] - A[(j + 5) % N]) * 3 + (A[(j + 3) % N] - A[(j + 4) % N])) / 41;
		} else if (N === 6) {
			for (let j = 0; j < 6; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j + 5) % N]) * 4 - (A[(j + 2) % N] - A[(j + 4) % N])) / 15;
		} else if (N === 5) {
			for (let j = 0; j < 5; j++)
				B[j] = A[j] + ((A[(j + 1) % N] - A[(j + 4) % N]) * 3 - (A[(j + 2) % N] - A[(j + 3) % N])) / 11;
		} else if (N === 4) {
			for (let j = 0; j < 4; j++)
				B[j] = A[j] + (A[(j + 1) % N] - A[(j + 3) % N]) / 4;
		} else if (N === 3) {
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

		const contourX = this.contourX;
		const contourY = this.contourY;
		const fragLen = this.fragLen;
		const fragX = this.fragX;
		const fragY = this.fragY;
		const segI = this.segI;
		const segLen = this.segLen;
		const segErr = this.segErr;
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

		// update segments
		for (let iSeg = 0; iSeg < sN; iSeg++) {
			const iPlus1 = (iSeg + 1) % sN;
			const iFrag = segI[iSeg];

			let len = 0;
			for (let k = iFrag; k !== segI[iPlus1]; k = (k + 1) % fN)
				len += fragLen[k];
			segLen[iSeg] = len;

			// calculate error
			let dx = (contourX[iSeg] - fragX[iFrag]);
			let dy = (contourY[iSeg] - fragY[iFrag]);
			segErr[iSeg] = (dx * dx) + (dy * dy);
		}
	}

	/*
	 * Call this to setup progressive compare
	 */
	this.compareInit = function (numFragments, contourX, contourY) {
		const bN = this.AX.length; // number of bezier sections
		const sN = contourX.length; // number of contour segments
		const segI = this.segI;
		const segDir = this.segDir;

		// determine `dt`
		this.dt = 1 / numFragments; // `dt` for complete composite curve
		this.dt *= bN; // `dt` for a composite section

		// go through loop in case there might be rounding errors to excessive additions
		numFragments = 0;
		for (let i = 0, k = 0; i < bN; i++)
			for (let t = 0; t < 1; t += this.dt, k++)
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
		this.segErr.length = sN;

		// initial mapping
		for (let i = 0; i < sN; i++) {
			segI[i] = Math.trunc(i * numFragments / sN);
			segDir[i] = 0;
		}

		// populate the above arrays
		this.updateControls();

		this.bestError = this.compare();
		this.grandError = this.bestError;
		this.pt = 0;
	}

	/*
	 * Perform progressive compare
	 */
	this.compare = function () {
		const contourX = this.contourX;
		const contourY = this.contourY;
		const fragLen = this.fragLen;
		const fragX = this.fragX;
		const fragY = this.fragY;
		const segDir = this.segDir;
		const segI = this.segI;
		const segLen = this.segLen;
		const segErr = this.segErr;
		const maxRatio = this.maxRatio;
		const sN = segLen.length;
		const fN = fragLen.length;

		this.numCompare++;

		if (0) {
			// validate segment length
			for (let i = 0; i < sN; i++) {
				const iPlus1 = (i + 1) % sN;

				let len = 0;
				for (let k = segI[i]; k !== segI[iPlus1]; k = (k + 1) % fragLen.length)
					len += fragLen[k];

				if (Math.abs((len - segLen[i])) > 1e-10)
					console.log("ERROR2: " + i + " " + (len - segLen[i]));
			}
		}


		/*
		 * Core part:
		 *
		 * Connecting the curve with the contour.
		 * Things may stretch but not so far that it rips.
		 * `maxRatio` determines that maximum/minimum distance.
		 * The curve is chopped into segments, the contour into fragments.
		 * Segments are synced with fragments, there is a ration of 1:N (currently 1:8)
		 * The higher N, the easier a fragments can be relocated to a neighbour segment.
		 *
		 * As long as the contour does not change, the direction of the fragment flow is constant.
		 *
		 * The metrics used in comparing is:
		 * total distance = sum all distances between each segment and its synced fragment.
		 * distance being sqrt(x*x+y*y)
		 * Code can easily be extended for a third (or more) dimension `Z`.
		 *
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

				const jFirstCurr = segI[iCurr]; // first fragment of current segment
				const jSecondCurr = (jFirstCurr + 1) % fN; // second fragment of current segment
				const jFirstNext = segI[iNext]; // first fragment of next segment
				const jLastCurr = (jFirstNext - 1 + fN) % fN; // last fragment of current segment

				// Relationship between segments (left) and fragments (right)
				// There are always more segments than fragments
				//
				//  iPrevPrev ->   ...
				//                 ...
				//  iPrev     ->   jFirstPrev
				//                 ...
				//                 jLastPrev
				//  iCurr     ->   jFirstCurr
				//                 jSecondCurr
				//                 ...
				//                 jLastCurr
				//  iNext     ->   jFirstNext
				//                 ...
				//
				// sDir[] indicated the flow direction.
				// 	Positive values mean the segment will grow by relocating a fragment from a previous segment to the current
				//	Negative values mean the segment sill shrink by relocating a fragment from the current segment to the next
				//	+/- 1 indicates an advisory flow
				//	+/- 2 indicated a mandatory relocation (as long as balancing constraints apply)

				/*
				 * @date 2020-09-30 00:40:15
				 * Previously, jumping directly to 100 controls would require some 145k `numCompare` and 10.2k `numRelocate`
				 * Now it requires some 132k `numCompare` and 9.4k `numRelocate`
				 * Te anticipated `de-stresser` reduces `numRelocate` to some 6k
				 */

				// only examine current segment if it has fragments to export
				if (jFirstCurr !== jLastCurr) {

					// Handle shrinking by exporting a fragment to the previous segment
					if (segDir[iCurr] <= 0) {
						dx = (contourX[iCurr] - fragX[jSecondCurr]);
						dy = (contourY[iCurr] - fragY[jSecondCurr]);
						const errSecondCurr = (dx * dx) + (dy * dy);

						// test if improvement. The current segment would benefit with an export
						if (segErr[iCurr] < errSecondCurr || segDir[iCurr] === -2) {
							// improvement, export/relocate first fragment to previous segment

							// only export if balancing constraints are met
							// <prevprev> <prev+frag> <curr-frag> <next>

							// previous must comply to its neighbour before
							const newPrevLen = segLen[iPrev] + fragLen[jFirstCurr];
							const newCurrLen = segLen[iCurr] - fragLen[jFirstCurr];

							// NOTE: there are actually 6 compares to test validity.
							//       half are not Needed because iPrev grows and iCurr shrinks

							if (segLen[iPrevPrev] * maxRatio < newPrevLen) {
								// iPrev would become too large for iPrevPrev, request iPrev to relocate to become smaller
								if (segDir[iPrev] <= 0)
									segDir[iPrev] = -2;
							} else if (newCurrLen * maxRatio < segLen[iNext]) {
								// iCurr would become too small for iNext, request iNext to relocate to become smaller
								if (segDir[iNext] <= 0)
									segDir[iNext] = -2;
							} else if (newPrevLen <= newCurrLen * maxRatio) {
								// export/relocate fragment
								segLen[iCurr] -= fragLen[jFirstCurr]; // segment shrinks (sDir[] < 0)
								segLen[iPrev] += fragLen[jFirstCurr];
								segI[iCurr] = jSecondCurr;
								segDir[iCurr] = -1;
								segErr[iCurr] = errSecondCurr;
								changed = true;
								this.numRelocate++;
							}
						}
					}
				}
			}

			for (let iCurr = sN-1; iCurr >= 0; iCurr--) {
				const iPrev = (iCurr - 1 + sN) % sN; // previous contour segment
				const iPrevPrev = (iPrev - 1 + sN) % sN; // previous contour segment before previous
				const iNext = (iCurr + 1) % sN; // next contour segment

				const jFirstPrev = segI[iPrev]; // first fragment of previous segment
				const jFirstCurr = segI[iCurr]; // first fragment of current segment
				const jLastPrev = (jFirstCurr - 1 + fN) % fN; // last fragment of previous segment

				// only examine previous segment if it has fragments to export
				if (jFirstPrev !== jLastPrev) {

					// Handle growing by importing a fragment from the previous segment
					if (segDir[iCurr] >= 0) {
						// calculate error for TRAILING(iNext) seam
						let dx = (contourX[iCurr] - fragX[jLastPrev]);
						let dy = (contourY[iCurr] - fragY[jLastPrev]);
						const errLastPrev = (dx * dx) + (dy * dy);

						// test if improvement. The next segment would benefit with an export
						if (errLastPrev < segErr[iCurr] || segDir[iCurr] === +2) {
							// improvement, export/relocate last fragment to next segment

							// only export if balancing constraints are met
							// <prevprev> <prev-frag> <curr+frag> <next>

							// previous must comply to its neighbour before
							const newPrevLen = segLen[iPrev] - fragLen[jLastPrev];
							const newCurrLen = segLen[iCurr] + fragLen[jLastPrev];

							if (segLen[iPrevPrev] > newPrevLen * maxRatio) {
								// iPrev would become too small for iPrevPrev, request iPrev to relocate to become larger
								if (segDir[iPrev] >= 0)
									segDir[iPrev] = +2;
							} else if (newCurrLen > segLen[iNext] * maxRatio) {
								// iCurr would become too large for iNext, request iNext to relocate to become larger
								if (segDir[iNext] >= 0)
									segDir[iNext] = +2;
							} else if (newPrevLen * maxRatio >= newCurrLen) {
								// export/relocate fragment
								segLen[iPrev] -= fragLen[jLastPrev]; // segment grows (sDir[] > 0)
								segLen[iCurr] += fragLen[jLastPrev];
								segI[iCurr] = jLastPrev;
								segDir[iCurr] = +1;
								segErr[iCurr] = errLastPrev;
								changed = true;
								this.numRelocate++;
							}
						}
					}
				}

				// contribute selected error to result
				totalError += segErr[iCurr];
			}
		} while (changed);

		return totalError;
	}

	/*
	 * Add control-points to a given level
	 * visualPrecise, true=visual, false=precise
	 */
	this.increaseControls = function (newCount, visualPrecise) {
		// walk sections
		// for each section, remember halfway x+y
		// return length
		// overall longest is best choice
		const AX = this.AX;
		const AY = this.AY;

		while (AX.length < newCount) {
			const dt = this.dt;
			const bN = AX.length;

			let bestLen = 0, bestI = 0, bestX = 0, bestY = 0;
			let t, x, y;

			// find best section and it's halfway point
			for (let iSct = 0, k = 0; iSct < bN; iSct++) {
				let sctLen = 0;
				// first half
				for (t = 0, x = AX[iSct], y = AY[iSct]; t < 0.5; t += dt, k++) {

					// Determine step increments
					const dx = this.FCOEF2X[iSct] * t * t + this.FCOEF1X[iSct] * t + this.FCOEF0X[iSct];
					const dy = this.FCOEF2Y[iSct] * t * t + this.FCOEF1Y[iSct] * t + this.FCOEF0Y[iSct];

					// add length
					sctLen += Math.sqrt(dx * dx + dy * dy);

					x += dx;
					y += dy;
				}

				// remember halfway
				let sctHalfX = Math.round(x);
				let sctHalfY = Math.round(y);

				// second half
				for (t = 0.5, x = AX[iSct], y = AY[iSct]; t < 1; t += dt, k++) {

					// Determine step increments
					const dx = this.FCOEF2X[iSct] * t * t + this.FCOEF1X[iSct] * t + this.FCOEF0X[iSct];
					const dy = this.FCOEF2Y[iSct] * t * t + this.FCOEF1Y[iSct] * t + this.FCOEF0Y[iSct];

					// add length
					sctLen += Math.sqrt(dx * dx + dy * dy);

					x += dx;
					y += dy;
				}

				/*
				 * best choice is longest
				 * visualPrecise==true = visual -> best = shortest segment (adding maximum stress)
				 * visualPrecise==false = precise -> best = longest segment (adding minimum stress)
				 */

				if (iSct === 0 || (visualPrecise && sctLen < bestLen) || (!visualPrecise && sctLen > bestLen)) {
					bestLen = sctLen;
					bestI = iSct;
					bestX = sctHalfX;
					bestY = sctHalfY;
				}
			}

			// insert best after bestI
			AX.splice((bestI + 1) % bN, 0, bestX);
			AY.splice((bestI + 1) % bN, 0, bestY);

			// set initial control points
			this.calcControlsClosed(this.AX, this.BX, this.CX);
			this.calcControlsClosed(this.AY, this.BY, this.CY);

			// initial compare contour/curve.
			// NOTE: Need to call to update FCOEF
			this.compareInit(this.contourX.length * this.ratioCompare, this.contourX, this.contourY);
		}
	}

	/*
	 * Remove control-points to a given level
	 * visualPrecise, true=visual, false=precise
	 */
	this.decreaseControls = function (newCount, visualPrecise) {
		// walk sections
		// for each section, remember halfway x+y
		// return length
		// overall longest is best choice
		const AX = this.AX;
		const AY = this.AY;

		while (AX.length > newCount) {
			const dt = this.dt;
			const bN = AX.length;

			let bestLen = 0, bestI = 0;
			let t, x, y;

			// find best double section (this can be optimised)
			for (let iSct = 0, k = 0; iSct < bN; iSct++) {
				let sctLen = 0;
				// first section
				for (t = 0, x = AX[iSct], y = AY[iSct]; t < 1; t += dt, k++) {

					// Determine step increments
					const dx = this.FCOEF2X[iSct] * t * t + this.FCOEF1X[iSct] * t + this.FCOEF0X[iSct];
					const dy = this.FCOEF2Y[iSct] * t * t + this.FCOEF1Y[iSct] * t + this.FCOEF0Y[iSct];

					// add length
					sctLen += Math.sqrt(dx * dx + dy * dy);

					x += dx;
					y += dy;
				}

				// second second
				let iPlus1 = (iSct + 1) % bN;
				for (t = 0, x = AX[iPlus1], y = AY[iPlus1]; t < 1; t += dt, k++) {

					// Determine step increments
					const dx = this.FCOEF2X[iPlus1] * t * t + this.FCOEF1X[iPlus1] * t + this.FCOEF0X[iPlus1];
					const dy = this.FCOEF2Y[iPlus1] * t * t + this.FCOEF1Y[iPlus1] * t + this.FCOEF0Y[iPlus1];

					// add length
					sctLen += Math.sqrt(dx * dx + dy * dy);

					x += dx;
					y += dy;
				}

				/*
				 * best choice is longest
				 * visualPrecise==true = visual -> best = shortest segment (adding maximum stress)
				 * visualPrecise==false = precise -> best = longest segment (adding minimum stress)
				 */

				if (iSct === 0 || (!visualPrecise && sctLen < bestLen) || (!!visualPrecise && sctLen > bestLen)) {
					bestLen = sctLen;
					bestI = iPlus1;
				}
			}

			// insert best after bestI
			AX.splice(bestI, 1);
			AY.splice(bestI, 1);

			// set initial control points
			this.calcControlsClosed(this.AX, this.BX, this.CX);
			this.calcControlsClosed(this.AY, this.BY, this.CY);

			// initial compare contour/curve.
			// NOTE: Need to call to update FCOEF
			this.compareInit(this.contourX.length * this.ratioCompare, this.contourX, this.contourY);
		}

		/*
		 * Test that `this.pt` is within bounds of 0<=pt<bN
		 */
		if (this.pt >= this.AX.length)
			this.pt = this.AX.length - 1;
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

		/*
		 * Core part:
		 *
		 * Move each on-curve control point slightly in all directions to find a better contour fit.
		 */

		// update current control point
		for (let dx = -1; dx <= +1; dx++) {
			for (let dy = -1; dy <= +1; dy++) {
				if (dx || dy) {
					// tweak curve
					AX[this.pt] += dx;
					AY[this.pt] += dy;
					this.calcControlsClosed(AX, BX, CX);
					this.calcControlsClosed(AY, BY, CY);
					this.updateControls();

					// determine effect of change
					let err = this.compare();

					if (err < this.bestError) {
						// effectuate immediately, continue directional scan
						this.bestError = err;
						this.changed++;
					} else {
						// undo change
						AX[this.pt] -= dx;
						AY[this.pt] -= dy;
					}
				}
			}
		}
		this.calcControlsClosed(AX, BX, CX);
		this.calcControlsClosed(AY, BY, CY);
		this.updateControls();

		// bump control point
		this.pt++;
		if (this.pt < bN)
			return 1; // call again
		// wrap
		this.pt = 0;

		/*
		 * Core part:
		 *
		 * Give all on-curve control points a slight nudge to escape a possible local minimum.
		 * Do in such a way that is least disruptive:
		 * Pull all control points slightly to the center
		 */

		/*
		 * If an improvement was found, keep moving and make another round.
		 * NOTE: all state settings must have been reset, ready for the next round (being: `pt=0`)/
		 */
		if (this.changed) {
			this.changed = 0;
			return 2; // call again, frame complete
		}

		if (this.bestError < this.grandError) {
			this.grandError = this.bestError;
			this.grandAX = this.AX.slice();
			this.grandAY = this.AY.slice();

			// find the center
			let avgX = 0;
			let avgY = 0;
			for (let i = 0; i < bN; i++) {
				avgX += AX[i];
				avgY += AY[i];
			}
			avgX /= bN;
			avgY /= bN;

			// nudge controls
			for (let i = 0; i < bN; i++) {
				AX[i] = Math.trunc((AX[i] - avgX) * this.rescale + avgX);
				AY[i] = Math.trunc((AY[i] - avgY) * this.rescale + avgY);
			}
			this.calcControlsClosed(AX, BX, CX);
			this.calcControlsClosed(AY, BY, CY);
			this.updateControls();

			// clear compare flow direction
			for (let i = 0; i < this.segDir.length; i++)
				this.segDir[i] = 0;

			this.bestError = this.compare();

			return 3;
		}

		// rewind to last grandError.
		// NOTE: this code was intended to jump out of a local minimum, puzzeled that it can make the situation much more worse.
		for (let i=0; i<bN; i++) {
			AX[i] = this.grandAX[i];
			AY[i] = this.grandAY[i];
		}
		this.calcControlsClosed(AX, BX, CX);
		this.calcControlsClosed(AY, BY, CY);
		this.updateControls();
		this.bestError = this.grandError;
		/*
		 * Higher level scenarios here
		 * For example: deletion (or addition) of on-curve control points;
		 */

		return 0; // nothing changed
	};
}

function setup(curve, width, height) {

	const initialAX = [0.605, 0.317, 0.933, 0.365, 0.645, 0.573, 0.133, 0.633, 0.069, 0.453];
	const initialAY = [0.955, 0.435, 0.531, 0.647, 0.035, 0.651, 0.167, 0.423, 0.743, 0.307];

	// set initial coordinates
	curve.AX.length = 0;
	curve.AY.length = 0;
	for (let i = 0; i < initialAX.length; i++) {
		curve.AX.push(Math.round(initialAX[i] * width));
		curve.AY.push(Math.round(initialAY[i] * height));
	}

	// set initial control points
	curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
	curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);

	// capture contour user and inject into follow
	let controlLength = curve.calcControlLength(); // determine control net length
	curve.captureContour(controlLength * curve.ratioContour, curve.contourX, curve.contourY);

	// initial compare contour/curve
	curve.compareInit(curve.contourX.length * curve.ratioCompare, curve.contourX, curve.contourY);

}

/*
 * The following is a `replayLog` player for nodejs.
 *
 * Convert the frames to mp4 with:
 *	ffmpeg -r 25 -i resize-%03d.png  -c:v libx264 -preset slow -crf 22 -profile:v baseline -level 3.0 -movflags +faststart -pix_fmt yuv420p -an resize[VP]-400x400.mp4
 * Then merge both side by side and convert to webp
 *	ffmpeg -i resizeV-400x400.mp4 -i resizeP-400x400.mp4 -filter_complex hstack resize-400x400.webp
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

	// read json file
	// NOTE: leading "./" and trailing ".json" is required
	let replayLog = require("./resize[VP]-400x400.json");

	let width = replayLog.width;
	let height = replayLog.height;

	// create the canvas
	let canvas = nodeCanvas.createCanvas(width, height)
	canvas.width = width;
	canvas.height = height;
	let ctx = canvas.getContext("2d")

	let curve = new Curve();

	// replay
	let frameNr = 0;
	for (let iTrail = 0; iTrail < replayLog.trails.length; iTrail++) {
		const trail = replayLog.trails[iTrail];

		// create contour curve
		curve.AX = trail.contourAX.slice();
		curve.AY = trail.contourAY.slice();
		// prepare curve
		curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
		curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);
		// capture contour
		let controlLength = curve.calcControlLength(); // determine control net length
		curve.captureContour(controlLength * curve.ratioContour, curve.contourX, curve.contourY);

		// create curve
		curve.AX = trail.AX.slice();
		curve.AY = trail.AY.slice();
		// prepare curve
		curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
		curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);
		// prepare compare
		curve.compareInit(curve.contourX.length * curve.ratioCompare, curve.contourX, curve.contourY);

		// clear frame
		ctx.fillStyle = "#eee"
		ctx.fillRect(0, 0, width, height);
		// draw frame
		curve.draw(ctx);

		ctx.beginPath();
		ctx.strokeStyle = "#000";
		ctx.fillStyle = "#000";
		ctx.font = "1em fixed";
		ctx.fillText("numControls=" + curve.AX.length, 10, height - 10);

		let buffer = canvas.toBuffer("image/png")
		fs.writeFileSync("resize-" + frameNr.pad(3) + ".png", buffer)
		fs.writeFileSync("resize.png", buffer)
		frameNr++;

		/*
		 * Apply the ticks
		 */
		const frames = trail.frames;
		let iTick = 0;
		for (let iStep = 0; iStep < frames.length; iStep++) {
			console.log(JSON.stringify({iTrail: iTrail, iTick: iTick, iFrame: frameNr}));
			let ret;
			while (iTick < frames[iStep]) {
				ret = curve.tick();
				iTick++;
			}

			// clear frame
			ctx.fillStyle = "#eee"
			ctx.fillRect(0, 0, width, height);

			// draw frame
			curve.draw(ctx);

			ctx.beginPath();
			ctx.strokeStyle = "#000";
			ctx.fillStyle = "#000";
			ctx.font = "1em fixed";
			ctx.fillText("numControls=" + curve.AX.length, 10, height - 10);

			let buffer = canvas.toBuffer("image/png");
			fs.writeFileSync("resize-" + frameNr.pad(3) + ".png", buffer);
			fs.writeFileSync("resize.png", buffer);
			frameNr++;
		}
	}
}