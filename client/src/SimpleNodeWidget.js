import * as React from "react";
import { SimpleNodeModel } from "./SimpleNodeModel.js";
import { PortWidget } from "storm-react-diagrams";

export interface SimpleNodeWidgetProps {
	node: SimpleNodeModel;
	size?: number;
}

export interface SimpleNodeWidgetState {}

export class SimpleNodeWidget extends React.Component<SimpleNodeWidgetProps, SimpleNodeWidgetState> {
	static defaultProps: SimpleNodeWidgetProps = {
		size: 150,
		node: null
	};

	constructor(props: SimpleNodeWidgetProps) {
		super(props);
		this.state = {};
	}

	render() {
        var border_style = "";
        var border_color = "";
        var background_color = this.props.node.color;
        var exit_status = "";


        if(this.props.node.exit_state === "__FINISHED__"){
            border_style = "solid";
            border_color = "#fff";
            exit_status="✔";
        }
        else if(this.props.node.exit_state === "__QUIT__"){
            border_style = "solid";
            border_color = "#000";
            exit_status="✕";
        }
        else{
            border_style = "none";
            border_color = "#000";
            exit_status="";
        }

        console.log("");
        console.log("Exit state: " + this.props.node.exit_state);
        console.log("border style: " + border_style);

		return (
            <div  style={{ 
                background: background_color,
                padding: "8px",
                "borderRadius": "5px",
                "borderStyle": border_style,
                "borderColor": border_color,
            }}>
                <div style={{visibility: "hidden", display:"inline-block"}}>
                    <PortWidget name="in" node={this.props.node}  />
                </div>
                <div style={{display:"inline-block"}}>
                    {this.props.node.name}
                </div>
                <div style={{display:exit_status!=="" ? "inline-block": "none", padding: "5px"}}>
                    {exit_status}
                </div>
                <div style={{visibility: "hidden", display:"inline-block"}}>
                    <PortWidget name="out" node={this.props.node}  />
                </div>
            </div>
		);
	}
}
