function EmptyUnit() {
    this.id = ko.observable("None");
    this.velocity = {x: undefined, y: undefined};
    this.size = {width: undefined, height: undefined};
};

var emptyUnit = new EmptyUnit();

function EmptyModule() {
    this.name = ko.observable("None");
    this.args = [];
};

var emptyModule = new EmptyModule();

function EmptyBinding() {
    this.key = ko.observable("None");
};

var emptyBinding = new EmptyBinding();

//demo
function Library() {
    this.images = [
        "images/library/space.jpg",
        "images/library/games.png",
        "images/library/spaceship.png",
        "images/library/laser.png",
        "images/library/asteroid.png",
        "images/library/blue-monster.png",
        "images/library/green-monster.png",
        "images/library/chest.png",
    ];
}