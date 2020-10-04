"use strict";


/*
	https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf

	node --max-old-space-size=8192 load.js
 */
const nodeTM = require("./jsTransverseMercator.js");

const nodeFs = require('fs');
const nodeCanvas = require('canvas');

let dataX = [];
let dataY = [];

if (false) {
	const data = nodeFs.readFileSync('gadm36_0.shp');

	let pos = 100; // skip header of file
	let lonMin = 0, lonMax = 0, latMin = 0, latMax = 0;
	let count = 0;
	let res = 10000;

	let lastRowX = 0, lastColX = 0;
	let lastRowY = 0, lastColY = 0;

	// load records
	for (let iRecord = 0; pos < data.length; iRecord++) {

		// read header
		let recordNumber = data.readInt32BE(pos);
		pos += 4;
		let contentLength = data.readInt32BE(pos);
		pos += 4;
		let shapeType = data.readInt32LE(pos);
		pos += 4;
		// console.log(iRecord, recordNumber, contentLength, shapeType, pos);

		// expect only polygons
		if (shapeType !== 5) {
			console.log("Unsupported shapeType: ", shapeType);
			process.exit();
		}
		// read header
		let xmin = data.readDoubleLE(pos);
		pos += 8;
		let ymin = data.readDoubleLE(pos);
		pos += 8;
		let xmax = data.readDoubleLE(pos);
		pos += 8;
		let ymax = data.readDoubleLE(pos);
		pos += 8;
		let numParts = data.readInt32LE(pos);
		pos += 4;
		let numPoints = data.readInt32LE(pos);
		pos += 4;
		// console.log(xmin, ymin, xmax, ymax, numParts, numPoints);

		// load parts/points
		let parts = [];
		parts.length = numParts;
		for (let i = 0; i < numParts; i++) {
			parts[i] = data.readInt32LE(pos);
			pos += 4;
		}

		let pointsX = [];
		let pointsY = [];
		pointsX.length = numPoints;
		pointsY.length = numPoints;
		for (let i = 0; i < numPoints; i++) {
			pointsX[i] = data.readDoubleLE(pos);
			pos += 8;
			pointsY[i] = data.readDoubleLE(pos);
			pos += 8;
		}

		// construct result
		for (let i = 0; i < numParts; i++) {

			let polyX = [];
			let polyY = [];
			let jMin = parts[i];
			let jMax = (i === numParts - 1) ? numPoints : parts[i + 1];

			for (let j = jMin; j < jMax; j++) {
				// convert to x, y
				let x = pointsX[j];
				let y = pointsY[j];

				latMin = Math.min(latMin, y);
				latMax = Math.max(latMax, y);
				lonMin = Math.min(lonMin, x);
				lonMax = Math.max(lonMax, x);

				// scale to 0<=x<=1 of integer range
				let scaledX = Math.round((x + 180) / 360 * res);
				let scaledY = Math.round((y + 90) / 180 * res);

				const dx = scaledX - lastColX;
				const dy = scaledY - lastColY
				if (dx || dy) {
					if (polyX.length === 0) {
						polyX.push(scaledX - lastRowX);
						polyY.push(scaledY - lastRowY);
						lastRowX = scaledX;
						lastRowY = scaledY;
					} else if (dx || dy) {
						polyX.push(dx);
						polyY.push(dy);
					}
					lastColX = scaledX;
					lastColY = scaledY;
					count++;
				}
			}

			if (polyX.length) {
				dataX.push(polyX);
				dataY.push(polyY);
			}
		}
	}

	// create data description
	let contents = {count: count, res: res, latMin: latMin, latMax: latMax, lonMin: lonMin, lonMax: lonMax};
	console.log(JSON.stringify(contents));
	// add vertices
	contents.dataX = dataX;
	contents.dataY = dataY;

	// write
	nodeFs.writeFileSync("./loaddata.json", JSON.stringify(contents), "binary");
	process.exit();

} else {
	const contents = require("./loaddata.json");
	dataX = contents.dataX;
	dataY = contents.dataY;

	contents.dataX = undefined;
	contents.dataY = undefined;
	console.log(JSON.stringify(contents));

	let res = contents.res;

	// unpack data
	let lastRowX = 0, lastRowY = 0;
	for (let i = 0; i < dataX.length; i++) {
		const shapeLat = dataY[i];
		const shapeLon = dataX[i];

		let lat, lon;
		for (let j = 0; j < shapeLat.length; j++) {
			if (j === 0) {
				lastRowX += shapeLat[j];
				lastRowY += shapeLon[j];
				lat = lastRowX;
				lon = lastRowY;
			} else {
				lat += shapeLat[j];
				lon += shapeLon[j];
			}

			// convert
			shapeLat[j] = (lat / res * 180) - 90;
			shapeLon[j] = (lon / res * 360) - 180;
		}
	}
}

if (0) {
	let now = Date.now;
	let total = 0;

	// determine the limit for a 1-second burst
	let limit = 25000; // loop upper limit1
	for (let k = 0; k < 16; k++) {
		const stime = now();
		for (let k = 0; k < limit; k++)
			tm.Forward(42, 42);
		const etime = now();

		// scale limit for a better match
		limit = Math.round(limit * 1000 / (etime - stime));
	}
}

