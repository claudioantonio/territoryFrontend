import React, { useEffect, useRef, useState } from 'react';
import Edge from '../../logic/Edge';
import PlayData from '../../logic/PlayData';

import './GameBoard.css';

interface GameBoardProps {
  gridsize: number;
  width: string;
  height: string;
  data: PlayData[];
  onClick(gridEdge: any | null): any;
};


/**
 * Component to render the game board and allow user interaction
 * @param props see GameBoardProps interface definition
 */
const Game_Board: React.FC<GameBoardProps> = (props) => {
  const canvasRef = useRef(null);

  const gridSize: number = props.gridsize;
  const canvasWidth: number = Number(props.width);
  const canvasHeight: number = Number(props.height);
  const data: PlayData[] = props.data;
  const onClick = props.onClick;

  console.log('Rendering GameBoard with data=');
  console.log(data);

  const PADDING = 10;
  const maxX = canvasWidth - PADDING;
  const maxY = canvasHeight - PADDING;
  const boardWidth = canvasWidth - (2 * PADDING);
  const boardHeight = canvasHeight - (2 * PADDING);
  const minX = 10;
  const minY = 10;

  const [gridColumns, setGridColumns] = useState<any[]>([]);
  const [gridRows, setGridRows] = useState<any[]>([]);


  function getCanvasObj() {
    return canvasRef.current;
  }

  function getCanvasCtx() {
    const canvasObj: any = getCanvasObj();
    return canvasObj.getContext("2d");
  }

  function getPos(canvasObj: any, x: number, y: number) {
    const rect = canvasObj.getBoundingClientRect();
    const posX = x - rect.left;
    const posY = y - rect.top;
    return ({
      x: posX,
      y: posY,
    });
  }

  function installMouseMoveListener() {
    const canvasObj: any = getCanvasObj();
    canvasObj.addEventListener('mousemove', (e: MouseEvent) => {
      getPos(canvasObj, e.clientX, e.clientY);
    });
  }

  function installMouseClickListener() {
    const canvasObj: any = getCanvasObj();
    canvasObj.addEventListener('click', (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const pos = getPos(canvasObj, x, y);

      const columnItem = reachColumn(pos.x)
      if (columnItem != null) {
        let screenEdge=findAdjacentYPoints(columnItem, pos.y);
        if (screenEdge!=null) onClick(convertScreenToGrid(screenEdge));
        return;
      }

      const rowItem = reachRow(pos.y)
      if (rowItem != null) {
        let screenEdge=findAdjacentXPoints(rowItem, pos.x)
        if (screenEdge!=null) onClick(convertScreenToGrid(screenEdge));
        return;
      }
    }, false);
  }

  function drawEdge(canvasCtx: any, edge: Edge, color: string) {
    canvasCtx.beginPath();
    canvasCtx.lineWidth = "4"; // TODO: Remover número mágico
    canvasCtx.strokeStyle = color;
    canvasCtx.moveTo(edge.x1, edge.y1);
    canvasCtx.lineTo(edge.x2, edge.y2);
    canvasCtx.stroke();
  }

  const TOLERANCE: number = 0.001;

  function isEqual(n1: number, n2: number) {
    return (Math.abs(n1 - n2) < TOLERANCE) ? true : false;
  }

  function createRowItem(x: number, y: number) {
    return {
      'row': y,
      'items': [x],
    }
  }

  function createColumnItem(x: number, y: number) {
    return {
      'column': x,
      'items': [y],
    }
  }

  function storeColumnInfo(x: number, y: number) {
    for (let i = 0; i < gridColumns.length; i++) {
      if (isEqual(gridColumns[i].column, x)) {
        gridColumns[i].items.push(y);
        return;
      }
    }
    gridColumns.push(createColumnItem(x, y));
  }

  function storeRowInfo(x: number, y: number) {
    for (let j = 0; j < gridRows.length; j++) {
      if (isEqual(gridRows[j].row, y)) {
        gridRows[j].items.push(x);
        return;
      }
    }
    gridRows.push(createRowItem(x, y));
  }

  function storeGridInfo(x: number, y: number) {
    storeColumnInfo(x, y);
    storeRowInfo(x, y);
  }

  function findGridRow(screenY: number) {
    let gridY: number = -1;
    gridRows.forEach((rowItem, index) => {
      if (Math.abs(rowItem.row - screenY) < PROXIMITY_TOLERANCE) {
        gridY = index;
        return;
      }
    });
    return gridY;
  }

  function findGridColumn(screenX: number) {
    let gridX: number = -1;
    gridColumns.forEach((columnItem, index) => {
      if (Math.abs(columnItem.column - screenX) < PROXIMITY_TOLERANCE) {
        gridX = index;
        return;
      }
    });
    return gridX;
  }

  function findScreenRow(gridY: number) {
    let screenY: number = -1;
    gridRows.forEach((rowItem, index) => {
      if (index === gridY) {
        screenY = rowItem.row;
        return;
      }
    });
    return screenY;
  }

  function findScreenColumn(gridX: number) {
    console.log('FINDSCREENCOLUMN');
    let screenX: number = -1;
    console.log('--- gridcolumns size=' + gridColumns.length);
    gridColumns.forEach((columnItem, index) => {
      console.log('--- testing gridX=' + gridX + ' columnItem=' + columnItem);
      if (index === gridX) {
        screenX = columnItem.column;
        return;
      }
    });
    return screenX;
  }

  function convertGridToScreen(gridEdge: Edge) {
    const screenX1: number = findScreenColumn(gridEdge.x1);
    const screenY1: number = findScreenRow(gridEdge.y1);
    const screenX2: number = findScreenColumn(gridEdge.x2);
    const screenY2: number = findScreenRow(gridEdge.y2);
    return {
      x1: screenX1,
      y1: screenY1,
      x2: screenX2,
      y2: screenY2
    };
  }

  /**
   * Convert screen coordinates to grid coordinates to keep backend independent from frontend presentation decisions 
   */
  function convertScreenToGrid(screenEdge: Edge) {
    const gridX1: number = findGridColumn(screenEdge.x1);
    const gridY1: number = findGridRow(screenEdge.y1);
    const gridX2: number = findGridColumn(screenEdge.x2);
    const gridY2: number = findGridRow(screenEdge.y2);
    return {
      x1: gridX1,
      y1: gridY1,
      x2: gridX2,
      y2: gridY2
    };
  }


  function findAdjacentXPoints(gridInfo: any, x: number) {
    for (let i = 0; i < gridInfo.items.length; i++) {
      if (x < gridInfo.items[i]) {
        let edge: Edge = {
          x1: gridInfo.items[i - 1],
          y1: gridInfo.row,
          x2: gridInfo.items[i],
          y2: gridInfo.row,
        }
        //console.log(edge);
        return edge;
      }
    }
    return null;
  }

  function findAdjacentYPoints(gridInfo: any, y: number) {
    for (let i = 0; i < gridInfo.items.length; i++) {
      if (y < gridInfo.items[i]) {
        let edge: Edge = {
          x1: gridInfo.column,
          y1: gridInfo.items[i - 1],
          x2: gridInfo.column,
          y2: gridInfo.items[i],
        }
        //console.log(edge);
        return edge;
      }
    }
    return null;
  }


  const PROXIMITY_TOLERANCE = 5;

  /**
 * Check if click reached a horizontal edge and return this edge
 * 
 * @param y y position for the click
 */
  function reachRow(y: number) {
    for (let i = 0; i < gridRows.length; i++) {
      const rowItem = gridRows[i];
      if (Math.abs(rowItem.row - y) < PROXIMITY_TOLERANCE) {
        return rowItem;
      }
    }
    return null;
  }

  /**
   * Check if click reached a vertical edge and return this edge
   * 
   * @param x x position for the click
   */
  function reachColumn(x: number) {
    for (let i = 0; i < gridColumns.length; i++) {
      let columnItem = gridColumns[i];
      if (Math.abs(columnItem.column - x) < PROXIMITY_TOLERANCE) {
        return columnItem;
      }
    }
    return null;
  }

  /**
* Draw a grid of points
* @param ctx Canvas context
*/
  function drawGrid(ctx: any) {
    const gridXSpace = boardWidth / (gridSize - 1);
    const gridYSpace = boardHeight / (gridSize - 1);

    for (let x = minX; Math.trunc(x) <= maxX; x = x + gridXSpace) {
      for (let y = minY; y <= maxY; y = y + gridYSpace) {
        storeGridInfo(x, y);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function drawMoves(ctx: any) {
    data.forEach((playData: PlayData) => {
      let screenEdge: Edge = convertGridToScreen(playData.move);
      drawEdge(ctx, screenEdge, playData.color);
    });
  }

  useEffect(() => {
    if (gridSize===0) return;
    console.log('EFFECT - Draw grid and install listeners')
    const canvasCtx = getCanvasCtx();
    drawGrid(canvasCtx);
    installMouseMoveListener();
    installMouseClickListener();
  }, [gridSize]);

  useEffect(() => {
    console.log('EFFECT - Draw moves');
    const canvasCtx = getCanvasCtx();
    drawMoves(canvasCtx);
  }, [data]);


  return (
    <div className="board-container">
      <div className="move-instruction">Click between 2 adjacents points to play</div>
      <canvas
        id="boardgame"
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}>
      </canvas>
    </div>
  );
};

export default Game_Board;