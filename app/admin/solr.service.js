captureControlApp.service('solrService', function($http, authService) {
	this.findByid = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/solr/index/" + id, config); 
		});
	}
	
	this.findAllIndexes = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/solr/index", data, config); 
		});
	}
	
	this.clearOldIndexJobs = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/solr/index/clear", config); 
		});
	}
	
	this.isExisting = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/solr/index/activity", config); 
		});
	}
	
	this.index = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/solr/index/start", config); 
		});
	}
	
	this.incrementalIndex = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/solr/index/start/incremental", config); 
		});
	}
});