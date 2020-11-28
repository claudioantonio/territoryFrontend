import React from 'react';
import {BrowserRouter,Route} from 'react-router-dom';

import Register from './page/Register';
import GameBoard from './page/GameBoard';

function Routes() {
    return (
        <BrowserRouter>
          <Route path="/" exact component={Register}></Route>
          <Route path="/gameBoard/:myPlayerNumber/:myPlayerName" component={GameBoard}></Route>
        </BrowserRouter>
    );
}

export default Routes;