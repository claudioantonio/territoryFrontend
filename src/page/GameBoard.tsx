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
  const gridRows:any[] = [];
  const TOLERANCE:number = 0.001;

  function isEqual(n1:number,n2:number) {
    return (Math.abs(n1 -n2)<TOLERANCE) ? true : false;
  }

  function createRowItem(x:number,y:number) {
    return {
      'row': y,
      'items': [x],
    }
  }

  function createColumnItem(x:number,y:number) {
    return {
      'column': x,
      'items': [y],
    }
  }

  function storeColumnInfo(x:number,y:number) {
    for (let i = 0; i < gridColumns.length; i++) {
      if (isEqual(gridColumns[i].column, x)) {
        gridColumns[i].items.push(y);
        return;
      }
    }
    gridColumns.push(createColumnItem(x,y));
  }

  function storeRowInfo(x:number,y:number) {
    for (let j = 0; j < gridRows.length; j++) {
      console.log("rowj=" + gridRows[j].row + " y=" + y + " equal=" + isEqual(gridRows[j].row,y));
      if (isEqual(gridRows[j].row,y)) {
        gridRows[j].items.push(x);
        return;
      }
    }
    gridRows.push(createRowItem(x,y));
  }

  function storeGridInfo(x:number,y:number) {
    storeColumnInfo(x,y);
    storeRowInfo(x,y);
  }

  function findAdjacentXPoints(gridInfo:any, x:number) {
    for (let i = 0; i < gridInfo.items.length; i++) {
      if (x < gridInfo.items[i]){
        let side = {
          x1: gridInfo.items[i-1],
          y1: gridInfo.row,
          x2: gridInfo.items[i],
          y2: gridInfo.row,
        }
        console.log(side);
        return side; 
      }
    }
    return null;
  }

  function findAdjacentYPoints(gridInfo:any, y:number) {
    for (let i = 0; i < gridInfo.items.length; i++) {
      if (y < gridInfo.items[i]){
        let side = {
          x1: gridInfo.column,
          y1: gridInfo.items[i-1],
          x2: gridInfo.column,
          y2: gridInfo.items[i],
        }
        console.log(side);
        return side; 
      }
    }
    return null;
  }

  function drawSide(canvasObj:any,side:any) {
    const canvasCtx = canvasObj.getContext("2d");
    canvasCtx.beginPath();
    canvasCtx.moveTo(side.x1,side.y1);
    canvasCtx.lineTo(side.x2,side.y2);
    canvasCtx.stroke();
  }

  function reachRow(canvasObj:any, x:number,y:number) {
    console.log(gridRows);
    gridRows.forEach(rowItem => {
      const pos = getPos(canvasObj,x,y);
      const tolerance = 2;
      console.log("y=" + pos.y + " column=" + rowItem.row + " Diff=" + Math.abs(rowItem.row - pos.y));
      if (Math.abs(rowItem.row - pos.y)<tolerance) {
        console.log("ROW");
        let side = findAdjacentXPoints(rowItem,pos.x);
        if (side!=null) {
          drawSide(canvasObj, side);
        }
      }
    });
  }

  function reachColumn(canvasObj:any, x:number,y:number) {
    console.log(gridColumns);
    gridColumns.forEach(columnItem => {
      const pos = getPos(canvasObj,x,y);
      const tolerance = 2;
      console.log("x=" + pos.x + " column=" + columnItem.column + " Diff=" + Math.abs(columnItem.column - pos.x));
      if (Math.abs(columnItem.column - pos.x)<tolerance) {
        console.log("Column");
        let side = findAdjacentYPoints(columnItem,pos.y);
        if (side!=null) {
          drawSide(canvasObj, side);
        }
      }
    });
  }

  /**
   * Draw a grid of points
   * @param ctx Canvas context
   */
  function drawGrid(ctx:any){
    for (let x = PADDING; Math.trunc(x) <= maxX; x=x+gridXSpace) {
      for (let y = PADDING; y <= maxY; y=y+gridYSpace) {
        storeGridInfo(x,y);
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
      reachRow(canvasObj,x,y);
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