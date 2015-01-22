var TRIGGER = 50,
	VELOCITY = 15,
	EASING_TIME = 250,
	PAGE_BUFFER = 50;

PageSlider = function(el, opts) {

	var _this = this;
		
	this.el = $(el);
	this.downArrow = el.find('.down.ps-arrow')
	this.upArrow = el.find('.up.ps-arrow')
	this.leftArrow = el.find('.left.ps-arrow')
	this.rightArrow = el.find('.right.ps-arrow')
	this.conveyor = this.el.children('#ps-conveyor');
	this.width = $(window).width();
	this.height = $(window).height();
	this.top = 0;
	this.left = 0;
	this.dragged = {
		top: 0,
		left: 0
	}
	this.bounds = {
		top: 0,
		left: 0,
		bottom: 0,
		right: 0
	}
	this.pages = [];
	this.pageInd = opts.pageInd || 0;

	opts.layout && _.each(opts.layout, function(subPageCount, ind) {
		var thisPage = new Page({ps: _this, ind: ind, subPageCount: subPageCount});
		_this.conveyor.append(thisPage.container);
		_this.pages.push(thisPage);
	});
	opts.seedTemplates && _.each(opts.seedTemplates, function(tempArray, ind) {
		_.each(tempArray, function(temp, subInd) {
			var data;
			if (opts.seedData) {
				if (opts.seedData.length) {
					data = opts.seedData[ind][subInd];
				}
				else {
					data = opts.seedData;
				}
			}
			_this.renderTo([ind, subInd], temp, data)
		});
	});
	this.pageCount = opts.layout && opts.layout.length;

	this.reposition(0);

};

PageSlider.prototype.renderTo = function(location, template, data) {
	var page = (location instanceof Array) ? location[0] : location;
	this.pages[page].renderTo(location[1], template, data);
}

PageSlider.prototype.transitionTo = function(location, template, data) {
	patchRendered(template, this.go.bind(this, location));
	this.renderTo.apply(this, arguments);
}

PageSlider.prototype.reposition = function(immediate, cb) {
	if (typeof immediate === 'function') {
		cb = immediate;
		immediate = false;
	}
	var newLeft = -this.width * this.pageInd,
		_this = this;

	if (newLeft !== this.left || this.dragged.left !== this.left) {
		this.left = newLeft;
		this.dragged.left = this.left;
		this.conveyor.snabbt({
			position: [this.left, this.top, 0],
			duration: immediate ? immediate : 1000,
			easing: 'ease',
			callback: function() {
				_this.pages[_this.pageInd].reposition(immediate, cb);
			}
		});
	} else {
		_this.pages[this.pageInd].reposition(immediate, cb);
	}

	if (this.loop || this.pageInd < this.pageCount - 1) {
		this.rightArrow.removeClass('disabled');
		this.bounds.right = this.left - this.width;
	}
	else {
		this.rightArrow.addClass('disabled');
		this.bounds.right = this.left - PAGE_BUFFER;
	}

	if (this.loop || this.pageInd > 0)  {
		this.leftArrow.removeClass('disabled');
		this.bounds.left = this.left + this.width;
	}
	else { 
		this.leftArrow.addClass('disabled');
		this.bounds.left = this.left + PAGE_BUFFER;
	}
}

PageSlider.prototype.realign = function(immediate) {
	this.pageInd = Math.min(Math.max(-Math.round(this.dragged.left / this.width), 0), this.pageCount - 1);
	this.reposition(immediate);
}

PageSlider.prototype.forward = function(loop) {
	this.pageInd++;
	if (this.pageInd >= this.pageCount) {
		if (loop) this.pageInd = 0;
		else this.pageInd = this.pageCount - 1;
	}
	this.reposition();
}

PageSlider.prototype.back = function(loop) {
	this.pageInd--;
	if (this.pageInd < 0) {
		if (loop) this.pageInd = this.pageCount - 1;
		else this.pageInd = 0;
	}
	this.reposition();
}

PageSlider.prototype.down = function(loop) {
	this.pages[this.pageInd] && this.pages[this.pageInd].down && this.pages[this.pageInd].down(loop);
}

