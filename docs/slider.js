/*
 * This is a project generic two part slider, it has a shadow knob (bonk) which is used to visually check that
 * the timer routine does not pull to much CPU.
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

let MySlider = new Class({

	Implements: [Events, Options],

	Binds: ['clickedElement', 'draggedKnob'],

	options: {/*
		onTick: function(intPosition){},
		onChange: function(intStep){},
		onComplete: function(strStep){},*/
		onTick: function (position) {
			this.setKnobPosition(position);
		},
		offset: 0,
		range: false,
		steps: 1,
		mode: 'horizontal',
		initialStep: 1
	},

	initialize: function (element, knob, bonk, options) {
		this.setOptions(options);
		options = this.options;
		this.element = document.id(element);
		this.knob = knob;
		this.bonk = bonk;
		this.bonk.lastpos = this.step = options.initialStep;
		this.previousChange = this.previousEnd = -1;
		this.timer = null;

		let limit = {},
			modifiers = {x: false, y: false};

		switch (options.mode) {
			case 'vertical':
				this.axis = 'y';
				this.property = 'top';
				this.offset = 'offsetHeight';
				break;
			case 'horizontal':
				this.axis = 'x';
				this.property = 'left';
				this.offset = 'offsetWidth';
		}

		this.setSliderDimensions();
		this.setRange(options.range);

		if (knob.getStyle('position') == 'static') knob.setStyle('position', 'relative');
		knob.setStyle(this.property, -options.offset);
		modifiers[this.axis] = this.property;
		limit[this.axis] = [-options.offset, this.full - options.offset];

		// set initial positions
		this.set(options.initialStep);
		bonk.style.left = knob.style.left;

		let dragOptions = {
			snap: 0,
			limit: limit,
			modifiers: modifiers,
			onDrag: this.draggedKnob,
			onStart: this.draggedKnob,
			onBeforeStart: (function () {
				this.isDragging = true;
			}).bind(this),
			onCancel: function () {
				this.isDragging = false;
			}.bind(this),
			onComplete: function () {
				this.isDragging = false;
				this.draggedKnob();
				this.end();
			}.bind(this)
		};

		this.drag = new Drag(knob, dragOptions);
		this.attach();
	},

	attach: function () {
		this.element.addEvent('mousedown', this.clickedElement);
		this.drag.attach();
		return this;
	},

	detach: function () {
		this.element.removeEvent('mousedown', this.clickedElement);
		this.drag.detach();
		return this;
	},

	setKnobPosition: function (position) {
		this.knob.setStyle(this.property, position + 'px');
		return this;
	},

	setSliderDimensions: function () {
		this.full = this.element.measure(function () {
			this.half = this.knob[this.offset] / 2;
			return this.element[this.offset] - this.knob[this.offset] + (this.options.offset * 2);
		}.bind(this));
		return this;
	},

	set: function (step) {
		if (!((this.range > 0) ^ (step < this.min))) step = this.min;
		if (!((this.range > 0) ^ (step > this.max))) step = this.max;

		this.step = Math.round(step);
		return this.checkStep()
			.fireEvent('tick', this.toPosition(this.step))
			.end();
	},

	setRange: function (range, pos) {
		this.min = Array.pick([range[0], 0]);
		this.max = Array.pick([range[1], this.options.steps]);
		this.range = this.max - this.min;
		this.steps = this.options.steps || this.full;
		this.stepSize = Math.abs(this.range) / this.steps;
//		if (range) this.set(Array.pick([pos, this.step]).floor(this.min).max(this.max));
		return this;
	},

	setTimer: function (t) {
		t.timer = setTimeout(function () {
			// position bonk to next increment
			let delta = (t.nextpos - t.bonk.lastpos) * (t.nextpos - t.bonk.lastpos) / 100;
			if (delta < 0.01) delta = 0.01;

			if (t.nextpos - t.bonk.lastpos > 0)
				t.bonk.lastpos = t.bonk.lastpos + delta;
			else
				t.bonk.lastpos = t.bonk.lastpos - delta;

			t.bonk.setStyle(t.property, Math.floor(t.bonk.lastpos + 0.5));
			let dir = t.range < 0 ? -1 : 1;

			t.step = Math.round(t.min + dir * t.toStep(t.bonk.lastpos));
			t.checkStep();

			if (Math.abs(t.nextpos - t.bonk.lastpos) >= 0.1)
				t.setTimer(t);
			else
				t.timer = null;
		}, 20);
	},

	clickedElement: function (event) {
		if (this.isDragging || event.target == this.knob) return;

		let dir = this.range < 0 ? -1 : 1,
			position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;

		position = position.limit(-this.options.offset, this.full - this.options.offset);

		this.nextpos = position;
		if (!this.timer) this.setTimer(this);

		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep()
			.fireEvent('tick', position)
			.end();
	},

	draggedKnob: function () {
		let dir = this.range < 0 ? -1 : 1,
			position = this.drag.value.now[this.axis];

		position = position.limit(-this.options.offset, this.full - this.options.offset);

		this.nextpos = position;
		if (!this.timer) this.setTimer(this);

//		this.step = Math.round(this.min + dir * this.toStep(position));
//		this.checkStep();
	},

	checkStep: function () {
		if (this.previousChange !== this.step) {
			this.previousChange = this.step;
			this.fireEvent('change', this.step);
		}
		return this;
	},

	end: function () {
		if (this.previousEnd !== this.step) {
			this.previousEnd = this.step;
			this.fireEvent('complete', this.step + '');
		}
		return this;
	},

	toStep: function (position) {
		let step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
		return this.options.steps ? Math.round(step -= step % this.stepSize) : step;
	},

	toPosition: function (step) {
		return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset;
	}

});