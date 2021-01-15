import React from 'react';
import {BrowserRouter,Route} from 'react-router-dom';

import Register from './page/Register/Register';
import GamePage from './page/Game/GamePage';

function Routes() {
    return (
        <BrowserRouter>
          <Route path="/" exact component={Register}></Route>
          <Route path="/gameBoard/:playerId" component={GamePage}></Route>
        </BrowserRouter>
    );
}

export default Routes;