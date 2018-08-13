import { 
    AbstractNodeFactory,
    DiagramEngine,
    NodeModel
} from "storm-react-diagrams";
import React, { Component } from 'react';
import { SimpleNodeWidget } from "./SimpleNodeWidget.js";
import { SimpleNodeModel } from "./SimpleNodeModel.js";

class SimpleNodeFactory extends AbstractNodeFactory {
	constructor() {
		super("simple_node");
	}

    generateReactWidget(diagramEngine: DiagramEngine, node: NodeModel): JSX.Element {
		return <SimpleNodeWidget node={node} />;
	}

	getNewInstance() {
		return new SimpleNodeModel();
	}
}

export default SimpleNodeFactory
