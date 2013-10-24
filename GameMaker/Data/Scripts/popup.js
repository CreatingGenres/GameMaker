$(window).load(function () {
    //makes sure when we click on the window we close only if
	$(".popup").click(function (e) {
			e.stopImmediatePropagation();
			//console.log("stopped when clicked here: ", e);
    });

    $(window).click(function (e) {
    	$(".popup").hide();
        //console.log("popup faded");
    
        var el = $(e.target);
        if (el.data("trigger") == "popup") {
            //find popup
        	var popup = $("#" + el.data("popup"));
        	//console.log("pop it up");

            popup.fadeIn();
            popup.css({
                top: el.offset().top - el.height() / 2,
                left: el.offset().left + el.width() + 10 /*arrow*/ +
                    parseInt(el.css("margin-right")) + parseInt(el.css("padding-right"))
            });
        }
    });
});