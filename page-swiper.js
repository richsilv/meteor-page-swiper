var TRIGGER = 50,
	VELOCITY = 15,
	EASING_TIME = 250,
	PAGE_BUFFER = 50;

PageSwiper = function(el, opts) {

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
	};
	this.bounds = {
		top: 0,
		left: 0,
		bottom: 0,
		right: 0
	};
	this.pages = [];
	this.pageInd = opts.pageInd || 0;
	this.layoutTemplate = Template[opts.layoutTemplate];
	this.opts = opts;
	this.locationDep = new Tracker.Dependency();

	if (opts.configuration)
		_.extend(opts, buildTemplate(opts.configuration));

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
	this.prevLocation = this.getLocation();

	this.publicObj = function() {
		return {
			renderTo: _this.renderTo.bind(_this),
			transitionTo: _this.transitionTo.bind(_this),
			moveRight: _this.moveRight.bind(_this),
			moveLeft: _this.moveLeft.bind(_this),
			moveUp: _this.moveUp.bind(_this),
			moveDown: _this.moveDown.bind(_this),
			go: _this.go.bind(_this),
			getLocation: _this.getLocation.bind(_this),
			page: _this.page.bind(_this),
			getPageInd: _this.getPageInd.bind(_this),
			subPage: _this.subPage.bind(_this),
			getSubPageInd: _this.getSubPageInd.bind(_this),
			setMoveable: _this.setMoveable.bind(_this),
			getLocation: _this.getLocation.bind(_this),
			current: function() {
				return _this;
			},
			getPage: function(page) {
				return _this.pages[page];
			},
			getSubPage: function(location, extraArg) {
				if (extraArg) location = [location, extraArg];
				var page = _this.pages[location[0]];
				return page && page.subPages[location[1]];
			},
			pageRight: function() {
				var loc = _this.getLocation();
				if (loc[0] < _this.pageCount - 1) 
					return [loc[0] + 1, _this.pages[loc[0] + 1].getSubPageInd()];
			},
			pageLeft: function() {
				var loc = _this.getLocation();
				if (loc[0] > 0) 
					return [loc[0] - 1, _this.pages[loc[0] - 1].getSubPageInd()];
			}
		}
	}
};

PageSwiper.prototype.renderTo = function(location, template, data) {
	var page = (location instanceof Array) ? location[0] : location;
	this.pages[page].renderTo(location[1], template, data);
}

PageSwiper.prototype.transitionTo = function(location, template, data, waitOn) {
	patchRendered(template, this.waitThenGo.bind(this, location, waitOn));
	this.renderTo.apply(this, arguments);
}

PageSwiper.prototype.reposition = function(immediate, cb) {
	if (typeof immediate === 'function') {
		cb = immediate;
		immediate = false;
	}
	var newLeft = -this.width * this.pageInd,
		_this = this,
		page = this.page(),
		subPage = this.subPage(),
		moved = false,
		arrowCol = subPage.arrowCol || page.arrowCol || this.arrowCol || 'white';

	if (newLeft !== this.left) moved = true;

	if (newLeft !== this.left || this.dragged.left !== this.left) {
		this.left = newLeft;
		this.dragged.left = this.left;
		this.conveyor.snabbt({
			position: [this.left, this.top, 0],
			duration: immediate ? immediate : 1000,
			easing: 'ease',
			callback: function() {
				_this.pages[_this.pageInd].reposition(immediate, cb, moved);
			}
		});
	} else {
		_this.pages[this.pageInd].reposition(immediate, cb, moved);
	}

	if ((this.loop || this.pageInd < this.pageCount - 1) && subPage.moveable.right) {
		this.rightArrow.removeClass('disabled');
		this.bounds.right = this.left - this.width;
	}
	else {
		this.rightArrow.addClass('disabled');
		this.bounds.right = this.left - PAGE_BUFFER;
	}

	if ((this.loop || this.pageInd > 0) && subPage.moveable.left)  {
		this.leftArrow.removeClass('disabled');
		this.bounds.left = this.left + this.width;
	}
	else { 
		this.leftArrow.addClass('disabled');
		this.bounds.left = this.left + PAGE_BUFFER;
	}
}

