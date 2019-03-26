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
	// if (video) {
	// 	video.addEventListener("click", stopCollapseTimer);
	// 	video.addEventListener("play", stopCollapseTimer);
	// 	video.addEventListener("pause", stopCollapseTimer);
	// 	video.addEventListener("volumechange", videoSliderHandler);
	// 	video.addEventListener("seeking", videoSliderHandler);
	// 	video.addEventListener("webkitfullscreenchange", fullscreenChangeHandler);
	// 	video.addEventListener("mozfullscreenchange", fullscreenChangeHandler);
	// 	video.addEventListener("fullscreenchange", fullscreenChangeHandler);
	// }


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


//NEW CODE

(function() {
	"use strict";

	//Variable Declaration
	
	var uid;
	var	container,
	closeButtonLandscape,
	closePortrait,
	frontclose,
	closeLightbox,
	hotspot,
	panel,
	panelCreative,
	headerSection,
	panelContainer,
	creativeHotspot,
	clicktThrough,
	playButton,
	panelContainerRatio,
	panelCurrentDimension,
	elemToResizeOnOrientation,
	screenOrientation,
	lightbox,
	animationEndEvent,
	isAutoExpand = false,
	closeContainer,
	videoContainer,
	video,
	originalVideoWidth = 480,
	originalVideoHeight = 270,
	logoContainer,
	timercheck = false,
	isAutoCollapse = true;


	window.addEventListener("load", checkIfEBInitialized);
	window.addEventListener("message", onMessageReceived);
	window.addEventListener("resize", onPageResize);

	function checkIfEBInitialized(event)
	{
		if (EB.isInitialized())
		{
			initializeCreative();
		}
		else {
			EB.addEventListener(EBG.EventName.EB_INITIALIZED, initializeCreative);
		}
	}

	function initializeCreative(event)
	{
		initCustomVars();
		initializeGlobalVariables();
		addEventListeners();
		if(mdShouldAutoExpand)
		{
			autoExpand();
		}else{
			expand();
		}
	}

	function initializeGlobalVariables()
	{
		uid 					= getuid();
		container 				= document.getElementById("container");
		panel 					= document.getElementById("panel");
		headerSection			= document.getElementById("header-section");
		panelCreative			= document.getElementById("panel-creative");
		panelContainer			= document.getElementById("panel-container");
		creativeHotspot 		= document.getElementById("hotspot");
		closeLightbox 			= document.getElementById("panel-lightbox");
		closeButtonLandscape 	= document.getElementById("close-button-landscape");
		closePortrait			= document.getElementById("close-button-portrait");
		frontclose			    = document.getElementById("front_close-button");
		lightbox				= document.getElementById("panel-lightbox");
		closeContainer 			= document.getElementById('close-container');
		video 					= document.getElementById('video');
		videoContainer			= document.getElementById('video-container');
		logoContainer			= document.getElementById('logo-container');
		playButton 				= document.getElementById('video-play-button');
		hotspot 				= document.getElementById('hotspot');

		//This variable hold reference to the elements that going to effect when Ad shift between portrait or landscape mode.
		elemToResizeOnOrientation = [{elemRef:logoContainer}];


		for (var i = 0; i < elemToResizeOnOrientation.length; i++)
		{
			var elem = elemToResizeOnOrientation[i];
				elem.originalClasses = elem.elemRef.className;
		};


		panelContainerRatio = { maxHeight:parseFloat(Utils.getComputedStyle(panelContainer,'max-height'),10),
				   			    maxWidth:parseFloat(Utils.getComputedStyle(panelContainer,'max-width'),10)};

		animationEndEvent = (Utils.getCSSBrowserPrefix() == "webkit")?"webkitAnimationEnd":"animationend";
	}


	function initCustomVars()
	{
		setCustomVar("mdCropVideo", false);
		setCustomVar("mdisIE9", false);
		setCustomVar("mdShouldAutoExpand", true);
		setCustomVar("mdCoppa", false);				//are we running in COPPA mode ? (default = false)
		setCustomVar("mdDefaultPanel", 'panel1');
		setCustomVar("mdEnableExpandCollapseAnim", true);
		setCustomVar("mdAutoCollapseTimeout", 2);
	}

	function addEventListeners()
	{
		hotspot.addEventListener("click", onClickThrough);
		closeButtonLandscape.addEventListener("click", onCloseClick);
		closePortrait.addEventListener("click", onCloseClick);
		frontclose.addEventListener("click", onCloseClick);
		closeLightbox.addEventListener("click", onCloseClick);
	}

	function expand()
	{
		panel.style.display = 'block';
		var closeLandscapeRef 	   = document.getElementById('close-landscape');
		var panelCreativeContainer = document.getElementById('panel-creative-container');

		var lightboxColor = mdCoppa ? 'lightbox-coppa' : 'lightbox-noncoppa';
			Utils.setClass(lightbox,lightboxColor);

		var closeContainerClass = mdCoppa ? 'close-container-COPPA' : 'close-container-NonCOPPA';
			Utils.setClass(closeLandscapeRef,closeContainerClass);

		var panelContainerClass = mdCoppa ? 'panel-container-COPPA' : 'panel-container-NonCOPPA';
			Utils.setClass(panelCreativeContainer,panelContainerClass);

		if(Utils.isMobile.iOS())
		{
			hideVideo();
			togglePlayAndPoster(true);
			//auto collapse within 2secs on IPAD | IOS
			autoCollapseIpad();
		}
		trackVideoInteractions(video);
		// hideVideoControls();
		if(isAutoCollapse){
			//startTimer();
			video.addEventListener("timeupdate",checktime);
			document.getElementById("countdown").style.display = "block";
		}else{
			document.getElementById("countdown").style.display = "none";
		}
		initVideoListener();

		onPageResize();
		if(mdEnableExpandCollapseAnim)
		{
			drawExpansion();
		}else{
			expanded();
		}
	}
	function autoCollapseIpad(){
		console.log("Auto Collapse after 2sec no interactions!");
		var timer = 6;
		timercheck =setInterval(function () {
			if (--timer <= 0) {
				clearInterval(timercheck);
				isAutoCollapse = false;
				collapse();
			}
		}, 1000);
	}
	function startTimer() {
		console.log(mdAutoCollapseTimeout);
		var timer = mdAutoCollapseTimeout*60;
		var duration = mdAutoCollapseTimeout*60;
		var minutes, seconds;
		var check=setInterval(function () {
			minutes = parseInt(timer / 60, 10);
			seconds = parseInt(timer % 60, 10);

			minutes = minutes < 10 ? "0" + minutes : minutes;
			seconds = seconds < 10 ? "0" + seconds : seconds;

			document.getElementById("timer").innerHTML = minutes + ":" + seconds;

			if (--timer < 0) {
				timer = duration;
				clearInterval(check);
				isAutoCollapse = false;
				collapse();
			}
		}, 1000);
	}

	function checktime(event){
  var timestamp = video.duration - video.currentTime;
  var timetext = timestamp.toString();
  if(timetext>=10){
   timetext = timetext.substring(0,2);
   document.getElementById("timer").innerHTML = "00:"+timetext;
  }
  else{
   timetext = timetext.substring(0,1);
   document.getElementById("timer").innerHTML = "00:0"+timetext;
  }
  //timetext = timetext.split('.').join(':');
  //console.log(timestamp)
  if(timestamp<=0){
   isAutoCollapse = false;
   collapse();
  }
 }

	function onCloseClick(event)
	{
		isAutoCollapse = false;
		collapse()
	}

	function onClickThrough(event) { 
        onCloseClick(event);
        EB.clickthrough(); 
    }

	function autoExpand()
	{
		panel.style.display = 'block';
		container.className = "expanded";
		isAutoExpand 		= true;
		expand();
	}

	function drawExpansion()
	{
		panelContainer.addEventListener(animationEndEvent, animationComplete);
		Utils.setClass(panelContainer,'expand-animation');
		if(mdisIE9)
		{
			setTimeout(expanded,100);
		}
	}

	function animationComplete()
	{
		panelContainer.removeEventListener(animationEndEvent, animationComplete);
		Utils.removeClass(panelContainer,'expand-animation');
		expanded();
	}

	function toggleVideo()
	{
		var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

		if(!isiPhone() && !iOS){
			video.addEventListener('mouseover', function() { this.controls = true; }, false);
			video.addEventListener('mouseout', function() { this.controls = false; }, false);
		}else{
			video.controls = true;
		}
	}

	function isiPhone(){
		return (
			//Detect iPhone
			(navigator.platform.indexOf("iPhone") != -1) ||
			//Detect iPod
			(navigator.platform.indexOf("iPod") != -1)
		);
	}

	function expanded()
	{
		var originalWidth = video.style.width;
		var originalHeight = video.style.height;
		video.style.width = '99.99%';
		video.style.height = '99.99%';
		setTimeout(function(){
			video.style.width = originalWidth;
			video.style.height = originalHeight;
		},10);
		setOrientation();
		autoPlayVideo();
		muteVideo();
	}

	function collapse()
	{
		pauseVideos();
		if(mdEnableExpandCollapseAnim)
		{
			panelContainer.addEventListener(animationEndEvent, collapsed);
			Utils.setClass(panelContainer,'collapse-animation');
			if(mdisIE9)
			{
				setTimeout(collapsed,100);
			}
		}else{
			if(mdisIE9)
			{
				setTimeout(collapsed,100);
			}else{
				collapsed();
			}
		}

	}

	function drawCollapse()
	{
		panel.style.display = "none";
		Utils.removeClass(panelContainer,'collapse-animation');
		panelContainer.removeEventListener(animationEndEvent, collapsed);
	}

	function collapsed()
	{
		drawCollapse();
		var actionType =  EBG.ActionType.AUTO;
		if(!isAutoCollapse)
		{
			actionType =  EBG.ActionType.USER;
		}
		EB.collapse({
			panelName: mdDefaultPanel,
			actionType: actionType
		});
	}

	function onPageResize()
	{
		setOrientation();
		setTimeout(setOrientation,100);
	}

	function setOrientation()
	{
		var vp;
		try{
			vp = Utils.getViewPort();
		}catch(e){
			return;
		}
		screenOrientation = vp.height >= (vp.width) ? "portrait" : "landscape";
		if(mdCropVideo){
			resizeWithCrop();
		}else{
			resizeWithoutCrop();
		}
	}

	function resizeWithoutCrop(){
		var viewport 	= Utils.getViewPort();
        var panelWidth 	= originalVideoWidth;
        var panelHeight	= originalVideoHeight;
        var buffer 		= 4;
        var rval 		= Utils.calculateAspectRatioFit(panelWidth,panelHeight,viewport.width,viewport.height- (headerSection.offsetHeight+buffer));
        panelContainer.style.width  = (rval.width)+'px';
        panelContainer.style.height = (rval.height+ (headerSection.offsetHeight+buffer))+'px';
        panelCreative.style.height 	= (panelContainer.offsetHeight - (headerSection.offsetHeight+buffer))+'px';
        creativeHotspot.style.height 	= (panelContainer.offsetHeight - 95)+'px';
    	updateElemClass();
	}

	function resizeWithCrop(){
		 panelContainer.style.width  = '870px';
		 panelContainer.style.height = '500px';
		 panelCreative.style.height 	= '100%';
		 //panelCreative.style.height 	= (panelContainer.offsetHeight - headerSection.offsetHeight-4)+'px';
		 panelCreative.style.height 	= '500px';
	 	 creativeHotspot.style.width 	= '868px';
	 	 creativeHotspot.style.height 	= '500px';
		 updateElemClass();
		 setHeaderBar();
		 resizeVideo();
	}
	function resizeVideo(){
	   	var resizeV = full_bleed(videoContainer.offsetWidth,videoContainer.offsetHeight,originalVideoWidth,originalVideoHeight)
	   	video.style.width=resizeV.width+'px';
	   	video.style.height=resizeV.height+'px';
	   	video.style.left=-(resizeV.width/2-videoContainer.offsetWidth/2)+'px';
	}
	function full_bleed(boxWidth, boxHeight, imgWidth, imgHeight) {
		// Calculate new height and width…
		var initW = imgWidth;
		var initH = imgHeight;
		var ratio = initH / initW;
		imgWidth = boxWidth;
		imgHeight = boxWidth * ratio;
		// If the video is not the right height, then make it so…
		if(imgHeight < boxHeight){
		imgHeight = boxHeight;
		imgWidth = imgHeight / ratio;
		}
		//  Return new size for video
		return {
		width: imgWidth,
		height: imgHeight
		}
	}

	function setHeaderBar()
	{/*
		var portraitRef  = document.getElementById('close-portrait');
		var landscapeRef = document.getElementById('close-landscape');
		var isCloseContainerDisplay = Utils.getComputedStyle(closeContainer,'display');
		if(screenOrientation == "portrait")
		{
			portraitRef.style.display  = 'block';
			landscapeRef.style.display = 'none';
		}else{
			landscapeRef.style.display = 'block';
			portraitRef.style.display  = 'none';

			var panelCreativeContainer = document.getElementById('panel-creative-container');
			var headerWidth    = closeContainer.offsetWidth;
			if(headerWidth > panelCreativeContainer.offsetWidth)
				{
				portraitRef.style.display  = 'block';
				landscapeRef.style.display = 'none';
			}else{
				landscapeRef.style.display = 'block';
				portraitRef.style.display  = 'none';
			}
		}
		return
	*/}

	function trackVideoInteractions(video)
	{
		var videoTrackingModule = new EBG.VideoModule(video);
	}

	function togglePlayAndPoster(_show)
	{
		if(_show)
		{
			playButton.style.display = 'block';
		}else{
			playButton.style.display = 'none';
		}
	}

	function initVideoListener()
	{
		if(playButton)
		{
			playButton.addEventListener('click',onPlayClick);
		}
		video.addEventListener("play", onVideoPlay);
		video.addEventListener("ended", onVideoEnd);
		video.addEventListener('timeupdate', videoTimeUpdateHandler, false);
		document.getElementById("Play").addEventListener("click", Playbutton);
		document.getElementById("Pause").addEventListener("click", Pausebutton);
		document.getElementById("SoundOn").addEventListener("click", Soundoffbutton);
		document.getElementById("SoundOff").addEventListener("click", Soundonbutton);
		document.getElementById("Replay").addEventListener("click", Replaybutton);
		//document.getElementById("panel-creative-container").addEventListener("mouseover", showcontrols);
		//document.getElementById("panel-creative-container").addEventListener("mouseout", hidecontrols);
			videofirstunmute();
	  function videofirstunmute() {
      video.addEventListener('volumechange', volume);
      var i = 0;
			function volume() {
				i++;
				console.log(i);
				if (i == 2) {
					console.log("PlayFromStart");
					video.currentTime = 0;
					video.play();
					video.muted = false;
					Soundonbutton();
				}
          }
     }
	}
	
	function showcontrols() {
        document.getElementById("controls").style.display =("block");
    }
	function hidecontrols() {
        document.getElementById("controls").style.display =("none");
    }
	function Playbutton() {
        console.log("Paused")
        video.play();
    }
	function Playbutton() {
        console.log("Paused")
        video.play();
    }
    function Pausebutton() {
        console.log("Playing")
        video.pause();
    }
    function Soundonbutton() {
        console.log("SoundOn")
        video.muted = false;
    }
    function Soundoffbutton() {
        console.log("SoundOff")
        video.muted = true;
    }
    function Replaybutton(){

		console.log("replay")
	  	document.getElementById("controls").style.display =("block");
		document.getElementById("Replay").style.display =("none");
		video.currentTime = 0;
		video.play();
		video.muted = false;
}
	function videoTimeUpdateHandler(e)
    {
        //video.setAttribute("controls","controls");

		if (video.muted == true) {

			document.getElementById("SoundOn").style.display = ("none");
			document.getElementById("SoundOff").style.display = ("block");
		}
		if (video.muted == false) {
			document.getElementById("SoundOff").style.display = ("none");
			document.getElementById("SoundOn").style.display = ("block");
		}

		if (video.paused == true) {
			document.getElementById("Pause").style.display = ("none");
			document.getElementById("Play").style.display = ("block");
		}
		if (video.paused == false) {
			document.getElementById("Play").style.display = ("none");
			document.getElementById("Pause").style.display = ("block");
		}

    }

	function onVideoPlay(evt)
	{
		togglePlayAndPoster(false);
		if(Utils.isMobile.iOS())
		{
			showVideo();
		}
	}

	function onVideoEnd()
	{
		try{
			video.pause();
			video.currentTime = 0.1;
		}catch(err){}

		if(Utils.isMobile.iOS())
		{
			hideVideo();
		}
		togglePlayAndPoster(true);


	console.log("VideoEnd");
	document.getElementById("Replay").style.display =("block");
	document.getElementById("controls").style.display =("none");
	}

	function removeVideoListener()
	{
		if(playButton)
		{
			playButton.removeEventListener('click',onPlayClick);
		}
	}

	function onPlayClick()
	{
		video.removeEventListener("play", onVideoPlay);
		video.removeEventListener("ended", onVideoEnd);
		// EB.userActionCounter('Video_OverlayPlay_Clicked');
		if(Utils.isMobile.iOS())
		{
			showVideo();
		}
		video.style.opacity = 0.2;
		togglePlayAndPoster(false);
		playVideo();
		unMuteVideo();
		setTimeout(function(){
			video.style.opacity = 1;
			video.addEventListener("play", onVideoPlay);
			video.addEventListener("ended", onVideoEnd);
		},100)

	}

	function autoPlayVideo()
	{
		//Fix to display video controls correctly when panel expand animation complete and video autoplay
		if(Utils.isBrowser.FireFox())
		{
			var originalWidth = video.style.width;
			video.style.width = '99.99%';
			setTimeout(function(){
				video.style.width = originalWidth;
			},10);
		}

		if(!Utils.isMobile.any())
		{
			playVideo();
			//muteVideo();
		}else{
			if(Utils.isMobile.iOS())
			{
				hideVideo();
			}
			togglePlayAndPoster(true);
		}
	}

	function playVideo()
	{
		togglePlayAndPoster(false);
		try{
			video.play();
		}catch(err){}
	}

	function showVideo(){ video.style.display = 'block'; }

	function hideVideo(){ video.style.display = 'none';  }

	function muteVideo(){ video.muted = true; }

	function unMuteVideo(){	video.muted = false; }

	function pauseVideos()
	{
		togglePlayAndPoster(true);
		try{
			video.pause();
			if(Utils.isMobile.iOS())
			{
				hideVideo();
			}
		}catch(err){}
	}

	function hideVideoControls(){
		video.removeAttribute("controls");
	}


	/*
		Update element class name when Ad goes to portrat or landscape mode.
		It use element ID and append landscape or portrait to create class name.
		For example : If you want to make Gallery that occupy full width in portrait
		and occupy few percentage lets say 40% in landscape then you need to create
		Two class name with gallery id + Mode. So two class name will be create as
		gallery_lanscape and gallery_portrait and applyed to gallery container whenever
		respective mode is displayed.
		This will help you to style each element depending or the portrait or landscape mode.
	*/
	function updateElemClass()
	{
		for (var i = 0; i < elemToResizeOnOrientation.length; i++)
		{
			var elem = elemToResizeOnOrientation[i].elemRef;
			if(screenOrientation=="portrait")
			{
				Utils.removeClass(elem,elem.id+'-'+"landscape");
			}else{
				Utils.removeClass(elem,elem.id+'-'+"portrait");
			}
			Utils.setClass(elem,elem.id+'-'+screenOrientation);
		};
	}

	function getuid()
	{
		if (EB._isLocalMode) {	return null;
		} else {				return EB._adConfig.uid;
		}
	}

	function onMessageReceived(event)
	{
		var msg;
		if (typeof event == "object" && event.data) {
			try{
				msg = JSON.parse(event.data);
			}catch(e){
				return;
			}
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
				case "resize":
					//panel resize;
				break;
			}
		}
	}

	function setCustomVar(customVarName, defaultValue, parseNum) {	//create global var with name = str, taking value from adConfig if it's there, else use default
		var value = defaultValue;
		if(!EB._isLocalMode){
			var value = EB._adConfig.hasOwnProperty(customVarName) ? EB._adConfig[customVarName] : defaultValue;
		}
		if (value === "true") value = true; //PENDING if we really need this check
		if (value === "false") value = false; //PENDING if we really need this check
		if (value === "undefined") value = undefined;
		if (arguments.length == 3 && parseNum && typeof value === "string") value = parseFloat(value);
		window[customVarName] = value;
	}

	function postMessageToParent(message){
		window.parent.postMessage(JSON.stringify(message), "*");
	}

	function registerAction(){		//this func is never called, it's parsed by the ad platform on upload of the ad

	}
}());












