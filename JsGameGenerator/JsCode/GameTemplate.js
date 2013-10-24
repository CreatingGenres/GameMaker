/// <reference path="extensions.js" />

var game;
$(document).ready(function () {
    game = (function () {

        var canvas = $('#play-canvas')[0];
        var context = canvas.getContext('2d');

        (function () {
            var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame ||
                                        function (callback) {
                                            setTimeout(callback, 15);
                                        };
            window.requestAnimationFrame = requestAnimationFrame;
        })();

		// Hold various settings controlling how the game runs
        var settings = {
            updateTime: 1000/30,
            updateTimeoutId: -1
        };
		// Handles loading images and provides an event (jQuery Deferred) that is raised when everything's loaded
        var loader = {
            imagesToLoad: 0,
            loadedImages: 0,
            gameLoaded: $.Deferred(),
            checkImagesLoaded: function () {
            	if (loader.loadedImages == loader.imagesToLoad) {
            		loader.gameLoaded.resolve();
            	}
            },
            onImageLoaded: function () {
            	loader.loadedImages++;
            	loader.checkImagesLoaded();
            }
        };
		// Just in case everything has been loaded stupidly fast
        loader.checkImagesLoaded();

		// Notifies external code of the stuff that happened in the game. Provides default behaviour, override to produce new behaviour.
        var logger = {
        	onError: function (error) {
        		console.error(error);
        	},
        	onInfo: function (info) {
				console.log(info)
        	},
        }

    	// Selects game objects using the following table:
    	// 1. If input starts with # consider the rest of the string as the name of an UNIQUE unit and select it
    	// 2. If inputs starts with . consider the rest of the string as the name of a unit PROTOTYPE and select all instances of the prototype
		// 3. Else, consider the rest of string as a name of a GAME MODULE and select it.
        var selector = function (input) {
            var elements = [];
            if (input.startsWith("#")) {
                elements.push(units[input.substr(1)]);
            }
            else if (input.startsWith(".")) {
                var unitId = input.substr(1);
                for (var i in units) {
                    if (units[i].id.startsWith(unitId)) {
                        elements.push(units[i]);
                    }
                }
            }
            else {
                elements.push(modules[input]);
            }

            return elements;            
        };

        var Animation = (function () {
            function Animation(row, framesPerRow, startCol, endCol, duration, mustFinish) {
                if (startCol >= endCol)
                    throw new RangeError("startCol must be more than endCol");

                this.rowFrame = row;
                this.colFrame = startCol;
                if (!duration)
                    duration = framesPerRow;
                //Fuck you IE!
                this.duration = duration;
                this.framesPerRow = framesPerRow;
                this.frameCounter = 0;
                this.timePerFrame = duration / (endCol - startCol);
                this.mustFinish = mustFinish ? true : false;
                var restarted = false;
                var hasFinished = false;
                this.reset = function () {
                    this.colFrame = startCol;
                    this.frameCounter = 0;
                    this.hasFinished = false;
                };
                this.update = function () {
                    this.frameCounter++;
                    if (this.frameCounter * settings.updateTime >= this.timePerFrame) {
                        this.colFrame++;
                        this.colFrame %= endCol;
                        this.frameCounter = 0;
                        if (this.colFrame == endCol - 1) {
                            this.colFrame = startCol;
                            this.hasFinished = true;
                        }
                    }
                }
            }

            Animation.empty = new Animation(0, 0, 0, 1, Number.MAX_VALUE, false);
            Animation.empty.update = function () { };

            return Animation;
        })();

    	// Holds the start state of the game. Used for restarting the game.
        var startState = {
        	units: [],
        	unitPrototypes: [],
        	modules: [],
			isEmpty: true
        };
        var background;
        //<!--BACKGROUND-->

		// Creates a module and sets its basic properties
        var createModule = function (name, data) {
            return {
                name: name,
                data: data
            };
        };

		// Arrays to hold the implementations of the game and unit modules
        var modules = [];
        var unitModules = [];

    	/// <summary>
        /// Evaluates string commands in the specified context and updates the value of the specified property of the specified object.
    	/// The extra context variable is needed to properly evaluate 'this'.
        /// </summary>
    	/// <param name="context" type="Object">The context in which to evaluate.</param>
    	/// <param name="obj" type="Object">The object whose property to update.</param>
    	/// <param name="property" type="String">The name of the property to be updated.</param>
    	/// <param name="input" type="String">The command to evaluate.</param>
        var evaluateInput = (function () {
        	var evaluateInputInContext = function (obj, property, input) {
        		if (!input.startsWith)
        			input = input.toString();
        		if (input.startsWith("+")) {
        			obj[property] += eval(input.substr(1, input.length));
        		}
        		else if (input.startsWith("-")) {
        			obj[property] -= eval(input.substr(1, input.length));
        		}
        		else {
        			obj[property] = eval(input);
        		}
        	};

        	var evaluateInput = function (context, obj, property, input) {
				// Context is needed since we are eval-ing stuff like 'this.x'
        		evaluateInputInContext.call(context, obj, property, input);
        	};

        	return evaluateInput;
        })();

    	/// <summary>Raises the specified event on the specified unit with the specified arguments to the event handler.</summary>
    	/// <param name="unit" type="Object">The unit to raise event on.</param>
    	/// <param name="eventName" type="String">The name of the event to raise.</param>
    	/// <param name="args" type="Object">A dictionary holding the arguments.</param>
        var raiseEvent = function (unit, eventName, args) {
        	if (unit.events[eventName]) {
        		try {
        			unit.events[eventName].call(unit, args);
        		} catch (e) {
        			logger.onError(String.format("Error raising event {0}. Error: {1}", eventName, e));
        		}
        	}
        };

    	/// <summary>Standart event handler. Updates property values and calls any methods if specified in action.</summary>
    	/// <param name="unit" type="Object">The unit to operate on.</param>
    	/// <param name="properties" type="Array">An array of property names to update.</param>
    	/// <param name="action" type="Object">
        /// An optional simple object. 
    	/// Holds 3 values - a target, a module to be called on the target and arguments to the module call.
        /// </param>
        var basicEventHandler = function (unit, properties, action) {
            for (var i in properties) {
                // Different from an empty string, else things like 0 will be truthy
                if (unit[i] != undefined && unit[i] != "" && properties[i] != "") {
                    evaluateInput(unit, unit, i, properties[i]);
                }
            }
            
            if (properties.points && modules["points"]) {
                evaluateInput(modules["points"], modules["points"], "points", properties.points);
            }
            if (properties.stillPlaying != undefined && properties.stillPlaying != "") {
				// And 1 to convert to bool
                stillPlaying = eval(properties.stillPlaying) && 1;
            }
            if (action) {
            	var selected = selector(action.target);
            	for (var i = 0; i < selected.length; i++) {
            		selected[i][action.module].call(selected[i], action.args);
            	}
            }
        }

        //<!--MODULES-->

		// Arrays to hold units and their prototypes
        var units = [];
        var unitPrototypes = [];

		// Enumeration of possible states a unit is in.
        var UnitStates = {
            alive: "alive",
            dead: "dead",
            dying: "dying",
        }

    	/// <summary>Base class for all units. Defines their id, position, rotation and health.</summary>
        var Unit = (function() { 
            function Unit(id, x, y, hp, rotateX) {
                this.id = id;
                this.dx = 0;
                this.dy = 0;
                this.rotateX = rotateX ? rotateX : 0;
                this.scaleX = 1;
                this.scaleY = 1;
                this.hp = hp;
                this.state = UnitStates.alive;
                this.boundingFigure = new BoundingFigure();
                this.boundingFigure.x = x;
                this.boundingFigure.y = y;

                this.events = [];
            };

            Object.defineProperties(Unit.prototype, {
                "x": {
                    get: function () {
                        return this.boundingFigure.x;
                    },
                    set: function (value) {
                        this.boundingFigure.x = value;
                    }
                },
                "y": {
                    get: function () {
                        return this.boundingFigure.y;
                    },
                    set: function (value) {
                        this.boundingFigure.y = value;
                    }
                }
            });

            Unit.prototype.update = function () {
            	if (this.dx != 0 || this.dy != 0) {
            		if (this.move) {
            			this.move({ dx: this.dx, dy: this.dy });
            		}
            		else {
            			this.x += this.dx;
            			this.y += this.dy;
            		}
            	}
            	this.updateCallback();
            };

        	/// <summary>A method that is called in unit's update method. Implement it to actually update the object.</summary>
            Unit.prototype.updateCallback = function () { };
        	/// <summary>A method that is called in the unit's draw method. Implement it to actually draw the object.</summary>
            Unit.prototype.drawCallback = function () { };
			
        	/// <summary>Draws the unit. To override this behaviour implement drawCallback.</summary>
            Unit.prototype.draw = function () {
                context.save();
                context.translate(this.x + this.width / 2, this.y + this.height / 2);
                context.rotate(this.rotateX);
                context.scale(this.scaleX, this.scaleY);
                context.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
                this.drawCallback(context);
                context.restore();
            };
             
            Unit.prototype.isColliding = function (unit) {
                return this.boundingFigure.intersects(unit.boundingFigure);
            };

            Unit.prototype.die = function () {
                raiseEvent(this, 'onDeath');
                this.state = UnitStates.dead;
            };

            return Unit;
        })();

        var RectUnit = (function () {
        	var base = Unit;
        	__extends(RectUnit, base);

        	function RectUnit(id, x, y, width, height, hp, rotateX, rotateY) {
        		base.call(this, id, x, y, hp, rotateX, rotateY);
        		this.boundingFigure = new BoundingRectangle(x, y, width, height);

        	}

        	Object.defineProperties(RectUnit.prototype, {
        		"width": {
        			get: function () {
        				return this.boundingFigure.width;
        			},
        			set: function (value) {
        				this.boundingFigure.width = value;
        			}
        		},
        		"height": {
        			get: function () {
        				return this.boundingFigure.height;
        			},
        			set: function (value) {
        				this.boundingFigure.height = value;
        			}
        		}
        	});

        	return RectUnit;
        })();

        var createUnit = function (type, isPrototype, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15) {
            var unit = new type(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15);
            if (isPrototype) {
                unitPrototypes[unit.id] = unit;
            }
            else {
                units[unit.id] = unit;
            }

            return unit;
        };
        units.canvasRight = createUnit(RectUnit, false, "canvasRight", canvas.width, 0, 1, canvas.height, 1);
        units.canvasLeft = createUnit(RectUnit, false, "canvasLeft", 0, 0, 1, canvas.height, 1);
        units.canvasTop = createUnit(RectUnit, false, "canvasTop", 0, 0, canvas.width, 1, 1);
        units.canvasBottom = createUnit(RectUnit, false, "canvasBottom", 0, canvas.height, 1, canvas.width, 1);
        units.canvasRight.isColliding = function (unit) {
            return unit.x + unit.width >= canvas.width;
        };
        units.canvasLeft.isColliding = function (unit) {
            return unit.x <= 0;
        };
        units.canvasTop.isColliding = function (unit) {
            return unit.y <= 0;
        };
        units.canvasBottom.isColliding = function (unit) {
            return unit.y + unit.height >= canvas.height;
        };

        //<!--UNITS-->

		// Boolean array to represent the state of the keyboard 
        var keyboard = [];
        var previousKeyboard = [];
		// Object to hold the state of the mouse - its position and 3 boolean variables - left, middle, right
        var mouse = {};
        mouse.position = new Vector2(0, 0);
        var previousMouse = {};

		// Handle mouse and keyboard input
        window.addEventListener("keydown", function (args) {
            keyboard[args.which] = true;
        }, false);

        window.addEventListener("keyup", function (args) {
            keyboard[args.which] = false;
        }, false);


		// Raise the click event on the units below the mouse
        $(window).click(function (args) {
        	for (var i in units) {
        		if (units[i].boundingFigure.contains(mouse.position)) {
        			raiseEvent(units[i], 'onClick', {});
        		}
        	}        	
        });

        $(window).mousedown(function (args) {
        	switch (args.which) {
        		case 1:
        			mouse.left = true;
        			break;
        		case 2:
        			mouse.middle = true;
        			break;
        		case 3:
        			mouse.right = true;
        			break;
        	};
        });

        $(window).mouseup(function (args) {
            switch (args.which) {
                case 1:
                    mouse.left = false;
                    break;
                case 2:
                    mouse.middle = false;
                    break;
                case 3:
                    mouse.right = false;
                    break;
            };
        });
        
		// Update the mouse position and raise the mouseOver event
        window.addEventListener("mousemove", function (args) {
            mouse.position.x = args.clientX;
            mouse.position.y = args.clientY;

            for (var i in units) {
            	if (units[i].boundingFigure.contains(mouse.position)) {
            		raiseEvent(units[i], 'onMouseOver', {});
            	}
            }
        });

    	/// <summary>Removes all units that with health < 1</summary>
        var removeUnits = function () {
            var toBeRemoved = [];
            var maximumOffset = 0;
            for (var i in units) {
                if (units[i].state == UnitStates.dead) {
                    toBeRemoved.push(units[i].id);
                }
                else if (units[i].hp < 1 && units.state != UnitStates.dying) {
                    units[i].die();
                }

                //var isOutOfBounds =
                //    units[i].x + units[i].width + maximumOffset < 0 ||
                //    units[i].x - maximumOffset > canvas.width ||
                //    units[i].y + units[i].height + maximumOffset < 0 ||
                //    units[i].y - maximumOffset > canvas.height
                //if (isOutOfBounds) {
                //    units[i].die();
                //    toBeRemoved.push(units[i].id);
                //}
            }

            for (var i in toBeRemoved) {
                Array.removeItem(units, toBeRemoved[i]);
            }
        };

		// StillPlaying shows whether the game isn't over, isPaused shows whether... well if the game is paused.
        var stillPlaying = true;
        var isPaused = true;
		// Increment this counter for every update call.
        var updateCounter = 0;

        var update = function () {
            //<!--KEYBINDINGS-->
            for (var i in modules) {
                if (modules[i].update) {
                    modules[i].update();
                }
            }

            for (var i in units) {
                units[i].update();
            }

            removeUnits();

            $.extend(true, previousKeyboard, keyboard);
            $.extend(true, previousMouse, mouse);

            if (stillPlaying && !isPaused)
            	settings.updateTimeoutId = setTimeout(update, settings.updateTime);

            updateCounter++;
        };

        var draw = function () {
            //<!--DRAW-->

        	context.save();
        	context.clearRect(0, 0, canvas.width, canvas.height);
        	if (modules.camera) {
        		modules.camera.draw();
        	}

            if (background) {
                background.draw();
            }
            //Draw all modules regardless if we are still playing.
            for (var i in modules) {
            	if (modules[i].draw) {
            		try {
            			modules[i].draw();
            		} catch (e) {
            			logger.onError(String.format("Error drawing module '{0}'. Error: {1}", i, e));
            		}
                }
            }

            if (stillPlaying) {
                for (var i in units) {
                    units[i].draw();
                }

                if (isPaused) {
                	context.fillStyle = "white";
                	context.font = "72px Segoe UI";
                	var text = "PAUSED";
                	context.save();
                	context.setTransform(1, 0, 0, 1, 0, 0);
                	context.fillText(text, canvas.width / 2 - text.length * 36 / 2, canvas.height / 2);
                	context.restore();
                }

                window.requestAnimationFrame(draw);
            }
            else {
                context.fillStyle = "white";
                context.font = "72px Comic Sans MS";
                var gameOver = "Game Over";
                var textSize = gameOver.length * 36;
                context.fillText(gameOver, canvas.width / 2 - textSize / 2, canvas.height / 2)
            }

            context.restore();
        };

		// Restores the state of the game back to the starting one
        var restoreState = function () {
            units = Array.deepCopy(startState.units);
            unitPrototypes = Array.deepCopy(startState.unitPrototypes);
            modules = Array.deepCopy(startState.modules);
            updateCounter = 0;
        };

    	/// <summary>Runs the game from the start. (resets it if needed)</summary>
        var start = function () {
			// If the game runs for the first time, save its state
            if (startState.isEmpty) {
                startState = {
                    units: Array.deepCopy(units),
                    unitPrototypes: Array.deepCopy(unitPrototypes),
                    modules: Array.deepCopy(modules),
                    isEmpty: false
                };
            }
			// Else stop the previous game and restore the state
            else {
                clearTimeout(settings.updateTimeoutId);
                restoreState();
            }
			// Run the game once more
            stillPlaying = true;
            isPaused = false;
            update();
            draw()
        };

        var game = {
            settings: settings,
            loader: loader,
            start: start,
            togglePause: function () {
                isPaused = !isPaused;
            },
        };
        Object.defineProperty(game, "isPaused", {
        	enumerable: true,
        	get: function () {
        		return isPaused;
        	}
        })

        return game;
    })();
});