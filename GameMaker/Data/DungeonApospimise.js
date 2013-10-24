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
		background.src = 'images/library/background.png';
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
        var unitModulesEvents = [];

        var raiseEvent = function (unit, module, args) {
            for (var i in unitModulesEvents[module]) {
                unitModulesEvents[module][i].call(unit, args);
            }
        };

        unitModules['move'] = function (params) { raiseEvent(this, 'move', arguments[0]);  
			if (params.dx) {
				this.x += eval(params.dx); 
			}
			if (params.dy) {
				this.y += eval(params.dy); 
			}
		}; unitModulesEvents['move'] = [];
unitModules['rotate'] = function (params) { raiseEvent(this, 'rotate', arguments[0]); 
				if (params.angle) {
					this.rotateX = this.rotateX + eval(params.angle);
				}
			}; unitModulesEvents['rotate'] = [];
unitModules['attack'] = function (params) { raiseEvent(this, 'attack', arguments[0]); 
				var data = this.moduleData["attack"];
				var timeout = (this.activeAnimation && this.activeAnimation != "idle") ? this.animations[this.activeAnimation].duration : 1;

				if (new Date() - this.lastAttack < timeout) { 
					return;
				}
				if (params) {
					var unit;
					if (params instanceof Unit) {
						unit = params;
					}
					else if (params.unit instanceof Unit) {
						unit = params.unit;
					}
					if (unit) {
						var damage = eval(data.damage);
						setTimeout(function () {
							if (data.damage) {
								unit.hp -= damage;
							}
						}, timeout);
					}
				}
				else {
					if (data.ammo && modules["unit-generator"]) {
						var coordinates = {
							x: eval(data.ammoX),
							y: eval(data.ammoY),
							dx: eval(data.ammoDx),
							dy: eval(data.ammoDy),
						}
						var mousy = $.extend(true, {}, mouse);
						setTimeout(function() {
							modules["unit-generator"].generate({id: data.ammo, coordinates: coordinates}, mousy);
						}, timeout);
					}
				}

				this.lastAttack = new Date();
			}; unitModulesEvents['attack'] = [];
unitModules['onCollision'] = function (unit) { raiseEvent(this, 'onCollision', arguments[0]); 
				var data = this.moduleData['onCollision'];
				if (data.actions) {
					//Presentation usage
					if (unit.id.startsWith(data.enemyName)) {
						actions = eval("new Object({" + data.actions + "})");

						for (var j in actions) {
							if (j in this) {
								this[j] = eval(actions[j]);
							}
							else if (j == "points" && modules["points"]) {
								modules["points"].points += eval(actions.points);
							}
						}
					}
					return;
				}
				//Normal usage
				for (var i in data) {
					if (unit.id.startsWith(i)) {
						for (var j in data[i]) {
							if (j in this) {
								this[j] = eval(data[i][j]);
							}
						}

						if (data[i].action) {
							eval(data[i].action);
						}

						if (data[i].points && modules["points"]) {
							modules["points"].points += eval(data[i].points);
						}
					}
				}
			}; unitModulesEvents['onCollision'] = [];
unitModules['charge'] = function (params) { raiseEvent(this, 'charge', arguments[0]); 
				var endX = params.endX, endY = params.endY, shouldReturn = params.shouldReturn;

				var startPoint = new Vector2(this.x, this.y);
				var endPoint = new Vector2(endX, endY);
				var speed = Math.abs(this.moduleData["charge"].speed);
				speed = speed ? speed : 1;
				if (endX != this.x) {
					var angle = Math.abs(Math.atan((this.y - endY) / (this.x - endX)));
					this.dx = Math.cos(angle) * Math.sign(endX - this.x) * speed;
					this.dy = Math.sin(angle) * Math.sign(endY - this.y) * speed;
				}
				else {
					this.dx = 0;
					this.dy =  Math.sign(endY - this.y) * speed;
				}
				var updateFunc = this.update;
				var reachedDestination = new $.Deferred();
				this.update = function() {
					updateFunc.call(this);
					if (Math.abs(this.x - endX) <= speed && Math.abs(this.y - endY) <= speed) {
						this.x = endPoint.x;
						this.y = endPoint.y;
						reachedDestination.resolve();
					}
				};
				var self = this;
				reachedDestination.done(function () {
					self.update = updateFunc;
					if (shouldReturn) {
						self.charge({endX: startPoint.x, endY: startPoint.y});
					}
					else { 
						self.dx = 0; 
						self.dy = 0;
					}
				});

			}; unitModulesEvents['charge'] = [];
