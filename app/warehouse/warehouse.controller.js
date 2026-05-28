captureControlApp.controller("warehouseController", function($scope, $routeParams, $window, $location, warehouseService, shippingService, orderService){
	$scope.warehouse = { address: {}};
	
	$scope.focusField = function(field){
		document.getElementById(field).focus();
	}
	
	$scope.findWarehouseById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		warehouseService.findById(id).then(function(res){
			$scope.warehouse = res.data;
		}).catch(function(err){
			console.log(err);
		});	
	}
	
	$scope.findAllWarehouses = function(){
		warehouseService.findAll().then(function(res){
			$scope.warehouses = res.data;
		}).catch(function(err){
			console.log(err);
		});	
	}
	
	$scope.resetWarehouse = function(){
		$scope.warehouse = {};
		$scope.uniqueNameError = undefined;
	}
	
	$scope.saveWarehouse = function(){
		var data = {};
		$scope.uniqueNameError = undefined;
		if($scope.warehouse.parentId != null)
			data = { parentId: $scope.warehouse.parentId, name: $scope.warehouse.name, id: $scope.warehouse.id}; 
		else
			data = { parentId: null, name: $scope.warehouse.name, id: $scope.warehouse.id};
		warehouseService.validateName(data).then(function(res){
			//console.log("name unique");
			var data = $scope.warehouse;
			warehouseService.save(data).then(function(res){
				//console.log("save wh");
				$scope.findAllWarehouses();
				$("#warehouseDialog").modal("hide");
				$scope.warehouseForm.$setUntouched();
			}).catch(function(err){
				console.log(err);
			});
		}).catch(function(err){
			console.log("name not unique");
			$scope.warehouseForm.wName.$invalid = true;
			$scope.uniqueNameError = err.data.errorMessage; 
			return false;
		});
	}
	
	$scope.deleteById = function(id){
		
	}
	
	$scope.countries = countries;
	$scope.setCountry = function(code){ 
		if($scope.warehouse.address == undefined)
			$scope.warehouse.address = { country: code };
		else
			$scope.warehouse.address.country = code;
		for(var i=0; i<$scope.countries.length; i++){
			if($scope.countries[i].isoCode == code){
				$scope.cCountry = $scope.countries[i];
				break;
			}				
		}	
	}
	
	$scope.setProvince = function(code){ $scope.warehouse.address.province = code; }
	
	$scope.findPickSlipById = function(id){
		//console.log("findpickslip");
		if(id == undefined)
			id = $routeParams.id;
		if(id == undefined)
			id = $location.search().id;
		warehouseService.findPickSlipById(id).then(function(res){
			$scope.pickslip = res.data;
			$scope.generateBarcode("#orderBarcode", res.data.orderId, true, 3, 75, 20);
			$scope.pickslip.totalItems = 0;
			$scope.pickslip.items.forEach(item => {
				$scope.pickslip.totalItems += item.quantityOrdered;
			});
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findPickslipByKeyword = function(pageNumber){
			if($scope.keyword == undefined || $scope.keyword.length == 0)
				keyword = "*";
			if(pageNumber == undefined)
    			pageNumber = 0;
	    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 20 };
	    	warehouseService.findPickableOrderBykeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    			if($scope.searchResults.pages > 30)
	    				$scope.searchResults.pages = 30;
	    		});
	} 
	
	$scope.findPackslipByKeyword = function(pageNumber){
			if($scope.keyword == undefined || $scope.keyword.length == 0)
				keyword = "*";
			if(pageNumber == undefined)
    			pageNumber = 0;
	    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 20 };
	    	warehouseService.findPackableOrderBykeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    			if($scope.searchResults.pages > 30)
	    				$scope.searchResults.pages = 30;
	    		});
	}
	
	$scope.viewPickslip = function(id){
		$location.path("/pick-details/" + id);
	}
	
	$scope.viewPackslip = function(id){
		$location.path("/pack-details/" + id);
	}
	
	$scope.shipOrder = function(id){
		$location.path("/ship-details/" + id);
	}
	
	$scope.findOrderByBackorder = function(pageNumber){
		var keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
		var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 20 };
		orderService.findOrderByBackorder(data).then(function(res){
			$scope.backorders = res.data;
			if($scope.backorders.pages > 30)
				$scope.backorders.pages = 30;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.selectedOrders = [];
	$scope.toggleSelectedOrders = function(id){		
		//console.log("toggle: " + id);
		if($scope.selectedOrders.indexOf(id) >= 0)
			$scope.selectedOrders.splice($scope.selectedOrders.indexOf(id), 1);
		else
			$scope.selectedOrders.push(id);
	};
	
	$scope.printSelectedBulkPickslip = function(){
		
		$window.open("/include/warehouse/print/bulk-pick-slip.html#/?ids=" + $scope.selectedOrders, "_blank", 
			"menubar=no,toolbar=no,location=no,directories=no,status=no,scrollbars=no,resizable=no,dependent,width=1100,height=620,left=0,top=0"); 
	}
	
	$scope.printBulkPickslip = function(){
		
		$window.open("/include/warehouse/print/bulk-pick-slip.html#/", "_blank", 
			"menubar=no,toolbar=no,location=no,directories=no,status=no,scrollbars=no,resizable=no,dependent,width=1100,height=620,left=0,top=0"); 
	}
	
	$scope.generateBulkPickslip = function(){
		warehouseService.generateBulkPickslip().then(function(res){
			$scope.bulkPickslip = res.data;
			$scope.bulkPickslip.totalItems = 0;
			for(var i=0; i<$scope.bulkPickslip.items.length;i++){
				$scope.bulkPickslip.totalItems += $scope.bulkPickslip.items[i].quantityOrdered;
			}
			$scope.findPickslipByKeyword();
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.generateSelectBulkPickslip = function(ids){
		
		var data = {items: ids.split(",")};
		warehouseService.generateSelectBulkPickslip(data).then(function(res){
			$scope.bulkPickslip = res.data;
			$scope.bulkPickslip.totalItems = 0;
			for(var i=0; i<$scope.bulkPickslip.items.length;i++){
				$scope.bulkPickslip.totalItems += $scope.bulkPickslip.items[i].quantityOrdered;
			}
			$scope.findPickslipByKeyword();
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.generatePickslip = function(){
		ids = $location.search().ids;
		if(ids == undefined)
			$scope.generateBulkPickslip();
		else
			$scope.generateSelectBulkPickslip(ids);
	}
	
	$scope.pickAllItem = function(skuId){
		$scope.pickslip.items.forEach((item) => {
			if(item.skuId == skuId)
				item.quantityPicked = item.quantityOrdered;
		});
	}
	
	$scope.packAllItem = function(id, inventoryId){
		$scope.itemArray.forEach((item) => {
			if(item.id == id && item.inventoryId == inventoryId)
				item.quantityPacked = item.quantityOrdered;
		});
	}
	
	$scope.pickOrder = function(){
		var data = { id: $scope.pickslip.orderId, items: []};
		$scope.pickslip.items.forEach((item) =>{
			data.items.push({skuId: item.skuId, quantity: item.quantityPicked});
		});
		warehouseService.pickOrder(data).then(function(res){
			$scope.findPickSlipById($scope.pickslip.orderId);
			$scope.showToast("Pick Order", "Order has been picked", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Pick Order", err.data.errorMessage, false);
		});
		
	}
	
	$scope.printPackSlip = function(id){
		warehouseService.printPackSlip(id).then(function(res){
			$scope.showToast("Print Packing Slip", "Packing Slip sent to printer", true);
		}).catch(function(err){
			$scope.showToast("Print Packing Slip", err.data.errorMessage, false);
		});
	}
	
	$scope.generateBarcode = function(target, value, displayText, width, height, fontSize){
		//console.log("generate barcode: " + target + ", " + value + " " + displayText);
		JsBarcode(target, value, {
			  displayValue: displayText,
			  width: width,
			  height: height,
			  fontSize: fontSize
		});
	}	
	
	$scope.findItemById = function(keyword){		
		if(keyword == undefined)
			keyword = $scope.keyword;
		if(keyword.length > 10){
			/* check what type of id it is. If ORD then order lookup, if INV then its a packing event. */
			if(keyword.indexOf('ORD') > -1){
				//console.log("ord item");
				warehouseService.findOrderForPacking(keyword).then(function(res){
					$scope.order = res.data;
				}).catch(function(err){
					console.log(err);
				});
				$scope.barcode = "";
			}else if(keyword.indexOf('SKU') > -1){
				//console.log("sku item");
				$scope.barcode = "";
			}else{
				//console.log("by default must be an inventory item");
				var data = {orderId:$scope.order.orderId, inventoryId: keyword, quantity: 1 };
				warehouseService.packItem(data).then(function(res){
					$scope.order = res.data;
					$scope.showToast("Pack Item", "Item has been packed", true);
				}).catch(function(err){
					console.log(err);
					$scope.showToast("Pack Item", err.data.errorMessage, false);
				});
			}				
		}	
	}
	
	$scope.findOrderForPacking = function(){
		id = $routeParams.id;
		if(id != undefined)
			warehouseService.findOrderForPacking(id).then(function(res){
					$scope.order = res.data;
					/* Build item array */
					$scope.itemArray = [];
					$scope.order.items.forEach((item) =>{
						$scope.itemArray.push({id: item.orderItemId, lineNumber: item.lineNumber, productId: item.productId, productName: item.productName, quantityOrdered: item.quantityOrdered,
						quantityPacked: item.quantityPacked, skuId: item.skuId, lotSerial: item.lotSerial, inventoryId: '', lots: item.lots});
					});
					$scope.generateBarcode("#orderBarcode", res.data.orderId, true, 3, 75, 20);
					//console.log(JSON.stringify($scope.itemArray));
				}).catch(function(err){
					console.log(err);
				});
	}	
	
	$scope.checkLotQty = function(item, lot){
		/* If lotSerial != undefined in item then user has changed the existing lot. */
		if(item.lotSerial != undefined){
			
		}
		
		if(item.quantityOrdered <= lot.quantity){
			item.lotSerial = lot.name; 
			item.inventoryId = lot.id;
		}else{
			var diff = item.quantityOrdered - lot.quantity;
			var lots = item.lots;
			var newItem = JSON.parse(JSON.stringify(item));
			item.lotSerial = lot.name; 
			item.inventoryId = lot.id;
			item.quantityOrdered = item.quantityOrdered - diff;
			
			/* Remove the used up lot from the lot list. */
			item.lots = [];
			for(var i=0; i<newItem.lots.length;i++){
				if(newItem.lots[i].id == item.inventoryId)
					newItem.lots.splice(i, 1);
			}
			newItem.quantityOrdered = diff;
			$scope.itemArray.push(newItem)
		}		
	}
	
	/* 
	* If the item is not scanned in then we may not have the inventory id. Require the lot/serial be entered.
	* Pass in the packItem with quantityPacked, orderItemId, lot/serial values
	*/
	$scope.submitPackedOrder = function(){
		//console.log($scope.itemArray);
		var itemArray = [];
		for(var i=0; i<$scope.itemArray.length; i++){
			var data = {skuId: $scope.itemArray[i].skuId, lotSerial: $scope.itemArray[i].lotSerial, 
			quantity: $scope.itemArray[i].quantityPacked, itemId: $scope.itemArray[i].id, inventoryId: $scope.itemArray[i].inventoryId};
			itemArray.push(data);
		}
		var packData = {id: $scope.order.orderId, items: itemArray};
		//console.log(JSON.stringify(packData));
		
		warehouseService.packOrder(packData).then(function(res){
			$scope.order = res.data;
			$scope.showToast("Pack Order", "Order has been packed", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Pack Order", err.data.errorMessage, false);
		}); 
	}
	
	$scope.validateLotSerial = function(skuId, lotSerial){
		var data = {skuId: skuId, lotSerial: lotSerial};
		warehouseService.validateLotSerial(data).then(function(res){
			//console.log(res.data);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	/* Test codes */
	$scope.findAllInventoryItems = function(){
		warehouseService.findAllInventoryCodes().then(function(res){
			$scope.inventory = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
    /* Bracode Scanning */
    $scope.barcodeScanned = function(barcode) {        
        //console.log('callback received barcode: ' + barcode);                     
        $scope.findItemById(barcode);        
    }; 
    
    $scope.findAllCarriers = function(){
		shippingService.findAllCarriers().then(function(res){
			$scope.carriers = res.data;
		}).catch(function(err){
			console.log(err);
		})
	}
	
	$scope.saveCarrier = function(){
		var data = $scope.carrier;
		shippingService.saveCarrier(data).then(function(res){
			$scope.carrier = res.data;		
			$scope.findAllCarriers();	
			$("#carrierDialog").modal("hide");
			$scope.showToast("Save Carrier", "Carrier information has been saved", true);
		}).catch(function(err){
			$("#carrierDialog").modal("hide");
			$scope.showToast("Save Carrier", err.data.errorMessage, false);
		});
	}
	
	$scope.findCarrierById = function(id){
		shippingService.findCarrierById(id).then(function(res){
			$scope.carrier = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	/* Transfers */
	$scope.findTransferById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		if(id != undefined){
			warehouseService.findTransferById(id).then(function(res){
				$scope.transfer = res.data;
			}).catch(function(err){
				console.log(err);
			});
		}else{
			$scope.transfer = {};
		}			
	}
	
	$scope.viewTransfer = function(id){
		$location.path("/transfer/" + id);
	}
	
	$scope.deleteTransferById = function(id){
		warehouseService.deleteTransferById(id).then(function(res){
			$scope.findAllOpenTransfers();
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findAllOpenTransfers = function(){
		warehouseService.findAllOpenTransfers().then(function(res){
			$scope.transfers = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.transfer = {fromWarehouse: undefined, toWarehouse: undefined};
	$scope.setTransferWarehouse = function(item, type){
		//console.log("set warehouse");
		if(type == 'from'){
			$scope.transfer.fromWarehouse = item;
			$scope.transfer.toWarehouse = undefined;
		}else
			$scope.transfer.toWarehouse = item;
	}
	
	$scope.newTransfer = function(){
		var data = $scope.transfer;
		warehouseService.saveTransfer(data).then(function(res){			
			$scope.transfer = res.data;
			$("#newTransferModal").modal("hide");
			$location.path("/transfer/" + $scope.transfer.id);
		}).catch(function(err){
			console.log(err);
			$("#newTransferModal").modal("hide");
			$scope.showToast("Save Stock Transfer", err.data.errorMessage, false);
		});
	}
	
	$scope.saveTransfer = function(){
		var data = $scope.transfer;
		//console.log(JSON.stringify(data));
		warehouseService.saveTransfer(data).then(function(res){
			$scope.transfer = res.data;
			$scope.showToast("Save Stock Transfer", "Stock transfer saved", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Stock Transfer", err.data.errorMessage, false);
		});
	}
	
	$scope.transferStock = function(id){
		warehouseService.transferStock(id).then(function(res){
			$scope.transfer = res.data;
			$scope.showToast("Stock Transfer", "Stock transfer complete", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Stock Transfer", err.data.errorMessage, false);
		});
	}
	
	$scope.displayTransferBtn = function(){
		/* 	If the transfer item is undefined return false
			If transfer from/to not set then return false
			If no items in items list then return false
			If no items in item list with QTY > 0 then return false
		*/
		if($scope.transfer.id == undefined)
			return false;
		if($scope.transfer.fromWarehouse == undefined)
			return false;
		if($scope.transfer.toWarehouse == undefined)
			return false;
		if($scope.transfer.items == undefined || $scope.transfer.items.length == 0)
			return false;
		if($scope.transfer.state != 'NEW')
			return false;

		$scope.transfer.items.forEach((item) => {
			if(item.quantity == 0)
				return false;
		});
		
		return true;
	}
	
	$scope.setTransferItem = function(item){
		/*	Add item to transfer then refresh transfer.
			Base values = inventoryId, skuId, productName, lotSerial, quantity
		 */
		//console.log(JSON.stringify(item));
		var data = { transferId:$scope.transfer.id, inventoryId: item.id };
		
		warehouseService.addItemToTransfer(data).then(function(res){
			$scope.transfer = res.data;
			$("#findItemModal").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#findItemModal").modal("hide");
		});
	}
	
	$scope.containsInventoryItem = function(id){
		$scope.transfer.items.forEach((item) => {
			if(item.id == id)
				return true;
		});
		return false;
	}
	
	$scope.removeItemFromTransfer = function(item){
		/*	Remove the item from the transfer
		 */
		var data = { transferId:$scope.transfer.id, id: item.id };
		warehouseService.removeItemFromTransfer(data).then(function(res){
			$scope.transfer = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findAvailableInventoryByKeyword = function(pageNumber){
		if($scope.keyword != undefined && $scope.keyword.length >= 3){
    		if(pageNumber == undefined)
    			pageNumber = 0;
    		var filters = [];
    		//console.log("WH: " + $scope.transfer.fromWarehouse.name);
    		if($scope.transfer.fromWarehouse.name != undefined){
				//console.log("warehouseId has value: " + $scope.transfer.fromWarehouse.name);
				filters.push($scope.transfer.fromWarehouse.name);
			}
    			
	    	var data = { keyword: $scope.keyword.toUpperCase(), page: pageNumber, resultsPerPage: 10, filters: filters};
	    	//console.log(JSON.stringify(data));
	    	warehouseService.findAvailableInventoryByKeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    		})
    	}else{
    		$scope.searchResults = undefined;
    	}
	}
	
	$scope.print = {qty: 1};
	$scope.printPDF = function(id){
		if($scope.print.type == 'PICK'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			warehouseService.printPickSlip(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Pick Slip", "Pick Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Pick Slip", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'BULKPICK'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			console.log(JSON.stringify(data));
			warehouseService.printBulkPickSlip(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Bulk Pick Slip", "Bulk Pick Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Bulk Pick Slip", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'PACK'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			warehouseService.printPackSlip(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Packing Slip", "Packing Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Packing Slip", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'BULKPICKALL'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			warehouseService.printBulkALLPickSlip(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Bulk Pick Slip", "Bulk Pick Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Bulk Pick Slip", err.data.errorMessage, false);
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

