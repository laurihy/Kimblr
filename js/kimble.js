var r;
var diceClicked = false;
var tiles;
var path;
var len = 50;
var teams = [];
var diceText;
var dice;
var allPawns = [];
var curTurn = 0;
var gameEnded = false;

autoPlay = function(team, dv){
	var team = team;
	var playable = [];
	var dv = dv;
	var moved = false;
	// get all the playable pawns
	for(p in team.pawns){
		if(team.pawns[p].movable){
			playable.push(team.pawns[p]);
		}
	}
	// team can move only one pawn, so there's not much to decide
	if(playable.length==1){
		if(!moved){
			moved=true;
			playable[0].move(playable[0].getNextTile(dv));
		}
	}
	
	// loop through a couple of possibilities...
	if(!moved){
		for(p in playable){
			if(!moved){
				nt = playable[p].getNextTile(dv);
				
				// the pawn can go to goal
				if(team.goalTile==nt){
					playable[p].move(nt);
					moved=true;
					break;
				}
				
				// the pawn can eat other
				else if(nt.occupied==true && nt.occupant.team!=team){
					if(nt.occupant.team.start!=nt){ // let's not go to trap
						playable[p].move(nt);
						moved=true;
						break;
					}
				}
				
				// the pawn can go to board
				else if(nt==team.start && nt.occupied==false){
					playable[p].move(nt);
					moved=true;
					break;
				}
			}
		}
	}
	
	// no preferred move, move the first one on the array that is suitable
	if(!moved){
		for(p in playable){
			if(!moved){
				nt = playable[p].getNextTile(dv);
				// make sure it isn't eating an own pawn
				if(nt.occupied==false){
					playable[p].move(nt);
					moved=true;
					break;
				}
			}
		}
	}
	
	// only bad choices left
	
	if(!moved){
		nt = playable[0].getNextTile(dv);
		playable[0].move(nt);
	}
	
}

function tile(r, count, posX, posY){
	this.count = count;
	this.posX = posX;
	this.posY = posY;
	this.occupied = false;
	this.occupant = '';
	this.circle = r.circle(posX, posY, 20).attr({fill:'#ddd', 'stroke-width': 0});
	this.highlight = function(){
		this.circle.scale(1.5, 1.5);
	}
	this.unHighlight = function(){
		this.circle.scale(1, 1);
	}
}

function team(name, color, autoplay){
	this.name = name;
	this.autoplay = autoplay;
	this.penalty = 0;
	this.color = color;
	this.pawns = [];
	this.startTiles = [];
	this.goalTiles = [];
	this.start = '';
	this.goal = '';
	this.addPawn=function(){
		this.pawns.push(new pawn(this, this.startTiles[this.startTiles.length-1], this.startTiles[this.startTiles.length-1], this.goalTiles[this.goalTiles.length-1]));
		allPawns.push(this.pawns[this.pawns.length-1])
		this.pawns[this.pawns.length-1].pawnId = allPawns.length-1;
		this.pawns[this.pawns.length-1].circle.attr({parentId:this.pawns[this.pawns.length-1].pawnId});
	}
	this.highlightPawns = function(){
		canMove = false;
		for(p in this.pawns){
			if(this.pawns[p].tile!=this.pawns[p].goalTile){
				if(diceVal==6){
					this.pawns[p].circle.scale(1.3, 1.3);
					this.pawns[p].movable=true;
					this.pawns[p].circle.attr({'cursor':'pointer'})
					canMove = true;
				}
				else{
					if(this.pawns[p].tile!=this.pawns[p].homeTile){
						this.pawns[p].circle.scale(1.3, 1.3);
						this.pawns[p].movable=true;
						this.pawns[p].circle.attr({'cursor':'pointer'})
						canMove = true;
					}
				}
			}
		}
		return canMove;
	}
	this.unHighlightPawns = function(){
		for(p in this.pawns){
			this.pawns[p].circle.scale(1, 1);
			this.pawns[p].movable=false;
			this.pawns[p].circle.attr({'cursor':'pointer'})
		}
	}
}

