// The socket object for the player's connection 
var socket = io();

// store the player ID provided by the server
var playerID;

//declaring variables for the form items
var usrName = document.getElementById("username");
var usrPassword = document.getElementById("password");

var loginDiv = document.getElementById("singInDiv");
var playerList = document.getElementById("playerList");

//the window to display the type text
var typeWindow = document.getElementById("typingWindow");

//button to start a round
var startButton = document.getElementById("button");

//hidding the main div before the user is logged insingInSuccess
mainDiv.style.display = 'none';

// Sending the server sign In request when the user submits the form 
signInForm.onsubmit = function(e){

	e.preventDefault();

	//emiting the packet
	socket.emit('signInRequest', {username : usrName.value, password : usrPassword.value});
}

// if the login was successful then show the main div
socket.on('singInSuccess', function(data){
	loginDiv.style.display = 'none';
	mainDiv.style.display = 'inline-block';

	playerID = data.ID;

	//adding own player to the list
	Player.addPlayer(data.ID, usrName.value, data.isAdmin);

	//disable the start button if not admin
	if (!data.isAdmin)
		startButton.disabled = true;
});

// packeage sent to initialize the players list
socket.on('initList', function(data){
	
	//adding the ohter players to the list

	for (var i in data)
	{
		var player = data[i];

		Player.addPlayer(player.id, player.username, player.isAdmin);
	}
	updateDisplay();
});

// package sent when a new player joins the lobby
socket.on('updateList', function(data){

	Player.addPlayer(data.ID, data.username, false);
	updateDisplay();

});

//text sent by the server
socket.on('startTyping', function(data){

	//setting the text in the type window
	console.log(data);
	startTyping(data);

});

//disabling the start button before the round starts
socket.on('disableStartButton', function(){
	startButton.disabled = true;
});

//enabling the start button when the round ends
socket.on('enableStartButton', function(){
	startButton.disabled = false;
});

socket.on('displayResults', function(data){

	typeWindow.innerHTML = "";

	for (var i in data)
	{
		typeWindow.innerHTML += Player.list[i].username + " : " + data[i];
		typeWindow.innerHTML += "<br />";
	}

});

// delete a disconnected player
socket.on('deletePlayer', function(data){
	
	//checking if the player actually exists
	if (Player.list[data])
		delete Player.list[data];

	updateDisplay();
});

//updating the admin if the admin has been disconnected
//the data contains the id of the new admin
socket.on('beAdmin', function(data){

	//changing the data of new admin
	if (Player.list[data])
		Player.list[data].isAdmin = true;

	//cheking if the new admin is the player itself
	//enable the start button
	if (data === playerID)
		startButton.disabled = false;

	updateDisplay();

});

//funciton to display the players information to the screen
var updateDisplay = function()
{
	playerList.innerHTML = "";
	for (var i in Player.list)
	{
		var player = Player.list[i];

		playerList.innerHTML += player.username;
		
		if (player.isAdmin)
			playerList.innerHTML += " : Admin"
		
		playerList.innerHTML += "<br />";
	}
}

//function to request the server to send the text
function start()
{
	socket.emit('startRace');
}

// variables to make the appear in multiple lines
// since the text does not contains spaces or newlines
let max = 38;
let at = 1;

let theText;

//varaibles to handle typing
let index;
let textLen;
let startTime;
	
let lookingFor;

let oldString, newString;

let error;
let newLine;


// writes the type text into the type window
function setTheText()
{
	typeWindow.innerHTML = "";

	textLen = theText.length;

	newString = "<span class='expected'>" + theText[0] + "</span>";

	for (var i = 1; i < textLen; i++)
	{
		newString += "<span class='normalText'>" + theText[i] + "</span>";
		at++;

		if (at == max)
		{
			while(theText[i] != '␣' && i < textLen)
			{
				i++;
				newString += "<span class='normalText'>" + theText[i] + "</span>";
			}
			newString += "<br />";
			at = 0;
		}
	}

	at = 0;
	typeWindow.innerHTML = newString;	
}

function updateTextLook()
{
	var newStr = oldString;

	newStr += "<span class='expected'>" + theText[index] + "</span>"

	var i = 0, j = 0, val;
	if (newLine)
	{
		val = 3;
		newLine = false;
		at = 0;
	}
	else
		val = 2;
	while(j != val)
	{
		if (newString[i] == '>')
			j++;
		i++;
	}

	newString = newString.slice(i);

	i = 0;
	j = 0;
	while(j != 2)
	{
		if (newString[i] == '>')
			j++;
		i++;
	}
	
	newStr += newString.slice(i);

	typeWindow.innerHTML = newStr;
}

function startTyping(text)
{
	startTime = Math.round((new Date()).getTime() / 1000);

	theText = text;

	index = 0;
	textLen = theText.length;

	lookingFor = theText[0];

	max = 38;
	at = 1;

	oldString = "", newString;

	error = false;
	newLine = false;

	setTheText();
	document.onkeypress = function(event)
	{
		//console.log(theText[index]);
		if ( ( event.keyCode == lookingFor.charCodeAt(0) ) )
		{
			at++;
			//console.log(at);

			if (error)
				oldString += "<span class='error'>" + theText[index] + "</span>";
			else
				oldString += "<span class='inactive'>" + theText[index] + "</span>";

			if (at >= max && lookingFor == ' ')
			{
				newLine = true;
				oldString += "<br />";
			}

			index++;

			if (index >= textLen)
			{
				lookingFor = null;
				var endTime = Math.round((new Date()).getTime() / 1000);
				socket.emit('roundComplete', endTime - startTime);

				document.onkeypress = function()
				{}

				return;
			}	

			lookingFor = theText[index];

			if(lookingFor == '␣')
				lookingFor = ' '; 
			
			updateTextLook();
			error = false;
		}
		else
		{
			error = true;
		}		

		if (index >= textLen)
			index = textLen - 1;
	};
}