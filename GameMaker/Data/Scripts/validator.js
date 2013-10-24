validator = (function () {
    function _validate(e) {
        var target = $(e.target);
        if (e.target instanceof HTMLInputElement && target.data("validate")) {
            target.removeClass("error");
            target.addClass("success");

            //console.log(target.val());
            try {
                Shunt.parse(target.val());
            } catch (error) {
                target.removeClass("success");
                target.addClass("error");
                
                target.prevAll().remove();
                target.before($("<i>", { class: "icon-cancel-2", style: "margin-left: 2em;" }));
            }
        }
    }

    return {
        validate: _validate
    }
}());