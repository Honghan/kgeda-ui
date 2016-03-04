var dsResults = 
[
  {
    "ds": "ADR",
    "edp": {
      "nodes": [
        {
          "instanceNumber": 170196,
          "label": "ns0:Patient",
          "attributeNode": false,
          "id": "0"
        },
        {
          "instanceNumber": 18,
          "label": "ns1:Property",
          "attributeNode": false,
          "id": "1"
        },
        {
          "instanceNumber": 5,
          "label": "Owl:Thing",
          "attributeNode": false,
          "id": "2"
        },
        {
          "instanceNumber": 66,
          "label": "ns0:ADRType",
          "attributeNode": false,
          "id": "3"
        },
        {
          "instanceNumber": 4695076,
          "label": "ns0:13_025_EXPERT_ADR_Data",
          "attributeNode": false,
          "id": "4"
        },
        {
          "instanceNumber": 3,
          "label": "ns2:Class",
          "attributeNode": false,
          "id": "5"
        }
      ],
      "edges": [
        {
          "label": "ns3:1715279",
          "node1Instance": 4695076,
          "node2Instance": 170196,
          "from": "4",
          "attributeNode": false,
          "to": "0",
          "directed": true
        },
        {
          "label": "ns3:6318953",
          "node1Instance": 4695076,
          "node2Instance": 66,
          "from": "4",
          "attributeNode": false,
          "to": "3",
          "directed": true
        }
      ],
      "prefixes": [
        "http://core.brc.iop.kcl.ac.uk/kg/cris/adr/vocab/",
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "http://www.w3.org/2000/01/rdf-schema#",
        "http://core.brc.iop.kcl.ac.uk/kg/cris/adr/13_025/EXPERT_ADR_Data/"
      ],
      "attrs": {
        "0": [],
        "1": [
          "ns2:label"
        ],
        "2": [],
        "3": [],
        "4": [
          "ns0:13_025_EXPERT_ADR_Data_annotation_start",
          "ns0:13_025_EXPERT_ADR_Data_Negation",
          "ns0:13_025_EXPERT_ADR_Data_CN_Doc_ID",
          "ns0:13_025_EXPERT_ADR_Data_Temporality",
          "ns0:13_025_EXPERT_ADR_Data_src_col",
          "ns0:13_025_EXPERT_ADR_Data_Sentence",
          "ns0:13_025_EXPERT_ADR_Data_Experiencer",
          "ns0:13_025_EXPERT_ADR_Data_ADE_Status",
          "ns0:13_025_EXPERT_ADR_Data_ADE_Date",
          "ns0:13_025_EXPERT_ADR_Data_gaterun",
          "ns0:13_025_EXPERT_ADR_Data_annotation_end",
          "ns0:13_025_EXPERT_ADR_Data_src_table",
          "ns0:13_025_EXPERT_ADR_Data_JAPERule",
          "ns0:13_025_EXPERT_ADR_Data_date_modified"
        ],
        "5": [
          "ns2:label"
        ]
      }
    },
    "GQQueries": [],
    "MiningQueires": [],
    "edaresult": [
      {
        "nodeLabel": "13_025_EXPERT_ADR_Data",
        "nodeId": 4,
        "relNodeTypeAR": {},
        "disjointTypes": [],
        "relObjectAR": {
          "13_025_EXPERT_ADR_Data_Negation": {
            "Affirmed": 4695076
          },
          "13_025_EXPERT_ADR_Data_Temporality": {
            "Recent": 4695076
          },
          "13_025_EXPERT_ADR_Data_src_col": {
            "Attachment_Text": 1223231,
            "Comments": 2671349,
            "Current_Problem": 26526,
            "Care_Plan_Outcome_Detail": 49725,
            "Assessment_Summary_Comments": 11101,
            "Risk_Event_Description": 9686,
            "Mental_State_Comments": 31134,
            "Personal_History": 4203,
            "Drug_And_Alcohol": 2199,
            "Body": 3,
            "Clinical_Note_Text": 652017,
            "Brief_Summary": 12590,
            "Discharge_Plan": 1312
          },
          "13_025_EXPERT_ADR_Data_Experiencer": {
            "Patient": 4695076
          },
          "13_025_EXPERT_ADR_Data_ADE_Status": {
            "Yes": 4695076
          },
          "13_025_EXPERT_ADR_Data_gaterun": {
            "545^^http://www.w3.org/2001/XMLSchema#integer": 4695076
          },
          "13_025_EXPERT_ADR_Data_src_table": {
            "Attachment": 1223230,
            "Event": 2607824,
            "CAMHS_Event": 62496,
            "Presenting_Circumstances": 26526,
            "Care_Plan_Mental_Health": 49725,
            "Mental_state_formulation": 42235,
            "Risk_Event": 9686,
            "History": 6402,
            "CCS_Correspondence": 4,
            "Ward_Progress_Note": 652017,
            "Discharge_Notification_Summary": 14931
          },
          "13_025_EXPERT_ADR_Data_JAPERule": {
            "No": 4365793,
            "DueToDrug": 9573,
            "someadr": 77635,
            "your": 214206,
            "treatmentadr": 18652,
            "StausYes1": 7228,
            "drugadmin": 1989
          }
        },
        "attrOrdinary": {
          "13_025_EXPERT_ADR_Data_date_modified": {
            "[2009-01-12, 2011-05-26]": 1469813,
            "[2011-05-26, 2013-10-06]": 1346754,
            "[2013-10-06, 2016-02-17]": 1388323,
            "[2016-02-17, 2018-07-01]": 490186
          }
        },
        "relObjNum": {}
      }
    ]
  }
];