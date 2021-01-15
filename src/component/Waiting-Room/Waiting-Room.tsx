import React, { useEffect, useState } from "react";
import api from "../../service/api";

import './Waiting-Room.css';

interface WaitingRoomProps {
    line: any[];
}


const Waiting_Room: React.FC<WaitingRoomProps> = (props) => {
    const waitingList = props.line;

    function renderWaitingList() {
        const items = waitingList.map((waitingPlayer: any, index: number) => {
            return (<li key={index}>{waitingPlayer.name}</li>);
        })
        return items;
    }

    return (
        <div className="waitinglist-container">
            <h3>Waiting List</h3>
            <ol>
                {renderWaitingList()}
            </ol>
        </div>
    );
}
export default Waiting_Room;