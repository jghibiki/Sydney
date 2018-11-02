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

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';


import { SimpleNodeModel } from "./SimpleNodeModel.js";
import SimpleNodeFactory from "./SimpleNodeFactory.js";
import { SimplePortFactory } from "./SimplePortFactory.js";
import { SimplePortModel } from "./SimplePortModel.js";

import { distributeElements } from "./dagre-utils.js";
import { socketConnect } from 'socket.io-react';


class Flow extends Component {

    constructor(props){
        super(props);

        document.body.style.backgroundColor = "#333"

        this.requestNotificationPermission();

        this.bit = false;

        this.state = {
            selected_env_name: null,
            env_names: null,
            graph_props: {
                allowLooseLinks: false,
                allowCanvasTranslation: true,
                allowCanvasZoom: true,
                maxNumberPointsPerLink: 0,
            },
            history: [],
            should_filter: true,
            parent_link: null
        }

        this.states = null;
        this.env_name = null;
        this.envs = null;
        this.env = null;
        this.pipeline = null;
        this.pipelines = null;
        this.root_hash = null;
        this.notification_rules = null;
        this.dont_update = false;

        this.initGraph();


        props.socket.on('send_pipelines', ((payload)=>{
            this.initGraph();
            this.updatePipeline(payload);
            this.renderPipeline();
        }).bind(this));
        props.socket.on('notify_state_change', this.processStateUpdate.bind(this));

        props.socket.on('notify_message', ((message) =>{
            var new_history = this.state.history.slice();
            new_history.splice(0, 0, JSON.parse(message));
            this.setState({
                history: new_history
            })
            this.forceUpdate();
        }).bind(this));
            

        props.socket.on("send_history", ((history) =>{
            this.setState({
                history: JSON.parse(history)
            });
        }).bind(this));

        setInterval(this.monitorHash.bind(this), 500);
    }

    getDistributedModel(engine, model) {
        const serialized = model.serializeDiagram();
        const distributedSerializedDiagram = distributeElements(serialized);

        //deserialize the model
        let deSerializedModel = new DiagramModel();
        deSerializedModel.deSerializeDiagram(distributedSerializedDiagram, engine);
        return deSerializedModel;
    }

    handleChangeEnv = event => {
        var new_env_name = event.target.value;
        this.setState({ selected_env_name: event.target.value });

        //store changes to current envs pipelines
        for(var i=0; i<this.envs.length; i++){
            if(this.envs[i].name === this.env.name){
                this.envs[i].pipelines = this.pipelines;
                break
            }
        }

        this.env = null;
        for(var env of this.envs){
            if(env.name == new_env_name){
                this.env = env;
                break;
            }
        }

        if(this.env === null) throw "Invalid environment name " + new_env_name + ".";
        
        this.pipelines = this.env.pipelines

        this.initGraph();
        this.renderPipeline();

    }

    dialogOpen = () => {
        this.setState({
            graph_props: {
                allowLooseLinks: false,
                allowCanvasTranslation: false,
                allowCanvasZoom: false,
                maxNumberPointsPerLink: 0,
            }
        });
    }

    dialogClose = () => {
        this.setState({
            graph_props: {
                allowLooseLinks: false,
                allowCanvasTranslation: true,
                allowCanvasZoom: true,
                maxNumberPointsPerLink: 0,
            }
        });
    }

