Race = function(rounds, players)
{
	let self = {

		//maximum and mimimum number of rounds allowed
		minRound : 1,
		maxRound : 10,

		//paragraphs for the players to type
		//evantually the paragraphs will be extracter from a database
		texts : ["long␣long",
				  "Paragraph",
				  "sentences",
				  "Pa",
				  "the.",
				  "Paragraphs␣are␣the␣building␣blocks␣of␣papers.␣Many␣students␣define␣paragraphs␣in␣terms␣of␣length:␣a␣paragraph␣is␣a␣group␣of␣at␣least␣five␣sentences,␣a␣paragraph␣is␣half␣a␣page␣long,␣etc.␣In␣reality,␣though,␣the.",
				  "Paragraphs␣are␣the␣building␣blocks␣of␣papers.␣Many␣students␣define␣paragraphs␣in␣terms␣of␣length:␣a␣paragraph␣is␣a␣group␣of␣at␣least␣five␣sentences,␣a␣paragraph␣is␣half␣a␣page␣long,␣etc.␣In␣reality,␣though,␣the.",
				  "Paragraphs␣are␣the␣building␣blocks␣of␣papers.␣Many␣students␣define␣paragraphs␣in␣terms␣of␣length:␣a␣paragraph␣is␣a␣group␣of␣at␣least␣five␣sentences,␣a␣paragraph␣is␣half␣a␣page␣long,␣etc.␣In␣reality,␣though,␣the.",
				  "Paragraphs␣are␣the␣building␣blocks␣of␣papers.␣Many␣students␣define␣paragraphs␣in␣terms␣of␣length:␣a␣paragraph␣is␣a␣group␣of␣at␣least␣five␣sentences,␣a␣paragraph␣is␣half␣a␣page␣long,␣etc.␣In␣reality,␣though,␣the.",
				  "Paragraphs␣are␣the␣building␣blocks␣of␣papers.␣Many␣students␣define␣paragraphs␣in␣terms␣of␣length:␣a␣paragraph␣is␣a␣group␣of␣at␣least␣five␣sentences,␣a␣paragraph␣is␣half␣a␣page␣long,␣etc.␣In␣reality,␣though,␣the.",],

		numOfRounds : rounds,
		status : 'STARTED', 	// status can be STARTED, RUNNING, FINISHED....
		currentRound : 1,
		stats : {},    // right now this just sotres the end time for each player

		//number of players that finished the race
		playersFinished : 0,
	}

	//constraning the total number of rounds
	if (self.numOfRounds < self.minRound)
		self.numOfRounds = self.maxRound
	else if (self.numOfRounds > self.maxRound)
		self.numOfRounds = self.maxRound;

	for (let i in players)
	{
		//this array will store the end time for each player
		self.stats[i] = [];
	}

	//this will start a round
	self.startRound = function(players, sockets)
	{
		self.playersFinished = 0;

		for (let i in players)
		{
			if (players[i].canRace)
			{
				console.log(self.texts[self.currentRound - 1]);
				sockets[i].emit('startTyping', self.texts[self.currentRound - 1]);
			}
		}
		self.status = 'RUNNING';
		//setInterval(self.checkUpdates);
	}

	self.updateTime = function(id, time, players, sockets, admin)
	{
		self.stats[id].push(time);

		self.playersFinished++;

		//when all the players have finished the race display the result
		if (self.playersFinished == Object.keys(self.stats).length)
		{	
			for (let i in players)
			{
				if (players[i].canRace)
				{
					sockets[i].emit('displayResults', self.stats);
					sockets[i].emit('');
				}
			}

			self.currentRound++;
			if (self.numOfRounds < self.currentRound)
			{
				self.status = 'FINISHED';
				sockets[admin.id].emit('enableStartButton');
			}
			else
			{
				//starts the next round if the number of rounds are not completed
				setTimeout(function(){
					self.startRound(players, sockets);
				}, 2000);
			}

		}		
	}

	return self;
}