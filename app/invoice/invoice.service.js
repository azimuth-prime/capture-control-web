captureControlApp.service('invoiceService', function($http, authService) {
	this.findByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/invoice/search", data, config); 
		});
	}
	
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/invoice/" + id, config); 
		});
	}
	
	this.findInvoicesByCustomerId = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/invoice/customer/search", data, config); 
		});
	}
	
	this.findInvoicesByOrderId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/invoice/order/" + id, config); 
		});
	}
	this.receivePayment = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/invoice/payment", data, config); 
		});
	}
	this.printCommercialInvoice = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/invoice/print/commercial", data, config); 
		});
	}	
	this.printInvoice = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/invoice/print", data, config); 
		});
	}	
	this.downloadInvoicePDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/invoice/pdf/" + id, config2); 
		});
	}
	this.downloadCommercialInvoicePDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/invoice/pdf/commercial/" + id, config2); 
		});
	}
	
	this.cancelInvoice = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/invoice/" + id, config); 
		});
	}
});