unitModules['onDeath'] = function() { raiseEvent(this, 'onDeath', arguments[0]); 
				var data = this.moduleData['onDeath'];
				if (data.stillPlaying != undefined) {
					stillPlaying = eval(data.stillPlaying);
				}
				if (data.points && modules["points"]) {
					modules.points.points += eval(data.points);
				}
			}; unitModulesEvents['onDeath'] = [];
unitModules['onSpawn'] = function (mousy) { raiseEvent(this, 'onSpawn', arguments[0]); 
				if (mousy) {
					var mouse = mousy;
				}
				var data = this.moduleData['onSpawn'];
				for (var i in data.actions) {
					var action = data.actions[i];
					this[action].call(this, eval(data.actionArgs[action]));
				}
				for (var i in data.properties) {
					if (i in this) {
						this[i] = eval(data.properties[i]);
					}
				}
			}; unitModulesEvents['onSpawn'] = [];
unitModules['summon'] = function (params) { raiseEvent(this, 'summon', arguments[0]); 
				if (modules["unit-generator"]) {
					var unit = params.unit,
						coordinates = {
							x: eval(params.unitX),
							y: eval(params.unitY),
							dx: eval(params.unitDx),
							dy: eval(params.unitDy),
						};
					var timeout = (this.activeAnimation && this.activeAnimation != "idle") ? this.animations[this.activeAnimation].duration : 1;

					setTimeout(function() {
						modules["unit-generator"].generate({id: unit, coordinates: coordinates});
					}, timeout);
				}
			}; unitModulesEvents['summon'] = [];
unitModules['scale'] = function (params) { raiseEvent(this, 'scale', arguments[0]); 
				if (params.scaleX) {
					this.scaleX = eval(params.scaleX);
				}
				if (params.scaleY) {
					this.scaleY = eval(params.scaleY);
				}
			}; unitModulesEvents['scale'] = [];
unitModules['hpBar'] = function() { raiseEvent(this, 'hpBar', arguments[0]); 
				context.save();

				var green = this.hp;
				context.fillStyle = "rgb(0, " + green + ", 0)";
				context.fillRect(this.x, this.y - 10, this.width * this.hp / 255, 10);

				context.restore();
			}; unitModulesEvents['hpBar'] = [];