PageSlider.prototype.up = function(loop) {
	this.pages[this.pageInd] && this.pages[this.pageInd].up && this.pages[this.pageInd].up(loop);
}

PageSlider.prototype.go = function(location, immediate) {
	var pageInd = location[0],
		subPageInd = location[1],
		newPage = this.pages[pageInd];
	if (newPage) this.pageInd = pageInd;

	var newSubPage = newPage.subPages[subPageInd];
	if (newSubPage) newPage.subPageInd = subPageInd;

	this.reposition(immediate);
}

Page = function(opts) {

	var _this = this;

	this.ps = opts.ps;
	this.ind = opts.ind;
	this.container = $('<div class="ps-page"></div>');
	this.subPages = [];
	this.subPageCount = opts.subPageCount;
	this.subPageInd = opts.subPageInd || 0;
	this.top = 0;
	this.left = 0;
	this.dragged = {
		top: 0,
		left: 0
	}
	this.container.css('left', this.ps.width * this.ind);

	for (var i = 0; i < opts.subPageCount; i++) {
		var thisSubPage = new SubPage({ps: _this.ps, page: _this, subInd: i});
		this.container.append(thisSubPage.container);
		_this.subPages.push(thisSubPage);
	}

};

Page.prototype.renderTo = function(location, template, data) {
	var subPage = location || 0;
	this.subPages[subPage].render(template, data);
}

Page.prototype.reposition = function(immediate, cb) {
	if (typeof immediate === 'function') {
		cb = immediate;
		immediate = false;
	}
	var ps = this.ps,
		newTop = -ps.height * this.subPageInd;

	if (newTop !== this.top || this.dragged.top !== this.top) {
		this.top = newTop;
		this.dragged.top = this.top;
		this.container.snabbt({
			position: [this.left, this.top, 0],
			duration: immediate ? immediate : 1000,
			easing: 'ease',
			callback: cb
		});
	}
	if (this.loop || this.subPageInd < this.subPageCount - 1) { 
		ps.downArrow.removeClass('disabled');
		ps.bounds.top = this.top - ps.height;
	}
	else {
		ps.downArrow.addClass('disabled');
		ps.bounds.top = this.top - PAGE_BUFFER;
	}
	if (this.loop || this.subPageInd > 0) {
		ps.upArrow.removeClass('disabled');
		ps.bounds.bottom = this.top + ps.height;
	}
	else { 
		ps.upArrow.addClass('disabled');
		ps.bounds.bottom = this.top + PAGE_BUFFER;
	}
}

Page.prototype.realign = function(immediate) {
	this.subPageInd = Math.min(Math.max(-Math.round(this.dragged.top / this.ps.height), 0), this.subPageCount - 1);
	this.reposition(immediate);
}

Page.prototype.down = function(loop) {
	this.subPageInd++;
	if (this.subPageInd >= this.subPageCount) {
		if (loop) this.subPageInd = 0;
		else this.subPageInd = this.subPageCount - 1;
	}
	this.reposition();
}

Page.prototype.up = function(loop) {
	this.subPageInd--;
	if (this.subPageInd < 0) {
		if (loop) this.subPageInd = this.subPageCount - 1;
		else this.subPageInd = 0;
	}
	this.reposition();
}

Page.prototype.setTo = function(subPage) {
	this.subPage = subPage;
	this.reposition();
}

SubPage = function(opts) {

	this.ps = opts.ps;
	this.page = opts.page;
	this.ind = this.page.ind;
	this.subInd = opts.subInd;
	this.container = $('<div class="ps-subpage"></div>');
	this.container.css('top', this.ps.height * this.subInd);

};

SubPage.prototype.render = function(template, data) {
	if (this.view) Blaze.remove(this.view);
	this.container.empty();
	var thisTemplate = (typeof template === 'string') ? Template[template] : template;
	if (!(thisTemplate instanceof Blaze.Template)) {
		console.error('Cannot render a non-template: ' + (template ? template.toString() : template));
		console.trace();
		return false;
	}
	if (data)
		Blaze.renderWithData(thisTemplate, data, this.container[0]);
	else
		Blaze.render(thisTemplate, this.container[0]);		
}

