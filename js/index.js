
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


var VTHAT;
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
		return {
			selected: {
				proData: ''
			}
		};
	},
	computed: {
		count: function() {
			return this.$store.state.count; 
		},
		influenced: function() {
			var tmp = this.selected.proData.influenced;
			if(tmp && tmp.length > 0) {
				return tmp;
			}
		},
		influencedby: function() {
			var tmp = this.selected.proData.influenced;
			if(tmp && tmp.length > 0) {
				return tmp;
			}
		}
	},
	mounted: function() {
		VTHAT = this;
		document.addEventListener( 'click', onDocumentEvent, false );
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
	router: router,
	store: store
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
var threeArray = [];
var lineArray = [];
var nameArray = [];

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

	// document.addEventListener( 'click', onDocumentEvent, false );
}

function setName(obj){
	var c;
	var name = obj.userData.label;
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
	c.scale.x = c.scale.y = 2.5;
	c.scale.y = - 2.5;
	c.position.x = obj.position.x + 5 + obj.userData.size / 2;
	c.position.y = obj.position.y - 5;
	c.position.z = 10;
	nameArray.push(c);
	scene.add(c);
}

function setSubName(obj){
	var c;
	var name = obj.userData.label;
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
	c.scale.x = c.scale.y = 1.5;
	c.scale.y = - 1.5;
	c.position.x = obj.position.x + 5 + obj.userData.size / 2;
	c.position.y = obj.position.y - 5;
	c.position.z = 10;
	nameArray.push(c);
	scene.add(c);
}

function addParticles() {
	
	for (var i = 0, l = langObj.length; i < l; i++) {
		var color = Math.random() * 0xFFFFFF ;
		var spriteMaterial = new THREE.SpriteCanvasMaterial({
			color: color, program: programFill
		});
		var particle = new THREE.Sprite(spriteMaterial);
		particle.scale.x = particle.scale.y = 8 + langObj[i].size * 1; 

		var theta = (Math.random() * 4 - 2) * Math.PI;
		particle.position.x = Math.sin(theta) * Math.random() * 1000;
		particle.position.y = Math.cos(theta) * Math.random() * 1000;
		particle.userData = langObj[i];

		var id = langObj[i].id;
		threeObj[id] = particle;
		threeArray.push(particle);

		if (langObj[i].size > 10) {		// @todo add name
			setName(particle);
			bundle.push(particle);
		}
		scene.add(particle);
	}
	// console.log('tt',threeObj);
}

// before click only for bundle
function enableLink(objs) {
	linkInfluenced(objs);
}

function linkInfluenced(objs) {
	for (var i = 0, l = objs.length; i < l; i++) {
		var obj = objs[i];
		var influenced = obj.userData.influenced;

		for (var k = 0, kl = influenced.length; k < kl; k++) {
			var id = influenced[k].id;
			// console.log('lal', threeObj[id]);
			var child = threeObj[id];
			var geometry = new THREE.Geometry();
			var curve = new THREE.QuadraticBezierCurve3();
			var offsetX = sign((obj.position.x+child.position.x)/2) * 50;
			var offsetY = sign((obj.position.y+child.position.y)/2) * 50;
			curve.v0 = new THREE.Vector3(child.position.x, child.position.y, 0);
			curve.v1 = new THREE.Vector3((obj.position.x+child.position.x)/2 + offsetX, (obj.position.y+child.position.y)/2 + offsetY, 0);
			curve.v2 = new THREE.Vector3(obj.position.x, obj.position.y, 0);
			for (var j = 0; j < 50; j++) {
				geometry.vertices.push( curve.getPoint(j / 50) );
			}
			
			var material = new THREE.LineBasicMaterial( { color: obj.material.color, linewidth: 0.5 } );
			var line = new THREE.Line(geometry, material);
			lineArray.push(line);
			scene.add(line);
		}
	}
}	

// clicked
function enableSubLink(obj) {
	linkSubInfluenced(obj);
	linkSubInfluenedby(obj);
}

