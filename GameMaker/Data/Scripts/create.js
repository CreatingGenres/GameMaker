$(document).ready(function () {

	var listItemConstructor = "HTMLLIElement",
		headingConstructor = "HTMLHeadingElement";

	$("#frame-manage").mousedown(function (e) {
		var parent = $(e.target).parents(".tile")[0];

		if (!parent) {
			return;
		}

		if (e.which == 3) {
			$(parent).toggleClass("selected");
		}
	});
	$("#frame-manage").contextmenu(function (e) {
		e.preventDefault();
		e.stopPropagation();
	});

	$("#frame-manage #delete-saves-button").click(function () {
	    $("#frame-manage .selected :first-child").each(function (index, element) {
			saveManager.delete($(element).text());
		});
	});

	$("#frame-manage #save-button").click(function () {
		var name = $("#frame-manage #save-name-input").val();
		saveManager.save(gameMakerViewModel, name);
	});

	$("#frame-manage.frame-tab ul").dblclick(function (eventArgs) {
		var clickedTile = $(eventArgs.target).parents(".tile")[0];
		
		var saveName = $(clickedTile).find(".tile-content :first-child").text();
		var result = saveManager.load(saveName);
		if (!result) {
			$("#error-saving").fadeIn();
		}
	});

	// Slider

	var sizes = ["half", "", "double", "triple", "quadro"];
	$("#size-slider-id").on("change", function (e, val) {
		// Division by 25 maps [0; 100] to [0; 4] (since 100 / 25 = 4) so we only consider values between 0 and 99
		var sizeIndex = ~~(Math.min(val, 99) / (100 / (sizes.length)));
		$(".tile.resizable").removeClass("half double triple quadro").addClass(sizes[sizeIndex]);
		$(".tile.resizable").removeClass("half-vertical double-vertical triple-vertical quadro-vertical").addClass(sizes[sizeIndex] + "-vertical");
	});
});