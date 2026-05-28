captureControlApp.controller("shippingController", function($scope, $routeParams, $location, shippingService, orderService, warehouseService, 
	invoiceService){

	$scope.findShippableOrderByKeyword = function(pageNumber){
		if($scope.keyword == undefined || $scope.keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 20 };
    	shippingService.findShippableOrderBykeyword(data)
    		.then(function(response){
    			$scope.searchResults = response.data;
    			if($scope.searchResults.pages > 30)
    				$scope.searchResults.pages = 30;
    		});
	} 
	
	$scope.viewShipDetails = function(id){
		$location.path("/ship-details/" + id);
	}
	
	$('#printInvoiceDialog').on('shown.bs.modal', function () {
  		$('#invoiceqty').focus()
	})
	
	$('#printPackSlipDialog').on('shown.bs.modal', function () {
  		$('#packslipqty').focus()
	})
	
	/* Shipping */
    $scope.addPackaging = function(){
		var data = {orderId:$scope.order.id, packages: [{grossWeight:0, netWeight:0, length:0, height:0, width:0, shipInfoId:$scope.order.price.shipInfo.id}]};
		shippingService.addPackaging(data).then(function(res){
			$scope.order = res.data;
			$scope.order.shippedDate = new Date();
			$scope.packageArray = $scope.order.price.shipInfo.packaging;
			$scope.showToast("Add Packaging", "Package removed.", true);
		}).catch(function(err){
			$scope.showToast("Add Packaging", err.data.errorMessage, false);
		});		
	}
	
	$scope.removePackaging = function(id){
		shippingService.removePackaging($scope.order.id, id).then(function(res){
			$scope.order = res.data;
			$scope.order.shippedDate = new Date();
			$scope.packageArray = $scope.order.price.shipInfo.packaging;
			$scope.showToast("Remove Packaging", "Package removed.", true);
		}).catch(function(err){
			$scope.showToast("Remove Packaging", err.data.errorMessage, false);
		});		
	}
	
	$scope.setPackaging = function(){
		/* send the packaging info to app. Receive back updated order obj */
		var data = {packages: $scope.order.price.shipInfo.packaging, orderId: $scope.order.id };
		
		shippingService.setPackaging(data).then(function(res){
			$scope.order = res.data;
			$scope.order.shippedDate = new Date();
			$scope.showToast("Set Packaging", "Packaging has been updated.", true);
		}).catch(function(err){
			$scope.showToast("Set Packaging", err.data.errorMessage, false);
		}); 
	}
	
	$scope.setPackageType = function(name){
		$scope.order.price.shipInfo.packageType = name;
	}
	
	/* Bracode Scanning */
    $scope.barcodeScanned = function(barcode) {        
        //console.log('callback received barcode: ' + barcode);                     
        $scope.findOrderById(barcode);        
    }; 
    
    $scope.findOrderById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		if(id != undefined){
			orderService.findById(id).then(function(res){
				$scope.order = res.data;
				$scope.order.shippedDate = new Date();
				$scope.packageArray = $scope.order.price.shipInfo.packaging;
				$scope.findAllPhysicalWarehouses();
			}).catch(function(err){
				console.log(err);
			});
		}else
			$scope.order = undefined;
	}
	
	$scope.findAllCarriers = function(){
		shippingService.findAllCarriers().then(function(res){
			$scope.carriers = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}	
	
	$scope.setCarrier = function(carrier){
		if(carrier.name != "Pickup"){
			var data = { id: $scope.order.id, carrierId: carrier.id, accountNumber: $scope.order.price.shipInfo.accountNumber };
			shippingService.setCarrier(data).then(function(res){
				$scope.order = res.data;
			}).catch(function(err){
				console.log(err);
			});
		}else{
			$scope.order.price.shipInfo.carrier = carrier;
		}
	}
	
	$scope.setPickupWarehouse = function(item){
		var carrier = $scope.order.price.shipInfo.carrier;
		if(carrier.name == "Pickup"){
			var data = { id: $scope.order.id, carrierId: carrier.id, pickupLocation: item.id};
			shippingService.setCarrier(data).then(function(res){
				$scope.order = res.data;
			}).catch(function(err){
				console.log(err);
			});
		}
	}
	
	$scope.findAllPhysicalWarehouses = function(){
		warehouseService.findAllPhysicalWarehouses().then(function(res){
			$scope.warehouses = res.data;
			if($scope.warehouses.length == 1)
				$scope.order.warehouse = $scope.warehouses[0];
		});
	}
	
	$scope.processing = false;
	$scope.shipOrder = function(){
		$scope.processing = true;
		$scope.loadingMessage = "Processing Sales Order..."
		$("#processingDialog").modal("show");
		var data = {orderId: $scope.order.id, shipInfo: $scope.order.price.shipInfo, shippedDate: $scope.order.shippedDate};
		shippingService.shipOrder(data).then(function(res){
			$scope.order = res.data;
			$scope.order.shippedDate = new Date();
			$("#processingDialog").modal("hide");
			$scope.processing = false;
			$scope.showToast("Ship Order", "Order has been shipped", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.processing = false;
			$scope.showToast("Ship Order", err.data.errorMessage, false);
		});		
	}
	
	$scope.print = {};
	$scope.printPDF = function(){
		if($scope.print.type == 'COMPACK'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			warehouseService.printCommercialPackSlip(data).then(function(res){
				$scope.print = {};
				$scope.showToast("Print Commercial Packing Slip", "Commercial Packing Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$scope.showToast("Print Commercial Packing Slip", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'COMINVOICE'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			invoiceService.printCommercialInvoice(data).then(function(res){
				$scope.print = {};
				$scope.showToast("Print Commercial Invoice", "Commercial Invoice Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$scope.showToast("Print Commercial Invoice", err.data.errorMessage, false);
			});
		}else{
			$scope.showToast("Print Document", "Document type is not defined.", false);
		}
	}
	
	/* Messaging */
    $scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}

});