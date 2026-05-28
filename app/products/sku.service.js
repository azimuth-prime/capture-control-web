captureControlApp.service('skuService', function($http, authService) {
	this.findSkuById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/sku/" + id, config); 
		});
	}
	
	this.findSkuConfigInfo = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/sku/config", config); 
		});
	}
	
	this.saveColorSwatch = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/sku/config/color", data, config); 
		});
	}
	
	this.findColorSwatchById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/sku/config/color/" + id, config); 
		});
	}
	
	this.deleteColorSwatch = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/sku/config/color/" + id, config); 
		});
	}
	
	this.saveSizing = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/sku/config/sizing", data, config); 
		});
	}
	
	this.findSizingById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/sku/config/sizing/" + id, config); 
		});
	}
	
	this.deleteSizing = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/sku/config/sizing/" + id, config); 
		});
	}
	
	this.saveSku = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/sku", data, config); 
		});
	}
	
	this.updateLot = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.put("/capture/inventory", data, config); 
		});
	}
	
	this.createLot = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory", data, config); 
		});
	}
	
	this.findInventoryById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/inventory/" + id, config); 
		});
	}
	
	this.findTransactionsByInventoryId = function(id){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/inventory/transactions/" + id, config); 
		});
	}
	
	this.findInventoryBySkuId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/inventory/sku/" + id, config); 
		});
	}
	
	this.saveInventory = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory", data, config); 
		});
	}
	
	this.saveWarehouse = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/warehouse", data, config); 
		});
	}
	
	this.findWarehouseById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/inventory/warehouse/" + id, config); 
		});
	}
	
	this.deleteWarehouse = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/inventory/warehouse/" + id, config); 
		});
	}
	
	this.serialExists = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/serial/lookup", data, config); 
		});
	}
	
	this.lotExists = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/lot/lookup", data, config); 
		});
	}
	
	this.findComponentSkuByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/sku/search", data, config); 
		});
	}
	
	this.findSkuByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.put("/capture/sku/search", data, config); 
		});
	}  
	
	this.saveSkuDimensions = function(data, id){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/sku/dimensions/" + id, data, config); 
		});
	}
	
	this.findLocationsBySkuId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/sku/location/" + id, config); 
		});
	}
	
	this.printLabels = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/inventory/printlabel", data, config); 
		});
	}
	
	this.printRFIDTag = function(id, inventoryId){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/inventory/printtag/"+ id + "/" + inventoryId, config); 
		});
	}
	
	this.findSkuByColorId = function(id){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/color/"+ id, config); 
		});
	}
	
	this.findSkuBySizingId = function(id){
		return authService.getConfig().then(function(config){
			return $http.get("/capture/sizing/"+ id, config); 
		});
	}
	
	this.findSkuSales = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/sku/sales", data, config); 
		});
	}
	
	this.deleteInventoryMediaById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/inventory/media/" + id, config); 
		});
	}
	
	this.deleteSkuMediaById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/sku/media/" + id, config); 
		});
	}
	
	this.deletePriceById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/sku/price/" + id, config); 
		});
	}
});