PageSwiper.prototype.realign = function(immediate) {
	this.pageInd = Math.min(Math.max(-Math.round(this.dragged.left / this.width), 0), this.pageCount - 1);
	this.reposition(immediate);
}

PageSwiper.prototype.moveRight = function(loop) {
	var subPage = this.subPage();
	if (!subPage.moveable.right) return null;
	this.pageInd++;
	if (this.pageInd >= this.pageCount) {
		if (loop) this.pageInd = 0;
		else this.pageInd = this.pageCount - 1;
	}
	this.reposition();
}

PageSwiper.prototype.moveLeft = function(loop) {
	var subPage = this.subPage();
	if (!subPage.moveable.left) return null;
	this.pageInd--;
	if (this.pageInd < 0) {
		if (loop) this.pageInd = this.pageCount - 1;
		else this.pageInd = 0;
	}
	this.reposition();
}

PageSwiper.prototype.moveDown = function(loop) {
	this.page() && this.page().moveDown(loop);
}

PageSwiper.prototype.moveUp = function(loop) {
	this.page() && this.page().moveUp(loop);
}

PageSwiper.prototype.go = function(location, immediate) {
	var pageInd = location[0],
		subPageInd = location[1],
		newPage = this.pages[pageInd];
	if (newPage) this.pageInd = pageInd;

	var newSubPage = newPage.subPages[subPageInd];
	if (newSubPage) newPage.subPageInd = subPageInd;

	this.reposition(immediate);
}

PageSwiper.prototype.nudge = function(location) {
	if (location[0] > this.pageInd) this.dragged.left = this.left - PAGE_BUFFER;
	else if (location[0] < this.pageInd) this.dragged.left = this.left + PAGE_BUFFER;
	else {
		this.page().nudge(location);
		return null;
	}

	this.conveyor.snabbt({
		position: [this.dragged.left, this.dragged.top, 0],
		duration: EASING_TIME,
		easing: 'easeOut'
	});
}

PageSwiper.prototype.waitThenGo = function(location, waitOn) {
	var _this = this;
	if (!waitOn) {
		this.go.call(this, location);
		return location;
	}
	else if (!(waitOn instanceof Array)) waitOn = [waitOn];

	this.nudge(location);
	Tracker.autorun(function(c) {
		ready = _.reduce(waitOn, function(readySoFar, thisWait) {
			return readySoFar && thisWait.ready && thisWait.ready();
		}, true);
		if (ready) {
			c.stop();
			_this.go.call(_this, location);
		}
	});
}

PageSwiper.prototype.getLocation = function(modifier) {
	var page = this.page(),
		subPage = this.subPage();

	this.locationDep.depend();

	if (modifier === 'page') return this.pageInd;

	if (modifier === 'subPage') return page.subPageInd;
	else return [this.pageInd, page.subPageInd];
}

PageSwiper.prototype.page = function() {
	return this.pages[this.pageInd];
}

PageSwiper.prototype.getPageInd = function() {
	return this.pageInd;
}

PageSwiper.prototype.subPage = function() {
	return this.page().subPage();
}

PageSwiper.prototype.getSubPageInd = function() {
	return this.page().subPageInd;
}

PageSwiper.prototype.setMoveable = function(dir, bool) {
	if (typeof dir === 'boolean') {
		this.page().setMoveable(bool);
		this.subPage().setMoveable(bool);
	} else if (dir === 'left' || dir === 'right') {
		this.page().setMoveable(dir, bool);
	} else if (dir === 'up' || dir === 'down') {
		this.subPage().setMoveable(dir, bool);;
	}
}

PageSwiper.prototype.resize = function() {
	this.width = $(window).width();
	this.height = $(window).height();
	this.reposition();
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
	};
	this.moveable = {
		left: true,
		right: true
	};
	this.position();

	for (var i = 0; i < opts.subPageCount; i++) {
		var thisSubPage = new SubPage({ps: _this.ps, page: _this, subInd: i});
		this.container.append(thisSubPage.container);
		_this.subPages.push(thisSubPage);
	}

};

Page.prototype.position = function() {
	this.container.css('left', 100 * this.ind + '%');	
}

