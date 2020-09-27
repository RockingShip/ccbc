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

"use strict";

/*
 * Every about bezier curves
 */

/*
 * Request leading zero's
 */
Number.prototype.pad = function (size) {
	let s = String(this);
	while (s.length < (size || 2))
		s = "0" + s;
	return s;
}

function Bezier() {

	this.AX = [296, 224, 378, 236, 306, 288, 178, 303, 162, 258];
	this.AY = [325, 195, 219, 248, 95, 249, 128, 192, 272, 163];
	this.BX = [];
	this.BY = [];
	this.CX = [];
	this.CY = [];
	this.rgb = [];

	/*
	 * Create a rgb gradient palette
	 */
	for (let i = 0; i < 256; i++) {
		let r = Math.round(128.0 + 127 * Math.sin(Math.PI * i / 32.0));
		let g = Math.round(128.0 + 127 * Math.sin(Math.PI * i / 64.0));
		let b = Math.round(128.0 + 127 * Math.sin(Math.PI * i / 128.0));

		this.rgb[i] = "#"+
			"0123456789abcdef"[r>>4]+
			"0123456789abcdef"[r%16]+
			"0123456789abcdef"[g>>4]+
			"0123456789abcdef"[g%16]+
			"0123456789abcdef"[b>>4]+
			"0123456789abcdef"[b%16];
	}

	this.coefs = [
		[0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.3333333333,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2500000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2727272727, -0.0909090909, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2666666667, -0.0666666667, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2682926829, -0.0731707317, 0.0243902439,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2678571429, -0.0714285714, 0.0178571429,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2679738562, -0.0718954248, 0.0196078431, -0.0065359477, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2679425837, -0.0717703349, 0.0191387560, -0.0047846890, 0.0000000000,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2679509632, -0.0718038529, 0.0192644483, -0.0052539405, 0.0017513135,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2679487179, -0.0717948718, 0.0192307692, -0.0051282051, 0.0012820513,  0.0000000000, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2679493196, -0.0717972783, 0.0192397935, -0.0051618958, 0.0014077898, -0.0004692633, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2679491584, -0.0717966335, 0.0192373755, -0.0051528684, 0.0013740982, -0.0003435246, 0.0000000000,  0.0000000000, 0.0000000000],
		[0.2679492016, -0.0717968062, 0.0192380234, -0.0051552873, 0.0013831259, -0.0003772161, 0.0001257387,  0.0000000000, 0.0000000000],
		[0.2679491897, -0.0717967599, 0.0192378498, -0.0051546392, 0.0013807069, -0.0003681885, 0.0000920471,  0.0000000000, 0.0000000000],
		[0.2679491927, -0.0717967722, 0.0192378963, -0.0051548128, 0.0013813551, -0.0003706075, 0.0001010748, -0.0000336916, 0.0000000000],
		[0.2679491946, -0.0717967697, 0.0192378840, -0.0051547664, 0.0013811814, -0.0003699593, 0.0000986558, -0.0000246640, 0.0000000000],
		[0.2679491852, -0.0717967680, 0.0192378867, -0.0051547786, 0.0013812279, -0.0003701330, 0.0000993040, -0.0000270829, 0.0000090276],
		[0.2679491851, -0.0717967677, 0.0192378858, -0.0051547753, 0.0013812154, -0.0003700864, 0.0000991303, -0.0000264347, 0.0000066087]
	];

	this.calcControlsClosed = function(A, B, C)
	{
		let N = A.length, coef;

		// get appropiate coefficients
		if (N <= 20)
			coef = this.coefs[N];
		else if (N&1)
			coef = this.coefs[19];
		else
			coef = this.coefs[20];

		B.length = N;
		for (let i=0; i<N; i++)
			B[i] = A[i];
		for (let i=0; i<N; i++) {
			B[i] += A[(i+1)%N] * coef[0];
			B[i] += A[(i+2)%N] * coef[1];
			B[i] += A[(i+3)%N] * coef[2];
			B[i] += A[(i+4)%N] * coef[3];
			B[i] += A[(i+5)%N] * coef[4];
			B[i] += A[(i+6)%N] * coef[5];
			B[i] += A[(i+7)%N] * coef[6];
			B[i] += A[(i+8)%N] * coef[7];
			B[i] += A[(i+9)%N] * coef[8];
			B[(i+1)%N] -= A[i] * coef[0];
			B[(i+2)%N] -= A[i] * coef[1];
			B[(i+3)%N] -= A[i] * coef[2];
			B[(i+4)%N] -= A[i] * coef[3];
			B[(i+5)%N] -= A[i] * coef[4];
			B[(i+6)%N] -= A[i] * coef[5];
			B[(i+7)%N] -= A[i] * coef[6];
			B[(i+8)%N] -= A[i] * coef[7];
			B[(i+9)%N] -= A[i] * coef[8];
		}
		C.length = N;
		for (var i=0; i<N; i++)
			C[i] = 2*A[(i+1)%N] - B[(i+1)%N];
	}

	/*
	 * Create coefficients and determine B/C for a Closed Continuous Bezier Curve
	 */
	this.calcControlsClosed2 = function (A, B, C) {
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
	}

	/*
	 * Create coefficients and determine B/C for an Open Continuous Bezier Curve
	 */
	this.calcControlsOpen = function(A, B, C) {
		let N = A.length;
		let round = Math.round;

		B.length = N;
		C.length = N;

		if (N >= 9 && (N & 1)) {

			// odd N

			B[0] = (A[0] * 70226 + A[1] * 65184 - A[2] * 17466 + A[3] * 4680 - A[4] * 1254 + A[5] * 336 - A[6] * 90 + A[7] * 24 - A[8] * 6 + A[9] * 1) / 121635;
			B[1] = (A[0] * -18817 + A[1] * 112902 + A[2] * 34932 - A[3] * 9360 + A[4] * 2508 - A[5] * 672 + A[6] * 180 - A[7] * 48 + A[8] * 12 - A[9] * 2) / 121635;
			B[2] = (A[0] * 5042 - A[1] * 30252 + A[2] * 121008 + A[3] * 32760 - A[4] * 8778 + A[5] * 2352 - A[6] * 630 + A[7] * 168 - A[8] * 42 + A[9] * 7) / 121635;
			B[3] = (A[0] * -1351 + A[1] * 8106 - A[2] * 32424 + A[3] * 121590 + A[4] * 32604 - A[5] * 8736 + A[6] * 2340 - A[7] * 624 + A[8] * 156 - A[9] * 26) / 121635;

			for (let j = 4; j < N - 4; j++) {
				// There is no equation with 1.000 as coeffecient. This is because A[j-5] is missing causing the effect of reflection to kick in.
				// The first appearance of 1.00 is when N=23. Trying to reconstruct without reflection, based on how n>=8 constructed
				// B[j] = (A[j-4]*362 -A[j-3]*2172 +A[j-2]*8688 -A[j-1]*32580 +A[j]*121632 +A[j+1]*32592 -A[j+2]*8730 +A[j+3]*2328 -A[j+4]*582 +A[j+5]*97)/121635;
				// divide by 97
				// B[j] = (A[j-4]*3.732 -A[j-3]*22.392 +A[j-2]*89.567 -A[j-1]*335.876 +A[j]*1253.938 +A[j+1]*336 -A[j+2]*90 +A[j+3]*24 -A[j+4]*6 +A[j+5]*1)/1253.9;
				// filter out reflection by correcting expression using known numbers and adding missing term
				// B[j] = (A[j-5]*-1 +A[j-4]*6 -A[j-3]*24 +A[j-2]*90 -A[j-1]*336 +A[j]*1254 +A[j+1]*336 -A[j+2]*90 +A[j+3]*24 -A[j+4]*6 +A[j+5]*1)/1254;
				// reorder
				// B[j] = A[j] +((A[j+1]-A[j-1])*336 +(A[j-2]-A[j+2])*90 +(A[j+3]-A[j-3])*24 +(A[j-4]-A[j+4])*6 +(A[j+5]-A[j-5]))/1254;

				// This is equivilent to calculateClosed() with N=10, coeffecients times 6 (below) with an extra term
				// It might seem obvious to use N=9, but for that expression the coefecients would have a different slope (246 66, 18, 6)
				// B[j] = A[j] +((A[j+1]-A[j-1])*336 -(A[j+2]-A[j-2])*90 +(A[j+3]-A[j-3])*24 -(A[j+4]-A[j-4])*6)/1254;

				// But, this is two A[]'s more than for even N. Make both consistent by biasing towards N=8
				B[j] = A[j] + ((A[j + 1] - A[j - 1]) * 90 + (A[j - 2] - A[j + 2]) * 24 + (A[j + 3] - A[j - 3]) * 6 + (A[j - 4] - A[j + 4])) / 336;
			}

			B[N - 4] = (A[N - 9] * -97 + A[N - 8] * 582 - A[N - 7] * 2328 + A[N - 6] * 8730 - A[N - 5] * 32592 + A[N - 4] * 121638 + A[N - 3] * 32580 - A[N - 2] * 8688 + A[N - 1] * 2172 - A[N] * 362) / 121635;
			B[N - 3] = (A[N - 9] * 26 - A[N - 8] * 156 + A[N - 7] * 624 - A[N - 6] * 2340 + A[N - 5] * 8736 - A[N - 4] * 32604 + A[N - 3] * 121680 + A[N - 2] * 32424 - A[N - 1] * 8106 + A[N] * 1351) / 121635;
			B[N - 2] = (A[N - 9] * -7 + A[N - 8] * 42 - A[N - 7] * 168 + A[N - 6] * 630 - A[N - 5] * 2352 + A[N - 4] * 8778 - A[N - 3] * 32760 + A[N - 2] * 122262 + A[N - 1] * 30252 - A[N] * 5042) / 121635;
			B[N - 1] = (A[N - 9] * 2 - A[N - 8] * 12 + A[N - 7] * 48 - A[N - 6] * 180 + A[N - 5] * 672 - A[N - 4] * 2508 + A[N - 3] * 9360 - A[N - 2] * 34932 + A[N - 1] * 130368 + A[N] * 18817) / 121635;

		} else if (N >= 8) {

			// even N

			B[0] = (A[0] * 18817 + A[1] * 17466 - A[2] * 4680 + A[3] * 1254 - A[4] * 336 + A[5] * 90 - A[6] * 24 + A[7] * 6 - A[8] * 1) / 32592;
			B[1] = (A[0] * -5042 + A[1] * 30252 + A[2] * 9360 - A[3] * 2508 + A[4] * 672 - A[5] * 180 + A[6] * 48 - A[7] * 12 + A[8] * 2) / 32592;
			B[2] = (A[0] * 1351 - A[1] * 8106 + A[2] * 32424 + A[3] * 8778 - A[4] * 2352 + A[5] * 630 - A[6] * 168 + A[7] * 42 - A[8] * 7) / 32592;
			B[3] = (A[0] * -362 + A[1] * 2172 - A[2] * 8688 + A[3] * 32580 + A[4] * 8736 - A[5] * 2340 + A[6] * 624 - A[7] * 156 + A[8] * 26) / 32592;

			for (let j = 4; j < N - 3; j++) {
				// B[j] =  (A[j-4]*97 -A[j-3]*582 +A[j-2]*2328 -A[j-1]*8730 +A[j]*32592 +A[j+1]*8730 -A[j+2]*2328 +A[j+3]*582 -A[j+4]*97)/32592;
				// divide by 97
				// B[j] =  (A[j-4]*1 -A[j-3]*6 +A[j-2]*24 -A[j-1]*90 +A[j]*336 +A[j+1]*90 -A[j+2]*24 +A[j+3]*6 -A[j+4]*1)/336;
				// re-order
				B[j] = A[j] + ((A[j + 1] - A[j - 1]) * 90 + (A[j - 2] - A[j + 2]) * 24 + (A[j + 3] - A[j - 3]) * 6 + (A[j - 4] - A[j + 4])) / 336;

				// This is equivilent to calculateClosed() with N=8, coeffecients times 6 (below) with an extra term
				// B[j] = A[j] +((A[(j+1)%N]-A[(j+7)%N])*90 -(A[(j+2)%N]-A[(j+6)%N])*24 +(A[(j+3)%N]-A[(j+5)%N])*6 )/336;
			}

			B[N - 3] = (A[N - 8] * -26 + A[N - 7] * 156 - A[N - 6] * 624 + A[N - 5] * 2340 - A[N - 4] * 8736 + A[N - 3] * 32604 + A[N - 2] * 8688 - A[N - 1] * 2172 + A[N] * 362) / 32592;
			B[N - 2] = (A[N - 8] * 7 - A[N - 7] * 42 + A[N - 6] * 168 - A[N - 5] * 630 + A[N - 4] * 2352 - A[N - 3] * 8778 + A[N - 2] * 32760 + A[N - 1] * 8106 - A[N] * 1351) / 32592;
			B[N - 1] = (A[N - 8] * -2 + A[N - 7] * 12 - A[N - 6] * 48 + A[N - 5] * 180 - A[N - 4] * 672 + A[N - 3] * 2508 - A[N - 2] * 9360 + A[N - 1] * 34932 + A[N] * 5042) / 32592;

		} else if (N == 7) {

			B[0] = (A[0] * 5042 + A[1] * 4680 + A[2] * -1254 + A[3] * 336 + A[4] * -90 + A[5] * 24 + A[6] * -6 + A[7] * 1) / 8733;
			B[1] = (A[0] * -1351 + A[1] * 8106 + A[2] * 2508 + A[3] * -672 + A[4] * 180 + A[5] * -48 + A[6] * 12 + A[7] * -2) / 8733;
			B[2] = (A[0] * 362 + A[1] * -2172 + A[2] * 8688 + A[3] * 2352 + A[4] * -630 + A[5] * 168 + A[6] * -42 + A[7] * 7) / 8733;
			B[3] = (A[0] * -97 + A[1] * 582 + A[2] * -2328 + A[3] * 8730 + A[4] * 2340 + A[5] * -624 + A[6] * 156 + A[7] * -26) / 8733;
			B[4] = (A[0] * 26 + A[1] * -156 + A[2] * 624 + A[3] * -2340 + A[4] * 8736 + A[5] * 2328 + A[6] * -582 + A[7] * 97) / 8733;
			B[5] = (A[0] * -7 + A[1] * 42 + A[2] * -168 + A[3] * 630 + A[4] * -2352 + A[5] * 8778 + A[6] * 2172 + A[7] * -362) / 8733;
			B[6] = (A[0] * 2 + A[1] * -12 + A[2] * 48 + A[3] * -180 + A[4] * 672 + A[5] * -2508 + A[6] * 9360 + A[7] * 1351) / 8733;

		} else if (N == 6) {

			B[0] = (A[0] * 1351 + A[1] * 1254 + A[2] * -336 + A[3] * 90 + A[4] * -24 + A[5] * 6 + A[6] * -1) / 2340;
			B[1] = (A[0] * -362 + A[1] * 2172 + A[2] * 672 + A[3] * -180 + A[4] * 48 + A[5] * -12 + A[6] * 2) / 2340;
			B[2] = (A[0] * 97 + A[1] * -582 + A[2] * 2328 + A[3] * 630 + A[4] * -168 + A[5] * 42 + A[6] * -7) / 2340;
			B[3] = (A[0] * -26 + A[1] * 156 + A[2] * -624 + A[3] * 2340 + A[4] * 624 + A[5] * -156 + A[6] * 26) / 2340;
			B[4] = (A[0] * 7 + A[1] * -42 + A[2] * 168 + A[3] * -630 + A[4] * 2352 + A[5] * 582 + A[6] * -97) / 2340;
			B[5] = (A[0] * -2 + A[1] * 12 + A[2] * -48 + A[3] * 180 + A[4] * -672 + A[5] * 2508 + A[6] * 362) / 2340;

		} else if (N == 5) {

			B[0] = (A[0] * 362 + A[1] * 336 + A[2] * -90 + A[3] * 24 + A[4] * -6 + A[5] * 1) / 627;
			B[1] = (A[0] * -97 + A[1] * 582 + A[2] * 180 + A[3] * -48 + A[4] * 12 + A[5] * -2) / 627;
			B[2] = (A[0] * 26 + A[1] * -156 + A[2] * 624 + A[3] * 168 + A[4] * -42 + A[5] * 7) / 627;
			B[3] = (A[0] * -7 + A[1] * 42 + A[2] * -168 + A[3] * 630 + A[4] * 156 + A[5] * -26) / 627;
			B[4] = (A[0] * 2 + A[1] * -12 + A[2] * 48 + A[3] * -180 + A[4] * 672 + A[5] * 97) / 627;

		} else if (N == 4) {

			B[0] = (A[0] * 97 + A[1] * 90 + A[2] * -24 + A[3] * 6 + A[4] * -1) / 168;
			B[1] = (A[0] * -26 + A[1] * 156 + A[2] * 48 + A[3] * -12 + A[4] * 2) / 168;
			B[2] = (A[0] * 7 + A[1] * -42 + A[2] * 168 + A[3] * 42 + A[4] * -7) / 168;
			B[3] = (A[0] * -2 + A[1] * 12 + A[2] * -48 + A[3] * 180 + A[4] * 26) / 168;

		} else if (N == 3) {

			B[0] = (+A[0] * 26 + A[1] * 24 - A[2] * 6 + A[3] * 1) / 45;
			B[1] = (+A[0] * -7 + A[1] * 42 + A[2] * 12 - A[3] * 2) / 45;
			B[2] = (+A[0] * 2 - A[1] * 12 + A[2] * 48 + A[3] * 7) / 45;

		} else if (N == 2) {

			B[0] = (A[0] * 7 + A[1] * 6 - A[2] * 1) / 12;
			B[1] = (A[0] * -2 + A[1] * 12 + A[2] * 2) / 12;

		} else if (N == 1) {

			// straight line
			B[0] = round(A[0] * 10) / 10;
			C[0] = round(A[1] * 10) / 10;

			return;
		}

		C[N - 1] = (A[N] + B[N - 1]) / 2;
		for (let j = N - 2; j >= 0; j--)
			C[j] = A[j + 1] * 2 - B[j + 1];
	}

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
	 * Perform a fast and rough approximation of the  length
	 */
	this.calcContourLength = function (dt) {
		const AX = this.AX;
		const AY = this.AY;
		const BX = this.BX;
		const BY = this.BY;
		const CX = this.CX;
		const CY = this.CY;
		const N = AX.length;

		/*
		 * Walk the path
		 */
		let contourLength = 0;

		for (let i = 0; i < N; i++) {

			const iPlus1 = (i + 1) % N;
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

				x += dx;
				y += dy;
			}
		}

		return contourLength;
	}

	/*
	 * Capture contour
	 * Walk the contour and save coordinates after every integer unit distance
	 */
	this.captureContour = function (dt, contourX, contourY) {
		const AX = this.AX;
		const AY = this.AY;
		const BX = this.BX;
		const BY = this.BY;
		const CX = this.CX;
		const CY = this.CY;
		const N = AX.length;

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
	 * Draw the curve and guides using bezier primitives
	 */
	this.draw = function (ctx, width, height) {
		let AX = this.AX;
		let AY = this.AY;
		let BX = this.BX;
		let BY = this.BY;
		let CX = this.CX;
		let CY = this.CY;
		let N = AX.length;

		/*
		 * Optionally show control points
		 */
		if (true) {
			ctx.beginPath();
			ctx.strokeStyle = "#f00";
			ctx.fillStyle = "#f00";
			ctx.lineWidth = 3;
			for (let i = 0; i < N; i++) {
				ctx.moveTo(AX[i], AY[i]);
				ctx.arc(AX[i], AY[i], 2, 0, 2 * Math.PI);
			}
			ctx.stroke();
		}

		/*
		 * display curve
		 */
		ctx.beginPath();
		ctx.strokeStyle = "#00f";
		ctx.lineWidth = 2;
		ctx.moveTo(AX[0], AY[0]);
		for (let i = 0; i < N; i++) {
			let iPlus1 = (i + 1) % N;
			ctx.bezierCurveTo(BX[i], BY[i], CX[i], CY[i], AX[iPlus1], AY[iPlus1]);
		}
		ctx.stroke();

		if (false) {
			/*
			 * create layer that displays control point hints
			 */
			ctx.beginPath();
			ctx.strokeStyle = "#0f0";
			ctx.lineWidth = 2;
			for (let i = 0; i < N; i++) {
				let iMinus1 = (i - 1 + N) % N;
				ctx.moveTo(AX[i], AY[i]);
				ctx.lineTo(BX[i], BY[i]);
				ctx.lineTo(CX[iMinus1], CY[iMinus1]);
			}
			ctx.stroke();
		}
	};

	/*
	 * Draw the curve and guides using contour pixels
	 */
	this.drawContour = function (ctx, width, height, contourX, contourY, colour) {
		ctx.beginPath();
		ctx.strokeStyle = colour;
		ctx.fillStyle = colour;
		for (let i = 0; i < contourX.length; i++)
			ctx.fillRect( contourX[i] - 1, contourY[i] - 1, 2, 2 );
		ctx.stroke();
	};

	// coefficients for incremental plotting
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
	this.dt = 0;		// `dt` used to create unroll data
	// this.contourX = [];
	// this.contourY = [];
	this.fragLen = [];	// length of fragment
	this.fragX = [];	// curve fragment of `dt` length
	this.fragY = [];
	this.segI = [];		// starting fragment of contour segment
	this.segDir = [];	// when updating the segment/fragment mapping, which direction do the segments move
	this.segLen = [];	// length of segment
	this.maxRatio = 1.5;	// adjacent segments may not exceed this length difference

	this.compareUpdateControls = function() {
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
			for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fN)
				segLen[i] += fragLen[k];
		}
	}

	this.compareInit = function(numFragments, contourX, contourY) {
		const AX = this.AX;
		const AY = this.AY;
		const bN = AX.length; // number of bezier sections
		const sN = contourX.length; // number of contour segments

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

		const fragLen = this.fragLen;
		const segI = this.segI;
		const segLen = this.segLen;
		const segDir = this.segDir;

		// initial mapping
		for (let i = 0; i < sN; i++) {
			segI[i] = Math.trunc(i * numFragments / sN);
			segDir[i] = 0;
		}

		// populate the above arrays
		this.compareUpdateControls();

		// validate segment length
		for (let i = 0; i < segI.length; i++) {
			const iPlus1 = (i + 1) % segI.length;

			let len = 0;
			for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fragLen.length)
				len += fragLen[k];

			if (Math.abs((len-segLen[i])) > 1e-10)
				console.log("ERROR1A: "+i+" "+(len-segLen[i]));
		}

	}

	this.numBalance = 0;

	this.compareBalance = function() {

		const fragLen = this.fragLen;
		const maxRatio = this.maxRatio;
		const segDir = this.segDir;
		const segI = this.segI;
		const segLen = this.segLen;
		const sN = segLen.length;
		const fN = fragLen.length;

		this.numBalance++;

		// clear segment movement directions
		for (let k = 0; k < sN; k++)
			segDir[k] = 0;

		// validate segment length
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			let len = 0;
			for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fN) {
				if (fragLen[k] > 5000)
					console.log("ERROR3G: "+i+" "+(len-segLen[i]));
				len += fragLen[k];
			}

			if (Math.abs((len-segLen[i])) > 1e-10)
				console.log("ERROR3F: "+i+" "+(len-segLen[i]));
		}

		// console.log('balance');
		let changed = false;
		do {
			changed = false;

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

					if (segDir[iCurr] != -1) {

						// only export if balancing constraints need to be met
						// <prev+frag> <curr-frag> <next>

						if (segLen[iPrev] * maxRatio <= segLen[iCurr] || segLen[iCurr] * maxRatio <= segLen[iNext]) {
							// export/relocate first fragment to previous segment

							// export/relocate fragment
							segLen[iCurr] -= fragLen[jFirstCurr];
							segLen[iPrev] += fragLen[jFirstCurr];
							segI[iCurr] = jSecondCurr;
							segDir[iCurr] = +1;

							changed = true;
						}
					}

					if (segDir[iNext] != +1) {

						// only export if balancing constraints need to be met
						// <prev> <curr-frag> <next+frag>

						if (segLen[iCurr] >= segLen[iNext] * maxRatio || segLen[iPrev] >= segLen[iCurr] * maxRatio) {
							// export/relocate last fragment to next segment

							// export/relocate fragment
							segLen[iCurr] -= fragLen[jLastCurr]; // remove fragment length from current
							segLen[iNext] += fragLen[jLastCurr]; // add fragment length to next
							segI[iNext] = jLastCurr;
							segDir[iNext] = -1;

							changed = true;
						}
					}
				}
			}
		} while(changed);

		// validate segment length
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			let len = 0;
			for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fN)
				len += fragLen[k];

			if (Math.abs((len-segLen[i])) > 1e-10) {
				console.log(JSON.stringify({id: "ERROR3E", i: i, len: len, seglen:segLen[i], numBalance: this.numBalance}));
				console.log(JSON.stringify(segLen));
				console.log(JSON.stringify(segDir));
				console.log(JSON.stringify(segI));
				console.log(JSON.stringify(fragLen));
				for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fN)
					console.log(fragLen[k]);
				console.log('*');

			}
		}

		// validate balancer
		for (let iCurr = 0; iCurr < sN - 1; iCurr++) {
			const iNext = (iCurr + 1) % sN; // next contour segment
			const iPrev = (iCurr - 1 + sN) % sN; // previous contour segment

			if (1) {
				// extra diagnostics
				const iPrevPrev = (iPrev - 1 + sN) % sN; // previous contour segment before previous
				const iNextNext = (iNext + 1) % sN; // next contour segment after next
				const jFirstCurr = segI[iCurr]; // first fragment of current segment
				const jSecondCurr = (jFirstCurr + 1) % fN; // second fragment of current segment
				const jFirstNext = segI[iNext]; // first fragment of next segment
				const jLastCurr = (jFirstNext - 1 + fN) % fN; // last fragment of current segment

				if (segLen[iPrev] > segLen[iCurr] * maxRatio)
					console.log(JSON.stringify({id:"ERROR3A",
						iPrevPrev:iPrevPrev, iPrev:iPrev, iCurr:iCurr, iNext:iNext, iNextNext:iNextNext,
						lPrevPrev:segLen[iPrevPrev], lPrev:segLen[iPrev], lCurr:segLen[iCurr], lNext:segLen[iNext], lNextNext:segLen[iNextNext],
						dPrevPrev:segDir[iPrevPrev], dPrev:segDir[iPrev], dCurr:segDir[iCurr], dNext:segDir[iNext], dNextNext:segDir[iNextNext],
						jFirstCurr:jFirstCurr, jSecondCurr:jSecondCurr, jLastCurr:jLastCurr, jFirstNext:jFirstNext,
						lFirstCurr:fragLen[jFirstCurr], lSecondCurr:fragLen[jSecondCurr], lLastCurr:fragLen[jLastCurr], lFirstNext:fragLen[jFirstNext]}));
				if (segLen[iPrev] * maxRatio < segLen[iCurr])
					console.log(JSON.stringify({id:"ERROR3B",
						iPrevPrev:iPrevPrev, iPrev:iPrev, iCurr:iCurr, iNext:iNext, iNextNext:iNextNext,
						lPrevPrev:segLen[iPrevPrev], lPrev:segLen[iPrev], lCurr:segLen[iCurr], lNext:segLen[iNext], lNextNext:segLen[iNextNext],
						dPrevPrev:segDir[iPrevPrev], dPrev:segDir[iPrev], dCurr:segDir[iCurr], dNext:segDir[iNext], dNextNext:segDir[iNextNext],
						jFirstCurr:jFirstCurr, jSecondCurr:jSecondCurr, jLastCurr:jLastCurr, jFirstNext:jFirstNext,
						lFirstCurr:fragLen[jFirstCurr], lSecondCurr:fragLen[jSecondCurr], lLastCurr:fragLen[jLastCurr], lFirstNext:fragLen[jFirstNext]}));
				if (segLen[iCurr] > segLen[iNext] * maxRatio)
					console.log(JSON.stringify({id:"ERROR3C",
						iPrevPrev:iPrevPrev, iPrev:iPrev, iCurr:iCurr, iNext:iNext, iNextNext:iNextNext,
						lPrevPrev:segLen[iPrevPrev], lPrev:segLen[iPrev], lCurr:segLen[iCurr], lNext:segLen[iNext], lNextNext:segLen[iNextNext],
						dPrevPrev:segDir[iPrevPrev], dPrev:segDir[iPrev], dCurr:segDir[iCurr], dNext:segDir[iNext], dNextNext:segDir[iNextNext],
						jFirstCurr:jFirstCurr, jSecondCurr:jSecondCurr, jLastCurr:jLastCurr, jFirstNext:jFirstNext,
						lFirstCurr:fragLen[jFirstCurr], lSecondCurr:fragLen[jSecondCurr], lLastCurr:fragLen[jLastCurr], lFirstNext:fragLen[jFirstNext]}));
				if (segLen[iCurr] * maxRatio < segLen[iNext])
					console.log(JSON.stringify({id:"ERROR3D",
						iPrevPrev:iPrevPrev, iPrev:iPrev, iCurr:iCurr, iNext:iNext, iNextNext:iNextNext,
						lPrevPrev:segLen[iPrevPrev], lPrev:segLen[iPrev], lCurr:segLen[iCurr], lNext:segLen[iNext], lNextNext:segLen[iNextNext],
						dPrevPrev:segDir[iPrevPrev], dPrev:segDir[iPrev], dCurr:segDir[iCurr], dNext:segDir[iNext], dNextNext:segDir[iNextNext],
						jFirstCurr:jFirstCurr, jSecondCurr:jSecondCurr, jLastCurr:jLastCurr, jFirstNext:jFirstNext,
						lFirstCurr:fragLen[jFirstCurr], lSecondCurr:fragLen[jSecondCurr], lLastCurr:fragLen[jLastCurr], lFirstNext:fragLen[jFirstNext]}));
			} else {
				if (segLen[iPrev] > segLen[iCurr] * maxRatio)
					console.log("ERROR3A: " + iCurr + " " + (segLen[iPrev] / segLen[iCurr]));
				if (segLen[iPrev] * maxRatio < segLen[iCurr])
					console.log("ERROR3B: " + iCurr + " " + (segLen[iPrev] / segLen[iCurr]));
				if (segLen[iCurr] > segLen[iNext] * maxRatio)
					console.log("ERROR3C: " + iCurr + " " + (segLen[iCurr] / segLen[iNext]));
				if (segLen[iCurr] * maxRatio < segLen[iNext])
					console.log("ERROR3D: " + iCurr + " " + (segLen[iCurr] / segLen[iNext]));
			}
		}

		if (this.numBalance == 3408) {
			console.log(JSON.stringify(segLen));
			console.log(JSON.stringify(segDir));
			console.log(JSON.stringify(segI));
			console.log(JSON.stringify(fragLen));
		}
	}

	/*
	 * Follow the passed contour and try to match with the current bezier curve.
	 * This function is called many times with slight changes to the bezier curve.
	 * In effect it would give the impression that tracking hotspot (the point where contour and curve match) is continuously going round and round and round...
	 */
	this.compare = function (ctx, contourX, contourY, colour) {
		const AX = this.AX;
		const AY = this.AY;
		const BX = this.BX;
		const BY = this.BY;
		const CX = this.CX;
		const CY = this.CY;
		const bN = AX.length;

		/*
		 * Create fragments for all dt steps
		 */
		const fragLen = this.fragLen;
		const fragX = this.fragX;
		const fragY = this.fragY;
		const segDir = this.segDir;
		const segI = this.segI;
		const segLen = this.segLen;
		const maxRatio = this.maxRatio;
		const sN = segLen.length;

		// validate segment length
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			let len = 0;
			for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fragLen.length)
				len += fragLen[k];

			if (Math.abs((len-segLen[i])) > 1e-10)
				console.log("ERROR1C: "+i+" "+(len-segLen[i]));
		}


		/*
		 * Core part
		 */


		// balancer todo: this is only the detector. replace it with `compareBalancer()`
		for (let i = 0; i < sN; i++) {
			let iPlus1 = (i + 1) % sN;

			if (segLen[i] > segLen[iPlus1] * maxRatio)
				console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
			if (segLen[i] * maxRatio < segLen[iPlus1])
				console.log("YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY");
		}

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
				if (jFirstCurr != jLastCurr) {

					if (segDir[iCurr] != -1) {
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

					if (segDir[iNext] != +1) {
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

								if(0) console.log(JSON.stringify({id:"B", iPrevPrev:iPrevPrev, iPrev:iPrev, iNext:iNext, iNextNext:iNextNext,
									jFirstCurr:jFirstCurr, jSecondCurr:jSecondCurr, jFirstNext:jFirstNext, jLastCurr:jLastCurr, newCurrLen:newCurrLen, newNextLen:newNextLen,
									segLenPrev:segLen[iPrev], segLenNextNext:segLen[iNextNext], fragLenLastCurr:fragLen[jLastCurr]
								}));

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
		} while(changed);


		// validate segment length
		for (let i = 0; i < sN; i++) {
			const iPlus1 = (i + 1) % sN;

			let len = 0;
			for (let k = segI[i]; k != segI[iPlus1]; k = (k + 1) % fragLen.length)
				len += fragLen[k];

			if (Math.abs((len-segLen[i])) > 1e-10)
				console.log("ERROR1B: "+i+" "+(len-segLen[i]));
		}
		// validate balancer
		for (let i = 0; i < sN - 1; i++) {
			let iNext = (i+1) % sN;
			let iPrev = (i-1+sN) % sN;

			if (segLen[iPrev] > segLen[i] * maxRatio)
				console.log("ERROR2A: "+i+" "+(segLen[iPrev] / segLen[i]));
			if (segLen[iPrev]*maxRatio < segLen[i])
				console.log("ERROR2B: "+i+" "+(segLen[iPrev] / segLen[i]));
			if (segLen[i] > segLen[iNext] * maxRatio)
				console.log("ERROR2C: "+i+" "+(segLen[i] / segLen[iNext]));
			if (segLen[i]*maxRatio < segLen[iNext])
				console.log("ERROR2D: "+i+" "+(segLen[i] / segLen[iNext]));
		}

		// draw
		if(colour) {
			for (let i = 0; i < sN; i++) {
				// draw line. each stoke has its own colour
				ctx.beginPath();
				ctx.strokeStyle = this.rgb[i % 256];
				ctx.fillStyle = this.rgb[i % 256];
				ctx.lineWidth = 1;
				// this.ctx.fillRect(this.fragX[segI[i]] - 1, this.fragY[segI[i]] - 1, 4, 4);
				// this.ctx.fillRect(contourX[i] - 1, contourY[i] - 1, 4, 4);
				ctx.moveTo(contourX[i], contourY[i]);
				ctx.lineTo(this.fragX[segI[i]], this.fragY[segI[i]]);
				ctx.stroke();
			}
		}

		return totalError;
	}
}

