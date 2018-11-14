define(
	{
		"adFormatId": 10355,	
		"name": "CIT_RELEASED_Interstitial_1.1.0_1x1_video", 
		"defaultBanner": "Main_Banner",
		"defaultPanel": "default",		
		"banners": [
			{
				"name": "Main_Banner",
				"width": 1,
				"height": 1,
				"defaultImage": "images/backup.jpg"
			}
		], 		
		"panels": [
			{
				"name": "default",
				"width": 1,
				"height": 1,
				"asset": "panels/default/index.html",
				"x": 0,
				"y": 0,
				"delayedExpansion": false,
				"positionType": "pageRelativePixels",
				"autoCollapse": "never"			
			}
		],
		"clickThrough": {
			"url": "http://www.sizmek.com/?defaultClickthrough",
			"target": "newWindow",
			"showMenuBar": true,
			"showAddressBar": true,
			"closePanels": false
		},
		"customInteractions": [
			{
				"name": "UserAction",
				"reportingName": "User Action",
				"type": "userAction",
				"includeInRate": true,
				"closePanels": false
			}
		],
		"variables": [
			{
				"key": "mdParentLevelsToResize",
				"value": "0"
			},
			{
				"key": "mdBackupImgPath",
				"value": "undefined"
			},
			{
				"key": "mdAutoRepositionInterval",
				"value": "0"
			},
			{
				"key": "mdIsDomainConfigEnabled",
				"value": "false"
			},
			{
				"key": "mdProgSettingsFolderPath",
				"value": "//services.serving-sys.com/programmatic/DomainList/"
			},
			{
				"key": "mdEyeDivZIndex",
				"value": "undefined"
			},
			{
				"key": "mdAutoCollapseTimer",
				"value": "7000"
			},
			{
				"key": "mdInteractionsCancelAutoCollapse",
				"value": "true"
			},
			{
				"key": "mdRemoveAdAfterCollapsed",
				"value": "true"
			},
			{
				"key": "mdLockScrollingWhenExpanded",
				"value": "true"
			},
			{
				"key": "mdEnableSDKDefaultCloseButton",
				"value": "false"
			},
			{
				"key": "mdAutoPlayVideo",
				"value": "true"
			}
		]
	}
);