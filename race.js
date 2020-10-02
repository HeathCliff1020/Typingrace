Race = function (rounds, players, sockets) {


    /******************************************************/

    let self = {

        //maximum and mimimum number of rounds allowed
        minRound: 1,
        maxRound: 10,

        //paragraphs for the players to type
        //evantually the paragraphs will be extracter from a database
        texts: [
            "Do␣one␣thing␣every␣day␣that␣scares␣you.",
            "The␣quick␣brown␣fox␣jumps␣over␣the␣lazy␣dog.",
            "Paragraphs␣are␣the␣building␣blocks␣of␣papers.␣Many␣students␣define␣paragraphs␣in␣terms␣of␣length:␣a␣paragraph␣is␣a␣group␣of␣at␣least␣five␣sentences,␣a␣paragraph␣is␣half␣a␣page␣long,␣etc.␣In␣reality,␣though,␣the.",
            "The␣secret␣of␣getting␣ahead␣is␣getting␣started.",
            "Hustle␣in␣silence␣and␣let␣your␣success␣make␣the␣noise.",
            "All␣our␣dreams␣can␣come␣true,␣if␣we␣have␣the␣courage␣to␣pursue␣them.",
            "Your␣passion␣is␣waiting␣for␣your␣courage␣to␣catch␣up.",
            "Everything␣comes␣to␣him␣who␣hustles␣while␣he␣waits.",
            "We␣are␣what␣we␣repeatedly␣do.␣Excellence,␣then,␣is␣not␣an␣act,␣but␣a␣habit.",
            "Great␣things␣are␣done␣by␣a␣series␣of␣small␣things␣brought␣together.",
            "Leaders␣can␣let␣you␣fail␣and␣yet␣not␣let␣you␣be␣a␣failure."
        ],

        numOfRounds: rounds,
        status: 'STARTED', // status can be STARTED, RUNNING, FINISHED....
        currentRound: 1,
        stats: {}, // right now this just sotres the end time for each player

        //list of player ids which are disconnected in between a race
        disconnectedPlayers: [],

        //number of players that finished the race
        playersFinished: 0,

        //updated for the current round
        curUpdates: {},

        //variable to keep track if any changes occur in the completion changePercentage
        hasChange: true,
    }
    /******************************************************/


    //constraning the total number of rounds
    if (self.numOfRounds < self.minRound)
        self.numOfRounds = self.maxRound
    else if (self.numOfRounds > self.maxRound)
        self.numOfRounds = self.maxRound;

    for (let i in players) {
        //this object will store the stat of each player for the current round

        self.stats[i] = {

            //name of the player
            username: players[i].username,

            //stores the time taken in each round
            times: [],

            score: [],
        };

        // pushing -1 in in times and score
        for (let I = 0; I < self.numOfRounds; I++) {
            self.stats[i].times.push(-1);
            self.stats[i].score.push(-1);
        }

        self.curUpdates[i] = {

            username: players[i].username,
            percentage: 0,
            errors: 0,
            speed: 0,
        }
    }


    // function for the Race object


    /******************************************************/

    //this will start a round
    self.startRound = function (players, sockets) {
        self.hasChange = true;

        for (let i in players) {
            self.curUpdates[i] = {

                username: players[i].username,
                percentage: 0,
            }
        }
        self.sendUpdate(players, sockets);

        self.playersFinished = 0;

        for (let i in players) {
            if (players[i].canRace) {
                //console.log(self.texts[self.currentRound - 1]);
                sockets[i].emit('getReady', {
                    roundNumber: self.currentRound
                });
            }
        }

        // starts the text after 5 seconds
        setTimeout(() => {
            // choose a random text to display from all available texts
            var ind = Math.floor(Math.random() * this.texts.length) - 1;

            for (let i in players) {
                if (players[i].canRace) {
                    sockets[i].emit('startTyping', self.texts[ind]);
                }
            }
        }, 3000);


        //for the disconnected players
        for (let i in self.disconnectedPlayers) {
            self.playersFinished++;
            /*
            if (self.stats[self.disconnectedPlayers[i]])
            {
            	self.stats[self.disconnectedPlayers[i]].times[self.currentRound]
            }*/
        }

        self.status = 'RUNNING';
        //setInterval(self.checkUpdates);

        //this function will be called every 500 milli sec
        //to send the update information to all the players
    }

    /******************************************************/




    /******************************************************/

    // this function is called when a palyer completes a round and sends a roundComplete packet
    self.updateTime = function (id, time, players, sockets, admin) {
        // setting the round time
        self.stats[id].times[self.currentRound - 1] = time;

        // calculating the score
        self.stats[id].score[self.currentRound - 1] = (100 - time) * 3;

        self.playersFinished++;

        //when all the players have finished the race display the result
        if (self.playersFinished == Object.keys(self.stats).length) {
            self.currentRound++;

            //will be true the finished round was the last round
            let finished = false;

            if (self.numOfRounds < self.currentRound) {
                finished = true;
            }

            //sending results of the rounds to all the active players
            for (let i in players) {
                if (players[i].canRace) {
                    sockets[i].emit('displayResults', {
                        stats: self.stats,
                        isComplete: finished,
                        numOfRounds: self.numOfRounds,
                        roundNumber: self.currentRound - 1
                    });
                }
            }

            if (finished) {
                self.status = 'FINISHED';

                //enabling the start button of the admin
                sockets[admin.id].emit('enableStartButton');

            } else {
                //starts the next round if the number of rounds are not completed
                self.startRound(players, sockets);

            }

        }

    }

    /******************************************************/



    /******************************************************/

    //places the player in the disconnected player list
    //the player that was disconnected must be part of the race
    self.deletePlayer = function (id, players, sockets, admin) {
        if (self.stats[id]) {
            self.updateTime(id, -1, players, sockets, admin);
            self.disconnectedPlayers.push(id);
        }
    }

    /******************************************************/




    /******************************************************/

    self.sendUpdate = function (players, sockets) {
        if (self.status === 'RUNNING' && self.hasChange) {
            //sending the curUpdates to all the users
            for (let i in players) {

                if (sockets[i]) {
                    sockets[i].emit('displayUpdate', self.curUpdates);
                }
            }

            self.hasChange = false;
        }

    }

    /******************************************************/



    /******************************************************/

    //function to change the precentage of race completion
    self.changePercentage = function (id, newPer) {
        if (self.curUpdates[id]) {
            self.curUpdates[id].percentage = newPer;
        }

        self.hasChange = true;
    }

    /******************************************************/


    return self;
}