    render() {
        return (
            <div style={{"background": "#4d4d4d",}} >
                <div style={{"textAlign": "center", "background": "#333333", "color": "#fff", "padding": "30px", "display": "flex" }}>
                    { this.state.parent_link && 
                        <Button href={this.state.parent_link} style={{"color": "#fff"}} color="primary" variant="contained">Back to Parent</Button>
                    }
                    <b style={{"margin":"auto"}}>
                    {this.pipeline !== null &&
                      this.pipeline.name }
                    </b>
                    <div> 
                        <Select  value={this.state.selected_env_name} onChange={this.handleChangeEnv} style={{"color": "#fff", "marginRight": "30px"}} displayEmpty>
                            { this.state.env_names === null &&
                                <MenuItem value="">None</MenuItem>
                            }
                            { this.state.env_names !== null &&
                                this.state.env_names.map( el => {
                                    return <MenuItem value={el}>{el}</MenuItem>
                                })
                            }
                            
                        </Select>
                        <Button onClick={this.zoomToFit} style={{"color": "#fff"}} color="primary" variant="contained">Zoom to Fit</Button>
                    </div>
                </div>


                <div style={{"display": "flex"}}>
                    <div style={{ "background": "#4A4A4A", "overflowY": "scroll", "height": "85vh", "min-width": "300px"}}>
                        <div style={{ "background": "#fff"}}>
                            <FormControlLabel control={
                                    <Checkbox checked={this.state.should_filter} onChange={this.handleChangeFilter} value="should_filter" />
                                }
                                label="Filter History"
                            />
                        </div> 
                        <div >
                            {this.filterHistory().map(el=>{
                                return (
                                    <div key={el.timestamp + el.environment + el.pipeline + el.step + el.state}>
                                        { el.type == "state_update" || el.type == undefined &&
                                            <div style={{
                                                "padding": "15px", 
                                                "borderLeft": "15px solid " + this.getStateColor(el.state), 
                                                "borderRight": "15px solid " + this.getStateColor(el.state), 
                                                "borderTop": "1px solid black", 
                                                "borderBottom": "1px solid black", 
                                                "background": "#757575",
                                                "wordWrap": "break-word", 
                                                "maxWidth": "300px",
                                            }}>
                                                <div style={{ "textAlign": "left"}}>
                                                    { this.state.should_filter &&
                                                        <b>
                                                            {el.step} &rarr; {el.state}
                                                        </b>
                                                    }
                                                    { !this.state.should_filter &&
                                                        <b>
                                                            {el.pipeline} : {el.step} &rarr; {el.state}
                                                        </b>
                                                    }
                                                </div>
                                                <br/>
                                                {(new Date(el.timestamp + "UTC")).toString().substring(0, 24)}
                                            </div>
                                        }
                                        { el.type == "message" &&
                                            <div style={{
                                                "padding": "15px", 
                                                "borderLeft": "15px solid white", 
                                                "borderRight": "15px solid white", 
                                                "borderTop": "1px solid black", 
                                                "borderBottom": "1px solid black", 
                                                "background": "#757575",
                                                "wordWrap": "break-word", 
                                                "maxWidth": "300px",
                                            }}>
                                                <div style={{ "textAlign": "left"}}>
                                                    { this.state.should_filter &&
                                                        <b>
                                                            {el.step}
                                                        </b>
                                                    }
                                                    { !this.state.should_filter &&
                                                        <b>
                                                            {el.pipeline} : {el.step}
                                                        </b>
                                                    }
                                                </div>
                                                <br/>
                                                <div dangerouslySetInnerHTML={{__html: el.message}}></div>
                                                <br/>
                                                <br/>
                                                {(new Date(el.timestamp + "UTC")).toString().substring(0, 24)}
                                            </div>
                                        }
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    <div style={{ "width": "90vw",  "background": "#4d4d4d", "textAlign": "initial" }} id="hidable">
                            <DiagramWidget className="srd-demo-canvas" diagramEngine={this.engine} {...this.state.graph_props} />
                    </div>
                </div>
            </div>
        );
    }

    initGraph(){
        //1) setup the diagram this.engine
        this.engine = new DiagramEngine();
        this.engine.installDefaultFactories();

        this.engine.registerPortFactory(new SimplePortFactory("simple_node", config => new SimplePortModel()));
        this.engine.registerNodeFactory(new SimpleNodeFactory());

        this.engine._dialogOpen = this.dialogOpen;
        this.engine._dialogClose = this.dialogClose;

        //2) setup the diagram model
        this.model = new DiagramModel();

        //5) load model into this.engine
        this.engine.setDiagramModel(this.model);

        this.model.setLocked(true);
    }

    updatePipeline(payload){
        let data= JSON.parse(payload)

        this.states = data.states;
        this.envs = data.environments

        if(this.env_name === null){
            this.env_name = data.environments[0].name
            this.env = this.envs[0]
        }

        var env_names = data.environments.map(el => el.name )
        this.setState({
            selected_env_name: this.state.selected_env_name || this.env_name,
            env_names: env_names,
        })

        this.pipelines = this.env.pipelines
        this.root_hash = data.root_hash
        this.notification_rules = data.notifications
    }

    processStateUpdate(payload){
        let data  = JSON.parse(payload);

        if(this.env.name === data.environment){
            if(this.hash === data.pipeline) {
                // Update in foreground
                for(var step of this.pipeline.steps){
                    if(step.name === data.step){
                        step.state = data.state;
                        step.exit_state = data.exit_state;
                        break;
                    }
                }

                for(var i=0; i<this.pipelines.length; i++){
                    if(this.pipelines[i].name == this.pipeline.name){
                        this.pipelines[i] = this.pipeline;
                    }
                }

                this.initGraph();
                this.renderPipeline();
                this.checkNotificationRules(data);
            }
            else{
                // Update in background
                this.dont_update = true;
                var i = null;
                for(var _i=0; _i<this.pipelines.length; _i++){
                    if(this.pipelines[_i].name == data.pipeline){
                        i = _i;
                        break;
                    }
                }

                if(i === null) return;

                for(var j=0; j<this.pipelines[i].steps.length; j++){
                    if (this.pipelines[i].steps[j].name === data.step){
                       this.pipelines[i].steps[j].state = data.state;
                       this.pipelines[i].steps[j].exit_state = data.exit_state;
                       break;
                    }

                }
            }
        }
        else {
            //current env is not updated env

            finished: { for(var i=0; i<this.envs.length; i++){
                if(this.envs[i].name !== data.environment) continue;

                for(var j=0; j<this.envs[i].pipelines.length; j++){
                    if(this.envs[i].pipelines[j].name !== data.pipeline) continue;

                    for(var k=0; k<this.envs[i].pipelines[j].steps.length; k++){
                        if(this.envs[i].pipelines[j].steps[k].name === data.step){
                            this.envs[i].pipelines[j].steps[k].state = data.state;
                            this.envs[i].pipelines[j].steps[k].exit_state = data.exit_state;
                            break finished;
                        }

                    }


                }
            } }

        }


        var new_history = this.state.history.slice();
        new_history.splice(0, 0, data);
        this.setState({
            history: new_history
        });
    }

    renderPipeline(){
        var model = this.engine.getDiagramModel();

        var hash = window.location.hash;
        if (hash === "") hash = this.root_hash;
        else hash = hash.substring(1,hash.length);
        if(hash === null) return;
        this.hash = hash;
        
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
        }

        model.addAll(...new_steps.map(e=>e.node),...new_links)

        this.engine.setDiagramModel(model);

        if(this.pipeline.parent !== null){
            this.setState({ "parent_link": this.pipeline.parent })
        }
        else{
            this.forceUpdate();
        }



        // fixes odd height and width issue

        setTimeout( (()=>{
            var el = document.getElementsByClassName("srd-diagram")[0];
            el.style.height = "100%"
            el.style.width = "100%"
        }).bind(this), 100);
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

    zoomToFit = () => {
        this.engine.zoomToFit();
    }

    monitorHash = () => {

        var atRootHash = this.hash === this.root_hash;
        var goToRootHash = window.location.hash === "";
        var goToOtherHash = "#" + this.hash !== window.location.hash;

        if( (!goToRootHash && goToOtherHash) || (!atRootHash && goToRootHash)){
            this.initGraph();
            this.renderPipeline();
        }
    }

    getStateColor = (state_name) => {
        for(var state of this.states){
            if(state.name === state_name){
                return state.color;
            }
        }
        return "#000";
    }

    filterHistory = () => {

        if (!this.state.should_filter) {
            
            var history = this.state.history.filter(el =>{
                return (
                    el.environment === this.env.name 
                );
            });

        }
        else {
            var history = this.state.history.filter(el =>{
                return (
                    el.environment === this.env.name &&
                    el.pipeline === this.pipeline.name
                );
            });
        }

        return history;
    }

    componentDidUpdate = () => {
        if (this.dont_update){
            this.dont_update = false;
            return
        }
        let distributedModel = this.getDistributedModel(this.engine, this.engine.getDiagramModel());
        distributedModel.setLocked(true);
        this.engine.setDiagramModel(distributedModel);

        if (this.bit){
            this.forceUpdate();
            var e = document.getElementById("hidable")
            if (e !== undefined) e.style.visibility="hidden"

            setTimeout(() => {
                this.zoomToFit()
                var e = document.getElementById("hidable")
                if (e !== undefined) e.style.visibility="visible"
            }, 200);

        }


        this.bit = !this.bit
    }

    handleChangeFilter = (event) => {
        this.setState({ should_filter: event.target.checked })
        this.dont_update = true;
        //this.initGraph();
        //this.renderPipeline();
    }

}

export default socketConnect(Flow);
