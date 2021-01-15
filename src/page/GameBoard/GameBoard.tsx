import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import api from '../../service/api';
import socketIo from 'socket.io-client';

import Score from '../../component/Score/Score';
import Waiting_Room from '../../component/Waiting-Room/Waiting-Room';
import Game_Board from '../../component/Board/GameBoard';

import Edge from '../../logic/Edge';
import PlayData from '../../logic/PlayData';

import './GameBoard.css';


interface GameBoardParams {
  playerId: string;
}


/**
 * GameBoard page
 * Presents the grid where players will interact
 */
function GameBoard() {
  let { playerId } = useParams<GameBoardParams>();
  const myPlayerId = playerId;

  const history = useHistory();

  const [socketConnected, setSocketConnected] = useState(false);

  const [player1Id, setPlayer1Id] = useState('-1');
  const [player1Name, setPlayer1Name] = useState('');
  const [player1Score, setPlayer1Score] = useState('0');

  const [player2Name, setPlayer2Name] = useState('');
  const [player2Score, setPlayer2Score] = useState('0');

  const [gridSize, setGridSize] = useState(0);
  const player1Color: string = "#0077c2";
  const player2Color: string = "#790e8b";

  const [currentTurn, setCurrentTurn] = useState(player1Id);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [gameData, setGameData] = useState<PlayData[]>([]);

  /**
   * =============================================================
   * REST Stuff
   */
  function fetchGameInfo() {
    api
      .get("gameinfo")
      .then(response => {
        console.log('FetchGameInfo');

        setGridSize(response.data.gridsize);

        setCurrentTurn(response.data.turn);
        setPlayer1Id(response.data.player1Id);
        setPlayer1Name(response.data.player1);
        setPlayer2Name(response.data.player2);

        setWaitingList(response.data.waitinglist);
      })
  }

  function sendBotPlay() {
    if (Number(currentTurn) != 0) return;
    try {
      console.log('SENDBOTPLAY');
      api.post("botplay");
    } catch (error) {
      console.log(error.response);
      console.log(error.request);
    }
  }

  /**
   * Send a play to the server game
   * @param gridEdge Edge clicked by the player
   */
  function sendPlay(gridEdge: Edge | null) {
    if (gridEdge == null) return;
    try {
      console.log('SENDPLAY - Player ' + myPlayerId + ' did a move');
      api.post("selection", {
        'x1': gridEdge.x1,
        'y1': gridEdge.y1,
        'x2': gridEdge.x2,
        'y2': gridEdge.y2,
        'player': myPlayerId,
      });
    } catch (error) {
      console.log(error.response);
      console.log(error.request);
    }
  }
  //==============================================================



  /**
   * ===========================================================
   * Socket stuff
   */
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3333';

  function connectSocket() {
    const socket = socketIo(API_URL);

    socket.on('connect', () => {
      console.log('CONNECT event arrived');
      setSocketConnected(true);
    });

    socket.on('gameUpdate', (response: any) => {
      console.log('GAMEUPDATE event arrived');
      updateGamePlay(response);
    });

    socket.on('waitingRoomUpdate', (response: any) => {
      console.log('WAITINGROOMUPDATE event arrived');
      setWaitingList(response.waitingList);
    });

    // CLEAN UP THE EFFECT
    return () => socket.disconnect();
  }
  /**
   * ==========================================================
   */

  /**
   * =========================================================
   *  Controller Stuff
   */
  function updateGamePlay(lastPlay: any) {
    updateGameData(lastPlay);
    updateScore(lastPlay.score_player1, lastPlay.score_player2);
    if (lastPlay.gameOver === true) {
      handleGameOver(lastPlay);
    } else {
      setCurrentTurn(lastPlay.turn);
    }
  }

  function updateGameData(lastPlay: any) {
    const edge: Edge = {
      x1: lastPlay.lastPlay.initialPoint.x,
      y1: lastPlay.lastPlay.initialPoint.y,
      x2: lastPlay.lastPlay.endPoint.x,
      y2: lastPlay.lastPlay.endPoint.y
    };
    const p1Id: number = lastPlay.player1Id;
    const lastTurn: number = lastPlay.lastTurn;
    let playColor: string = lastTurn === p1Id ? player1Color : player2Color;
    let newPlayData: PlayData = {
      color: playColor,
      move: edge
    }
    setGameData(gameData => [...gameData, newPlayData]);
  }

  function updateScore(scorep1: string, scorep2: string) {
    setPlayer1Score(scorep1);
    setPlayer2Score(scorep2);
  }

  function handleGameOver(lastPlay: any) {
    window.alert(lastPlay.message);
    window.location.reload();
  }


  // Connect to server by socket.io
  useEffect(() => {
    console.log('EFFECT - Connecting socket.io');
    connectSocket();
  }, []);

  // Fetch game setup and prepare canvas
  useEffect(() => {
    if (socketConnected) {
      console.log('EFFECT - Fetching game setup');
      fetchGameInfo();
      console.log('--- Fetching game setup executed');
    }
  }, [socketConnected]);


  // Bot call api when is its turn
  useEffect(() => {
    if (socketConnected && (Number(currentTurn) === 0)) {
      console.log('EFFECT - Sendbot play');
      sendBotPlay();
      console.log('--- Sendbot play executed');
    }
  }, [currentTurn]);


  /**
   * Normally in React you don’t need a ref to update something, 
   * but the canvas is not like other DOM elements. Most DOM elements 
   * have a property like value that you can update directly. 
   * The canvas works with a context (ctx in our app) that allows you 
   * to draw things. For that we have to use a ref, which is a 
   * reference to the actual canvas DOM element.
   * https://itnext.io/using-react-hooks-with-canvas-f188d6e416c0
   */
  console.log('Render()');
  return (
    <div>
      <header>
        <h1>Territory</h1>
      </header>
      <main className="main-container">
        <div className="waiting-room">
          <Waiting_Room
            line={waitingList}
          ></Waiting_Room>
        </div>

        <div className="game-room">
          {gridSize > 0 &&
            <Game_Board
              gridsize={gridSize}
              width="400"
              height="300"
              data={gameData}
              onClick={sendPlay}
            ></Game_Board>
          }
          <div className="score-container">
            <Score
              title="Player 1"
              className="player1-title"
              playerName={player1Name}
              playerScore={player1Score}
              // anything wrapped in " or ' would be sent as a string. 
              // If you want to keep the value type, such as an integer, 
              // float, boolean, object, etc, you would need to wrap it in {}
              blink={(currentTurn === player1Id)}
            ></Score>
            <Score
              title="Player 2"
              className="player2-title"
              playerName={player2Name}
              playerScore={player2Score}
              blink={(currentTurn !== player1Id)}
            ></Score>
          </div>
        </div>
      </main>
      <footer><h5>Fork freely from <a href="https://github.com/claudioantonio/territoryFrontend">github</a></h5></footer>
    </div>
  );
}

export default GameBoard;