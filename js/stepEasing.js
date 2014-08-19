/*
 * Step animation plugin
 */
;(function($){
	function StepEasing(options){
		this.options = $.extend({
			box:'[data-easing]',
			animSpeed:400,
			delay:200,
			onInit:null,
			onComplete:null,
			onDestroy:null,
			effects:null
		}, options);
		if (this.options.holder){
			this.findElements();
			this.init();
		}
	}
	StepEasing.prototype = {
		findElements:function(){
			// find elements
			this.holder = $(this.options.holder);
			this.boxes = this.holder.find(this.options.box);

			// extend with custom effects
			$.extend(this.effects, this.options.effects);
		},
		init:function(){
			var self = this;

			if (this.timer) clearTimeout(this.timer);
			this.timer = null;
			this.busy = false;
			
			// sort boxes by step
			this.boxes.sort(function(a,b){
				var configA = $(a).data('easing'),
					configB = $(b).data('easing');

				if (configA && configB){
					return +configA.step > +configB.step ? 1 : -1;
				}
			});
			
			// set initial
			this.boxes.each(function(){
				var box = $(this).stop(true),
					config = box.data('easing');

				if (!config.effect || !self.effects[config.effect]){
					config.effect = 'fade';
				}
				
				self.effects[config.effect].init(box);
			});

			this.makeCallback('onInit', this);
		},
		run:function(index, callback){
			var self = this,
				boxesLength = this.boxes.length;
			
			if (!index){
				index = 0;
			} else if (typeof index === 'function'){
				callback = index;
				index = 0;
			} else {
				index = Math.max(0, Math.min(boxesLength - 1, index));
			}

			function _animateBox(box){
				var config = box.data('easing'),
					speed = !isNaN(+config.speed) ? +config.speed : self.options.animSpeed,
					delay = !isNaN(+config.delay) ? +config.delay : self.options.delay;

				function _onComplete(){
					if (!self.busy){
						if (index < boxesLength - 1){
							_animateBox(self.boxes.eq(index += 1));
						} else {
							self.makeCallback('onComplete', self);
							if (typeof callback === 'function'){
								callback.apply(self);
							}
						}
					}
				}

				self.timer = setTimeout(function(){
					if (self.effects[config.effect].run){
						self.effects[config.effect].run({
							box: box,
							speed: speed,
							complete:_onComplete
						});
					} else {
						_onComplete.apply(box.get(0));
					}
				}, delay);
			}

			_animateBox(this.boxes.eq(index));
		},
		makeCallback:function(name){
			if (typeof this.options[name] === 'function'){
				var args = Array.prototype.slice.call(arguments, 1);
				this.options[name].apply(this, args);
			}
		},
		destroy:function(){
			var self = this;
			this.busy = true;
			clearTimeout(this.timer);
			this.boxes.each(function(index){
				var box = jQuery(this).stop(true),
					config = box.data('easing');

				if (self.effects[config.effect].destroy){
					self.effects[config.effect].destroy(box);
				} else {
					box.removeAttr('style');
				}
			});

			this.makeCallback('onDestroy', self);
			this.holder.removeData('StepEasing');
		},
		effects: {
			fade:{
				init:function(box){
					box.hide();
				},
				run:function(opt){
					opt.box.fadeIn(opt.speed, function(){
						if (typeof opt.complete === 'function'){
							opt.complete.apply(this, arguments);
						}
					});
				},
				destroy:function(box){
					box.show();
				}
			}
		}
	};

	window.StepEasing = StepEasing;

	StepEasing.addEffect = function(effect){
		$.extend(StepEasing.prototype.effects, effect);
	}

	$.fn.stepEasing = function(options){
		return this.each(function(){
			var elem = jQuery(this);
			if (!elem.data('StepEasing')){
				elem.data('StepEasing', new StepEasing($.extend(options, {holder:this})));
			}
		});
	};
})(jQuery);