Number.prototype.pad = function(size) {
	var s = String(this);
	while (s.length < (size || 2)) {s = "0" + s;}
	return s;
}

if (typeof window === "undefined") {
	let nodeCanvas = require("canvas");
	let fs = require("fs")

	let width = 500;
	let height = 500;

	// create the canvas
	let canvas = nodeCanvas.createCanvas(width, height)
	canvas.width = width;
	canvas.height = height;
	let ctx = canvas.getContext("2d")

	// erase canvas
	ctx.fillStyle = "#eee"
	ctx.fillRect(0, 0, width, height)

	// create the curve
	let curve = new Bezier();
	curve.AX = [296, 224, 378, 236, 306, 288, 178, 303, 162, 258];
	curve.AY = [325, 195, 219, 248, 95, 249, 128, 192, 272, 163];
	if (0) {
		curve.AX = [453, 94, 378, 400, 306, 354, 178, 424, 91, 261];
		curve.AY = [470, 378, 219, 129, 95, 71, 128, 330, 212, 365];

		// magnify
		width *= 2;
		height *= 2;
		for (let i = 0; i < curve.AX.length; i++) {
			curve.AX[i] = curve.AX[i] * 2;
			curve.AY[i] = curve.AY[i] * 2;
		}
	} else if (1) {
		// magnify
		width = 2160;
		height = 2160;
		for (let i = 0; i < curve.AX.length; i++) {
			curve.AX[i] = curve.AX[i] * 2160 / 500 * 2 - 350 - 1000 +100;
			curve.AY[i] = curve.AY[i] * 2160 / 500 * 2 - 200 - 500 - 50;
		}
	} else {
		// magnify
		width *= 2;
		height *= 2;
		for (let i = 0; i < curve.AX.length; i++) {
			curve.AX[i] = curve.AX[i] * 3 - 350;
			curve.AY[i] = curve.AY[i] * 3 - 200;
		}
	}
	canvas.width = width;
	canvas.height = height;

	// determine control points
	curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
	curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);

	// determine control net length
	let controlLength = curve.calcControlLength();
	// Asssuming integers as stepsize, Initial approximation of dt. NOTE: Not all segments are equal length
	let dt = 1 / (controlLength / curve.AX.length);
	// make stepsize visible
	dt *= 8;

	// determine contour length
	let contourLength = curve.calcContourLength(dt);

	// capture contour
	let contourX = [];
	let contourY = [];
	curve.captureContour(dt, contourX, contourY);

	// draw
	curve.drawContour(ctx, width, height, contourX, contourY, "#f00");
	// curve.draw(ctx, width, height);

	// Remove the last control point to create a test curve
	curve.AX.splice(4, 1);
	curve.AY.splice(4, 1);
	curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
	curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);
	curve.draw(ctx, width, height);

	// let dt resemble 4times more samples than contour
	dt = 1 / (contourX.length / curve.AX.length) / 4;

	// initial compare contour/curve
	curve.compareInit(contourX.length*4, contourX, contourY);
	curve.compareBalance();
	let err, totalError = curve.compare(ctx, contourX, contourY, 0);
	console.log(totalError);

	let changed = 0;
	let framenr = 0;
	do {
		console.log("#");
		changed = 0;
		for (let inc=0; inc<5 && !changed; inc++)
			for (let i = 0; i < curve.AX.length; i++) {
				// console.log('*A');
				curve.AX[i] -= inc;
				curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
				curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);
				curve.compareUpdateControls();
				curve.compareBalance();
				err = curve.compare(ctx, contourX, contourY, 0);
				if (totalError > err) {
					totalError = err;
					changed++;
					console.log("bump1 " +err);
				} else
					curve.AX[i] += inc;
				console.log("A "+ totalError);

				// console.log('*B');
				curve.AX[i] += inc;
				curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
				curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);
				curve.compareUpdateControls();
				curve.compareBalance();
				err = curve.compare(ctx, contourX, contourY, 0);
				if (totalError > err) {
					totalError = err;
					changed++;
					console.log("bump2 " +err);
				} else
					curve.AX[i] -= inc;
				console.log("B "+ totalError);

				// console.log('*C');
				curve.AY[i] -= inc;
				curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
				curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);
				curve.compareUpdateControls();
				curve.compareBalance();
				err = curve.compare(ctx, contourX, contourY, 0);
				if (totalError > err) {
					totalError = err;
					changed++;
					console.log("bump3 " +err);
				} else
					curve.AY[i] += inc;
				console.log("C "+ totalError);

				// console.log('*D');
				curve.AY[i] += inc;
				curve.calcControlsClosed(curve.AX, curve.BX, curve.CX);
				curve.calcControlsClosed(curve.AY, curve.BY, curve.CY);
				curve.compareUpdateControls();
				curve.compareBalance();
				err = curve.compare(ctx, contourX, contourY, 0);
				if (totalError > err) {
					totalError = err;
					changed++;
					console.log("bump4 " +err);
				} else
					curve.AY[i] -= inc;
				console.log("D "+ totalError);
			}

		ctx.fillStyle = "#888"
		ctx.fillStyle = "#eee"
		ctx.fillRect(0, 0, width, height);
		curve.drawContour(ctx, width, height, contourX, contourY, "#f00");
		curve.draw(ctx, width, height);
		err = curve.compare(ctx, contourX, contourY, "#0f0");

		ctx.beginPath();
		ctx.strokeStyle = "#000";
		ctx.fillStyle = "#000";
		ctx.lineWidth = 8;
		ctx.moveTo(curve.AX[0], curve.AY[0]);
		ctx.arc(curve.AX[0], curve.AY[0], 2, 0, 2 * Math.PI);
		ctx.stroke();

		let buffer = canvas.toBuffer("image/png")
		fs.writeFileSync("tester-balanced-Yerr-"+framenr.pad(3)+".png", buffer)
		framenr++;
		fs.writeFileSync("tester-balanced-Yerr.png", buffer)
	} while (changed);

}
