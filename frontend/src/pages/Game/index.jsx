/* eslint-disable */
import { useSocket } from '../../components/Socket';
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Game() {

	const socket =  useSocket();
	const {direct} = useParams();
    const navigate = useNavigate();


	type Game = {
		playerLeft: { name: string, score: number, paddlePosition: number },
		playerRight: { name: string, score: number, paddlePosition: number },
		ball: {x: number, y: number, dx: number, dy: number}
	};

	const [readyToPlay, setReadyToPlay] = useState(direct ? true: false);
	const [playerSide, setPlayerSide] = useState(null);
	const [winner, setWinner] = useState(null);

	const [gameState, setGameState] = useState(null);
	const [gameEnd, setGameEnd] = useState(false);

	const [isKeyUpPressed, setIsKeyUpPressed] = useState(false);
	const [isKeyDownPressed, setIsKeyDownPressed] = useState(false);

	const [boostedMode, setBoostedMode] = useState(false);

	const ballRef = useRef({ x: 400 , y: 100 , dx: 0, dy: 0 });

	function actualizeBallPos(gameState: Game) {
		ballRef.current.x = gameState.ball.x;
		ballRef.current.y = gameState.ball.y;
		ballRef.current.dx = gameState.ball.dx;
		ballRef.current.dy = gameState.ball.dy;
	}

	useEffect( () => {

		if (!readyToPlay || !socket || gameEnd)
			return; //set error ?

		const gameStartHandler = (gameGivenState: Game, playerGivenSide: string) => {
			setPlayerSide(playerGivenSide);
			setGameState(gameGivenState);
			actualizeBallPos(gameGivenState);
		};
		const gameRefreshPaddleHandler = (gameGivenState: Game) => {
			setGameState(gameGivenState);
		};
		const gameRefreshScoreHandler = (gameGivenState: Game) => {
			setGameState(gameGivenState);
		};
		const gameRefreshBallHandler = (gameGivenState: Game) => {
			actualizeBallPos(gameGivenState);
		};
		const gameEndHandler = (winner: string) => {
			setGameEnd(true);
			setWinner(winner);
		};
		if (!direct)
			socket.emit('FIND_GAME', boostedMode);

		socket.on('GAME_START', gameStartHandler);
		socket.on('GAME_REFRESH_PADDLE', gameRefreshPaddleHandler);
		socket.on('GAME_REFRESH_BALL', gameRefreshBallHandler);
		socket.on('GAME_REFRESH_SCORE', gameRefreshScoreHandler);
		socket.on('GAME_END', gameEndHandler);

		// FAUT IL IMPLEMENTER SOCKET OFF ?
			return () => {
				socket.off('GAME_START', gameStartHandler);
				socket.off('GAME_REFRESH_PADDLE', gameRefreshPaddleHandler);
				socket.off('GAME_REFRESH_BALL', gameRefreshBallHandler);
				socket.off('GAME_REFRESH_SCORE', gameRefreshScoreHandler);
			};

	}, [socket, readyToPlay, boostedMode]);

	///////////// CAPTURE KEYBOARD && VERIFICATION VALID MOVE /////////////

		function validPaddleMove(direction: string) : boolean {

			let blindSpotSizeRatio = 19; //ratio sur la taille du petit coin inateignable par le paddle
			let paddleStep = 5; // UTILISER LA VALEUR DU BACKEND

			if (direction === 'direction_up') {

				if (playerSide === 'player_left' && gameState.playerLeft.paddlePosition + paddleStep < (hheight / blindSpotSizeRatio))
					return false;
				if (playerSide === 'player_right' && gameState.playerRight.paddlePosition + paddleStep < (hheight / blindSpotSizeRatio))
					return false;
				return true;
			}
			if (direction === 'direction_down') {
				if (playerSide === 'player_left' && (gameState.playerLeft.paddlePosition  + paddleHeight) - (paddleStep) > hheight - (hheight / blindSpotSizeRatio) )
					return false;
				if (playerSide === 'player_right' && (gameState.playerRight.paddlePosition + paddleHeight) - (paddleStep) > hheight - (hheight / blindSpotSizeRatio) )
					return false;
				return true;
			}
		};

	const handleKeyDown = (event) => {

		event.preventDefault();

		if ((event.keyCode === 87 || event.keyCode === 38)) {
			if (validPaddleMove('direction_up'))
				setIsKeyUpPressed(true);
		}
		if ((event.keyCode === 83 || event.keyCode === 40)) { // 'W' key
			if (validPaddleMove('direction_down'))
				setIsKeyDownPressed(true);
		}
	};

	const handleKeyUp = (event) => {

		event.preventDefault();

		if ((event.keyCode === 87 || event.keyCode === 38))
			setIsKeyUpPressed(false);

		if ((event.keyCode === 83 || event.keyCode === 40))
			setIsKeyDownPressed(false);
	};


	useEffect(() => {

		if (!gameState || gameEnd || !socket) {
			return;//security
		}
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		const interval = setInterval(() => {
			if (isKeyUpPressed && validPaddleMove('direction_up')) {
				socket.emit('paddle_move', 'UP');
			}
			if (isKeyDownPressed && validPaddleMove('direction_down')) {
				socket.emit('paddle_move', 'DOWN');
			}
		}, 20); //determine la vitesse des paddle

		return () => {
			window.removeEventListener('keydown', handleKeyDown); // Cleanup on unmount
			window.removeEventListener('keyup', handleKeyUp);
			clearInterval(interval);
		};

	}, [gameState, isKeyUpPressed, isKeyDownPressed]); //est ce qu on peut vraiment ne rien mettre dans le tableau


	let wwidth = 800;
	let hheight = 600;
	let paddleHeight = 80;
	let paddleWidth = 10;

	let leftPaddle = { x: 35, width: paddleWidth, height: paddleHeight, dy: 0 };
	let rightPaddle = { x: wwidth - 40, width: paddleWidth, height: paddleHeight, dy: 0 };

	let border_top = { x: 0, y: 0, width: wwidth, height: 3};
	let border_bot = { x: 0, y: hheight - 3, width: wwidth, height: 3};
	let border_left = { x: 0, y: 0, width: 3, height: hheight};
	let border_right = { x: wwidth - 3, y: 0, width: 3, height: hheight};

	const canvasRef = useRef(null);

	useEffect(() => {

		if (!gameState || gameEnd || !socket) {
			return; //error ?
		}

		const context = canvasRef.current.getContext('2d');

		let animation_id;

		const update = () => {


			// Clear canvasRef.current
			context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

			// Draw Ball
			context.beginPath();
			if (boostedMode)
				context.arc(ballRef.current.x, ballRef.current.y, 25, 0, Math.PI * 2);
			else
				context.arc(ballRef.current.x, ballRef.current.y, 10, 0, Math.PI * 2);
			context.fill();

			// Draw Paddles
			context.fillStyle = '#a56fe2';

			if (playerSide === 'player_left')
			{
				context.fillRect(leftPaddle.x, gameState.playerLeft.paddlePosition, leftPaddle.width, leftPaddle.height);
				context.fillStyle = '#4a3e56';
				context.fillRect(rightPaddle.x, gameState.playerRight.paddlePosition, rightPaddle.width, rightPaddle.height);
			}
			else
			{
				context.fillRect(rightPaddle.x, gameState.playerRight.paddlePosition, rightPaddle.width, rightPaddle.height);
				context.fillStyle = '#d3c4de';
				context.fillRect(leftPaddle.x, gameState.playerLeft.paddlePosition, leftPaddle.width, leftPaddle.height);
			}

			context.fillRect(border_top.x, border_top.y, border_top.width, border_top.height);
			context.fillRect(border_bot.x, border_bot.y, border_bot.width, border_bot.height);
			context.fillRect(border_left.x, border_left.y, border_left.width, border_left.height);
			context.fillRect(border_right.x, border_left.y, border_left.width, border_left.height);

			// Next frame
			animation_id = requestAnimationFrame(update);
		}

		animation_id = requestAnimationFrame(update);

		return () => {
			cancelAnimationFrame(animation_id);
		}

	}, [gameState, ballRef, gameEnd]);

	const handleReload = () => {
		if (direct) {
			navigate('/game');
			// return;
		}
		window.location.reload();
	};

	const handleReadyToPlay = () => {
		setReadyToPlay(true);
	}

	const handleReadyToPlayBoosted = () => {
		setBoostedMode(true);
		setReadyToPlay(true);
	}

	if (!readyToPlay) {
		return (
			<div className="find_game">
			<h1>Matchmaking</h1>
			<button onClick={handleReadyToPlay}>CLASSIC MODE</button>
			<button onClick={handleReadyToPlayBoosted}>BOOSTED MODE</button>
			</div>
		);
	}

	return (

		<div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', whiteSpace: 'pre', marginTop: '50px'}}>

		{!gameState && !gameEnd && <h2>Waiting for opponent ...</h2>}

		{gameEnd && winner && <h1 style={{fontSize: '50px'}}>GAME WINNED BY {winner} </h1>}

		{!gameEnd && <canvas ref={canvasRef} width='800' height='600' style={{marginBottom: '-50px'}}/>}

		{gameState && <h1 style={{fontSize: '100px'}}>{gameState.playerLeft.score}      -      {gameState.playerRight.score}</h1>}

		{gameEnd && <button onClick={handleReload} style={{ padding: '15px 25px', borderRadius: '4px'}} > Back to game menu </button>}

		</div>
	);
}
