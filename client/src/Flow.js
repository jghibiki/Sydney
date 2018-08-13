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
import { distributeElements } from "./dagre-utils.js";
import { socketConnect } from 'socket.io-react';


class Flow extends Component {

    constructor(props){
        super(props);

        this.state = {
        }

        this.steps = null;
        this.states = null;
        this.pipeline = null;

        this.initGraph();


        props.socket.on('send_pipelines', ((payload)=>{
            this.updatePipeline(payload);
            this.renderPipeline();
        }).bind(this));
        props.socket.on('notify_state_change', this.processStateUpdate.bind(this));
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
            <div style={{"height": "100vh", "display": "flex", "background": "#222", "text-align": "initial" }}>
                <DiagramWidget className="srd-demo-canvas" diagramEngine={this.engine} {...this.graph_props} />
            </div>
        );
    }

    initGraph(){
        //1) setup the diagram this.engine
        this.engine = new DiagramEngine();
        this.engine.installDefaultFactories();

        //2) setup the diagram model
        this.model = new DiagramModel();

        //5) load model into this.engine
        this.engine.setDiagramModel(this.model);

        this.model.setLocked(true);
        this.graph_props = {
            allowLooseLinks: false,
            allowCanvasTranslation: false,
            allowCanvasZoom: false,
            maxNumberPointsPerLink: 0,
        };
    }

    updatePipeline(payload){
        let pipelines = JSON.parse(payload.pipelines)

        this.steps = pipelines.steps;
        this.states = pipelines.states;
        this.pipeline = pipelines.pipeline
    }

    processStateUpdate(payload){
        let data  = JSON.parse(payload);

        for(var step of this.steps){
            if(step.name === data.step){
                step.state = data.state
                break;
            }
        }

        this.initGraph();
        this.renderPipeline();
    }

    renderPipeline(){
        var model = this.engine.getDiagramModel();

        var new_steps = []

        for(var i=0; i<this.steps.length; i++){
            let step = this.steps[i];

            var current_state = null

            for (var state of this.states){
                if (state.name === step.state){
                    current_state = state;
                    break
                }
            }

            let new_node = new DefaultNodeModel(step.name, current_state !== null ?current_state.color : "rgb(0,255,0)");
            new_node.setPosition(100*i, 50*i);
            let out_port = new_node.addOutPort("Out");
            let in_port = new_node.addInPort("In");

            new_steps.push({
                "name": step.name,
                "node": new_node,
                "in": in_port,
                "out": out_port,
            })
        }

        //Add links
        var new_links = []
        for(var segment of this.pipeline){

            // Get current step
            var current_step = null;
            for(var step of new_steps){
                if(step.name === segment.step){
                   current_step = step;
                    break;
                }
            }
            if(current_step === null) continue;

            for(var transition of segment.transitions){

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

}

export default socketConnect(Flow);
