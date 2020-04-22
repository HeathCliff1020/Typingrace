//object to store player information at client side
Player = function(ID, USERNAME, isA)
{
	var self = {

		id : ID,
		username : USERNAME,
		isAdmin : isA,
	}

	Player.list[ID] = self;

	return self;
}
Player.list = {};

//function to add the player to the playerlist
Player.addPlayer = function(id, username, isAdmin){

	var player = Player(id, username, isAdmin);
}
