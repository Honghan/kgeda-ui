/**K-Drive project: query generation demo: UI //KT Group@UNIABDN*/
/* Version 1.1 
*  Using vis library[1] 
*  
*  [1]https://github.com/almende/vis
*/
(function($) {
	if(typeof KTQGUI == "undefined") {
		
		KTQGUI = {
			MAX_INSTANCE_NUM: 50,
			MAX_ATTR_LENGTH: 350,
			selectedNodes : {},
			selectedEdges : [],
			nodeColorMap : {},
			templateNodeValMap: {},
			dsResults: null,
			dsIndex:0,
			particleSystem: null,
			nodeDic: {},
			edgeDic: {},
			uiMode: "View", //View or Query mode
			
			//select node caches
			currentNodeQueries: null,
			currentQuery2EDA: {},
			currentNodeEDA: null,

			//caching the top K instance data
			node2instances: {},
			currentSelectedNode: null, //the node id of current selected node
			currentInstancetable: null, //the google table instance for holding the instance data.

			//graph related data and options
			gData: {},
			queryObject: {nodes:[], entityNode:-1},
			graphDefaultOptions: {},
			aniObj: {scale: 0.6, animation: { 
							    duration: 300,
							    easingFunction: "linear"
								}},
			selectAniObj: {scale: 0.8 , animation: { 
							    duration: 300,
							    easingFunction: "linear"
								}},
			biggestNodeId: 0,
			
			createGraphIndex: function(g){
				KTQGUI.nodeDic = {};
				KTQGUI.edgeDic = {};
				KTQGUI.edgeDic.s = {};
				KTQGUI.edgeDic.t = {};
				//create node index
				//{nid: {}, ...}
				var biggest = 0;
				for(var i=0;i<g.nodes.length;i++){
					KTQGUI.nodeDic[g.nodes[i].id] = g.nodes[i];
					if (g.nodes[i].instanceNumber > biggest){
						biggest = g.nodes[i].instanceNumber;
						KTQGUI.biggestNodeId = g.nodes[i].id;
					}
				}
				//create edge index
				//{s: {n1id: {n2id: [], ...}, ...}, t: {n2id: {n1id: []}}
				for(var i=0;i<g.edges.length;i++){
					var n1 = g.edges[i].from;
					var n2 = g.edges[i].to;

					if (! (n1 in KTQGUI.edgeDic.s) )
					{
						KTQGUI.edgeDic.s[n1] = {};
					}
					if (KTQGUI.edgeDic.s[n1][n2]){
						KTQGUI.edgeDic.s[n1][n2].push(g.edges[i]);
					}else
						KTQGUI.edgeDic.s[n1][n2] = [g.edges[i]];

					if (! (n2 in KTQGUI.edgeDic.t) )
					{
						KTQGUI.edgeDic.t[n2] = {};
					}
					if (KTQGUI.edgeDic.t[n2][n1]){
						KTQGUI.edgeDic.t[n2][n1].push(g.edges[i]);
					}else
						KTQGUI.edgeDic.t[n2][n1] = [g.edges[i]];
				}
			},

			getNodeById: function(n){
				return KTQGUI.nodeDic[n];
			},


			getEdgesBySource: function(n){
				return KTQGUI.edgeDic.s[n];
			},

			getEdgeByNodes: function(n1, n2){
				return getEdgesBySource.s(n1)[n2];
			},

			getEdgesByTerminal: function(n){
				return KTQGUI.edgeDic.t[n];
			},			

			materialisedLabel: function(){
				return $('#toggleReasoning').prop("checked");
			},

			removePrefix: function(lbl){
				var pos = lbl.indexOf(":");
				if (pos < 0) return lbl;
				else
					return lbl.substring(pos + 1);
			},

			fancyLabel: function(lbl){
				var pos = lbl.indexOf(",");
				if (pos < 0)
				{
					return KTQGUI.removePrefix(lbl);
				}else
				{
					var arr = lbl.split(",");
					var s = "";
					for(var i=0;i<arr.length;i++)
					{
						s += KTQGUI.removePrefix( $.trim(arr[i]) ) + ", ";
					}
					return s.substring(0, s.length - 2);
				}				
			},
			
			getNodeLabel: function(name, textOnly){
				var label = "";
				var curResult = KTQGUI.dsResults[KTQGUI.dsIndex];
				var nodes = curResult.edp.nodes;
				for(var i=0;i<nodes.length;i++){
					if (nodes[i].id == name)
					{
						label = nodes[i].label;
						break;
					}
				}
				if (textOnly) return label;
				return "<span class='clsClass' name='" + name + "'>" + label + "</span>";
			},
						
			getNodeDesc: function(name){
				var curResult = KTQGUI.dsResults[KTQGUI.dsIndex].edp;
				var s = "";
				var node = KTQGUI.getNodeById(name);
				if (node)
				{
					s += "<h1>Entities</h1><span class='clsClass' name='" + name + "'>" + node.label + "</span>"
						+ " has " + node.instanceNumber + " instances totally."
						+ " The <span class='clsTopInstances'>top " + (Math.min(KTQGUI.MAX_INSTANCE_NUM, node.instanceNumber)) + " ones</a> are as follows.";

					$('#querySaveDiv').hide();
					if (KTQGUI.uiMode == "Query"){
						//add query ui components
						$('#queryDiv').show();
						$('#queryDiv button').click(function(){
							KTQGUI.selectInstance4QueryNode();
							$('.cd-panel').removeClass('is-visible');
						});
					}else{
						$('#queryDiv').hide();
					}


					var dsUri = KTQGUI.dsResults[KTQGUI.dsIndex].dsuri;
					KTQGUI.queryNodeDefaultEntities(dsUri, name);			
				}
				return s;
			},

			//query default instances of a given node
			queryNodeDefaultEntities: function(dsUri, name){
				if (!KTQGUI.node2instances[name]){
					//call to retrieve instance details from the API service
					qbb.inf.searchEDPInstances(dsUri, name, function(data){
						KTQGUI.node2instances[name] = $.parseJSON(data);
						KTEDA.renderDataTable(KTQGUI.node2instances[name], $('#instanceTable').get(0), "Entities", KTQGUI.linkGoogleInstanceTableBack);
					});
				}else{
					KTEDA.renderDataTable(KTQGUI.node2instances[name], $('#instanceTable').get(0), "Entities", KTQGUI.linkGoogleInstanceTableBack);
				}
			},

			linkGoogleInstanceTableBack: function(table){
				KTQGUI.currentInstancetable = table;
			},

			/**
			* deal with the instance selection event
			*/
			selectInstance4QueryNode: function(){
				if (KTQGUI.currentInstancetable){
					var selection = KTQGUI.currentInstancetable.getSelection();
					if (selection && selection.length > 0){
						var data = KTQGUI.node2instances[KTQGUI.currentSelectedNode];
						console.log(data);
						if (data){
							var qo = KTQGUI.queryObject;
							if (!qo.instances){
								qo.instances = {};
							}
							qo.instances[KTQGUI.currentSelectedNode] = data.rows[selection[0].row].entityId;
							var node = KTQGUI.gData.nodes.get(KTQGUI.currentSelectedNode);
							if (!node.origLabel)
								node.origLabel = node.label;
							console.log(KTQGUI.gData.nodes.get(KTQGUI.currentSelectedNode));
							KTQGUI.gData.nodes.update([{id:""+KTQGUI.currentSelectedNode, 
								label: data.rows[selection[0].row].entityLabel,
								origLabel: node.origLabel
									}
								]);
							console.log($.toJSON(qo));
							//alert(data.rows[selection[0].row].entityId);
						}
					}
				}
			},
			
			getDSDesc: function(){
				var curResult = KTQGUI.dsResults[KTQGUI.dsIndex];
				var nlDesc = "The knowledge base <b>" + curResult.ds + "</b> is mainly about ";
				var nlNodeDescs = "";
				var mainNodeLabel = [];
				//var mainNodeDesc = [];
				for(var j=0;j<curResult.GQQueries.length;j++)
				{
					if (curResult.GQQueries[j].type == "topic")
					{	
						var topics = $.parseJSON(curResult.GQQueries[j].relatedNodeEdgeJSON).topics;
						for(var i=0;i<topics.length;i++)
						{
							mainNodeLabel.push( KTQGUI.getNodeLabel(topics[i]) );
							//mainNodeDesc.push(KTQGUI.getNodeDesc(nodes[i]));
						}
					}
				}
				
				for(var j=0;j<mainNodeLabel.length;j++)
				{
					if (mainNodeLabel.length > 1)
					{
						if (j == mainNodeLabel.length - 1)
							nlDesc += " and ";
						else if (j > 0)
							nlDesc += ", ";
					}
					nlDesc += mainNodeLabel[j];
					//nlNodeDescs += mainNodeDesc[j] + "<p/>";
				}
				nlDesc += ".";
				
				$('#nlDesc').html(nlDesc);
				$('#selectionDesc').html('');
				
				$('.clsClass').click(function(){
					KTQGUI.selectedNodes = [$(this).attr('name')];
					KTQGUI.selectedEdges = [];
					KTQGUI.selectNodes();
					$('#selectionDesc').html(KTQGUI.getNodeDesc($(this).attr('name')));
				});
			},

			createConceptListOfDs: function(idx){
				var curResult = KTQGUI.dsResults[idx];
				var s = "";
				for(var n in curResult.edp.nodes)
				{
					s += "<option value='" + n + "'>" + curResult.edp.nodes[n].label + "</option>"
				}
				return s;
			},
			
			/**
			* select a dataset
			*/
			selectDS: function(idx){
				KTQGUI.selectedNodes = {};
				KTQGUI.selectedEdges = {};
				KTQGUI.dsIndex = parseInt(idx);
				
				var curResult = KTQGUI.dsResults[KTQGUI.dsIndex];
				KTQGUI.createGraphIndex(curResult.edp);

				
				KTQGUI.particleSystem.on('stabilized', function(){
					KTQGUI.particleSystem.focus(KTQGUI.biggestNodeId, 
							KTQGUI.aniObj);
				});

				KTQGUI.particleSystem.setData(KTQGUI.getDisplayGraph());
				
				$('li[class="selected"').removeClass('selected');
				$('li[index="' + idx + '"]').addClass('selected');
				KTQGUI.clear();
			},
			
			/**
			* select nodes when the user clicks on a node
			*/
			selectNodes: function(nodes){
				if (KTQGUI.uiMode == "View"){
					//viewing/exploring mode
					KTQGUI.clear();
					KTQGUI.selectedNodes = {};
					for(var i =0; i< nodes.length; i++)
						KTQGUI.showSelectedNodeDetail(nodes[i]);
				}else{
					//query composition mode
					for(var i =0; i< nodes.length; i++){
						var b = KTQGUI.addQueryNode(nodes[i]);
						KTQGUI.showSelectedNodeDetail(nodes[i], true);
					}
					KTQGUI.reselectQueryNodes();
				}
				
			},

			/**
			* add a node to the query object
			*/
			addQueryNode: function(nodeId){
				var qo = KTQGUI.queryObject;
				var canAdd = false;
				if (!qo.nodeStr)
					qo.nodeStr = "";
				if (qo.nodeStr.indexOf("," + nodeId + ",") >= 0){
					//click selected node to remove it
					// DO NOT REMOVE IT
					// var idx = -1;
					// for (var i=0;i<qo.nodes.length;i++){
					// 	if (qo.nodes[i] == nodeId)
					// 		idx = i;
					// }
					// if (idx >= 0){
					// 	qo.nodes.splice(idx, 1);
					// 	qo.nodeStr = qo.nodeStr.replace("," + nodeId + ",", "");
					// 	if (qo.entityNode == nodeId){
					// 		//reset the format of the previous queryEntity node
					// 		KTQGUI.gData.nodes.update([{id:""+nodeId, color:null}]);
					// 		qo.entityNode = -1;
					// 	}
					// }
					canAdd = true;
				}else{
					if (qo.nodes.length == 0){
						canAdd = true;
					}else{
						//check whether the new node is within the direct neighbours
						for (var i=0;i<qo.nodes.length;i++){
							var n = qo.nodes[i];
							if ((KTQGUI.edgeDic.s[n] && KTQGUI.edgeDic.s[n][nodeId]) || 
								(KTQGUI.edgeDic.t[n] && KTQGUI.edgeDic.t[n][nodeId])) {
								canAdd = true;
								break;
							}
						}
					}
					if(canAdd){
						qo.nodes.push(nodeId);
						qo.nodeStr += "," + nodeId + ",";
					}else{
						alert("please grow your query from connected nodes");
					}
				}
				if (qo.entityNode == -1 && qo.nodes.length > 0){
					qo.entityNode = qo.nodes[0];
					KTQGUI.setEntityNodeStyle();
				}
				return canAdd;
			},
			
			/**
			* initialise the system
			*/
			initial:function(system, results, options){
				KTQGUI.particleSystem = system;
				KTQGUI.dsResults = results;
				KTQGUI.graphDefaultOptions = options;
				KTQGUI.particleSystem.on('select', function(properties){
					KTQGUI.particleSystem.focus(properties.nodes[0], KTQGUI.selectAniObj)
				});

				//dataset list rendering
				var s = "";
				for(var i=0;i<results.length;i++)
				{
					s += "<li " + "index='" + i + "'>" + results[i].ds + "</li>";
					//render linkage boxes
					var opt = document.createElement("option");
					opt.value = i;
					opt.text = results[i].ds.toUpperCase();
					$('#dsList').append(opt);
				}
				$('.controls').html(s);
				
				$('.controls li').click(function(){
					KTQGUI.selectDS($(this).attr('index'));
				});				
				
				KTQGUI.selectDS(0);
			},
			
			getEDPG: function(){
				return KTQGUI.dsResults[KTQGUI.dsIndex].edp;
			},

			/**
			* clear the selections on the graph
			*/
			resetSelection: function(){
				KTQGUI.currentQuery2EDA = {};
				KTQGUI.currentNodeEDA = null;
				KTQGUI.currentNodeQueries = null;
				KTQGUI.clearQueryObject();
				KTQGUI.selectedNodes = {};
				KTQGUI.selectedEdges = {};
				KTQGUI.nodeColorMap = {};
				// KTQGUI.selectNodes([]);
			},

			clearQueryObject: function(){				
				KTQGUI.setEntityNodeStyle(true);
				var qo = KTQGUI.queryObject;
				if (qo.instances){
					var upData = [];
					for (var nid in qo.instances){
						var node = KTQGUI.gData.nodes.get(nid);
						node.label = node.origLabel;
						upData.push({id: nid, label: node.origLabel});
					}
					if (upData.length > 0)
						KTQGUI.gData.nodes.update(upData);
				}
				KTQGUI.queryObject = {nodes:[], entityNode:-1};
			},
			
			/**
			* seems a wrapper function of the resetSelection function
			* don't remember what's the purpose of this
			*/
			clear: function(){
				
				KTQGUI.resetSelection();
			},

			nodeSelectionCB: function(n){
				particleSystem.merge(KTQGUI.getDisplayGraph());
			},
			
			showSelectedNodeDetail : function(n, ignoreEDA){
				
				KTQGUI.currentSelectedNode = n;
				
				var desc = KTQGUI.getNodeDesc(n);
				$('#selectionDesc').html(desc);	
				$('.cd-panel-header h1').html(KTQGUI.getNodeLabel(n, true));
				$('.clsTopInstances').click(function(){
					KTQGUI.queryNodeDefaultEntities(KTQGUI.dsResults[KTQGUI.dsIndex].dsuri, n);
					// var o = {};
					// o[$(this).attr('name')] = KTQGUI.getNodeById($(this).attr('name'))	;
					// KTQGUI.selectedNodes = o;
					// KTQGUI.selectedEdges = {};
					// KTQGUI.selectNodes();
					// $('#selectionDesc').html(KTQGUI.getNodeDesc($(this).attr('name')));
				});

				var curResult = KTQGUI.dsResults[KTQGUI.dsIndex];
				if (!ignoreEDA){
					//render EDA result
					$('#edaContainer').html('<h1>Loading EDA Analysis Results ...</h1>');

					if (KTQGUI.currentNodeEDA){
						KTQGUI.showEDAResult([KTQGUI.currentNodeEDA]);
					}else{
						qbb.inf.getSummaryNodeEDAResult(curResult.dsuri, n, function(d){
							var data = $.parseJSON(d);
							if (data){								
								KTQGUI.currentNodeEDA = data;
								KTQGUI.showEDAResult();
							}else{
								KTQGUI.showEDAResult();
							}
						});
					}
				}else
					$('#edaContainer').html('');

				//search saved queries based on this node
				qbb.inf.searchSavedQueries(curResult.dsuri, n, function(d){
					var data = $.parseJSON(d);
					KTQGUI.currentNodeQueries = data;
					console.log(data);
					$('#nodeQueries').html('Found ' + data.length + ' saved queries');
				});

				//show the panel			
				$('.cd-panel').addClass('is-visible');
			},

			//show the EDA result, data is an array of EDA results
			showEDAResult: function(){
				var data = [];
				if (KTQGUI.currentNodeEDA)
					data.push(KTQGUI.currentNodeEDA);
				for(var q in KTQGUI.currentQuery2EDA){
					data.push(KTQGUI.currentQuery2EDA[q]);
				}
				if (data.length > 0){	
					$('#edaContainer').html('<h1>EDA Analysis Results</h1>');
					KTEDA.drawEDAChart(data, 'edaContainer');
				}else{
					$('#edaContainer').html('<h1>EDA Analysis Not Found</h1>');
				}
			},
			
			removeSelectedNode : function(n){
				var idx = -1;
				for(var i=0;i<KTQGUI.selectedNodes.length;i++)
				{
					if (KTQGUI.selectedNodes[i] == n)
						idx = i;
				}
				if ( idx >= 0)
					KTQGUI.selectedNodes.splice(idx, 1);
				$('#selectionDesc').html('');
				$('#edaContainer').html('');
				$('.cd-panel-header h1').html('');
			},
			
			getDisplayGraph: function(){
				if (Object.keys(KTQGUI.selectedNodes).length == 0)
				{
					return KTQGUI.simplifyGraph(3);
				}
				else
					return KTQGUI.filterGraphByNodes(KTQGUI.getEDPG(), KTQGUI.selectedNodes, KTQGUI.selectedEdges);
			},

			/**
			* simplify graph by ignoring edges which could be too many for displaying
			**/
			simplifyGraph: function(threshold){

				var hitNodes = {};
				var edges = [];
				for(var n1 in KTQGUI.edgeDic.s)
				{
					var n1Edges = KTQGUI.edgeDic.s[n1];
					for(var n2 in n1Edges)
					{
						if (n1Edges[n2].length >= threshold){
							var combinedEdge = {};
							combinedEdge.from = n1;
							combinedEdge.to = n2;
							combinedEdge.label = "Total " + n1Edges[n2].length  + " relations";
							edges.push(combinedEdge);
						}else
						{
							edges = edges.concat(n1Edges[n2]);
						}
						hitNodes[n1] = KTQGUI.getNodeById(n1);
						hitNodes[n2] = KTQGUI.getNodeById(n2);
					}
				}
				var nodes = [];
				for(var n in hitNodes)
					nodes.push(hitNodes[n]);

				var nodesData = new vis.DataSet(nodes);
				var edgesData = new vis.DataSet(edges);
				KTQGUI.gData = {nodes: nodesData, edges: edgesData, attrs: KTQGUI.getEDPG().attrs};
				return KTQGUI.gData;
			},

			joinArray : function(arr, sep){
				var s = sep;
				for(var i=0;i<arr.length;i++)
					s += arr[i] + sep;
				return s;
			},

			/**
			* switch between query composition
			* and viewing/exploring modes
			*/
			toggleMode: function(){
				if (KTQGUI.uiMode == "View"){
					KTQGUI.uiMode = "Query";
					KTQGUI.queryModeView();
					KTQGUI.reselectQueryNodes();
					KTQGUI.setEntityNodeStyle();
				}
				else{
					KTQGUI.uiMode = "View";
					KTQGUI.defaultView();
				}
				$('.modeSwitch').html(KTQGUI.uiMode + " mode");
			},

			/**
			* change to the default theme of the graph
			* in viewing/exploring mode
			*/
			defaultView: function(){
				KTQGUI.particleSystem.setOptions(KTQGUI.graphDefaultOptions);
				KTQGUI.setEntityNodeStyle(true);
				KTQGUI.particleSystem.unselectAll();
				$('.qio').slideUp();
			},

			/**
			* change the color theme of the graph for
			* query composition mode
			*/
			queryModeView: function(){
				var options = $.extend(true, {}, KTQGUI.graphDefaultOptions);
				options.interaction = {
			        multiselect: true,
			        selectable: true,
			      };
				options.nodes = {
			      color: {
			        background: '#e7e8f0',
			        border: '#e7e8f0',
			        highlight: {
			          background: '#D2E5FF',
			          border: 'red'
			        }
			      }};
				KTQGUI.particleSystem.setOptions(options);

				$('.qio').slideDown();
			},

			/**
			* select the query nodes in the graph
			*/
			reselectQueryNodes: function(){	
				var g = KTQGUI.particleSystem;
				g.unselectAll();
				var qo = KTQGUI.queryObject;
				g.selectNodes(qo.nodes);
			},

			/**
			* set the main variable node style
			* to make it a bit different than other
			* nodes in the same query
			*/
			setEntityNodeStyle: function(doClear){
				var qo = KTQGUI.queryObject;
				if (qo.entityNode == -1) return;
				if (doClear)
					KTQGUI.gData.nodes.update([{id:""+qo.entityNode, 
						color:null}]);
				else
					KTQGUI.gData.nodes.update([{id:""+qo.entityNode, 
						color:{
							highlight: {
								background:"#d7f8f0"
							}
						}}]);
			},

			/**
			* execute the query
			*/
			queryEntities: function(){
				var qo = KTQGUI.queryObject;
				if (qo.nodes.length == 0){
					alert('Please compose your query first: select nodes in the graph and/or set entity value(s) for those node(s) in the query');
				}if (!$('.queryTitle').val()){
					alert('please give your query a meaningful name.');
				}else{
					qo.label = $('.queryTitle').val();
					KTQGUI.showQueryResult();
					//TODO: call qbb.inf to get the results from the server
				}
			},

			showQueryResult : function(){
				var qo = KTQGUI.queryObject;
				//delete unncessary properties of the query object
				delete qo.nodeStr;

				$('.cd-panel-header h1').html(qo.label);
				$('#selectionDesc').html('querying...');

				$('#edaContainer').html('');
				$('#queryDiv').hide();
				$('#instanceTable').html('');

				//call to retrieve instance details from the API service
				var dsUri = KTQGUI.dsResults[KTQGUI.dsIndex].dsuri;
				qbb.inf.queryEntities(dsUri, $.toJSON(qo), function(data){						
					var data = $.parseJSON(data);
					$('#selectionDesc').html('Query result retrieved. (#' + data.totalInstances + ")");
					KTEDA.renderDataTable(data, $('#instanceTable').get(0), "Entities", KTQGUI.linkGoogleInstanceTableBack);
				});
				$('#querySaveDiv').show();
				$('.cd-panel').addClass('is-visible');
			},

			saveQuery: function(){
				var dsUri = KTQGUI.dsResults[KTQGUI.dsIndex].dsuri;
				qbb.inf.saveQuery(dsUri, $.toJSON(KTQGUI.queryObject), function(data){
					if (data && data != 'null')
						alert('Query saved successfully! The id is ' + data);
					else
						alert('Query not saved, please check with the system administrator!');
				});
			},

			displayNodeQueries: function(){
				if (KTQGUI.currentNodeQueries && KTQGUI.currentNodeQueries.length > 0 ){
					KTEDA.renderQueryDataTable(KTQGUI.currentNodeQueries, $('#instanceTable').get(0), 
						KTQGUI.linkGoogleInstanceTableBack, function(){
							var selection = KTQGUI.currentInstancetable.getSelection();
							if (KTQGUI.currentInstancetable && selection && selection.length > 0){
								var q = KTQGUI.currentNodeQueries[selection[0].row];
								if (KTQGUI.currentQuery2EDA && KTQGUI.currentQuery2EDA[q.queryId]){
									KTQGUI.showEDAResult();
								}else{
									qbb.inf.getAnalysisResultOfQuery(
										KTQGUI.dsResults[KTQGUI.dsIndex].dsuri,
										KTQGUI.currentSelectedNode,
										q.queryId,
										function(d){
											var data = $.parseJSON(d);
											console.log(data);
											KTQGUI.currentQuery2EDA[q.queryId] = data;
											KTQGUI.showEDAResult();
										}
									);
								}
								
							}
						});
				}
			},
		}
	}
})(jQuery);