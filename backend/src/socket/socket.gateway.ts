import { ModuleRef } from '@nestjs/core';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelService } from 'src/channel/channel.service';
import { HistoryService } from 'src/history/history.service';
import { MessageService } from 'src/message/message.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

import { ConfigService } from '@nestjs/config';

// ACHILLE: j ai du mettre origin: true pour que le host soit modifiable depuis le .env, ca n aura aucun impact sur le bon fonctionnement des socket ?
@WebSocketGateway({ cors: {
	origin: true,
		methods: ['GET', 'POST'],
	credentials: true,
} })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(private moduleRef: ModuleRef, private prismaService: PrismaService, private historyService: HistoryService){}
	@WebSocketServer()
	server: Server;

	private connectedClients = new Map<string, Socket>();

  async handleConnection(client: Socket) {
    const username = client.handshake.query.username as string;
    const userService = this.moduleRef.get(UserService, {strict: false});
    await userService.connect(username);
    this.connectedClients.set(username, client);
    this.server.emit("connection");
  }

  async handleDisconnect(client: Socket) {

    const userService = this.moduleRef.get(UserService, {strict: false});
    for (const [username, socket] of this.connectedClients) {
      if (socket === client) {

		  this.manageGameInterruption(username);

		  this.connectedClients.delete(username);
		  await userService.disconnect(username);
		  await userService.setOutGame(username);
		  //console.log("user disconnected");
		  break;
	  }
	}
	this.server.emit("connection");
  }

  async manageGameInterruption(username: string) {

	const userService = this.moduleRef.get(UserService, {strict: false});
	await userService.setOutGame(username);
    this.server.emit("connection");
	  if (this.isInMatchmakingQueue(username))
		  this.matchmakingQueue = this.matchmakingQueue.filter(player => player !== username);
	  
	  if (this.isInMatchmakingQueueBoosted(username))
		  this.matchmakingQueueBoosted = this.matchmakingQueueBoosted.filter(player => player !== username);
		if (this.matchingQueuePrivate[username]){
			this.matchingQueuePrivate.delete(username);
			await userService.deleteInvite(username);
			if (this.matchingQueuePrivate[username])
			this.sendEvent(this.matchingQueuePrivate[username], "CANCEL_INVITE", username);
		}

	  if (this.isInActiveGame(username)) {

		  const currentGame = this.getPlayerCurrentGame(username);
		  if (!currentGame)
			  return;
		  currentGame.interruption = true; //stopper la loop du jeu

		  let opponent: string = this.getOpponent(username);

		  if (this.connectedClients.get(opponent) !== undefined) {

			  if (this.getPlayerSide(username) == 'RIGHT')
				  this.connectedClients.get(opponent).emit('GAME_END', currentGame.playerLeft.login);
			  else if (this.getPlayerSide(username) == 'LEFT')
				  this.connectedClients.get(opponent).emit('GAME_END', currentGame.playerRight.login);
			  else
				  console.log('');
			  //console.log('Error: game interruption');

		  }

		  this.activeGames = this.activeGames.filter(([key1, key2, game]) => game !== currentGame);
	  }
  }

  sendEvent(username: string, eventName: string, data: any) {
	  const socket = this.connectedClients.get(username);
	  if (socket)
		  socket.emit(eventName, data);
  }

  //a changer: dans les messages il ne faut pas stocker senderLogin mais senderUsername, car il ne change pas.(pour les blocked)

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: any) {
	  const channelService = this.moduleRef.get(ChannelService, {strict: false});
	  const userService = this.moduleRef.get(UserService, {strict: false});
	  const channelId = await channelService.getIdByName(payload.channelName);
	  const userId = await userService.getIdByLogin(payload.senderLogin);
	  try {
		  const chanco = await this.prismaService.channelConnection.findFirstOrThrow({
			  where :{
				  userId,
				  channelId,
			  }
		  })
		  if (chanco.muted < (Math.floor(new Date().getTime() / 1000)))
			  {
				//   console.log ("user " + payload.senderLogin + " is no muted until " + chanco.muted + '/' + Math.floor(new Date().getTime() / 1000));
				  const messageservice = this.moduleRef.get(MessageService, { strict: false });
				  const message = await messageservice.createMessage(payload.content, payload.senderLogin, payload.channelName);
				//   console.log('jenvoie le message');
				  payload.userList.map((user: any) => {
					if (this.connectedClients.get(user.username))
					  this.connectedClients.get(user.username).emit('message', message);
				  })
			  }
			  else {
				  console.log('');
				  //console.log("userid " + chanco.userId + " is muted on chan " + chanco.channelId);
			  }
	  }
	  catch (error) {
		  //console.log("erroooooor");
		  throw (error);
	  }
  }

  private matchmakingQueue: string[] = [];

  private matchmakingQueueBoosted: string[] = [];

  private matchingQueuePrivate = new Map<string, string>();

  private activeGames: [string, string, Game][] = [];

  @SubscribeMessage("QUIT_QUEUE")
  async quitQueue(client: Socket) {
	this.connectedClients.forEach((value, key) => {
        if (value === client) {
			this.manageGameInterruption(key);
        }
      });
  }

  @SubscribeMessage("INVITE_PLAYER")
	invitePlayer(client: Socket, payload: any) {
	const userService = this.moduleRef.get(UserService, {strict: false});
	this.connectedClients.forEach((value, key) => {
        if (value === client) {
			this.matchingQueuePrivate[key] = payload.targetUsername;
			userService.inviteUser(key, payload.targetUsername);
			this.sendEvent(payload.targetUsername, "INVITED", key);
        }
      });
  }

  @SubscribeMessage("ACCEPT_INVITATION")
  acceptInvitation(client: Socket, payload: any) {
	this.connectedClients.forEach((value, key) => {
        if (value === client) {
			for (const game of this.activeGames) {
				if (game[0] === payload.inviter || game[1] === payload.inviter || game[0] === this.matchingQueuePrivate[payload.inviter] || game[1] === this.matchingQueuePrivate[payload.inviter])
					return;
			}
			if (this.matchingQueuePrivate[payload.inviter] === key) {
	  			const userService = this.moduleRef.get(UserService, {strict: false});
				userService.setInGame(payload.inviter);
				userService.setInGame(this.matchingQueuePrivate[payload.inviter]);
				this.server.emit("connection");
				this.launchGame(payload.inviter, this.matchingQueuePrivate[payload.inviter], false);
				// this.matchingQueuePrivate.delete(payload.inviter);
			}
        }
      });
  }
  




  @SubscribeMessage('FIND_GAME')
  async handleLaunchGame(client: Socket, boostedMode: boolean) {

	  let username = client.handshake.query.username;

	  //const userService = this.moduleRef.get(UserService, {strict: false});
	  //
	  //if (Array.isArray(username))
	  // return;// error
	  //
	  //const login = await userService.getLoginByUsername(username);

	  if (typeof username != 'string')
		  return; //gerer erreur
	  //check si l username existe dans la database ?

	  //check si l username est deja dans la matchmakingQueue
	  for (const player of this.matchmakingQueue) {
		  if (player == username)
			  return;
	  }

	  for (const player of this.matchmakingQueueBoosted) {
		  if (player == username)
			  return;
	  }
	  //check si l username est deja dans un activeGames 
	  for (const game of this.activeGames) {
		  if (game[0] === username || game[1] === username)
			  return;
	  }

	  if (boostedMode)
		  this.matchmakingQueueBoosted.push(username);
	  else
		  this.matchmakingQueue.push(username);
	  //console.log(username, ' added : ', this.matchmakingQueue);

	  if (boostedMode && this.matchmakingQueueBoosted.length >= 2) {
		  const playerLeft = this.matchmakingQueueBoosted.shift();
		  const playerRight = this.matchmakingQueueBoosted.shift();
		  const userService = this.moduleRef.get(UserService, {strict: false});
		  userService.setInGame(playerLeft);
		  userService.setInGame(playerRight);
		  this.server.emit("connection");
		  this.launchGame(playerLeft, playerRight, true);
	  }

	  if (this.matchmakingQueue.length >= 2) {
		const playerLeft = this.matchmakingQueue.shift();
		const playerRight = this.matchmakingQueue.shift();
		const userService = this.moduleRef.get(UserService, {strict: false});
		userService.setInGame(playerLeft);
		userService.setInGame(playerRight);
		this.server.emit("connection");
		this.launchGame(playerLeft, playerRight, false);
	  }


  }


  async launchGame(playerLeft: string, playerRight: string, boostedMode: boolean) {

	  const sPlayer1 = this.connectedClients.get(playerLeft);
	  const sPlayer2 = this.connectedClients.get(playerRight);

	  /// new
	  const userService = this.moduleRef.get(UserService, {strict: false});

	  const loginLeft = await userService.getLoginByUsername(playerLeft);
	  const loginRight = await userService.getLoginByUsername(playerRight);
	  ///

	  if (sPlayer1 === undefined || sPlayer2 === undefined) {
		  //console.log('socket manageGame erreur le socket recupere est undefined for :');
		  //if (sPlayer1 === undefined)
			 // console.log('PLAYER1');
		  //if (sPlayer2 === undefined)
			 // console.log('PLAYER2');
		  return;
	  }

	  const gameState : Game = this.initializeGameState(playerLeft, playerRight, loginLeft, loginRight, boostedMode);

	  changeBallSpeed(gameState, 0);

	  if (Math.random() < 0.5)
		  changeBallAngle(gameState, toRadians(0));
	  else
		  changeBallAngle(gameState, toRadians(180));

	  this.activeGames.push([playerLeft, playerRight, gameState]);

	  sPlayer1.emit('GAME_START', gameState, 'player_left');
	  sPlayer2.emit('GAME_START', gameState, 'player_right');

	  this.gameLoop(gameState, sPlayer1, sPlayer2);
  }

  gameLoop(gameState: Game, player1Socket, player2Socket) {

	  let scoreToWin = 5;

	  let wwidth = 800;
	  let hheight = 600;
	  let paddleHeight = 80;
	  let paddleWidth = 10;
	  let ballAccelerationStack = 0.2;

	  let leftPaddle = { x: 35, width: paddleWidth, height: paddleHeight};
	  let	rightPaddle = { x: wwidth - 40, width: paddleWidth, height: paddleHeight };

	  let ballRadius = gameState.ball.radius;

	  let maxAngle = gameState.ball.maxAngle;

	  let ballX: number;
	  let ballY: number;

	  let intervalId = setInterval(() => {

		  ballX = gameState.ball.x;
		  ballY = gameState.ball.y;

		  //// CONTACT AVEC PADDLES /////////////////////////////

		  // PADDLE GAUCHE //
		  //balle dans la zone du paddle en y :
		  if ( (ballY - ballRadius <= gameState.playerLeft.paddlePosition + paddleHeight) //balle au dessus de la partie basse du paddle
			  && (ballY + ballRadius >= gameState.playerLeft.paddlePosition) ) //balle au dessous de la partie haute du paddle
		  //balle dans la zone du paddle en x :
		  if (ballX - ballRadius <= leftPaddle.x + leftPaddle.width
			  && ballX + ballRadius >= leftPaddle.x)
		  {
			  gameState.ball.dx *= -1;
			  //definir le nouvel angle :

			  // le centre vertical du paddle
			  let centre_paddle_Y = gameState.playerLeft.paddlePosition + (leftPaddle.height / 2);
			  let distance_ball_paddle_Y: number;
			  //variable  pour savoir si la balle tape au dessus ou dessous du centre du paddle :
			  let quadrant = 1; //pour au dessus

			  if (ballY > centre_paddle_Y) {
				  distance_ball_paddle_Y = ballY - centre_paddle_Y;
				  quadrant = 0; // la balle tape au dessous du centre
			  }
			  else
				  distance_ball_paddle_Y = centre_paddle_Y - ballY;

			  // L'angle_impact prendra une valeur de 0 si la balle tape au centre du paddle, jusqu a 1 si la balle tape totalement dans un coin, a partir de cela on va a la fois pouvoir determiner l' angle dans lequel la balle repartira mais aussi son acceleration
			  let angle_impact = distance_ball_paddle_Y / (leftPaddle.height / 2);
			  angle_impact *= 0.80; //pour ramener le maximum a 1 a la place de 1.2, plus simple 

			  //on envoi une valeur entre 0 et 80 degres ( 0 < angle_impact < 1 )
			  if (angle_impact > 0.3) {
				  if (quadrant === 0)
					  changeBallAngle(gameState, toRadians(angle_impact * maxAngle));
				  else
					  changeBallAngle(gameState, toRadians(360 - (angle_impact * maxAngle)));
			  }
			  if (angle_impact > 0.5) {
				  let ratioAcceleration = (angle_impact - 0.5) * 2; //ratioAcceleration entre 0.5 et 1;
				  //ratioAcceleration = (ratioAcceleration - 0.5) * 2; //on passe ratioAcceleration entre 0 et 1;
				  changeBallSpeed(gameState, getBallSpeed(gameState) + 0.1 + (ratioAcceleration * ballAccelerationStack) ); //fine tuning
				  //on augmente systematiquement de 0.1 si l impact est > 0.5, et on augmente encore de 0 a 0.2 en plus en fonction de l angle
			  }
		  }

		  // PADDLE DROIT //
		  if ( (ballY - ballRadius <= gameState.playerRight.paddlePosition + paddleHeight)
			  && (ballY + ballRadius >= gameState.playerRight.paddlePosition))
		  if ( (ballX + ballRadius >= rightPaddle.x)
			  && (ballX - ballRadius <= rightPaddle.x + rightPaddle.width) )
		  {
			  gameState.ball.dx *= -1;
			  //definir le nouvel angle :

			  // le centre vertical du paddle
			  let centre_paddle_Y = gameState.playerRight.paddlePosition + (rightPaddle.height / 2);
			  let distance_ball_paddle_Y;
			  //variable  pour savoir si la balle tape au dessus ou dessous du centre du paddle :
			  let quadrant = 1; //pour au dessus

			  if (ballY > centre_paddle_Y) {
				  distance_ball_paddle_Y = ballY - centre_paddle_Y;
				  quadrant = 0; // la balle tape au dessous du centre
			  }
			  else
				  distance_ball_paddle_Y = centre_paddle_Y - ballY;

			  // L'angle_impact prendra une valeur de 0 si la balle tape au centre du paddle, jusqu a 1 si la balle tape totalement dans un coin, a partir de cela on va a la fois pouvoir determiner l' angle dans lequel la balle repartira mais aussi son acceleration

			  let angle_impact = distance_ball_paddle_Y / (rightPaddle.height / 2);
			  angle_impact *= 0.80; //pour ramener le maximum a 1 a la place de 1.2, plus simple 

			  let inversion = 180;
			  //on envoi une valeur entre 0 et 80 degres ( 0 < angle_impact < 1 )
			  if (angle_impact > 0.3) {
				  if (quadrant === 0)
					  changeBallAngle(gameState, toRadians(90 + angle_impact * maxAngle));
				  else
					  changeBallAngle(gameState, toRadians(180 + (angle_impact * maxAngle))) ;
			  }

			  if (angle_impact > 0.5) {
				  let ratioAcceleration = (angle_impact - 0.5) * 2; //ratioAcceleration entre 0.5 et 1;
				  changeBallSpeed(gameState, getBallSpeed(gameState) + 0.1 + (ratioAcceleration * ballAccelerationStack) ); //fine tuning
				  //on augmente systematiquement de 0.1 si l impact est > 0.5, et on augmente encore de 0 a 0.2 en plus en fonction de l angle
			  }
		  }

		  //// CONTACT AVEC BORDS //////////////////////////////

		  if (ballY > hheight - 10 || ballY <= 10)
			  gameState.ball.dy *= -1;

		  //// COLLISIONS BORDS DROITE / GAUCHE et reset position balle
		  if (ballX > wwidth - 10 || ballX <= 10) {
			  //gameState.ball.dx *= -1;
			  gameState.ball.y = hheight / 2;
			  changeBallSpeed(gameState, 0); //fine tuning

			  if (ballX > wwidth - 10 ) {
				  gameState.ball.x = wwidth / 2 - 150;
				  changeBallAngle(gameState, toRadians(0));
				  gameState.playerLeft.score += 1;
			  }
			  else {
				  gameState.ball.x = wwidth / 2 + 150;
				  changeBallAngle(gameState, toRadians(180));
				  gameState.playerRight.score += 1;
			  }

			  player1Socket.emit('GAME_REFRESH_SCORE', gameState);
			  player2Socket.emit('GAME_REFRESH_SCORE', gameState);

			  if (gameState.playerLeft.score >= scoreToWin) {
				  player1Socket.emit('GAME_END', gameState.playerLeft.login);
				  player2Socket.emit('GAME_END', gameState.playerLeft.login);
			  }

			  if (gameState.playerRight.score >= scoreToWin) {
				  player1Socket.emit('GAME_END', gameState.playerRight.login);
				  player2Socket.emit('GAME_END', gameState.playerRight.login);
			  }

			  //////////////// GAME END ////////////////////

			  if (gameState.playerLeft.score >= scoreToWin || gameState.playerRight.score >= scoreToWin) {
				  clearInterval(intervalId);
				  const userService = this.moduleRef.get(UserService, {strict: false});
				  
				  userService.setInGame(gameState.playerLeft.name);
				  userService.setInGame(gameState.playerRight.name);
				  this.server.emit("connection");
				  this.historyService.saveGame(gameState.playerLeft.login, gameState.playerRight.login, gameState.playerLeft.score, gameState.playerRight.score); 
				  this.activeGames = this.activeGames.filter(([key1, key2, game]) => game !== gameState);
				  return;
			  }

		  }
		  else {
			  gameState.ball.x += gameState.ball.dx;
			  gameState.ball.y += gameState.ball.dy;
		  }

		  if (gameState.interruption) {
			// const userService = this.moduleRef.get(UserService, {strict: false});
			// userService.setInGame(playerLeft);
			// userService.setInGame(playerRight);
			  //this.historyService.saveGame(gameState.playerLeft.login, gameState.playerRight.login, gameState.playerLeft.score, gameState.playerRight.score);
			  //finalement c est mieux de ne pas mettre les parties interromppues dans l historique puisqu elles peuvent etre gagnees par le joueur avec le score le plus bas, sinon il faudrai rajouter un champs pour dire qui a gagne ...
			  clearInterval(intervalId);
			  return;
		  }

		  player1Socket.emit('GAME_REFRESH_BALL', gameState);
		  player2Socket.emit('GAME_REFRESH_BALL', gameState);

	  }, 10);

  }


  @SubscribeMessage('paddle_move')
  async testPaddleMove(client: Socket, payload: any) {

	  //securite obligee pour utiliser username comme argument plus tard en temps que String
	  if (Array.isArray(client.handshake.query.username)) {
		  //console.log('Erreur paddle up');
		  return;
	  }
	  let username : string = client.handshake.query.username ;

	  let gameState : Game = null;

	  let playerSide : string = this.getPlayerSide(username);

	  gameState = this.getPlayerCurrentGame(username);

	  if (!gameState) {
		  //console.log('Error: player has no current game');
		  return;
	  }

	  //La vitesse de deplacement du paddle augmente avec l augmentation de la vitesse de la balle
	  let paddleStep: number;

	  if (gameState.mode == 1)
		  paddleStep = 8 + getBallSpeed(gameState) * 7;
	  if (gameState.mode == 2)
		  paddleStep = 13 + getBallSpeed(gameState) * 16;

	  if (payload === 'UP') {
		  if (playerSide === 'LEFT')
			  gameState.playerLeft.paddlePosition -= paddleStep;
		  else if (playerSide === 'RIGHT')
			  gameState.playerRight.paddlePosition -= paddleStep;
		  else {
			  //console.log('Error: paddle_move');
			  return;
		  }
	  }

	  if (payload === 'DOWN') {
		  if (playerSide === 'LEFT')
			  gameState.playerLeft.paddlePosition += paddleStep;
		  else if (playerSide === 'RIGHT')
			  gameState.playerRight.paddlePosition += paddleStep;
		  else {
			  //console.log('Error: paddle_move');
			  return;
		  }
	  }

	  //ajouter gestion erreur si on ne peut pas get que renvoi connectedClients (ne devrait pas se produire mais au cas ou)
	  this.connectedClients.get(username).emit('GAME_REFRESH_PADDLE', gameState);
	  this.connectedClients.get(this.getOpponent(username)).emit('GAME_REFRESH_PADDLE', gameState);
  }

  getPlayerCurrentGame(player: string) : Game {
	  for (const [playerLeft, playerRight, game] of this.activeGames) {
		  if (player === playerLeft || player === playerRight) {
			  return game;
		  }
	  }
	  return null;
  }

  getOpponent(player: string) : string
  {
	  for (const [playerLeft, playerRight, game] of this.activeGames) {
		  if (player === playerLeft)
			  return playerRight;
		  if (player === playerRight)
			  return playerLeft;
	  }
	  //console.log('Error getOpponent no opponent');
	  return null;
  }

  isInActiveGame(player: string) : boolean
  {
	  for (const [playerLeft, playerRight, game] of this.activeGames) {
		  if (player === playerLeft || player == playerRight)
			  return true;
	  }
	  return false;
  }

  isInMatchmakingQueue(player: string) : boolean {

	  for (const playerIterator of this.matchmakingQueue) {
		  if (playerIterator == player)
			  return true;
	  }
	  return false;
  }

  isInMatchmakingQueueBoosted(player: string) : boolean {

	  for (const playerIterator of this.matchmakingQueueBoosted) {
		  if (playerIterator == player)
			  return true;
	  }
	  return false;
  }

  getPlayerSide(player: string) : string
  {

	  for (const [playerLeft, playerRight, game] of this.activeGames) {
		  if (player === playerLeft)
			  return 'LEFT';
		  if (player === playerRight)
			  return 'RIGHT';
	  }
	  //console.log('Error getPlayerSide');
	  return null;
  }

  initializeGameState(playerL: string, playerR: string, loginL: string, loginR: string, boostedMode: boolean) : Game {
	  // Initialiser l'état de jeu, par exemple avec des positions de départ
	  if (boostedMode) {
		  return ({
			  playerLeft: { name: playerL, score: 0, paddlePosition: 300, login: loginL},
			  playerRight: { name: playerR, score: 0, paddlePosition: 300, login: loginR},
			  ball: { x: 400, y: 300 , dx: 1, dy: 0, minSpeedBall: 7, maxSpeedBall: 12, radius: 25, maxAngle: 50}, //tuner
			  interruption: false,
			  mode: 2,
			  // autres éléments d'état nécessaires
		  });
	  }
	  else {
		  return ({
			  playerLeft: { name: playerL, score: 0, paddlePosition: 300, login: loginL},
			  playerRight: { name: playerR, score: 0, paddlePosition: 300, login: loginR},
			  ball: { x: 400, y: 300 , dx: 1, dy: 0, minSpeedBall: 4, maxSpeedBall: 9, radius: 10, maxAngle: 70}, //tuner
			  interruption: false,
			  mode: 1,
			  // autres éléments d'état nécessaires
		  });
	  }
  }

}

