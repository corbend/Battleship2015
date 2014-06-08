
(function($, global) {

	var ns = global.MarineBattle = global.MarineBattle || {};

	ns.Game = {
		players: 0,
		hits: 0,
		miss: 0,
		started: null,
		finished: null
	};

	var game;

	ns.CGame = function(playersCount, state) {
		//конструктор новой игры
		var startTime, field;

		this.players = playersCount;
		startTime = new Date();
		this.started = startTime;

		field = new MarineMap(10, 10, state);
		this.field = field;

		field.init();

		this.hits = 0;
		this.miss = 0;

		this.isReady = function() {
			//определяем соблюдены ли условия для начала игры
			var ready = false;
			mappedResources.forEach(function(resource) {
				ready = resource.positionReady;
			});

			if (!ready) {
				alert("Вы не разместили все корабли!");
			}

			return ready;
		}
	}

	ns.CGame.prototype = ns.Game;

	//игровое состояние
	ns.GameState = function() {
		this.resources = [];
		this.players = [1, 2];

		//делаем активным первого игрока для теста
		this.activePlayer = this.players[0];

		this.open = function() {
			game = new ns.CGame(2, this);
		}
		this.getOpponentResources = function() {
			//тестовый образец
			var resources = [
				new SingleShip(null, 2, 1, 2),
				new SingleShip(null, 2, 6, 2),
				new DoubleShip(null, 3, 1, 4),
				new TripleShip(null, 1, 1, 6),
				new TripleShip(null, 1, 6, 6),
				new QuadShip(null, 1, 3, 8)
			];
			var objs = [];
			for (var i=0; i < resources.length; i++) {
				for (var j=0; j < resources[i].pool.length; j++) {
					objs.push({
						x: resources[i].pool[j].startX,
						y: resources[i].pool[j].startY,
						width: resources[i].pool[j].width,
						height: resources[i].pool[j].width,
						orientation: resources[i].orientation
					})
				}
			}

			return objs;
		}
		this.nextTurn = function() {
			this.currentState++;
			//определяем нового активного игрока
			// this.activePlayer = this.players[this.currentState % this.playerCount];
			this.currentResources = this.getResources();

			//здесь должна быть блокирующая функция ожидания хода

		};

		this.prevTurn = function() {
			;
		};

		this.stateSave = function(eventName) {
			if (eventName == "miss") {
				this.miss++;
			} else if (eventName == "hit") {
				this.hits++;
			}
		}
	}

	ns.Map = {
		width: 10,
		height: 10,
		fieldWidth: "40px",
		fieldHeight: "40px"
	}

	var mappedResources = [];
	var selection = null;

	var MarineMap = function(width, height, state) {

		var gameState, step, me = this;
		gameState = state;
		this.state = gameState;

		this.cwidth = width || this.width;
		this.cheight = height || this.height;

		var gameContainer = $(".container");

		this.createFields = function(gameMap) {
			var field, label, i, j, map,
				fieldLeft, fieldTop, labelLeft, labelTop;

			var mapLeft = gameMap.position().left;
			var mapTop = gameMap.position().top;

			var alfaLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'I', 'H', 'J', 'G'];

			for (i = 0; i < this.cwidth; i++) {
				for (j = 0; j < this.cheight; j++) {
					field = $('<div></div>').appendTo(gameMap);
					fieldLeft = i * parseInt(ns.Map.fieldWidth);
					fieldTop = j * parseInt(ns.Map.fieldHeight);

					cssStyle = {
						// "float" : "left",
						"position": "absolute",
						"left"  : fieldLeft,
						"top"	: fieldTop,
						"width" : this.fieldWidth,
						"height": this.fieldHeight
					}
					field.addClass("field");
					field.css(cssStyle);

					field.data("x", i);
					field.data("y", j);

					if (i === 0) {
						labelLeft = fieldLeft - parseInt(ns.Map.fieldWidth);
						label = $('<div></div>').appendTo(gameMap);
						label.addClass("label");
						label.html((j+1).toString());
						label.css(cssStyle).css("left", labelLeft);
					}

					if (j === 0) {
						labelTop = fieldTop - parseInt(ns.Map.fieldHeight);
						label = $('<div></div>').appendTo(gameMap);
						label.html((alfaLabels[i]).toString());
						label.addClass("label");
						label.css(cssStyle).css("top", labelTop);
					}

				}
			}
		};

		this.createResources = function(resources, update) {
			//@resources - массив с кораблями (ресурсами)
			var resourcesCounter = 0;
			this.resources = resources;

			if (update) {
				var fields = $('.field');
				fields.css('backgroundColor', 'white');
			}

			this.resources.forEach(function(res) {
				res.pool.forEach(function(obj) {
					obj.idx = resourcesCounter;
					resourcesCounter++;
					obj.draw();
				});
			}, this);
		};

		this.createGameMap = function(mapContainer, playerId) {
			//создаем поле игрока

			var map_ = $("<div></div>").appendTo(mapContainer);
			map_.addClass("map");

			this.myField = map_;

			map_.css("width", (this.width * parseInt(this.fieldWidth)).toString());
			map_.css("height", (this.height * parseInt(this.fieldHeight)).toString());
			map_.data("player", playerId);

			// this.createFields(map_);

			return map_;
		};

		this.addGameEvent = function(eventName, cellObject) {
			var domTarget = $(cellObject);
			if (eventName === "miss") {

				if (domTarget.data("miss")) {
					alert("Выберите другую точку!");
				} else {
					domTarget.data("miss", true);
					domTarget.addClass("miss");
					game.saveState("miss");
				}

			} 
			else if (eventName === "hit") {
				if (domTarget.data("hit")) {
					alert("Выберите другую точку!");
				} else {
					domTarget.data("hit", true);
					domTarget.addClass("hit");
					// cellObject.isDestroyed();
					game.saveState("hit");
				}
			}
		}

		this.setFieldEvents = function() {
			var me = this;

			var onFieldClick = function(target) {
				var gameTargets, matchResources = [];
				var posX = $(target).data("x");
				var posY = $(target).data("y");
					
				//сомнительный кусок
				gameTargets = me.state.getOpponentResources();

				gameTargets.forEach(function(obj) {

					if (posX >= obj.x && posY >= obj.y &&
						posX <= obj.x + (obj.orientation == "H" ? obj.width: 1) - 1 &&
						posY <= obj.y + (obj.orientation == "H" ? 1: obj.height) - 1)
					{
						matchResources.push(obj);
					}
				});

				//промах
				if (matchResources.length == 0) {
					// alert("miss");
					me.addGameEvent("miss", target);
				//попадание
				} else {
					// alert("hit");
					me.addGameEvent("hit", target);
				}
				
			}

			//атаки кораблей противника
			this.map2.find(".field").on('click', function(event) {
				//проверяем активного игрока и совершаем запрошенное действие
				if (gameState.started && !gameState.frozen) {
					onFieldClick(event.target);
				}
			});

		}

		this.memorizeResourse = function(state) {
			//фиксация раставленных кораблей (их координат)

			state.objects = [];

			mappedResources.forEach(function(obj) {
				this.objects.push(obj);
			}, state);

			state.started = true;

			this.setFieldEvents();
		};

		this.createUI = function() {

			var controls, wraps, map1, map2;

			//создаем поле первого игрока
			var mapPlayer1 = this.createGameMap(gameContainer, 1).css({
				'position': 'absolute',
				'left': 100,
				'top': 200,
				'display': 'block'
			})
			this.map1 = mapPlayer1;
			mapPlayer1.addClass("player1");
			//создаем поле второго игрока
			var mapPlayer2 = this.createGameMap(gameContainer, 2).css({
				'position': 'absolute',
				'left': 500 + parseInt(ns.Map.fieldWidth) * 2,
				'top': 200,
				'display': 'block'
			});
			mapPlayer2.addClass("player2");
			this.map2 = mapPlayer2;
			this.createFields(mapPlayer1);
			this.createFields(mapPlayer2);

			controls = $("<div></div>").appendTo(gameContainer);
			controls.addClass("controls");
			//кнопка подготовки к игре
			var prepareButton = $("<button></button>").appendTo(controls);
			prepareButton.addClass('prepare_button');
			prepareButton.html("New game");

			//размещаем группы кораблей 
			prepareButton.on('click', function(event) {
				me.createResources([
					new SingleShip(mapPlayer1, 2, 1, 2),
					new SingleShip(mapPlayer1, 2, 6, 2),
					new DoubleShip(mapPlayer1, 3, 1, 4),
					new TripleShip(mapPlayer1, 1, 1, 6),
					new TripleShip(mapPlayer1, 1, 6, 6),
					new QuadShip(mapPlayer1, 1, 3, 8)
				]);

			});
			//кнопка начала игры
			var startButton = $("<button></button>").appendTo(controls);
			startButton.addClass('start_button');
			startButton.html("Ready");
			//по нажатию на кнопку "Старт" фиксируем ресурсы
 			startButton.on('click', function(event) {
 				//если размещение элементов закончено запоминаем позиции кораблей
 				if (game.isReady()) {
					me.memorizeResourse(gameState);
 				}
			});
			//кнопка поворота корабля на этапе размещения
			// var rotateButton = $("<button></button>").appendTo(controls);
			// rotateButton.addClass('rotate_button');
			// rotateButton.html("Rotate");

			//создание лога действий
			var logView = $("<div></div>").appendTo(wraps);
			logView.addClass("log_view");
		};

		this.init = function() {
			this.createUI();
			// this.setFieldEvents();
			// this.createResources();
		};

	}

	MarineMap.prototype = ns.Map;

	ns.Resource = {
		user: null,
		components: null
	}

	//фабрика игровых объектов
	ns.FieldComponent = {
		width: 0,	//единица измерения - 1 клеточка поля
		height: 0,  //единица измерения - 1 клеточка поля
		container: null, //Jquery компоненты-представление корабля на поле
		childBlocks: null,
		DOMhelper: null,
		inOwnContainer: false, //означает что элемент перенесен в нужный контейнер
		getWidth: function() {
			var measure;
			if (this.orientation == "H") {
				measure = this.width;
			} else {
				measure = this.height;
			}
			return measure * parseInt(ns.Map.fieldWidth)
		},
		getHeight: function() {
			var measure;
			if (this.orientation == "H") {
				measure = this.height;
			} else {
				measure = this.width;
			}
			return measure * parseInt(ns.Map.fieldHeight)
		},
		rotateCW: function(pointX, pointY) {

			var newPosition, segmentNumber, drawStartX, drawStartY; 
			var rotatePoint = {};
			var parent = this.DOMhelper.parent();
			var segmentWidth = parseInt(ns.Map.fieldWidth);
			var orient = "H";

			globalX = $(".player1").position().left;
			globalY = $(".player1").position().top;

			if (this.width == 1 && this.height == 1) {return;}
			segmentNumber = Math.floor(
				Math.abs(this.leftPosition - pointX) / segmentWidth);

			rotatePoint.x = this.leftPosition + segmentNumber * segmentWidth;
			rotatePoint.y = this.topPosition + segmentNumber * segmentWidth;

			drawStartX = this.leftPosition;
			drawStartY = this.topPosition;
			drawStartXSeg = (drawStartX - globalX) / segmentWidth;
			drawStartYSeg = (drawStartY - globalY) / segmentWidth;

			this.orientation = this.orientation == "H" ? "V" : "H";
			if (this.inOwnContainer && !this.detectCollision(drawStartX, drawStartY)) {
				this.DOMhelper.remove();
				orient = this.orientation;

				this.draw(drawStartXSeg, drawStartYSeg, orient, "player1");
			} else {
				this.orientation = this.orientation == "H" ? "V" : "H";
			}
		},
		draw: function(startX, startY, orientation, playerField) {
			var fields, containers, me = this;	

			me.positionX = startX || this.startX;
			me.positionY = startY || this.startY;

			orientation = orientation || "H";
			me.orientation = orientation;

			this.childBlocks = [];
			var div = $(document.createElement("div"));
			var map_ = $(".player2");
			var myMap = $(".player1");

			var mapLeft = parseInt(map_.position().left);
			var mapTop = parseInt(map_.position().top);

			div.appendTo((playerField && $("." + playerField)) || map_);

			var fieldWidth = parseInt(ns.Map.fieldWidth);
			var fieldHeight = parseInt(ns.Map.fieldHeight);

			div.css({
				"position": "absolute",
				"left": (me.positionX * fieldWidth).toString() + "px",
				"top": (me.positionY * fieldHeight).toString() + "px",
				"width": orientation == "H"? me.width * fieldWidth : me.height * fieldHeight,
				"height": orientation == "H"? me.height * fieldHeight : me.width * fieldWidth,
				// "border": "4px solid purple",
				"backgroundColor": "green"
			});

			this.childBlocks.push(div);
			this.DOMhelper = div;
			var previousGeometry = {};

			this.detectCollision = function(leftPosition, topPosition) {
				var rightC, leftC, topC, bottomC;

				currMap = $(".player1");
				mapLeft = currMap.position().left;
				mapTop = currMap.position().top;

				leftPosition = leftPosition || this.leftPosition;
				rightPosition = leftPosition + Number(this.getWidth());
				topPosition = topPosition || this.topPosition;
				bottomPosition = topPosition + Number(this.getHeight());

				console.log("self->");
				console.log(this.idx + "->posX:" + leftPosition);
				console.log(this.idx + "->posY:" + topPosition);
				var detected = false;

				mappedResources.forEach(function(resource) {

					var rightEdge = Number(resource.leftPosition) + Number(resource.getWidth()) + parseInt(ns.Map.fieldWidth);
					var bottomEdge = Number(resource.topPosition) + Number(resource.getHeight()) + parseInt(ns.Map.fieldHeight);

					rightC = Number(leftPosition) < rightEdge;
					bottomC = Number(topPosition) < bottomEdge;

					leftC = (Number(leftPosition) + Number(this.getWidth())) >
					    	 Number(resource.leftPosition) - parseInt(ns.Map.fieldWidth);

					topC = (Number(topPosition) + Number(this.getHeight())) > 
					   		Number(resource.topPosition) - parseInt(ns.Map.fieldHeight);
					
					// if (rightC) console.log("RIGHT EDGE COLLISION->" + rightC + "," + rightEdge);
					// if (bottomC) console.log("BOTTOM EDGE COLLISION->" + bottomC + "," + bottomEdge);
					// if (leftC) console.log("LEFT EDGE COLLISION->" + leftC + "," + Number(resource.leftPosition));
					// if (topC) console.log("TOP EDGE COLLISION->" + topC + "," + Number(resource.topPosition));

					if (this.idx != resource.idx &&
					   ((rightC && bottomC) && (leftC && topC))) {
						detected = true;
					}

				}, this);
				
				
				//выход за границы
				if (leftPosition < mapLeft || topPosition < mapTop ||
					rightPosition > (mapLeft + currMap.width()) ||
					bottomPosition > (mapTop + currMap.height())
				) {
					detected = true;
				}

				return detected;
			};

			div.draggable({
				"appendTo": "body",
				start: function(e, ui) {
					//сохраняем стартовые позиции элемента перед захватом
					//для того чтобы вернуть его назад в случае неверного "падения"
					previousGeometry.left = ui.helper.position().left;
					previousGeometry.top = ui.helper.position().top;

					$("#positionLog .startX").html(previousGeometry.left);
					$("#positionLog .startY").html(previousGeometry.top);
				},
				drag: (function(item) {
					return function(e, ui) {
						var pX, pY, leftEdge, topEdge;

						leftEdge = myMap.position().left + myMap.width();
						topEdge = myMap.position().top + myMap.height();
						var parent = ui.helper.parent();
						var currentXOffset = parent.position().left;
						var currentYOffset = parent.position().top;
						var relPX = ui.position.left;
						var relPY = ui.position.top;
						pX = currentXOffset + ui.position.left;
						pY = currentYOffset + ui.position.top;

						$("#positionLog .curX").html(pX);
						$("#positionLog .curY").html(pY);

						//если элемент находится в нужном контейнере
						//включаем режим привязки 
						if (((pX < leftEdge && pX > myMap.position().left) &&
							  pY < topEdge && pY > myMap.position().top)) {

							var fWidth = parseInt(ns.Map.fieldWidth);
							var fHeight = parseInt(ns.Map.fieldHeight);

							ui.helper.draggable("option", "grid", [fWidth, fHeight]);

						} else {
							ui.helper.draggable("option", "snap", false);
							ui.helper.draggable("option", "grid", false);

							ui.helper.position.left = pX;
							ui.helper.position.top = pY;
						}
					}
				})(this),
				stop: (function(item) {
					return function(e, ui) {

						var pX, pY, leftEdge, topEdge, nonOffsetY, nonOffsetX;

						leftEdge = myMap.position().left + myMap.width();
						topEdge = myMap.position().top + myMap.height();

						var parent = ui.helper.parent();
						var segmentWidth = parseInt(ns.Map.fieldWidth);
						var segmentHeight = parseInt(ns.Map.fieldHeight);
						var currentXOffset = parent.position().left;
						var currentYOffset = parent.position().top;

						pX = currentXOffset + ui.position.left;
						pY = currentYOffset + ui.position.top;

						nonOffsetX = pX - myMap.position().left;
						nonOffsetY = pY - myMap.position().top;

						//изменяем позицию элемента и создаем клон
						//если элемент находится в зоне карты
						//позиция элемента должна быть зафиксирована в ячейке
						if ((pX <= leftEdge && pY <= topEdge &&
							pX >= myMap.position().left &&
							pY >= myMap.position().top) &&
							!item.detectCollision(pX, pY) &&
						    (nonOffsetX % segmentWidth) === 0 &&
						    (nonOffsetY % segmentHeight) === 0) {
							
							ui.helper.position.left = pX;
							ui.helper.position.top = pY;

							previousGeometry.left = pX;
							previousGeometry.top = pY;

							item.leftPosition = pX;
							item.topPosition = pY;
							item.inOwnContainer = true;
							item.positionReady = true;
						}
						else {

							ui.helper.animate({
								"left": previousGeometry.left,
								"top": previousGeometry.top
							}, 500);
						}
					}
				})(this)
			});

			div.on('dblclick', function(e) {
				console.log("ROTATE");
				if (selection) {
					selection.rotateCW(
						e.clientX,
						e.clientY
					);
				}
			});

			div.on('click', this, function(context) {
				console.log("SELECT");
				selection = context.data;
			});

			mappedResources[this.idx] = this;

			return div;
		},
		createElement: function() {
			//ищем соседние элементы
			var x, y;
		},
		isDestroy: function() {
			//
			;
		},
		setHit: function(x, y) {
			this.css('backgroundColor', 'red');
		},
		createObjects: function(count) {
			this.createVariant(false);
			this.pool = [];
			for (var i=0; i < count; i++) {
				var newObject = {
					type: this.type,
					width: this.width,
					height: this.height,
					startX: this.startX + (this.width + 1) * i,
					startY: this.startY,
					orientation: this.orientation,
					map: this.map
				};
				newObject.draw = this.draw;
				newObject.draw.bind(newObject);
				newObject.getWidth = this.getWidth;
				newObject.getWidth.bind(newObject);
				newObject.getHeight = this.getHeight;
				newObject.getHeight.bind(newObject);
				newObject.rotateCW = this.rotateCW;
				newObject.rotateCW.bind(newObject);
				this.pool.push(newObject);
			}
		}

	}	

	var SingleShip = function(map, count, placeX, placeY) {
		this.type = "single";
		this.createVariant = function(opposite) {

			this.width = !opposite? 1: 1;
			this.height = !opposite? 1: 1;
			this.startX = placeX;
			this.startY = placeY;
			this.orientation = (opposite && "V") || "H";
		}
		this.map = map;
		this.createObjects(count || 1);
	}

	var DoubleShip = function(map, count, placeX, placeY) {
		this.type = "double";
		this.createVariant = function(opposite) {
			this.width = !opposite? 2: 1;
			this.height = !opposite? 1: 2;
			//стартовые позиции кораблей
			this.startX = placeX;
			this.startY = placeY;
			this.orientation = (opposite && "V") || "H";
		}
		this.map = map;
		this.createObjects(count || 1);
	}

	var TripleShip = function(map, count, placeX, placeY) {
		this.type = "triple";
		this.createVariant = function(opposite) {
			this.width = !opposite? 3: 1;
			this.height = !opposite? 1: 3;
			//стартовые позиции кораблей
			this.startX = placeX;
			this.startY = placeY;
			this.orientation = (opposite && "V") || "H";
		}
		this.map = map;
		this.createObjects(count || 1);
	}

	var QuadShip = function(map, count, placeX, placeY) {
		this.type = "quad";
		this.createVariant = function(opposite) {
			this.width = !opposite? 4: 1;
			this.height = !opposite? 1: 4;
			//стартовые позиции кораблей
			this.startX = placeX;
			this.startY = placeY;
			this.orientation = (opposite && "V") || "H";
		}
		this.map = map;
		this.createObjects(count || 1);
	}

	SingleShip.prototype = ns.FieldComponent;
	DoubleShip.prototype = ns.FieldComponent;
	TripleShip.prototype = ns.FieldComponent;
	QuadShip.prototype = ns.FieldComponent;

})($, window);