captureControlApp.service('shippingService', function($http, authService) {
	this.findCarrierById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/carrier/" + id, config); 
		});
	}

	this.findAllCarriers = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/carrier", config); 
		});
	}
	
	this.saveCarrier = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/carrier", data, config); 
		});
	}
	
	this.setCarrier = function(data){  
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/carrier", data, config); 
		});
	}
	
	this.getCarrierQuote = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/carrier/quote/" + id, config); 
		});
	}
	
	this.shipOrder = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/shipping", data, config); 
		});
	}
	
	this.findShippableOrderBykeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/shipping/search", data, config); 
		});
	} 
	
	this.setPackaging = function(data){
		return authService.getConfig().then(function(config){
			return $http.post("/capture/shipping/packaging", data, config); 
		});
	}
	
	this.addPackaging = function(data){
		return authService.getConfig().then(function(config){
			return $http.post("/capture/shipping/packaging/add", data, config); 
		});
	}
	
	this.removePackaging = function(orderId, packageId){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/shipping/packaging/"+ orderId + "/" + packageId, config); 
		});
	}
});


