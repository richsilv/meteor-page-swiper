PageSlider = function(el, opts) {

	var _this = this;
		
	this.el = el;
	this.conveyor = el.children('#ps-conveyor');
	this.width = $(window).width();
	this.height = $(window).height();
	this.pages = [];
	this.pageInd = opts.pageInd || 0;
	
	opts.layout && _.each(opts.layout, function(subPageCount, ind) {
		var thisPage = new Page({ps: this, ind: ind, subPageCount: subPageCount});
		conveyor.append(thisPage.container);
		_this.pages.push(thisPage);
	});

};

PageSlider.renderTo = function(location, template, data) {
	var page = (location instanceof Array) ? location[0] : location;
	this.pages[page].renderTo(location[1], template.data);
}

PageSlider.prototype.reposition = function(immediate) {
	this.conveyor.css('left', this.width * this.pageInd);
}

PageSlider.prototype.down = function(loop) {
	this.pageInd++;
	if (this.pageInd >= this.pageCount) {
		if (loop) this.pageInd = 0;
		else this.pageInd--;
	}
	this.reposition();
}

PageSlider.prototype.up = function(loop) {
	this.pageInd--;
	if (this.pageInd < 0) {
		if (loop) this.pageInd = this.pageCount - 1;
		else this.pageInd++;
	}
	this.reposition();
}

Page = function(opts) {

	var _this = this;

	this.ps = opts.ps;
	this.container = $('<div class="ps-page"></div>');
	this.subPages = [];
	this.subPageCount = opts.subPageCount;
	this.subPageInd = opts.subPageInd || 0;

	for (var i = 0; i < opts.subPageCount; i++) {
		var thisSubPage = new SubPage({ps: this.ps, page: this, ind: i});
		this.container.append(thisSubPage.container);
		_this.subPages.push(thisSubPage);
	}

};

Page.renderTo = function(location, template, data) {
	var subpage = location || 0;
	this.subPages[subPage].render(template, data);
}

Page.prototype.reposition = function(immediate) {
	this.container.css('top', this.ps.height * this.subPageInd);
}

Page.prototype.down = function(loop) {
	this.subPageInd++;
	if (this.subPageInd >= this.subPageCount) {
		if (loop) this.subPageInd = 0;
		else this.subPageInd--;
	}
	this.reposition();
}

Page.prototype.up = function(loop) {
	this.subPageInd--;
	if (this.subPageInd < 0) {
		if (loop) this.subPageInd = this.subPageCount - 1;
		else this.subPageInd++;
	}
	this.reposition();
}

SubPage = function(opts) {

	this.ps = opts.ps;
	this.page = opts.page;
	this.container = $('<div class="ps-subpage"></div>');

};

SubPage.prototype.render = function(template, data) {
	if (this.view) Blaze.remove(this.view);
	this.container.empty();
	if (data) 
		Blaze.renderWithData(template, data, this.container[0]);
	else
		Blaze.render(template, this.container[0]);		
}

Template.pageSlider.helpers({
	foo: function () {
		// ...
	}
});// Write your package code here!

Template.pageSlider.rendered = function() {

	var opts = (this.data && this.data.opts) || {},
		$el = this.$('#pageslider');

	this.ps = PageSlider($el, opts);

}
