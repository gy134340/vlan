var video = document.getElementById("e_video");
videoEnable( video );
var canvas = document.getElementById("e_canvas");		// 连接视频源的canvas
var ctx = canvas.getContext('2d');

var ANIMATION;		// 存储animation动画
var isVideoOn = false;			// 视频是否在播放
var SUSPEND = false;		// 是否暂停方块移动
var DIRECTION = "right";		// 移动物体进来的方向,需要保持一个方向

// var PARTICLE = document.querySelectorAll(".particle")[0];		// 中间移动的小黑块标记
var PARTICLE = document.querySelectorAll(".hand")[0];			// 换成手了

var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var winWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var winHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

var detectMouse = {
	pageX: 0,
	pageY: winHeight/2
};

var lastImageData;		// 上一帧

var sourceImageData;	// 这一帧从canvas上读到的数据

var blendCanvas =  document.getElementById("blend_canvas");		// 渲染出来的canvas
var blendCtx = blendCanvas.getContext('2d');
var content = document.querySelectorAll('.content')[0];			// 主体的页面
var canvasImage = document.getElementById('canvas_image');		// 暂存canvas的Image

var start = document.getElementById("start");
var stop = document.getElementById("stop");


var products = document.querySelectorAll('.product');
var productsLen = products.length;


var noticeArray = $(".notice img");
// 动画开始
window.addEventListener('load',function(){

	start.addEventListener('click',function(e){
		e.preventDefault();
		if(isVideoOn === false){
			isVideoOn = true;
			animate();
		}
		
	},false);

	start.click(); 		// trigger start @todo 
},false);

// 结束动画,完全重置
stop.addEventListener('click', function(e){
	e.preventDefault();
	if(isVideoOn === true){
		window.cancelAnimationFrame( ANIMATION );
		isVideoOn = false;
	}
},false);

// 用户点击，结束动画，停住
content.addEventListener("click",function(e){

	if(isVideoOn === true){
		window.cancelAnimationFrame( ANIMATION );
		isVideoOn = false;		//  不需要恢复
	}

},false);

// change
function detectRender(){
	var imgData = ctx.getImageData(0,0,canvasWidth,canvasHeight);
	var blendData = blendCtx.createImageData(canvasWidth,canvasHeight);

	sourceImageData = imgData;
	if(!lastImageData){
		lastImageData = sourceImageData;	// 第一帧时没有上一帧，存储为当前帧
	}
	var dataLen = imgData.data.length;

	imgProcess(blendData.data,imgData.data,lastImageData.data);
	
	lastImageData = sourceImageData;		// lastImageData存放上一帧的图像
	blendCtx.putImageData(blendData,0,0);	// imgdata存放将要绘制的图像

	getPosition();							// 检测变化最多的位置
}

// 图像二值化，所有像素点置255，帧变化结果放在target中
function imgProcess(target, data1, data2){
	if(data1.length != data2.length){
		return null;
	}
	var dataLen = data1.length;

	// 图像预处理
	data1 = imgToGrey(data1);
	data2 = imgToGrey(data2);

	for(var i=0; i<dataLen; i+=4){
		// var average1 = (data1[i] + data1[i+1] + data1[i+2]) / 3;
		// var average2 = (data2[i] + data2[i+1] + data2[i+2]) / 3;
		var average1 = data1[i];				// 已经灰度化,取哪一个都一样
		var average2 = data2[i];
		var diff = threshold(fastAbs(average1 - average2));
		target[i] = diff;
		target[i+1] = diff;
		target[i+2] = diff;
		target[i+3] = 0xFF;
	}
}

// 获得像素变化最多位置的坐标
function getPosition(){
	var poi = { max:0, xAxis:0 };		// 变化最多的块
	var totalPixel = 0;			// 全部变化像素点,暂时不会用到	

	for(var i = 0; i < canvasWidth; i += 10){		// 切分块,对每一个块内变化的像素总量进行判断
		var sliceData =  blendCtx.getImageData(i,0,20,canvasHeight);
		var sum = 0;
		var sliceLen = sliceData.data.length;

		for(var j = 0; j < sliceLen; j+=4){
			// sum += sliceData.data[j] + sliceData.data[j+1] + sliceData.data[j+2];
			sum += (sliceData.data[j] & 1 );		// 取符号位即可，rgb值一样,取一个值即可
		}
		if(poi.max < sum){			// 最大
			poi.max = sum;
			poi.xAxis = i - 5;		// 获取中点
		}

		totalPixel += sum;	// 将每一块的像素点相加
	}

	moveParticle(poi);
//	if(nextFormatFlag == 1) {
//		goCloser(poi);
//	}
//	showNotice(poi);
	
}

