
var langObj;
var paradigmObj;
axios.get('./js/lib/data.json')
	.then(function (res) {
		langObj = res.data.langs;
		paradigmObj = res.data.paradigms;	// 范例
		console.log('res',res);
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