let lonMin = 0, lonMax = 0, latMin = 0, latMax = 0;
if (0) {
	for (let i = 0; i < dataX.length; i++) {
		const shapeLon = dataX[i];
		const shapeLat = dataY[i];

		for (let j = 0; j < shapeLon.length; j++) {
			let lon = shapeLon[j];
			let lat = shapeLat[j];

			lonMin = Math.min(lonMin, lon);
			lonMax = Math.max(lonMax, lon);
			latMin = Math.min(latMin, lat);
			latMax = Math.max(latMax, lat);
		}
	}
	console.log(lonMin, lonMax, latMin, latMax);
	process.exit();
}
if (0) {
	let stime = Date.now();
	let count = 0;
	for (let i = 0; i < dataX.length; i++) {
		const shapeLon = dataX[i];
		const shapeLat = dataY[i];

		for (let j = 0; j < shapeLon.length; j++) {
			let lon = shapeLon[j];
			let lat = shapeLat[j];

			let {x, y} = tm.Forward(lat, lon);
			lonMin = Math.min(lonMin, x);
			lonMax = Math.max(lonMax, x);
			latMin = Math.min(latMin, y);
			latMax = Math.max(latMax, y);
			count++;
		}
	}
	let etime = Date.now();
	console.log(etime - stime, count, count / (etime - stime));
	console.log(lonMin, lonMax, latMin, latMax);
	// 373742 32827127 87.83365797796341
	// -25683468.0650918 18848557.628860917 -19995929.886042 19995928.931391288

	// 14312 1308945 91.45786752375629
	// -25668194.901185784 18845553.886777375 -19995844.642196625 19995799.368147697

}

const width = 480;
const height = 480;
let lastX = 0, lastY = 0;
let scaleW = width / (26000000 * 1.05) / 2;
let scaleH = height / (20000000 * 1.05) / 2; // 5% border
let halfWidth = width / 2;
let halfHeight = height / 2;

console.log("loaded");

// create the canvas
const canvas = nodeCanvas.createCanvas(width, height)
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext('2d')

/*
 * Request leading zero's
 */
Number.prototype.pad = function (size) {
	let s = String(this);
	while (s.length < (size || 2))
		s = "0" + s;
	return s;
}

let framenr = 0;
let lon0 = 0;
let k0 = 0;
let tm = new nodeTM.TransverseMercator(k0);

// for (let k0=1; k0<20; k0+=0.05) {
for (let lon0 = 0; lon0 < 360; lon0 += 1) {
	if (process.argv.length > 2 && process.argv[2] && (framenr % 8) !== parseInt(process.argv[2])) {
		framenr++;
		continue;
	}

	// tm = new nodeTM.TransverseMercator(k0);

	// get pole coordinates
	let {x: northX, y: northY} = tm.Forward(+90, 0);
	northX = Math.round(northX * scaleW + halfWidth);
	northY = Math.round(northY * scaleH + halfHeight);
	let {x: southX, y: southY} = tm.Forward(-90, 0);
	southX = Math.round(southX * scaleW + halfWidth);
	southY = Math.round(southY * scaleH + halfHeight);
	// console.log(northX, northY, southX, southY);

	// erase canvas
	ctx.fillStyle = '#fff'
	ctx.fillRect(0, 0, width, height)

	// draw guidelines first as background
	let count3 = 0;
	ctx.strokeStyle = '#0f0';
	ctx.fillStyle = '#0f0'
	if(0)for (let lat = -90 + 15; lat <= +90 - 15; lat += 15) {
		for (let lon = -180; lon <= +180; lon += .1) {
			let {x, y} = tm.Forward(lat, lon, lon0);

			// change sign latitude for drawing
			y = -y;

			x = Math.round(x * scaleW + halfWidth);
			y = Math.round(y * scaleH + halfHeight);

			ctx.fillRect(x, y, 1, 1);
			count3++;
		}
	}
	if(0)for (let lon = -180; lon <= +180; lon += 15) {
		let latMargin;
		if ((lon + 180) % 60 === 0)
			latMargin = 0;
		else if ((lon + 180) % 30 === 0)
			latMargin = 15;
		else
			latMargin = 30;
		for (let lat = -90 + latMargin; lat <= +90 - latMargin; lat += .1) {
			let {x, y} = tm.Forward(lat, lon, lon0);

			// change sign latitude for drawing
			y = -y;

			x = Math.round(x * scaleW + halfWidth);
			y = Math.round(y * scaleH + halfHeight);

			ctx.fillRect(x, y, 1, 1);
			count3++;
		}
	}
	// console.log(count3); // 113444

	// walk shapes
	let pt = 0;
	for (let i = 0; i < dataX.length; i++) {
		const shapeLat = dataY[i];
		const shapeLon = dataX[i];
		// console.log(i, shapeLon.length);

		// display shape
		ctx.strokeStyle = '#000';
		ctx.fillStyle = '#000'

		for (let j = 0; j < shapeLon.length; j++) {
			let lon = shapeLon[j];
			let lat = shapeLat[j];

			let {x, y} = tm.Forward(lat, lon, lon0);
			pt++;

			if (x < -26000000 || x > +26000000 || y < -21000000 || y > +21000000) {
				console.log('err', x, y, lat, lon, lon0, k0);
			} else {
				latMin = Math.min(latMin, y);
				latMax = Math.max(latMax, y);
				lonMin = Math.min(lonMin, x);
				lonMax = Math.max(lonMax, x);
			}

			// change sign latitude for drawing
			y = -y;

			x = Math.round(x * scaleW + halfWidth);
			y = Math.round(y * scaleH + halfHeight);

			if (x !== lastX || y !== lastY) {
				ctx.fillRect(x, y, 1, 1);

				lastX = x;
				lastY  = y;
			}
		}
	}

	const buffer = canvas.toBuffer('image/png')
	nodeFs.writeFileSync('load8-480x480@15-' + framenr.pad(3) + '.png', buffer);
	framenr++;
	console.log(lon0, k0, lonMin, lonMax, latMin, latMax, pt);
}

// save
// nodeFs.writeFileSync('load.png', buffer)