// @todo 灰度化
function imgToGrey(dt){
	var len = dt.length;
	for(var i = 0;i < len; i+=4){
		var grey = 0.3 * dt[i] + 0.59 * dt[i+1] + 0.11 * dt[i+2];	 //rgb
		grey = parseInt(grey);
		dt[i] = grey;
		dt[i+1] = grey;
		dt[i+2] = grey;
	}

	return dt;
}

// 移动小黑块
function moveParticle(p){
	var poi = p;
	// 切片中改变像素的数量
	if(poi.max > 500 && SUSPEND === false){		
		var xRatio = poi.xAxis / canvasWidth;		// 获得每帧变化最多的位置
		xRatio = xRatio.toFixed(2) * 100;
		var left = parseInt(PARTICLE.style.left) || 0;

		var direction = left - xRatio;
		direction = direction.toFixed(0);
		var absSpace = fastAbs(direction);

		if(absSpace > 50){			// 纠正 人从左边进入还是从右边进入,快速变动左右入口位置
			correctEntrance(left);
			return false;			// stop here
		}
		if(absSpace > 0){		// 误差处理，移动过慢就不处理
			if(left < xRatio){					// 右移

				if(positionRoundOff(left, direction) === false){	// 四舍五入
					return false;
				}

				PARTICLE.style.left = xRatio + "%";
				// spreadAtoms(mi);

			}else{					// 左移

				if(positionRoundOff(left, direction) === false){	// 四舍五入
					return false;
				}

				PARTICLE.style.left = xRatio + "%";
				// spreadAtoms(mj);
			}
		}
	}
}

// 人的进入方向纠正，大于60才考虑
function correctEntrance(l){
	var left = l;

	if(left < 10){				// 移动标记放在左边，暂停小块活动1s,阈值待调整

		PARTICLE.style.display = "none";
		PARTICLE.style.left = 100 + "%";

		SUSPEND = true;
		setTimeout(function(){
			SUSPEND = false;
			PARTICLE.style.display = "block";
			DIRECTION = "left";
		},500);

	}else if(left > 90){		// 移动标记放在右边,暂停小块活动1s，阈值待调整

		PARTICLE.style.display = "none";
		PARTICLE.style.left = 0 + "%";

		SUSPEND = true;
		setTimeout(function(){
			SUSPEND = false;
			PARTICLE.style.display = "block";
			DIRECTION = "right";
		},500);
	}
}

// 四舍五入particle距离，避免太靠近边缘时检测不灵敏
function positionRoundOff(left,direction){

	if(left > 70){					// 阈值待调整
//	if(left >= 87){
		if(direction < 0){	  // 右入口轻微晃动

			PARTICLE.style.left = 100 + "%";
			suspendChasing(1000);		// stop chasing and go back
			return false;
		}

		if(DIRECTION == "right"){

			DIRECTION = "left";
			PARTICLE.style.left = 100 + "%";
			suspendChasing(1000);		// stop chasing and go back
			return false;
		}
	}else if(left < 14){			// 阈值待调整
//	}else if(left < 0){
		if(direction > 0){	  // 左入口轻微晃动

			PARTICLE.style.left = 0 + "%";
			suspendChasing(1000);		// stop chasing and go back
			return false;
		}

		if(DIRECTION == "left"){

			DIRECTION = "right";
			PARTICLE.style.left = 0 + "%";
			suspendChasing(1000);		// stop chasing and go back
			return false;
		}
	}
}

// 暂停轨迹跟踪一段时间，黑块靠近边缘时的归位辅助函数
function suspendChasing(t){

	var time = t;
	SUSPEND = true;
	// resumeAtoms();
	// resumeProducts();
	setTimeout(function(){
		SUSPEND = false;
	},time);

}

