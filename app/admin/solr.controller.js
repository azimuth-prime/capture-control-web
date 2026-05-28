captureControlApp.controller("solrController", function($scope, solrService, $interval){
	
	$scope.isExisting = function(){
		solrService.isExisting().then(function(res){
			$scope.indexJob = res.data;
			if($scope.indexJob.id != null){
				/* start polling */
				$scope.startPollingJobStatus(res.data.id);
			}else{
				$scope.indexJob = undefined;
			}
		});
		
	}
	
	$scope.findByid = function(id){
		solrService.findByid(id).then(function(res){
			$scope.indexJob = res.data;
		});
	}
	
	$scope.clearOldIndexJobs = function(){
		solrService.clearOldIndexJobs().then(function(res){
			/* Toast Message */
			$scope.findAllIndexes();
			$scope.showToast("Manage Indexes", "All old search indexes cleared.", true);
		}).catch(function(err){
			$scope.showToast("Manage Indexes", err.data.errorMessage, false);
		});
	}
	
	$scope.startIndex = function(){
		solrService.index().then(function(res){
			//console.log(res.data);
			$scope.startPollingJobStatus(res.data.id);
			$scope.showToast("Start Indexing", "Search indexing started.", true);
		}).catch(function(err){
			$scope.showToast("Start Indexing", err.data.errorMessage, false);
		});
	}
	
	$scope.startIncrementalIndex = function(){
		solrService.incrementalIndex().then(function(res){
			$scope.startPollingJobStatus(res.data.id);
			$scope.showToast("Start Indexing", "Incremental search indexing started.", true);
		}).catch(function(err){
			$scope.showToast("Start Indexing", err.data.errorMessage, false);
		});
	}
	
	$scope.findAllIndexes = function(pageNumber){
		if(pageNumber == undefined)
			pageNumber = 0;
		var data = { page: pageNumber, resultsPerPage: 20}; 
		solrService.findAllIndexes(data).then(function(res){
			$scope.searchResults = res.data;
			$scope.searchResults.results.forEach((item) => {
				item.elapsedTime = 0;
				item.elapsedTime = (new Date(item.endDate) - new Date(item.startDate)) / 1000;
			});
		}).catch(function(err){
			$scope.searchResults = {};
		});
	}
	
	/* Polling Methods */
	$scope.startPollingJobStatus = function(id){
		 $scope.poller = $interval(function(){$scope.pollIndexJobStatus(id)}, 2000, 0, true);
    }

    $scope.pollIndexJobStatus = function(id){
        solrService.findByid(id).then(function(response){
                $scope.indexJob = response.data;
                //$scope.subPublishPercent = (($scope.currentJob.currentPublishCount * 1) / ($scope.currentJob.currentPublishTotalCount * 1)) * 100;
                if($scope.indexJob.state != 'PROCESSING')
                    $scope.stopPollingJobStatus();
            });     
    }

    $scope.stopPollingJobStatus = function(){
        if(angular.isDefined($scope.poller)) {
            $interval.cancel($scope.poller);
            $scope.findAllIndexes();
            $scope.indexJob = undefined;
        }
    }
    
    $scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
});