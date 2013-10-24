window.onUnitButtonClick = function (dataUnit) {
    //var el = $(this),
    //    dataUnit = gameMakerViewModel.model.units().findObservable("id", el.data("id"));
    
    gameMakerViewModel.selectedUnit(dataUnit);
    renderer.overlayUnit = emptyUnit;
    if (dataUnit.isPrototype()) {
        renderer.overlayUnit = ko.mapping.fromJS(ko.toJS(dataUnit));
        
        renderer.overlayUnit.id(renderer.overlayUnit.id() + parseInt(Math.random() * 256));
        //renderer.placeUnit(dataUnit);
        
    }
};

window.onload = function() {
    //toolbox bindings
    var units = $("[data-type='unit']"), canvas = $("#game-canvas");
    
    var offset = { x: 0, y: 0 };
    /*
        move selected unit, if one exists
    */
    canvas.mousemove(function () {
        if (renderer.overlayUnit !== emptyUnit) {
            renderer.overlayUnit.position.x(((window.mouse.clientX - canvas.offset().left + window.pageXOffset) * (canvas[0].width / canvas.width())) - offset.x);
            renderer.overlayUnit.position.y(((window.mouse.clientY - canvas.offset().top + window.pageYOffset) * (canvas[0].height / canvas.height())) - offset.y);
        }
    });
    
    /*
        deselect unit or target one for dragging
    */
    canvas.mousedown(function () {
        if (renderer.selectedUnit !== emptyUnit) {
            renderer.overlayUnit = renderer.selectedUnit;
            gameMakerViewModel.selectedUnit(renderer.selectedUnit);
            
            offset.x = ((window.mouse.clientX - canvas.offset().left + window.pageXOffset) * (canvas[0].width / canvas.width())) - renderer.overlayUnit.position.x();
            offset.y = ((window.mouse.clientY - canvas.offset().top + window.pageYOffset) * (canvas[0].height / canvas.height())) - renderer.overlayUnit.position.y();
        } else {
            gameMakerViewModel.selectedUnit(emptyUnit);
        }
    });
    
    /*
        select unit or place it
    */
    canvas.mouseup(function (args) {
        offset.x = 0;
        offset.y = 0;
        
        if (renderer.overlayUnit !== emptyUnit) {
            if (renderer.overlayUnit.isPrototype()) {
                renderer.overlayUnit.isPrototype(false);
                gameMakerViewModel.placeUnit(renderer.overlayUnit);
            }
            
            gameMakerViewModel.selectedUnit(renderer.selectedUnit);
            renderer.overlayUnit = emptyUnit;
        }
    });
};

//Undo/Redo
$(document).ready(function () {
    var control = "17",
        zKey = "90",
        yKey = "89",
        controlHeld = false;

    $(window).keydown(function (e) {
        if (e.keyCode == control)
            controlHeld = true;

        if (controlHeld && e.keyCode == zKey)
            GM.UndoManager.undo();

        if (controlHeld && e.keyCode == yKey)
            GM.UndoManager.redo();
    });

    $(window).keyup(function (e) {
        if (e.keyCode == control)
            controlHeld = false;
    });
});