captureControlApp.service('importService', function($http, authService) {
	this.importProducts = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/product/import", data, config); 
		});
	}

	this.importSkus = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/sku/import", data, config); 
		});
	}
	
	this.importInventory = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/import", data, config); 
		});
	}
});



	