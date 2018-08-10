import React, { Component } from 'react';

import { SocketProvider } from 'socket.io-react';
import io from 'socket.io-client';

import Flow  from './Flow.js';
import './App.css';



class App extends Component {

    constructor(props){
        super(props);

        this.socket = io.connect("localhost:5000");
    }

    render() {
        return (
            <div className="App">
                <SocketProvider socket={this.socket}>
                    <Flow />
                </SocketProvider>
            </div>
        );
    }
}

export default App;