Page.prototype.renderTo = function(location, template, data) {
	var subPage = location || 0;
	this.subPages[subPage].render(template, data);
}

Page.prototype.reposition = function(immediate, cb, moved) {
	if (typeof immediate === 'function') {
		cb = immediate;
		immediate = false;
	}
	var _this = this,
		ps = this.ps,
		newTop = -ps.height * this.subPageInd,
		subPage = this.subPage(),
		arrowCol = subPage.arrowCol || this.arrowCol || this.ps.arrowCol || 'white';
		wrappedCb = function() {
			if (moved) {
				_this.subPage().onTransitioned && _this.subPage().onTransitioned(_this.ps.prevLocation, _this.ps.getLocation());
				_this.onTransitioned && _this.onTransitioned(_this.ps.prevLocation, _this.ps.getLocation());
				_this.ps.onTransitioned && _this.ps.onTransitioned(_this.ps.prevLocation, _this.ps.getLocation());
				_this.ps.prevLocation = _this.ps.getLocation();
				_this.ps.locationDep.changed();
			} 
			cb && cb();
		};

	if (newTop !== this.top) moved = true;

	if (newTop !== this.top || this.dragged.top !== this.top) {
		this.top = newTop;
		this.dragged.top = this.top;
		this.container.snabbt({
			position: [this.left, this.top, 0],
			duration: immediate ? immediate : 1000,
			easing: 'ease',
			callback: wrappedCb
		});
	} else {
		wrappedCb();
	}
	if ((this.loop || this.subPageInd < this.subPageCount - 1) && subPage.moveable.down) { 
		ps.downArrow.removeClass('disabled');
		ps.bounds.top = this.top - ps.height;
	}
	else {
		ps.downArrow.addClass('disabled');
		ps.bounds.top = this.top - PAGE_BUFFER;
	}
	if ((this.loop || this.subPageInd > 0) && subPage.moveable.up) {
		ps.upArrow.removeClass('disabled');
		ps.bounds.bottom = this.top + ps.height;
	}
	else { 
		ps.upArrow.addClass('disabled');
		ps.bounds.bottom = this.top + PAGE_BUFFER;
	}
	if (arrowCol) {
		$('.ps-arrow.up').css('border-bottom-color', arrowCol);
		$('.ps-arrow.down').css('border-top-color', arrowCol);
		$('.ps-arrow.left').css('border-right-color', arrowCol);
		$('.ps-arrow.right').css('border-left-color', arrowCol);
	}
}

Page.prototype.realign = function(immediate) {
	this.subPageInd = Math.min(Math.max(-Math.round(this.dragged.top / this.ps.height), 0), this.subPageCount - 1);
	this.ps.reposition(immediate);
}

Page.prototype.moveDown = function(loop) {
	var subPage = this.subPage();
	if (!subPage.moveable.down) return null;
	this.subPageInd++;
	if (this.subPageInd >= this.subPageCount) {
		if (loop) this.subPageInd = 0;
		else this.subPageInd = this.subPageCount - 1;
	}
	this.ps.reposition();
}

Page.prototype.moveUp = function(loop) {
	var subPage = this.subPage();
	if (!subPage.moveable.up) return null;
	this.subPageInd--;
	if (this.subPageInd < 0) {
		if (loop) this.subPageInd = this.subPageCount - 1;
		else this.subPageInd = 0;
	}
	this.ps.reposition();
}

Page.prototype.nudge = function(location) {
	if (location[1] > this.subPageInd) this.dragged.top = this.top + PAGE_BUFFER;
	else if (location[1] < this.subPageInd) this.dragged.top = this.top - PAGE_BUFFER;
	else return null;

	this.container.snabbt({
		position: [this.dragged.left, this.dragged.top, 0],
		duration: EASING_TIME,
		easing: 'easeOut'
	});
}

Page.prototype.setTo = function(subPage) {
	this.subPage = subPage;
	this.reposition();
}

Page.prototype.subPage = function() {
	return this.subPages[this.subPageInd];
}

Page.prototype.getSubPageInd = function() {
	return this.subPageInd;
}

