// TODO: Depends on Extensions.js. What nao?

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
        var background = new Image();
		background.src = 'http://www.nesmaps.com/maps/SuperMarioBrothers/images/SMB1-1BG.png';
		background.onload = loader.onImageLoaded;
		loader.imagesToLoad++;
		background.draw = function() {
			context.drawImage(this, 0, 0, canvas.width, canvas.height);
		}

        var createModule = function (name, data) {
            return {
                name: name,
                data: data
            };
        };

        var modules = [];
        var unitModules = [];


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


        var raiseEvent = function (unit, module, args) {
            if (unit.events[module])
                unit.events[module].call(unit, args);
        };

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

        unitModules['move'] = function (params) { raiseEvent(this, 'move', arguments[0]);  
			if (params.dx) {
				this.x += eval(params.dx); 
			}
			if (params.dy) {
				this.y += eval(params.dy); 
			}
		};
unitModules['Dialog'] = function (action) { raiseEvent(this, 'Dialog', arguments[0]); 
        
        var data = this.moduleData["Dialog"];
        //console.log(action, data, unit);
          
        if (action == "draw" && data.visible) {
          context.save();
            
          context.fillStyle = "white";
          context.font = "20px Arial";
          var dialogX = this.x + this.width,
              dialogY = this.y - 150,
              words = (data.currentText || data.text1).split(" ");
              
          context.fillRect(dialogX, dialogY, 150, 150);
              
          var cLen = 0, mult = 0;
              
          context.fillStyle = "black";
          for (var i in words) {
            context.fillText(words[i], 20 + dialogX + cLen, 40 + dialogY + mult * 25);
        
            cLen += context.measureText(words[i] + " ").width;
            if (cLen > 130) {
              cLen = 0;
              mult++;
            }
          }
        } else if (action == "next") {
          console.log("next");      
            
          data.visible = true;
          if (!data.currentText)
            data.currentText = data.text1;
            
          else {
            switch(data.currentText) {
              case data.text1:
                data.currentText = data.text2;
                break;
              case data.text2:
                data.currentText = data.text3;
                break;
              case data.text3:
                data.visible = false;
                break;
            }
          }
        } else if (action == "hide") {
          console.log("hide");
          
          data.visible = false;
        }
      };
unitModules['talk'] = function(params) { raiseEvent(this, 'talk', arguments[0]); 
        if (!this.Dialog || this.moduleData["Dialog"].visible == true)
          return;
        
        this.Dialog.call(this, "next");
        //raiseEvent(this, "Dialog", "next");
        if (this.events["Dialog"])
          this.events["Dialog"].call(this, { action: "next" });
        
        var self = this;
        setTimeout(function () {
          self.Dialog.call(self, "hide");
          
          if (self.events["Dialog"])
            self.events["Dialog"].call(self, { action: "hide" });
          //raiseEvent(self, "Dialog", "hide");
        }, 2000);
      };

