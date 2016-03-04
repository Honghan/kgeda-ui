/**K-Drive project: query generation demo: UI //KT Group@UNIABDN*/
/* Version 1.1 
*  Using vis library[1] 
*  
*  [1]https://github.com/almende/vis
*/
(function($) {
	if(typeof KTQGUI == "undefined") {
		
		KTQGUI = {
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
			
			createGraphIndex: function(g){
				KTQGUI.nodeDic = {};
				KTQGUI.edgeDic = {};
				KTQGUI.edgeDic.s = {};
				KTQGUI.edgeDic.t = {};
				//create node index
				//{nid: {}, ...}
				for(var i=0;i<g.nodes.length;i++){
					KTQGUI.nodeDic[g.nodes[i].id] = g.nodes[i];
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
					s += "<span class='clsClass' name='" + name + "'>" + node.label + "</span>"
						+ " (#" + node.instanceNumber + " instances)";

					//call to retrieve instance details from the API service
					var dsUri = KTQGUI.dsResults[KTQGUI.dsIndex].dsuri;
						qbb.inf.searchEDPInstances(dsUri, node.id, function(data){
							KTEDA.renderDataTable($.parseJSON(data), $('#instanceTable').get(0));
						});
				}
				return s;
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
			
			selectDS: function(idx){
				KTQGUI.selectedNodes = {};
				KTQGUI.selectedEdges = {};
				KTQGUI.dsIndex = parseInt(idx);
				
				var curResult = KTQGUI.dsResults[KTQGUI.dsIndex];
				KTQGUI.createGraphIndex(curResult.edp);


				KTQGUI.particleSystem.setData(KTQGUI.getDisplayGraph());
				
				$('li[class="selected"').removeClass('selected');
				$('li[index="' + idx + '"]').addClass('selected');
				
				KTQGUI.clear();
			},
			
			selectNodes: function(nodes){
				// var s1 = KTQGUI.joinArray(nodes, ",");
				// var s2 = KTQGUI.joinArray(KTQGUI.selectedNodes, ",");
				// if (s1!=s2)
				// {
				// 	KTQGUI.selectedNodes = nodes;
				// 	KTQGUI.particleSystem.setData(KTQGUI.getDisplayGraph());
				// 	KTQGUI.particleSystem.focusOnNode(nodes[0]);
				// }else{

				// }
					
				// for (var i=0;i<KTQGUI.selectedNodes.length;i++)
				// {
				// 	var n = KTQGUI.particleSystem.getNode(KTQGUI.selectedNodes[i]);
				// 	if (n)
				// 	{
				// 		if (KTQGUI.nodeColorMap[KTQGUI.selectedNodes[i]])
				// 			n.color = KTQGUI.nodeColorMap[KTQGUI.selectedNodes[i]];
				// 		if (KTQGUI.templateNodeValMap[KTQGUI.selectedNodes[i]])
				// 			n.slotValue = KTQGUI.templateNodeValMap[KTQGUI.selectedNodes[i]];
				// 		n.selected = true;
				// 	}
				// }
				KTQGUI.selectedNodes = {};
				for(var i =0; i< nodes.length; i++)
					KTQGUI.addSelectedNode(nodes[i]);
			},
			
			initial:function(system, results){
				KTQGUI.particleSystem = system;
				KTQGUI.dsResults = results;
				
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

			resetSelection: function(){
				KTQGUI.selectedNodes = {};
				KTQGUI.selectedEdges = {};
				KTQGUI.nodeColorMap = {};
				KTQGUI.selectNodes([]);
			},
			
			clear: function(){
				
				KTQGUI.resetSelection();
			},

			nodeSelectionCB: function(n){
				particleSystem.merge(KTQGUI.getDisplayGraph());
			},
			
			addSelectedNode : function(n){
				if (n in KTQGUI.selectedNodes)
					return;
				KTQGUI.selectedNodes[n] = KTQGUI.getNodeById(n);
				
				var desc = KTQGUI.getNodeDesc(n);
				$('#selectionDesc').html("<h1>Summary</h1>" + desc);	
				$('.cd-panel-header h1').html(KTQGUI.getNodeLabel(n, true));			
				
				$('.clsClass').click(function(){
					var o = {};
					o[$(this).attr('name')] = KTQGUI.getNodeById($(this).attr('name'))	;
					KTQGUI.selectedNodes = o;
					KTQGUI.selectedEdges = {};
					KTQGUI.selectNodes();
					$('#selectionDesc').html(KTQGUI.getNodeDesc($(this).attr('name')));
				});

				//render EDA result
				$('#edaContainer').html('');		
				var curResult = KTQGUI.dsResults[KTQGUI.dsIndex];
				if (curResult.edaresult){
					var nodeId = n;
					for(var i=0; i < curResult.edaresult.length;i++)
					{
						var r = curResult.edaresult[i];
						if (r.nodeId + "" == nodeId)
						{
							KTEDA.drawEDAChart(r, 'edaContainer');
						}
					}
				}
				$('.cd-panel').addClass('is-visible');
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
					// var g = KTQGUI.simplifyGraphByMergingNodes(KTQGUI.getEDPG(), 6);
					// KTQGUI.createGraphIndex(g);
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
				return {"nodes":nodes, "edges":edges, "attrs": KTQGUI.getEDPG().attrs};
			},

			simplifyGraphByMergingNodes: function(g, threshold){
				if (g.nodes.length >= threshold)
				{
					var ignoreType = KTQGUI.dsResults[KTQGUI.dsIndex].ignoreType;
					//do the node merging
					//by combining nodes with the same types
					var type2nodes = {};
					for(var i=0;i<g.nodes.length;i++){
						var n = g.nodes[i];
						var labels = n.label.split(",");
						for(var j=0;j<labels.length;j++){
							var label = $.trim(labels[j]);
							if (ignoreType && ignoreType.indexOf(label)>=0)
								continue;
							var arr = type2nodes[label];
							if (!arr)
							{
								arr = [];
								type2nodes[label] = arr;
							}
							arr.push(n);
						}
					}
					var dicEntryArr = [];
					for(var t in type2nodes){
						dicEntryArr.push({"t":t, "arr":type2nodes[t]});
					}
					dicEntryArr.sort(function(a, b){
						return b.arr.length - a.arr.length;
					});

					var realDic = {};
					var node2Merge = {};
					var count = 0;
					var sep = ",";
					var mergedNodeIdstr = "";
					var idx = -1;
					for(var i=0;i<dicEntryArr.length;i++){
						var t = dicEntryArr[i].t;
						if (dicEntryArr[i].arr.length <= 1)
							break;
						var merged = 0;
						for(var j=0;j<dicEntryArr[i].arr.length;j++){
							var n = dicEntryArr[i].arr[j];
							if (mergedNodeIdstr.indexOf(sep + n.id + sep)<0){
								node2Merge[n.id] = t;
								var tArr = realDic[t];
								if (!tArr)
								{
									tArr = [];
									realDic[t] =  tArr;
								}
								tArr.push(n);
								mergedNodeIdstr += sep + n.id + sep;
								merged++;
							}
						}
						count += merged > 0 ? merged - 1 : 0;
						if (g.nodes.length - count < threshold){
							idx = i;
							break;
						}
					}

					//do simplifying
					var edges = [];
					var nodes = [];
					for(var i=0;i<g.nodes.length;i++){
						var n = g.nodes[i];
						if (mergedNodeIdstr.indexOf(sep + n.id + sep) < 0)
						{
							nodes.push(n);
						}
					}
					for (var t in realDic){
						var n = {};
						n.id = "m_" + t;
						n.label = t;
						var insNum = 0;
						for(var i=0;i<realDic[t].length;i++){
							insNum += realDic[t][i].instanceNumber;
						}
						n.instanceNumber = insNum;
						n.nodes = realDic[t];
						nodes.push(n); 
					}
					for(var i=0;i<g.edges.length;i++){
						var e = g.edges[i];
						var bChange = false;
						var from = null, to = null;
						if (node2Merge[e.from])
						{
							bChange = true;
							from = "m_" + node2Merge[e.from];
						}
						if (node2Merge[e.to])
						{
							bChange = true;
							to = "m_" + node2Merge[e.to];
						}
						if (bChange)
						{
							var e1 = {};
							e1.from = from ? from : e.from;
							e1.to = to ? to : e.to;
							e1.label = e.label;
							edges.push(e1);
						}else
						{
							edges.push(e);
						}
					}
					return {"nodes": nodes, "edges": edges, "attrs": KTQGUI.getEDPG().attrs};
				}else
					return g;
			},
			
			joinArray : function(arr, sep){
				var s = sep;
				for(var i=0;i<arr.length;i++)
					s += arr[i] + sep;
				return s;
			},
			
			filterGraphByNodes: function(graph, nodeIds, edges){
				var sep = ",";
				var idStr = KTQGUI.joinArray(nodeIds, sep);
				var linkedNodes = [];
				var g = {};
				g.nodes = [];
				g.edges = [];
				
				if (edges && edges.length > 0)
				{
					KTQGUI.filterEdgesByEdges(graph, g, edges);
				}
				else
				{
					KTQGUI.filterEdgesByNodes(idStr, sep, graph, g, linkedNodes);
					idStr += KTQGUI.joinArray(linkedNodes, sep);
				}
				
				for(var i=0; i< graph.nodes.length; i++)
				{
					var node = graph.nodes[i];
					if (idStr.indexOf(sep + node.id + sep) >= 0)
						g.nodes.push(node);
				}
				
				
				return g;
			},
			
			filterEdgesByNodes: function(idStr, sep, graph, g, linkedNodes){
				for(var i=0; i< graph.edges.length; i++)
				{
					var bMatch = false, bn1match = false;
					var notMatched = [];
					
					var curEdge = graph.edges[i];
					var n1 = curEdge.from;
					var n2 = curEdge.to;
					
					var n1in = idStr.indexOf(sep + n1 + sep) >= 0;
					var n2in = idStr.indexOf(sep + n2 + sep) >= 0;
					if (n1in || n2in)
					{
						g.edges.push(curEdge);

						if (!n1in) linkedNodes.push(n1);
						if (!n2in) linkedNodes.push(n2);
					}
				}
			},
			
			filterEdgesByEdges: function(graph, g, selectedEdges){
				for(var n1 in graph.edges)
				{
					var newEdges = {};
					
					var candidateEdges = [];
					for (var i=0; i<selectedEdges.length; i++)
					{
						var edge = selectedEdges[i];
						if (edge.n1 == n1)
						{
							candidateEdges.push(edge);
						}
					}
					
					if (candidateEdges.length == 0)
						continue;
					
					newEdges[n1] = {};		
					
					for(var n2 in graph.edges[n1])
					{
						for(var j=0;j<graph.edges[n1][n2].length;j++)
						{
							var e = graph.edges[n1][n2][j];
							for(var i=0;i<candidateEdges.length;i++)
							{
								if (candidateEdges[i].n2 == n2 && KTQGUI.fancyLabel(candidateEdges[i].link) == KTQGUI.fancyLabel(e.label) )
								{
									if (candidateEdges[i].color) e.color = candidateEdges[i].color;
									if (newEdges[n1][n2])
										newEdges[n1][n2].push( e );
									else
										newEdges[n1][n2] = [e];
								}
							}
						}						
					}
					if (g.edges[n1])
					{
						for (var n2 in newEdges[n1])
							g.edges[n1][n2] = newEdges[n1][n2];
					}else
					{
						g.edges[n1] = newEdges[n1];
					}
				}
			},
			
			/*
			* query: the rule string like `Person(a) -> hasFriend(a, b) Person(b)`
			*/
			parseMiningQuery: function(query){
				//reset nodeColorMap
				KTQGUI.nodeColorMap = {};

				var arr = query.split("->");
				var body = KTQGUI.parseRulePart(arr[0]);
				var head = KTQGUI.parseRulePart(arr[1]);
				
				var nodes = KTQGUI.findNodesByTypeLabels(body.nodes, '#0000FF');
				var mergedNodeMap = {};
				for(var p in body.nodes)
					mergedNodeMap[p] = body.nodes[p];
				
				nodes = nodes.concat(KTQGUI.findNodesByTypeLabels(head.nodes, '#00FF00'));
				for(var p in head.nodes)
					mergedNodeMap[p] = head.nodes[p];
				
				var edges = KTQGUI.findEdgesByNodeNameEdgeLabel(mergedNodeMap, body.edges, "#0000FF");
				
				
					
				edges = edges.concat(KTQGUI.findEdgesByNodeNameEdgeLabel(mergedNodeMap, head.edges, "#00FF00"));
				return {nodes: nodes, edges: edges};
			},
			
			/*
			* r: body/head part of a rule: `hasFriend(a, b) Person(b)`
			*/
			parseRulePart: function(r){				
				var typePattern = /([^\(\)]+)\(([a-z]{1})\)/ig;
				var edgePatterh = /([^\(\)]+)\(([a-z]{1}), ([a-z]{1})\)/ig;
				var nodes = {};
				var edges = [];
				var match = null;
				while ( (match = typePattern.exec(r)) != null)
				{
					if (nodes[match[2]])
					{
						nodes[match[2]] = {label: nodes[match[2]].label + ", " + $.trim(match[1])};
					}
					else
						nodes[match[2]] = {label: $.trim(match[1])};
				}
				
				while ( (match = edgePatterh.exec(r)) != null)
				{
					edges.push({n1: $.trim(match[2]), n2: $.trim(match[3]), e: $.trim(match[1])});
				}
				return {nodes: nodes, edges:edges};
			},
			
			/*
			* nodeMap: {"varName": {label: "label"}}
			* the function will add a new attribute of
			* name for each "varName". The name is the
			* node name in the EDP Graph/particleSystem e.g. n1.
			*/
			findNodesByTypeLabels: function(nodeMap, color){
				var nodes = [];
				var edpGraph = KTQGUI.getEDPG();
				for(var nodeName in edpGraph.nodes)
				{
					for(var varName in nodeMap)
					{
						if (KTQGUI.fancyLabel(edpGraph.nodes[nodeName].label ) == KTQGUI.fancyLabel( nodeMap[varName].label) )
						{
							nodes.push(nodeName);
							if (color)
								KTQGUI.nodeColorMap[nodeName] = color;
							nodeMap[varName].name = nodeName;
						}
					}
				}
				return nodes;
			},
			
			/*
			* nodeMap: {"varName": {label: "node label", name: "node name"}}
			* edgeLabels: {n1: "node1 variable name", n2: "node 2 variable name", e: "label"}
			*/
			findEdgesByNodeNameEdgeLabel: function(nodeMap, edgeLabels, color){
				var edges = [];
				var edpGraph = KTQGUI.getEDPG();
				for(var src in edpGraph.edges)
				{
					for(var target in edpGraph.edges[src])
					{
						for(var j=0;j<edpGraph.edges[src][target].length;j++)
						{
							var edge = edpGraph.edges[src][target][j];
							for(var i=0;i<edgeLabels.length;i++)
							{
								if (KTQGUI.fancyLabel(edge.label) == KTQGUI.fancyLabel(edgeLabels[i].e) )
								{
									var n1 = nodeMap[edgeLabels[i].n1] ? nodeMap[edgeLabels[i].n1].name : null;
									var n2 = nodeMap[edgeLabels[i].n2] ? nodeMap[edgeLabels[i].n2].name : null;
									if ((!n1 || src == n1) && (!n2 || target == n2))
									{
										var e = {n1: src, n2: target, link: edge.label};
										if (color) e.color = color;
										edges.push(e);
									}
								}
							} 
						}
					}					
				}
				return edges;
			},

			/**merge dataset function**/
			mergeFromUserDef: function(){
				var dsIdx = $('#dsList').val();
				if (dsIdx > -1)
				{
					var curNode = $('#curConcepts').val();
					var linkedNode = $('#dsConcepts').val();
					if (curNode && linkedNode)
					{
						var curResult = KTQGUI.dsResults[KTQGUI.dsIndex];
						curResult.linkDataset = {};
						curResult.linkDataset.index = dsIdx;
						curResult.linkDataset.linkedNodeId = linkedNode;
						curResult.linkDataset.linkingNodeId = curNode;
						KTQGUI.mergeLinkedDatasetGraph();
						return;
					}

				}
				alert('Please check the linkage setting.');
			},

			mergeLinkedDatasetGraph: function(){
				var curResult = KTQGUI.dsResults[KTQGUI.dsIndex];
				if (curResult.linkDataset)
				{
					var dsData = KTQGUI.dsResults[curResult.linkDataset.index];
					var g4add = KTQGUI.filterGraphByNodes(dsData.edp, [curResult.linkDataset.linkedNodeId]);
					console.log($.toJSON(g4add));
					nameMap = {};
					nameMap[curResult.linkDataset.linkedNodeId] = curResult.linkDataset.linkingNodeId;
					var newG = KTQGUI.renamteNodes(g4add, dsData.attrs, 'l', nameMap, curResult.edp, curResult.attrs);
					console.log($.toJSON(newG));
					KTQGUI.particleSystem.merge(newG);
				}
			},

			getMapOrNewName: function(n, prefix, nameMap){
				return nameMap[n]? nameMap[n] : prefix + n;
			},

			renamteNodes: function(g, attrs, prefix, nameMap, mergeG, mergeAttrs){
				var newG = mergeG ? mergeG : {};
				
				newG.edges = newG.edges ? newG.edges : {};
				var edges = newG.edges;
				for(var n1 in g.edges )
				{
					var newN1 = {};
					edges[KTQGUI.getMapOrNewName(n1, prefix, nameMap)] = newN1;
					for(var n2 in g.edges[n1])
					{
						var newN2 = {};
						newN1[KTQGUI.getMapOrNewName(n2, prefix, nameMap)] = g.edges[n1][n2];
					}
				}
				
				var usedAttrs = {};

				newG.nodes = newG.nodes ? newG.nodes : {};
				var nodes = newG.nodes;
				for(var n in g.nodes)
				{
					var nodeName = KTQGUI.getMapOrNewName(n, prefix, nameMap); 
					nodes[nodeName] = g.nodes[n];
					nodes[nodeName].linked = true;
					usedAttrs[nodeName] = attrs[n];
					mergeAttrs[nodeName] = attrs[n];
				}

				return newG;
			},

			zoomOutEDPGraph: function(g, threshold){
				var b = "<!=!>";
				var nodes2removeStr = "";
				for(var n in g.nodes)
				{
					var node = g.nodes[n];
					if (node.instanceNumber <= threshold)
					{
						delete g.nodes[n];
						nodes2removeStr += b + n + b;
					}
				}
				var nodes2stayStr = "";
				for(var n1 in g.edges)
				{
					if (nodes2removeStr.indexOf(b + n1 + b) >= 0)
						delete g.edges[n1];
					else
					{
						var n1edge2stay = false;
						for(var n2 in g.edges[n1])
						{
							if (nodes2removeStr.indexOf(b + n2 + b) < 0)
							{
								n1edge2stay = true;
								nodes2stayStr += b + n2 + b;
							}else
								delete g.edges[n1][n2];
						}			
						if (n1edge2stay)
							nodes2stayStr += b + n1 + b;
						else
							delete g.edges[n1];
					}					
				}
				for(var n in g.nodes)
				{
					if (nodes2stayStr.indexOf(b + n + b) < 0)
					{
						delete g.nodes[n];
					}
				}
			}
		}
	}
})(jQuery);