if (typeof qbb == "undefined"){
	var qbb = {};
}

(function($) {
	if(typeof qbb.inf == "undefined") {
		
		qbb.inf = {
			service_url: "http://localhost:8080/webportal/api",	
			prefixes:[],

			prefixfyUri: function(u){
				var pos = u.lastIndexOf('#');
				if (pos < 0)
					pos = u.lastIndexOf('/');
				if (pos < 0)
					return u;
				var prefix = u.substring(0, pos);
				var label = u.substring(pos+1, u.length);
				return label;
			},

			clearGraphs:function(g){
				$('#edaContainer').html('');
			},

			displayMessage: function(msg){
				$('#selectionDesc').html("<h1>" + msg + "</h1>");	
			},

			showContent: function(elems){
				$('#edaContainer').html('');
				for(var i=0;i<elems.length;i++)
				{
					$('#edaContainer').append(elems[i]);
				}
			},

			searchEDPInstances:function(dataset, nodeId, searchCB){
				var apiName = "searchEDPInstances";
				var sendObject={
						r:apiName,
						nodeId: nodeId,
						dataset:dataset
				};
				qbb.inf.callAPI(sendObject, searchCB);
			},
			
			callAPI: function(sendObject, cb){
				qbb.inf.ajax.doPost(sendObject, function(s){
					var ret = s;
					if (ret && ret.status == "200" && ret.data)
					{
						if (typeof cb == 'function')
							cb(ret.data);
					}else
					{
						if (typeof cb == 'function')
							cb();
					}
				}, function(){
					if (typeof checkOutDataCB == 'function')checkOutDataCB();
				});
			},
			
			ajax: {
					doGet:function(sendData,success,error){
						qbb.inf.ajax.doSend("Get",null,sendData,success,error);
					},
					doPost:function(sendData,success,error){
						qbb.inf.ajax.doSend("Post",null,sendData,success,error);
					},
					doSend:function(method,url,sendData,success,error){
						dataSuccess = function(data){
							(success)(eval(data));
						};
						if (sendData) sendData.token = "";
						jQuery.ajax({
							   type: method || "Get",
							   url: url || qbb.inf.service_url,
							   data: sendData || [],
							   cache: false,
							   dataType: "jsonp", /* use "html" for HTML, use "json" for non-HTML */
							   success: dataSuccess /* (data, textStatus, jqXHR) */ || null,
							   error: error /* (jqXHR, textStatus, errorThrown) */ || null
						});
					}
			}
		};
	}
})(jQuery);