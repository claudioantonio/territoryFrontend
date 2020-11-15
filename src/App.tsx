import React, {useState} from 'react';
import { render } from 'react-dom';
import socketIo from 'socket.io-client';

import { Stage, Layer, Rect, Shape} from 'react-konva';

import './assets/styles/index.css';


function App() {
  const [user,setUser] = useState('');
  const [play,setPlay] = useState('');


  //const socket = socketIo('ws://localhost:3333/');
  //socket.on('connect', () => {
  //  console.log('Client connected');
  //});


  function SendPlay() {
    //socket.emit('play', {user: user, play:play,});
  }

  function onMouseClick(e:any){
    e.target.attrs.fill='red';
    e.target.cache();
    e.target.getLayer().batchDraw();
  }


  return (
    <div> <center>
      <Stage width={640} height={480}  red={100} green={100} blue={100}> 
        <Layer>
        <Rect x={0} y={0} width={20} height={80} 
              stroke="black" fill="white" 
              onClick={onMouseClick}/>
        <Rect x={20} y={0} 
              width={80} height={20} 
              stroke="black" fill="white" 
              onClick={onMouseClick}/>
        <Rect x={80} y={20} 
              width={20} height={80} 
              stroke="black" fill="white" 
              onClick={onMouseClick}/>
        <Rect x={0} y={80} 
              width={80} height={20} 
              stroke="black" fill="white" 
              onClick={onMouseClick}/>
        </Layer>
      </Stage>
      </center>
    </div>
  );
}

export default App;