// (function() {

// 	"use strict";

//    //Variable Declaration
	
// 	var uid;
// 	var	container,
// 	closeButtonLandscape,
// 	closePortrait,
// 	frontclose,
// 	closeLightbox,
// 	hotspot,
// 	panel,
// 	panelCreative,
// 	headerSection,
// 	panelContainer,
// 	creativeHotspot,
// 	clicktThrough,
// 	playButton,
// 	panelContainerRatio,
// 	panelCurrentDimension,
// 	elemToResizeOnOrientation,
// 	screenOrientation,
// 	lightbox,
// 	animationEndEvent,
// 	isAutoExpand = false,
// 	closeContainer,
// 	videoContainer,
// 	video,
// 	originalVideoWidth = 480,
// 	originalVideoHeight = 270,
// 	logoContainer,
// 	timercheck = false,
// 	isAutoCollapse = true;

//   function initializeGlobalVariables()
// 	{
   
//         uid 					= getuid();
// 		container 				= document.getElementById("container");
// 		panel 					= document.getElementById("panel");
// 		headerSection			= document.getElementById("header-section");
// 		panelCreative			= document.getElementById("panel-creative");
// 		panelContainer			= document.getElementById("panel-container");
// 		creativeHotspot 		= document.getElementById("hotspot");
// 		closeLightbox 			= document.getElementById("panel-lightbox");
// 		closeButtonLandscape 	= document.getElementById("close-button-landscape");
// 		closePortrait			= document.getElementById("close-button-portrait");
// 		frontclose			    = document.getElementById("front_close-button");
// 		lightbox				= document.getElementById("panel-lightbox");
// 		closeContainer 			= document.getElementById('close-container');
// 		video 					= document.getElementById('video');
// 		videoContainer			= document.getElementById('video-container');
// 		logoContainer			= document.getElementById('logo-container');
// 		playButton 				= document.getElementById('video-play-button');
// 		hotspot 				= document.getElementById('hotspot');

