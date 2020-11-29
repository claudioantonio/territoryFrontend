import React, {useEffect, useRef, useState} from 'react';
import { useParams } from 'react-router-dom';
import { render } from 'react-dom';
import api from '../service/api';
import socketIo from 'socket.io-client';

import '../assets/styles/index.css';

interface GameBoardParams {
  myPlayerNumber: string;
}

/**
 * GameBoard page
 * Presents the grid where players will interact
 */
function GameBoard() {
  let { myPlayerNumber } = useParams<GameBoardParams>();
  const canvasRef = useRef(null);

  const [myPlayerName,setMyPlayerName] = useState('');
  const [otherPlayerName,setOtherPlayerName] = useState('');

  function fetchGameInfo() {
    const response = api.get("gameinfo").then(response => {
      if (Number(myPlayerNumber)==1) {
        setMyPlayerName(response.data.player1);
        setOtherPlayerName(response.data.player2);
      } else {
        setOtherPlayerName(response.data.player1);
        setMyPlayerName(response.data.player2);
      }
    })
  }
  

  //const socket = socketIo('ws://localhost:3333/');
  //socket.on('connect', () => {
  //  console.log('Client connected');
  //});

  function SendPlay() {
    //socket.emit('play', {user: user, play:play,});
  }

  function sendPlay(squareIdx:number,sideIdx:number) {
    api.post("selection", {
        'square': squareIdx,
        'side': sideIdx,
        'player': myPlayerNumber,
    }).then(response => {
      console.log(response.data);
    }).catch(()=>{
      alert("Error selecting a side");
    });

  }

  function getPlayerName(playerNumber:number) {
    console.log('test=' + (Number(myPlayerNumber)==playerNumber));
    let name = (Number(myPlayerNumber)==playerNumber)? myPlayerName : otherPlayerName;
    console.log(name);
    return name;
  }

  function drawGrid(ctx:any, width:number, height:number, gridSize:number){
    const PADDING = 10;
    const maxX = width-PADDING;
    const maxY = height-PADDING;
    const boardWidth = width-(2*PADDING);
    const boardHeight = height-(2*PADDING);
    const gridXSpace = boardWidth/(gridSize-1);
    const gridYSpace = boardHeight/(gridSize-1);

    for (let x = PADDING; x <= maxX; x=x+gridXSpace) {
      console.log('increment x=' + (x+gridXSpace) + ' boardWidth=' + maxX);
      for (let y = PADDING; y <= maxY; y=y+gridYSpace) {
        console.log('x=' + x + ' y=' + y);
        console.log('increment y=' + (x+gridYSpace) + ' boardHeight=' + maxY);
        ctx.beginPath();
        ctx.arc(x,y,1,0,2*Math.PI);
        ctx.stroke();
    }
  }
}


  useEffect(() => {
    const canvasObj:any = canvasRef.current;
    const canvasCtx = canvasObj.getContext("2d");
    drawGrid(canvasCtx,320,240,4);
  });

  
  fetchGameInfo();

  /**
   * Normally in React you don’t need a ref to update something, 
   * but the canvas is not like other DOM elements. Most DOM elements 
   * have a property like value that you can update directly. 
   * The canvas works with a context (ctx in our app) that allows you 
   * to draw things. For that we have to use a ref, which is a 
   * reference to the actual canvas DOM element.
   * https://itnext.io/using-react-hooks-with-canvas-f188d6e416c0
   */
  return (
    <div>
      <header>TESTE</header>
      <main>
        <div>
          <canvas id="boardgame" ref={canvasRef} width="320" height="240"></canvas>
        </div>
        <div>
          <strong>Player 1: {getPlayerName(1)}</strong>
          <strong>Player 2: {getPlayerName(2)}</strong>
        </div>
      </main>
      <footer>Fork freely from https://github.com/claudioantonio</footer>
    </div>
  );
}

export default GameBoard;