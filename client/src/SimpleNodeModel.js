import React, { Component } from 'react';

import { NodeModel } from "storm-react-diagrams";
import { SimplePortModel } from "./SimplePortModel";
import * as _ from "lodash";

export class SimpleNodeModel extends NodeModel {
    constructor(name: string = "Untitled", color: string = "rgb(0,192,255)", exit_state: string = "", state, info = {}) {
		super("simple_node");
		this.name = name;
		this.color = color;
        this.exit_state = exit_state;
        this.info = info;
        this.state = state;
		this.addPort(new SimplePortModel("in"));
		this.addPort(new SimplePortModel("out"));
	}
	deSerialize(object, engine: DiagramEngine) {
		super.deSerialize(object, engine);
		this.name = object.name;
        this.exit_state = object.exit_state;
        this.info = JSON.parse(object.info);
        this.state = object.state;
		this.color = object.color;
        this.engine = engine;
	}

	serialize() {
		return _.merge(super.serialize(), {
			name: this.name,
            exit_state: this.exit_state,
            info: JSON.stringify(this.info),
            state: this.state,
			color: this.color,
		});
	}
}
