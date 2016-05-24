THREE = require('three');
var FPSController = require('threejs-camera-controller-first-person-desktop');
var Crosshair = require('threejs-gui-crosshair');
var CheckerboardTexture = require('threejs-texture-checkerboard');
var CANNON = require('cannon');
var urlParam = require('urlparam');
var clamp = require('clamp');
var Signal = require('signals').Signal;

var COLL_ENVIRONMENT = 1;
var COLL_PLAYER = 2;
var COLL_ITEMS = 4;

function WorldManager(app) {
	
	var playerSize = 1;
	var onPlayerSizeChangedSignal = new Signal();
	var view = app.viewManager.view;
	var camera = app.viewManager.camera;
	camera.near = 0.001;
	camera.far = 40;
	camera.updateProjectionMatrix();
	var pointLight = new THREE.PointLight(0xffffff, 1, 1, 2);
	camera.add(pointLight);
	var scene = app.viewManager.scene;
	var fog = new THREE.Fog( 0x7f7f7f, camera.near, camera.far);
	scene.fog = fog;
	var canvas = app.viewManager.canvas;
	var pointers = app.inputManager.pointers;

	camera.up.set(0,0,1);
	camera.position.set(0, 30, 30);
	camera.lookAt(new THREE.Vector3());

	var fpsController = new FPSController(camera, canvas, 
		{
			upAxis: 'z',
			yUp: false,
			movementSpeed: 0.1
		}
	);
	var keyboard = fpsController.keyboard;

	var sizeSpeed = 0;
	var sizeSpeedMax = 0.1;
	var sizeSpeedStep = 0.001;
	view.renderManager.onEnterFrame.add(function() {
		fpsController.update();
		var sizeChanged;
		if(keyboard.isPressed('dash')) {
			sizeChanged = true;
			sizeSpeed -= sizeSpeedStep;
		}
		if(keyboard.isPressed('equals')) {
			sizeChanged = true;
			sizeSpeed += sizeSpeedStep;
		}
		if(!sizeChanged) {
			sizeSpeed = 0;
			// for (var i = 4; i > 0; i--) {
			// 	if(sizeSpeed > 0) {
			// 		sizeSpeed -= sizeSpeedStep;
			// 	} else if(sizeSpeed < 0) {
			// 		sizeSpeed += sizeSpeedStep;
			// 	} else {
			// 		i = 0;
			// 	}
			// }
		}
		if(sizeSpeed !== 0) {
			playerSize *= (1 + sizeSpeed);
			playerSize = clamp(playerSize, 0.00001, 40);
			fpsController.movementSpeed = 0.1 * playerSize;
			pointLight.distance = playerSize;
			fog.near = camera.near = playerSize * 0.001;
			fog.far = playerSize * 40;
			camera.far = fog.far + 0.1;
			camera.updateProjectionMatrix();
			onPlayerSizeChangedSignal.dispatch(playerSize);
		}
	});
	view.renderer.setClearColor(0x7f7f7f);

	pointers.onPointerDownSignal.add(function(){
		console.log('down');
	});

	var planeMaterial = new THREE.MeshPhongMaterial({
		map: new CheckerboardTexture(0x6f4f3f, 0x7f5f4f, 1000, 1000)
	});
	var plane = new THREE.Mesh(
		new THREE.PlaneGeometry(1000, 1000, 1, 1),
		planeMaterial
	);

	scene.add(plane);

	var world = new CANNON.World();
	world.gravity.set(0, 0, 10);
	world.gravity.w = 0.4;
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;

	var objects = [];

	var radius = 0.5; // m 
	var geometry = new THREE.SphereGeometry(radius, 32, 16);

	var crosshair = new Crosshair();

	var material = new THREE.MeshPhongMaterial({
		color: 0xffffff,
		map: new CheckerboardTexture()
	});
	var ambient = new THREE.HemisphereLight(0x7fafcf, 0x6f4f3f, 1); 
	ambient.position.set(0, 0, 100);
	scene.add(ambient);

	var groundBody = new CANNON.Body({
			mass: 0, // mass == 0 makes the body static
			collisionFilterGroup: COLL_ENVIRONMENT,
			collisionFilterMask: COLL_PLAYER | COLL_ITEMS
	});
	var groundShape = new CANNON.Plane();

	var groundMaterial = new CANNON.Material();
	groundMaterial.friction = 0.9;

	groundShape.material = groundMaterial;
	groundBody.addShape(groundShape);
	world.addBody(groundBody);



	var cylinderShape = new CANNON.Cylinder(0.05, 0.6, 1.5, 16);
	// cylinderShape.material = groundMaterial;

	var playerBody = new CANNON.Body({
		 mass: 50, // kg 
		 position: new CANNON.Vec3(0, 5, 5), // m 
		 rotation: new CANNON.Vec3(0, 1, 0), // m 
		 shape: cylinderShape,
		 fixedRotation: true,
		 linearDamping: 0.5,
		 resistGravity: true,
		 collisionFilterGroup: COLL_PLAYER,
		 collisionFilterMask: COLL_ENVIRONMENT | COLL_ITEMS
	});
	var feetShape = new CANNON.Sphere(1.0);
	playerBody.addShape(feetShape, new CANNON.Vec3(0, 0, 0.75));
	playerBody.quaternion.setFromEuler(Math.PI * 0.5, 0, 0);
	playerBody.position.set(0, 3, 3);
	var playerMesh = new THREE.Object3D();
	// var playerMesh = new THREE.Mesh(
	// 	new THREE.CylinderGeometry(0.05, 0.6, 1.5, 16),
	// 	material
	// );
	var headPivot = new THREE.Object3D();
	headPivot.add(camera);
	headPivot.position.y = 1.05;
	camera.position.set(0, 0, 0);
	headPivot.rotation.x = Math.PI * -0.5;
	playerMesh.add(headPivot);
	var player = {
		mesh: playerMesh,
		body: playerBody
	};
	objects.push(player);

	var quat = new CANNON.Quaternion();
	quat.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
	var translation = new CANNON.Vec3(0,0,0);
	playerBody.shapes[0].transformAllPoints(translation,quat);

	world.add(playerBody);
	scene.add(playerMesh);


	var fixedTimeStep = 1.0 / 60.0; // seconds 
	var maxSubSteps = 3;
	 
	function makeBall(x, y, z) {
		var ballMesh = new THREE.Mesh(
			geometry,
			material
		);
		scene.add(ballMesh);
		var scaler = Math.random() * 10 + 1;
		var shape = new CANNON.Sphere(radius * scaler);
		ballMesh.scale.multiplyScalar(scaler);
		shape.material = groundMaterial;
		var ballBody = new CANNON.Body({
			mass: 5 * Math.pow(scaler, 3), // kg 
			position: new CANNON.Vec3(x, y, z+radius*scaler), // m 
			shape: shape,
			linearDamping: 0.1,
			angularDamping: 0.1,
			// fixedRotation: true,
			collisionFilterGroup: COLL_ITEMS,
			collisionFilterMask: COLL_ENVIRONMENT | COLL_PLAYER | COLL_ITEMS
		});
		world.addBody(ballBody);
		objects.push({
			mesh: ballMesh,
			body: ballBody
		});
	}

	for (var i = 0; i < urlParam('ballsTotal', 15); i++) {
		makeBall(
			Math.random()*20-10,
			Math.random()*20-10,
			0
			);
	}


	var result = new CANNON.RaycastResult();
	var raycastOptions = {
		collisionFilterMask: COLL_ENVIRONMENT
	};
	var rayFrom = playerBody.position;
	var rayTo = playerBody.position.clone();

	// Start the simulation loop 
	var lastTime;
	(function simloop(time){
		requestAnimationFrame(simloop);

		if(lastTime !== undefined){
			 var dt = (time - lastTime) / 1000;
			 world.step(fixedTimeStep, dt, maxSubSteps);
		}
		// camera.position.z = 0;
		playerBody.position.vadd(camera.position, playerBody.position);
		// playerBody.velocity.vadd(camera.position, playerBody.velocity);
		camera.position.set(0, 0, 0);
		if(fpsController.keyboard.isPressed('space')) {
			rayTo.copy(rayFrom);
			rayTo.z -= 2;
			world.raycastClosest(rayFrom, rayTo, raycastOptions, result);
			if(result.body === groundBody && result.distance < 1) {
				// playerBody.velocity.z += 10;
			}
		}
		objects.forEach(function(object) {
			object.mesh.position.copy(object.body.position);
			object.mesh.quaternion.copy(object.body.quaternion);
		});
		lastTime = time;
	})();
}

module.exports = WorldManager;