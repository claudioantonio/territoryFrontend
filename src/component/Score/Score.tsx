import React from 'react';

import './Score.css';

/**
 * Score properties
 */
interface ScoreProps {
    title:string;
    className:string;
    playerName:string;
    playerScore:string;
    blink:boolean;
}

/**
 * Score component
 * 
 * @param props Game info to show in Score
 */
const Score: React.FC<ScoreProps> = (props) => {
    let scoreContainerClass;
    if (props.blink===true) {
        scoreContainerClass = "blinking-score-container";
    } else {
        scoreContainerClass = "normal-score-container";
    }
    
    return(
        <div className={scoreContainerClass}>
            <h3 className={props.className}>{props.title}</h3>
            <strong>{props.playerName}: {props.playerScore}</strong>
        </div>
    );
}

export default Score;