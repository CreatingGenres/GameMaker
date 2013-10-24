function AnimatedSpriteUnit() {
	var base = RectUnit;
	__extends(AnimatedSpriteUnit, base);

	function AnimatedSpriteUnit(id, texture, animations, framesPerRow, framesPerCol, x, y, width, height, hp, rotateX, rotateY) {
		base.call(this, id, x, y, width, height, hp, rotateX, rotateY);
		this.animations = animations;
		this.runningAnimation = 'idle'; //BECAUSE IE
		this.activeAnimationChangedRecently = false;
		if (texture) {
			this.texture = new Image();
			this.texture.src = texture;
			loader.imagesToLoad++;
			var self = this;
			this.texture.onload = function() {
				self.swidth = self.texture.width / framesPerRow;
				self.sheight = self.texture.height / framesPerCol;
				loader.onImageLoaded();
			};
		}
	}
				
	Object.defineProperties(AnimatedSpriteUnit.prototype, {
		'activeAnimation': {
			get: function() {
				return this.runningAnimation;
			},
			set: function(value) {							
				if (value == this.runningAnimation) {
					if (this.animations[this.runningAnimation].hasFinished) 
						this.animations[this.runningAnimation].reset();
					return;
				}


				if (this.canChangeAnimationTo(value)) {
					this.activeAnimationChangedRecently = true;
					this.runningAnimation = value;
					if (this.animations[this.runningAnimation].mustFinish) {
						this.animations[this.runningAnimation].reset();
					}
				}
			}
		},
	});

	AnimatedSpriteUnit.prototype.canChangeAnimationTo = function (nextAnimation) {
		var next = this.animations[nextAnimation];
		if (!next)
			return false;

		if (next.mustFinish) {
			return true;	
		}

		var active = this.animations[this.runningAnimation];
		if (active.mustFinish && !active.hasFinished)
			return false;

		return true;
	};
				
	AnimatedSpriteUnit.prototype.updateCallback = function () {
		if (!this.activeAnimationChangedRecently && this.canChangeAnimationTo('idle')) {
			this.activeAnimation = 'idle';
		}
		this.animations[this.activeAnimation].update();

		this.activeAnimationChangedRecently = false;
	};

	AnimatedSpriteUnit.prototype.drawCallback = function (context) {
		var sx = this.animations[this.activeAnimation].colFrame * this.swidth;
		var sy = this.animations[this.activeAnimation].rowFrame * this.sheight;
		context.drawImage(this.texture, sx, sy, this.swidth, this.sheight, this.x, this.y, this.width, this.height);
	};
				
	AnimatedSpriteUnit.prototype.die = function () {
		if (this.state != UnitStates.dying) {
			raiseEvent(this, 'onDeath');
		}
		this.state = UnitStates.dying;
		var self = this;
		var activeAnimation = this.animations[this.activeAnimation];
		setTimeout(function () {
			Array.removeItem(units, this.id);
			self.state = UnitStates.dead;
		}, settings.updateTime * activeAnimation.framesPerRow);
	};


	return AnimatedSpriteUnit;				
}