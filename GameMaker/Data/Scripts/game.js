var game;
$(document).ready(function() {
    game = (function () {

    var canvas = $('#play-game-canvas')[0];
    var context = canvas.getContext('2d');

    (function () {
        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        window.requestAnimationFrame = requestAnimationFrame;
    })();

    var settings = {
        updateTime: 20,
        updateTimeoutId: -1,
    }
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
    }
    var startState;
    var background;
    var background = new Image();
	background.src = 'Images/space.jpg';
	background.onload = loader.onImageLoaded;
        
	loader.imagesToLoad++;
	background.draw = function() {
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
		//context.drawImage(this, 0, 0, canvas.width, canvas.height);
	}
    var createUnit = function (id, texture, x, y, width, height, hp, drawFunction) {
        var model;
        if (texture.indexOf('#') != -1) {
            model = texture;
        }
        else {
            loader.imagesToLoad++;
            model = new Image();
            model.src = texture;
            model.onload = loader.onImageLoaded;
        }

        return {
            id: id,
            texture: model,
            x: x,
            y: y,
            width: width,
            height: height,
            dx: 0,
            dy: 0,
            rotateX: 0,
            rotateY: 0,
            hp: hp,
            isColliding: function (unit) {
                var colliding =
                    this.x + this.width > unit.x &&
                    unit.x + unit.width > this.x &&
                    this.y + this.height > unit.y &&
                    unit.y + unit.height > this.y;

                return colliding;
            },
            update: function () {
                this.x += this.dx;
                this.y += this.dy;
            },
            draw: function () {
                context.save();
                //context.translate(this.x + this.width / 2, this.y + this.height / 2);
                //context.rotate(this.rotateX, this.rotateY);
                //context.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
                drawFunction.apply(this);
                context.restore();
            },
        };
    };
    var units = [];
    var unitPrototypes = [];

    
	var unit = createUnit('Sonic', 'Images/spaceship.png', 350, 350, 60, 60, 1, 
				function() {
					context.fillStyle = "red";
                    context.fillRect(this.x, this.y, this.width, this.height);
                    //context.drawImage(this.texture, this.x, this.y, this.width, this.height);
				}
			);
	units['Sonic'] = unit;
				$.extend(unit, (function () {
		var moduleData = [];
		moduleData['move'] = (function() { var data = [];  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['dash'] = (function() { var data = [];  return data; })();
moduleData['soar'] = (function() { var data = [];  return data; })();
moduleData['onCollision'] = (function() { var data = []; data['enemy'] = {hp: -0.5};  return data; })();
moduleData['onDeath'] = (function() { var data = []; data['stillPlaying'] = false; data['points'] = -10;  return data; })();

		return {
				
		move : function (dx, dy) { this.x += dx; this.y += dy; }, 
	
		rotate : function (angleX, angleY) {
				this.rotateX = this.rotateX + angleX;//Math.clamp(this.rotateX + angleX, -Math.TwoPi, Math.TwoPi);
				this.rotateY = this.rotateY + angleY;//Math.clamp(this.rotateY + angleY, -Math.TwoPi, Math.TwoPi);
			}
		, 
	
		dash : 	
			function () { 
				var speed = 0.5; 

				var self = this;
				var updateVelocity = function (speed) {
					var speed = speed[0];
					speed += 2;
					self.dx = speed;
					setTimeout(updateVelocity, 1000, [speed]);
				}
				updateVelocity([speed]);
			}
		, 
	
		soar : function () { this.dx = Math.sin(new Date()); this.dy = Math.cos(new Date()); }, 
	
		onCollision : 
			function(unit) {
				var data = this.moduleData['onCollision'];
				for (var i in data) {
					if (unit.id.startsWith(i)) {
						if (data[i].hp) {
							this.hp += data[i].hp.valueOf();
						}
						if (data[i].points && modules["points"]) {
							modules["points"].points += data[i].points.valueOf();
						}
						break;
					}
				}
			}
		, 
	
		onDeath : 
			function(unit) {
				var data = this.moduleData['onDeath'];
				if (data.stillPlaying != undefined) {
					stillPlaying = data.stillPlaying;
				}
				if (data.points && modules["points"]) {
					modules.points.points += data.points.valueOf();
				}
			}
		, 
		moduleData: moduleData,
		};
	})());

	var unit = createUnit('enemy', 'Images/asteroid.png', 0, 0, 60, 60, 3, 
				function() {
                    context.fillStyle = "blue";
                    context.fillRect(this.x, this.y, this.width, this.height);
					//context.drawImage(this.texture, this.x, this.y, this.width, this.height);
				}
			);
	unitPrototypes['enemy'] = unit;
				$.extend(unit, (function () {
		var moduleData = [];
		moduleData['move'] = (function() { var data = [];  return data; })();
moduleData['rotate'] = (function() { var data = [];  return data; })();
moduleData['dash'] = (function() { var data = [];  return data; })();
moduleData['soar'] = (function() { var data = [];  return data; })();
moduleData['onDeath'] = (function() { var data = []; data['points'] = 1;  return data; })();
moduleData['onCollision'] = (function() { var data = []; data['bullet'] = {hp: -1};  return data; })();

		return {
				
		move : function (dx, dy) { this.x += dx; this.y += dy; }, 
	
		rotate : function (angleX, angleY) {
				this.rotateX = this.rotateX + angleX;//Math.clamp(this.rotateX + angleX, -Math.TwoPi, Math.TwoPi);
				this.rotateY = this.rotateY + angleY;//Math.clamp(this.rotateY + angleY, -Math.TwoPi, Math.TwoPi);
			}
		, 
	
		dash : 	
			function () { 
				var speed = 0.5; 

				var self = this;
				var updateVelocity = function (speed) {
					var speed = speed[0];
					speed += 2;
					self.dx = speed;
					setTimeout(updateVelocity, 1000, [speed]);
				}
				updateVelocity([speed]);
			}
		, 
	
		soar : function () { this.dx = Math.sin(new Date()); this.dy = Math.cos(new Date()); }, 
	
		onDeath : 
			function(unit) {
				var data = this.moduleData['onDeath'];
				if (data.stillPlaying != undefined) {
					stillPlaying = data.stillPlaying;
				}
				if (data.points && modules["points"]) {
					modules.points.points += data.points.valueOf();
				}
			}
		, 
	
		onCollision : 
			function(unit) {
				var data = this.moduleData['onCollision'];
				for (var i in data) {
					if (unit.id.startsWith(i)) {
						if (data[i].hp) {
							this.hp += data[i].hp.valueOf();
						}
						if (data[i].points && modules["points"]) {
							modules["points"].points += data[i].points.valueOf();
						}
						break;
					}
				}
			}
		, 
		moduleData: moduleData,
		};
	})());

	var unit = createUnit('bullet', 'Images/laser.png', 0, 0, 7, 18, 1, 
				function() {
                    context.fillStyle = "green";
					context.fillRect(this.x, this.y, this.width, this.height);
                    //context.drawImage(this.texture, this.x, this.y, this.width, this.height);
				}
			);
	unitPrototypes['bullet'] = unit;
				$.extend(unit, (function () {
		var moduleData = [];
		moduleData['onCollision'] = (function() { var data = []; data['enemy'] = {hp: -1};  return data; })();

		return {
				
		onCollision : 
			function(unit) {
				var data = this.moduleData['onCollision'];
				for (var i in data) {
					if (unit.id.startsWith(i)) {
						if (data[i].hp) {
							this.hp += data[i].hp.valueOf();
						}
						if (data[i].points && modules["points"]) {
							modules["points"].points += data[i].points.valueOf();
						}
						break;
					}
				}
			}
		, 
		moduleData: moduleData,
		};
	})());


    var createModule = function (name, data) {
        return {
            name: name,
            data: data,
        };
    };
    var modules = [];

    var module = createModule('unit-generator', (function() { var data = [];  return data; })());
	$.extend(module, (
			function () {
				var counter = 0;
				return {
					counter: 0,
					generate: function(id, coordinates) {
						var unit = $.extend(true, {}, unitPrototypes[id]);
						unit.id = id + "" + this.counter;
						unit.x = coordinates.x.valueOf();
						unit.y = coordinates.y.valueOf();
						if (coordinates.dx) {
							unit.dx = coordinates.dx.valueOf();
						}
						if (coordinates.dy) {
							unit.dy = coordinates.dy.valueOf();
						}
						units[unit.id] = unit;
						this.counter++;
					},
				}
			}
		)());
	modules['unit-generator'] = module;
	var module = createModule('timed-unit-generator', (function() { var data = []; data['unit'] = 'enemy'; data['interval'] = 500; data['coordinates'] = {x:new Randomizer(canvas.width),y:0,dy:new Randomizer(5, 1),dx:new Randomizer(-5, 2.5)};  return data; })());
	$.extend(module, (
			function () {
				return {
					last: new Date(),
					update: function() {
						if (new Date() - this.last > this.data.interval) {
							modules['unit-generator'].generate(this.data.unit + "", this.data.coordinates);
							this.last = new Date();
						} 
					},
				}
			}
		)());
	modules['timed-unit-generator'] = module;
	var module = createModule('collider', (function() { var data = [];  return data; })());
	$.extend(module, (
			function() {
				return {
					update: function() {
						for(var i in units) {
							for(var j in units) {
								if (i == j)
									continue;
								if (units[i].isColliding(units[j])) {
									if (units[i].onCollision) {
										units[i].onCollision(units[j]);
									}
									if (units[j].onCollision) {
										units[j].onCollision(units[i]);
									}
								}
							}
						}
					},
				};
			}
		)());
	modules['collider'] = module;
	var module = createModule('timer', (function() { var data = []; data['interval'] = settings.updateTime; data['target'] = 'enemy'; data['action'] = 'rotate'; data['args'] = [Math.toRadians(2), Math.toRadians(2)];  return data; })());
	$.extend(module, (
			function() {return {
					last: new Date(),
					update: function() {
						if (new Date() - this.last > this.data.interval.valueOf()) {
							//Hard coded stuff, to be replaced when we introduce selectors
							for (var i in units) {
								if (units[i].id.startsWith(this.data.target)) {
									units[i][this.data.action].apply(units[i], this.data.args);
								}
							}
							this.last = new Date();
						} 
					},
				}
			}
		)());
	modules['timer'] = module;
	

    var keyboard = [];
    var previousKeyboard = [];

    window.addEventListener("keydown", function (args) {
        keyboard[args.which] = true;
    }, false);

    window.addEventListener("keyup", function (args) {
        keyboard[args.which] = false;
    }, false);

    var removeUnits = function () {
        var toBeRemoved = [];
        for (var i in units) {
            if (units[i].hp < 1) {
                toBeRemoved.push(units[i].id);
                if (units[i].onDeath) {
                    units[i].onDeath();
                }
            }
            if (units[i].x + units[i].width < 0 || units[i].x > canvas.width || units[i].y < 0 || units[i].y > canvas.height) {
                toBeRemoved.push(units[i].id);
            }
        }

        for (var i in toBeRemoved) {
            Array.removeItem(units, toBeRemoved[i]);
        }
    }

    var stillPlaying = true;
    var updateTimeoutId = -1;
    var update = function () {
        
					if (keyboard[37]) {
						if (units['Sonic']) {
							units['Sonic'].move(-5, 0);
						}
						else if (modules['Sonic']) {
							modules['Sonic'].move(-5, 0);
						}
					}
				

					if (keyboard[38]) {
						if (units['Sonic']) {
							units['Sonic'].move(0, -5);
						}
						else if (modules['Sonic']) {
							modules['Sonic'].move(0, -5);
						}
					}
				

					if (keyboard[39]) {
						if (units['Sonic']) {
							units['Sonic'].move(5, 0);
						}
						else if (modules['Sonic']) {
							modules['Sonic'].move(5, 0);
						}
					}
				

					if (keyboard[40]) {
						if (units['Sonic']) {
							units['Sonic'].move(0, 5);
						}
						else if (modules['Sonic']) {
							modules['Sonic'].move(0, 5);
						}
					}
				

					if (keyboard[49] && !previousKeyboard[49]) {
						if (units['unit-generator']) {
							units['unit-generator'].generate('bullet', {x:units['Sonic'].x+units['Sonic'].width/2,y:units['Sonic'].y-10,dx:0,dy:-10});
						}
						else if (modules['unit-generator']) {
							modules['unit-generator'].generate('bullet', {x:units['Sonic'].x+units['Sonic'].width/2,y:units['Sonic'].y-10,dx:0,dy:-10});
						}
					}
				

					if (keyboard[50] && !previousKeyboard[50]) {
						if (units['unit-generator']) {
							units['unit-generator'].generate('bullet', {x:units['Sonic'].x+units['Sonic'].width,y:units['Sonic'].y+units['Sonic'].height/2,dx:2,dy:0});
						}
						else if (modules['unit-generator']) {
							modules['unit-generator'].generate('bullet', {x:units['Sonic'].x+units['Sonic'].width,y:units['Sonic'].y+units['Sonic'].height/2,dx:2,dy:0});
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
        //removeDeathUnits();
        //removeOutOfScopeUnits();

        $.extend(true, previousKeyboard, keyboard);

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

            requestAnimationFrame(draw);
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
    }

    var start = function () {
        if (!startState) {
            startState = {
                units: Array.deepCopy(units),
                unitPrototypes: Array.deepCopy(unitPrototypes),
                modules: Array.deepCopy(modules),
            }
        }
        else {
            clearTimeout(updateTimeoutId);
            restoreState();
        }
        stillPlaying = true;
        update();
        draw()
    }

    //loader.gameLoaded.done(start);

    return {
        settings: settings,
        loader: loader,
        start: start,
    }
})();

});