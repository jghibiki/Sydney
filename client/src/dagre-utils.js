import * as dagre from "dagre";
import * as _ from "lodash";

const size = {
	width: 250,
	height: 120
};

export function distributeElements(model) {
	let clonedModel = _.cloneDeep(model);
	let nodes = distributeGraph(clonedModel);
	nodes.forEach(node => {
		let modelNode = clonedModel.nodes.find(item => item.id === node.id);
		modelNode.x = node.y;
		modelNode.y = node.x;
	});
	return clonedModel;
}

function distributeGraph(model) {
	let nodes = mapElements(model);
	let edges = mapEdges(model);
	let graph = new dagre.graphlib.Graph();
	graph.setGraph({});
	graph.setDefaultEdgeLabel(() => ({}));
	//add elements to dagre graph
	nodes.forEach(node => {
		graph.setNode(node.id, node.metadata);
	});
	edges.forEach(edge => {
		if (edge.from && edge.to) {
			graph.setEdge(edge.from, edge.to);
		}
	});
	//auto-distribute
	dagre.layout(graph);
	return graph.nodes().map(node => graph.node(node));
}

function mapElements(model) {
	// dagre compatible format
	return model.nodes.map(node => ({ id: node.id, metadata: { width: node.height+30, height: node.width+40, id: node.id } }));
}

function mapEdges(model) {
	// returns links which connects nodes
	// we check are there both from and to nodes in the model. Sometimes links can be detached
	return model.links
		.map(link => ({
			from: link.source,
			to: link.target
		}))
		.filter(
			item => model.nodes.find(node => node.id === item.from) && model.nodes.find(node => node.id === item.to)
		);
}
