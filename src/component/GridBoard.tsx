import React, { Component } from 'react';

/**
 * Futuramente co
 */
class GridBoard extends Component {

    render() {
        return (
            <div>
                <canvas ref="canvas" width="320" height="240"></canvas>
            </div>
        )
    }
}

export default GridBoard;