// 从video更新下一帧
function update(){

	// 此处需要倒置media,因为摄像头拍摄场景是反的
	ctx.save();				// 存储一个canvas状态

	ctx.translate(canvasWidth,canvasHeight);  	// 移到右下角
	ctx.rotate(Math.PI);						// 旋转180deg
	ctx.drawImage(video,0,0,canvasWidth,canvasWidth);		// 重新绘制

	ctx.restore();			// 恢复前一个状态，但是已绘制的不会变

}

//@todo 移到index
// function animate(){
// 	update();
// 	detectRender();

// 	ANIMATION = window.requestAnimationFrame(animate);
// }

// 取消animation一段时间
// @param t 毫秒
function suspendAnimation(t){
	var time = t;

	window.cancelAnimationFrame(animate);

	setTimeout(function(){
		animate();
	},time);
}

// 鼠标位置备用
document.ondetectMousemove = handledetectMouse;

function handledetectMouse(event){
	var event = event || window.event;

	if(event.pageX !== null && event.pageY !== null){
		detectMouse.pageX = event.clientX;
	}
}

function resumeAtoms(){
	for(var i = 0; i < atomsLen; i++){
		atoms[i].style.top = atoms[i].getAttribute("data-top");
	}
}

// 将video源连接到摄像头
// @todo 处理不同语法
function videoEnable(ele){

	// @todo不同视频源，几块板对用不同视频源，应当分发成不同的任务，可以用localStorage存储

	var p = navigator.mediaDevices.getUserMedia({ audio: false, video: true });   // 去掉声音

	p.then(function(mediaStream) {
		var video = ele;
		video.src = window.URL.createObjectURL(mediaStream);
		video.onloadedmetadata = function(e) {
		};
	});
	p.catch(function(err) {
	});

}

// 工具函数
// >> 32位右移获得符号位0，－1
// ^ 异或，正数与0，不变，(负数*-1)-1-1
function fastAbs(value){
	return (value ^ (value >> 31)) - (value >> 31);
}

// 根据阈值二值化，可以更改阈值参数
function threshold(value){
	return (value > 0x15) ? 0xFF : 0;
}

function goCloser(poi) { // 平面突出效果, 为摄像头检测动效
	var xRatio = poi.xAxis / canvasWidth; // 获得每帧变化最多的位置 from moveParticle(p)
	var left = parseInt(PARTICLE.style.left) || 0;// 来自moveParticle()
	var direction = left - xRatio;
	var radius = 200; // 鼓出来的幅度
	var range = 5; // 鼓出来的左右范围
	var pi = 3.14;
	//var viewRange = camera.position.z *
		//Math.tan(THREE.Math.degToRad(camera.fov / 2)) *
		//2 * camera.aspect; // 可视范围
	var viewRange = 6750;
	var tmpRange = viewRange / 18;
	var center0 = parseInt((cx - tmpRange * 8) / 150);
	var center1 = parseInt((cx - tmpRange * 6) / 150);
	var center2 = parseInt((cx - tmpRange * 4) / 150);
	var center3 = parseInt((cx - tmpRange * 2) / 150);
	var center4 = parseInt(cx / 150);
	var center5 = parseInt((cx + tmpRange * 2) / 150);
	var center6 = parseInt((cx + tmpRange * 4) / 150);
	var center7 = parseInt((cx + tmpRange * 6) / 150);
	var center8 = parseInt((cx + tmpRange * 8) / 150);
	var center = [center0, center1, center2, center3, center4, center5, center6, center7, center8];
	
	var tmpCube = [];
	
	if(PARTICLE.style.display == "none" || left <= 0 || left >= 100) {
		for(var k = 0; k < cubes.length; k++) {
			if(cubes[k].position.z != 0) {
				new TWEEN.Tween(cubes[k].position)
					.to({z: 0}, 2000)
					.easing(TWEEN.Easing.Elastic.Out).start();
			}

		}
		return;
	}
	
	var index = parseInt(left / 11);
		
	for(var i = 0; i < 9; i++) {
		for(var j = -range; j <= range; j++) {
			if(cubes[center[index] + j + 144 * i]) {
				tmpCube.push(cubes[center[index] + j + 144 * i]);
				new TWEEN.Tween(cubes[center[index] + j + 144 * i].position)
					.to({z: radius * Math.pow( Math.sin(pi * i / 9) * Math.sin(pi * (j + range) / (2 * range)), 2)}, 2000)
					.easing(TWEEN.Easing.Elastic.Out).start();
			}
		}
	}
		
	for(var k = 0; k < cubes.length; k++) {
		if(cubes[k].position.z != 0 && tmpCube.indexOf(cubes[k]) < 0) {
			new TWEEN.Tween(cubes[k].position)
				.to({z: 0}, 2000)
				.easing(TWEEN.Easing.Elastic.Out).start();
		}

	}
}