// 	};



//  function toggleVideo()
// 	{
// 		var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// 		if(!isiPhone() && !iOS){
// 			video.addEventListener('mouseover', function() { this.controls = true; }, false);
// 			video.addEventListener('mouseout', function() { this.controls = false; }, false);
// 		}else{
// 			video.controls = true;
// 		}
// 	}


// function trackVideoInteractions(video)
// 	{
// 		var videoTrackingModule = new EBG.VideoModule(video);
// 	}





// function togglePlayAndPoster(_show)
// 	{
// 		if(_show)
// 		{
// 			playButton.style.display = 'block';
// 		}else{
// 			playButton.style.display = 'none';
// 		}
// 	}




// function initVideoListener()
// 	{
// 		if(playButton)
// 		{
// 			playButton.addEventListener('click',onPlayClick);
// 		}

// 		video.addEventListener("play", onVideoPlay);
// 		video.addEventListener("ended", onVideoEnd);
// 		video.addEventListener('timeupdate', videoTimeUpdateHandler, false);
// 		document.getElementById("Play").addEventListener("click", Playbutton);
// 		document.getElementById("Pause").addEventListener("click", Pausebutton);
// 		document.getElementById("SoundOn").addEventListener("click", Soundoffbutton);
// 		document.getElementById("SoundOff").addEventListener("click", Soundonbutton);
// 		document.getElementById("Replay").addEventListener("click", Replaybutton);

