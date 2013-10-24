//Dependencies: html controls, jquery
var appNavigator = new (function() {	
	var currentLocation = $("#home"),
	loadingBar = $("#loading");

//region methods
	this.switchLocation = function (locationId) {
		currentLocation.fadeOut(150, function () {
			loadingBar.show();
			setTimeout(function () {
				loadingBar.hide();
				// If we are currently playing, pause the game
				if (currentLocation == "#play") {
					if (game && !game.isPaused) {
						game.togglePause();
					}
				}
				currentLocation = $("#" + locationId);


				currentLocation.fadeIn(200);
			}, 300);
		});
	}

	this.load = function () {

		Sammy(function () {
			this.get("", function () {
				var location = this.path.split('#')[1];

				if (location.split('-')[0] == "frame")
					return;

				if ($("#" + location).length) {
					//e.g. if it finds the location
					appNavigator.switchLocation(location);
				}
			});

		}).run();
	};
})();