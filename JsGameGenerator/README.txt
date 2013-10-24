Short description of the algorithm used inside the JSGenerator.


Abstract:

1. The generator uses a simple data model to produce the javascript code of the game. This data model is the GameModel class, which contains several other abstractions - 
the game's name and background, a list of units, modules and so on.

2. The main method is JsGenerator.GenerateGameCode. It assembles the whole program.

3. The Generator depends on two javascript files:
	- JsCode/Extensions.js - contains utility methods (String.format for example), OOP basics, bounding figure math.
	- JsCode/GameTemplate.js - the backbone of our algorithm. This file contains all important definitions (such as the base Unit class), handles loading images,
	running / pausing / stopping the game loop. Also, it contains a few placeholders where the generated code is injected.

	The generator replaces the placeholders with the code it has produced (such as module and unit definition).


List of global values in the game file (in order of appearance):
	
	1. loader - handles loading images, has a jQuery.Deferred that is resolved when all images are loaded. Extend it to handle loading sound/video.
	2. settings - contains some game-specific settings such as the setTimeout id of the update loop, as well as the time between two updates
	3. updateCounter - a simple counter incremented whenever a game.update call is made. The 'time' semantic is replaced with the this.
	4. canvas / context - the canvas to draw the game upon and its CanvasRenderingContext2D
	5. modules - a list of all modules attached to the game. Indexed by module name.
	6. units - a list of all units CURRENTLY SPAWNED in the game. Indexed by unit name.
	7. unitPrototypes - a list of all units prototypes in the game. Indexed by prototype name.
	8. background - HTMLImageElement, background
	9. logger - well, logs information and errors
	10. startState - used to reset the game back to its start state on game.reset
	11. stillPlaying - whether the game is still active (not stopped)
	12. isPaused - whether the game is currently paused
	13. keyboard / previousKeyboard - boolean arrays, if element x is true, then the key whose code is x is down
	14. mouse / previousMouse - objects, holding the position and the state of the left, middle and right mouse buttons

Modules:

	Modules are small objects / methods that add functionality to our game / units.

	1. Game modules are objects that are attached to the game (much like the approach used in Unity). Every game module may implement the followin methods:
		- update - called whenever the game is updating itself
		- draw - called whenever the game is drawing
		- invoke - implement this method to allow the module to be called like a function 
	Implement game modules like simple objects.

	2. Unit modules are FUNCTIONS attached to units (I don't say). Think of them as a way to give your characters superpowers like flying and attacking, but also
	allow them to move, walk, speak.

If you'd like to learn about what code every element of the game produces, start from JsGenerator.GenerateGameCode and follows the method calls. Best take a look at
an already generated game to see the code in action.