Page.prototype.setMoveable = function(dir, bool) {
	if (typeof dir === 'boolean') {
		this.moveable = {
			left: bool,
			right: bool
		};
	} else if (dir === 'right' || dir === 'left') {
		this.moveable[dir] = bool;
	}
	this.ps.reposition(0);
}

SubPage = function(opts) {

	this.ps = opts.ps;
	this.page = opts.page;
	this.ind = this.page.ind;
	this.subInd = opts.subInd;
	if (this.ps.opts.moveableArray &&
		this.ps.opts.moveableArray[this.ind] &&
		this.ps.opts.moveableArray[this.ind][this.subInd])
		this.moveable = this.ps.opts.moveableArray[this.ind][this.subInd];
	else this.moveable = {
		up: true,
		down: true,
		left: true,
		right: true
	};
	this.container = $('<div class="ps-subpage"></div>');
	this.position();
	if (this.ps.opts.layoutClasses && this.ps.opts.layoutClasses[this.ind])
		this.layoutClass = this.ps.opts.layoutClasses[this.ind][this.subInd];
	if (this.ps.opts.onTransitionedArray && this.ps.opts.onTransitionedArray[this.ind])
		this.onTransitioned = this.ps.opts.onTransitionedArray[this.ind][this.subInd];
	if (this.ps.opts.dataArray && this.ps.opts.dataArray[this.ind])
		this.data = this.ps.opts.dataArray[this.ind][this.subInd];
	if (this.ps.opts.arrowColArray && this.ps.opts.arrowColArray[this.ind])
		this.arrowCol = this.ps.opts.arrowColArray[this.ind][this.subInd];	
};

SubPage.prototype.position = function() {
	this.container.css('top', 100 * this.subInd + '%');
}

SubPage.prototype.render = function(template, data) {
	if (this.view) Blaze.remove(this.view);
	this.container.empty();

	var thisTemplate = (typeof template === 'string') ? Template[template] : template;
	
	templateData = _.extend({}, this.data, data, {subPage: this});

	if (this.ps.layoutTemplate) {
		this.view = Blaze.renderWithData(this.ps.layoutTemplate, {
			pageSwiper: this.ps,
			template: template,
			data: templateData			
		}, this.container[0]);
	} else if (thisTemplate) {
		this.view = Blaze.renderWithData(thisTemplate, templateData, this.container[0]);
	}

	if (this.ps.layoutTemplate && this.layoutClass) {
		this.container.find('[data-ps="layout"]').addClass(this.layoutClass);
	}
}

SubPage.prototype.setMoveable = function(dir, bool) {
	if (typeof dir === 'boolean') {
		this.moveable = {
			up: bool,
			down: bool,
			left: bool,
			right: bool
		};
	} else if (dir === 'up' || dir === 'down' || dir === 'left' || dir === 'right') {
		this.moveable[dir] = bool;
	}
	this.ps.reposition(0);
}

// **********************************

var transitionMap = {
	37: {
			func: 'moveLeft',
			moveable: 'left'
		},
	38: {
			func: 'moveUp',
			moveable: 'up'
		},
	39: {
			func: 'moveRight',
			moveable: 'right'
		},
	40: {
			func: 'moveDown',
			moveable: 'down'
		}
};

