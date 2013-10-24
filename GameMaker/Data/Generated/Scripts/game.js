var game;
$(document).ready(function () {
    game = (function () {

        var canvas = $('#game-canvas')[0];
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
            function Animation(row, framesPerRow, duration, mustFinish) {
                this.rowFrame = row;
                this.colFrame = 0;
                if (!duration)
                    duration = framesPerRow;
                this.__defineGetter__("duration", function () {
                    return duration;
                });
                this.framesPerRow = framesPerRow;
                this.frameCounter = 0;
                this.timePerFrame = duration / framesPerRow;
                this.mustFinish = mustFinish ? true : false;
                var restarted = false;
                var hasFinished = false;
                this.__defineGetter__("hasFinished", function () {
                    return hasFinished;
                });
                this.reset = function () {
                    this.colFrame = 0;
                    this.frameCounter = 0;
                    hasFinished = false;
                };
                this.update = function () {
                    this.frameCounter++;
                    if (this.frameCounter * settings.updateTime >= this.timePerFrame) {
                        this.colFrame = (this.colFrame + 1) % this.framesPerRow;
                        this.frameCounter = 0;
                        if (this.colFrame == 0) {
                            hasFinished = true;
                        }
                    }
                }
            }

            Animation.empty = new Animation(0);
            Animation.empty.update = function () { };

            return Animation;
        })();


        var startState;
        var background;
        

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

        unitModules['move'] = function (params) { raiseEvent(this, 'move', arguments);  
			if (params.dx) {
				this.x += eval(params.dx); 
			}
			if (params.dy) {
				this.y += eval(params.dy); 
			}
		}; unitModulesEvents['move'] = [];
unitModules['rotate'] = function (params) { raiseEvent(this, 'rotate', arguments); 
				if (params.angleX) {
					this.rotateX = this.rotateX + eval(params.angleX);
				}
				if (params.angleY) {
					this.rotateY = this.rotateY + eval(params.angleY);
				}
			}; unitModulesEvents['rotate'] = [];
unitModules['attack'] = function (params) { raiseEvent(this, 'attack', arguments); 
				var data = this.moduleData["attack"];
				var timeout = this.activeAnimation ? this.animations[this.activeAnimation].duration : 1;

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
						var coordinates = eval(data.ammoCoordinates);
						var mousy = $.extend(true, {}, mouse);
						setTimeout(function() {
							modules["unit-generator"].generate({id: data.ammo, coordinates: coordinates}, mousy);
						}, timeout);
					}
				}

				this.lastAttack = new Date();
			}; unitModulesEvents['attack'] = [];
