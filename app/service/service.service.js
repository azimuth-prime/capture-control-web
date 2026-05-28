captureControlApp.service('serviceService', function($http, authService) {
	this.findByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/search", data, config); 
		});
	}
	
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/service/" + id, config); 
		});
	}
	
	this.save = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service", data, config); 
		});
	}
	
	this.findItemById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/service/item/" + id, config); 
		});
	}
	
	this.changeState = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/state", data, config); 
		});
	}
	
	this.sendRFQ = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/service/rfq/" + id, config); 
		});
	}
	
	this.issueServiceOrder = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/service/issue/" + id, config); 
		});
	}
	
	this.saveItems = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/item", data, config); 
		});
	}  
	
	this.findApplicableTaxes = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/service/taxes/" + id, config); 
		});
	} 
	
	this.setCarrier = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/carrier", data, config); 
		});
	}
	
	this.findItemsForServiceOrderInvoice = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/service/invoicable/" + id, config); 
		});
	}
	
	this.addInvoice = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/invoice", data, config); 
		});
	}
	
	this.findSOInvoice = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/service/invoice/" + id, config); 
		});
	}
	
	this.getServiceOrderForReceiving = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/service/receive/" + id, config); 
		});
	}
	
	this.receiveStock = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/receive", data, config); 
		});
	}
	
	this.saveSupplierAddress = function(data, id){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/address/" + id, data, config); 
		});
	}
	
	this.repriceInvoice = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.put("/capture/service/invoice", data, config); 
		});
	}
	
	this.downloadServiceOrderPDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/service/pdf/" + id, config2); 
		});
	}
	
	this.downloadServiceOrderPackSlipPDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/service/pdf/packslip/" + id, config2); 
		});
	}
	
	this.downloadServiceOrderIntlPackSlipPDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/service/pdf/packslipintl/" + id, config2); 
		});
	}
	
	this.printServiceOrder = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/print", data, config); 
		});
	}
	
	this.printServiceOrderPackSlip = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/print/packslip", data, config); 
		});
	}
	
	this.printServiceOrderIntlPackSlip = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/service/print/packslip/intl", data, config); 
		});
	}
});