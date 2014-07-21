$(document).ready(function () {
	//The triggers move the container according to the data-scroll param.
	var container = $(".frame-container"),
		triggers = $("[data-trigger='scroll']");

	$(triggers[0]).addClass("active");

	function scrollSpy() {
		//Well, in a nutshell, the minus left divided by 1250 (cause the container moves
		//to the left). Then parseInt and abs on top
		var currentActive = Math.abs(parseInt((parseInt(container.css("left")) || 0) / 1250));
		triggers.removeClass("active");
		$(triggers[currentActive]).addClass("active");
	}

	//When the mouse is scrolled over the container, move it accordingly.
	container.bind('mousewheel DOMMouseScroll', function (event) {
		//We don't want the default scroll.
		event.preventDefault();

		//The JQuery event does not have delta info
		event = event.originalEvent;
		//Chrome+Opera/Firefox
		var delta = event.wheelDelta || -event.detail;
		delta /= 10;

		//close popups, NOW!!!
		$(".popup").fadeOut();

		function moveContainer() {
			var left = parseInt(container.css("left")) || 0;
			
			if (left > 0 && delta > 0 ||
				left < -(triggers.length - 1) * 1250 && delta < 0)
				return;

			container.css("left", left + delta);
			delta -= 1 * delta > 0 ? 1 : -1;

			scrollSpy();
			if (delta != 0)
				setTimeout(moveContainer, 10);
		};

		//Set the motion in... motion.
		setTimeout(moveContainer, 10);
	});

	triggers.click(function () {
		var trigger = $(this),
			scrollPos = trigger.data("scroll");


		//Now move the window
		var targetPos = -scrollPos * 1250;
		function moveContainer() {
			//A little repetion, but still
			var left = parseInt(container.css("left")) || 0;

			scrollSpy();
			if (Math.abs(targetPos - left) > 50) {
				container.css("left", left + (targetPos > left ? 1 : -1) * 55);
				setTimeout(moveContainer, 5);
			} else {
				//sometimes the scrollspy doesn't do very well
				triggers.removeClass("active");
				trigger.addClass("active");
			}

		}

		setTimeout(moveContainer, 10);
	});
});