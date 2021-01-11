import React, {useEffect, useRef, useState} from 'react';
import { useHistory, useParams } from 'react-router-dom';
import api from '../../service/api';
import socketIo from 'socket.io-client';

import Score from '../../component/Score/Score';

import './GameBoard.css';
import { render } from 'react-dom';
import { toEditorSettings } from 'typescript';

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

  const [socketConnected,setSocketConnected] = useState(false);
  const [setupFetched,setSetupFetched] = useState(false);
  const [boardReady,setBoardReady] = useState(false);

  const [player1Id,setPlayer1Id] = useState('-1');
  const [player1Name,setPlayer1Name] = useState('');
  const [player1Score,setPlayer1Score] = useState('0');
  const [player1turn,setPlayer1Turn] = useState(true);

  const [player2Name,setPlayer2Name] = useState('');
  const [player2Score,setPlayer2Score] = useState('0');

  const [lastPlay,setLastPlay] = useState(null);

  let gridSize:number = 1;
  const [gridColumns,setGridColumns] = useState<any[]>([]);
  const [gridRows,setGridRows] = useState<any[]>([]);
  const canvasRef = useRef(null);
  const player1Color = "#0077c2";
  const player2Color = "#790e8b";

  // Player Id for the current play
  const [currentTurn,setCurrentTurn] = useState(player1Id);
  const [myTurn,setMyTurn] = useState(false);

  /**
   * =============================================================
   * REST Stuff
   */
  function fetchGameInfo() {
    api
      .get("gameinfo")
      .then(response => {
        console.log('FetchGameInfo');

        gridSize=response.data.gridsize;
        setCurrentTurn(response.data.turn);
        setPlayer1Id(response.data.player1Id);
        setPlayer1Name(response.data.player1);
        setPlayer2Name(response.data.player2);

        setSetupFetched(true);

        prepareCanvas();
    })
  }

  function sendBotPlay() {
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
   * @param screenEdge Edge clicked by the player
   */
  function sendPlay(screenEdge:Edge|null) {
    if (screenEdge==null) return;
    const gridEdge = convertScreenToGrid(screenEdge);
    try {
      console.log('SENDPLAY - ' + myPlayerId + ' played');
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


  function createScreenFromGridPoint(p1:any,p2:any) {
    console.log(p1);
    console.log(p2);
    let {x:gridX1,y:gridY1} = p1;
    let {x:gridX2,y:gridY2} = p2;
    let gridEdge = {
      x1: gridX1,
      y1: gridY1,
      x2: gridX2,
      y2: gridY2
    };
    console.log(gridEdge);
    return convertGridToScreen(gridEdge);
  }

  function updateCanvasWithLastPlay(lastPlay:any) {
    //TODO Remover player1id da resposta
    //let player1Id:number = Number(lastPlay.player1Id);

    const screenEdge = createScreenFromGridPoint(
      lastPlay.lastPlay.initialPoint, 
      lastPlay.lastPlay.endPoint
    );

    let myTurn:boolean = Number(lastPlay.turn)===Number(myPlayerId)? true : false;
    let iAmPlayer1:boolean = (Number(myPlayerId)===Number(player1Id))? true : false;

    updateCanvas(myTurn, iAmPlayer1, screenEdge); 

    updateScore(lastPlay.score_player1,lastPlay.score_player2);

    //TODO Refactor for god sake!!!
    if (lastPlay.gameOver==true) {
      showGameOverMessage(lastPlay.message);
      //socket.disconnect();
      if (Number(lastPlay.whatsNext.winner.playerId)==Number(myPlayerId)) {
        if (lastPlay.whatsNext.winner.roomPass==='WaitingRoom') {
          history.push("/waitingRoom/" + myPlayerId);
        } else if (lastPlay.whatsNext.winner.roomPass==="GameRoom") {
          window.location.reload();
        } else {
          //console.log("Register: Invalid room pass =" + response.winner.roomPass);
        }
      } else {
        if (lastPlay.whatsNext.looser.roomPass==='WaitingRoom') {
          history.push("/waitingRoom/" + myPlayerId);
        } else if (lastPlay.whatsNext.looser.roomPass==="GameRoom") {
          window.location.reload();
        } else if (lastPlay.whatsNext.looser.roomPass==="RegisterRoom") {
          history.push("/");
        } else {
          //console.log("Register: Invalid room pass =" + response.looser.roomPass);
        }
      }
    } else {
      setCurrentTurn(lastPlay.turn);
    }
  }

  function updateCanvas(myTurn: boolean, iAmPlayer1: boolean, screenEdge: { x1: number; y1: number; x2: number; y2: number; }) {
    let playColor: string;
    if (myTurn) { // Received other player play message
      playColor = (iAmPlayer1) ? player2Color : player1Color;
    } else { // Received my own play message
      playColor = (iAmPlayer1) ? player1Color : player2Color;
    }
    drawEdge(getCanvasCtx(), screenEdge, playColor);
  }

  function connectSocket() {
    const socket = socketIo(API_URL);

    socket.on('connect', () => {
      console.log('CONNECT event arrived');
      setSocketConnected(true);
    });

    socket.on('gameUpdate', (response:any) => {
      console.log('GAMEUPDATE event arrived');
      setLastPlay(response);
    });

    // CLEAN UP THE EFFECT
    return () => socket.disconnect();
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
  const minX = 10;
  const minY = 10;
  const PADDING = 10;
  const maxX = canvasWidth-PADDING;
  const maxY = canvasHeight-PADDING;
  const boardWidth = canvasWidth-(2*PADDING);
  const boardHeight = canvasHeight-(2*PADDING);

  function getCanvasObj() {
    return canvasRef.current;
  }

  function getCanvasCtx() {
    const canvasObj:any = getCanvasObj();
    return canvasObj.getContext("2d");
  }

  function prepareCanvas() {
    const canvasCtx = getCanvasCtx();    
    drawGrid(canvasCtx);
    installMouseMoveListener();
    installMouseClickListener();

    setBoardReady(true);
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
      const x = e.clientX;
      const y = e.clientY;
      const pos = getPos(canvasObj,x,y);

      const columnItem = reachColumn(canvasObj, pos.x)
      if (columnItem!=null) {
        //console.log('Click - reach a column');
        sendPlay(findAdjacentYPoints(columnItem,pos.y));
        return;
      }

      const rowItem = reachRow(canvasObj, pos.y)
      if (rowItem!=null) {
        //console.log('Click - reach a row');
        sendPlay(findAdjacentXPoints(rowItem,pos.x));
        return;
      }
    },false);
  }

  function uninstallMouseClickListener() {
    const canvasObj:any = getCanvasObj();
    canvasObj.addEventListener('click', (e:MouseEvent) => {
      console.log('UNINSTALL MOUSECLICK LISTENER');
      return; // Do nothing
    });
  }

  function drawEdge(canvasCtx:any,edge:Edge, color: string) {
    canvasCtx.beginPath();
    canvasCtx.lineWidth = "4"; // TODO: Remover número mágico
    canvasCtx.strokeStyle = color;
    canvasCtx.moveTo(edge.x1,edge.y1);
    canvasCtx.lineTo(edge.x2,edge.y2);
    canvasCtx.stroke();
  }

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
    console.log('FINDSCREENCOLUMN');
    let screenX:number = -1;
    console.log('--- gridcolumns size=' + gridColumns.length);
    gridColumns.forEach((columnItem,index) => {
      console.log('--- testing gridX=' + gridX + ' columnItem=' + columnItem);
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
        //console.log(edge);
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
        //console.log(edge);
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

  /**
  * Draw a grid of points
  * @param ctx Canvas context
  */
  function drawGrid(ctx:any){
    const gridXSpace = boardWidth/(gridSize-1);
    const gridYSpace = boardHeight/(gridSize-1);
  
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


  // Connect to server by socket.io
  useEffect(() => {
    console.log('EFFECT - Connecting socket.io');
    connectSocket();
  },[]);

  // Fetch game setup and prepare canvas
  useEffect(() => {
    console.log('EFFECT - Fetching game setup');
    if (socketConnected) {
      fetchGameInfo();
      console.log('--- Fetching game setup executed');
    }
  },[socketConnected]);


  // Bot call api when is its turn
  useEffect(()=>{
    console.log('EFFECT - Sendbot play');
    console.log('boardReady=' + boardReady + ' currentTurn=' + currentTurn);
    console.log('convert=' + Number(''));
    if ((boardReady)&&(Number(currentTurn)===0)) {
      sendBotPlay();
      console.log('--- Sendbot play executed');
    }
  },[boardReady,currentTurn]);


  // Update canvas with last play
  useEffect(() => {
    console.log('EFFECT - canvas update for last play');
    if ((boardReady)&&(lastPlay!==null)) {
      updateCanvasWithLastPlay(lastPlay);
      console.log('--- Executed');
    }
  },[lastPlay]);


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
      {console.log('Render')}
      <header>
        <h1>Territory</h1>
      </header>
      <main className="main-container">
        <div>
          <p>Click between 2 adjacents points to play</p>
          <canvas 
            id="boardgame" 
            ref={canvasRef} 
            width={canvasWidth}
            height={canvasHeight}>
          </canvas>

          <div className="score-container">
            <Score
              title="Player 1"
              className="player1-title"
              playerName={player1Name}
              playerScore={player1Score}
              // anything wrapped in " or ' would be sent as a string. 
              // If you want to keep the value type, such as an integer, 
              // float, boolean, object, etc, you would need to wrap it in {}
              blink={(currentTurn===player1Id)} 
            ></Score>
            <Score
              title="Player 2"
              className="player2-title"
              playerName={player2Name}
              playerScore={player2Score}
              blink={(currentTurn!==player1Id)}
            ></Score>
          </div>
        </div>
      </main>
      <footer><h5>Fork freely from <a href="https://github.com/claudioantonio/territoryFrontend">github</a></h5></footer>
    </div>
  );
}

export default GameBoard;