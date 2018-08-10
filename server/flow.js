import React, { Component } from 'react';

class Flow extends Component {

    constructor(props){
        super(props);

        socket.on('message', msg => console.log(msg));
    }

    render() {
        return (
            <div className="Flow">
                <header className="Flow-header">
                    <h1 className="Flow-title">Welcome to React</h1>
                </header>
                <p className="Flow-intro">
                    To get started, edit <code>src/Flow.js</code> and save to reload.
                </p>
            </div>
        );
    }
}

export default Flow;
