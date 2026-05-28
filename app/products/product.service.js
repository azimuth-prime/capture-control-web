captureControlApp.service('productService', function($http, authService) {
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/product/" + id, config); 
		});
	}
	
	this.findAll = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/product", config); 
		});
	}
	
	this.findSkusByProductId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/product/skus/" + id, config); 
		});
	}
	
	this.findProductsByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/product/search", data, config); 
		});
	}
	
	this.findInventoryByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/search", data, config); 
		});
	}
	
	this.findAvailableInventoryByKeywordAndWarehouse = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/search/available/warehouse", data, config); 
		});
	}
	
	this.saveProduct = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/product", data, config); 
		});
	}
	
	this.saveStockUnit = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/product/config/stockunit", data, config); 
		});
	}
	
	this.findStockUnitById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/product/config/stockunit/" + id, config); 
		});
	}
	
	this.deleteStockUnit = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/product/config/stockunit/" + id, config);  
		});
	}
});