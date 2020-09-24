/*
 * UI pads to manipulate curves.
 */

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

function Pads(svg, onMove) {

	this.pads = [];

	let x0 = 0;
	let y0 = 0;
	let elx = undefined;
	let ely = undefined;
	let curel = undefined;

	document.body.addEvent("mousemove", function (event) {
		if (typeof curel !== "undefined") {
			let x = elx + event.client.x - x0;
			let y = ely + event.client.y - y0;
			if (x < 0) x = 0;
			if (y < 0) y = 0;

			// don't move pad outside svg
			let width = svg.clientWidth;
			let height = svg.clientHeight;
			if (x >= width) x = width - 1;
			if (y >= height) y = height - 1;

			// position element
			curel.set("cx", x);
			curel.set("cy", y);

			// extract index from id
			let i = parseInt(curel.id.substring(3));

			// callback
			onMove(i, x, y);
		}
	});
	document.body.addEvent("mouseup", function (event) {
		curel = undefined;
	});
	document.body.addEvent("touchmove", function (event) {
		this.fireEvent("mousemove", event);
	});
	document.body.addEvent("touchend", function (event) {
		this.fireEvent("mouseup", event);
	});

	this.updatePads = function (newAX, newAY) {

		/*
		 * Remove excess pads
		 */
		while (this.pads.length > newAX.length) {
			let dot = this.pads.pop();
			dot.removeEvents();
			dot.remove();
		}

		/*
		 * create new pads
		 */
		while (this.pads.length < newAX.length) {
			let dot = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");

			dot.setAttributeNS(null, "id", "dot" + this.pads.length);
			dot.setAttributeNS(null, "rx", "10");
			dot.setAttributeNS(null, "ry", "10");
			dot.setAttributeNS(null, "stroke", "none");
			dot.setAttributeNS(null, "fill", "#f00");

			svg.appendChild(dot);

			this.pads[this.pads.length] = dot;
		}

		/*
		 * Set initial positions
		 */
		for (let i = 0; i < newAX.length; i++) {
			this.pads[i].set("cx", userCurve.AX[i]);
			this.pads[i].set("cy", userCurve.AY[i]);
		}

		// attach mouse events
		for (let i = 0; i < newAX.length; i++) {
			this.pads[i].addEvent("mousedown", function (event) {
				event.stop();
				x0 = event.client.x;
				y0 = event.client.y;
				elx = this.get("cx") * 1;
				ely = this.get("cy") * 1;
				curel = this;
			});
			this.pads[i].addEvent("touchstart", function (event) {
				this.fireEvent("mousedown", event);
			});
		}
	}

}
