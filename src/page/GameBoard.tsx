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

  const canvasWidth = 400;
  const canvasHeight = 300;
  const gridSize = 4;
  const minX = 10;
  const minY = 10;
  const PADDING = 10;
  const maxX = canvasWidth-PADDING;
  const maxY = canvasHeight-PADDING;
  const boardWidth = canvasWidth-(2*PADDING);
  const boardHeight = canvasHeight-(2*PADDING);
  const gridXSpace = boardWidth/(gridSize-1);
  const gridYSpace = boardHeight/(gridSize-1);

  function hasReachedLineGrid(x:number,y:number) {
  }

  function getPos(canvasObj:any, x:number, y:number) {
    const rect = canvasObj.getBoundingClientRect();
    const posX = x - rect.left;
    const posY = y - rect.top;
    return ({
      x: posX,
      y: posY,
    });
  }

  function installMouseMoveListener(canvasObj:any){
    canvasObj.addEventListener('mousemove', (e:MouseEvent) => {
      const pos = getPos(canvasObj,e.clientX,e.clientY);
      console.log("x=" + pos.x + " y=" + pos.y);
    });
  }

  const gridColumns:any[] = [];

  function createColumnItem(x:number,y:number) {
    return {
      'column': x,
      'items': [y],
    }
  }

  function updateColumnItem(columnItem:any, y:number) {
    columnItem.items.push(y);
  }

  function storeGridColumns(x:number,y:number) {
    for (let i = 0; x < gridColumns.length; i++) {
      if (gridColumns[i].column == x) {
        updateColumnItem(gridColumns[i],y);
        return;
      }
    }

    gridColumns.push(createColumnItem(x,y));
  }

  function reachColumn(canvasObj:any, x:number,y:number) {
    gridColumns.forEach(columnItem => {
      const pos = getPos(canvasObj,x,y);
      const tolerance = 0.5;
      console.log("x=" + pos.x + " column=" + columnItem.column + " Diff=" + Math.abs(columnItem.column - pos.x));
      if (Math.abs(columnItem.column - pos.x)<tolerance) {
        console.log("COLUMN!!!!!!!!!!!!!!");
      }
    });
  }

  /**
   * Draw a grid of points
   * @param ctx Canvas context
   */
  function drawGrid(ctx:any){
    for (let x = PADDING; Math.trunc(x) <= maxX; x=x+gridXSpace) {
      console.log("x==" + x);
      console.log("nextx==" + (x+gridXSpace));
      for (let y = PADDING; y <= maxY; y=y+gridYSpace) {
        console.log("y==" + y);
        console.log("nexty==" + (y+gridYSpace));
        storeGridColumns(x,y);
        ctx.beginPath();
        ctx.arc(x,y,1,0,2*Math.PI);
        ctx.stroke();
      }
    }
  }

  function installMouseClickListener(canvasObj:any) {
    canvasObj.addEventListener('click', (e:MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      reachColumn(canvasObj, x,y);
      console.log(gridColumns);
    });
  }

  useEffect(() => {
    const canvasObj:any = canvasRef.current;
    const canvasCtx = canvasObj.getContext("2d");
    drawGrid(canvasCtx);
    installMouseMoveListener(canvasObj);
    installMouseClickListener(canvasObj);
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
          <strong>space</strong>
          <canvas 
            id="boardgame" 
            ref={canvasRef} 
            width={canvasWidth}
            height={canvasHeight}>
          </canvas>
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