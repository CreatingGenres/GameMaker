//Cool stuff to buff prototypes with
function clone(obj) {
    if (obj == null || typeof (obj) != 'object' || obj.nodeName)
        return obj;

    var temp = new obj.constructor(); // changed

    for (var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

// String format
(function stringFormat() {
	String.format = function String$format(format, args) {
		/// <summary>Replaces the format items in a specified String with the text equivalents of the values of   corresponding object instances. The invariant culture will be used to format dates and numbers.</summary>
		/// <param name="format" type="String">A format string.</param>
		/// <param name="args" parameterArray="true" mayBeNull="true">The objects to format.</param>
		/// <returns type="String">A copy of format in which the format items have been replaced by the   string equivalent of the corresponding instances of object arguments.</returns>
		return toFormattedString(false, arguments);
	}

	var toFormattedString = function String$_toFormattedString(useLocale, args) {
		var result = '';
		var format = args[0];

		for (var i = 0; ;) {
			// Find the next opening or closing brace
			var open = format.indexOf('{', i);
			var close = format.indexOf('}', i);
			if ((open < 0) && (close < 0)) {
				// Not found: copy the end of the string and break
				result += format.slice(i);
				break;
			}
			if ((close > 0) && ((close < open) || (open < 0))) {

				if (format.charAt(close + 1) !== '}') {
					throw new Error('format stringFormatBraceMismatch');
				}

				result += format.slice(i, close + 1);
				i = close + 2;
				continue;
			}

			// Copy the string before the brace
			result += format.slice(i, open);
			i = open + 1;

			// Check for double braces (which display as one and are not arguments)
			if (format.charAt(i) === '{') {
				result += '{';
				i++;
				continue;
			}

			if (close < 0) throw new Error('format stringFormatBraceMismatch');


			// Find the closing brace

			// Get the string between the braces, and split it around the ':' (if any)
			var brace = format.substring(i, close);
			var colonIndex = brace.indexOf(':');
			var argNumber = parseInt((colonIndex < 0) ? brace : brace.substring(0, colonIndex), 10) + 1;

			if (isNaN(argNumber)) throw new Error('format stringFormatInvalid');

			var argFormat = (colonIndex < 0) ? '' : brace.substring(colonIndex + 1);

			var arg = args[argNumber];
			if (typeof (arg) === "undefined" || arg === null) {
				arg = '';
			}

			// If it has a toFormattedString method, call it.  Otherwise, call toString()
			if (arg.toFormattedString) {
				result += arg.toFormattedString(argFormat);
			}
			else if (useLocale && arg.localeFormat) {
				result += arg.localeFormat(argFormat);
			}
			else if (arg.format) {
				result += arg.format(argFormat);
			}
			else
				result += arg.toString();

			i = close + 1;
		}

		return result;
	}
})()

var Helper = {
	hasProperties: function (obj) {
		for (var i in obj) {
			return true;
		}
		return false;
	},
}

Array.removeItem = function (array, key) {
	if (!array.hasOwnProperty(key))
		return;
	if (isNaN(parseInt(key)) || !(array instanceof Array))
		delete array[key];
	else
		array.splice(key, 1);
};

Array.deepCopy = function (arr) {
    var out = [];

    for (var key in arr) {
        if (!arr.hasOwnProperty(key)) {
            continue;
        }

        out[key] = clone(arr[key]);
    }
    return out;
}

// Some cool stuff to add to strings
String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) == str;
};

String.prototype.removeAfter = function (after) {
    var index = this.indexOf(after);
    if (index < 0)
        return this;
    return this.substr(0, index);
}

// Extends method as typescript defines it to allow inheritance
var __extends = function (derived, base) {
    function __() { this.constructor = derived; }
    __.prototype = base.prototype;
    derived.prototype = new __();
};

// Extra Math functions
Math.clamp = function (value, left, right) {
    if (value > right) {
        return right;
    }
    if (value < left) {
        return left;
    }
    return value;    
}

