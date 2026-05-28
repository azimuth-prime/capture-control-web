captureControlApp.service('configService', function($http, authService) {
	this.findPaymentConfigData = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/payment/config", config); 
		});
	}
	
	this.findCurrencyById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/payment/currency/" + id, config); 
		});
	}
	
	this.deleteCurrencyById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/payment/currency/" + id, config);
		});
	}
	
	this.saveCurrency = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/payment/currency", data, config); 
		});
	}
	
	this.findGlobalConfig = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/config/global", config); 
		});
	}
	
	this.saveGlobalConfig = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/config/global", data, config);	
		});
	}
	
	this.setParameter = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/config/global/parameter", data, config); 
		});
	}
	
	this.saveCompanyInfo = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/config/global/companyinfo", data, config); 
		});
	}
	
	this.findAllPrinters = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/config/global/printers", config); 
		});
	}
	
	this.saveProductLabelPrinterInfo = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/config/global/printers", data, config);	
		});
	}
	
	this.getIntuitData = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/integration/intuit/config", config); 
		});
	}
	
	this.removeIntuitAccount = function(){
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/integration/intuit/remove", config); 
		});
	}
	
	this.setGLAccount = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/integration/intuit/account", data, config); 
		});
	}
	
	this.setProductType = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/integration/intuit/item", data, config); 
		});
	}
	
	this.setLoggingLevel = function(data){
		return authService.getConfig().then(function(config){
			$http.post("/capture/actuator/loggers/com.capture", data, config);
		});
	}
	
	this.getLoggingLevel = function(){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/actuator/loggers/com.capture", config);
		});
	}
		
	this.getLog = function(){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/config/global/logging/getLog", config);
		});
	}
	
	this.resetAdminPassword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/config/global/admin/password", data, config);
		});
	}
	
	this.getAllTaxes = function(){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/tax", config);
		});
	}
	
	this.getTaxById = function(id){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/tax/" + id, config);
		});
	}
	
	this.saveTax = function(data){
		return authService.getConfig().then(function(config){
			return $http.post("/capture/tax", data, config);
		});
	}
	
	this.getAllIntuitTaxes = function(){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/tax/intuit", config);
		});
	}
});