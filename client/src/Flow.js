import React, { Component } from 'react';
import {
	DiagramEngine,
	DiagramModel,
	DefaultNodeModel,
	LinkModel,
	DiagramWidget,
	DefaultLinkModel
} from "storm-react-diagrams";
import "storm-react-diagrams/dist/style.min.css";

import { SimpleNodeModel } from "./SimpleNodeModel.js";
import SimpleNodeFactory from "./SimpleNodeFactory.js";
import { SimplePortFactory } from "./SimplePortFactory.js";
import { SimplePortModel } from "./SimplePortModel.js";

import { distributeElements } from "./dagre-utils.js";
import { socketConnect } from 'socket.io-react';


class Flow extends Component {

    constructor(props){
        super(props);

        this.requestNotificationPermission();

        this.state = {
        }

        this.states = null;
        this.pipeline = null;
        this.pipelines = null;
        this.root_hash = null;
        this.notification_rules = null;

        this.initGraph();


        props.socket.on('send_pipelines', ((payload)=>{
            this.initGraph();
            this.updatePipeline(payload);
            this.renderPipeline();
        }).bind(this));
        props.socket.on('notify_state_change', this.processStateUpdate.bind(this));

        setInterval(this.monitorHash, 500);
    }

    getDistributedModel(engine, model) {
        const serialized = model.serializeDiagram();
        const distributedSerializedDiagram = distributeElements(serialized);

        //deserialize the model
        let deSerializedModel = new DiagramModel();
        deSerializedModel.deSerializeDiagram(distributedSerializedDiagram, engine);
        return deSerializedModel;
    }

    render() {
        return (
            <div style={{"height": "100vh", "display": "flex", "background": "#4d4d4d", "textAlign": "initial" }}>
                <DiagramWidget className="srd-demo-canvas" diagramEngine={this.engine} {...this.graph_props} />
            </div>
        );
    }

    initGraph(){
        //1) setup the diagram this.engine
        this.engine = new DiagramEngine();
        this.engine.installDefaultFactories();

        this.engine.registerPortFactory(new SimplePortFactory("simple_node", config => new SimplePortModel()));
        this.engine.registerNodeFactory(new SimpleNodeFactory());

        //2) setup the diagram model
        this.model = new DiagramModel();

        //5) load model into this.engine
        this.engine.setDiagramModel(this.model);

        this.model.setLocked(true);
        this.graph_props = {
            allowLooseLinks: false,
            allowCanvasTranslation: true,
            allowCanvasZoom: true,
            maxNumberPointsPerLink: 0,
        };
    }

    updatePipeline(payload){
        let data= JSON.parse(payload)

        this.states = data.states;
        this.pipelines = data.pipelines
        this.root_hash = data.root_hash
        this.notification_rules = data.notifications
    }

    processStateUpdate(payload){
        let data  = JSON.parse(payload);


        for(var step of this.pipeline.steps){
            if(step.name === data.step){
                step.state = data.state;
                step.exit_state = data.exit_state;
                break;
            }
        }

        this.initGraph();
        this.renderPipeline();
        this.checkNotificationRules(data);
    }

    renderPipeline(){
        var model = this.engine.getDiagramModel();

        var hash = window.location.hash;
        if (hash === "") hash = this.root_hash;
        else hash = hash.substring(1,hash.length);
        if(hash === null) return;
        
        for(var pipeline of this.pipelines){
            if(pipeline.name === hash){
                this.pipeline = pipeline;
                break
            }
        }

        if(this.pipeline === null) alert("Invalid hash: \"" + hash + "\"");

        var new_steps = []

        for(var i=0; i<this.pipeline.steps.length; i++){
            let step = this.pipeline.steps[i];

            var current_state = null

            for (var state of this.states){
                if (state.name === step.state){
                    current_state = state;
                    break
                }
            }

            let new_node = new SimpleNodeModel(
                step.name, 
                current_state !== null ?current_state.color : "rgb(0,255,0)", 
                step.exit_state,
                step.state,
                step.info
            )
            new_node.setPosition(100*i, 50*i);
            let out_port = new_node.getPort("out");
            let in_port = new_node.getPort("in");

            new_steps.push({
                "name": step.name,
                "node": new_node,
                "in": in_port,
                "out": out_port,
            })
        }

        //Add links
        var new_links = []
        for(var edge of this.pipeline.edges){

            // Get current step
            var current_step = null;
            for(var step of new_steps){
                if(step.name === edge.step){
                   current_step = step;
                    break;
                }
            }
            if(current_step === null) continue;

            for(var transition of edge.transitions){

                // get node to transition to
                var transition_to = null;
                for(var step of new_steps){
                    if(step.name == transition.go_to){
                        transition_to = step;
                        break
                    }
                }
                if(transition_to === null) continue;

                //create link
                let new_link = current_step.out.link(transition_to.in);
                new_link.addLabel(transition.state);

                new_links.push(new_link)
            }

            model.addAll(...new_steps.map(e=>e.node),...new_links)
            let distributedModel = this.getDistributedModel(this.engine, model);
            distributedModel.setLocked(true);
            this.engine.setDiagramModel(distributedModel);


        }

        this.forceUpdate();
    }

    checkNotificationRules(new_state){
        for(var notification of this.notification_rules){
            let step_re = new RegExp(notification.step);
            let state_re = new RegExp(notification.state);

            if(step_re.exec(new_state.step) === null) continue;
            if(state_re.exec(new_state.state) === null) continue;
            
            this.showNotification(new_state.step + " is now in " + new_state.state + " state.");
        }
    }

    requestNotificationPermission(){
        if(!("Notification" in window)) return;

        if(Notification.permission == "denied") return;
        else{
            Notification.requestPermission();
        }
    }


    showNotification(message){
        if(!("Notification" in window)) return;

        if(Notification.permission == "denied") return;
        else if(Notification.permission == "granted"){
            new Notification(message);
        }
        else{
            Notification.requestPermission(() => this.showNotification(message));
        }


    }

    monitorHash = () => {

        if( "#" + this.hash !== window.location.hash){
            this.initGraph();
            this.renderPipeline();
        }
    }

}

export default socketConnect(Flow);
