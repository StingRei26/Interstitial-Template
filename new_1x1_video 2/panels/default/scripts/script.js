/*******************
VARIABLES
*******************/
var lastModified = "2017-11-23";
var lastUploaded = "2017-11-23";

var templateVersion = "2.0.24";
var dimensions;
var scrollPos = {
	x: 0,
	y: 0
};


var closeButton;
var userActionButton;
var clickthroughButton;
var video;
var videoContainer;
var videoTrackingModule;
var sdkData = null;
var autoCollapseTimer;
var adId, rnd, uid;

/*******************
INITIALIZATION
*******************/
function checkIfAdKitReady(event) {
	try {
		if (window.localPreview) {
			window.initializeLocalPreview(); //in localPreview.js
			initializeCreative();
			return;
		}
	}
	catch (e) {}

	adkit.onReady(initializeCreative);
}

function initializeCreative() {
	// so messaging can work in safe frames we need to bind the events that are present in the event manager.
	EBG.pm.bind("sendCreativeId", function () {
		eventManager.apply(this, arguments);
	}, this);
	EBG.pm.bind("eventCallback", function () {
		eventManager.apply(this, arguments);
	}, this);

	//Workaround (from QB6573) for Async EB Load where Modernizr isn't properly initialized
	typeof Modernizr == "object" && (Modernizr.touch = Modernizr.touch || "ontouchstart" in window);

	initializeGlobalVariables();
	window.registerInteraction = function () {}; //overwrite rI function because it will never actually be called
	initializeCloseButton();
	initializeVideo();
	addEventListeners();
}

function initializeGlobalVariables() {
	adId = EB._adConfig.adId;
	rnd = EB._adConfig.rnd;
	uid = EB._adConfig.uid;

	closeButton = document.getElementById("closeButton");
	dimensions = document.getElementById("dimensions"); //for testing only, show the dimensions and scrollpos of the parent
	userActionButton = document.getElementById("userActionButton");
	clickthroughButton = document.getElementById("clickthroughButton");
	videoContainer = document.getElementById("videoContainer");
	video = document.getElementById("video");

	sdkData = EB.getSDKData();
}

function initializeCloseButton() {
	var enableSDKDefaultCloseButton = EB._adConfig && EB._adConfig.hasOwnProperty("mdEnableSDKDefaultCloseButton") && EB._adConfig.mdEnableSDKDefaultCloseButton;
	if (sdkData !== null) {
		if (sdkData.SDKType === "MRAID" && !enableSDKDefaultCloseButton) {
			// set sdk to use custom close button
			EB.setExpandProperties({
				useCustomClose: true
			});
			closeButton.style.display = "block";
		}
	}
	else {
		closeButton.style.display = "block";
	}
}


function initializeVideo() {

	videoTrackingModule = new EBG.VideoModule(video);
	
	if (EB.API.os.ios) {
     //   video.setAttribute("poster", ""); // remove video poster for ios devices so it won't show up before video play or before show video play button
        if (EB.API.os.ver >= 10) {
            video.setAttribute("playsinline", ""); // iOS 10 new playsinline attribute enable vidoe plays in line (muted)
        }
    }
	
	if (EB.API.os.windowsphone) {
		video.addEventListener("click", function (event) {
			if (this.getBoundingClientRect().width < 168 || this.getBoundingClientRect().height < 152) {
				video.play();
			}
		}, false);
	}

	videoContainer.style.visibility = "visible";

	if (sdkData == null && EB.API.getCustomVar("mdAutoPlayVideo")) {
		videoTrackingModule.playVideo(false);
	}
}

function addEventListeners() {
	document.body.addEventListener("click", handleCloseButtonClick);

	videoContainer.addEventListener("click", function (event){
		event.stopPropagation();
		console.log("Clickthrough");
		pauseVideo();
		EB.clickthrough();
	});

	closeButton.addEventListener("click", handleCloseButtonClick);
	userActionButton.addEventListener("click", handleUserActionButtonClick);
	clickthroughButton.addEventListener("click", handleClickthroughButtonClick);
	if (video) {
		video.addEventListener("click", stopCollapseTimer);
		video.addEventListener("play", stopCollapseTimer);
		video.addEventListener("pause", stopCollapseTimer);
		video.addEventListener("volumechange", videoSliderHandler);
		video.addEventListener("seeking", videoSliderHandler);
		video.addEventListener("webkitfullscreenchange", fullscreenChangeHandler);
		video.addEventListener("mozfullscreenchange", fullscreenChangeHandler);
		video.addEventListener("fullscreenchange", fullscreenChangeHandler);
	}


	document.addEventListener(EB.API.os.mobile ? "touchstart" : "mousedown", stopCollapseTimer);
	if (EB.API.os.mobile) {
		document.addEventListener((EB.API.os.ios && EB.API.os.ver > 7 ? "touchstart" : "touchmove"), disablePageScrolling);
		if (video) {
			video.addEventListener("touchend", disablePageScrolling);
		}
	}
}

