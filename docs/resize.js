/*
 *  This file is part of ccbc, Closed Continuous Bézier Curves.
 *  Copyright (C) 2020, xyzzy@rockingship.org
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

// The arithmetic progression sequence is a[n] = a[n-1]*4 - a[n-2]
// where a[0]=1, a[1]=3 and a[0]=1, a[1]=4
// you will also encounter the sequence where a[0]=1, a[1]=2, a[2]=7

function calcControlsClosed(A, B, C) {
	let N = A.length;
	let round = Math.round;

	B.length = 0;
	C.length = 0;

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
		for (let j = 0; j < 2; j++)
			B[j] = A[j];
	}

	for (let i = 0; i < N; i++)
		C[i] = 2 * A[(i + 1) % N] - B[(i + 1) % N];

	// round
	for (let j = 0; j < N; j++) {
		B[j] = round(B[j] * 10) / 10;
		C[j] = round(C[j] * 10) / 10;
	}
}

function calcControlsOpen(A, B, C) {
	let N = A.length;
	let round = Math.round;

	B.length = 0;
	C.length = 0;

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

	} else if (N == 0) {

		// point
		B[0] = C[0] = round(A[0] * 10) / 10;

		return;

	}

	C[N - 1] = (A[N] + B[N - 1]) / 2;
	for (let j = N - 2; j >= 0; j--)
		C[j] = A[j + 1] * 2 - B[j + 1];

	// round
	for (let j = 0; j < N; j++) {
		B[j] = round(B[j] * 10) / 10;
		C[j] = round(C[j] * 10) / 10;
	}
}


//---------------

function cubicbezier3(x0, y0, x1, y1, x2, y2, x3, y3)
{
	let n = 10000;
	let sum = 0;

	let lastx = x0;
	let lasty = y0;
	for (let i = 1; i < n; i++) {
		let t = i / n;
		let t1 = 1 - t;

		let a = t1*t1;
		let d = t*t;
		let b = t*a*3;
		let c = t1*d*3;
		a *= t1;
		d *= t;

		let x = a*x0 + b*x1 + c*x2 + d*x3;
		let y = a*y0 + b*y1 + c*y2 + d*y3;
		lastx -= x;
		lasty -= y;

		sum += Math.sqrt(lastx*lastx+lasty*lasty);

		lastx = x;
		lasty = y;
	}

	return sum;
}


function cubicbezier4(segx, segy, pos, seglen, x0, y0, x1, y1, x2, y2, x3, y3)
{
	let n = 10000;

	let lastx = x0;
	let lasty = y0;
	for (let i=1; i<n; i++) {
		let t = i / n;
		let t1 = 1 - t;

		let a = t1*t1;
		let d = t*t;
		let b = t*a*3;
		let c = t1*d*3;
		a *= t1;
		d *= t;

		let x = a*x0 + b*x1 + c*x2 + d*x3;
		let y = a*y0 + b*y1 + c*y2 + d*y3;
		lastx -= x;
		lasty -= y;

		pos += Math.sqrt(lastx*lastx+lasty*lasty);
		if (pos >= seglen) {
			segx.push(x);
			segy.push(y);
			pos -= seglen;
		}

		lastx = x;
		lasty = y;
	}

	return pos;
}

function cubicbezier5(x0, y0, x1, y1, x2, y2, x3, y3, n, segx, segy, inx)
{
	let err = 0;
	for (let i=0; i<n; i++) {
		let t = i / n;
		let t1 = 1 - t;

		let a = t1*t1;
		let d = t*t;
		let b = t*a*3;
		let c = t1*d*3;
		a *= t1;
		d *= t;

		let x = a*x0 + b*x1 + c*x2 + d*x3;
		let y = a*y0 + b*y1 + c*y2 + d*y3;

		x -= segx[inx];
		x *= x;
		y -= segy[inx];
		y *= y;
		err += Math.sqrt(x+y);

		inx++;
		if (inx >= segx.length)
			inx = 0;
	}

	return err;
}

function calc2(AX, AY, BX, BY, CX, CY)
{
	// determine length of each curve
	let totlen = 0;
	let n = AX.length;
	for (let i=0; i<n; i++)
		totlen += cubicbezier3(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n]);

	// redistribute ref points
	let segx = [];
	let segy = [];
	let bezcnt = n-1;
	let segcnt = totlen*.5; // resolution grid = 1/3 * pixel size
	let seglen = totlen / segcnt;  // nearly arbituary
	let pos = 0;

	for (let i=0; i<n; i++)
		pos = cubicbezier4(segx, segy, pos, seglen, AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n]);
	segcnt = segx.length;

	// initial new base points
	n = bezcnt;
	let P = [];
	for (let i=0; i<n; i++)
		P[i] = Math.floor(segcnt/bezcnt)*i;

	// generate closed path for these points
	AX.length = 0;
	AY.length = 0;
	for (let i=0; i<n; i++) {
		AX[i] = segx[P[i]];
		AY[i] = segy[P[i]];
	}

	calcControlsClosed(AX, BX, CX);
	calcControlsClosed(AY, BY, CY);

	// calculate initial error
	let err = 0;
	for (let i=0; i<n; i++)
		err += cubicbezier5(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n], (P[(i+1)%n]+segcnt-P[i])%segcnt, segx, segy, P[i]);

	// determine direction tendency
	let dir = [];
	for (let ppos=0; ppos<n; ppos++) {
		// try this deviation
		P[ppos] = (P[ppos]+segcnt+1)%segcnt;
		AX[ppos] = segx[P[ppos]];
		AY[ppos] = segy[P[ppos]];
		calcControlsClosed(AX, BX, CX);
		calcControlsClosed(AY, BY, CY);

		let t = 0;
		for (let i=0; i<n; i++)
			t += cubicbezier5(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n], (P[(i+1)%n]+segcnt-P[i])%segcnt, segx, segy, P[i]);
		dir[ppos] = (t < err) ? +1 : -1;

		// reset
		P[ppos] = (P[ppos]+segcnt-1)%segcnt;
	}

	let ppos = 0;
	let timeout = 2*n;
	for(;;) {
		let sav = P[ppos];

		// try this deviation
		P[ppos] = (sav+segcnt+dir[ppos])%segcnt;
		AX[ppos] = segx[P[ppos]];
		AY[ppos] = segy[P[ppos]];
		calcControlsClosed(AX, BX, CX);
		calcControlsClosed(AY, BY, CY);

		// calculate initial error
		let t = 0;
		for (let i=0; i<n; i++)
			t += cubicbezier5(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n], (P[(i+1)%n]+segcnt-P[i])%segcnt, segx, segy, P[i]);
		if (t < err) {
			err = t;
			timeout = 2*n;
			continue;
		}

		// try other direction
		P[ppos] = (sav+segcnt-dir[ppos])%segcnt;
		AX[ppos] = segx[P[ppos]];
		AY[ppos] = segy[P[ppos]];
		calcControlsClosed(AX, BX, CX);
		calcControlsClosed(AY, BY, CY);

		// calculate initial error
		t = 0;
		for (let i=0; i<n; i++)
			t += cubicbezier5(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n], (P[(i+1)%n]+segcnt-P[i])%segcnt, segx, segy, P[i]);
		if (t < err) {
			err = t;
			timeout = 2*n;
			dir[ppos] = -dir[ppos]; // direction has changed
			continue;
		}

		// recenter
		P[ppos] = sav;
		AX[ppos] = segx[P[ppos]];
		AY[ppos] = segy[P[ppos]];

		if (timeout == n) {
			// direction has changed
			for (let i=0; i<n; i++)
				dir[i] = -dir[i];
		} else if (timeout == 0) {
			// found local minimum
			break;
		}

		// bump next focus refpoint
		timeout--;
		ppos = (ppos+1)%n;

	}

	// generate final closed path for these points
	calcControlsClosed(AX, BX, CX);
	calcControlsClosed(AY, BY, CY);
}

function calc3(AX, AY, BX, BY, CX, CY)
{
	// determine length of each curve
	let totlen = 0;
	let n = AX.length;
	for (let i=0; i<n; i++)
		totlen += cubicbezier3(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n]);

	// redistribute ref points
	let segx = [];
	let segy = [];
	let bezcnt = n-1;
	let segcnt = totlen*.5; // resolution grid = 1/3 * pixel size
	let seglen = totlen / segcnt;  // nearly arbituary
	let pos = 0;

	for (let i=0; i<n; i++)
		pos = cubicbezier4(segx, segy, pos, seglen, AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n]);
	segcnt = segx.length;

	// initial new base points
	n = bezcnt;
	let P = [];
	for (let i=0; i<n; i++)
		P[i] = Math.floor(segcnt/bezcnt)*i;

	// generate closed path for these points
	AX.length = 0;
	AY.length = 0;
	for (let i=0; i<n; i++) {
		AX[i] = segx[P[i]];
		AY[i] = segy[P[i]];
	}

	calcControlsClosed(AX, BX, CX);
	calcControlsClosed(AY, BY, CY);

	// calculate initial error
	let err = 0;
	for (let i=0; i<n; i++)
		err += cubicbezier5(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n], (P[(i+1)%n]+segcnt-P[i])%segcnt, segx, segy, P[i]);

	// determine direction tendency
	let dir = [];
	for (let ppos=0; ppos<n; ppos++) {
		// try this deviation
		P[ppos] = (P[ppos]+segcnt+1)%segcnt;
		AX[ppos] = segx[P[ppos]];
		AY[ppos] = segy[P[ppos]];
		calcControlsClosed(AX, BX, CX);
		calcControlsClosed(AY, BY, CY);

		let t = 0;
		for (let i=0; i<n; i++)
			t += cubicbezier5(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n], (P[(i+1)%n]+segcnt-P[i])%segcnt, segx, segy, P[i]);
		dir[ppos] = (t < err) ? +1 : -1;

		// reset
		P[ppos] = (P[ppos]+segcnt-1)%segcnt;
	}

	let ppos = 0;
	let timeout = 2*n;
	for(;;) {
		let sav = P[ppos];

		// try this deviation
		P[ppos] = (sav+dir[ppos]+segcnt)%segcnt;
		AX[ppos] = segx[P[ppos]];
		AY[ppos] = segy[P[ppos]];
		calcControlsClosed(AX, BX, CX);
		calcControlsClosed(AY, BY, CY);

		// calculate initial error
		let t = 0;
		for (let i=0; i<n; i++)
			t += cubicbezier5(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n], (P[(i+1)%n]+segcnt-P[i])%segcnt, segx, segy, P[i]);
		if (t < err) {
			err = t;
			timeout = 2*n;
			continue;
		}

		// try other direction
		P[ppos] = (sav+segcnt-dir[ppos])%segcnt;
		AX[ppos] = segx[P[ppos]];
		AY[ppos] = segy[P[ppos]];
		calcControlsClosed(AX, BX, CX);
		calcControlsClosed(AY, BY, CY);

		// calculate initial error
		t = 0;
		for (let i=0; i<n; i++)
			t += cubicbezier5(AX[i], AY[i], BX[i], BY[i], CX[i], CY[i], AX[(i+1)%n], AY[(i+1)%n], (P[(i+1)%n]+segcnt-P[i])%segcnt, segx, segy, P[i]);
		if (t < err) {
			err = t;
			timeout = 2*n;
			dir[ppos] = -dir[ppos]; // direction has changed
			continue;
		}

		// recenter
		P[ppos] = sav;
		AX[ppos] = segx[P[ppos]];
		AY[ppos] = segy[P[ppos]];

		if (timeout == n) {
			// direction has changed
			for (let i=0; i<n; i++)
				dir[i] = -dir[i];
		} else if (timeout == 0) {
			// found local minimum
			break;
		}

		// bump next focus refpoint
		timeout--;
		ppos = (ppos+1)%n;

	}

	// generate final closed path for these points
	calcControlsClosed(AX, BX, CX);
	calcControlsClosed(AY, BY, CY);
}

//---------------

function Curve() {

	this.AX = [296, 224, 378, 236, 306, 288, 178, 303, 162, 258];
	this.AY = [325, 195, 219, 248, 95, 249, 128, 192, 272, 163];
	this.BX = [];
	this.BY = [];
	this.CX = [];
	this.CY = [];

	this.draw = function (ctx, t, width, height) {
		let AX = this.AX;
		let AY = this.AY;
		let BX = this.BX;
		let BY = this.BY;
		let CX = this.CX;
		let CY = this.CY;
		let N = AX.length;

		// erase canvas
		ctx.fillStyle = '#eee'
		ctx.fillRect(0, 0, width, height)

		/*
		 * display curve
		 */
		ctx.beginPath();
		ctx.strokeStyle = '#00f';
		ctx.lineWidth = 2;
		ctx.moveTo(AX[0], AY[0]);
		for (let i = 0; i < N; i++)
			ctx.bezierCurveTo(BX[i], BY[i], CX[i], CY[i], AX[(i + 1) % N], AY[(i + 1) % N]);
		ctx.stroke();

		/*
		 * create layer that displays control point hints
		 */
		ctx.beginPath();
		ctx.strokeStyle = '#0f0';
		ctx.lineWidth = 2;
		for (let i = 0; i < N; i++) {
			ctx.moveTo(AX[i], AY[i]);
			ctx.lineTo(BX[i], BY[i]);
			ctx.lineTo(CX[(i - 1 + N) % N], CY[(i - 1 + N) % N]);
		}
		ctx.stroke();
	};

	/*
	 * Perform a fast chord length calculation
	 */
	this.fastChordLength = function (newN, newAX, newAY) {
		let AX = this.AX;
		let AY = this.AY;
		let BX = this.BX;
		let BY = this.BY;
		let CX = this.CX;
		let CY = this.CY;
		let N = AX.length;

		/*
		 * Determine length of control net sides
		 */
		let cnsLength = 0;
		for (let i = 0; i < N; i++) {
			let dx = BX[i] - AX[i];
			let dy = BY[i] - AY[i];
			cnsLength += Math.sqrt(dx * dx + dy * dy);
			dx = CX[i] - BX[i];
			dy = CY[i] - BY[i];
			cnsLength += Math.sqrt(dx * dx + dy * dy);
			dx = AX[(i + 1) % N] - CX[i];
			dy = AY[(i + 1) % N] - CY[i];
			cnsLength += Math.sqrt(dx * dx + dy * dy);
		}

		/*
		 * Initial approximation of dt
		 */
		let dt = 1 / (cnsLength / N);

		/*
		 * Walk the path
		 */
		let chordLength = 0;
		for (let i = 0; i < N; i++) {

			// get points for this curve
			let ax = AX[i], ay = AY[i], bx = BX[i], by = BY[i], cx = CX[i], cy = CY[i], dx = AX[(i + 1) % N], dy = AY[(i + 1) % N];

			let lastx = ax, lasty = ay;

			for (let t = 0; t < 1; t += dt) {
				let t1 = 1 - t;

				let a = t1 * t1;
				let d = t * t;
				let b = t * a * 3;
				let c = t1 * d * 3;
				a *= t1;
				d *= t;

				let x = a * ax + b * bx + c * cx + d * dx;
				let y = a * ay + b * by + c * cy + d * dy;

				// whats the increment
				x -= lastx;
				y -= lasty;

				// add length
				chordLength += Math.sqrt(x * x + y * y);

				lastx = x + lastx;
				lasty = y + lasty;
			}
		}

		/*
		 * Redistribute points
		 */
		let newLength = chordLength / newN;
		let segLength = 0;

		newAX.length = 0;
		newAY.length = 0;

		for (let i = 0; ; i = (i + 1) % N) {

			// get points for this curve
			let ax = AX[i], ay = AY[i], bx = BX[i], by = BY[i], cx = CX[i], cy = CY[i], dx = AX[(i + 1) % N], dy = AY[(i + 1) % N];

			let lastx = ax, lasty = ay;

			for (let t = 0; t < 1; t += dt) {
				let t1 = 1 - t;

				let a = t1 * t1;
				let d = t * t;
				let b = t * a * 3;
				let c = t1 * d * 3;
				a *= t1;
				d *= t;
				let x = a * ax + b * bx + c * cx + d * dx;  // 12* 3+

				x = ax*t1*t1*t1 + bx*t1*t1*t*3 + cx*t1*t*t*3 + dx*t*t*t
				x = t1*t1*(ax*t1 + bx*t*3) + t*t*(cx*t1*3 + dx*t) // 10* 3+

				x = ax*(t1-dt)*(t1-dt)*(t1-dt) + bx*(t1-dt)*(t1-dt)*(t+dt)*3 + cx*(t1-dt)*(t+dt)*(t+dt)*3 + dx*(t+dt)*(t+dt)*(t+dt)

				ax*(t1-dt)*(t1-dt)*(t1-dt)-ax*t1*t1*t1
				ax*( (t1-dt)*(t1-dt)*(t1-dt) - t1*t1*t1)
				ax*( (t1-dt)*(t1-dt)  (t1*t1-t1*dt-t1*dt+dt*dt)*(t1-dt) - t1*t1*t1)
				ax*( (t1*t1*t1-t1*dt*t1-t1*dt*t1+dt*dt*t1)-(dt*t1*t1-dt*t1*dt-dt*t1*dt+dt*dt*dt) - t1*t1*t1)
				ax*( t1*t1*t1-t1*dt*t1-t1*dt*t1+dt*dt*t1-dt*t1*t1+dt*t1*dt+dt*t1*dt-dt*dt*dt - t1*t1*t1)

				ax*(
					-C1*t1*t1
					+C2*t1
					-C3
				)

				let y = a * ay + b * by + c * cy + d * dy;

				// whats the increment
				let diffx = x - lastx;
				let diffy = y - lasty;

				// add length
				segLength += Math.sqrt(diffx * diffx + diffy * diffy);

				if (segLength > newLength) {

					newAX[newAX.length] = x;
					newAY[newAY.length] = y;
					segLength -= newLength;

					if (newAX.length == newN)
						return;
				}

				lastx = x;
				lasty = y;
			}
		}
	}

	/*
	 * Perform a fast chord length calculation
	 */
	this.fastChordLength2 = function () {
		let AX = this.AX;
		let AY = this.AY;
		let BX = this.BX;
		let BY = this.BY;
		let CX = this.CX;
		let CY = this.CY;
		let N = AX.length;

		/*
		 * Determine length of control net sides
		 */
		let cnsLength = 0;
		for (let i = 0; i < N; i++) {
			let dx = BX[i] - AX[i];
			let dy = BY[i] - AY[i];
			cnsLength += Math.sqrt(dx * dx + dy * dy);
			dx = CX[i] - BX[i];
			dy = CY[i] - BY[i];
			cnsLength += Math.sqrt(dx * dx + dy * dy);
			dx = AX[(i + 1) % N] - CX[i];
			dy = AY[(i + 1) % N] - CY[i];
			cnsLength += Math.sqrt(dx * dx + dy * dy);
		}

		/*
		 * Initial approximation of dt
		 */
		let dt = 1 / (cnsLength / N);

		/*
		 * NOTE: decrease dt for a higher accuracy. /4 is arbitrary, /16 is better but 4x slower
		 */
		dt /= 2;

		/*
		 * Walk the path
		 */
		let chordLength = 0;
		let stepsize = 0;
		for (let i = 0; i < N; i++) {

			// get points for this curve
			let ax = AX[i], ay = AY[i], bx = BX[i], by = BY[i], cx = CX[i], cy = CY[i], dx = AX[(i + 1) % N], dy = AY[(i + 1) % N];

			let lastx = ax, lasty = ay;

			for (let t = 0; t < 1; t += dt) {
				let t1 = 1 - t;

				let a = t1 * t1;
				let d = t * t;
				let b = t * a * 3;
				let c = t1 * d * 3;
				a *= t1;
				d *= t;

				let x = a * ax + b * bx + c * cx + d * dx;
				let y = a * ay + b * by + c * cy + d * dy;

				// whats the increment
				x -= lastx;
				y -= lasty;

				// add length
				let len = Math.sqrt(x * x + y * y);
				chordLength += len;
				if (stepsize < len)
					stepsize = len;

				lastx = x + lastx;
				lasty = y + lasty;
			}
		}
		return { dt: dt, length: chordLength, stepsize: stepsize };
	}
}

