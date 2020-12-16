import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import socketIo from 'socket.io-client';


import api from '../../service/api';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3333';

/**
 * Interface to define page params
 */
interface WaitingRoomParams {
    playerId: string;
}

/**
 * Page where players wait in a line until their turn to play
 */
function WaitingRoom() {
    let { playerId } = useParams<WaitingRoomParams>();
    const history = useHistory();

    let gameStatus:number;
    const [player1Name,setPlayer1Name] = useState('???');
    const [player2Name,setPlayer2Name] = useState('???');
    const [waitingList,setWaitingList] = useState([]);


    function connectSocket() {
        const socket = socketIo(API_URL);
        socket.on('connect', () => {
            console.log('WaitingRoom: Client connected');
        });

        socket.on('waitingRoomUpdate', (response:any) => {
            setWaitingList(response.waitingList);
        });

        socket.on('enterGameRoom', (response:any) => {
            const playerInvited:string = response.invitationForPlayer;
            if (playerId==playerInvited) {
                history.push("/gameBoard/" + playerId);
            }
        });

        // CLEAN UP THE EFFECT
        return () => socket.disconnect();
        //
    }

    function fetchWaitingInfo() {
        api.get("waitingroom").then(response => {
            gameStatus = Number(response.data.gameStatus);
            if ( (gameStatus==2) || (gameStatus==3) ) {
                setPlayer1Name(response.data.player1);
                setPlayer2Name(response.data.player2);
            }
            setWaitingList(response.data.waitingList);
        });
    }

    useEffect(() => {
        connectSocket();
        fetchWaitingInfo();
    },[]); // Empty array to execute only one time

    return(
        <div>
            <div className="inprogress-game-container">
                <h3>Current game:</h3>
                <p>{player1Name} X {player2Name}</p>
            </div>
            <div className="waitinglist-container">
                <h3>Waiting List:</h3>
                <ol>
                    {
                    waitingList.map((waitingPlayer: any, index:number) => {
                            return(<li key={index}>{waitingPlayer.name}</li>);
                        })
                    }
                </ol>
            </div>
        </div>
    );
}

export default WaitingRoom;