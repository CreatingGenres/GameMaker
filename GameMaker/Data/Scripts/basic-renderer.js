
//animation frame
(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame || function (callback) { setTimeout(callback, 60 /* fps */); };
})();
 
var renderer = [];

// DAFUQ: even when not in the editor screen, this scripts continues to execute -> slows stuff down and other stuff and I am right, you is not
$(document).ready(function () {
    renderer = (function (viewModel) {
        //so, this is just a simple renderer for our game maker
        //we just need a couple of units and a game object
        
        var canvas = $("#game-canvas")[0],
            context = canvas.getContext("2d"),
            units = viewModel.model.units,
            textures = [],
            overlayUnit = emptyUnit,
            selectedUnit = emptyUnit;

        function updateTextures() {
            for (var i in viewModel.library.images) {
                textures[viewModel.library.images[i]] =
                    new Image(viewModel.library.images[i]);
            }
        }
        
        function drawBorder(unit) {
            context.strokeStyle = "rgba(255, 255, 255, 0.5)";
            context.strokeRect(unit.position.x(), unit.position.y(),
                               unit.size.width(), unit.size.height());
        }
        
        var isUnitSelected = false;
        function render() {
            //background
            context.clearRect(0, 0, canvas.width, canvas.height);
            if (textures[viewModel.model.background.texture()])
                context.drawImage(textures[viewModel.model.background.texture()],
                                  0, 0, canvas.width, canvas.height);
            
            //units
            isUnitSelected = false;
            for (var i = 0; i < units().length; ++i) {
                var unit = units()[i];
                
                if (unit.isPrototype())
                    continue;
                
                if (unit.color) {
                    context.fillStyle = unit.color();
                    context.fillRect(unit.position.x(), unit.position.y(),
                                     unit.size.width(), unit.size.height());
                    
                } else {
                    if (textures[unit.texture()])
                        context.drawImage(textures[unit.texture()],
                                          unit.position.x(), unit.position.y(),
                                          unit.size.width(), unit.size.height());
                }
                
                //select border
                if (window.mouse &&
                    // DAFUQ how does this work?
                    isInCanvas(unit, canvas)) {
                    
                    isUnitSelected = true;
                    renderer.selectedUnit = unit;
                    drawBorder(unit);
                }
                
                if (viewModel.selectedUnit().id() !== "None" &&
                    !viewModel.selectedUnit().isPrototype())
                    drawBorder(viewModel.selectedUnit());
                
            }
            
            if (renderer.overlayUnit.id() != "None" && renderer.overlayUnit.texture) {
                context.drawImage(textures[renderer.overlayUnit.texture()],
                                  renderer.overlayUnit.position.x(), renderer.overlayUnit.position.y(),
                                  renderer.overlayUnit.size.width(), renderer.overlayUnit.size.height());
            }
            if (!isUnitSelected)
                renderer.selectedUnit = emptyUnit;
            
            //that's it
            window.requestAnimationFrame(render);
        };

        function updateViewModel(newViewModel) {
        	viewModel = newViewModel;
        	units = viewModel.model.units;
        }

        //initial update
        updateTextures();
        window.requestAnimationFrame(render);
        
        return {
        	overlayUnit: overlayUnit,
        	selectedUnit: selectedUnit,
        	updateViewModel: updateViewModel,
            updateTextures: updateTextures
        };
    }(gameMakerViewModel));
});