// 		videofirstunmute();
// 	  function videofirstunmute() {
//       video.addEventListener('volumechange', volume);
//       var i = 0;
// 			function volume() {
// 				i++;
// 				console.log(i);
// 				if (i == 2) {
// 					console.log("PlayFromStart");
// 					video.currentTime = 0;
// 					video.play();
// 					video.muted = false;
// 					Soundonbutton();
// 				}
//           }
// 	  }
// 	}

// //FOR TIMER

//   function checktime(event){
//   var timestamp = video.duration - video.currentTime;
//   var timetext = timestamp.toString();
//   if(timetext>=10){
//    timetext = timetext.substring(0,2);
//    document.getElementById("timer").innerHTML = "00:"+timetext;
//   }
//   else{
//    timetext = timetext.substring(0,1);
//    document.getElementById("timer").innerHTML = "00:0"+timetext;
//   }
//   //timetext = timetext.split('.').join(':');
//   //console.log(timestamp)
//   if(timestamp<=0){
//    isAutoCollapse = false;
//    collapse();
//   }
//  }
// //END TIMER


// 	function showcontrols() {
//         document.getElementById("controls").style.display =("block");
//     }
// 	function hidecontrols() {
//         document.getElementById("controls").style.display =("none");
//     }
// 	function Playbutton() {
//         console.log("Paused")
//         video.play();
//     }
// 	function Playbutton() {
//         console.log("Paused")
//         video.play();
//     }
//     function Pausebutton() {
//         console.log("Playing")
//         video.pause();
//     }
//     function Soundonbutton() {
//         console.log("SoundOn")
//         video.muted = false;
//     }
//     function Soundoffbutton() {
//         console.log("SoundOff")
//         video.muted = true;
//     }
//     function Replaybutton(){