function Dots(svg, ctx, curve) {

	this.dots = [];

	let width = ctx.canvas.clientWidth;
	let height = ctx.canvas.clientHeight;
	let x0 = 0;
	let y0 = 0;
	let elx = undefined;
	let ely = undefined;
	let curel = undefined;

	document.body.addEvent('mousemove', function (event) {
		if (typeof curel !== 'undefined') {
			let x = elx + event.client.x - x0;
			let y = ely + event.client.y - y0;
			if (x < 0) x = 0;
			if (y < 0) y = 0;
			if (x >= width) x = width - 1;
			if (y >= height) y = height - 1;

			// extract index from id
			let i = parseInt(curel.id.substring(3));

			// save position in curve
			curve.AX[i] = x;
			curve.AY[i] = y;

			// position element
			curel.set('cx', x);
			curel.set('cy', y);

			// prepare curve
			calcControlsClosed(curve.AX, curve.BX, curve.CX);
			calcControlsClosed(curve.AY, curve.BY, curve.CY);

			// update ui
			document.id('txtA').set('text', JSON.encode(curve.AX));
			document.id('txtB').set('text', JSON.encode(curve.BX));
			curve.draw(ctx, 0, width, height);
		}
	});
	document.body.addEvent('mouseup', function (event) {
		curel = undefined;
	});
	document.body.addEvent('touchmove', function (event) {
		this.fireEvent('mousemove', event);
	});
	document.body.addEvent('touchend', function (event) {
		this.fireEvent('mouseup', event);
	});

	this.updateDots = function(newAX, newAY) {

		/*
		 * Remove excess dots
		 */
		while (this.dots.length > newAX.length) {
			let dot = this.dots.pop();
			dot.removeEvents();
			dot.remove();
		}

		/*
		 * create new dots
		 */
		while (this.dots.length < newAX.length) {
			let dot = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');

			dot.setAttributeNS(null, 'id', 'dot' + this.dots.length);
			dot.setAttributeNS(null, 'rx', '10');
			dot.setAttributeNS(null, 'ry', '10');
			dot.setAttributeNS(null, 'stroke', 'none');
			dot.setAttributeNS(null, 'fill', '#f00');

			svg.appendChild(dot);

			this.dots[this.dots.length] = dot;
		}

		/*
		 * Set initial positions
		 */
		for (let i = 0; i < newAX.length; i++) {
			this.dots[i].set('cx', curve.AX[i]);
			this.dots[i].set('cy', curve.AY[i]);
		}

		// attach mouse events
		for (let i = 0; i < newAX.length; i++) {
			this.dots[i].addEvent('mousedown', function (event) {
				event.stop();
				x0 = event.client.x;
				y0 = event.client.y;
				elx = this.get('cx') * 1;
				ely = this.get('cy') * 1;
				curel = this;
			});
			this.dots[i].addEvent('touchstart', function (event) {
				this.fireEvent('mousedown', event);
			});
		}
	}

}

if (typeof window === 'undefined') {
	let nodeCanvas = require('canvas');
	let fs = require('fs')

	let width = 500;
	let height = 500;

	// create the canvas
	let canvas = nodeCanvas.createCanvas(width, height);
	canvas.width = width;
	canvas.height = height;

	let ctx = canvas.getContext('2d')

	/*
 	 * Create bezier curve
 	 */
	let curve = new Curve();
	calcControlsClosed(curve.AX, curve.BX, curve.CX);
	calcControlsClosed(curve.AY, curve.BY, curve.CY);

	// draw
	curve.draw(ctx, 0, width, height);

	// draw dots
	ctx.beginPath();
	ctx.strokeStyle = "#f00";
	ctx.fillStyle = "#f00";
	for (let i = 0; i < curve.AX.length; i++) {
		ctx.moveTo(curve.AX[i], curve.AY[i]);
		ctx.arc(curve.AX[i], curve.AY[i], 8, 0, 2 * Math.PI);
	}
	ctx.fill();

	// save
	let buffer = canvas.toBuffer('image/png');
	fs.writeFileSync('resize.png', buffer);
}