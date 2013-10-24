var EmptyObjectFactory = (function EmptyObjectFactory() {
    _module = function module() {
        return {};
    }

    _event = function event() {

    }

    _unit = function unit() {

    }

    _keyBinding = function keyBinding() {
        return ko.mapping.fromJS({ key: 'None', target: '', action: '', args: [], 'singleCall': 'true' });
    }

    return {
        module: _module,
        event: _event,

    };
}());


// DAFUQ: Y U PUT STUFF IN GLOBAL NAMESPACE
function EmptyUnit() {
    this.id = ko.observable("None");
    this.velocity = { x: undefined, y: undefined };
    this.size = { width: ko.observable(0), height: ko.observable(0) };
    this.modules = ko.observableArray();
    this.isPrototype = ko.observable(false);
    this.texture = ko.observable("images/library/empty.png");
};

var emptyUnit = new EmptyUnit();

function EmptyModule() {
    this.name = ko.observable("None");
    this.args = [];
};

var emptyModule = new EmptyModule();

function EmptyBinding() {
    this.key = ko.observable("None");
    this.singleCall = ko.observable(false);
    this.args = ko.observableArray();
};

var emptyBinding = new EmptyBinding();

function EmptyEvent() {
    this.id = ko.observable("None");
    this.name = ko.observable("None");
    this.requirements = ko.observableArray();
    this.args = [];
};

var emptyEvent = new EmptyEvent();

//demo
function Library() {
    this.images = [
        "images/library/empty.png",
        "images/library/space.jpg",
        "images/library/games.png",
        "images/library/laser.png",
        "images/library/asteroid.png",
        "images/library/imagine2.png",
        "images/library/blue-monster.png",
        "images/library/green-monster.png",
        "images/library/chest.png",
        "images/library/spaceship.png",
    ];
}