function linkSubInfluenedby(obj) {
	var influencedby = obj.userData.influencedby;

	for (var k = 0, kl = influencedby.length; k < kl; k++) {
		var id = influencedby[k].id;
		// console.log('lal', threeObj[id]);
		var child = threeObj[id];
		setSubName(child);
		var geometry = new THREE.Geometry();
		var curve = new THREE.QuadraticBezierCurve3();
		var offsetX = sign((obj.position.x+child.position.x)/2) * 50;
		var offsetY = sign((obj.position.y+child.position.y)/2) * 50;
		curve.v0 = new THREE.Vector3(child.position.x, child.position.y, 0);
		curve.v1 = new THREE.Vector3((obj.position.x+child.position.x)/2 + offsetX, (obj.position.y+child.position.y)/2 + offsetY, 0);
		curve.v2 = new THREE.Vector3(obj.position.x, obj.position.y, 0);
		for (var j = 0; j < 50; j++) {
			geometry.vertices.push( curve.getPoint(j / 50) );
		}
		
		var material = new THREE.LineBasicMaterial( { color: child.material.color, linewidth: 0.5 } );
		var line = new THREE.Line(geometry, material);
		lineArray.push(line);
		scene.add(line);
	}
}

function linkSubInfluenced(obj) {
	var influenced = obj.userData.influenced;

	for (var k = 0, kl = influenced.length; k < kl; k++) {
		var id = influenced[k].id;
		// console.log('lal', threeObj[id]);
		var child = threeObj[id];
		setSubName(child);
		var geometry = new THREE.Geometry();
		var curve = new THREE.QuadraticBezierCurve3();
		var offsetX = sign((obj.position.x+child.position.x)/2) * 50;
		var offsetY = sign((obj.position.y+child.position.y)/2) * 50;
		curve.v0 = new THREE.Vector3(child.position.x, child.position.y, 0);
		curve.v1 = new THREE.Vector3((obj.position.x+child.position.x)/2 + offsetX, (obj.position.y+child.position.y)/2 + offsetY, 0);
		curve.v2 = new THREE.Vector3(obj.position.x, obj.position.y, 0);
		for (var j = 0; j < 50; j++) {
			geometry.vertices.push( curve.getPoint(j / 50) );
		}
		
		var material = new THREE.LineBasicMaterial( { color: obj.material.color, linewidth: 0.5 } );
		var line = new THREE.Line(geometry, material);
		lineArray.push(line);
		scene.add(line);
	}
}


// 处理点击后的点，是子集
function processClick(obj) {
	var arr = getRelated(obj);
	// var len = scene.children.length;
	for (var i = 0, l = threeArray.length; i < l; i++) {
		var tmp = threeArray[i];
		if (tmp && tmp.userData) {
			var id = tmp.userData.id;
			if (arr.indexOf(id) === -1) {
				// console.log(tmp);
				scene.remove(tmp);
			} else {
				scene.add(tmp);
			}
		}
	}

	for (var j = 0; j < lineArray.length; j++) {
		var tmpLine = lineArray[j];
		// var tmpLine = lineArray.shift();
		scene.remove(tmpLine);
	}
	lineArray.length = 0;

	for (var k = 0; k < nameArray.length; k++ ) {
		var tmpName = nameArray[k];
		// var tmpName = nameArray.shift();
		scene.remove(tmpName);
	}
	nameArray.length = 0;

	addNameAndLine(obj);
	
}

// 添加新的点击链接及影响链
function addNameAndLine(obj) {
	var name = setName(obj);
	enableSubLink(obj);
}

function getRelated(obj) {
	var arr = [];
	arr.push(obj.userData.id);
	for (var i = 0, l = obj.userData.influenced.length; i < l; i++) {
		var tmp = obj.userData.influenced[i].id;
		arr.push(tmp);
	}
	for (var j = 0, jl = obj.userData.influencedby.length; j < jl; j++) {
		var jTmp = obj.userData.influencedby[j].id;
		arr.push(jTmp);
	}
	return arr;
}

function onDocumentEvent(event, that) {
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
		if(tmp.userData) {
			tmp.material.program = programStroke;
			console.log('touch', tmp.userData);
			VTHAT.selected.proData = tmp.userData;		// link to Vue 
			processClick(tmp);
			setTimeout(function() {
				tmp.material.program = programFill;
			}, 100);
		}
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

// vender
function sign(x) {
	x = +x;
	if (x === 0 || isNaN(x)) {
		return x;
	}

	return x > 0 ? 1 : -1;
}