type Game = {
	playerLeft: { name: string, score: number, paddlePosition: number, login: string },
	playerRight: { name: string, score: number, paddlePosition: number, login: string },
	ball: {x: number, y: number, dx: number, dy: number, minSpeedBall: number, maxSpeedBall: number, radius: number, maxAngle: number}
	interruption: boolean;
	mode: number;
};

function changeBallSpeed(gameState: Game, newSpeed: number) {

	// fine tuning
	newSpeed = (newSpeed * (gameState.ball.maxSpeedBall - gameState.ball.minSpeedBall)) + gameState.ball.minSpeedBall;
	if (newSpeed > gameState.ball.maxSpeedBall)
		newSpeed = gameState.ball.maxSpeedBall;

	const currentDx = gameState.ball.dx;
	const currentDy = gameState.ball.dy;

	const currentAngle = Math.atan2(currentDy, currentDx);

	gameState.ball.dx = newSpeed * Math.cos(currentAngle);
	gameState.ball.dy = newSpeed * Math.sin(currentAngle);
}

function getBallSpeed (gameState: Game) {
	const currentDx = gameState.ball.dx;
	const currentDy = gameState.ball.dy;
	let rawSpeed = Math.sqrt(currentDx * currentDx + currentDy * currentDy);

	let speed_finetuned = (rawSpeed - gameState.ball.minSpeedBall) / ( gameState.ball.maxSpeedBall - gameState.ball.minSpeedBall);

	return speed_finetuned;
}

function changeBallAngle (gameState: Game, theta: number) {
	const currentDx = gameState.ball.dx;
	const currentDy = gameState.ball.dy;
	const currentSpeed = Math.sqrt(currentDx * currentDx + currentDy * currentDy);

	gameState.ball.dx = currentSpeed * Math.cos(theta);
	gameState.ball.dy = currentSpeed * Math.sin(theta);
}

function toRadians(degrees: number) {
	return degrees * (Math.PI / 180);
}

