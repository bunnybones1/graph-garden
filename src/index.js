
var ViewManager = require('./ViewManager');
var InputManager = require('./InputManager');
var WorldManager = require('./WorldManager');
var EsprimaManager = require('./EsprimaManager');
var TreeBuilder = require('./TreeBuilder');
var TreeVisualizer = require('./TreeVisualizer');


function GraphGarden() {
	var _this = this;
	this.viewManager = new ViewManager(this);

	this.inputManager = new InputManager(this);

	this.worldManager = new WorldManager(this);

	this.esprimaManager = new EsprimaManager(this);

	this.treeBuilder = new TreeBuilder(this);

	this.treeVisualizer = new TreeVisualizer(this);

	this.esprimaManager.onTreeSignal.add(this.treeBuilder.buildTree);
	this.treeBuilder.onNodeSignal.add(this.treeVisualizer.addNode);
	this.treeBuilder.onCompleteSignal.add(function() {
		window.document.title = 'nodes: ' + _this.treeVisualizer.attempts + ' merging.';
		_this.treeVisualizer.merge();
		window.document.title = 'Graph Garden';
		var meshes = _this.treeVisualizer.rootMeshes;
		var scene = _this.viewManager.scene;
		console.warn('attempts', _this.treeVisualizer.attempts);
		console.warn('multiParented', _this.treeVisualizer.multiParented);
		console.warn('orphans', _this.treeVisualizer.orphans);
		for (var i = meshes.length - 1; i >= 0; i--) {
			scene.add(meshes[i]);
			meshes[i].scale.multiplyScalar(0.25);
			meshes[i].rotation.x = Math.PI * 0.5;
		}
	});

	// this.viewManager.scene.add(this.treeVisualizer.test(100));
}

module.exports = GraphGarden;