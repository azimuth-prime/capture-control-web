captureControlApp.controller("inventoryReportController", function($scope, $routeParams, $window, $location, chartService, inventoryReportService,
	warehouseService){
	$scope.report = {fromDate: undefined, toDate: undefined};
	$scope.getCurrentDate = function(){ return new Date();}
	
	$scope.findInventoryByKeyword = function(pageNumber){
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword, page: pageNumber, resultsPerPage: 30 };
    	inventoryReportService.findInventoryByKeyword(data).then(function(res){
			$scope.searchResults = res.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.sortResults = function(column){
		var sortDirection = $scope.searchResults.sortDirection;
		if(sortDirection == '+')
			sortDirection = "-";
		else
			sortDirection = "+";
		var data = { keyword: $scope.searchResults.keyword, page: 0, resultsPerPage: 30, sortBy: column, sortDirection: sortDirection };
		inventoryReportService.findInventoryByKeyword(data).then(function(res){
			$scope.searchResults = res.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.paFilter = {};
	$scope.findProductAvailability = function(pageNumber, resultsPerPage){
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
		if(resultsPerPage == undefined)
			resultsPerPage = 40;
		$scope.paFilter = { keyword: keyword, page: pageNumber, resultsPerPage: 30 };
		inventoryReportService.findProductAvailability($scope.paFilter).then(function(res){
			$scope.searchResults = res.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.sortResultsProductAvailability = function(column){
		var sortDirection = $scope.searchResults.sortDirection;
		if(sortDirection == '+')
			sortDirection = "-";
		else
			sortDirection = "+";
		$scope.paFilter = { keyword: $scope.searchResults.keyword, page: 0, resultsPerPage: 30, sortBy: column, sortDirection: sortDirection };
		inventoryReportService.findProductAvailability($scope.paFilter).then(function(res){
    			$scope.searchResults = res.data;
    			if($scope.searchResults.pages > 20)
    				$scope.searchResults.pages = 20;
    		});
	}
	
	$scope.productAvailabilityDownload = function(){
		$scope.paFilter.resultsPerPage = -1;
		inventoryReportService.productAvailabilityDownload($scope.paFilter).then(function(res){
			console.log(res.headers());
	        var linkElement = document.createElement('a');
	        try {
	            var blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
	            var url = window.URL.createObjectURL(blob); 
	            linkElement.setAttribute('href', url);
	            linkElement.setAttribute("download", "ProductAvailability.xlsx"); 
	            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
	            linkElement.dispatchEvent(clickEvent);
	        } catch (ex) {
	            console.log(ex);
	        }
		});
	}
	
	$scope.iaFilter = {};
	$scope.findInventoryAvailability = function(pageNumber, resultsPerPage){
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
		if(resultsPerPage == undefined)
			resultsPerPage = 40;
		$scope.iaFilter = { keyword: keyword, page: pageNumber, resultsPerPage: 30 };
		inventoryReportService.findInventoryAvailability($scope.iaFilter).then(function(res){
			$scope.searchResults = res.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.sortResultsInventoryAvailability = function(column){
		var sortDirection = $scope.searchResults.sortDirection;
		if(sortDirection == '+')
			sortDirection = "-";
		else
			sortDirection = "+";
		$scope.iaFilter = { keyword: $scope.searchResults.keyword, page: 0, resultsPerPage: 30, sortBy: column, sortDirection: sortDirection };
		inventoryReportService.findInventoryAvailability($scope.iaFilter).then(function(res){
    			$scope.searchResults = res.data;
    			if($scope.searchResults.pages > 20)
    				$scope.searchResults.pages = 20;
    		});
	}
	
	$scope.inventoryAvailabilityDownload = function(){
		$scope.iaFilter.resultsPerPage = -1;
		inventoryReportService.inventoryAvailabilityDownload($scope.iaFilter).then(function(res){
			console.log(res.headers());
	        var linkElement = document.createElement('a');
	        try {
	            var blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
	            var url = window.URL.createObjectURL(blob); 
	            linkElement.setAttribute('href', url);
	            linkElement.setAttribute("download", "ProductAvailability.xlsx"); 
	            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
	            linkElement.dispatchEvent(clickEvent);
	        } catch (ex) {
	            console.log(ex);
	        }
		});
	}
	
	$scope.findAdjustmentsByDates = function(){
		console.log("adjustments");
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		if($scope.report.fromDate == undefined || $scope.report.toDate == undefined){
			$scope.report.fromDate = new Date(new Date().setDate(new Date().getDate() - 30));
			$scope.report.toDate = new Date(); 	
		}
		
		var data = $scope.report;
		inventoryReportService.findAjustmentsByDates(data).then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.findInventoryReceiptsByDates = function(){
		console.log("receipts");
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		if($scope.report.fromDate == undefined || $scope.report.toDate == undefined){
			$scope.report.fromDate = new Date(new Date().setDate(new Date().getDate() - 30));
			$scope.report.toDate = new Date(); 	
		}
		
		var data = $scope.report;
		inventoryReportService.findInventoryReceiptsByDates(data).then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.findInventoryTransfersByDates = function(){
		console.log("transfers");
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		if($scope.report.fromDate == undefined || $scope.report.toDate == undefined){
			$scope.report.fromDate = new Date(new Date().setDate(new Date().getDate() - 30));
			$scope.report.toDate = new Date(); 	
		}
		
		var data = $scope.report;
		inventoryReportService.findInventoryTransfersByDates(data).then(function(res){
			$scope.reportResult = res.data;
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.spotCheck = {quantity:10};
	$scope.spotCheckType = undefined;
	$scope.findSpotCheck = function(){
		$scope.spotCheckType = undefined;
		$scope.loadingMessage = "Generating Report..."
		$("#processingDialog").modal("show");
		var data = $scope.spotCheck;
		if(data.type == 'location')
			inventoryReportService.findSpotCheckByLocations(data).then(function(res){
				$scope.results = res.data;
				$scope.spotCheckType = data.type;
				$("#processingDialog").modal("hide");
			}).catch(function(err){
				console.log(err);
				$("#processingDialog").modal("hide");
			});
		else
			inventoryReportService.findSpotCheckByProducts(data).then(function(res){
				$scope.results = res.data;
				$scope.spotCheckType = data.type;
				$("#processingDialog").modal("hide");
			}).catch(function(err){
				console.log(err);
				$("#processingDialog").modal("hide");
			});
	}
	
	$scope.findAllPhysicalWarehouses = function(){
		warehouseService.findAllPhysicalWarehouses().then(function(res){
			$scope.warehouses = res.data;
			if($scope.warehouses.length == 1)
				$scope.spotCheck.warehouseId = $scope.warehouses[0].id;
		});
	}
	
	/* Inventory Audit */
	$scope.audit = {};
	
	$scope.viewAudit = function(id){
		$location.path("reporting/inventory-audit/" + id);
	}
	
	$scope.setAuditWarehouse = function(item){
		$scope.audit.warehouse = item;
	}
	
	$scope.findAuditById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		inventoryReportService.findAuditById(id).then(function(res){
			$scope.audit = res.data;
		}).catch(function(err){
			console.log(err);
		});	
	}
	
	$scope.findAllAudits = function(pageNumber){
		if(pageNumber == undefined)
			pageNumber = 0;
		var data = { page: pageNumber, resultsPerPage: 30 };
		inventoryReportService.findAllAudits(data).then(function(res){
			$scope.searchResults = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveAudit = function(){
		var data = $scope.audit;
		inventoryReportService.saveAudit(data).then(function(res){
			$scope.viewAudit(res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
});