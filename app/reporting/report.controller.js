captureControlApp.controller("reportController", function($scope, $http, $cookies, $rootScope, $routeParams, $window, $location, chartService, reportService){
	$scope.init = function(){
		userService.getCurrentUser().then(function(response){
			$window.sessionStorage.setItem("user", JSON.stringify(response.data));
			$scope.currentUser = response.data;
		});		
	}
	
	$scope.generateDashboardCharts = function(){
		$scope.updateOrdersByDay();
		$scope.findRevenue();
		
		$scope.findTopSellersLast30Days();
		$scope.findPLLast30Days();
		$scope.findPurchaseOrderOpenCloseLast30Days();
		$scope.findInvoiceOverall();
	}
	
	$scope.generatePurchaseReports = function(){
		$scope.generateInvEmergencyPurchaseRatio(); 
		$scope.generateInvSupplierPerf();
		$scope.findPurchaseOrdersAwaitingApproval();
		$scope.findPurchaseOrdersAwaitingReceipt();
		$scope.findAvgPurchaseLifecycleLastYear();
		$scope.findBackorderedItems();
	}
	
	$scope.generateProductReports = function(){
		$scope.findAverageInventoryValue('30days'); 
		$scope.findInventoryTurnover('30days');
		$scope.findDaysSalesOfInventory('30days');
		$scope.findInventoryToSalesRatio('30days');
		$scope.findAverageInventoryPeriodLast30Days('30days');
	}
	
	$scope.generateSalesOrderReports = function(){
		$scope.updateOrdersByDay();
		$scope.findRevenue();
		$scope.findOrderConversions('30days');
		$scope.findTopSellersLast30Days();
		$scope.findPLLast30Days();		
	}
	
	/* Order Reports */
	$scope.findTopSellersLastYear = function(){
		reportService.findTopSellersLastYear().then(function(res){
			$scope.topSellers = res.data;
			$scope.topSellers.period = "Last Year";
			$scope.topSellers.total = 0.00;
			for(var i=0; i<5; i++){
				$scope.topSellers.total += $scope.topSellers[i].total;
			}
		});
	}
	
	$scope.findTopSellersLast30Days = function(){
		reportService.findTopSellersLast30Days().then(function(res){
			$scope.topSellers = res.data;
			$scope.topSellers.period = "Last 30 Days";
			$scope.topSellers.total = 0.00;
			for(var i=0; i<5; i++){
				$scope.topSellers.total += $scope.topSellers[i].total;
			}
		});
	}
	
	/* Warehouse reports */
	$scope.findWMSOrders = function(){
		reportService.findWMSOrders().then(function(res){
			$scope.wmsOrders = res.data;
			/* Calculate Totals */
			$scope.wmsOrders.ordersToPickTotal = 0.00;
			$scope.wmsOrders.ordersToPackTotal = 0.00;
			$scope.wmsOrders.ordersToShipTotal = 0.00;
			$scope.wmsOrders.ordersToPick.forEach((item) => {
				$scope.wmsOrders.ordersToPickTotal += item.total;
			});
			$scope.wmsOrders.ordersToPack.forEach((item) => {
				$scope.wmsOrders.ordersToPackTotal += item.total;
			});
			$scope.wmsOrders.ordersToShip.forEach((item) => {
				$scope.wmsOrders.ordersToShipTotal += item.total;
			});
			$scope.generateWMSOrderChart();
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.generateWMSOrderChart = function(){
		Chart.defaults.font.family = 'Open Sans Condensed';
		Chart.defaults.font.size = 14;	
		var dataArray = [$scope.wmsOrders.ordersToPick.length, $scope.wmsOrders.ordersToPack.length, $scope.wmsOrders.ordersToShip.length];
		var labels = ['Pick', 'Pack', 'Ship'];
		var data = [
			{
				labels:[''],
				data: dataArray,
				backgroundColor: ['rgba(0, 76, 153, 1)','rgba(204, 229, 255, 1)', 'rgba(120, 229, 239, 1)']
			}
		];
		
		config = chartService.createDoughnutChart(labels, data, true);
		var orderStatusChart = new Chart($('#orderStatusChart'), config);
	}
	
	/* Sales Order Counts */
	var salesOrderChart = null; 
	$scope.updateOrdersChart = function(data, chartTitle) {
		Chart.defaults.font.family = 'Open Sans Condensed';
		Chart.defaults.font.size = 14;    
		  
		$scope.salesOrderChartMessage = chartTitle;
		$scope.salesOrdersTotal = 0;
		var xArray = [];
		var yArray = [];
		var total = 0;

		for (var i = 0; i < data.length; i++) {
			xArray.push(data[i].key);
			yArray.push(data[i].value);
			total += data[i].value;
			$scope.salesOrdersTotal += data[i].value;
		}

		if (salesOrderChart) {
			salesOrderChart.destroy();
		}

		var config = chartService.createBarChart(xArray, yArray, 'x', false);
		salesOrderChart = new Chart($('#salesOrderChart'), config);
	}

	$scope.updateOrdersByMonth = function() {
		reportService.findOrdersByMonth().then(function(res) {
			$scope.updateOrdersChart(res.data, "Sales Orders Last 12 Months");
		});
	};

	$scope.updateOrdersByDay = function() {
		reportService.findOrdersByDay().then(function(res) {
			$scope.updateOrdersChart(res.data, "Sales Orders Last 30 Days");
		});
	};

	/* Revenue Counts */	
	var salesChart = null;  
	$scope.findRevenue = function(period){
		if(salesChart) { salesChart.destroy(); }
		if(period == undefined){ period = '30days'; }
		
		switch(period){
			case '30days':
				reportService.findRevenueByDay().then(function(res){
					var data = res.data;
					$scope.salesRevenue = {total: 0.00, xArray: [], yArray: []};
					$scope.salesChartMessage = "Sales Revenue Last 30 Days";
					for(var i=0; i<data.length; i++){
						$scope.salesRevenue.xArray.push(data[i].key);
						$scope.salesRevenue.yArray.push(data[i].value);
						$scope.salesRevenue.total += data[i].value;
					}
					config = chartService.createLineChart($scope.salesRevenue.xArray,$scope.salesRevenue.yArray, false);
					salesChart = new Chart($('#salesChart'), config);
				});
				break;
			case 'year':
				reportService.findRevenueByMonth().then(function(res){
					var data = res.data;
					$scope.salesRevenue = {total: 0.00, xArray: [], yArray: []};
					$scope.salesChartMessage = "Sales Revenue Last 12 Months";
					for(var i=0; i<data.length; i++){
						$scope.salesRevenue.xArray.push(data[i].key);
						$scope.salesRevenue.yArray.push(data[i].value);
						$scope.salesRevenue.total += data[i].value;
					}
					config = chartService.createLineChart($scope.salesRevenue.xArray,$scope.salesRevenue.yArray, false);
					salesChart = new Chart($('#salesChart'), config);
				});
				break;
		}
	}
	
	var poChart = null;
	$scope.findPurchaseOrderOpenCloseLast30Days = function(){
		if (poChart) {
			poChart.destroy();
		}
		reportService.findPurchaseOrderOpenCloseLast30Days().then(function(res){
			$scope.openClosePosMessage = "Issued and Received Purchase Orders in the last 30 days";
			$scope.poOpenClose = { total: 0.00, titleArray: [], valueArray: [] };
			for(var i=0; i<res.data.length;i++){
				$scope.poOpenClose.titleArray.push(res.data[i].state);
				$scope.poOpenClose.valueArray.push(res.data[i].qty);
				$scope.poOpenClose.total += res.data[i].total;
			}
			config = chartService.createBarChart($scope.poOpenClose.titleArray, $scope.poOpenClose.valueArray, 'y', false); 
			poChart = new Chart($('#poChart'), config);
		});
	}
	
	$scope.findPurchaseOrderOpenCloseLastYear = function(){
		if (poChart) {
			poChart.destroy();
		}
		reportService.findPurchaseOrderOpenCloseLastYear().then(function(res){
			$scope.openClosePosMessage = "Issued and Received Purchase Orders in the last year";
			
			$scope.poOpenClose = { total: 0.00, titleArray: [], valueArray: [] };
			for(var i=0; i<res.data.length;i++){
				$scope.poOpenClose.titleArray.push(res.data[i].state);
				$scope.poOpenClose.valueArray.push(res.data[i].qty);
				$scope.poOpenClose.total += res.data[i].total;
			}
			config = chartService.createBarChart($scope.poOpenClose.titleArray, $scope.poOpenClose.valueArray, 'y', false); 
			poChart = new Chart($('#poChart'), config);
		});
	}
	
	/* Purchase Reports */
	$scope.generateInvEmergencyPurchaseRatio = function(){
		Chart.defaults.font.family = 'Open Sans Condensed';
		Chart.defaults.font.size = 14;	
	
		var data = [
			{
				labels:[''],
				data: ["10", "90"],
				backgroundColor: ['rgba(0, 76, 153, 1)','rgba(204, 229, 255, 1)']
			}
		];
		
		config = chartService.createDoughnutChart(["Emergency", "Regular"], data, false);
		var invEmergencyRatioChart = new Chart($('#invEmergencyRatioChart'), config);
	}
	
	$scope.generateInvSupplierPerf = function(){
		Chart.defaults.font.family = 'Open Sans Condensed';
		Chart.defaults.font.size = 14;	
	
		var data = [
			{
				labels:[''],
				data: ["10", "90"],
				backgroundColor: ['rgba(0, 76, 153, 1)','rgba(204, 229, 255, 1)']
			}
		];
		
		config = chartService.createBarChart(["OnTime", "Late"], [12, 3], 'y', false); 
		var invSupplierPerfChart = new Chart($('#invSupplierPerfChart'), config);
	}
	
	var plIncomeChart = null;
	$scope.findPLLastYear = function(){
		if (plIncomeChart) {
			plIncomeChart.destroy();
		}
		Chart.defaults.font.family = 'Open Sans Condensed';
		Chart.defaults.font.size = 14;		
		reportService.findPLLastYear().then(function(res){
			$scope.pl = res.data;
			$scope.pl.message = "Last Year";
			config = chartService.createBarChart(["Revenue", "Costs"], [res.data.totalRevenue, res.data.totalCost], 'y', false); 
			plIncomeChart = new Chart($('#plIncomeChart'), config);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findPLLast30Days = function(){
		if (plIncomeChart) {
			plIncomeChart.destroy();
		}
		Chart.defaults.font.family = 'Open Sans Condensed';
		Chart.defaults.font.size = 14;		
		reportService.findPLLast30Days().then(function(res){
			$scope.pl = res.data;
			$scope.pl.message = "Last 30 Days";
			config = chartService.createBarChart(["Revenue", "Costs"], [res.data.totalRevenue, res.data.totalCost], 'y', false); 
			plIncomeChart = new Chart($('#plIncomeChart'), config);
		}).catch(function(err){
			console.log(err);
		});
	}

	var invoiceChart = null;
	$scope.findInvoiceOverall = function(){
		console.log("invoice chart");
		if (invoiceChart) {
			invoiceChart.destroy();
		}
		reportService.findInvoiceStatus().then(function(res){
			aArray = [];
			bArray = [];
			$scope.invoiceTotal = 0.00;
			for(var i=0;i<res.data.length;i++){
				aArray.push(res.data[i].key);
				bArray.push(res.data[i].value);
				$scope.invoiceTotal += res.data[i].value;
			}
			config = chartService.createBarChart(aArray, bArray, 'y', false); 
			invoiceChart = new Chart($('#invoiceChart'), config);
		});
		
	}	
	
	$scope.findPurchaseOrdersAwaitingApproval = function(){
		reportService.findPurchaseOrdersAwaitingApproval().then(function(res){
			$scope.posForApproval = res.data;
		}).catch(function(err){
			$scope.posForApproval = [];
		});
	}
	
	$scope.findPurchaseOrdersAwaitingReceipt = function(pageNumber){
		var keyword = $scope.keyword;
		if($scope.keyword == undefined || $scope.keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 10};
		reportService.findPurchaseOrdersAwaitingReceipt(data).then(function(res){
			$scope.posForReceipt = res.data;			
		}).catch(function(err){
			$scope.posForReceipt = undefined;
		});
	}
	
	$scope.findAvgPurchaseLifecycleLast30 = function(){
		reportService.findAveragePurchaseCycleLast30Days().then(function(res){
			$scope.avgLifecycle = res.data;
			$scope.avgLifecycleMessage = "Average Days for Supplier Fulfillment in the Last 30 Days";
		});
	}
	$scope.findAvgPurchaseLifecycleLastYear = function(){
		reportService.findAveragePurchaseCycleLastYear().then(function(res){
			$scope.avgLifecycle = res.data;
			$scope.avgLifecycleMessage = "Average Days for Supplier Fulfillment in the Last Year";
		});
	}
	$scope.findBackorderedItems = function(){
		reportService.findBackorderedItems().then(function(res){
			$scope.backorderedItems = res.data;
			$scope.backorderedItems.total = 0;
			$scope.backorderedItems.forEach((item) => {
				$scope.backorderedItems.total += item.quantity;
			});
		}).catch(function(err){
			console.log(err);
		});
	}
	
	/* Product Reports */
	$scope.findAverageInventoryValue = function(period){
		switch(period){
			case '30days':
				reportService.findAverageInventoryValueLast30Days().then(function(res){
					$scope.inventoryValue = res.data;
					if($scope.inventoryValue.value == 0.00)
						$scope.inventoryValueMessage = "Average Inventory Value cannot be calculated over the selected period";
					else
						$scope.inventoryValueMessage = "Average Inventory Value over the past 30 Days";
				});
				break;
			case '6months':
				reportService.findAverageInventoryValueLast6Months().then(function(res){
					$scope.inventoryValue = res.data;
					if($scope.inventoryValue.value == 0.00)
						$scope.inventoryValueMessage = "Average Inventory Value cannot be calculated over the selected period";
					else
						$scope.inventoryValueMessage = "Average Inventory Value over the past 6 Months";
				});
				break;
			case 'year':
				reportService.findAverageInventoryValueLastYear().then(function(res){
					$scope.inventoryValue = res.data;
					if($scope.inventoryValue.value == 0.00)
						$scope.inventoryValueMessage = "Average Inventory Value cannot be calculated over the selected period";
					else
						$scope.inventoryValueMessage = "Average Inventory Value over the past Year";
				});
				break;
			default:
				$scope.inventoryValueMessage = "Average Inventory Value cannot be calculated over the selected period";
		}
	}
	
	$scope.findAverageInventoryValueByProduct = function(period){
		id = $routeParams.id;
		switch(period){
			case '30days':
				reportService.findAverageInventoryValueByProductLast30Days(id).then(function(res){
					$scope.inventoryValue = res.data;
					if($scope.inventoryValue.value == 0.00)
						$scope.inventoryValueMessage = "Average Inventory Value cannot be calculated over the selected period";
					else
						$scope.inventoryValueMessage = "Average Inventory Value over the past 30 Days";
				});
				break;
			case '6months':
				reportService.findAverageInventoryValueByProductLast6Months(id).then(function(res){
					$scope.inventoryValue = res.data;
					if($scope.inventoryValue.value == 0.00)
						$scope.inventoryValueMessage = "Average Inventory Value cannot be calculated over the selected period";
					else
						$scope.inventoryValueMessage = "Average Inventory Value over the past 6 Months";
				});
				break;
			case 'year':
				reportService.findAverageInventoryValueByProductLastYear(id).then(function(res){
					$scope.inventoryValue = res.data;
					if($scope.inventoryValue.value == 0.00)
						$scope.inventoryValueMessage = "Average Inventory Value cannot be calculated over the selected period";
					else
						$scope.inventoryValueMessage = "Average Inventory Value over the past Year";
				});
				break;
			default:
				$scope.inventoryValueMessage = "Average Inventory Value cannot be calculated over the selected period";
		}
	}
	
	$scope.findInventoryTurnover = function(period){
		switch(period){
			case '30days':
				reportService.findInventoryTurnoverLast30Days().then(function(res){
					$scope.inventoryTurnoverValue = res.data;
					if($scope.inventoryTurnoverValue.value == 0.00)
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio cannot be calculated over the selected period";
					else
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio over the past 30 Days";
				});
				break;
			case '6months':
				reportService.findInventoryTurnoverLast6Months().then(function(res){
					$scope.inventoryTurnoverValue = res.data;
					if($scope.inventoryTurnoverValue.value == 0.00)
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio cannot be calculated over the selected period";
					else
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio over the past 6 Months";
				});
				break;
			case 'year':
				reportService.findInventoryTurnoverLastYear().then(function(res){
					$scope.inventoryTurnoverValue = res.data;
					if($scope.inventoryTurnoverValue.value == 0.00)
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio cannot be calculated over the selected period";
					else
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio over the past Year";
				});
				break;
			default:
				$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio cannot be calculated over the selected period";
		}
	}
	
	$scope.findInventoryTurnoverByProduct = function(period){
		id = $routeParams.id;
		switch(period){
			case '30days':
				reportService.findInventoryTurnoverByProductLast30Days(id).then(function(res){
					$scope.inventoryTurnoverValue = res.data;
					if($scope.inventoryTurnoverValue.value == 0.00)
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio cannot be calculated over the selected period";
					else
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio over the past 30 Days";
				});
				break;
			case '6months':
				reportService.findInventoryTurnoverByProductLast6Months(id).then(function(res){
					$scope.inventoryTurnoverValue = res.data;
					if($scope.inventoryTurnoverValue.value == 0.00)
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio cannot be calculated over the selected period";
					else
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio over the past 6 Months";
				});
				break;
			case 'year':
				reportService.findInventoryTurnoverByProductLastYear(id).then(function(res){
					$scope.inventoryTurnoverValue = res.data;
					if($scope.inventoryTurnoverValue.value == 0.00)
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio cannot be calculated over the selected period";
					else
						$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio over the past Year";
				});
				break;
			default:
				$scope.inventoryTurnoverValueMessage = "Inventory Turnover Ratio cannot be calculated over the selected period";
		}
	}
	
	var productSalesChart = null;  
	$scope.findProductSalesByMonth = function() {
		if(productSalesChart) {
			productSalesChart.destroy();
		}
		reportService.findQtySoldByProductByMonth(id).then(function(res) {
			Chart.defaults.font.family = 'Open Sans Condensed';
			Chart.defaults.font.size = 14;    
			 
			$scope.productSales = res.data;
			$scope.productSalesChartMessage = "";
			$scope.productSales.total = 0;
			var xArray = [];
			var yArray = [];
			var total = 0;
	
			for (var i = 0; i < res.data.length; i++) {
				xArray.push($scope.productSales[i].key);
				yArray.push($scope.productSales[i].value);
				$scope.productSales.total += $scope.productSales[i].value;
			}
	
			if (salesChart) {
				salesChart.destroy();
			}
	
			var config = chartService.createLineChart(xArray,yArray, false);
			productSalesChart = new Chart($('#productSalesChart'), config);
		});
		
	}
	
	$scope.findDaysSalesOfInventory = function(period){
		switch(period){
			case '30days':
				reportService.findDaysSalesOfInventoryLast30Days().then(function(res){
					$scope.daysSales = res.data;
					if($scope.daysSales.value == 0.00)
						$scope.daysSalesValueMessage = "Days Sales Inventory cannot be calculated over the selected period";
					else
						$scope.daysSalesValueMessage = "Days Sales Inventory over the past 30 Days";
				});
				break;
			case '6months':
				reportService.findDaysSalesOfInventoryLast6Months().then(function(res){
					$scope.daysSales = res.data;
					if($scope.daysSales.value == 0.00)
						$scope.daysSalesValueMessage = "Days Sales Inventory cannot be calculated over the selected period";
					else
						$scope.daysSalesValueMessage = "Days Sales Inventory over the past 6 Months";
				});
				break;
			case 'year':
				reportService.findDaysSalesOfInventoryLastYear().then(function(res){
					$scope.daysSales = res.data;
					if($scope.daysSales.value == 0.00)
						$scope.daysSalesValueMessage = "Days Sales Inventory cannot be calculated over the selected period";
					else
						$scope.daysSalesValueMessage = "Days Sales Inventory over the past Year";
				});
				break;
			default:
				$scope.daysSalesValueMessage = "Days Sales Inventory cannot be calculated over the selected period";
		}
	}
	
	$scope.findInventoryToSalesRatio = function(period){
		switch(period){
			case '30days':
				reportService.findInventoryToSalesRatioLast30Days().then(function(res){
					$scope.salesRatio = res.data;
					if($scope.salesRatio.value == 0.00)
						$scope.salesRatioValueMessage = "Inventory to Sales Ratio cannot be calculated over the selected period";
					else
						$scope.salesRatioValueMessage = "Inventory to Sales Ratio over the past 30 Days";
				});
				break;
			case 'year':
				reportService.findInventoryToSalesRatioLastYear().then(function(res){
					$scope.salesRatio = res.data;
					if($scope.salesRatio.value == 0.00)
						$scope.salesRatioValueMessage = "Inventory to Sales Ratio cannot be calculated over the selected period";
					else
						$scope.salesRatioValueMessage = "Inventory to Sales Ratio over the past Year";
				});
				break;
			default:
				$scope.salesRatioValueMessage = "Inventory to Sales Ratio cannot be calculated over the selected period";
		}
	}
	
	$scope.findAverageInventoryPeriodLast30Days = function(period){
		switch(period){
			case '30days':
				reportService.findAverageInventoryPeriodLast30Days().then(function(res){
					$scope.inventoryPeriod = res.data;
					if($scope.inventoryPeriod.value == 0.00)
						$scope.inventoryPeriodValueMessage = "Inventory Period cannot be calculated over the selected period";
					else
						$scope.inventoryPeriodValueMessage = "Inventory Period over the past 30 Days";
				});
				break;
			case 'year':
				reportService.findAverageInventoryPeriodLastYear().then(function(res){
					$scope.inventoryPeriod = res.data;
					if($scope.inventoryPeriod.value == 0.00)
						$scope.inventoryPeriodValueMessage = "Inventory Period cannot be calculated over the selected period";
					else
						$scope.inventoryPeriodValueMessage = "Inventory Period over the past Year";
				});
				break;
			default:
				$scope.salesRatioValueMessage = "Inventory Period cannot be calculated over the selected period";
		}
	}
	
	/* Sales Order Reports */
	var soConversionChart = null;
	$scope.findOrderConversions = function(period){
		console.log("conversion method");
		if(soConversionChart) {
			soConversionChart.destroy();
		}
		if(period == undefined)
			period = '30days';
		switch(period){
			case '30days':
				reportService.findOrderConversionByDay().then(function(res){
					$scope.orderConversion = res.data;
					$scope.soConversionMessage = "Over the past 30 days " + $scope.orderConversion.convertedOrders + " of " 
						+ $scope.orderConversion.totalOrders + " sales orders have converted.";
					$scope.soConversion = { total: 0.00, titleArray: [], valueArray: [] };
					for(var i=0; i<res.data.items.length;i++){
						$scope.soConversion.titleArray.push(res.data.items[i].orderDate);
						$scope.soConversion.valueArray.push(res.data.items[i].conversionRate);
					}
					var config = chartService.createLineChart($scope.soConversion.titleArray,$scope.soConversion.valueArray, false);
					soConversionChart = new Chart($('#soConversionChart'), config);
				});
				break;
			case 'year':
				reportService.findOrderConversionByMonth().then(function(res){
					$scope.orderConversion = res.data;
					$scope.soConversionMessage = "Over the past 12 months " + $scope.orderConversion.convertedOrders + " of " 
						+ $scope.orderConversion.totalOrders + " sales orders have converted.";
					$scope.soConversion = { total: 0.00, titleArray: [], valueArray: [] };
					for(var i=0; i<res.data.items.length;i++){
						$scope.soConversion.titleArray.push(res.data.items[i].orderDate);
						$scope.soConversion.valueArray.push(res.data.items[i].conversionRate);
					}
					var config = chartService.createLineChart($scope.soConversion.titleArray,$scope.soConversion.valueArray, false);
					soConversionChart = new Chart($('#soConversionChart'), config);
				});
				break;
		}
	}
});
			