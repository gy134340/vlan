
var langObj;
var paradigmObj;
axios.get('./js/lib/data.json')
	.then(function (res) {
		langObj = res.data.langs;		// array
		paradigmObj = res.data.paradigms;	// 范例 array
		console.log('res',res);

		// enable three.js
		init();
		animate();
	})
	.catch(function (error) {
	});


/********************************************************
		Vue.js
*********************************************************/

/**
 * Components
 */
var header = Vue.extend({
	template: '#header'
});

var bottom = Vue.extend({
	template: '#bottom'
});

// @todo $route.params.id mounted get data
var intro = Vue.extend({
	template: '#intro'
});

/**
 * Pages
 */
var loading = Vue.extend({
	template: '#loading',
	data: function() {
		return {};
	}
});

var index = Vue.extend({
	template: '#index',
	data: function() {
		return {};
	},
	computed: {
		count: function() {
			return this.$store.state.count; 
		}
	},
	mounted: function() {

	},
	methods: function() {

	},
	components:{
		'my-header': header,
		'my-bottom': bottom,
		'my-intro': intro
	}
});

var routes = [
	{
		path: '*',
		component: index
	},
	{	
		path: '/loading',
		name: 'loading',
		component: loading
	},
	{	
		path: '/index/:name',
		name: 'index',
		component: index
	}
];
// router.push({ name: 'user', params: { userId: 123 }}) 快速
var router = new VueRouter({
	routes
});

var store = new Vuex.Store({
	state: {
		count: 0
	},
	getters: {

	},
	mutations: {
		increment: function(state) {
			state.count++;
		}
	},
	actions: {

	}
});

var app = new Vue({
	router,
	store
}).$mount('#app');


/********************************************************
	three.js
*********************************************************/

var container,stats;	
var canavs;
var camera,scene,renderer,controls;
var raycaster;			// 点击发出的一条射线
var INTERSECTED;
var mouse = new THREE.Vector2();	// 点向量
var bundle = [];
var threeObj = {};

var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
mouse.x = 0;
mouse.y = 0;

var PI2 = Math.PI * 2;
var programFill = function(context) {
	context.beginPath();
	context.arc(0, 0, 0.5, 0, PI2, true);
	context.fill();
};

var programStroke = function(context) {
	context.lineWidth  = 0.04;
	context.beginPath();
	context.arc(0, 0, 0.5, 0, PI2, true);
	context.stroke();
};

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
	// renderer = new THREE.WebGLRenderer( {antialias: true} );
	renderer = new THREE.CanvasRenderer();
	renderer.setClearColor(0x000000);
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

	raycaster = new THREE.Raycaster();	// 射线

	window.addEventListener( 'resize', onWindowResize, false );

	addParticles();

	enableLink(bundle);

	document.addEventListener( 'click', onDocumentEvent, false );
}

function setName(name){
	var c;
	var material = new THREE.SpriteCanvasMaterial( {
		color: new THREE.Color(0x000000),
		program: function ( context ) {
			context.font = '5px';
			context.fillStyle = '#fff';
			context.fillText(name, 0, 0);
		},

	} );

	c = new THREE.Sprite( material );
	c.position.normalize();
	c.material.rotation = 0;
	c.scale.x = c.scale.y = 2;

	c.scale.y = - 2;
	return c;
}

function addParticles() {
	
	for (var i = 0, l = langObj.length; i < l; i++) {
		var color = Math.random() * 0x808080 + 0x808080;
		var spriteMaterial = new THREE.SpriteCanvasMaterial({
			color: color, program: programStroke
		});
		var particle = new THREE.Sprite(spriteMaterial);
		particle.scale.x = particle.scale.y = 8 + langObj[i].size * 1; 

		var theta = (Math.random() * 2 - 1) * Math.PI;
		particle.position.x = Math.sin(theta) * Math.random() * 1000;
		particle.position.y = Math.cos(theta) * Math.random() * 1000;
		particle.userData = langObj[i];

		var id = langObj[i].id;
		threeObj[id] = particle;

		if (langObj[i].size > 10) {		// @todo add name
			var text = langObj[i].label;
			var name = setName(text);
			name.position.x = particle.position.x + 5 + langObj[i].size / 2;
			name.position.y = particle.position.y - 5;
			scene.add(name);
			bundle.push(particle);		// add to 第一波
			// enableLink(particle);
		}
		scene.add(particle);
	}
	// console.log('tt',threeObj);
}

function enableLink(objs) {

	for (var i = 0, l = objs.length; i < l; i++) {
		var obj = objs[i];
		var influenced = obj.userData.influenced;

		var SUBDIVISIONS = 50;
		for (var k = 0, kl = influenced.length; k < kl; k++) {
			var id = influenced[k].id;
			// console.log('lal', threeObj[id]);
			var child = threeObj[id];
			var geometry = new THREE.Geometry();
			var curve = new THREE.QuadraticBezierCurve3();
			curve.v0 = new THREE.Vector3(child.position.x, child.position.y, 0);
			curve.v1 = new THREE.Vector3((obj.position.x+child.position.x)/2 - 50, (obj.position.y+child.position.y)/2 + 50, 0);
			curve.v2 = new THREE.Vector3(obj.position.x, obj.position.y, 0);
			for (var j = 0; j < SUBDIVISIONS; j++) {
				geometry.vertices.push( curve.getPoint(j / SUBDIVISIONS) );
			}
			
			var material = new THREE.LineBasicMaterial( { color: obj.material.color, linewidth: 1 } );
			var line = new THREE.Line(geometry, material);
			scene.add(line);
		}

		// var geometry = new THREE.Geometry();
		// var curve = new THREE.QuadraticBezierCurve3();
		// curve.v0 = new THREE.Vector3(0, 0, 0);
		// curve.v1 = new THREE.Vector3(obj.position.x / 2 - 100, obj.position.y/2 + 100, 0);
		// curve.v2 = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
		// for (var j = 0; j < SUBDIVISIONS; j++) {
		// 	geometry.vertices.push( curve.getPoint(j / SUBDIVISIONS) );
		// }

		// var material = new THREE.LineBasicMaterial( { color: obj.material.color, linewidth: 1 } );
		// var line = new THREE.Line(geometry, material);
		// scene.add(line);
	}
}	

function onDocumentEvent(event) {
	event.preventDefault();
	var eX = event.clientX || event.touches[0].pageX;
	var eY = event.clientY || event.touches[0].pageY;
	
	mouse.x = ( eX / window.innerWidth ) * 2 - 1; 
	mouse.y = - ( eY / window.innerHeight ) * 2 + 1;
	mouse.z = 0.5 ;  // 这个是必要的，有时候还要设为1

	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects( scene.children );

	if (intersects.length > 0) {
		var tmp = intersects[0].object;
		tmp.material.program = programFill;
		setTimeout(function() {
			tmp.material.program = programStroke;
		}, 3000);
	}
}

function render() {
	camera.lookAt(scene.position);
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );	
	renderer.render(scene, camera);
}

function animate () {
	requestAnimationFrame(animate);

	render();
	TWEEN.update();
	stats.update();
	controls.update();
}

// init();
// animate();

function onWindowResize(){

	renderer.setPixelRatio( window.devicePixelRatio );
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}