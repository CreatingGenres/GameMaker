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

        var settings = {
            updateTime: 1000/30,
            updateTimeoutId: -1
        };
        var loader = {
            imagesToLoad: 0,
            loadedImages: 0,
            gameLoaded: $.Deferred(),
            onImageLoaded: function () {
                loader.loadedImages++;
                if (loader.loadedImages == loader.imagesToLoad) {
                    loader.gameLoaded.resolve();
                }
            }
        };
        if (loader.loadedImages == loader.imagesToLoad)
            loader.gameLoaded.resolve();

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

        var evaluateInput = (function () {
            var evaluateInputInContext = function (obj, property, input) {
                if (!input.startsWith)
                    input = input.toString();
                if (input.startsWith("+")) {
                    console.log("+ happened");
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
                evaluateInputInContext.call(context, obj, property, input);
            };

            return evaluateInput;
        })();

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


        var startState;
        var background;
        //<!--BACKGROUND-->

        var createModule = function (name, data) {
            return {
                name: name,
                data: data
            };
        };

        var modules = [];
        var unitModules = [];

        var raiseEvent = function (unit, module, args) {
            if (unit.events[module])
                unit.events[module].call(unit, args);
        };

        var basicEventHandler = function (unit, actions) {
            for (var i in actions) {
                // Different from an empty string, else things like 0 will be truthy
                if (unit[i] != undefined && unit[i] != "" && actions[i] != "") {
                    evaluateInput(unit, unit, i, actions[i]);
                }
            }
            
            if (actions.points && modules["points"]) {
                evaluateInput(modules["points"], modules["points"], "points", actions.points);
            }
            if (actions.stillPlaying != undefined && actions.stillPlaying != "") {
                stillPlaying = eval(actions.stillPlaying) && 1;
            }
        }

        //<!--MODULES-->

        var units = [];
        var unitPrototypes = [];
        var UnitStates = {
            alive: "alive",
            dead: "dead",
            dying: "dying",
        }
        var Unit = (function() { 
            function Unit(id, x, y, hp, rotateX, rotateY) {
                this.id = id;
                this.dx = 0;
                this.dy = 0;
                this.rotateX = rotateX ? rotateX : 0;
                this.rotateY = rotateY ? rotateY : 0;
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
                this.x += this.dx;
                this.y += this.dy;
            };

            Unit.prototype.drawCallback = function () { };

            Unit.prototype.draw = function () {
                context.save();
                context.translate(this.x + this.width / 2, this.y + this.height / 2);
                context.rotate(this.rotateX);
                context.scale(this.scaleX, this.scaleY);
                context.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
                this.drawCallback();
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

        var keyboard = [];
        var previousKeyboard = [];
        
        window.addEventListener("keydown", function (args) {
            keyboard[args.which] = true;
        }, false);

        window.addEventListener("keyup", function (args) {
            keyboard[args.which] = false;
        }, false);


        var mouse = [];
        var previousMouse = [];

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
        
        window.addEventListener("mousemove", function (args) {
            mouse.x = args.clientX;
            mouse.y = args.clientY;
        });

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

                var isOutOfBounds =
                    units[i].x + units[i].width + maximumOffset < 0 ||
                    units[i].x - maximumOffset > canvas.width ||
                    units[i].y + units[i].height + maximumOffset < 0 ||
                    units[i].y - maximumOffset > canvas.height
                if (isOutOfBounds) {
                    units[i].die();
                    toBeRemoved.push(units[i].id);
                }
            }

            for (var i in toBeRemoved) {
                Array.removeItem(units, toBeRemoved[i]);
            }
        };

        var stillPlaying = true;
        var updateTimeoutId = -1;
        var previousEntrance = new Date();
        var update = function () {
            //<!--KEYBINDINGS-->
            previousEntrance = new Date();
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

            if (stillPlaying)
                updateTimeoutId = setTimeout(update, settings.updateTime);
        };

        var draw = function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
            //<!--DRAW-->

            if (background) {
                background.draw();
            }

            //Draw all modules regardless if we are still playing.
            for (var i in modules) {
                if (modules[i].draw) {
                    modules[i].draw();
                }
            }

            if (stillPlaying) {
                for (var i in units) {
                    units[i].draw();
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
        };

        var restoreState = function () {
            units = Array.deepCopy(startState.units);
            unitPrototypes = Array.deepCopy(startState.unitPrototypes);
            modules = Array.deepCopy(startState.modules);
        };

        var start = function () {
            if (!startState) {
                startState = {
                    units: Array.deepCopy(units),
                    unitPrototypes: Array.deepCopy(unitPrototypes),
                    modules: Array.deepCopy(modules)
                };
            }
            else {
                clearTimeout(updateTimeoutId);
                restoreState();
            }
            stillPlaying = true;
            update();
            draw()
        };

        return {
            settings: settings,
            loader: loader,
            start: start,
            stop: function () {
                stillPlaying = false;
            },
        };
    })();
    game.loader.gameLoaded.done(game.start);
});