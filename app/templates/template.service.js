captureControlApp.service('templateService', function($http, authService) {
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/templates/" + id, config); 
		});
	}
	this.findAll = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/templates", config); 
		});
	}	
	this.findByEntity = function(entity){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/templates/entity/" + entity, config); 
		});
	}
	this.save = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/templates", data, config); 
		});
	}
	
	this.getPDFPreview = function(id){
		return authService.getConfig().then(function(config){
			config.responseType = 'arraybuffer';
			return $http.get("/capture/templates/preview/pdf/" + id, config); 
		});
	} 
	
	this.findTemplatesByCategory = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/templates/category", data, config); 
		});
	}
});