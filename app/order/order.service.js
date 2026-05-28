captureControlApp.service('orderService', function($http, authService) {
	this.findOrderByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/search", data, config); 
		});
	}
	
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/" + id, config); 
		});
	}
	
	this.findOrderItemById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/item/" + id, config); 
		});
	}
	
	this.saveOrderItems = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/items", data, config); 
		});
	}
	
	this.removeOrderItem = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/order/item/" + id, config); 
		});
	}
	
	this.save = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order", data, config); 
		});
	}
	
	this.updateBillToAddress = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/address/billto", data, config); 
		});
	}
	
	this.updateShipToAddress = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/address/shipto", data, config); 
		});
	}
	
	this.changeOrderState = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/state", data, config); 
		});
	}
	
	this.findOrdersByCustomerId = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/customer", data, config); 
		});
	}
	
	this.findApplicableTaxesByOrderId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/taxes/" + id, config); 
		});
	}
	
	this.updateOrderWithApplicableTaxes = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/taxes", data, config); 
		});
	}
	
	this.saveDiscount = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/discount", data, config); 
		});
	}
	
	this.deleteDiscount = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.put("/capture/order/discount", data, config); 
		});
	}
	
	this.saveOrderPaymentInfo = function(id, item){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/payment/" + id, item, config); 
		});
	}
	
	this.generateInvoiceByOrderId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/invoice/order/invoice/" + id, config); 
		});
	}  
	
	this.findOrderByBackorder = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/backorders", data, config); 
		});
	}  
	
	this.findPickableOrderBykeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/picking", data, config); 
		});
	}  
	
	this.findExpectedAvailabilityDate = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/expectedDate/" + id, config); 
		});
	} 
	
	this.bookOrder = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/bookorder/" + id, config); 
		});
	} 
	
	this.customerStats = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/customer/stats/" + id, config);  
		});
	} 
	
	this.printOrder = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/print", data, config); 
		});
	} 
	
	this.setShipEstimate = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/ship/estimate", data, config); 
		});
	} 
	
	this.downloadSalesOrderPDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/order/pdf/" + id, config2); 
		});
	}
});