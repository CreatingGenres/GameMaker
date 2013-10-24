var dialogs = (function () {
    //part of the view model
    function deselectOthers(el, type) {
        var el = $(el);
        if (el.hasClass("selected"))
            return;
        
        gameMakerViewModel.editedProperty()(el.attr("src"));
        
        $("[data-type='" + type + "']").removeClass("selected");
        el.addClass("selected");
    };

    function chooseGoogleImage(el, type) {
        var el = $(el);
        if (el.hasClass("selected"))
            return;

        var src = el.attr("src");

        gameMakerViewModel.library.images.push(src);
        renderer.updateTextures();
        gameMakerViewModel.editedProperty()(src);

        $("[data-type='" + type + "']").removeClass("selected");
        el.addClass("selected");
    }
    
	//The 'this' is the property
    function _beginEdit(type) {
    	var property = this;

    	gameMakerViewModel.editedProperty(property);
    };  
    
	// Error handling
    $(document).ready(function () {
    	$(".error-bar button").click(function () {
    		$(".error-bar").fadeOut();
    	});
    });

    //Google custom search
    var searchUrl = "https://www.googleapis.com/customsearch/v1?key=AIzaSyCk-vO_EMpAmEYZrMf6I02u02Nilc8gk4g&cx=011219749067941848812:m5dmfawpgc8&q=<query>&searchType=image&callback=dialogs.searchComplete";

    $("#google-search-button").click(function () {
        var query = $("#google-search-field").val();

        var url = searchUrl.replace("<query>", query);

        //actual search
        $.get(url);
    });

    function searchComplete(result) {
        gameMakerViewModel.googleSearchResults.removeAll();

        for (var i = 0; i < result.items.length; i++) {
            var item = result.items[i];

            //item.link is the image url
            gameMakerViewModel.googleSearchResults.push(item.link);
        }
    }

    return {
        beginEdit: _beginEdit,
        deselectOthers: deselectOthers,
        searchComplete: searchComplete,
        chooseGoogleImage: chooseGoogleImage
    };
}());