captureControlApp.service('rmaService', function($http, authService) {
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/rma/" + id, config); 
		});
	}
	
	this.generateRMAItems = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/rma/new/" + id, config); 
		});
	}
	
	this.findAll = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/rma", config); 
		});
	}
	
	this.findByCustomerId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/rma/customer/" + id, config); 
		});
	}
	
	this.findAllReasons = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/rma/reasons", config); 
		});
	}
	
	this.save = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/rma", data, config); 
		});
	}
	
	this.saveItemsToRMA = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/rma/items", data, config); 
		});
	}
});