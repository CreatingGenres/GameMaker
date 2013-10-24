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

function isInCanvas(unit, canvas) {
    
    return window.mouse &&
        (window.mouse.clientX - $(canvas).offset().left + window.pageXOffset) * (canvas.width / $(canvas).width()) >= unit.position.x() &&
        (window.mouse.clientX - $(canvas).offset().left + window.pageXOffset) * (canvas.width / $(canvas).width()) <= unit.position.x() + parseInt(unit.size.width()) &&
        (window.mouse.clientY - $(canvas).offset().top + window.pageYOffset) * (canvas.height / $(canvas).height()) >= unit.position.y() &&
        (window.mouse.clientY - $(canvas).offset().top + window.pageYOffset) * (canvas.height / $(canvas).height()) <= unit.position.y() + parseInt(unit.size.height());
}

// Filter pollyfil from mdn
if (!Array.prototype.filter) {
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
ko.extenders.filter = Array.prototype.filter;