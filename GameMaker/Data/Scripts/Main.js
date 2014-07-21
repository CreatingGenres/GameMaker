var GM = {};

//Default alertify delay
alertify.set({ delay: 2500 });

$.connection.mainHub.client.stuff = function () { };

$.connection.mainHub.client.gamePublished = function (gameName) {
	gameMakerViewModel.publishedGames.push(gameName);
}

var playDAHGAME = function (script) {
    location = "#play";
    appNavigator.switchLocation("play");
    $("#play-div script").remove();
    $("<script>").attr("src", script).appendTo("#play-div");
};

var loadPublishedGame = function (gameName) {
	$("#loading").show();
	$("#create").hide();
	$.connection.mainHub.server.loadPublishedGame(gameName).done(function (script) {
		playDAHGAME(script);
	});
}

$.connection.hub.start().done(function () {             
    var hubby = $.connection.mainHub;
    $("#play-button").click(function () {
        $("#loading").show();
        $("#create").hide();
        hubby.server.generateGame(gameMakerViewModel.getCleanModel())
            .done(function (path) {
                playDAHGAME(path);
            })
            .fail(function () {
            	$("#error-creating").fadeIn();
            });
    });
    $("#download-button").click(function () {
        hubby.server.generateGameArchive(gameMakerViewModel.getCleanModel())
            .done(function (path) {
            	window.location.href = path;
            })
            .fail(function() {
                location = "#create";
                appNavigator.switchLocation("#create");
                $("#error-creating").fadeIn();
            });
    });

    $("#publish-button").click(function () {
    	hubby.server.publishGame(ko.toJSON(gameMakerViewModel.model))
            .fail(function () {
            	location = "#create";
            	appNavigator.switchLocation("#create");
            	$("#error-publishing").fadeIn();
            });
    });

    $.connection.mainHub.server.getPublishedGames().done(function (games) {
    	for (var i = 0, j = games.length; i < j; i++) {
    		gameMakerViewModel.publishedGames.push(games[i]);
    	}
    });
});