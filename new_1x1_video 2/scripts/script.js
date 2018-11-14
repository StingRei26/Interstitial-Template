/*******************
VARIABLES
*******************/
var creativeId = "Banner"; //Use anything that uniquely identifies this creative
var creativeVersion = "1.0.1"; //0.0.1 during initial dev, 1.0.0 on release, x.x.x once released and receives updates
var lastModified = "2017-11-27";
var lastUploaded = "2017-11-27";

var templateVersion = "2.0.24";
var sdkData;
var adId, rnd, uid;

/*******************
INITIALIZATION
*******************/
function checkIfAdKitReady(event) {
	adkit.onReady(initializeCreative);
}

function initializeCreative(event) {

	try {	//try/catch just in case localPreview.js is not included
		if(window.localPreview) {
			window.initializeLocalPreview(); //in localPreview.js
		}
	}
	catch(e) {}

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
	setCreativeVersion();
}

function initializeGlobalVariables() {
	adId = EB._adConfig.adId;
	rnd = EB._adConfig.rnd;
	uid = EB._adConfig.uid;
	
}

function registerInteraction() {
	//Register your automatic and user interactions here and the platform will parse them on workspace upload. This function will not be called.
	//Example: 'Left_Gutter_Viewed'
	//EB.automaticEventCounter("interactionName1");
	//EB.automaticEventCounter("interactionName2");

	//EB.userActionCounter("userActionName1");
	//EB.userActionCounter("userActionName2");
}

/*******************
EVENT HANDLERS
*******************/

/*******************
UTILITIES
*******************/

function setCreativeVersion() {
	sendMessage("setCreativeVersion", {
		creativeId: creativeId,
		creativeVersion: creativeVersion,
		creativeLastModified: lastModified,
		uid: uid
	});
}

/*********************************
HTML5 Event System - Do Not Modify
*********************************/
var listenerQueue;
var creativeIFrameId;

function sendMessage(type, data) {

	//note: the message type we're sending is also the name of the function inside
	//		the custom script's messageHandlers object, so the case must match.

	if(!data.type) data.type = type;
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
	if(listenerQueue[listenerId])
		delete listenerQueue[listenerId];
}

function eventManager(event) {

	var msg;
	if(typeof event == "object" && event.data) {
		msg = JSON.parse(event.data);

	}
	else {
		// this is safe frame.
		msg = {
			type: event.type,
			data: event
		};
	}
	if(msg.type && msg.data && (!uid || (msg.data.uid && msg.data.uid == uid))) {
		switch(msg.type) {
		case "sendCreativeId":
			creativeIFrameId = msg.data.creativeIFrameId;
			addCustomScriptEventListener('pageScroll', onPageScroll);
			sendMessage("dispatchScrollPos", {
				uid: uid
			});
			if(creativeContainerReady)
				creativeContainerReady();
			break;
		case "eventCallback": // Handle Callback
			var list = msg.data.listenerIds;
			var length = list.length;
			for(var i = 0; i < length; i++) {
				try {
					var t = listenerQueue[list[i]];
					if(!t) continue;
					t.callback(msg.data);
				}
				catch(e) {}
			}
			break;
		}
	}
}

window.addEventListener("message", function () {
	try {
		eventManager.apply(this, arguments);
	}
	catch(e) {}
}, false);
/*************************************
End HTML5 Event System - Do Not Modify
*************************************/

window.addEventListener("load", checkIfAdKitReady);