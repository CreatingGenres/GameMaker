/// <reference path="gametemplate.js" />
function RectangleUnit() {
	var base = RectUnit;
	__extends(RectangleUnit, base);

	function RectangleUnit(id, color, x, y, width, height, hp) {
		base.call(this, id, x, y, width, height, hp);
		this.color = color;
	};

	RectangleUnit.prototype.drawCallback = function (context) {
		context.fillStyle = this.color;
		context.fillRect(this.x, this.y, this.width, this.height);
	}

	return RectangleUnit;
}