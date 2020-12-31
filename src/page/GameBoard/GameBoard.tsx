import React, {useEffect, useRef, useState} from 'react';
import { useHistory, useParams } from 'react-router-dom';
import api from '../../service/api';
import socketIo from 'socket.io-client';

import Score from '../../component/Score/Score';

import './GameBoard.css';

interface GameBoardParams {
  playerId: string;
}

interface Edge {
  x1:number;
  y1:number;
  x2:number;
  y2:number;
}

/**
 * GameBoard page
 * Presents the grid where players will interact
 */
function GameBoard() {
  let { playerId } = useParams<GameBoardParams>();
  const myPlayerId = playerId;

  const history = useHistory();

  const [player1Name,setPlayer1Name] = useState('');
  const [player1Score,setPlayer1Score] = useState('0');
  const [player2Name,setPlayer2Name] = useState('');
  const [player2Score,setPlayer2Score] = useState('0');

  const canvasRef = useRef(null);
  const player1Color = "#0077c2";
  const player2Color = "#790e8b";

  // Player Id for the current play
  let currentTurn:number;

  /**
   * =============================================================
   * REST Stuff
   */
  function fetchGameInfo() {
    api.get("gameinfo").then(response => {
      currentTurn = response.data.turn;
      console.log('GameInfo: current=' + currentTurn);
      if (isMyTurn()) {
        installMouseClickListener();
      } else {
        uninstallMouseClickListener();
      }
    
      setPlayer1Name(response.data.player1);
      setPlayer2Name(response.data.player2);
    })
  }

  /**
   * Send a play to the server game
   * @param screenEdge Edge clicked by the player
   */
  function sendPlay(screenEdge:Edge|null) {
    console.log('sendPlay - received null edge=' + (screenEdge==null));
    if (screenEdge==null) return;

    const gridEdge = convertScreenToGrid(screenEdge);
    console.log('sendPlay - gridEdge');
    console.log(gridEdge);
    try {
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
      console.log('Client connected');
    });

    socket.on('gameUpdate', (response:any) => {
      console.log(response);

      const canvasCtx:any = getCanvasCtx();

      let player1Id:number = Number(response.player1Id);

      let {x:gridX1,y:gridY1} = response.lastPlay.initialPoint;
      let {x:gridX2,y:gridY2} = response.lastPlay.endPoint;
      let gridEdge = {
        x1: gridX1,
        y1: gridY1,
        x2: gridX2,
        y2: gridY2
      };
      const screenEdge = convertGridToScreen(gridEdge);

      currentTurn = response.turn;
      if (isMyTurn()) {
        console.log('GAMEUPDATE - Its my turn to play');
        // Received other player play message
        if (Number(myPlayerId)===player1Id) {
          updateCanvas(canvasCtx, screenEdge, player2Color);
        } else {
          updateCanvas(canvasCtx, screenEdge, player1Color);
        }        
      } else {
        console.log('GAMEUPDATE - Its *NOT* my turn to play');
        // Received my own play message
        if (Number(myPlayerId)===player1Id) {
          updateCanvas(canvasCtx, screenEdge, player1Color);
        } else {
          updateCanvas(canvasCtx, screenEdge, player2Color);
        }
      }
      updateScore(response.score_player1,response.score_player2);

      //TODO Refactor!!!
      if (response.gameOver==true) {
        showGameOverMessage(response.message);
        if (Number(response.whatsNext.winner.playerId)==Number(myPlayerId)) {
          if (response.whatsNext.winner.roomPass==='WaitingRoom') {
            history.push("/waitingRoom/" + myPlayerId);
          } else if (response.whatsNext.winner.roomPass==="GameRoom") {
            window.location.reload();
          } else {
            console.log("Register: Invalid room pass =" + response.winner.roomPass);
          }
        } else {
          if (response.whatsNext.looser.roomPass==='WaitingRoom') {
            history.push("/waitingRoom/" + myPlayerId);
          } else if (response.whatsNext.looser.roomPass==="GameRoom") {
            history.push("/gameBoard/" + myPlayerId);
          } else {
            console.log("Register: Invalid room pass =" + response.looser.roomPass);
          }
        }
      }
    });

    // CLEAN UP THE EFFECT
    return () => socket.disconnect();
    //
  }
  /**
   * ==========================================================
   */

   /**
    * =========================================================
    *  Canvas Stuff
    */
  const canvasWidth = 400;
  const canvasHeight = 300;
  const gridSize = 6;
  const minX = 10;
  const minY = 10;
  const PADDING = 10;
  const maxX = canvasWidth-PADDING;
  const maxY = canvasHeight-PADDING;
  const boardWidth = canvasWidth-(2*PADDING);
  const boardHeight = canvasHeight-(2*PADDING);
  const gridXSpace = boardWidth/(gridSize-1);
  const gridYSpace = boardHeight/(gridSize-1);

  function getCanvasObj() {
    return canvasRef.current;
  }

  function getCanvasCtx() {
    const canvasObj:any = getCanvasObj();
    return canvasObj.getContext("2d");
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

  function installMouseMoveListener(){
    const canvasObj:any = getCanvasObj();
    canvasObj.addEventListener('mousemove', (e:MouseEvent) => {
      getPos(canvasObj,e.clientX,e.clientY);
    });
  }

  function installMouseClickListener() {
    const canvasObj:any = getCanvasObj();
    canvasObj.addEventListener('click', (e:MouseEvent) => {
      if (isMyTurn()===false) {
        window.alert('It´s not Your turn to play now. Please wait! ;-)');
        return;
      }
      const x = e.clientX;
      const y = e.clientY;
      const pos = getPos(canvasObj,x,y);

      const columnItem = reachColumn(canvasObj, pos.x)
      if (columnItem!=null) {
        console.log('Click - reach a column');
        sendPlay(findAdjacentYPoints(columnItem,pos.y));
        return;
      }

      const rowItem = reachRow(canvasObj, pos.y)
      if (rowItem!=null) {
        console.log('Click - reach a row');
        sendPlay(findAdjacentXPoints(rowItem,pos.x));
        return;
      }
    },false);
  }

  function uninstallMouseClickListener() {
    const canvasObj:any = getCanvasObj();
    canvasObj.addEventListener('click', (e:MouseEvent) => {
      return; // Do nothing
    });
  }

  function updateCanvas(canvasCtx:any,edge:Edge, color: string) {
    console.log('UPDATECANVAS');
    console.log(edge);
    canvasCtx.beginPath();
    canvasCtx.lineWidth = "4"; // TODO: Remover número mágico
    canvasCtx.strokeStyle = color;
    canvasCtx.moveTo(edge.x1,edge.y1);
    canvasCtx.lineTo(edge.x2,edge.y2);
    canvasCtx.stroke();
  }

  const gridColumns:any[] = [];
  const gridRows:any[] = [];
  const TOLERANCE:number = 0.001;

  function isEqual(n1:number,n2:number) {
    return (Math.abs(n1-n2)<TOLERANCE) ? true : false;
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

  function findGridRow(screenY:number) {
    let gridY:number = -1;
    gridRows.forEach((rowItem,index) => {
      if (Math.abs(rowItem.row - screenY)<PROXIMITY_TOLERANCE) {
        gridY=index;
        return;
      }
    });
    return gridY;
  }

  function findGridColumn(screenX:number) {
    let gridX:number = -1;
    gridColumns.forEach((columnItem,index) => {
      if (Math.abs(columnItem.column - screenX)<PROXIMITY_TOLERANCE) {
        gridX=index;
        return;
      }
    });
    return gridX;
  }

  function findScreenRow(gridY:number) {
    let screenY:number = -1;
    gridRows.forEach((rowItem,index) => {
      if (index===gridY) {
        screenY=rowItem.row;
        return;
      }
    });
    return screenY;    
  }

  function findScreenColumn(gridX:number) {
    let screenX:number = -1;
    gridColumns.forEach((columnItem,index) => {
      if (index===gridX) {
        screenX=columnItem.column;
        return;
      }
    });
    return screenX;    
  }

  function convertGridToScreen(gridEdge:Edge) {
    const screenX1:number = findScreenColumn(gridEdge.x1);
    const screenY1:number = findScreenRow(gridEdge.y1);
    const screenX2:number = findScreenColumn(gridEdge.x2);
    const screenY2:number = findScreenRow(gridEdge.y2);
    return {
      x1: screenX1,
      y1: screenY1,
      x2: screenX2,
      y2: screenY2
    };    
  }

  /**
   * Convert screen coordinates to grid coordinates to keep backend independent from frontend presentation decisions 
   */
  function convertScreenToGrid(screenEdge:Edge) {
    const gridX1:number = findGridColumn(screenEdge.x1);
    const gridY1:number = findGridRow(screenEdge.y1);
    const gridX2:number = findGridColumn(screenEdge.x2);
    const gridY2:number = findGridRow(screenEdge.y2);
    return {
      x1: gridX1,
      y1: gridY1,
      x2: gridX2,
      y2: gridY2
    };
  }


  function findAdjacentXPoints(gridInfo:any, x:number) {
    for (let i = 0; i < gridInfo.items.length; i++) {
      if (x < gridInfo.items[i]){
        let edge:Edge = {
          x1: gridInfo.items[i-1],
          y1: gridInfo.row,
          x2: gridInfo.items[i],
          y2: gridInfo.row,
        }
        console.log(edge);
        return edge; 
      }
    }
    return null;
  }

  function findAdjacentYPoints(gridInfo:any, y:number) {
    for (let i = 0; i < gridInfo.items.length; i++) {
      if (y < gridInfo.items[i]){
        let edge:Edge = {
          x1: gridInfo.column,
          y1: gridInfo.items[i-1],
          x2: gridInfo.column,
          y2: gridInfo.items[i],
        }
        console.log(edge);
        return edge; 
      }
    }
    return null;
  }


  const PROXIMITY_TOLERANCE = 5;

    /**
   * Check if click reached a horizontal edge and return this edge
   * 
   * @param canvasObj Canvas
   * @param y y position for the click
   */
  function reachRow(canvasObj:any, y:number) {
    for(let i=0; i<gridRows.length; i++) {
      const rowItem = gridRows[i];
      if (Math.abs(rowItem.row - y)<PROXIMITY_TOLERANCE) {
        return rowItem;
      }
    }
    return null;
  }

  /**
   * Check if click reached a vertical edge and return this edge
   * 
   * @param canvasObj Canvas
   * @param x x position for the click
   * @param y y position for the click
   */
  function reachColumn(canvasObj:any, x:number) {
    for(let i=0; i<gridColumns.length; i++) {
      let columnItem = gridColumns[i];
      if (Math.abs(columnItem.column - x)<PROXIMITY_TOLERANCE) {
        return columnItem;
      }
    }
    return null;
  }

  function showGameOverMessage(msg:string) {
    window.alert(msg);
  }

  function updateScore(scorep1:string,scorep2:string) {
      setPlayer1Score(scorep1);
      setPlayer2Score(scorep2);
  }

  function isMyTurn() {
    return (Number(currentTurn)===Number(myPlayerId))? true : false; 
  }

  /**
  * Draw a grid of points
  * @param ctx Canvas context
  */
  function drawGrid(ctx:any){
    for (let x = minX; Math.trunc(x) <= maxX; x=x+gridXSpace) {
      for (let y = minY; y <= maxY; y=y+gridYSpace) {
        storeGridInfo(x,y);
        ctx.beginPath();
        ctx.arc(x,y,5,0,2*Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.stroke();
      }
    } 
  }

  /**
   * Use the useEffect hook with an empty dependency array for 
   * loading your function when the component mounts.
   * If you don't pass any variable to the dependency array, 
   * it will only get called on the first render exactly like 
   * componentDidMount.
   */
  useEffect(() => {
    const canvasCtx = getCanvasCtx();
    connectSocket();
    fetchGameInfo();
    drawGrid(canvasCtx);
    installMouseMoveListener();
    installMouseClickListener();
  },[]);

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
      <header>
        <h1>Territory</h1>
      </header>
      <main className="main-container">
        <div>
          <canvas 
            id="boardgame" 
            ref={canvasRef} 
            width={canvasWidth}
            height={canvasHeight}>
          </canvas>

          <Score
            player1name={player1Name}
            player1score={player1Score}
            player2name={player2Name}
            player2score={player2Score}
          ></Score>
        </div>
      </main>
      <footer><h5>Fork freely from <a href="https://github.com/claudioantonio/territoryFrontend">github</a></h5></footer>
    </div>
  );
}

export default GameBoard;