// **********************************

Template.pageSlider.events({
	'touchablemove #page-slider': function (evt, tp, touchable) {
		var ps = tp.ps,
			page = tp.ps.pages[tp.ps.pageInd];
		if (!tp.dragging) {
			if (distance(touchable.currentStartDelta) > TRIGGER) {
				tp.dragging = largerMag(touchable.currentStartDelta);
			}			
		} else if (tp.dragging === 'x') {
			ps.dragged.left = Math.min(Math.max(ps.left + touchable.currentStartDelta.x, ps.bounds.right), ps.bounds.left);
			ps.conveyor.snabbt({
				position: [ps.dragged.left, ps.dragged.top, 0],
				duration: 50,
				easing: 'linear'
			});
		} else if (tp.dragging === 'y') {
			page.dragged.top = Math.min(Math.max(page.top + touchable.currentStartDelta.y, ps.bounds.top), ps.bounds.bottom);
			page.container.snabbt({
				position: [page.dragged.left, page.dragged.top, 0],
				duration: 50,
				easing: 'linear'
			});
		}
	},
	'touchableend #page-slider': function (evt, tp, touchable) {
		if (!tp.dragging) return;
		var ps = tp.ps,
			page = tp.ps.pages[tp.ps.pageInd];
		if (tp.dragging === 'x') {
			ps.dragged.left = Math.min(Math.max(ps.left + touchable.currentStartDelta.x, ps.bounds.right), ps.bounds.left) + (touchable.currentDelta.x * VELOCITY);
			tp.ps.conveyor.snabbt({
				position: [ps.dragged.left, ps.dragged.top, 0],
				duration: EASING_TIME,
				easing: 'easeOut'
			});
			Meteor.setTimeout(ps.realign.bind(ps, EASING_TIME), EASING_TIME/2.5);
		} else if (tp.dragging === 'y') {
			page.dragged.top = Math.min(Math.max(page.top + touchable.currentStartDelta.y, ps.bounds.top), ps.bounds.bottom) + (touchable.currentDelta.y * VELOCITY);
			page.container.snabbt({
				position: [page.dragged.left, page.dragged.top, 0],
				duration: EASING_TIME,
				easing: 'easeOut'
			});
			Meteor.setTimeout(page.realign.bind(page, EASING_TIME), EASING_TIME/2.5);	
		}
		tp.dragging = false;
	},
	'click .down.ps-arrow': function(evt, tp) {
		tp.ps.pages[tp.ps.pageInd].down();
	},
	'click .up.ps-arrow': function(evt, tp) {
		tp.ps.pages[tp.ps.pageInd].up();
	},
	'click .left.ps-arrow': function(evt, tp) {
		tp.ps.back();
	},
	'click .right.ps-arrow': function(evt, tp) {
		tp.ps.forward();
	}
});

Template.pageSlider.created = function() {
	this.dragging = false;
}

Template.pageSlider.rendered = function() {

	var opts = (this.data && this.data.options) || {},
		$el = this.$('#page-slider');

	this.ps = new PageSlider($el, opts);
	PageSlider.active = this.ps;
	$el.Touchable();

}

function patchRendered(template, cb) {

	var thisTemplate = (typeof template === 'string') ? Template[template] : template;
	if (!(thisTemplate instanceof Blaze.Template)) throw new Meteor.Error('bad_template', 'Cannot render a non-template', template);

	if (!thisTemplate) throw new Meteor.Error('bad_template', 'No template called ' + template + '; cannot patch.');

	var oldRendered = thisTemplate.rendered;
	thisTemplate.rendered = function() {		
		oldRendered && oldRendered.apply(this, arguments);
		thisTemplate.rendered = oldRendered;
		cb && cb.apply(this, arguments);
	}

}

function distance(vector) {
	return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
}

function largerMag(vector) {
	return Math.abs(vector.x) > Math.abs(vector.y) ? 'x' : 'y';
}