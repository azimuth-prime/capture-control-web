captureControlApp.service('purchaseService', function($http, authService) {
	this.findPosByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/search", data, config); 
		});
	}
	
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/" + id, config); 
		});
	}
	
	this.save = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase", data, config); 
		});
	}
	
	this.findPOItemById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/item/" + id, config); 
		});
	}
	
	this.changeState = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/state", data, config); 
		});
	}
	
	this.issuePO = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/issue/" + id, config); 
		});
	}
	
	this.savePOItems = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/item", data, config); 
		});
	}  
	
	this.getPOForReceiving = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/receive/" + id, config); 
		});
	}
	
	this.findPriceListBySupplierId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/pricelist/" + id, config); 
		});
	}
	
	this.findAllPriceLists = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/pricelist", config); 
		});
	}
	
	this.savePriceListItem = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/pricelist/item", data, config); 
		});
	}
	
	this.saveItemsToPriceList = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/pricelist/items", data, config); 
		});
	}
	
	this.deletePriceListItem = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.delete("/capture/purchase/pricelist/" + id, config); 
		});
	}
	
	this.savePLItems = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/pricelist/items", data, config); 
		});
	}
	
	this.findRestockByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/pricelist/search", data, config); 
		});
	}
	
	this.findRestockBySkuId = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/pricelist/sku/" + id, config); 
		});
	}
		
	this.receiveStock = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/receive", data, config); 
		});
	}
	
	this.findPOsBySupplier = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/vendor", data, config); 
		});
	}  
	
	this.findVendorsNotInRestock = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/vendor/restock/" + id, config); 
		});
	}
	
	this.saveVendorPricelistItem = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/pricelist/item", data, config); 
		});
	}
	
	this.findApplicableTaxes = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/taxes/" + id, config); 
		});
	} 
	
	this.setCarrier = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/carrier", data, config); 
		});
	}
	
	this.findItemsForPOInvoice = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/invoicable/" + id, config); 
		});
	}
	
	this.repriceInvoice = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.put("/capture/purchase/invoice", data, config); 
		});
	}
	
	this.addInvoice = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/invoice", data, config); 
		});
	}
	
	this.findPOInvoice = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/invoice/" + id, config); 
		});
	}
	
	this.printPurchaseOrder = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/print/" + id, config); 
		});
	}
	
	this.reorderPO = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/reorder", data, config); 
		});
	}
	
	this.addReorderPO = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/reorder/recurring", data, config); 
		});
	}
	
	this.findAllReorderPOs = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/purchase/reorder/recurring", config); 
		});
	}
	
	this.findPurchaseOrdersByState = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/report/state", data, config); 
		});
	}
	this.downloadPOPDF = function(id){
		return authService.getConfig().then(function(config){
			var config2 = angular.copy(config);
			config2.responseType = 'blob';
			return $http.get("/capture/purchase/pdf/" + id, config2); 
		});
	}
});