var module = createModule('collider', (function() { var data = [];  return data; })());
		$.extend(module, (function() {
				return {
					update: function() {
						var unitsChecked = 0;
						for(var i in units) {
							var innerUnitsChecked = 0;
							for(var j in units) {
								if (innerUnitsChecked <= unitsChecked) {
									innerUnitsChecked++;
									continue;
								}
								if (units[i].isColliding(units[j])) {
									if (units[i].onCollision) {
										units[i].onCollision(units[j]);
									}
									if (units[j].onCollision) {
										units[j].onCollision(units[i]);
									}
								}
							}
							unitsChecked++;
						}
					}
				};
			})());
		modules['collider'] = module;
		var module = createModule('unit-generator', (function() { var data = [];  return data; })());
		$.extend(module, (function () {
				var counter = 0;
				return {
					counter: 0,
					generate: function(params, mousy) {
						var id = params.id, coordinates = params.coordinates;
						if (!unitPrototypes[id]) {
							return;
						}
						if (mousy) {
							var mouse = mousy;
						}
						var unit = clone(unitPrototypes[id]);
						unit.id = id + "" + this.counter;
						unit.x = eval(coordinates.x);
						unit.y = eval(coordinates.y);
						if (coordinates.dx) {
							unit.dx = eval(coordinates.dx);
						}
						if (coordinates.dy) {
							unit.dy = eval(coordinates.dy);
						}
						units[unit.id] = unit;
						if (unit.onSpawn) {
							unit.onSpawn(mousy);
						}
						this.counter++;
					}
				}
			})());
		modules['unit-generator'] = module;
		var module = createModule('timed-unit-generator', (function() { var data = []; data['unit'] = "'zombie'"; data['interval'] = "1000 / (modules.points.points / 100 + 1)"; data['unitX'] = "'-unitPrototypes.zombie.width'"; data['unitY'] = "'units.invisibleWall.height + Math.random()*(canvas.height - units.invisibleWall.height)'";  return data; })());
		$.extend(module, (function () {
				return {
					last: new Date(),
					update: function() {
						var data = this.data;
						var coordinates = {
							x: eval(data.unitX),
							y: eval(data.unitY),
							dx: eval(data.unitDx),
							dy: eval(data.unitDy),
						};

						if (new Date() - this.last > eval(this.data.interval)) {
							modules['unit-generator'].generate({id:eval(this.data.unit) + "", coordinates: coordinates});
							this.last = new Date();
						} 
					}
				};
			})());
		modules['timed-unit-generator'] = module;
		var module = createModule('points', (function() { var data = []; data['x'] = "30"; data['y'] = "550"; data['font'] = "'42px Calibri'"; data['color'] = "'black'";  return data; })());
		$.extend(module, (function() {
				return {
					points: 0,
					draw: function() {
						context.save();
						context.fillStyle = eval(this.data.color);
						context.font = eval(this.data.font);
						context.fillText("Points: " + this.points, eval(this.data.x), eval(this.data.y));
						context.restore();
					}
				};
			})());
		modules['points'] = module;
		var module = createModule('hpBarDisplayer', (function() { var data = [];  return data; })());
		$.extend(module, (function () {
				return {
					draw: function() {
						for (var i in units) {
							if (units[i].hpBar) {
								units[i].hpBar();
							}
						}
					}
				};
			})());
		modules['hpBarDisplayer'] = module;
		var module = createModule('timer', (function() { var data = []; data['interval'] = "300"; data['target'] = "'.dragon'"; data['action'] = "'attack'";  return data; })());
		$.extend(module, (function() {
				return {
						last: new Date(),
						update: function() {
							if (new Date() - this.last > eval(this.data.interval)) {
								//Hard coded stuff, to be replaced when we introduce selectors
								var selected = selector(eval(this.data.target));
								for (var i in selected) {
									selected[i][eval(this.data.action)].call(selected[i], eval(this.data.args));
								}
								this.last = new Date();
							} 
						}
					}
				})());
		modules['timer'] = module;
		

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
                if (this.onDeath) {
                    this.onDeath();
                }
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

        	var AnimatedSpriteUnit = (function() {
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
					if (this.state != UnitStates.dying && this.onDeath) {
						this.onDeath();
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
	var InanimatedSpriteUnit = (function () {
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
	var RectangleUnit = (function () {
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

			var unit = createUnit(AnimatedSpriteUnit, true, 'zombie', 'images/library/zombiee.png', (function() {
 var animations = []; animations['idle'] = new Animation(1, 8, 0, 8, 650, false);
animations['die'] = new Animation(0, 8, 0, 8, 650, true);
unitModulesEvents['onDeath'].push(function(args) {
						if (!this.id.startsWith('zombie'))
							return;
						var actionArgs = {};
						if (Helper.hasProperties(actionArgs)) {
							for (var i in args) {
								if (actionArgs[i] != 'undefined' && eval(args[i]) != eval(actionArgs[i]))
									return; 
							}
						}
						if (this.animations['die'])
							this.activeAnimation = 'die'; });animations['attack'] = new Animation(2, 8, 0, 8, 650, true);
unitModulesEvents['attack'].push(function(args) {
						if (!this.id.startsWith('zombie'))
							return;
						var actionArgs = {};
						if (Helper.hasProperties(actionArgs)) {
							for (var i in args) {
								if (actionArgs[i] != 'undefined' && eval(args[i]) != eval(actionArgs[i]))
									return; 
							}
						}
						if (this.animations['attack'])
							this.activeAnimation = 'attack'; });return animations;})(), 8, 3, 0, 400, 75, 75, 1, 0, 0);
			unit.dx = 0; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['move'] = (function() { var data = [];  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['attack'] = (function() { var data = []; data['damage'] = "1";  return data; })();
moduleData['onCollision'] = (function() { var data = []; data['chest'] = new Object({action: 'this.attack(units.chest)'});  return data; })();
moduleData['charge'] = (function() { var data = []; data['speed'] = "10";  return data; })();
moduleData['onDeath'] = (function() { var data = []; data['points'] = "1";  return data; })();
moduleData['onSpawn'] = (function() { var data = []; data['actions'] = new Object({charge: 'charge'}); data['actionArgs'] = new Object({charge: 'Object({endX:  Math.random() * 20 - 10 + units.chest.x - units.chest.width, endY: Math.random() * 20 - 10 + units.chest.y})'});  return data; })();

		return {
				
		move : unitModules['move'], 
	
		rotate : unitModules['rotate'], 
	
		attack : unitModules['attack'], 
	
		onCollision : unitModules['onCollision'], 
	
		charge : unitModules['charge'], 
	
		onDeath : unitModules['onDeath'], 
	
		onSpawn : unitModules['onSpawn'], 
		moduleData: moduleData
		};
	})());

			var unit = createUnit(RectangleUnit, false, 'invisibleWall', 'rgba(0,0,0,0)', 0, 0, 800, 250, 1);
			unit.dx = 0; unit.dy = 0
if (unit.onSpawn) { unit.onSpawn(); }


			var unit = createUnit(AnimatedSpriteUnit, false, 'mage', 'images/library/mage.png', (function() {
 var animations = []; animations['idle'] = new Animation(0, 7, 0, 7, Number.MAX_VALUE, false);
animations['summon'] = new Animation(0, 7, 0, 7, 1000, true);
unitModulesEvents['summon'].push(function(args) {
						if (!this.id.startsWith('mage'))
							return;
						var actionArgs = {};
						if (Helper.hasProperties(actionArgs)) {
							for (var i in args) {
								if (actionArgs[i] != 'undefined' && eval(args[i]) != eval(actionArgs[i]))
									return; 
							}
						}
						if (this.animations['summon'])
							this.activeAnimation = 'summon'; });return animations;})(), 7, 1, 650, 400, 100, 97, 1, 0, 0);
			unit.dx = 0; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['summon'] = (function() { var data = [];  return data; })();
moduleData['scale'] = (function() { var data = [];  return data; })();
moduleData['onSpawn'] = (function() { var data = []; data['actions'] = new Object({scale: 'scale'}); data['actionArgs'] = new Object({scale: 'Object({scaleX: -1})'});  return data; })();

		return {
				
		summon : unitModules['summon'], 
	
		scale : unitModules['scale'], 
	
		onSpawn : unitModules['onSpawn'], 
		moduleData: moduleData
		};
	})());if (unit.onSpawn) { unit.onSpawn(); }


			var unit = createUnit(AnimatedSpriteUnit, true, 'dragon', 'images/library/dragon.gif', (function() {
 var animations = []; animations['idle'] = new Animation(4, 10, 0, 10, 1000, false);
return animations;})(), 10, 8, 700, 50, 107, 100, 1, 0, 0);
			unit.dx = 0; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['attack'] = (function() { var data = []; data['ammo'] = "fireball"; data['ammoX'] = "this.x - unitPrototypes.fireball.width"; data['ammoY'] = "this.y + this.height/2"; data['ammoDx'] = "0"; data['ammoDy'] = "0";  return data; })();

		return {
				
		attack : unitModules['attack'], 
		moduleData: moduleData
		};
	})());

			var unit = createUnit(AnimatedSpriteUnit, true, 'fireball', 'images/library/fire.png', (function() {
 var animations = []; animations['idle'] = new Animation(0, 6, 0, 6, 1000, false);
return animations;})(), 6, 1, 700, 50, 72, 72, 1, 0, 0);
			unit.dx = 0; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['charge'] = (function() { var data = []; data['speed'] = "7.5";  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['onSpawn'] = (function() { var data = []; data['actions'] = new Object({rotate: 'rotate'}); data['actionArgs'] = new Object({rotate: 'Object({angle: 3*Math.PiOver4, angleY: 0})'}); data['properties'] = new Object({dx: -7, dy: 7});  return data; })();
moduleData['attack'] = (function() { var data = []; data['damage'] = "10";  return data; })();
moduleData['onCollision'] = (function() { var data = []; data['zombie'] = new Object({action: 'this.attack(unit)', hp: -1});  return data; })();

		return {
				
		charge : unitModules['charge'], 
	
		rotate : unitModules['rotate'], 
	
		onSpawn : unitModules['onSpawn'], 
	
		attack : unitModules['attack'], 
	
		onCollision : unitModules['onCollision'], 
		moduleData: moduleData
		};
	})());

			var unit = createUnit(InanimatedSpriteUnit, false, 'chest', 'images/library/chest.png', 700, 250, 64, 64, 255);
			unit.dx = 0; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['hpBar'] = (function() { var data = [];  return data; })();