function showNotice(poi) {
	var xRatio = poi.xAxis / canvasWidth; // 获得每帧变化最多的位置 from moveParticle(p)
	var left = parseInt(PARTICLE.style.left) || 0;// 来自moveParticle()
	var direction = left - xRatio;
	//if(left == 0){	// 四舍五入
	if(PARTICLE.style.display == "none" || left == 0 || left == 100){
		
		noticeArray.each(function(id){
			$(this).addClass("hide");
		});
		return false;
	}
	if(left / 11 >= 0 && parseInt(left / 11) <= 8) {
		noticeArray.each(function(id){
			if(id == (parseInt(left / 11))) {
				$(this).removeClass("hide");
			} else {
				$(this).addClass("hide");
			}
		});
	} else {
		noticeArray.each(function(id){
			$(this).addClass("hide");
		});
	}
}

//function showNotice(poi) {
//	var xRatio = poi.xAxis / canvasWidth; // 获得每帧变化最多的位置 from moveParticle(p)
//	var left = parseInt(PARTICLE.style.left) || 0;// 来自moveParticle()
//	var direction = left - xRatio;
//	var viewRange = camera.position.z *
//		Math.tan(THREE.Math.degToRad(camera.fov / 2)) *
//		2 * camera.aspect; // 可视范围
//	
//	var tmpRange = viewRange / 18;
//	var center0 = parseInt((cx - tmpRange * 8) / 150);
//	var center1 = parseInt((cx - tmpRange * 6) / 150);
//	var center2 = parseInt((cx - tmpRange * 4) / 150);
//	var center3 = parseInt((cx - tmpRange * 2) / 150);
//	var center4 = parseInt(cx / 150);
//	var center5 = parseInt((cx + tmpRange * 2) / 150);
//	var center6 = parseInt((cx + tmpRange * 4) / 150);
//	var center7 = parseInt((cx + tmpRange * 6) / 150);
//	var center8 = parseInt((cx + tmpRange * 8) / 150);
//	var center = [center0, center1, center2, center3, center4, center5, center6, center7, center8];
//	
//	
//	if(positionRoundOff(left, direction) === false){	// 四舍五入
//		return false;
//	}
//	var index = (parseInt(left / 11) > 8 || parseInt(left / 11) < 0)? 0 : parseInt(left / 11);
//	var updateNotice = function() {
//		this.position.x = center[index];
//		this.position.y = cy;
//		this.position.z = 1000;
//	}
//	
//	new TWEEN.Tween(notice.position)
//		.to({x:center[index]}, 1000)
//		.easing(TWEEN.Easing.Elastic.Out).start();
//	var tweenNotice = new TWEEN.Tween(notice).to().onUpdate(updateNotice).start();
//
//}
//
//function showNotice(poi) {
//		var xRatio = poi.xAxis / canvasWidth; // 获得每帧变化最多的位置 from moveParticle(p)
//		var left = parseInt(PARTICLE.style.left) || 0;// 来自moveParticle()
//		var direction = left - xRatio;
//		var viewRange = camera.position.z *
//			Math.tan(THREE.Math.degToRad(camera.fov / 2)) *
//			2 * camera.aspect; // 可视范围
//		if(positionRoundOff(left, direction) === false){	// 四舍五入
//			return false;
//		}
//		var updateNotice = function() {
//			this.position.x = left / 100 * viewRange;
//			this.position.y = cy;
//			this.position.z = 1000;
//		}
//		
//		new TWEEN.Tween(notice.position)
//			.to({x:left / 100 * viewRange}, 1000)
//			.easing(TWEEN.Easing.Elastic.Out).start();
//		var tweenNotice = new TWEEN.Tween(notice).to().onUpdate(updateNotice).start();
//
//}