var module = createModule('collider', (function() { var data = [];  return data; })());
		$.extend(module, (function() {
				return {
					update: function() {
						for(var i in units) {
							for(var j in units) {
								if (units[i].isColliding(units[j])) {
                    if (i == j)
                      continue;
                
                    raiseEvent(units[i], "onCollision", {enemyName: units[j].id.removeAfter("_") });
                    //raiseEvent(units[j], "onCollision", {enemyName: units[i].id.removeAfter("_") });
								}
							}
						}
					}
				};
			})());
		modules['collider'] = module;
		var module = createModule('unit-generator', (function() { var data = [];  return data; })());
		$.extend(module, (function () {
				var counter = 0;
        var generate = function generate(params, mousy) {
						var id = params.unit || params.id, coordinates = {
              x: params.unitX,
              y: params.unitY,
              dx: params.unitDx,
              dy: params.unitDy,
            }
						if (!unitPrototypes[id]) {
							return;
						}
						if (mousy) {
							var mouse = mousy;
						}
						var unit = clone(unitPrototypes[id]);
						unit.id = id + "_" + this.counter;
						unit.x = eval(coordinates.x);
						unit.y = eval(coordinates.y);
						if (coordinates.dx) {
							unit.dx = eval(coordinates.dx);
						}
						if (coordinates.dy) {
							unit.dy = eval(coordinates.dy);
						}
						units[unit.id] = unit;
					  raiseEvent(unit, "onSpawn");
						this.counter++;
					}
				return {
					counter: 0,
					generate: generate,
          invoke: generate,
				}
			})());
		modules['unit-generator'] = module;
		var module = createModule('speechDisplayer', (function() { var data = [];  return data; })());
		$.extend(module, (function () {
        return {
          draw: function() {
            for (var i in units) {
              if (units[i].Dialog) {
                //raiseEvent(units[i], "Dialog", "draw");
                units[i].Dialog.call(units[i], "draw");
              }
            }
          },
          invoke: function() {
          }
        };
      })());
		modules['speechDisplayer'] = module;
		

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

        	var AnimatedSpriteUnit = (function AnimatedSpriteUnit() {
	var base = RectUnit;
	__extends(AnimatedSpriteUnit, base);

	function AnimatedSpriteUnit(id, texture, animations, framesPerRow, framesPerCol, x, y, width, height, hp, rotateX, rotateY) {
		base.call(this, id, x, y, width, height, hp, rotateX, rotateY);
		this.animations = animations;
		this.runningAnimation = 'idle'; //BECAUSE IE
		this.activeAnimationChangedRecently = false;
		if (texture) {
			this.texture = new Image();
			this.texture.src = texture;
			loader.imagesToLoad++;
			var self = this;
			this.texture.onload = function() {
				self.swidth = self.texture.width / framesPerRow;
				self.sheight = self.texture.height / framesPerCol;
				loader.onImageLoaded();
			};
		}
	}
				
	Object.defineProperties(AnimatedSpriteUnit.prototype, {
		'activeAnimation': {
			get: function() {
				return this.runningAnimation;
			},
			set: function(value) {							
				if (value == this.runningAnimation) {
					if (this.animations[this.runningAnimation].hasFinished) 
						this.animations[this.runningAnimation].reset();
					return;
				}


				if (this.canChangeAnimationTo(value)) {
					this.activeAnimationChangedRecently = true;
					this.runningAnimation = value;
					if (this.animations[this.runningAnimation].mustFinish) {
						this.animations[this.runningAnimation].reset();
					}
				}
			}
		},
	});

	AnimatedSpriteUnit.prototype.canChangeAnimationTo = function (nextAnimation) {
		var next = this.animations[nextAnimation];
		if (!next)
			return false;

		if (next.mustFinish) {
			return true;	
		}

		var active = this.animations[this.runningAnimation];
		if (active.mustFinish && !active.hasFinished)
			return false;

		return true;
	};
				
	AnimatedSpriteUnit.prototype.update = function () {
		if (this.move) {
			this.move({dx: this.dx, dy: this.dy});
		}
		else {
			this.x += this.dx;
			this.y += this.dy;
		}
		if (!this.activeAnimationChangedRecently && this.canChangeAnimationTo('idle')) {
			this.activeAnimation = 'idle';
		}
		this.animations[this.activeAnimation].update();

		this.activeAnimationChangedRecently = false;
	};

	AnimatedSpriteUnit.prototype.drawCallback = function () {
		var sx = this.animations[this.activeAnimation].colFrame * this.swidth;
		var sy = this.animations[this.activeAnimation].rowFrame * this.sheight;
		context.drawImage(this.texture, sx, sy, this.swidth, this.sheight, this.x, this.y, this.width, this.height);
	};
				
	AnimatedSpriteUnit.prototype.die = function () {
		if (this.state != UnitStates.dying) {
			raiseEvent(this, 'onDeath');
		}
		this.state = UnitStates.dying;
		var self = this;
		var activeAnimation = this.animations[this.activeAnimation];
		setTimeout(function () {
			Array.removeItem(units, this.id);
			self.state = UnitStates.dead;
		}, settings.updateTime * activeAnimation.framesPerRow);
	};


	return AnimatedSpriteUnit;				
})();
	var InanimatedSpriteUnit = (function InanimatedSpriteUnit() {
	var base = RectUnit;
	__extends(InanimatedSpriteUnit, base);

	function InanimatedSpriteUnit(id, texture, x, y, width, height, hp) {
		base.call(this, id, x, y, width, height, hp);
		if (texture) {
			this.texture = new Image();
			this.texture.src = texture;
			loader.imagesToLoad++;
			var self = this;
			this.texture.onload = loader.onImageLoaded;
		}
	};

	InanimatedSpriteUnit.prototype.drawCallback = function () {
		context.drawImage(this.texture, this.x, this.y, this.width, this.height);
	};

	return InanimatedSpriteUnit;
})();
	var RectangleUnit = (function RectangleUnit() {
	var base = RectUnit;
	__extends(RectangleUnit, base);

	function RectangleUnit(id, color, x, y, width, height, hp) {
		base.call(this, id, x, y, width, height, hp);
		this.color = color;
	};

	RectangleUnit.prototype.drawCallback = function () {
		context.fillStyle = this.color;
		context.fillRect(this.x, this.y, this.width, this.height);
	}

	return RectangleUnit;
})();

			var unit = createUnit(InanimatedSpriteUnit, true, 'Basic', 'images/library/blue-monster.png', 50, 200, 40, 40, 1);
			unit.dx = 0; unit.dy = 0


			var unit = createUnit(InanimatedSpriteUnit, false, 'Mario', 'http://images2.wikia.nocookie.net/__cb20120922002943/fantendo/images/f/fc/MarioNSMBWii.png', 604.597701149425, 423.433242506812, 100, 100, 1);
			unit.dx = -5; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['move'] = (function() { var data = [];  return data; })();
