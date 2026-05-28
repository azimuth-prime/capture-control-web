captureControlApp.factory('authService', function($http, $q, $window) {
  var config = {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json;charset=utf-8;', 'Authorization': '' }
  };
  var loginConfig = { withCredentials: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;', 'Authorization': "Basic " + btoa("web_client:!!ghftyx2t9") }};
  var storage = $window.localStorage;
  var refreshTokenPromise;

  function refreshAccessToken() {
    var deferred = $q.defer();

    /* Perform an HTTP request to refresh the JWT token */
    var data = $.param({ 'refresh_token': storage.getItem('refresh_token'), 'grant_type': "refresh_token" });
    var queryString = "?refresh_token=" + storage.getItem('refresh_token') + "&grant_type=refresh_token";
    $http.post("/capture/oauth/token" + queryString, data, loginConfig).then(function(response) {
      /* Update the refreshed token in your application */
      var token = response.data;
      storage.setItem("access_token", token.access_token);
      storage.setItem("refresh_token", token.refresh_token);
      storage.setItem("expires_on", new Date(new Date().getTime() + (1000 * token.expires_in)));

      /* Resolve the promise with the updated config object */
      config.headers.Authorization = 'Bearer ' + token.access_token;
      deferred.resolve(config);
    }).catch(function(error) {
      /* Handle any errors during token refresh */
      console.log(error);

      /* Reject the promise with the error */
      deferred.reject(error);
    });

    return deferred.promise;
  }

  return {
	getConfig: function() {
	  // Check if the access token exists
	  if (storage.getItem('access_token')) {
	    // Check if the access token has expired
	    if (new Date(storage.getItem('expires_on')) < new Date()) {
	      //console.log("access token expired");
	      // Check if a refresh token is available
	      if (storage.getItem('refresh_token')) {
	        //console.log("refreshing");
	        // If a token refresh is not already in progress, start it
	        if (!refreshTokenPromise) {
	          refreshTokenPromise = refreshAccessToken().finally(function() {
	            // Reset the promise when the token refresh is complete
	            refreshTokenPromise = null;
	          });
	        }
	        // Return the existing or new refresh token promise
	        console.log("Returning refresh Promise");
	        return refreshTokenPromise;
	      } else {
	        // No refresh token, redirect to login
	        $window.location.href = "/login.html";
	        return $q.reject("No refresh token available");
	      }
	    } else {
	      // Access token is still valid
	      config.headers.Authorization = 'Bearer ' + storage.getItem('access_token');
	      return $q.resolve(config);
	    }
	  } else {
	    // No access token, redirect to login
	    $window.location.href = "/login.html";
	    return $q.reject("No access token available");
	  }
	}	
  };
});
