import React, {useState} from 'react';
import { useParams } from 'react-router-dom';
import { render } from 'react-dom';
import api from '../service/api';
import socketIo from 'socket.io-client';

import { Stage, Layer, Rect, Shape} from 'react-konva';

import '../assets/styles/index.css';

interface GameBoardParams {
  myPlayerNumber: string;
}

function GameBoard() {
  let { myPlayerNumber } = useParams<GameBoardParams>();


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

  function onMouseClick(e:any){
    const squareIdx = e.target.parent.attrs.id;
    const sideIdx = e.target.attrs.id;
    sendPlay(squareIdx,sideIdx);

    paintSquareSide(e);
  }

  function paintSquareSide(e:any) {
    e.target.attrs.fill='red';
    e.target.cache();
    e.target.getLayer().batchDraw();
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

  fetchGameInfo();

  return (
    <div>
      <header>TESTE</header>
      <main>
        <div>
          <Stage width={320} height={240}> 
            <Layer id="0">
            <Rect id="0" x={0} y={0} width={20} height={80} 
                  stroke="black" fill="white" 
                  onClick={onMouseClick}/>
            <Rect id="1" x={20} y={0} 
                  width={80} height={20} 
                  stroke="black" fill="white" 
                  onClick={onMouseClick}/>
            <Rect id="2" x={80} y={20} 
                  width={20} height={80} 
                  stroke="black" fill="white" 
                  onClick={onMouseClick}/>
            <Rect id="3" x={0} y={80} 
                  width={80} height={20} 
                  stroke="black" fill="white" 
                  onClick={onMouseClick}/>
            </Layer>
          </Stage>
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