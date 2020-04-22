//var mongojs = require("mongojs");
//var db = mongojs('localhost:27017/myGame', ['account', 'progress']);

var express = require('express');
var app = express();
var serv = require('http').Server(app);

// including the player.js and race.js file
require('./player');
require('./race');

app.get('/', function(req, res)
{
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000,'0.0.0.0');

var io = require('socket.io')(serv, {});

//this will store all the info for a race and manages each round
let race = null;

var SOCKET_LIST = [];

//this is just a test text
var theText = "Paragraphs␣are␣the␣building␣blocks␣of␣papers.␣Many␣students␣define␣paragraphs␣in␣terms␣of␣length:␣a␣paragraph␣is␣a␣group␣of␣at␣least␣five␣sentences,␣a␣paragraph␣is␣half␣a␣page␣long,␣etc.␣In␣reality,␣though,␣the.";

io.sockets.on('connection', function(socket){

	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	//when client tries to login it will send a singInRequestPackage
	socket.on('signInRequest', function(data){

		//currently no database check and stuff
		

		// checking if it is the first player to sign
		// and making the first player the admin
		if (Object.keys(Player.list).length == 0)
			socket.emit('singInSuccess', {ID : socket.id, isAdmin : true});
		else
			socket.emit('singInSuccess', {ID : socket.id, isAdmin : false});
		

		//sending the data of the new player to all the existing players
		for (var i in SOCKET_LIST)
		{
			var s = SOCKET_LIST[i];
			if (i != socket.id && Player.list[s.id])
				s.emit('updateList', {ID : socket.id, username : data.username});
		}

		// sending the list of the existing players to the newly created player
		socket.emit('initList', Player.list);

		if (Object.keys(Player.list).length == 0)
			Player.addPlayerAsAdmin(socket, data.username);
		else
			Player.addPlayer(socket, data.username);
		
		console.log(Player.admin.id);
		/*
		for (var i in Player.list)
		{
			var player = Player.list[i];

			console.log(player.username);
		}*/

	});


	//test code

	//sending the text to type when admin clicks on start	
	socket.on('startRace', function(){
		//cheking is it actually the admin
		if (socket.id == Player.admin.id)
		{
			/*
			console.log("Sending the text!!");
			//sending the text to all the players
			for (var i in Player.list)
			{
				var soc = SOCKET_LIST[i];
				soc.emit('typeText', {text : theText});
			}
			*/

			//telling the admin to disable the start button
			SOCKET_LIST[Player.admin.id].emit('disableStartButton');

			//calling end() after 10 sec to simulate end of a round for test
			//setTimeout(end, 3000);

			//granting all the current players permissin to take part in the race
			for (let i in Player.list)
			{
				Player.list[i].canRace = true;
			}

			//instantiate the race which will
			race = Race(5, Player.list);
			race.startRound(Player.list, SOCKET_LIST); 	
		}
		else
			console.log("Not the admin");
	});

	//when a player finishes a round
	socket.on('roundComplete', function(time){
		
		if (race)
		{
			race.updateTime(socket.id, time, Player.list, SOCKET_LIST, Player.admin);
		}
	});

	//when the player is disconnected change admin
	//if the player disconnected was the admin
	//then update the players about the new admin and the deleted player
	socket.on('disconnect', function(){

		//id of the player to be deleted
		const id = socket.id;

		//deleting the socket from the socket list
		delete SOCKET_LIST[id];

		//if the disconnected socket was also logged in 
		console.log(Player.list[id]);
		if (Player.list[id])
		{
			//delete the player from the player list
			delete Player.list[id];

			//making all other the players delete the disconnected player
			for (let i in Player.list)
				SOCKET_LIST[i].emit('deletePlayer', id);
		}

		if (Player.admin)
		{
			// if the disconnected player is the admin change the admin
			if (id === Player.admin.id)
			{
				//if some palyer is left to be the made the admin 
				if (Object.keys(Player.list).length !== 0)
				{
					for (let I in Player.list)
					{
						for (let j in Player.list)
							SOCKET_LIST[j].emit('beAdmin', I);

						// for making the first element in the player list the admin
						Player.list[I].isAdmin = true;
						Player.admin = Player.list[I];
						//enabling the start button for the new admin
						SOCKET_LIST[I].emit('enableStartButton');

						break;
					}
				}
				else
					Player.admin = null;
			}
			else if (Object.keys(Player.list).length === 0)
				Player.admin = null;
		}

	});
});

//called after a round is over
var end = function(socket){

	SOCKET_LIST[Player.admin.id].emit('enableStartButton');

	var res = {};

	for (var i in Player.list)
	{
		var player = Player.list[i];

		res[i] = player.res;
	}

	for (var i in Player.list)
	{
		var soc = SOCKET_LIST[i];
		soc.emit('displayResults', res);
	}
}