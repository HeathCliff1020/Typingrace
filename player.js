//object to store player information
Player = function(ID, USERNAME)
{
	var self = {

		id : ID,
		username : USERNAME,
		isAdmin : false,

		//test result
		res : 10,
		canRace : false,
	}

	Player.list[ID] = self;

	return self;
}
Player.list = {};
Player.admin = null;

//function to add the player to the playerlist
Player.addPlayer = function(socket, username){

	var player = Player(socket.id, username);
}

Player.addPlayerAsAdmin =function(socket, username){

	var player = Player(socket.id, username);
	player.isAdmin = true;

	Player.admin = player;                     
}