function pawn(team, tile, homeTile, goalTile){
	this.pawnId = '';
	this.team = team;
	this.tile = tile;
	this.homeTile=homeTile;
	this.goalTile=goalTile;
	this.movable = false;
	this.circle = r.circle(tile.posX, tile.posY, 20).attr({fill:team.color, 'stroke-width': 0});
	this.circle.click(function(){
		parentId = this.attr('parentId');
		if(allPawns[parentId].movable){
			nt = allPawns[parentId].getNextTile(diceVal);
			allPawns[parentId].move(nt);
		}
	})
	
	// get the next tile (with diceVal n) without actually moving the paw
	
	this.getNextTile = function(n){
		if(this.tile==this.homeTile){
			nextTile=this.team.start;
		}
		else{
			curPos = this.tile.count;
			tilesToEnd = tiles.length-(curPos); // check if the pawn goes around the board
			if(tilesToEnd>n){ // didn't go, so we just add the N to current position
				nextTile = tiles[curPos+n];
				if(curPos < this.team.goal.count && this.team.goal.count < nextTile.count){ // passed the goal
					nextTile = this.team.goal;
				}
			}
			else { // did go around the board, so let's start counting position from 0
				nextTile = tiles[n-tilesToEnd];
				if(nextTile.count > this.team.goal.count){ // passed the goal
					nextTile = this.team.goal;
				}
				else if(curPos < this.team.goal.count){ // passed the goal
					nextTile = this.team.goal;
				}
			}
		}
		return nextTile;
	}
	this.goToHome= function(){
				this.tile=this.homeTile;
				this.circle.animateWith(path,{cx:this.tile.posX,cy:this.tile.posY}, 150);
				this.tile.occupied=true;
	}
	this.goToGoal= function(){
	
	}	
	this.move = function(tile){
			this.tile.occupied = false; // unoccupy current tile
			if(this.tile==this.homeTile){ // pawn was on the line for the board, let's move it to the teams starting point
				this.tile = this.team.start;
				this.onStart = false;
				this.circle.animateWith(path,{cx:this.tile.posX,cy:this.tile.posY}, 150);
			}
			else { // the pawn was already on board, moving normal
				this.tile = tile;
				this.circle.animateWith(path,{cx:this.tile.posX,cy:this.tile.posY}, 150);			
			}
			if(this.tile.occupied){ // check if there is another pawn in the tile
				if(this.tile.occupant.team.start==this.tile){ // the tile is 'miina'
					this.tile=this.homeTile;
					this.circle.animateWith(path,{cx:this.tile.posX,cy:this.tile.posY}, 150);
					this.tile.occupied=true;
					this.team.penalty = this.team.penalty+1
					
				}
				else {
					this.tile.occupant.tile=this.tile.occupant.homeTile;
					this.tile.occupant.circle.animateWith(path,{cx:	this.tile.occupant.tile.posX,cy:this.tile.occupant.tile.posY}, 150);
					this.tile.occupant.tile.occupied=true;
					this.tile.occupant.team.penalty = this.tile.occupant.team.penalty + 1;
				}
			}
			if(this.tile==this.team.goal){
				this.tile = this.goalTile;
				this.circle.animateWith(path,{cx:this.tile.posX,cy:this.tile.posY}, 150);
			}
			this.tile.occupied=true; // set the tile as occupied
			this.tile.occupant=this;
			endTurn(); // end turn after moving the piece
		}
}

function nextTurn(){
	teamCount=teams.length-1;
	if(curTurn<teamCount){
		return curTurn+1;
	}
	else{
		return 0;
	}
}

