/**
 * Using Ember.js as front end framework
 */
 
Methods = {};

Methods.mapDataToEmberClass = function(data,eClass) {
	return data.map(data, function(item) { return eClass(item); });
}

Methods.calcXandY = function(evt) {
	var offset = $('#graph-view').offset();
	var x = Math.round(evt.pageX - offset.left - 83);
	var y = Math.round(evt.pageY - offset.top - 31);
	return {x:x,y:y}
}

GraphWriterApp = Ember.Application.create();

GraphWriterApp.Graph = Ember.Object.extend({
	name: 'no name',
	nodes:[],
	edges:[],
	e_count: 0,
	n_count: 0,
	node_id: function() {
			var count = this.get('n_count');
			this.set('n_count', count + 1);
			return count;
	},
	edge_id: function() {
			var count = this.get('e_count');
			this.set('e_count', count + 1);
			return count;
	}
});

Ember.TextSupport.reopen({
  attributeBindings: ['node-id', 'edge-id']
})

GraphWriterApp.Node = Ember.Object.extend({
	id: 0,
	text: '',
	x: 0,
	y: 0,
	css: function() {
		var x = this.get('x');
		var y = this.get('y');
		return JEM.cssString({
			'z-index':1,
			position:'absolute',
			left:x +'px', 
			top:y + 'px'
		});
	}.property('x','y')
});

GraphWriterApp.Edge = Ember.Object.extend({
	id:0,
	text: '',
	thickness: 0,
	node1: null,
	node2: null,
	x1: Ember.computed.alias('node1.x'),
	y1: Ember.computed.alias('node1.y'),
	x2: Ember.computed.alias('node2.x'),
	y2: Ember.computed.alias('node2.y'),
	x: function() {
		return this.get('x2') - this.get('x1');
	}.property('x1','x2'),
	y: function() {
		return this.get('y2') - this.get('y1');
	}.property('y1','y2'),
	cx: function() {
		var x1 = this.get('x1');
		var x2 = this.get('x2');
		var magnitude = this.get('magnitude');
		return ((x1 + x2) / 2) - (magnitude / 2);
	}.property('x1','x2','magnitude'),
	cy: function() {
		var y1 = this.get('y1');
		var y2 = this.get('y2');
		var thickness = this.get('thickness');
		return ((y1 + y2) / 2) - (thickness / 2);
	}.property('y1','y2','thickness'),
	magnitude: function() {
		var x1 = this.get('x1');
		var y1 = this.get('y1');
		var x2 = this.get('x2');
		var y2 = this.get('y2');
		return JEM.magnitude((x2 - x1),(y2 - y1));
	}.property('x1','y1','x2','y2'),
	deg: function() {
		var x1 = this.get('x1');
		var y1 = this.get('y1');
		var x2 = this.get('x2');
		var y2 = this.get('y2');
		return Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);
	}.property('x1','x2','y1','y2'),
	css: function() {
		var cx = this.get('cx');
		var cy = this.get('cy');
		var magnitude = this.get('magnitude');
		var deg = this.get('deg');
		var thickness = this.get('thickness');
		return JEM.cssString({
			padding:'0px',
			margin:'0px',
			height:thickness+'px',
			'background-color':'black',
			'line-height':'1px',
			position:'absolute',
			left:cx+50+'px',
			top:cy+'px',
			width:magnitude+'px',
			'-moz-transform':'rotate('+deg+'deg)',
			'-o-transform':'rotate('+deg+'deg)',
			'-webkit-transform':'rotate('+deg+'deg)',
			'-ms-transform':'rotate('+deg+'deg)',
			'transform':'rotate('+deg+'deg)'
		});
	}.property('cx','cy','magnitude','deg','thickness'),
	tcss: function() {
		var x1 = this.get('x1');
		var y1 = this.get('y1');
		var x = this.get('x');
		var y = this.get('y');
		return JEM.cssString({
			position:'absolute',
			left:x1+(x/2)+'px',
			top:y1+(y/2)+'px'
		});
	}.property('x1','y1','x','y')
});

