var container,stats;	
var canavs;
var camera,scene,renderer,controls;
var raycaster;			// 点击发出的一条射线
var mouse = new THREE.Vector2();	// 点向量

var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
mouse.x = 0;
mouse.y = 0;


function init () {
	container = document.querySelectorAll('.container')[0];

	scene = new THREE.Scene();

	// 相机
	camera = new THREE.PerspectiveCamera(60, winWidth / winHeight, 1, 10000);
	camera.position.set(0, 0, 1000);
	camera.lookAt(0, 0, 0);

	// 光
	var light = new THREE.AmbientLight(0x404040); 
	scene.add(light);
	
	// renderer 
	renderer = new THREE.WebGLRenderer( {antialias: true} );
	renderer.setClearColor(0x45888A);
	renderer.setPixelRatio(window.devivePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.append(renderer.domElement);

	// 统计
	stats = new Stats();
	container.appendChild(stats.dom);

	// 控制器
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.speed = 5;
	controls.noPan = false;
	controls.noZoom = false;
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	window.addEventListener( 'resize', onWindowResize, false );
}

function render(){
	camera.lookAt(scene.position);
	camera.updateProjectionMatrix();
	renderer.render(scene, camera);
}

function animate () {
	requestAnimationFrame(animate);

	render();
	TWEEN.update();
	stats.update();
	controls.update();
}

init();
animate();

function onWindowResize(){

	renderer.setPixelRatio( window.devicePixelRatio );
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}