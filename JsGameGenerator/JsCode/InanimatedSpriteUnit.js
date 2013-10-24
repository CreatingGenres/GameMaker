function InanimatedSpriteUnit() {
	var base = RectUnit;
	__extends(InanimatedSpriteUnit, base);

	function InanimatedSpriteUnit(id, texture, x, y, width, height, hp) {
		base.call(this, id, x, y, width, height, hp);
		if (texture) {
			this.texture = new Image();
			this.texture.src = texture;
			loader.imagesToLoad++;
			var self = this;
			this.texture.onload = loader.onImageLoaded;
		}
	};

	InanimatedSpriteUnit.prototype.drawCallback = function (context) {
		context.drawImage(this.texture, this.x, this.y, this.width, this.height);
	};

	return InanimatedSpriteUnit;
}