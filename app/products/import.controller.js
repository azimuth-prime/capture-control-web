captureControlApp.controller("importController", function($scope, importService, skuService, configService, warehouseService){
	$scope.listData = [];
	$scope.parseProductImportFile = function(){
		//console.log("parse products");
		$("#processingDialog").modal("show");
		var fileReader = new FileReader();
		fileReader.onload = function(event){
			var data = event.target.result;
			var workbook = XLSX.read(data, {
				type: "binary"
			});

			let sheetName = workbook.SheetNames[0];
			let rowObject = XLS.utils.sheet_to_row_object_array(
					workbook.Sheets[sheetName]	
			);
			let jsonObject = JSON.stringify(rowObject);
			$scope.listData = JSON.parse(jsonObject);
			//console.log($scope.listData);
			
			/* Convert dates to js date. convert booleans. */
			$scope.listData.forEach(function(item){
				item.taxable = JSON.parse(item.taxable.toLowerCase());
				item.availabilityDate = (item.availabilityDate == null) ? new Date() : new Date(item.availabilityDate);
			});
			
			$scope.$apply();
			$("#processingDialog").modal("hide");
		};
		fileReader.readAsBinaryString($scope.productExcelFile);
	}
	
	$scope.importProductData = function(){
		$("#processingDialog").modal("show");
		importService.importProducts($scope.listData).then(function(res){
			$("#processingDialog").modal("hide");
			$scope.showToast("Import Products", "Products Import Uploaded", true);
			$scope.listData = [];
			$scope.productExcelFile = undefined;
		}).catch(function(err){
			$("#processingDialog").modal("hide");
			$scope.showToast("Import Products", err.data.errorMessage, false);
		})
	}
	
	$scope.parseSkuImportFile = function(){
		//console.log("parse skus");
		$("#processingDialog").modal("show");
		var fileReader = new FileReader();
		fileReader.onload = function(event){
			var data = event.target.result;
			var workbook = XLSX.read(data, {
				type: "binary"
			});

			let sheetName = workbook.SheetNames[0];
			let rowObject = XLS.utils.sheet_to_row_object_array(
					workbook.Sheets[sheetName]	
			);
			let jsonObject = JSON.stringify(rowObject);
			$scope.listData = JSON.parse(jsonObject);
			//console.log($scope.listData);
			
			/* Convert dates to js date. convert booleans. Chnage color and size to ids*/
			$scope.listData.forEach(function(item){
				item.stockThreshold = JSON.parse(item.stockThreshold);
				item.price = JSON.parse(item.price);
				item.availabilityDate = (item.availabilityDate == null) ? new Date() : new Date(item.availabilityDate);
				if(item.color != undefined)
					$scope.skuConfig.colorSwatches.forEach(function(color){
						if(color.name.toUpperCase() == item.color.toUpperCase())
							item.colorId = color.id;
					});
				if(item.sizing != undefined)
					$scope.skuConfig.sizings.forEach(function(size){
						if(size.name.toUpperCase() == item.sizing.toUpperCase())
							item.sizingId = size.id;
					});
				
			});
			
			$scope.$apply();
			$("#processingDialog").modal("hide");
		};
		fileReader.readAsBinaryString($scope.skuExcelFile);
	}
	
	$scope.importSkuData = function(){
		$("#processingDialog").modal("show");
		importService.importSkus($scope.listData).then(function(res){
			$("#processingDialog").modal("hide");
			$scope.showToast("Import SKUs", "SKU Import Uploaded", true);
			$scope.listData = [];
			$scope.skuExcelFile = undefined;
		}).catch(function(err){
			$("#processingDialog").modal("hide");
			$scope.showToast("Import SKUs", err.data.errorMessage, false);
		})
	}
	
	$scope.parseInventoryImportFile = function(){
		//console.log("parse inventory");
		$("#processingDialog").modal("show");
		var fileReader = new FileReader();
		fileReader.onload = function(event){
			var data = event.target.result;
			var workbook = XLSX.read(data, {
				type: "binary"
			});

			let sheetName = workbook.SheetNames[0];
			let rowObject = XLS.utils.sheet_to_row_object_array(
					workbook.Sheets[sheetName]	
			);
			let jsonObject = JSON.stringify(rowObject);
			$scope.listData = JSON.parse(jsonObject);
			//console.log($scope.listData);
			
			/* Convert dates to js date. convert booleans. Change warehouseName to id. Convert quantity to integer. */
			$scope.listData.forEach(function(item){
				item.price = (item.price == null) ? 0.00 : JSON.parse(item.price);
				item.quantity = (item.quantoty == null) ? 1 : JSON.parse(item.quantity);
				item.receivedDate = (item.receivedDate == null) ? new Date() : new Date(item.receivedDate);
				if(item.expiryDate != undefined)
					item.expiryDate = new Date(item.expiryDate);
				if(item.warehouseName != undefined)
					$scope.skuConfig.warehouses.forEach(function(warehouse){
						if(warehouse.name.toUpperCase() == item.warehouseName.toUpperCase())
							item.warehouseId = warehouse.id;
					});
			});
			
			$scope.$apply();
			$("#processingDialog").modal("hide");
		};
		fileReader.readAsBinaryString($scope.inventoryExcelFile);
	}
	
	$scope.importInventoryData = function(){
		$("#processingDialog").modal("show");
		if($scope.listData != undefined){
			importService.importInventory($scope.listData).then(function(res){				
				$("#processingDialog").modal("hide");
				$scope.showToast("Import Inventory/Lots", "Inventory/Lot Import Uploaded", true);
				$scope.listData = [];
				$scope.inventoryExcelFile = undefined;
			}).catch(function(err){
				$("#processingDialog").modal("show");
				$scope.showToast("Import Inventory/Lots", err.data.errorMessage, false);
			});
		}
	}
	
	$scope.deleteImportItem = function(index){
		$scope.listData.splice(index, 1);
	}
	
	$scope.findSkuConfigInfo = function(){
		skuService.findSkuConfigInfo().then(function(res){
			$scope.skuConfig = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findAllPaymentConfigData = function(){
		configService.findPaymentConfigData().then(function(res){
			$scope.paymentConfigData = res.data;
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
	
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
});