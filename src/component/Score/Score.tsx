import React from 'react';

/**
 * Score properties
 */
interface ScoreProps {
    player1name:string;
    player1score:string;
    player2name:string;
    player2score:string;
}

/**
 * Score component
 * 
 * @param props Game info to show in Score
 */
const Score: React.FC<ScoreProps> = (props) => {
    return(
    <div className="score-container">
        <div className="player1-container">
            <h3 className="player1-title">Player 1</h3>
            <strong>{props.player1name}: {props.player1score}</strong>
        </div>
        <div className="player2-container">
            <h3 className="player2-title">Player 2</h3>
            <strong>{props.player2name}: {props.player2score}</strong>
        </div>
    </div>
    );
}

export default Score;