// 		console.log("replay")
// 	  	document.getElementById("controls").style.display =("block");
// 		document.getElementById("Replay").style.display =("none");
// 		video.currentTime = 0;
// 		video.play();
// 		video.muted = false;
// }

// function videoTimeUpdateHandler(e)
//     {
//         //video.setAttribute("controls","controls");

// 		if (video.muted == true) {

// 			document.getElementById("SoundOn").style.display = ("none");
// 			document.getElementById("SoundOff").style.display = ("block");
// 		}
// 		if (video.muted == false) {
// 			document.getElementById("SoundOff").style.display = ("none");
// 			document.getElementById("SoundOn").style.display = ("block");
// 		}

// 		if (video.paused == true) {
// 			document.getElementById("Pause").style.display = ("none");
// 			document.getElementById("Play").style.display = ("block");
// 		}
// 		if (video.paused == false) {
// 			document.getElementById("Play").style.display = ("none");
// 			document.getElementById("Pause").style.display = ("block");
// 		}

//     }

// 		function onVideoPlay(evt)
// 	{
// 		togglePlayAndPoster(false);
// 		if(Utils.isMobile.iOS())
// 		{
// 			showVideo();
// 		}
// 	}

// 	function onVideoEnd()
// 	{
// 		try{
// 			video.pause();
// 			video.currentTime = 0.1;
// 		}catch(err){}

