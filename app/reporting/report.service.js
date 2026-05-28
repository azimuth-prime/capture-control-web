captureControlApp.service('reportService', function($http, authService) {
	this.findOrdersByMonth = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/orders/month", config); 
		});
	}
	this.findOrdersByDay = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/orders/day", config); 
		});
	}	
	this.findRevenueByMonth = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/revenue/month", config); 
		});
	}
	this.findRevenueByDay = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/revenue/day", config); 
		});
	}
	this.findInvoiceStatus = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/invoice", config); 
		});
	}
	this.findWMSOrders = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/warehouse/orders", config); 
		});
	}
	this.findTopSellersLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/topsellers/last30", config); 
		});
	}
	this.findTopSellersLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/topsellers/lastyear", config); 
		});
	}
	this.findPLLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/revenue/pl/lastyear", config); 
		});
	}
	this.findPLLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/revenue/pl/last30", config); 
		});
	}
	this.findPurchaseOrdersAwaitingApproval = function(id){ 
		return authService.getConfig().then(function(config){
			if(id == undefined)
				return $http.get("/capture/purchase/open/approval", config); 
			else
			return $http.get("/capture/purchase/open/approval/" + id, config); 
		});
	}
	this.findPurchaseOrdersAwaitingReceipt = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/purchase/open/receipt", data, config);  
		});
	}
	this.findAveragePurchaseCycleLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/purchase/lifecycle/lastyear", config); 
		});
	}
	this.findAveragePurchaseCycleLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/purchase/lifecycle/last30", config); 
		});
	}
	this.findBackorderedItems = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/backorders/items", config); 
		});
	}
	this.findPurchaseOrderOpenCloseLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/purchase/state/last30", config); 
		});
	}
	this.findPurchaseOrderOpenCloseLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/purchase/state/lastyear", config); 
		});
	}
	this.findAverageInventoryValueLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/value/last30days", config); 
		});
	}
	this.findAverageInventoryValueLast6Months = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/value/last6months", config); 
		});
	}
	this.findAverageInventoryValueLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/value/lastyear", config); 
		});
	}
	this.findAverageInventoryValueByProductLast30Days = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/value/last30days/" + id, config); 
		});
	}
	this.findAverageInventoryValueByProductLast6Months = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/value/last6months/" + id, config); 
		});
	}
	this.findAverageInventoryValueByProductLastYear = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/value/lastyear/" + id, config);  
		});
	}
	this.findInventoryTurnoverLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/turnover/last30days", config); 
		});
	}
	this.findInventoryTurnoverLast6Months = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/turnover/last6months", config); 
		});
	}
	this.findInventoryTurnoverLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/turnover/lastyear", config); 
		});
	}
	this.findInventoryTurnoverByProductLast30Days = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/turnover/last30days/" + id, config); 
		});
	}
	this.findInventoryTurnoverByProductLast6Months = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/turnover/last6months/" + id, config);   
		});
	}
	this.findInventoryTurnoverByProductLastYear = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/turnover/lastyear/" + id, config); 
		});
	}
	this.findQtySoldByProductByMonth = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/sold/month/" + id, config); 
		});
	}
	this.findDaysSalesOfInventoryLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/dayssales/last30days", config); 
		});
	}
	this.findDaysSalesOfInventoryLast6Months = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/dayssales/last6months", config); 
		});
	}
	this.findDaysSalesOfInventoryLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/dayssales/lastyear", config); 
		});
	}
	this.findOrderConversionByMonth = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/orders/conversion/month", config); 
		});
	}
	this.findOrderConversionByDay = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/orders/conversion/day", config); 
		});
	}
	this.findInventoryToSalesRatioLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/sales/ratio/30day", config); 
		});
	}
	this.findInventoryToSalesRatioLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/sales/ratio/year", config); 
		});
	}
	this.findAverageInventoryPeriodLast30Days = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/period/30days", config); 
		});
	}
	this.findAverageInventoryPeriodLastYear = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/reporting/inventory/period/year", config); 
		});
	}
});