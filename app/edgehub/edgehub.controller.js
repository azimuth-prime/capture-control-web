captureControlApp.controller("edgehubController", function($scope, $routeParams, $location, edgehubService, warehouseService, $interval){
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		edgehubService.findById(id).then(function(res){
			$scope.edgehub = res.data;
			$scope.findRunningScanJobs($scope.edgehub.id);
			$scope.findLast20ScanJobs($scope.edgehub.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findAll = function(){
		edgehubService.findAll().then(function(res){
			$scope.edgehubs = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.save = function(){
		var data = $scope.edgehub;
		edgehubService.save(data).then(function(res){
			$scope.edgehub = res.data;
			$scope.showToast("Save Edgehub Details", "Edgehub Updated", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Edgehub Details", err.data.errorMessage, false);
		});
	}
	
	$scope.createEdgehub = function(){
		var data = $scope.edgehub;	
		edgehubService.save(data).then(function(res){
			$("#newHubModal").modal("hide");
			$location.path("/edgehubs/" + res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.viewEdgehub = function(id){ $location.path("/edgehubs/" + id); }
	
	$scope.findAllPhysicalWarehouses = function(){
		warehouseService.findAllPhysicalWarehouses().then(function(res){
			$scope.warehouses = res.data;
		});
	}
	
	$scope.setWarehouse = function(warehouse){ $scope.edgehub.physicalWarehouse = warehouse; }
	
	$scope.getHubStats = function(id){
		if(id == undefined)
			id = $routeParams.id;
		edgehubService.getHubStats(id).then(function(res){
			$scope.hubStats = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findTagsByKeyword = function(pageNumber){
		$scope.loadingMessage = "Searching Tags...";
		$("#processingDialog").modal("show");
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), facets: $scope.selectedFacets, page: pageNumber, resultsPerPage: 20 };
    	edgehubService.findTagsByKeyword(data, $scope.edgehub.id)
    		.then(function(response){
    			$scope.searchResults = response.data;
    			if($scope.searchResults.pages > 30)
    				$scope.searchResults.pages = 30;
    			$("#processingDialog").modal("hide");
    		});
	}
	
	$scope.findRunningScanJobs = function(id){
		edgehubService.findRunningScanJobs(id).then(function(res){
			$scope.currentJob = res.data;
			if($scope.currentJob.id == undefined){
				$scope.currentJob = undefined;
			}else
				$scope.startPollingJobStatus($scope.currentJob.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findScanJobById = function(id){
		var data = { id: id, edgehub:$scope.edgehub.id };
		edgehubService.findScanJobById(data).then(function(res){
			$scope.currentJob = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findLast20ScanJobs = function(id){
		edgehubService.findLast20ScanJobs(id).then(function(res){
			$scope.searchResult = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.scanEdgehub = function(){
		edgehubService.scanEdgehub($scope.edgehub.id).then(function(res){
			$scope.startPollingJobStatus(res.data.id);
			$scope.showToast("Scan EdgeHub", "EdgeHub Scan started.", true);
		}).catch(function(err){
			console.log(err);
			$scope.scanMessage = err.data.message;
			$scope.findLast20ScanJobs($scope.edgehub.id);
			$scope.showToast("Scan EdgeHub", err.data.errorMessage, false);
		});
	}
	
	$scope.startPollingJobStatus = function(id){
        $scope.poller = $interval(function(){$scope.pollScanJobStatus(id)}, 5000, 0, true);
    }

    $scope.pollScanJobStatus = function(id){
		var data = { id: id, edgehub:$scope.edgehub.id };
    	edgehubService.findScanJobById(data).then(function(response){
    		$scope.currentJob = response.data;
            if($scope.currentJob.status != 'INPROGRESS')
            	$scope.stopPollingJobStatus();
    	});     
    }

    $scope.stopPollingJobStatus = function(){
        $interval.cancel($scope.poller);
        $scope.currentJob = undefined;
        $scope.findLast20ScanJobs($scope.edgehub.id);
    }
    
    $scope.viewTag = function(id){
		edgehubService.findTagById($scope.edgehub.id, id).then(function(res){
			$scope.tag = res.data;
			$scope.tag.creationDate = new Date($scope.tag.creationDate);
			$scope.tag.lastModifiedDate = new Date($scope.tag.lastModifiedDate);
			$scope.tag.lastFoundDate = $scope.tag.lastFoundDate == undefined ? '' : new Date($scope.tag.lastFoundDate);
			$("#tagModal").modal("show");
		}).catch(function(err){
			console.log(err);
			$scope.tag = undefined;
		});
	}
	
	$scope.printRFIDTag = function(id){
		edgehubService.printRFIDTag(id, $scope.edgehub.id).then(function(res){
			$("#tagModal").modal("hide");
			$scope.showToast("Reprint RFID Tag", "RFID Tag: " + id + " sent to printer.", true);
		}).catch(function(err){
			$scope.showToast("Reprint RFID Tag", err.data.errorMessage, false);
		});
	}
	
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
	
});