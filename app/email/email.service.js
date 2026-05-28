captureControlApp.service('emailService', function($http, authService) {
	this.sendSalesOrderEmail = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/email", data, config); 
		});
	}
	
	this.sendInvoiceEmail = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/invoice/email", data, config); 
		});
	}
	
	this.sendPurchaseOrderEmail = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/email", data, config); 
		});
	}
});