Math.Pi = Math.PI;
Math.TwoPi = 2 * Math.PI;
Math.PiOver2 = Math.Pi / 2;
Math.PiOver4 = Math.Pi / 4;
Math.toRadians = function (degrees) {
    return degrees * Math.Pi / 180;
}
Math.sign = function (number) {
    if (number == 0)
        return 0;
    return number / Math.abs(number);
};

// Returns a function that given a x coordinate, 
// calculates the y coordinate of the point with the same x value that lies on the line defined by the 2 points (x1, y1) and (x2, y2)
Math.getLineEquation = function (x1, y1, x2, y2) {
    return function (x) {
        return y1 + ((y2 - y1) / (x2 - x1)) * (x - x1);
    };
};


// Bounding math

var Vector2 = (function () {
    function Vector2(x, y) {
        this.x = x;
        this.y = y;
    }

    Vector2.prototype.distance = function (vector2) {
        return Math.sqrt(this.distanceSqured(vector2));
    }
        
    Vector2.prototype.distanceSquared = function (vector2) {
        return (this.x - vector2.x) * (this.x - vector2.x) + (this.y - vector2.y) * (this.y - vector2.y);
    }

    Vector2.prototype.toString = function () {
        return "x: " + this.x + ", y: " + this.y;
    };

    return Vector2;
})();

var BoundingFigure = (function () {
    function BoundingFigure(x, y) {
        this.x = x;
        this.y = y;
    }

    BoundingFigure.prototype.intersects = function (boundingFigure) { return false; };
    BoundingFigure.prototype.contains = function (boundingFigure) { return false; };

    return BoundingFigure;
})();

var BoundingRectangle = (function () {
    var base = BoundingFigure;
    __extends(BoundingRectangle, base);

    function BoundingRectangle(x, y, width, height) {
        base.call(this, x, y);
        this.width = width;
        this.height = height;
    }

    BoundingRectangle.prototype.intersects = function (boundingFigure) {
        var colliding = false;

        if (boundingFigure instanceof BoundingRectangle) {
            colliding =
                this.x + this.width >= boundingFigure.x &&
                boundingFigure.x + boundingFigure.width >= this.x &&
                this.y + this.height >= boundingFigure.y &&
                boundingFigure.y + boundingFigure.height >= this.y;
        }
        else if (boundingFigure instanceof BoundingCircle) {
            throw new TypeError("not impemented yet");
        }
        else {
            throw new TypeError("invalid type");
        }

        return colliding;
    };

    BoundingRectangle.prototype.contains = function (boundingFigure) {
        var colliding = false;
        if (boundingFigure instanceof Vector2) {
            colliding =
                this.x + this.width >= boundingFigure.x &&
                boundingFigure.x >= this.x &&
                this.y + this.height >= boundingFigure.y &&
                boundingFigure.y >= this.y;
        }
        else if (boundingFigure instanceof BoundingRectangle) {
            throw new TypeError("not impemented yet");
        }
        else if (boundingFigure instanceof BoundingCircle) {
            throw new TypeError("not impemented yet");
        }
        else {
            throw new TypeError("invalid type");
        }

        return colliding;
    };

    return BoundingRectangle;
})();

function Image(path) {
    return $("<img>", { src: path })[0];
};

function KeyValuePair(name, value) {
    this.name = name;
    this.value = value;
};

Array.findObservable = function (array, attribute, value) {
    for (var el = 0; el < array.length; ++el) {
        if (!array[el][attribute])
            return undefined;

        if (array[el][attribute]() == value)
            return array[el];
    }
    return undefined;
}

window.onmousemove = function (args) {
    window.mouse = args;
};

Array.removeItem = function (array, key) {
    if (!array.hasOwnProperty(key))
        return
    if (isNaN(parseInt(key)) || !(array instanceof Array))
        delete array[key]
    else
        array.splice(key, 1)
};

