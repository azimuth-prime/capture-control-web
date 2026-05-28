captureControlApp.controller("skuController", function($scope, $routeParams, $location, skuService, purchaseService, configService, warehouseService, edgehubService,
	authService, $http){
	
	$scope.inventoryTypes = ['INVENTORIED', 'DROPSHIP', 'INFINITE'];
	$scope.setInventoryType = function(type){
		$scope.sku.inventoryType = type;
	}
	
	/* Global */
	$scope.findGlobalConfig = function(){
		//console.log("find global config");
		configService.findGlobalConfig().then(function(res){
			$scope.globalConfig = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findAllPaymentConfigData = function(){
		configService.findPaymentConfigData().then(function(res){
			$scope.paymentConfigData = res.data;
			$scope.updateAvailableCurrencies();
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.updateAvailableCurrencies = function(){
		/* Remove any currencies that are already in the sku.prices list.*/
		$scope.availableCurrencies = [];
		for(var i=0; i<$scope.paymentConfigData.currencies.length; i++){
			var found = false;
			if($scope.sku.prices != undefined){
				for(var x=0; x<$scope.sku.prices.length; x++){
					if($scope.sku.prices[x].currencyCode == $scope.paymentConfigData.currencies[i].code)
						found = true;
				}
			}
			
			if(!found)
				$scope.availableCurrencies.push($scope.paymentConfigData.currencies[i]);
		}
	}
	
	$scope.findSkuConfigInfo = function(){
		skuService.findSkuConfigInfo().then(function(res){
			$scope.skuConfig = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	/* SKUs */
	$scope.findSkuById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		skuService.findSkuById(id).then(function(res){
			$scope.sku = res.data;
			$scope.sku.creationDate = new Date($scope.sku.creationDate);
			$scope.sku.lastModifiedDate = new Date($scope.sku.lastModifiedDate);
			$scope.sku.availabilityDate = new Date($scope.sku.availabilityDate);
			$scope.findAllPaymentConfigData();
		}).catch(function(err){
			console.log(err);
			$scope.errorMessage = err;
		});
	}
	
	$scope.findSkuSales = function(id, pageNumber){
		if(pageNumber == undefined)
			pageNumber = 0;
		var data = { keyword: id, page: pageNumber, resultsPerPage: 30 };
		skuService.findSkuSales(data).then(function(res){
			$scope.salesHistory = res.data;
		});
	}
	
	$scope.saveSku = function(){
        $scope.loadingMessage = "Saving SKU... ";
        $("#processingDialog").modal("show");
		var data = $scope.sku;
		if(data.productId == undefined)
			data.productId = $scope.product.id;
		
		skuService.saveSku(data).then(function(res){
			$scope.findSkuById(res.id);
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});	
	}
	
	$scope.findLocationsBySkuId = function(id){
		if(id == undefined)
			id = $routeParams.id;
		skuService.findLocationsBySkuId(id).then(function(res){
			$scope.locations = res.data;
		});
	}
	
	/* Inventory */
	$scope.newInventoryItem = function(){
		$scope.invitem = {};   
		$("#newLotModal").modal("show");
	}
	
	$scope.viewInventory = function(id){
		$location.path("/products/skus/inventory/" + id);
	}
	
	$scope.updateLot = function(){
		var data = $scope.invitem;
		skuService.updateLot(data).then(function(res){
			$scope.invitem = res.data;
			$scope.invitem.receivedDate = ($scope.invitem == undefined) ?  null : new Date(res.data.receivedDate);
			$scope.showToast("Update Inventory Item", "Inventory Item/Lot Updated", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Update Inventory Item", err.data.errorMessage, false);
		});
	}
	
	$scope.newItem = { warehouse: {id: '', name: '', description: ''}};
	$scope.createLot = function(){
		var lotModal = angular.element("#newLotModal");		
		var data = $scope.invitem;
		data.skuId = $scope.sku.id;
		data.state = "ACTIVE";
		skuService.createLot(data).then(function(res){
			lotModal.modal("hide");
			$location.path("/products/skus/inventory/" + res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findInventoryById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		skuService.findInventoryById(id).then(function(res){
			$scope.invitem = res.data;
			$scope.invitem.receivedDate = ($scope.invitem == undefined) ?  null : new Date(res.data.receivedDate);
			$scope.findLocationsBySkuId($scope.invitem.skuId); 
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findTransactionsByInventoryId = function(id){
		if(id == undefined)
			id = $routeParams.id;
		skuService.findTransactionsByInventoryId(id).then(function(res){
			$scope.transactions = res.data;
		}).catch(function(err){
			console.log(err);
		});
		
	}
	
	$scope.findEdgeHubByWarehouseId = function(id){
		warehouseService.findEdgehubByWarehouseId(id).then(function(res){
			$scope.edgehub = res.data;
		}).catch(function(err){
			console.log(err);
			$scope.edgehub = undefined;
		});
		
	}
	
	$scope.newRestockItem = function(){
		$scope.restock = {stockUnit: 'EACH'};
		$("#newRestockModal").modal("show");
	}
	
	$scope.getWarehouses = function(inventoryList){
		var warehouses = "";
		inventoryList.forEach(function(item){
			warehouses += item.warehouse.name;
		});
	}
	
	$scope.setWarehouse = function(id){
		for(var i=0;i<$scope.skuConfig.warehouses.length;i++){
			if(id == $scope.skuConfig.warehouses[i].id){		
				$scope.invitem.warehouse = $scope.skuConfig.warehouses[i];
				break;	
			}
		}
		/* Check if warehouse has rfid enabled */
		$scope.findEdgeHubByWarehouseId($scope.invitem.warehouse.id);
	}
	
	$scope.printLabels = function(){
		var data = { inventoryId: $scope.invitem.id, productLabelQty: $scope.label.pLabelQty, rfidLabelQty: $scope.label.rLabelQty };
		skuService.printLabels(data).then(function(res){
			$("#printModal").modal("hide");
			$scope.showToast("Print Labels", "Lot/Serial: " + $scope.invitem.lotSerial + " sent to printer.", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Print Labels", err.data.errorMessage, false);
		});
	}
	
	$scope.findRFIDTagsByInventoryId = function(id){
		if($scope.globalConfig.rfidEnabled){
			edgehubService.findTagsByInventoryId($scope.invitem.id).then(function(res){
				$scope.tags = res.data;
			}).catch(function(err){
				console.log(err);
				$scope.tags = undefined;
			});
		}
	}
	
	$scope.printRFIDTag = function(id, inventoryId){
		skuService.printRFIDTag(id, inventoryId).then(function(res){
			$("#tagModal").modal("hide");
			$scope.showToast("Reprint RFID Tag", "RFID Tag: " + id + " sent to printer.", true);
		}).catch(function(err){
			$scope.showToast("Reprint RFID Tag", err.data.errorMessage, false);
		});
	}
	
	$scope.viewTag = function(id){
		warehouseService.findEdgehubByWarehouseId($scope.invitem.warehouse.id).then(function(res){
			edgehubService.findTagById(res.data.id, id).then(function(res){
				$scope.tag = res.data;
				$scope.tag.creationDate = new Date($scope.tag.creationDate);
				$scope.tag.lastModifiedDate = new Date($scope.tag.lastModifiedDate);
				$scope.tag.lastFoundDate = $scope.tag.lastFoundDate == undefined ? '' : new Date($scope.tag.lastFoundDate);
				$("#tagModal").modal("show");
			}).catch(function(err){
				console.log(err);
				$scope.tag = undefined;
			});
		}).catch(function(err){
			console.log(err);
			$scope.tag = undefined;
		});
	}
	
	/* Create an empty sku object with the default structure defined for new skus. */
	$scope.sku = { colorSwatch: {name: '', hexCode: '', id: ''}, sizing: { id: '', name: ''}};
	
	$scope.setColor = function(id){
		for(var i=0;i<$scope.skuConfig.colorSwatches.length;i++){
			if(id == $scope.skuConfig.colorSwatches[i].id){		
				$scope.sku.colorSwatch = $scope.skuConfig.colorSwatches[i];
				break;	
			}
		}
	}
	
	$scope.setSize = function(id){
		for(var i=0;i<$scope.skuConfig.sizings.length;i++){
			if(id == $scope.skuConfig.sizings[i].id){		
				$scope.sku.sizing = $scope.skuConfig.sizings[i];
				break;	
			}
		}
	}
	
	$scope.serialMessage = undefined;
	$scope.lotSerial = false;
	$scope.serialLotExists = function(){
		console.log("serialExists Method");
		if($scope.sku.controlType == 'LOT'){
			console.log("controlType is LOT");
			var data = {warehouseId: $scope.invitem.warehouse.id, serialNumber: "\"" + $scope.invitem.lotSerial + "\"", skuId: $scope.sku.id };
			skuService.lotExists(data).then(function(res){
				$scope.newLotForm.nLotSerial.$valid = true;
				$scope.newLotForm.$valid = true;
				$scope.serialMessage = undefined;
			}).catch(function(err){
				console.log(err.data);
				$scope.newLotForm.nLotSerial.$invalid = true;
				$scope.newLotForm.$invalid = true;
				$scope.serialMessage = err.data.errorMessage;
			});
		}else{
			console.log("controlType is SERIAL");
			/* Send SKU ID and Serial Value */
			var skuId = $scope.sku.id;
			if(skuId == undefined)
				skuId = $scope.invitem.skuId;
			var data = {skuId: skuId, serialNumber: $scope.invitem.lotSerial};
			skuService.serialExists(data).then(function(res){
				$scope.newLotForm.nLotSerial.$valid = true;
				$scope.newLotForm.$valid = true;
				$scope.serialMessage = undefined;
			}).catch(function(err){
				console.log(err.data);
				$scope.newLotForm.nLotSerial.$invalid = true;
				$scope.newLotForm.$invalid = true;
				$scope.serialMessage = err.data.errorMessage;
			});
		}
		
	}
	
	$scope.findRestockBySkuId = function(id){
		if(id == undefined)
			id = $routeParams.id;
		purchaseService.findRestockBySkuId(id).then(function(res){
			$scope.restocks = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveVendorPricelistItem = function(){
		var data = $scope.restock;
		if(data.skuId == undefined)
			data.skuId = $routeParams.id;
		purchaseService.saveVendorPricelistItem(data).then(function(res){
			$("#newRestockModal").modal("hide");
			$scope.findRestockBySkuId(res.data.skuId);
			$scope.showToast("Add Vendor Pricelist Item", "Pricelist Item Added", true);
		}).catch(function(err){
			console.log(err);
			$("#newRestockModal").modal("hide");
			$scope.showToast("Add Vendor Pricelist Item", err.data.errorMessage, false);
		})
	}
	
	$scope.saveSkuDimensions = function(){
		var data = $scope.sku.dimensions;
		skuService.saveSkuDimensions(data, $scope.sku.id).then(function(res){
			$scope.findSkuById();
			$scope.showToast("Save SKU Dimensions", "SKU Dimensions Saved", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save SKU Dimensions", err.data.errorMessage, false);
		});
	}
	
	$scope.findComponentSkuByKeyword = function(pageNumber){
		if($scope.keyword != undefined && $scope.keyword.length >= 3){
    		if(pageNumber == undefined)
    			pageNumber = 0;
	    	var data = { keyword: $scope.keyword.toUpperCase(), page: pageNumber, resultsPerPage: 20, filters: ["COMPONENTS"] };
	    	skuService.findComponentSkuByKeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    			if($scope.searchResults.pages > 30)
	    				$scope.searchResults.pages = 30;
	    		})
    	}else{
    		$scope.searchResults = undefined;
    	}
	}
	
	$scope.findVendorsNotInRestock = function(id){
		purchaseService.findVendorsNotInRestock(id).then(function(res){
			$scope.vendors = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	/* Media */ 
	$scope.mediaFiles = [];
    $scope.getFileDetails = function(e){  
		$scope.$apply(function () {
        	for(var i = 0; i < e.files.length; i++) {
                $scope.mediaFiles.push(e.files[i])
            }
        });
    };
    
    $scope.uploadInventoryMedia = function(id){
		$("#mediaModal").modal("hide");
    	$("#processingDialog").modal("show");
        var data = new FormData();
        //console.log($scope.mediaFiles[0]);
        data.append("files", $scope.mediaFiles[0]);
        switch($scope.mediaFiles[0].type){
			case "application/pdf":
	     		data.append("type", "PDF");
	     		break;
	     	case "image/jpg":
	     		data.append("type", "IMAGE");
	     		break;
	     	case "image/png":
	     		data.append("type", "IMAGE");
	     		break;
	     	case "image/jpeg":
	     		data.append("type", "IMAGE");
	     		break;
        };
         
        authService.getConfig().then(function(config){
			//console.log("AuthToken: " + config.headers.Authorization);
			var fileUploadConfig = { withCredentials: true, transformRequest: angular.identity, headers: {'Content-Type': undefined, 'Authorization': config.headers.Authorization }}
			console.log(fileUploadConfig);
			
			 $http.post("/capture/inventory/uploadmedia/" + id, data, fileUploadConfig).then(function(res){
	     		//console.log("in success function");
	     		$scope.mediaFiles = [];
	     		$("#processingDialog").modal("hide");
	     		$scope.showToast("Media Upload", "Media Uploaded", true);
	     		$scope.findInventoryById(res.data.id);
			}).catch(function(err){
				console.log("in error function");
				$scope.showToast("Media Upload", err.data.errorMessage, false);
			});
		});
       
    }
    
    $scope.deleteInventoryMediaById = function(id){
		skuService.deleteInventoryMediaById(id).then(function(res){
			$scope.showToast("Delete Media", "Media Deleted", true);
	     	$scope.findInventoryById(res.data.id);
		}).catch(function(err){
			$scope.showToast("Delete Media", err.data.errorMessage, false);
		});
	}
	
	$scope.uploadSkuMedia = function(id){
		$("#mediaModal").modal("hide");
    	$("#processingDialog").modal("show");
        var data = new FormData();
        data.append("files", $scope.mediaFiles[0]);
        switch($scope.mediaFiles[0].type){
			case "application/pdf":
	     		data.append("type", "PDF");
	     		break;
	     	case "image/jpg":
	     		data.append("type", "IMAGE");
	     		break;
	     	case "image/png":
	     		data.append("type", "IMAGE");
	     		break;
	     	case "image/jpeg":
	     		data.append("type", "IMAGE");
	     		break;
        };
         
        authService.getConfig().then(function(config){
			var fileUploadConfig = { withCredentials: true, transformRequest: angular.identity, headers: {'Content-Type': undefined, 'Authorization': config.headers.Authorization }}
			
			$http.post("/capture/sku/uploadmedia/" + id, data, fileUploadConfig).then(function(res){
	     		$scope.mediaFiles = [];
	     		$("#processingDialog").modal("hide");
	     		$scope.showToast("Media Upload", "Media Uploaded", true);
	     		$scope.findSkuById(res.data.id);
			}).catch(function(err){
				$scope.showToast("Media Upload", err.data.errorMessage, false);
			});
		});
       
    }
    
    $scope.deleteSkuMediaById = function(id){
		skuService.deleteSkuMediaById(id).then(function(res){
			$scope.showToast("Delete Media", "Media Deleted", true);
	     	$scope.findSkuById(res.data.id);
		}).catch(function(err){
			$scope.showToast("Delete Media", err.data.errorMessage, false);
		});
	}
	
	$scope.addPrice = function(){
		$scope.sku.prices.push({currencyCode: undefined, id: undefined, price:0.00, skuId:$scope.sku.id});
		//$scope.updateAvailableCurrencies();
	}
	
	$scope.deletePriceById = function(id){
		skuService.deletePriceById(id).then(function(res){
			$scope.findSkuById(res.data.id);
			$scope.showToast("Delete Price", "Price Deleted", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Delete Price", err.data.errorMessage, false);
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