Template.pageSwiper.events({
	'touchablemove #page-swiper': function (evt, tp, touchable) {
		var ps = tp.ps,
			page = tp.ps.pages[tp.ps.pageInd];
		if (!tp.dragging) {
			if (distance(touchable.currentStartDelta) > TRIGGER) {
				tp.dragging = largerMag(touchable.currentStartDelta);
			}			
		} else if (tp.dragging === 'x') {
			ps.dragged.left = bound(ps.left + touchable.currentStartDelta.x, ps.bounds.left, ps.bounds.right);
			ps.conveyor.snabbt({
				position: [ps.dragged.left, ps.dragged.top, 0],
				duration: 50,
				easing: 'linear'
			});
		} else if (tp.dragging === 'y') {
			page.dragged.top = bound(page.top + touchable.currentStartDelta.y, ps.bounds.bottom, ps.bounds.top);
			page.container.snabbt({
				position: [page.dragged.left, page.dragged.top, 0],
				duration: 50,
				easing: 'linear'
			});
		}
	},
	'touchableend #page-swiper': function (evt, tp, touchable) {
		if (!tp.dragging) return;
		var ps = tp.ps,
			page = tp.ps.pages[tp.ps.pageInd];
		if (tp.dragging === 'x') {
			ps.dragged.left = bound(ps.left + touchable.currentStartDelta.x, ps.bounds.left, ps.bounds.right) + bound(touchable.currentDelta.x * VELOCITY, PAGE_BUFFER, -PAGE_BUFFER);
			tp.ps.conveyor.snabbt({
				position: [ps.dragged.left, ps.dragged.top, 0],
				duration: EASING_TIME,
				easing: 'easeOut'
			});
			Meteor.setTimeout(ps.realign.bind(ps, EASING_TIME), EASING_TIME/2.5);
		} else if (tp.dragging === 'y') {
			page.dragged.top = bound(page.top + touchable.currentStartDelta.y, ps.bounds.bottom, ps.bounds.top) + bound(touchable.currentDelta.y * VELOCITY, PAGE_BUFFER, -PAGE_BUFFER);
			page.container.snabbt({
				position: [page.dragged.left, page.dragged.top, 0],
				duration: EASING_TIME,
				easing: 'easeOut'
			});
			Meteor.setTimeout(page.realign.bind(page, EASING_TIME), EASING_TIME/2.5);	
		}
		tp.dragging = false;
	},
	'click [data-ps-arrow]': function(evt, tp) {
		var moveFunc = $(evt.currentTarget).data('ps-arrow');
		tp.ps[moveFunc] && tp.ps[moveFunc].apply(tp.ps);
	}
});

Template.pageSwiper.created = function() {
	this.dragging = false;
}

Template.pageSwiper.rendered = function() {

	var opts = (this.data && this.data.options) || {},
		$el = this.$('#page-swiper'),
		_this = this;

	this.ps = new PageSwiper($el, opts);
	Meteor.PageSwiper = this.ps.publicObj();
	$el.Touchable();

	$(window).on('resize', this.ps.resize.bind(this.ps));
	$(document).keyup(function(event) {
		var transitionDetails = transitionMap[event.keyCode],
			transitionFunc = transitionDetails && _this.ps[transitionDetails.func];
		transitionFunc && transitionFunc.apply(_this.ps);	
	});

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

function bound(value, max, min) {
	return Math.max(Math.min(value, max), min);
}

function buildTemplate(subPages) {
	var arrays = {
			'layoutClass': [],
			'onTransitioned': [],
			'seedTemplate': [],
			'moveable': [],
			'data': [],
			'arrowCol': []
		},
		returnedNames = {
			'layoutClass': 'layoutClasses',
			'onTransitioned': 'onTransitionedArray',
			'seedTemplate': 'seedTemplates',
			'moveable': 'moveableArray',
			'data': 'dataArray',
			'arrowCol': 'arrowColArray'
		},
		ret = {};

	var layout = [],
		i;
	_.each(subPages, function(subPage) {
		if (!subPage.location) return null;
		var pageInd = subPage.location[0],
			subPageInd = subPage.location[1];

		if (!layout[pageInd]) {
			layout[pageInd] = subPageInd + 1;
			for (i = 0; i < pageInd; i += 1)
				if (!layout[i]) {
					layout[i] = 1;
					_.each(arrays, function(val, key) {val[i] = [null]});
				}
			_.each(arrays, function(val, key) {
				val[pageInd] = [];
				val[pageInd][subPageInd] = subPage[key];
				val[pageInd] = Array.apply(null, val[pageInd]);
			});	
		}
		else if (layout[pageInd] < subPageInd + 1) {
			layout[pageInd] = subPageInd + 1;
			_.each(arrays, function(val, key) {
				val[pageInd][subPageInd] = subPage[key];
				val[pageInd] = Array.apply(null, val[pageInd]);		
			});
		}
	});

	_.each(returnedNames, function(val, key) {
		ret[val] = arrays[key];
	});
	ret.layout = layout;
	return ret;
}