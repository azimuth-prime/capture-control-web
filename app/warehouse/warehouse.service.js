captureControlApp.service('warehouseService', function($http, authService) {
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/warehouse/" + id, config); 
		});
	}
	
	this.findAll = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/warehouse", config); 
		});
	}
	
	this.save = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/warehouse", data, config); 
		});
	}
	
	this.findPickSlipById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/picking/" + id, config); 
		});
	} 
	
	this.findOrderForPacking = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/packing/" + id, config); 
		});
	} 
	
	this.packItem = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/packing", data, config); 
		});
	}
	
	this.packOrder = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/packing/order", data, config); 
		});
	}
	
	this.printPackSlip = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/packing/print", data, config); 
		});
	} 
	
	this.printPickSlip = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/picking/print", data, config); 
		});
	} 
	
	this.printCommercialPackSlip = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/packing/print/commercial", data, config); 
		});
	} 
	
	this.findAllInventoryCodes = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/inventory", authService.getConfig()); 
		});
	}
	
	this.validateLotSerial = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/packing/lotserial", data, config); 
		});
	}
	
	this.pickOrder = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/picking", data, config); 
		});
	}  
	
	this.findPickableOrderBykeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/picking/search", data, config); 
		});
	} 
	
	this.findPackableOrderBykeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/packing/search", data, config); 
		});
	} 
	
	this.generateBulkPickslip = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/picking/bulk", config); 
		});
	}
	
	this.generateSelectBulkPickslip = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/picking/bulk", data, config); 
		});
	}
	
	this.findAllPhysicalWarehouses = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/warehouse/physical", config);  
		});
	}
	
	this.findEdgehubByWarehouseId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/warehouse/rfid/" + id, config); 
		});
	}
	
	this.validateName = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/warehouse/name", data, config); 
		});
	}
	
	this.findAvailableInventoryByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/search/available", data, config); 
		});
	} 
	
	this.findAllOpenTransfers = function(){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/warehouse/transfer/open", config); 
		});
	}
	
	this.findTransferById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/warehouse/transfer/" + id, config); 
		});
	}
	
	this.deleteTransferById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/warehouse/transfer/" + id, config); 
		});
	}
	
	this.saveTransfer = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/warehouse/transfer", data, config); 
		});
	} 
	
	this.addItemToTransfer = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/warehouse/transfer/item", data, config); 
		});
	} 
	
	this.removeItemFromTransfer = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.put("/capture/warehouse/transfer/item", data, config); 
		});
	}  
	this.transferStock = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/warehouse/transfer/confirm/" + id, config); 
		});
	} 
	this.downloadPackingSlipPDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/packing/pdf/" + id, config2); 
		});
	}
	this.downloadCommercialPackingSlipPDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/packing/pdf/commercial/" + id, config2); 
		});
	}
});