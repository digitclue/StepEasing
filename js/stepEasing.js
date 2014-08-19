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
					return configA.step > configB.step ? 1 : -1;
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
		startAnimation:function(index, callback){
			var self = this,
				dfr;
			// this.deferred = jQuery.Deferred();

			// this.deferred.done(function(){
			// 	if (jQuery.isFunction(callback)){
			// 		self.makeCallback('onComplete', self);
			// 		callback.apply(self);
			// 	}
			// });
			// for (var i = 0; i < this.boxes.length - 1; i += 1){
				dfr = this.animateBox(this.boxes.eq(index));
				dfr.done(function(){
					dfr = self.animateBox(self.boxes.eq(index += 1));
				});
			// }
		},
		animateBox: function(box){
			var self = this,
				deferred = jQuery.Deferred(),
				boxesLength = this.boxes.length,
				index = box.index(),
				config = box.data('easing'),
				speed = config.speed !== undefined ? config.speed : self.options.animSpeed,
				delay = config.delay !== undefined ? config.delay : self.options.delay;

			// function _onComplete(){
			// 	if (!self.busy){
			// 		if (index < boxesLength - 1){
			// 			self.animateBox(self.boxes.eq(index + 1));
			// 		} else {
			// 			self.deferred.resolve();
			// 		}
			// 	}
			// }

			this.timer = setTimeout(function(){
				if (self.effects[config.effect].run){
					self.effects[config.effect].run({
						box: box,
						speed: speed,
						complete:function(){
							deferred.resolve();
						}
					});
				} else {
					deferred.resolve();
					// _onComplete.apply(box.get(0));
				}
			}, delay);

			return deferred.promise();
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
	};

	$.fn.stepEasing = function(options){
		return this.each(function(){
			var elem = jQuery(this);
			if (!elem.data('StepEasing')){
				elem.data('StepEasing', new StepEasing($.extend(options, {holder:this})));
			}
		});
	};
})(jQuery);