function endTurn(){
	curTeam = teams[curTurn];
	curTeam.unHighlightPawns();
	curTurn = nextTurn();
	diceText.attr({text:'?'});
	dice.attr({fill:teams[curTurn].color});
	diceClicked=false;
	if(teams[curTurn].autoplay){
		setTimeout(function(){
		diceVal = Math.floor(Math.random()*6)+1;
		diceText.attr({text:diceVal});
		c = teams[curTurn].highlightPawns();
		if(c){
			autoPlay(teams[curTurn], diceVal);
		}
		else{ // the team can't move any pawn
			endTurn();
		}}, 500);
	}
}

function startKimble(allTeams, len) {
	allTeams = allTeams;
	r = Raphael("holder", 1030, 460);
	r.customAttributes.parentId = function(num){};
	path = r.path("M 330 30 l 400 0 l 0 400 l -400 0 l z").attr({fill: 'none', 'stroke-width': .3});
	distance = path.getTotalLength()/len;
	count=1;
	length = 0;
	tiles = [];
	while(count<=len){
		startPoint=path.getPointAtLength(length);
		tiles.push(new tile(r, count-1, startPoint.x, startPoint.y));
		length = distance*count;
		count+=1;
	}
	dice = r.circle(530,230,60).attr({fill: '#ddd'});
	diceText = r.text(530,230,60).attr({text: '?','font-size':40});
	
	
	// add all teams and pawns for the game
	i = 0;
	c = 1;
	teams = [];
	for(t in allTeams){
		teams.push(new team(allTeams[t].name,allTeams[t].color,allTeams[t].autoPlay)); // add new team
		teams[teams.length-1].start = tiles[i+1];
		teams[teams.length-1].goal = tiles[i];
		r.circle(teams[teams.length-1].start.posX, teams[teams.length-1].start.posY, 20).attr({fill: teams[teams.length-1].color,'stroke-width': 0, 'fill-opacity':.2})
		sp = r.path('M 30 '+30*c+' l 250 0').attr({fill: 'none', 'stroke-width': .3}); // path for starting tiles
		ep = r.path('M 780 '+30*c+' l 250 0').attr({fill: 'none', 'stroke-width': .3}); // path for goal tiles
		spd = sp.getTotalLength()/allTeams[t].pawnCount;
		count=1;
		length = 0;
		while(count<=allTeams[t].pawnCount){
			startPoint=sp.getPointAtLength(length)
			endPoint=ep.getPointAtLength(length)
			teams[teams.length-1].startTiles.push(new tile(r, count-1, startPoint.x, startPoint.y));
			teams[teams.length-1].goalTiles.push(new tile(r, count-1, endPoint.x, endPoint.y));
			teams[teams.length-1].addPawn();

			length = spd*count;	
			count+=1;	
		}
		
		increment = Math.round(len/allTeams.length);
		i+=increment;
		c+=3
	}
	// at first let's occupy all the necessary tiles
	for(p in allPawns){
		allPawns[p].tile.occupied=true;
	}
	
	// dice is clicked, do stuff :)
	dice.click(function(){
		if(!diceClicked){
			//diceClicked=true;		
			diceVal = Math.floor(Math.random()*6)+1;
			diceText.attr({text:diceVal});
			c = teams[curTurn].highlightPawns();
			if(!c){ // the team can't move any pawn
				endTurn();
			}
		}
	});
	/*$('a#startGame').click(function(){
		while(!gameEnded){
			if(teams[curTurn].autoplay){
				diceVal = Math.floor(Math.random()*6)+1;
				c = teams[curTurn].highlightPawns();
				if(c){
					autoPlay(teams[curTurn], diceVal);
				}
				else{
					endTurn();
				}
			}
			else{
				dice.click(function(){
					if(!diceClicked){
						diceClicked=true;		
						diceVal = Math.floor(Math.random()*6)+1;
						diceText.attr({text:diceVal});
						c = teams[curTurn].highlightPawns();
						if(c){
							autoPlay(teams[curTurn], diceVal);
						}
						else{ // the team can't move any pawn
							endTurn();
						}
					}
				});
			}
		}
	});*/
}