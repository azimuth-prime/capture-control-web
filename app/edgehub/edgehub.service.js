captureControlApp.service('edgehubService', function($http, authService) {
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/" + id, config); 
		});
	}
	this.findAll = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub", config); 
		});
	}
	this.save = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/edgehub", data, config); 
		});
	}  
	this.getHubStats = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/stats/" + id, config); 
		});
	}
	this.findTagById = function(edgehub, tagId){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/tag/" + edgehub + "/" + tagId, config); 
		});
	}
	this.findTagsByInventoryId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/inventory/" + id, config); 
		});
	}
	this.findTagsByKeyword = function(data, id){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/edgehub/tag/keyword/" + id, data, config); 
		});
	} 
	this.findScanJobById = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/scanjob/" + data.edgehub + "/" + data.id, config); 
		});
	}
	this.findLast20ScanJobs = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/scanjob/history/" + id, config); 
		});
	}
	this.findRunningScanJobs = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/scanjob/" + id, config); 
		});
	}
	this.scanEdgehub = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/scanjob/fullscan/" + id, config); 
		});
	}
	this.printRFIDTag = function(id, edgehub){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/edgehub/printtag/"+ id + "/" + edgehub, config); 
		});
	}
});