function creativeContainerReady() {
	startCollapseTimer();
}

/*******************
EVENT HANDLERS
*******************/
function handleCloseButtonClick(event) {
	pauseVideo();
	setTimeout(function(){
		if (EB.API.os.mobile) {
			enablePageScrolling();
		}
		EB.collapse();
	}, 200);
}

function handleUserActionButtonClick() {
	pauseVideo();
	EB.userActionCounter("CustomInteraction");
}

function handleClickthroughButtonClick() {
	pauseVideo();
	EB.clickthrough();
}

/*******************
UTILITIES
*******************/
function collapse() {
	handleCloseButtonClick();
}

function pauseVideo() {
	if (video) {
		video.pause();
	}
}

function videoSliderHandler() {
	enablePageScrolling();
	stopCollapseTimer();
}

function fullscreenChangeHandler() {
	if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
		EB._sendMessage("fullscreenOn", {});
	}
	else {
		EB._sendMessage("fullscreenOff", {});
	}
	stopCollapseTimer();
}

function startCollapseTimer() {
	if (EB.API.getCustomVar("mdAutoCollapseTimer")) {
		autoCollapseTimer = setTimeout(function () {
			//stopCollapseTimer();
			handleCloseButtonClick();
		}, EB.API.getCustomVar("mdAutoCollapseTimer"));
	}
}

function stopCollapseTimer() {
	if (EB.API.getCustomVar("mdInteractionsCancelAutoCollapse") && autoCollapseTimer) {
		clearTimeout(autoCollapseTimer);
	}
}

function disablePageScrolling() {
	if (EB.API.getCustomVar("mdLockScrollingWhenExpanded")) {
		document.addEventListener("touchmove", preventDefaultEventHandler);
	}
}

function enablePageScrolling() {
	if (EB.API.getCustomVar("mdLockScrollingWhenExpanded")) {
		document.removeEventListener("touchmove", preventDefaultEventHandler);
	}
}

function preventDefaultEventHandler(event) {
	event.preventDefault();
}

/*********************************
HTML5 Event System - Do Not Modify
*********************************/
var listenerQueue;
var creativeIFrameId;

function sendMessage(type, data) {

	//note: the message type we're sending is also the name of the function inside
	//		the custom script's messageHandlers object, so the case must match.

	if (!data.type) data.type = type;
	EB._sendMessage(type, data);
}

function addCustomScriptEventListener(eventName, callback, interAd) {
	listenerQueue = listenerQueue || {};
	var data = {
		uid: uid,
		listenerId: Math.ceil(Math.random() * 1000000000),
		eventName: eventName,
		interAd: !!(interAd),
		creativeIFrameId: creativeIFrameId
	};
	sendMessage("addCustomScriptEventListener", data);
	data.callback = callback;
	listenerQueue[data.listenerId] = data;
	return data.listenerId;
}

function dispatchCustomScriptEvent(eventName, params) {
	params = params || {};
	params.uid = uid;
	params.eventName = eventName;
	params.creativeIFrameId = creativeIFrameId;
	sendMessage("dispatchCustomScriptEvent", params);
}

function removeCustomScriptEventListener(listenerId) {
	var params = {
		uid: uid,
		listenerId: listenerId,
		creativeIFrameId: creativeIFrameId
	};

	sendMessage("removeCustomScriptEventListener", params);
	if (listenerQueue[listenerId])
		delete listenerQueue[listenerId];
}

function eventManager(event) {

	var msg;
	if (typeof event == "object" && event.data) {
		msg = JSON.parse(event.data);

	}
	else {
		// this is safe frame.
		msg = {
			type: event.type,
			data: event
		};
	}
	if (msg.type && msg.data && (!uid || (msg.data.uid && msg.data.uid == uid))) {
		switch (msg.type) {
		case "sendCreativeId":
			creativeIFrameId = msg.data.creativeIFrameId;
			if (creativeContainerReady && !autoCollapseTimer)
				creativeContainerReady();
			break;
		case "eventCallback": // Handle Callback
			var list = msg.data.listenerIds;
			var length = list.length;
			for (var i = 0; i < length; i++) {
				try {
					var t = listenerQueue[list[i]];
					if (!t) continue;
					t.callback(msg.data);
				}
				catch (e) {}
			}
			break;
		}
	}
}

window.addEventListener("message", function () {
	try {
		eventManager.apply(this, arguments);
	}
	catch (e) {}
}, false);
/*************************************
End HTML5 Event System - Do Not Modify
*************************************/

window.addEventListener("load", checkIfAdKitReady);