unitModules['charge'] = function (params) { raiseEvent(this, 'charge', arguments); 
				var endX = params.endX, endY = params.endY, shouldReturn = params.shouldReturn;

				var startPoint = new Vector2(this.x, this.y);
				var endPoint = new Vector2(endX, endY);
				console.log("start - " + startPoint);
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
						console.log("end: " + new Vector2(this.x, this.y));
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
unitModules['onDeath'] = function() { raiseEvent(this, 'onDeath', arguments); 
				var data = this.moduleData['onDeath'];
				if (data.stillPlaying != undefined) {
					stillPlaying = eval(data.stillPlaying);
				}
				if (data.points && modules["points"]) {
					modules.points.points += eval(data.points);
				}
			}; unitModulesEvents['onDeath'] = [];
unitModules['onSpawn'] = function (mousy) { raiseEvent(this, 'onSpawn', arguments); 
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
unitModules['onCollision'] = function (unit) { raiseEvent(this, 'onCollision', arguments); 
				var data = this.moduleData['onCollision'];
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
unitModules['summon'] = function (params) { raiseEvent(this, 'summon', arguments); 
				if (modules["unit-generator"]) {
					var unit = params.unit, coordinates = params.coordinates;
					modules["unit-generator"].generate({id: unit, coordinates: eval(coordinates)});
				}
			}; unitModulesEvents['summon'] = [];

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
		var module = createModule('timed-unit-generator', (function() { var data = []; data['unit'] = "'zombie'"; data['interval'] = "2000"; data['coordinates'] = "new Object({x:'0',y:'Math.random()*canvas.height - unitPrototypes.zombie.height'})";  return data; })());
		$.extend(module, (function () {
				return {
					last: new Date(),
					update: function() {
						if (new Date() - this.last > eval(this.data.interval)) {
							modules['unit-generator'].generate({id:eval(this.data.unit) + "", coordinates:eval(this.data.coordinates)});
							this.last = new Date();
						} 
					}
				};
			})());
		modules['timed-unit-generator'] = module;
		

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
                this.x = x;
                this.y = y;
                this.dx = 0;
                this.dy = 0;
                this.rotateX = rotateX ? rotateX : 0;
                this.rotateY = rotateY ? rotateY : 0;
                this.hp = hp;
                this.state = UnitStates.alive;
                this.boundingFigure = new BoundingFigure();
                this.__defineGetter__("x", function () {
                    return this.boundingFigure.x;
                });
                this.__defineSetter__("x", function (value) {
                    this.boundingFigure.x = value;
                });
                this.__defineGetter__("y", function () {
                    return this.boundingFigure.y;
                });
                this.__defineSetter__("y", function (value) {
                    this.boundingFigure.y = value;
                });
            };
            Unit.prototype.update = function () { 
                this.x += this.dx;
                this.y += this.dy;
            };

            Unit.prototype.drawCallback = function () { };

            Unit.prototype.draw = function () {
                context.save();
                context.translate(this.x + this.width / 2, this.y + this.height / 2);
                context.rotate(this.rotateX, this.rotateY);
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
                this.__defineGetter__("width", function () {
                    return this.boundingFigure.width;
                });
                this.__defineSetter__("width", function (value) {
                    this.boundingFigure.width = value;
                });
                this.__defineGetter__("height", function () {
                    return this.boundingFigure.height;
                });
                this.__defineSetter__("height", function (value) {
                    this.boundingFigure.height = value;
                });
            }

            return RectUnit;
        })();

        var createUnit = function (type, isPrototype, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15) {
            var unit = new type(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15);
            if (isPrototype) {
                unitPrototypes[unit.id] = unit;
            }
            else {
                units[unit.id] = unit;
                if (unit.onSpawn) {
                    unit.onSpawn()
                }
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
					var activeAnimation = 'idle';
					this.__defineGetter__('activeAnimation', function() {
						return activeAnimation;
					});
					this.__defineSetter__('activeAnimation', function(value) {
						if (!this.animationLocked) {
							this.activeAnimationChangedRecently = true;
							activeAnimation = value;
							if (this.animations[activeAnimation].mustFinish) {
								this.animations[activeAnimation].reset();
							}
						}
					});
					this.__defineGetter__('animationLocked', function() {
						var active = this.animations[activeAnimation];
						return active.mustFinish && !active.hasFinished;
					});
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
				
				AnimatedSpriteUnit.prototype.update = function () {
					if (this.move) {
						this.move({dx: this.dx, dy: this.dy});
					}
					else {
						this.x += this.dx;
						this.y += this.dy;
					}
					if (!this.activeAnimationChangedRecently && !this.animationLocked) {
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
					this.texture = new Image();
					this.texture.src = texture;
					loader.imagesToLoad++;
					this.texture.onload = loader.onImageLoaded;
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

			var unit = createUnit(AnimatedSpriteUnit, true, 'zombie', 'C:/Users/NikolaDimitroff/Desktop/AnimationsTest/zombieEnemy.png', (function() {
 var animations = []; animations['idle'] = new Animation(1, 8, 650, false);
animations['die'] = new Animation(0, 8, 650, true);
unitModulesEvents['onDeath'].push(function(args) {
						if (!this.id.startsWith('zombie'))
							return;
						var actionArgs = [];
						if (actionArgs.length != 0) {
							var counter = 0;
							for (var i in args[0]) {
								if (eval(args[0][i]) != eval(actionArgs[counter++])) 
									return; 
							}
						}
						if (this.animations['die'])
							this.activeAnimation = 'die'; });animations['attack'] = new Animation(2, 8, 650, true);
unitModulesEvents['attack'].push(function(args) {
						if (!this.id.startsWith('zombie'))
							return;
						var actionArgs = [];
						if (actionArgs.length != 0) {
							var counter = 0;
							for (var i in args[0]) {
								if (eval(args[0][i]) != eval(actionArgs[counter++])) 
									return; 
							}
						}
						if (this.animations['attack'])
							this.activeAnimation = 'attack'; });return animations;})(), 8, 3, 0, 400, 75, 70, 1, 0, 0);
			$.extend(unit, (function () {
		var moduleData = [];
		moduleData['move'] = (function() { var data = [];  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['attack'] = (function() { var data = [];  return data; })();
moduleData['charge'] = (function() { var data = []; data['speed'] = "10";  return data; })();
moduleData['onDeath'] = (function() { var data = [];  return data; })();
moduleData['onSpawn'] = (function() { var data = []; data['actions'] = new Object({charge: 'charge'}); data['actionArgs'] = new Object({charge: 'Object({endX:  Math.random() * 20 - 10 + units.chest.x - units.chest.width, endY: Math.random() * 20 - 10 + units.chest.y})'});  return data; })();

		return {
				
		move : unitModules['move'], 
	
		rotate : unitModules['rotate'], 
	
		attack : unitModules['attack'], 
	
		charge : unitModules['charge'], 
	
		onDeath : unitModules['onDeath'], 
	
		onSpawn : unitModules['onSpawn'], 
		moduleData: moduleData
		};
	})());

			var unit = createUnit(AnimatedSpriteUnit, false, 'knight', 'C:/Users/NikolaDimitroff/Desktop/AnimationsTest/knighty.png', (function() {
 var animations = []; animations['idle'] = Animation.empty;
animations['moveLeft'] = new Animation(0, 7, 800, false);
unitModulesEvents['move'].push(function(args) {
						if (!this.id.startsWith('knight'))
							return;
						var actionArgs = [];actionArgs.push(-10);actionArgs.push(0);
						if (actionArgs.length != 0) {
							var counter = 0;
							for (var i in args[0]) {
								if (eval(args[0][i]) != eval(actionArgs[counter++])) 
									return; 
							}
						}
						if (this.animations['moveLeft'])
							this.activeAnimation = 'moveLeft'; });animations['moveRight'] = new Animation(1, 7, 800, false);
unitModulesEvents['move'].push(function(args) {
						if (!this.id.startsWith('knight'))
							return;
						var actionArgs = [];actionArgs.push(10);actionArgs.push(0);
						if (actionArgs.length != 0) {
							var counter = 0;
							for (var i in args[0]) {
								if (eval(args[0][i]) != eval(actionArgs[counter++])) 
									return; 
							}
						}
						if (this.animations['moveRight'])
							this.activeAnimation = 'moveRight'; });return animations;})(), 7, 2, 700, 300, 32, 67, 1, 0, 0);
			$.extend(unit, (function () {
		var moduleData = [];
		moduleData['move'] = (function() { var data = [];  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['attack'] = (function() { var data = []; data['damage'] = "10";  return data; })();
moduleData['charge'] = (function() { var data = []; data['speed'] = "10";  return data; })();
moduleData['onDeath'] = (function() { var data = [];  return data; })();
moduleData['onCollision'] = (function() { var data = []; data['zombie'] = new Object({action: 'this.attack(unit);'});  return data; })();

		return {
				
		move : unitModules['move'], 
	
		rotate : unitModules['rotate'], 
	
		attack : unitModules['attack'], 
	
		charge : unitModules['charge'], 
	
		onDeath : unitModules['onDeath'], 
	
		onCollision : unitModules['onCollision'], 
		moduleData: moduleData
		};
	})());

			var unit = createUnit(RectangleUnit, false, 'mage', 'yellow', 700, 50, 48, 64, 1);
			$.extend(unit, (function () {
		var moduleData = [];
		moduleData['summon'] = (function() { var data = [];  return data; })();

		return {
				
		summon : unitModules['summon'], 
		moduleData: moduleData
		};
	})());

			var unit = createUnit(AnimatedSpriteUnit, true, 'dragon', 'C:/Users/NikolaDimitroff/Desktop/AnimationsTest/dragon.gif', (function() {
 var animations = []; animations['idle'] = new Animation(4, 10, 1000, false);
return animations;})(), 10, 8, 700, 50, 107, 100, 1, 0, 0);
			$.extend(unit, (function () {
		var moduleData = [];
		moduleData['attack'] = (function() { var data = []; data['ammo'] = "fireball"; data['ammoCoordinates'] = "new Object({x:this.x, y:this.y + this.height/2, dx: 0, dy: 0})";  return data; })();

		return {
				
		attack : unitModules['attack'], 
		moduleData: moduleData
		};
	})());

			var unit = createUnit(AnimatedSpriteUnit, true, 'fireball', 'C:/Users/NikolaDimitroff/Desktop/AnimationsTest/fire.png', (function() {
 var animations = []; animations['idle'] = new Animation(0, 6, 1000, false);
return animations;})(), 6, 1, 700, 50, 128, 128, 1, 0, 0);
			$.extend(unit, (function () {
		var moduleData = [];
		moduleData['charge'] = (function() { var data = []; data['speed'] = "7.5";  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['onSpawn'] = (function() { var data = []; data['actions'] = new Object({rotate: 'rotate'}); data['actionArgs'] = new Object({rotate: 'Object({angleX: 3*Math.PiOver4, angleY: 0})'}); data['properties'] = new Object({dx: -2, dy:2});  return data; })();
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

			var unit = createUnit(InanimatedSpriteUnit, false, 'chest', 'C:/Users/NikolaDimitroff/Desktop/AnimationsTest/chest.png', 600, 300, 64, 64, 1);
			

			var unit = createUnit(AnimatedSpriteUnit, false, 'archer', 'C:/Users/NikolaDimitroff/Desktop/AnimationsTest/archer0.png', (function() {
 var animations = []; animations['idle'] = Animation.empty;
animations['attack'] = new Animation(0, 18, 1000, true);
unitModulesEvents['attack'].push(function(args) {
						if (!this.id.startsWith('archer'))
							return;
						var actionArgs = [];
						if (actionArgs.length != 0) {
							var counter = 0;
							for (var i in args[0]) {
								if (eval(args[0][i]) != eval(actionArgs[counter++])) 
									return; 
							}
						}
						if (this.animations['attack'])
							this.activeAnimation = 'attack'; });return animations;})(), 18, 1, 700, 450, 64, 64, 1, 0, 0);
			$.extend(unit, (function () {
		var moduleData = [];
		moduleData['move'] = (function() { var data = [];  return data; })();
moduleData['attack'] = (function() { var data = []; data['ammo'] = "arrow"; data['ammoCoordinates'] = "Object({x:this.x, y:this.y})";  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();

		return {
				
		move : unitModules['move'], 
	
		attack : unitModules['attack'], 
	
		rotate : unitModules['rotate'], 
		moduleData: moduleData
		};
	})());

			var unit = createUnit(InanimatedSpriteUnit, true, 'arrow', 'C:/Users/NikolaDimitroff/Desktop/AnimationsTest/arrow.png', 700, 50, 20, 4, 1);
			$.extend(unit, (function () {
		var moduleData = [];
		moduleData['charge'] = (function() { var data = []; data['speed'] = "10";  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['onSpawn'] = (function() { var data = []; data['actions'] = new Object({charge: 'charge', rotate: 'rotate'}); data['actionArgs'] = new Object({charge: 'Object({endX: mouse.x + Math.sign(mouse.x - this.x)*1000, endY: Math.getLineEquation(mouse.x, mouse.y, this.x, this.y)(mouse.x + Math.sign(mouse.x - this.x)*1000)})', rotate: 'Object({angleX: Math.atan((mouse.y - this.y) / (mouse.x - this.x)), angleY: 0})'});  return data; })();
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
            mouse.x = args.x;
            mouse.y = args.y;
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
        var update = function () {
            
					if (keyboard[50] && !previousKeyboard[50]) {
						var selected = selector('#knight');
						for (var i in selected) {
							selected[i].charge(new Object({endX: 0, endY: canvas.height/2, shouldReturn: true, }));
						}
					}
				

					if (keyboard[51] && !previousKeyboard[51]) {
						var selected = selector('#mage');
						for (var i in selected) {
							selected[i].summon(new Object({unit: 'dragon', coordinates: Object({x:canvas.width,y:canvas.height*0.2,dx:-3}), }));
						}
					}
				

					if (keyboard[52] && !previousKeyboard[52]) {
						var selected = selector('.dragon');
						for (var i in selected) {
							selected[i].attack();
						}
					}
				

					if (keyboard[49] && !previousKeyboard[49]) {
						var selected = selector('unit-generator');
						for (var i in selected) {
							selected[i].generate(new Object({id: 'fireball', coordinates: Object({x:'0',y:'100',dx:0,dy:0,}), }));
						}
					}
				

					if (mouse['left'] && !previousMouse['left']) {
						var selected = selector('#archer');
						for (var i in selected) {
							selected[i].attack();
						}
					}
				


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