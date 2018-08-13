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
		return (
            <div  style={{ 
                background: this.props.node.color, 
                padding: "8px",
                "border-radius": "5px",
            }}>
                <div style={{visibility: "hidden", display:"inline-block"}}>
                    <PortWidget name="in" node={this.props.node}  />
                </div>
                <div style={{display:"inline-block"}}>
                    {this.props.node.name}
                </div>
                <div style={{visibility: "hidden", display:"inline-block"}}>
                    <PortWidget name="out" node={this.props.node}  />
                </div>
            </div>
		);
	}
}
