import React, { FormEvent, useState } from 'react';
import {useHistory} from 'react-router-dom';
import api from '../../service/api';
import './Register.css';


function Register() {
  const [user,setUser] = useState('Enter a nickname');
  const history = useHistory();

  /**
   * Submit action handler
   * @param e Event
   */
  const handleSubmit = (e:FormEvent) => {
    e.preventDefault();

    if (isFormFieldValid()==false) return;

    api.post("register",{
      user,
    }).then(response => {
      let playerNumber = response.data.playerNumber;
      history.push("/gameBoard/" + playerNumber);
    }).catch(()=>{
      alert("Type a name to play!");
    });
  }

  function isFormFieldValid() { 
    return (user.length>0)? true : false;  
  }

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