// 		if(Utils.isMobile.iOS())
// 		{
// 			hideVideo();
// 		}
// 		togglePlayAndPoster(true);


// 	console.log("VideoEnd");
// 	document.getElementById("Replay").style.display =("block");
// 	document.getElementById("controls").style.display =("none");
// }
// function removeVideoListener()
// 	{
// 		if(playButton)
// 		{
// 			playButton.removeEventListener('click',onPlayClick);
// 		}
// 	}

// 	function onPlayClick()
// 	{
// 		video.removeEventListener("play", onVideoPlay);
// 		video.removeEventListener("ended", onVideoEnd);
// 		// EB.userActionCounter('Video_OverlayPlay_Clicked');
// 		if(Utils.isMobile.iOS())
// 		{
// 			showVideo();
// 		}
// 		video.style.opacity = 0.2;
// 		togglePlayAndPoster(false);
// 		playVideo();
// 		unMuteVideo();
// 		setTimeout(function(){
// 			video.style.opacity = 1;
// 			video.addEventListener("play", onVideoPlay);
// 			video.addEventListener("ended", onVideoEnd);
// 		},100)

// 	}

// 	function autoPlayVideo()
// 	{
// 		//Fix to display video controls correctly when panel expand animation complete and video autoplay
// 		if(Utils.isBrowser.FireFox())
// 		{
// 			var originalWidth = video.style.width;
// 			video.style.width = '99.99%';
// 			setTimeout(function(){
// 				video.style.width = originalWidth;
// 			},10);
// 		}

