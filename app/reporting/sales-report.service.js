captureControlApp.service('salesReportService', function($http, authService) {
	this.findOrdersByDates = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/sales/report/summarybydate", data, config); 
		});
	}
	this.findCancelledOrdersByDates = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/reporting/cancelled", data, config); 
		});
	}
	this.findBackorderedOrders = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/reporting/backordered", config); 
		});
	}
	this.findOverdueOrders = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/order/reporting/overdue", config); 
		});
	}
	this.findOrdersBySalesperson = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/reporting/sales/salesperson", data, config); 
		});
	}
	this.findOrdersByCustomer = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/order/reporting/sales/customer", data, config); 
		});
	}
});
