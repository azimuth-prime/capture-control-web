captureControlApp.controller("productController", function($scope, $routeParams, $location, productService, 
	skuService, configService, authService, $http){
	
	$scope.viewSKU = function(id, type){
		/* pass in sku type value. change target based on type */
		if(type === "SIMPLESKU")
			$location.path("/products/skus/" + id);
		else
			$location.path("/products/skus/bundles/" + id);
	}
	
	$scope.inventoryTypes = ['INVENTORIED', 'DROPSHIP', 'INFINITE'];
	$scope.setInventoryType = function(type){
		$scope.sku.inventoryType = type;
	}
	
	$scope.findGlobalConfig = function(){
		configService.findGlobalConfig().then(function(res){
			$scope.globalConfig = res.data;
		}).catch(function(err){
			
		});
	}
	
	$scope.newSkuItem = function(){
		//console.log("new sku");
		$scope.sku = {currency: $scope.globalConfig.defaultCurrency, stockThreshold: -1, inventoryType: "INVENTORIED"};
		$("#skuModal").modal("show");
	}
	
	$scope.viewProduct = function(id){
		$location.path("/products/" + id);
	}
	
	$scope.findSkuConfigInfo = function(){
		skuService.findSkuConfigInfo().then(function(res){
			$scope.skuConfig = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findById = function(id){
		$scope.loadingMessage = "Finding Product... ";
        $("#processingDialog").modal("show");
		if(id == undefined)
			id = $routeParams.id;
		productService.findById(id).then(function(res){
			$scope.product = res.data;
			$scope.product.availabilityDate = new Date(res.data.availabilityDate);
			$scope.product.creationDate = new Date(res.data.creationDate);
			$scope.product.lastModifiedDate = new Date(res.data.lastModifiedDate);
			
			/*Calculate total product value */
			if($scope.product.skus.length > 0){

				/*Calculate total for product including all skus unless skubundle */
				$scope.product.totalQuantity = 0;
				$scope.product.totalValue = 0.00;
				$scope.product.skus.forEach(item => {
					$scope.product.totalQuantity += item.stockCount.available;
					$scope.product.totalValue += (item.stockCount.onHand * item.price);
				});
			}			
			
			/* Build unique warehouse list for skus */
			$scope.product.skus.forEach(function(item){
				var wArray = [];
				item.inventory.forEach(iItem => {
					if((wArray.indexOf(iItem.warehouse.name) < 0)){
						wArray.push(iItem.warehouse.name);
					}
				});
				item.warehouses = wArray;
			}); 
			
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$scope.errorMessage = err;
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.saveProductSku = function(){
        $scope.loadingMessage = "Saving SKU... ";
        $("#processingDialog").modal("show");
		var data = $scope.sku;
		data.productId = $scope.product.id;
		if(data.inventoryType == undefined || data.inventoryType == '')
			data.inventoryType = "INVENTORIED";
		console.log(JSON.stringify(data));
		
		skuService.saveSku(data).then(function(res){
			$("#processingDialog").modal("hide");
			$scope.findById(res.productId);
			$("#skuModal").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
		
	}
	
	$scope.saveSkuBundle = function(){
		 $scope.loadingMessage = "Saving SKU Bundle... ";
	        $("#processingDialog").modal("show");
		var data = $scope.sku;
		data.productId = $scope.product.id;
		skuService.saveSkuBundle(data).then(function(res){
			$("#processingDialog").modal("hide");
			$scope.findById(res.productId);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.focusField = function(field){
		document.getElementById(field).focus();
	}
	
	$scope.findProductsByKeyword = function(pageNumber){
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length < 1)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30 };
    	productService.findProductsByKeyword(data)
    		.then(function(response){
    			$scope.searchResults = response.data;
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
		productService.findProductsByKeyword(data)
    		.then(function(response){
    			$scope.searchResults = response.data;
    			if($scope.searchResults.pages > 20)
    				$scope.searchResults.pages = 20;
    		});
	}
	
	$scope.findInventoryByKeyword = function(pageNumber){
		if($scope.keyword != undefined && $scope.keyword.length >= 3){
    		if(pageNumber == undefined)
    			pageNumber = 0;
	    	var data = { keyword: $scope.keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30 };
	    	productService.findInventoryByKeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    			if($scope.searchResults.pages > 20)
	    				$scope.searchResults.pages = 20;
	    		})
    	}else{
    		$scope.searchResults = undefined;
    	}
	}
	
	$scope.createProduct = function(){
		var data = $scope.product;
		data.productType = 'FINISHED';
		data.saleable = true;
		productService.saveProduct(data).then(function(res){
			$("#productModal").modal("hide");
			$location.path("/products/" + res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveProduct = function(){
        $scope.loadingMessage = "Saving Product... ";
        $("#processingDialog").modal("show");
		var data = $scope.product;
		productService.saveProduct(data).then(function(res){
			$("#processingDialog").modal("hide");
			$scope.findById(res.data.id);
			//$scope.productForm.$setUntouched();
			$scope.showToast("Save Product Info", "Product Info Saved", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.showToast("Save Product Info", err.data.errorMessage, false);
		});
	}
	
	$scope.setUnit = function(id){
		for(let item of $scope.skuConfig.stockUnits){
			if(id == item.id){		
				$scope.product.stockUnit = item;
				break;	
			}
		};
	}
	
	$scope.setManufacturer = function(item){
		$scope.product.manufacturer = item;
	}
	
	$scope.setUnitByName = function(name){
		for(let item of $scope.skuConfig.stockUnits){
			if(name == item.name){		
				$scope.product.stockUnit = item;
				break;	
			}
		};
	}
	
	$scope.setColor = function(id){
		for(let item of $scope.skuConfig.colorSwatches){
			if(id == item.id){		
				$scope.sku.colorSwatch = item;
				break;	
			}
		};
	}
	
	$scope.setSize = function(id){
		for(let item of $scope.skuConfig.sizings){
			if(id == item.id){		
				$scope.sku.sizing = item;
				break;	
			}
		};
	}
	
	$scope.findSkuById = function(id){
		skuService.findSkuById(id).then(function(res){
			$scope.sku = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.selectedProduct = undefined;
	$scope.setSelectedProduct = function(id){
		if($scope.selectedProduct === undefined){
			$scope.selectedProduct = id;
			$scope.sku = undefined;
			$scope.product = undefined;
			$scope.findById(id);
		}else{
			$scope.selectedProduct = undefined;
			$scope.sku = undefined;
			$scope.product = undefined;
		}		
	}
	
	$scope.setSelectedSku =function(id){		
		if($scope.selectedSku === undefined){
			$scope.selectedSku = id;
			$scope.findSkuById(id);
		}else{
			$scope.selectedSku = undefined;
			$scope.sku = undefined;
		}
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
    
    $scope.uploadMedia = function(id){
    	 $("#processingDialog").modal("show");
         var data = new FormData();
         data.append("files", $scope.mediaFiles[0]);
         switch($scope.mediaFiles[0].type){
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
			
			 $http.post("/capture/product/uploadmedia/" + id, data, fileUploadConfig).then(function(res){
	     		$scope.findById(res.data.id);
	     		$scope.mediaFiles = [];
	     		$("#processingDialog").modal("hide");
	     		$scope.showToast("Upload Thumbnail Image", "Image Uploaded", true);
			});
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