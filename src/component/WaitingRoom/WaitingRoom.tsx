import React from 'react';
import { FileWatcherEventKind } from 'typescript';

function WaitingRoom() {

   // se tem jogo em andamento
   //     vai para Fila 
   // se não
   //     se fila vazia
   //         vai para fila e espera por adversário
   //     se fila tem apenas um jogador
   //         tira jogadores da fila 
   //         inicia partida
   //     se não 
   //         lança exceção     
   //     fim se 
   // fim se

    

    return(
        <div>
            <div className="inprogress-game-container">
                Waiting for player2...
            </div>
            <div className="nextplayers-container">
                <ol>
                    <li>Joel</li>
                    <li>Marco</li>
                </ol>
            </div>
        </div>
    );
}

export default WaitingRoom;