moduleData['onDeath'] = (function() { var data = []; data['stillPlaying'] = "false";  return data; })();

		return {
				
		hpBar : unitModules['hpBar'], 
	
		onDeath : unitModules['onDeath'], 
		moduleData: moduleData
		};
	})());if (unit.onSpawn) { unit.onSpawn(); }


			var unit = createUnit(AnimatedSpriteUnit, false, 'archer', 'images/library/archery(2).png', (function() {
 var animations = []; animations['idle'] = new Animation(2, 25, 10, 12, 100, false);
animations['attack'] = new Animation(2, 25, 4, 11, 400, true);
unitModulesEvents['attack'].push(function(args) {
						if (!this.id.startsWith('archer'))
							return;
						var actionArgs = {};
						if (Helper.hasProperties(actionArgs)) {
							for (var i in args) {
								if (actionArgs[i] != 'undefined' && eval(args[i]) != eval(actionArgs[i]))
									return; 
							}
						}
						if (this.animations['attack'])
							this.activeAnimation = 'attack'; });return animations;})(), 25, 6, 600, 450, 128, 128, 1, 0, 0);
			unit.dx = 0; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['scale'] = (function() { var data = [];  return data; })();
moduleData['onSpawn'] = (function() { var data = []; data['actions'] = new Object({scale: 'scale'}); data['actionArgs'] = new Object({scale: 'Object({scaleX: -1})'});  return data; })();
moduleData['move'] = (function() { var data = [];  return data; })();
moduleData['attack'] = (function() { var data = []; data['ammo'] = "arrow"; data['ammoX'] = "this.x + 10"; data['ammoY'] = "this.y + this.height / 4 + 20";  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();

		return {
				
		scale : unitModules['scale'], 
	
		onSpawn : unitModules['onSpawn'], 
	
		move : unitModules['move'], 
	
		attack : unitModules['attack'], 
	
		rotate : unitModules['rotate'], 
		moduleData: moduleData
		};
	})());if (unit.onSpawn) { unit.onSpawn(); }


			var unit = createUnit(InanimatedSpriteUnit, true, 'arrow', 'images/library/arrow.png', 750, 50, 40, 6, 1);
			unit.dx = 0; unit.dy = 0
