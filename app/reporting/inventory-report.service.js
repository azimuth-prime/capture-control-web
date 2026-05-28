captureControlApp.service('inventoryReportService', function($http, authService) {
	this.findInventoryByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/reporting/search", data, config); 
		});
	}
	this.findProductAvailability = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/product/reporting/product/availability", data, config); 
		});
	}
	this.productAvailabilityDownload = function(data){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.post("/capture/product/reporting/product/availability/download", data, config2); 
		});
	}
	this.findInventoryAvailability = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/reporting/availability", data, config); 
		});
	}
	this.inventoryAvailabilityDownload = function(data){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.post("/capture/inventory/reporting/availability/download", data, config2); 
		});
	}
	this.findAjustmentsByDates = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/reporting/adjustments", data, config); 
		});
	}
	this.findInventoryReceiptsByDates = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/reporting/receipts", data, config); 
		});
	}
	this.findSpotCheckByLocations = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/reporting/spotcheck/location", data, config); 
		});
	}
	this.findSpotCheckByProducts = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/reporting/spotcheck/product", data, config); 
		});
	}
	this.findInventoryTransfersByDates = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/reporting/transfers", data, config); 
		});
	}
	/* Audit */
	this.findAuditById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/audit/" + id, config); 
		});
	}
	this.findAllAudits = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/audit/audits", data, config); 
		});
	}
	this.saveAudit = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/audit", data, config); 
		});
	}
	
	
});