// 		if(!Utils.isMobile.any())
// 		{
// 			playVideo();
// 			//muteVideo();
// 		}else{
// 			if(Utils.isMobile.iOS())
// 			{
// 				hideVideo();
// 			}
// 			togglePlayAndPoster(true);
// 		}
// 	}

// 	function playVideo()
// 	{
// 		togglePlayAndPoster(false);
// 		try{
// 			video.play();
// 		}catch(err){}
// 	}

// 	function showVideo(){ video.style.display = 'block'; }

// 	function hideVideo(){ video.style.display = 'none';  }

// 	function muteVideo(){ video.muted = true; }

// 	function unMuteVideo(){	video.muted = false; }

// 	function pauseVideos()
// 	{
// 		togglePlayAndPoster(true);
// 		try{
// 			video.pause();
// 			if(Utils.isMobile.iOS())
// 			{
// 				hideVideo();
// 			}
// 		}catch(err){}
// 	}

// 	function hideVideoControls(){
// 		video.removeAttribute("controls");
// 	}


// 	/*
// 		Update element class name when Ad goes to portrat or landscape mode.
// 		It use element ID and append landscape or portrait to create class name.
// 		For example : If you want to make Gallery that occupy full width in portrait
// 		and occupy few percentage lets say 40% in landscape then you need to create
// 		Two class name with gallery id + Mode. So two class name will be create as
// 		gallery_lanscape and gallery_portrait and applyed to gallery container whenever
// 		respective mode is displayed.
// 		This will help you to style each element depending or the portrait or landscape mode.
// 	*/
// 	function updateElemClass()
// 	{
// 		for (var i = 0; i < elemToResizeOnOrientation.length; i++)
// 		{
// 			var elem = elemToResizeOnOrientation[i].elemRef;
// 			if(screenOrientation=="portrait")
// 			{
// 				Utils.removeClass(elem,elem.id+'-'+"landscape");
// 			}else{
// 				Utils.removeClass(elem,elem.id+'-'+"portrait");
// 			}
// 			Utils.setClass(elem,elem.id+'-'+screenOrientation);
// 		};
// 	}

