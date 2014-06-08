var EventEmitter = require('events').EventEmitter;

var Room = function(idx) {
	var freeze = false;
	var players = [];
	//статус игроков - готов, не готов
	this.playerStatuses = [false, false];
	this.playerUids = [];
	this.ready = 0;
	this.idx = idx;

	this.setFrozen = function() {
		freeze = true;
	};
	this.unsetFrozen = function() {
		freeze = false;
	}

	this.cleanRoom = function() {
		players.pop();
		players.pop();
		this.playerUids = [];
		this.ready = 0;
		this.unsetFrozen();
	}

	this.freeRoom = function(sk) {
		//выводим игрока из комнаты (по дисконекту например)
		//освобождаем ресурс комнаты по экземпляру сокета
		var match;

		players.forEach(function(skk) {
			if (sk === skk) {
				console.log("CLEAN ROOM");
				match = players.indexOf(sk);
			}
		}, this);

		if (match) {
			players = players.slice(match, 1);
		}

		return match;
	};
	this.isFrozen = function() {
		return freeze;
	};
	this.addPlayer = function(sk) {
		players.push(sk);
	};
	this.getPlayerByUid = function(id) {
		//достаем игрока по его уникальному номеру
		return this.playerUids.indexOf(id) !== -1;
	};
	this.isFull = function() {
		console.log(players.length);
		return players.length == 2;
	};
	this.getPlayerCount = function() {
		return players.length;
	};
	this.toObject = function() {
		return {
			id: this.idx,
			isFull: this.isFull(),
			playersCount: this.getPlayerCount(),
			playerStatuses: this.playerStatuses
		}
	};

}

var PlayRoom = function(roomsCount) {

	this.roomsCount = roomsCount || 10;
	this.rooms = [];
	this.gamesStat = [];

	for (var r=0; r < roomsCount; r++) {
		this.rooms.push(new Room(r));
	}

	this.startGame = function(room) {

		if (!room.isFrozen()) {

			this.gamesStat.push({
				gameId: room.idx,
				clients: room.players
			})

			room.setFrozen();
			return true;
		}

		return false;
	}
	this.closeGame = function(gameId) {
		
		var idx = 0;
		var game;

		this.gamesStat.forEach(function(gameInfo) {

			if (gameInfo.gameId == gameId) {
				game = gameInfo;
			}

			idx++;
		});
	}

	this.getRoom = function(roomId) {
		return this.rooms[roomId];
	}

	this.showAll = function() {
		return this.rooms.map(function(room) {
			return room.toObject();
		});
	}

};


module.exports.playRoom = new PlayRoom(10);