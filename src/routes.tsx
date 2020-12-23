import React from 'react';
import {BrowserRouter,Route} from 'react-router-dom';

import Register from './page/Register/Register';
import GameBoard from './page/GameBoard/GameBoard';
import WaitingRoom from './page/WaitingRoom/WaitingRoom';

function Routes() {
    return (
        <BrowserRouter>
          <Route path="/" exact component={Register}></Route>
          <Route path="/waitingRoom/:playerId" component={WaitingRoom}></Route>
          <Route path="/gameBoard/:playerId" component={GameBoard}></Route>
        </BrowserRouter>
    );
}

export default Routes;