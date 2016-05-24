var __geometry;
var pointOnSphere = require('utils/math/point-on-sphere-fibonacci');
var SphereGeometry = require('geometry/SphereSimplicialFibonacci');
function __getGeometry() {
	if(!__geometry) {
		__geometry = new SphereGeometry(0.5, 100, true);
	}
	return __geometry;
}
var __types = [];
var __materials = [];
function __getMaterial(type) {
	if(__types.indexOf(type) === -1) {
		__types.push(type);
	}
	var depth = __types.indexOf(type);
	if(!__materials[depth]) {
		var color = new THREE.Color();
		color.setHSL((depth/24)%1, 1, 0.75);
		__materials[depth] = new THREE.MeshPhongMaterial({
			// wireframe: true,
			morphTargets: true,
			color: color,
			side: THREE.BackSide
			// depthTest: false,
			// depthWrite: false,
			// transparent: true
		});
	}
	return __materials[depth];
}

function TreeVisualizer(app) {
	this.app = app;
	this.registered = [];
	this.meshes = [];
	this.rootMeshes = [];
	this.multiParented = 0;
	this.attempts = 0;
	this.orphans = 0;
	this.addNode = this.addNode.bind(this);
}

var temp = 0;
TreeVisualizer.prototype.addNode = function(node, parentNode){
	this.attempts++;
	if(this.registered.indexOf(node) !== -1) {
		this.multiParented++;
		return;
	} else {
		this.registered.push(node);
	}
	var depth;
	var parentIndex = this.registered.indexOf(parentNode);
	var parentMesh = this.meshes[parentIndex];
	if(parentMesh) {
		depth = parentMesh.depth + 1;
	} else {
		depth = 0;
	}
	var mesh = new THREE.Mesh(__getGeometry(), __getMaterial(node.type));
	mesh.id2 = temp++;
	mesh.morphTargetInfluences[0] = 0;
	var attachPoint = new THREE.Object3D();
	attachPoint.position.y = 1;
	mesh.add(attachPoint);
	mesh.attachPoint = attachPoint;
	mesh.depth = depth;
	this.meshes.push(mesh);
	mesh.scale.multiplyScalar(0.8);
	if(parentMesh) {
		var parentAttach = parentMesh.attachPoint;
		parentAttach.add(mesh);
		var siblings = parentAttach.children;
		siblings.forEach(function(child, i) {
			var longLat = pointOnSphere(i, siblings.length*6);
			child.rotation.y = longLat[0];
			child.rotation.z = longLat[1] + Math.PI * 0.5;
		});
		if(siblings.length > 1) {
			parentAttach.rotation.y = Math.PI * 0.5;
		}
		var scaleAdjust = Math.sqrt(siblings.length) / 5 * 20;
		siblings.forEach(function(child, i) {
			child.scale.y = scaleAdjust * 0.8;
			if(child.id2 <= 10) {
				console.log(child.id2, child.scale.y, 1/scaleAdjust);
			}
			child.attachPoint.scale.y = 1/scaleAdjust;
			child.morphTargetInfluences[0] = 1 - 1 / scaleAdjust;
		});

	} else {
		this.rootMeshes.push(mesh);
		mesh.depth = 0;
		this.orphans++;
	}
};

TreeVisualizer.prototype.test = function(total){
	var rootObj = new THREE.Object3D();
	for (var i = 0; i < total; i++) {
		var mesh = new THREE.Mesh(__getGeometry(), __getMaterial('normal'));
		rootObj.add(mesh);
		var longLat = pointOnSphere(i, total*6);
		mesh.rotation.y = longLat[0];
		mesh.rotation.z = longLat[1] + Math.PI * 0.5;
	}
	rootObj.scale.multiplyScalar(3);
	rootObj.position.z = 3;
	rootObj.rotation.x = Math.PI * 0.5;
	return rootObj;
};

module.exports = TreeVisualizer;