// Get the name of any keyboard button
(function () {

    var nonLetters = [];
    nonLetters[8] = "Backspace";
    nonLetters[9] = "Tab";
    nonLetters[13] = "Enter";
    nonLetters[16] = "Shift";
    nonLetters[17] = "Control";
    nonLetters[18] = "Alt";
    nonLetters[19] = "Pause/Break";
    nonLetters[20] = "Caps lock";
    nonLetters[27] = "Escape";
    nonLetters[32] = "Space";
    nonLetters[33] = "Page up";
    nonLetters[34] = "Page down";
    nonLetters[35] = "End";
    nonLetters[36] = "Home";
    nonLetters[37] = "Left Arrow";
    nonLetters[38] = "Up Arrow";
    nonLetters[39] = "Right Arrow";
    nonLetters[40] = "Down arrow";
    nonLetters[45] = "Insert";
    nonLetters[46] = "Delete";
    nonLetters[91] = "Left Window Key";
    nonLetters[92] = "Right Window Key";
    nonLetters[93] = "Select Key";
    nonLetters[96] = "Num 0";
    nonLetters[97] = "Num 1";
    nonLetters[98] = "Num 2";
    nonLetters[99] = "Num 3";
    nonLetters[100] = "Num 4";
    nonLetters[101] = "Num 5";
    nonLetters[102] = "Num 6";
    nonLetters[103] = "Num 7";
    nonLetters[104] = "Num 8";
    nonLetters[105] = "Num 9";
    nonLetters[106] = "Num *";
    nonLetters[107] = "Num +";
    nonLetters[109] = "Num -";
    nonLetters[110] = "Num .";
    nonLetters[111] = "Num /";
    nonLetters[112] = "F1";
    nonLetters[113] = "F2";
    nonLetters[114] = "F3";
    nonLetters[115] = "F4";
    nonLetters[116] = "F5";
    nonLetters[117] = "F6";
    nonLetters[118] = "F7";
    nonLetters[119] = "F8";
    nonLetters[120] = "F9";
    nonLetters[121] = "F10";
    nonLetters[122] = "F11";
    nonLetters[123] = "F12";
    nonLetters[144] = "Num Lock";
    nonLetters[145] = "Scroll Lock";
    nonLetters[186] = ":";
    nonLetters[187] = "=";
    nonLetters[188] = ",";
    nonLetters[189] = "-";
    nonLetters[190] = ".";
    nonLetters[191] = "\\";
    nonLetters[192] = "`";
    nonLetters[219] = "(";
    nonLetters[220] = "/";
    nonLetters[221] = ")";
    nonLetters[222] = "'";

    String.fromKeyCode = function (keyCode) {
        return nonLetters[keyCode] || String.fromCharCode(keyCode);
    };
})();

// Check if the given unit is inside the canvas
function isInCanvas(unit, canvas) {

    return window.mouse &&
        (window.mouse.clientX - $(canvas).offset().left + window.pageXOffset) * (canvas.width / $(canvas).width()) >= unit.position.x() &&
        (window.mouse.clientX - $(canvas).offset().left + window.pageXOffset) * (canvas.width / $(canvas).width()) <= unit.position.x() + parseInt(unit.size.width()) &&
        (window.mouse.clientY - $(canvas).offset().top + window.pageYOffset) * (canvas.height / $(canvas).height()) >= unit.position.y() &&
        (window.mouse.clientY - $(canvas).offset().top + window.pageYOffset) * (canvas.height / $(canvas).height()) <= unit.position.y() + parseInt(unit.size.height());
}

// Filter pollyfil from mdn
if (!Array.prototype.filter) {
	// Awsm argument name
    Array.prototype.filter = function (fun /*, thisp*/) {
        "use strict";

        if (this == null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}

function isObjectEmpty(obj) {
    for (var i in obj) {
        return false;
    }
    return true;
}