GraphWriterApp.Router.map(function() {
	this.resource('graph');
});

GraphWriterApp.GraphRoute = Ember.Route.extend({
	setupController: function(controller,model) {
		controller.set('model',model);
	},
	model: function() {
		return graph;
	}
});

GraphWriterApp.GraphController = Ember.ObjectController.extend({
	actions: {
		addNode: function(position) {
			var graph = this.get('model');
			position.id = graph.node_id();
			var node = GraphWriterApp.Node.create(position);
			this.get('nodes').pushObject(node);
		},
		addEdge: function(start_id,end_id) {
			var graph = this.get('model');
			var nodes = this.get('nodes');
			var edges = this.get('edges');
			var start_node = nodes.findBy('id',start_id);
			var end_node = nodes.findBy('id',end_id);
			var edge = GraphWriterApp.Edge.create({
				id: graph.edge_id(),
				node1:start_node,
				node2:end_node,
				thickness:3
			});
			edges.pushObject(edge);
		},
		deleteNode : function(id) {
			var nodes = this.get('nodes');
			var node = nodes.findBy('id',id);
			nodes.removeObject(node);
			var edges = this.get('edges');
			for (var i = 0; i < edges.length; i++) {
				var edge = edges[i];
				if (edge.node1.id == id) {
					edges.removeObject(edge);
				}
				if (edge.node2.id == id) {
					edges.removeObject(edge);
				}
			}
		},
		deleteEdge : function(id) {
			var edges = this.get('edges');
			var edge = edges.findBy('id',id);
			edges.removeObject(edge);
		}
	}
});

GraphWriterApp.GraphView = Ember.View.extend({
	drag: false,
	start_id: null,
	click: function(evt) {
		var node_id = evt.target.getAttribute('node-id');
		var edge_id = evt.target.getAttribute('edge-id');
		var tagname = evt.target.tagName;
		var method = evt.target.getAttribute('method');
		if (!node_id && !edge_id) {
			var point = Methods.calcXandY(evt);
			this.get('controller').send('addNode',point);
			this.set('start_id',null);
		} else if (tagname === 'BUTTON') {
			var id = parseInt(node_id);
			if (method === 'add-edge') {
				this.set('start_id',id);
			}
		} else if (node_id) {
			var end_id = parseInt(node_id);
			var start_id = this.get('start_id');
			var check_start = (start_id) || (start_id == 0);
			var check_end = (end_id) || (end_id == 0);
			if (end_id != start_id && (check_start && check_end)) {
				this.get('controller').send('addEdge',start_id,end_id);
				this.set('start_id',null);
			}
		}
	}
});

GraphWriterApp.NodeView = Ember.View.extend({
	drag: false,
	click: function(evt) {
		var tagname = evt.target.tagName;
		var method = evt.target.getAttribute("method");
		if (tagname === 'BUTTON') {
			var id = evt.target.getAttribute('node-id');
			id = parseInt(id);
			if (method === 'delete-node') {
				this.get('controller.controllers.graph').send('deleteNode',id);
			}
		}
	},
	mouseDown: function(evt) {
		this.set('drag',true);
	},
	mouseMove: function(evt) {
		if (!this.get('drag')) { return; }
		var id = this.get('model.id');
		var point = Methods.calcXandY(evt);
		this.get('controller').send('moveNode',point);
	},
	mouseUp: function(evt) {
		this.set('drag',false);
	}
});

GraphWriterApp.NodeController = Ember.ObjectController.extend({
	needs: ['graph'],
	actions: {
		moveNode: function(point) {
			this.set('model.x',point.x);
			this.set('model.y',point.y);
		}
	}
});

GraphWriterApp.EdgeView = Ember.View.extend({
	click: function(evt) {
		var tagname = evt.target.tagName;
		if (tagname === 'BUTTON') {
			var id = evt.target.getAttribute('edge-id');
			this.get('controller.controllers.graph').send('deleteEdge',parseInt(id));
		}
	}
});

GraphWriterApp.EdgeController = Ember.ObjectController.extend({
	needs: ['graph']
});



graph = GraphWriterApp.Graph.create();