$.extend(unit, (function () {
		var moduleData = [];
		moduleData['charge'] = (function() { var data = []; data['speed'] = "40";  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['onSpawn'] = (function() { var data = []; data['actions'] = new Object({charge: 'charge', rotate: 'rotate'}); data['actionArgs'] = new Object({charge: 'Object({endX: mouse.x + Math.sign(mouse.x - this.x)*1000, endY: Math.getLineEquation(mouse.x, mouse.y, this.x, this.y)(mouse.x + Math.sign(mouse.x - this.x)*1000)})', rotate: 'Object({angle: Math.atan((mouse.y - this.y) / (mouse.x - this.x))})'});  return data; })();
moduleData['attack'] = (function() { var data = []; data['damage'] = "10";  return data; })();
moduleData['onCollision'] = (function() { var data = []; data['zombie'] = new Object({action: 'this.attack({unit: unit})', hp: -1});  return data; })();

		return {
				
		charge : unitModules['charge'], 
	
		rotate : unitModules['rotate'], 
	
		onSpawn : unitModules['onSpawn'], 
	
		attack : unitModules['attack'], 
	
		onCollision : unitModules['onCollision'], 
		moduleData: moduleData
		};
	})());


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
            
					if (keyboard[51] && !previousKeyboard[51]) {
						var selected = selector('#mage');
						for (var i in selected) {
							selected[i].summon(new Object({unit: 'dragon', unitX: 'canvas.width', unitY: canvas.height*0.2, unitDx: -3, }));
						}
					}
				

					if (mouse['left'] && !previousMouse['left']) {
						var selected = selector('#archer');
						for (var i in selected) {
							selected[i].attack();
						}
					}
				

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