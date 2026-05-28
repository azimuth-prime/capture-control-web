captureControlApp.controller("salesReportController", function($scope, $routeParams, $window, $location, chartService, salesReportService){
	
	$scope.report = {fromDate: undefined, toDate: undefined};
	$scope.init = function(){
		console.log("init");
		$scope.report.fromDate = new Date(new Date().setDate(new Date().getDate() - 30));
		$scope.report.toDate = new Date();	
	}
	
	$scope.reportResult = {};
	$scope.findOrdersByDates = function(){
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		var data = $scope.report;
		salesReportService.findOrdersByDates(data).then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.findCancelledOrdersByDates = function(){
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		var data = $scope.report;
		salesReportService.findCancelledOrdersByDates(data).then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.findBackorderedOrders = function(){
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		salesReportService.findBackorderedOrders().then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.findOverdueOrders = function(){
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		salesReportService.findOverdueOrders().then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.findOrdersBySalesperson = function(){
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		var data = $scope.report;
		salesReportService.findOrdersBySalesperson(data).then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.findOrdersByCustomer = function(){
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		var data = $scope.report;
		salesReportService.findOrdersByCustomer(data).then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
});