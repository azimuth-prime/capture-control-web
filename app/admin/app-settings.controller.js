captureControlApp.controller("appSettingsController", function($scope, skuService, productService, configService){
	$scope.findSkuConfigInfo = function(){
		skuService.findSkuConfigInfo().then(function(res){
			$scope.skuConfig = res.data;
		});
	}
	
	$scope.findGlobalConfig = function(){
		configService.findGlobalConfig().then(function(res){
			$scope.globalConfig = res.data;
			if($scope.globalConfig.address == undefined)
				$scope.globalConfig.address = {};
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveColorSwatch = function(){
		var data = $scope.colorSwatch;
		skuService.saveColorSwatch(data).then(function(res){
			$scope.findSkuConfigInfo();
			$("#colorSwatchDialog").modal("hide");
			$scope.showToast("Save Color Swatch", "Color Swatch Saved.", true);
		}).catch(function(err){
			$scope.showToast("Save Color Swatch", err.data.errorMessage, false);
		});
	}
	
	$scope.findColorSwatchById = function(id){
		if(id == undefined)
			$scope.colorSwatch = {};
		else{
			skuService.findColorSwatchById(id).then(function(res){
				$scope.colorSwatch = res.data;
			});
		}
	}
	
	$scope.saveProductLabelPrinterInfo = function(){
		var data = {url:$scope.globalConfig.productLabelPrinterURL, labelTemplate: $scope.globalConfig.productLabelTemplate};
		configService.saveProductLabelPrinterInfo(data).then(function(res){
			$scope.globalConfig = res.data;
			$scope.showToast("Save Printer Info", "Printer Info Updated", true);
		}).catch(function(err){
			$scope.showToast("Save Printer Info", err.data.errorMessage, false);
		});
	}
	
	$scope.deleteColorSwatch = function(id){
		skuService.deleteColorSwatch(id).then(function(res){
			$scope.findSkuConfigInfo();
			$scope.showToast("Delete Color Swatch", "Color Swatch Deleted.", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Delete Color Swatch", err.data.errorMessage, false);
		});
	}
	
	$scope.saveSizing = function(){
		//console.log(JSON.stringify($scope.sizing));
		var data = $scope.sizing;
		skuService.saveSizing(data).then(function(res){
			$scope.findSkuConfigInfo();
			$("#sizingDialog").modal("hide");
			$scope.showToast("Save Sizing", "Updated sizing data saved.", true);
		}).catch(function(err){
			$scope.showToast("Save Sizing", err.data.errorMessage, false);
		});
	}
	
	$scope.findSizingById = function(id){
		if(id == undefined)
			$scope.sizing = {};
		else{
			skuService.findSizingById(id).then(function(res){
				$scope.sizing = res.data;
			});
		}
	}
	
	$scope.deleteSizing = function(id){
		skuService.deleteSizing(id).then(function(res){
			$scope.findSkuConfigInfo();
			$scope.showToast("Delete Sizing", "Sizing Deleted.", true);
		}).catch(function(err){
			$scope.showToast("Delete Sizing", err.data.errorMessage, false);
		});
	}
	
	$scope.saveStockUnit = function(){
		//console.log(JSON.stringify($scope.stockUnit));
		var data = $scope.stockUnit;
		productService.saveStockUnit(data).then(function(res){
			$scope.findSkuConfigInfo();
			$("#stockUnitDialog").modal("hide");
			$scope.showToast("Save Stock Unit", "Stock Unit Saved.", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Stock Unit", err.data.errorMessage, false);
		});
	}
	
	$scope.findStockUnitById = function(id){
		if(id == undefined)
			$scope.stockUnit = {};
		else{
			productService.findStockUnitById(id).then(function(res){
				$scope.stockUnit = res.data;
			});
		}
	}
	
	$scope.deleteStockUnit = function(id){
		productService.deleteStockUnit(id).then(function(res){
			$scope.findSkuConfigInfo();
			$scope.showToast("Delete Stock Unit", "Stock Unit Deleted.", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Delete Stock Unit", err.data.errorMessage, false);
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