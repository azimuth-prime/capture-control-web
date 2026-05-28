captureControlApp.service('organizationService', function($http, authService) {
	this.findCustomersByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/search/customers", data, config); 
		});
	}
	
	this.findSuppliersByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/search/suppliers", data, config); 
		});
	}
	
	this.findByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/search", data, config); 
		});
	}
	
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/organization/" + id, config); 
		});
	}
	
	this.saveOrganization = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization", data, config); 
		});
	}
	
	this.saveBillToAddress = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/address/billTo", data, config); 
		});
	}
	
	this.createBillToAddress = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/address/billTo", data, config); 
		});
	}
	
	this.saveShipToAddress = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/address", data, config);
		});
	}
	
	this.deleteAddressById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/organization/address/" + id, config); 
		});
	}
	
	this.findAddressById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/organization/address/" + id, config); 
		});
	} 
	
	this.saveCreditInfo = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/credit", data, config); 
		});
	}
	
	this.saveNote = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/note", data, config);	
		});
	}
	
	this.saveContacts = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/organization/contacts", data, config);	
		});
	}
});