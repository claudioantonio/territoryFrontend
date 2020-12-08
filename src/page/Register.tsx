import React, { FormEvent, useState } from 'react';
import {useHistory} from 'react-router-dom';
import api from '../service/api';
import '../assets/styles/index.css';


function Register() {
  const [user,setUser] = useState('');
  const history = useHistory();

  /**
   * Submit action handler
   * @param e Event
   */
  const handleSubmit = (e:FormEvent) => {
    e.preventDefault();

    api.post("register",{
      user,
    }).then(response => {
      let playerNumber = response.data.playerNumber;
      history.push("/gameBoard/" + playerNumber);
    }).catch(()=>{
      alert("Type a name to play!");
    });
  }

  /**
   * Page content
   */
  return (
    <div>
      <header>Territory - An old school game</header>
      <main>
        <form onSubmit={handleSubmit}>
          <p>Enter a nickname:</p>
           <input name="user" value={user} onChange={(e) => {setUser(e.target.value);}}/>
           <button type="submit">Play</button>
        </form>
      </main>
      <footer>
        <p><a href="https://github.com/claudioantonio/territoryFrontend">About the game</a></p>
      </footer>
    </div>
  );
}

export default Register;