moduleData['Dialog'] = (function() { var data = []; data['text1'] = "I'm here"; data['text2'] = "Go on, baby."; data['text3'] = "Hell, yeah!";  return data; })();
moduleData['talk'] = (function() { var data = [];  return data; })();

		return {
				
		move : unitModules['move'], 
	
		Dialog : unitModules['Dialog'], 
	
		talk : unitModules['talk'], 
		moduleData: moduleData
		};
	})());unit.events = (function () { var events = [];
events['onCollision'] = function(args) {if (args['enemyName'] == eval("'Peach'") && true)
basicEventHandler.call(this, this, (function() { var data = []; data['hp'] = ""; data['dX'] = ""; data['dY'] = ""; data['width'] = ""; data['height'] = ""; data['stillPlaying'] = ""; data['points'] = "";  return data; })(), new Object({ target: '#Mario', module: 'move', args: new Object({dx: '5', dy: '0', })}));
};
events['Dialog'] = function(args) {if (args['action'] == eval("'hide'") && true)
basicEventHandler.call(this, this, (function() { var data = []; data['hp'] = ""; data['dX'] = ""; data['dY'] = ""; data['width'] = ""; data['height'] = ""; data['stillPlaying'] = ""; data['points'] = "";  return data; })(), new Object({ target: '#Peach', module: 'talk', args: new Object({})}));
};
return events; })();
raiseEvent(unit, 'onSpawn');


			var unit = createUnit(InanimatedSpriteUnit, false, 'Peach', 'http://www.mariowiki.com/images/thumb/7/75/Peach_FS.png/200px-Peach_FS.png', 225.287356321839, 431.607629427793, 50, 90, 1);
			unit.dx = 0; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['Dialog'] = (function() { var data = []; data['text1'] = "Come here."; data['text2'] = "That's it, boy."; data['text3'] = "Good boy.";  return data; })();
moduleData['talk'] = (function() { var data = [];  return data; })();

		return {
				
		Dialog : unitModules['Dialog'], 
	
		talk : unitModules['talk'], 
		moduleData: moduleData
		};
	})());unit.events = (function () { var events = [];
events['onSpawn'] = function(args) {basicEventHandler.call(this, this, (function() { var data = []; data['hp'] = ""; data['dX'] = ""; data['dY'] = ""; data['width'] = ""; data['height'] = ""; data['stillPlaying'] = ""; data['points'] = "";  return data; })(), new Object({ target: '#Peach', module: 'talk', args: new Object({})}));
};
events['Dialog'] = function(args) {if (args['action'] == eval("'hide'") && true)
basicEventHandler.call(this, this, (function() { var data = []; data['hp'] = ""; data['dX'] = ""; data['dY'] = ""; data['width'] = ""; data['height'] = ""; data['stillPlaying'] = ""; data['points'] = "";  return data; })(), new Object({ target: '#Mario', module: 'talk', args: new Object({})}));
if (args['action'] == eval("'hide'") && true)
basicEventHandler.call(this, this, (function() { var data = []; data['hp'] = ""; data['dX'] = ""; data['dY'] = ""; data['width'] = ""; data['height'] = ""; data['stillPlaying'] = ""; data['points'] = "";  return data; })(), new Object({ target: '#Mario', module: 'move', args: new Object({dx: '0', dy: '0', })}));
};
return events; })();
raiseEvent(unit, 'onSpawn');



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
        var updateCounter = 0;
        var previousEntrance = new Date();
        var update = function () {
            
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
            	settings.updateTimeoutId = setTimeout(update, settings.updateTime);

            updateCounter++;
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
            updateCounter = 0;
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
                clearTimeout(settings.updateTimeoutId);
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