// 	function getuid()
// 	{
// 		if (EB._isLocalMode) {	return null;
// 		} else {				return EB._adConfig.uid;
// 		}
// 	}

// 	function onMessageReceived(event)
// 	{
// 		var msg;
// 		if (typeof event == "object" && event.data) {
// 			try{
// 				msg = JSON.parse(event.data);
// 			}catch(e){
// 				return;
// 			}
// 		}
// 		else {
// 			// this is safe frame.
// 			msg = {
// 				type: event.type,
// 				data: event
// 			};
// 		}
// 		if (msg.type && msg.data && (!uid || (msg.data.uid && msg.data.uid == uid))) {
// 			switch (msg.type) {
// 				case "resize":
// 					//panel resize;
// 				break;
// 			}
// 		}
// 	}

// 	function setCustomVar(customVarName, defaultValue, parseNum) {	//create global var with name = str, taking value from adConfig if it's there, else use default
// 		var value = defaultValue;
// 		if(!EB._isLocalMode){
// 			var value = EB._adConfig.hasOwnProperty(customVarName) ? EB._adConfig[customVarName] : defaultValue;
// 		}
// 		if (value === "true") value = true; //PENDING if we really need this check
// 		if (value === "false") value = false; //PENDING if we really need this check
// 		if (value === "undefined") value = undefined;
// 		if (arguments.length == 3 && parseNum && typeof value === "string") value = parseFloat(value);
// 		window[customVarName] = value;
// 	}

// 	function postMessageToParent(message){
// 		window.parent.postMessage(JSON.stringify(message), "*");
// 	}

// 	function registerAction(){		//this func is never called, it's parsed by the ad platform on upload of the ad

// 	}


	

// }());
