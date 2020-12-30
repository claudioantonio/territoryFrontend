import React, { FormEvent, useEffect, useState } from 'react';
import {useHistory} from 'react-router-dom';
import api from '../../service/api';
import socketIo from 'socket.io-client';


import './Register.css';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3333';


/**
 * Page to register a new player
 */
function Register() {
  const [user,setUser] = useState('Enter a nickname');
  const history = useHistory();

  function connectSocket() {
    const socket = socketIo(API_URL);
    socket.on('connect', () => {
        console.log('Register: Client connected');
    });

    // CLEAN UP THE EFFECT
    return () => socket.disconnect();
    //
}


  /**
   * Submit action handler
   * @param e Event
   */
  const handleSubmit = (e:FormEvent) => {
    e.preventDefault();

    if (isFormFieldValid()===false) return;

    api.post("register",{
      user,
    }).then(response => {
      const playerId = response.data.playerId;
      const roomPass = response.data.roomPass;
      if (roomPass==='WaitingRoom') {
        history.push("/waitingRoom/" + playerId);
      } else if (roomPass==="GameRoom") {
        history.push("/gameBoard/" + playerId);
      } else {
        console.log("Register: Invalid room pass =" + roomPass);
      }
    }).catch((e)=>{
      alert(e);
    });
  }

  /**
   * Check if a valid nickname was provided
   */
  function isFormFieldValid() { 
    return (user.length>0)? true : false;  
  }

  useEffect(() => {
    connectSocket();
  },[]); // Empty array to execute only one time

  /**
   * Page content
   */
  return (
    <div>
      <header>
        <h1>Territory</h1>
        <h3>An old school game</h3>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input
                name="user"
                placeholder="Enter a nickname"
                className="form__field"
                value={user} 
                onClick={(e) => {setUser("");}}
                onChange={(e) => {setUser(e.target.value);}}
              />
            <button type="submit">Play</button>
          </div>
        </form>
      </main>
      <footer>
        <p><a href="https://github.com/claudioantonio/territoryFrontend">About the game</a></p>
      </footer>
    </div>
  );
}

export default Register;