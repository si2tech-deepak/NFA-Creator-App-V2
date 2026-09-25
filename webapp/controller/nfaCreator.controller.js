sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"],
  function (Controller, JSONModel, MessageBox, MessageToast, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("com.df.nfa.creator_v2.controller.nfaCreator", {
      onInit: function () {
      this.getOwnerComponent()
        .getRouter()
        .getRoute("RoutenfaCreator")
        .attachPatternMatched(this._loadNfaData, this);
      this._loadNfaData();
      },

      //OnCreate function to open the fragment for the COAL and Material selection

      //       onCreate: function () {
      //     var oView = this.getView();

      //     // Create model once (reusable)
      //     if (!this._oCreateModel) {
      //         this._oCreateModel = new sap.ui.model.json.JSONModel({
      //             selectedIndex: 0,
      //             documentNo: ""
      //         });
      //     }

      //     // Load fragment once (lazy loading)
      //     if (!this._oCreateDialog) {
      //         this._oCreateDialog = sap.ui.xmlfragment(
      //             oView.getId(),
      //             "com.df.nfa.creator_v2.view.fragments.CreateDialog",
      //             this
      //         );
      //         oView.addDependent(this._oCreateDialog);
      //         this._oCreateDialog.setModel(this._oCreateModel, "createModel");
      //     }

      //     // Reset data on every open
      //     this._oCreateModel.setData({
      //         selectedIndex: 0,
      //         documentNo: ""
      //     });

      //     this._oCreateDialog.open();
      // },

      onRadioSelect: function (oEvent) {
        var iIndex = oEvent.getSource().getSelectedIndex();
        this._oCreateModel.setProperty("/selectedIndex", iIndex);
      },

      // onConfirmCreate: function () {

      //     var oData = this._oCreateModel.getData();
      //     var sDocNo = oData.documentNo;

      //     if (!sDocNo) {
      //         sap.m.MessageToast.show("Please enter Document Number");
      //         return;
      //     }

      //     this._oCreateDialog.close();

      //     // Navigate to NFA Create with Ariba DocNo
      //     this.getOwnerComponent().getRouter().navTo("RoutenfaCreate", {
      //         mode: "ARIBA",
      //         docNo: sDocNo
      //     });
      // },

      // onCloseCreate: function () {
      //     this._oCreateDialog.close();
      // },

      onCreate: function () {
        var oView = this.getView();

        if (!this._oCreateModel) {
          this._oCreateModel = new sap.ui.model.json.JSONModel({
            documentNo: "",
          });
        }

        if (!this._oCreateDialog) {
          this._oCreateDialog = sap.ui.xmlfragment(
            oView.getId(),
            "com.df.nfa.creator_v2.view.fragments.CreateDialog",
            this,
          );
          oView.addDependent(this._oCreateDialog);
          this._oCreateDialog.setModel(this._oCreateModel, "createModel");
        }

        this._oCreateModel.setData({
          documentNo: "",
        });

        this._oCreateDialog.open();
      },

      // onConfirmCreate: function () {
      //     var oData = this._oCreateModel.getData();
      //     var sDocNo = oData.documentNo;

      //     if (!sDocNo) {
      //         sap.m.MessageToast.show("Please enter Document Number");
      //         return;
      //     }

      //     this._oCreateDialog.close();

      //     this.getOwnerComponent().getRouter().navTo("RoutenfaCreate", {
      //         mode: "ARIBA",
      //         docNo: sDocNo
      //     });
      // },
      onConfirmCreate: function () {
        var oData = this._oCreateModel.getData();
        var sDocNo = oData.documentNo;

        if (!sDocNo) {
          MessageToast.show("Please enter Document Number");
          return;
        }

        this._oCreateDialog.close();

        var oODataModel = this.getOwnerComponent().getModel();
        var that = this;

        sap.ui.core.BusyIndicator.show(0);

        oODataModel.create(
          "/et_nfa_detailsSet",
          { AribaDocNo: sDocNo, Status: "NEW" },
          {
            success: function () {
              sap.ui.core.BusyIndicator.hide();
              that.getOwnerComponent().getRouter().navTo("RoutenfaCreate", {
                mode: "ARIBA",
                docNo: sDocNo
              });
            },
            error: function () {
              sap.ui.core.BusyIndicator.hide();
              MessageToast.show("Error creating NFA from Ariba");
            }
          }
        );
      },

      onCloseCreate: function () {
        this._oCreateDialog.close();
      },

      onOpenActionSheet: function (oEvent) {
        var oView = this.getView();

        if (!this._oActionSheet) {
          this._oActionSheet = sap.ui.xmlfragment(
            oView.getId(),
            "com.df.nfa.creator_v2.view.fragments.ActionSheet",
            this,
          );
          oView.addDependent(this._oActionSheet);
        }

        this._oActionSheet.openBy(oEvent.getSource());
      },
      // _onRouteMatched: function (oEvent) {
      //   const sRouteName = oEvent.getParameter("name");
      //   this.getView().getModel("nav").setProperty("/selectedKey", sRouteName);
      // },

      // _loadNfaData: function () {
      //   var oModel = this.getOwnerComponent().getModel();
      //   var that = this;

      //   var sUserId = "", sFullName = "";
      //   try {
      //     var oUserInfo = sap.ushell.Container.getService("UserInfo");
      //     sUserId   = oUserInfo.getId();
      //     sFullName = oUserInfo.getFullName();
      //   } catch (e) {
      //     console.warn("UserInfo service unavailable, falling back.", e);
      //   }
      //   this._currentUserId   = sUserId;
      //   //this._currentFullName = sFullName;

      //   oModel.read("/et_nfa_detailsSet", {
      //     filters: [
      //       new Filter("CreatedBy", FilterOperator.EQ, "PROTOVITI_2")
      //       //new Filter("CreatedBy", FilterOperator.EQ, sFullName )
      //     ],
      //     success: function (oData) {
      //       console.log("Fetched NFA Data:", oData.results);
      //       var aNfaList = oData.results.map(function (oItem) {
      //         var oDate = oItem.BiDate ? new Date(oItem.BiDate) : null;
      //         return {
      //           eventId:       oItem.NfaRefNo,
      //           eventName:     oItem.NfaTitle,
      //           aribaDocNo:    oItem.AribaDocNo || "",
      //           requestedOn:   oDate ? oDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ") : "",
      //           biDateRaw:     oDate,
      //           currentStatus: oItem.Status || "Draft",
      //           statusState:   that._getStatusState(oItem.Status || "Draft")
      //         };
      //       });

      //       aNfaList.sort(function (a, b) {
      //         var dA = a.biDateRaw ? a.biDateRaw.getTime() : 0;
      //         var dB = b.biDateRaw ? b.biDateRaw.getTime() : 0;
      //         return dB - dA;
      //       });

      //       var aApprovedList       = aNfaList.filter(function (o) { return o.currentStatus === "Approved"; });
      //       var aPendingList        = aNfaList.filter(function (o) { return o.currentStatus === "Pending" || o.currentStatus === "Approval Pending" || o.currentStatus === "Send for Approval"; });
      //       var aDraftList          = aNfaList.filter(function (o) { return o.currentStatus === "Draft"; });
      //       var aApprovalPendingList = aNfaList.filter(function (o) { return o.currentStatus === "Approval Pending" || o.currentStatus === "Send for Approval"; });
      //       var aPOCreatedList      = aNfaList.filter(function (o) { return o.currentStatus === "PO Created"; });
      //       var aPOContractList     = aNfaList.filter(function (o) { return o.currentStatus === "PO, Contract Created"; });
      //       var aContractSAList     = aNfaList.filter(function (o) { return o.currentStatus === "Contract, SA Created"; });
      //       var aPOSAList           = aNfaList.filter(function (o) { return o.currentStatus === "PO, SA Created"; });
      //       var aCompletedList      = aNfaList.filter(function (o) { return o.currentStatus === "Completed"; });
      //       var aRejectedList       = aNfaList.filter(function (o) { return o.currentStatus === "Rejected"; });
      //       var aExcludedStatuses = ["Draft", "Approval Pending", "Approved", "Rejected", "Send for Approval", "Pending"];
      //       var aDocumentsList = aNfaList.filter(function (o) {
      //         return aExcludedStatuses.indexOf(o.currentStatus) === -1;
      //       });

      //       var oJSONModel = new JSONModel({
      //         nfaList:                    aNfaList,
      //         _fullNfaList:               aNfaList,
      //         approvedList:               aApprovedList,
      //         _fullApprovedList:          aApprovedList,
      //         pendingList:                aPendingList,
      //         _fullPendingList:           aPendingList,
      //         draftList:                  aDraftList,
      //         _fullDraftList:             aDraftList,
      //         approvalPendingList:        aApprovalPendingList,
      //         _fullApprovalPendingList:   aApprovalPendingList,
      //         rejectedList:               aRejectedList,
      //         _fullRejectedList:          aRejectedList,
      //         poCreatedList:              aPOCreatedList,
      //         _fullPOCreatedList:         aPOCreatedList,
      //         poContractList:             aPOContractList,
      //         _fullPOContractList:        aPOContractList,
      //         contractSAList:             aContractSAList,
      //         _fullContractSAList:        aContractSAList,
      //         poSAList:                   aPOSAList,
      //         _fullPOSAList:              aPOSAList,
      //         completedList:              aCompletedList,
      //         _fullCompletedList:         aCompletedList,
      //         documentsList:              aDocumentsList,
      //         _fullDocumentsList:         aDocumentsList,
      //         approvedSelected:           0,
      //         documentsSelected:          0
      //       });
      //       that.getView().setModel(oJSONModel);
      //     },
      //     error: function (oError) {
      //       console.error("Error reading et_nfa_detailsSet:", oError);
      //     }
      //   });
      // }

_loadNfaData: function () {
    var oModel = this.getOwnerComponent().getModel();
    var that = this;

    var sUserId = "", sFullName = "";
    try {
       var oUserInfo = sap.ushell.Container.getService("UserInfo");
        sUserId = oUserInfo.getId();
        sFullName = oUserInfo.getFullName();
    } catch (e) {
        console.warn("UserInfo service unavailable, falling back.", e);
    }

    this._currentUserId = sUserId;
    this._currentFullName = sFullName;

    // OR Filter: CreatedBy = User ID OR CreatedBy = Full Name
    var oCreatedByFilter = new Filter({
        filters: [
            new Filter("CreatedBy", FilterOperator.EQ, sUserId), // For testing purposes, replace with actual user ID
            new Filter("CreatedBy", FilterOperator.EQ, sFullName) // For testing purposes, replace with actual full name")
        ],
        and: false
    });

    oModel.read("/et_nfa_detailsSet", {
        filters: [oCreatedByFilter],
        success: function (oData) {
            console.log("Fetched NFA Data:", oData.results);

            var aNfaList = oData.results.map(function (oItem) {
                var oDate = oItem.BiDate ? new Date(oItem.BiDate) : null;
                return {
                    eventId: oItem.NfaRefNo,
                    eventName: oItem.NfaTitle,
                    aribaDocNo: oItem.AribaDocNo || "",
                    requestedOn: oDate
                        ? oDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                          }).replace(/ /g, " ")
                        : "",
                    biDateRaw: oDate,
                    currentStatus: oItem.Status || "Draft",
                    statusState: that._getStatusState(oItem.Status || "Draft"),
                    createdBy: oItem.CreatedBy || ""
                };
            });

            aNfaList.sort(function (a, b) {
                var dA = a.biDateRaw ? a.biDateRaw.getTime() : 0;
                var dB = b.biDateRaw ? b.biDateRaw.getTime() : 0;
                return dB - dA;
            });

            var aApprovedList = aNfaList.filter(function (o) {
                return o.currentStatus === "Approved";
            });

            var aPendingList = aNfaList.filter(function (o) {
                return o.currentStatus === "Pending" ||
                    o.currentStatus === "Approval Pending" ||
                    o.currentStatus === "Send for Approval";
            });

            var aDraftList = aNfaList.filter(function (o) {
                return o.currentStatus === "Draft";
            });

            var aApprovalPendingList = aNfaList.filter(function (o) {
                return o.currentStatus === "Approval Pending" ||
                    o.currentStatus === "Send for Approval";
            });

            var aPOCreatedList = aNfaList.filter(function (o) {
                return o.currentStatus === "PO Created";
            });

            var aPOContractList = aNfaList.filter(function (o) {
                return o.currentStatus === "PO, Contract Created";
            });

            var aContractSAList = aNfaList.filter(function (o) {
                return o.currentStatus === "Contract, SA Created";
            });

            var aPOSAList = aNfaList.filter(function (o) {
                return o.currentStatus === "PO, SA Created";
            });

            var aCompletedList = aNfaList.filter(function (o) {
                return o.currentStatus === "Completed";
            });

            var aRejectedList = aNfaList.filter(function (o) {
                return o.currentStatus === "Rejected";
            });

            var aExcludedStatuses = [
                "Draft",
                "Approval Pending",
                "Approved",
                "Rejected",
                "Send for Approval",
                "Pending"
            ];

            var aDocumentsList = aNfaList.filter(function (o) {
                return aExcludedStatuses.indexOf(o.currentStatus) === -1;
            });

            var oJSONModel = new JSONModel({
                nfaList: aNfaList,
                _fullNfaList: aNfaList,
                approvedList: aApprovedList,
                _fullApprovedList: aApprovedList,
                pendingList: aPendingList,
                _fullPendingList: aPendingList,
                draftList: aDraftList,
                _fullDraftList: aDraftList,
                approvalPendingList: aApprovalPendingList,
                _fullApprovalPendingList: aApprovalPendingList,
                rejectedList: aRejectedList,
                _fullRejectedList: aRejectedList,
                poCreatedList: aPOCreatedList,
                _fullPOCreatedList: aPOCreatedList,
                poContractList: aPOContractList,
                _fullPOContractList: aPOContractList,
                contractSAList: aContractSAList,
                _fullContractSAList: aContractSAList,
                poSAList: aPOSAList,
                _fullPOSAList: aPOSAList,
                completedList: aCompletedList,
                _fullCompletedList: aCompletedList,
                documentsList: aDocumentsList,
                _fullDocumentsList: aDocumentsList,
                approvedSelected: 0,
                documentsSelected: 0
            });

            that.getView().setModel(oJSONModel);
        },
        error: function (oError) {
            console.error("Error reading et_nfa_detailsSet:", oError);
        }
    });
 }
 ,

      // _loadDummyData: function () {
      //   const oModel = new JSONModel({
      //     nfaList: [
      //       {
      //         eventId: "NFA-176823789589-cf4t0gik",
      //         eventName: "Upload Event creation",
      //         requestedOn: "13 Jan 2026",
      //         currentStatus: "Draft",
      //         statusState: "Information",
      //         level1: "Draft",
      //         level2: "Draft",
      //         level3: "Draft",
      //       },
      //       {
      //         eventId: "NFA-1768279139850-fnoyw6wk3",
      //         eventName: "Test project 1",
      //         requestedOn: "13 Jan 2026",
      //         currentStatus: "Approved",
      //         statusState: "Success",
      //         level1: "Approved",
      //         level2: "Approved",
      //         level3: "Approved",
      //       },
      //       {
      //         eventId: "NFA-1768199917450-swdv22gck",
      //         eventName: "RFP for Solar Power System Components",
      //         requestedOn: "12 Jan 2026",
      //         currentStatus: "Draft",
      //         statusState: "Information",
      //         level1: "Draft",
      //         level2: "Draft",
      //         level3: "Draft",
      //       },
      //     ],
      //   });

      //   this.getView().setModel(oModel);
      // }

      /* SIDE NAVIGATION */
      onNavItemSelect: function (oEvent) {
        const sKey = oEvent.getParameter("item").getKey();
        this.getOwnerComponent().getRouter().navTo(sKey);
      },
      onCreateNew: function () {
        this.getOwnerComponent().getRouter().navTo("RoutenfaCreate", {
          mode: "MANUAL",
          docNo: "",
        });
      },
      onResetFilter: function () {
        this.byId("filterNFAExpression").setValue("");
        this.byId("filterStartDate").setValue("");
        this.byId("filterEndDate").setValue("");
        this.byId("filterStatus").setSelectedKey("");
        var oModel = this.getView().getModel();
        oModel.setProperty("/nfaList",           oModel.getProperty("/_fullNfaList")           || []);
        oModel.setProperty("/approvedList",       oModel.getProperty("/_fullApprovedList")       || []);
        oModel.setProperty("/pendingList",        oModel.getProperty("/_fullPendingList")        || []);
        oModel.setProperty("/draftList",          oModel.getProperty("/_fullDraftList")          || []);
        oModel.setProperty("/approvalPendingList",oModel.getProperty("/_fullApprovalPendingList")|| []);
        oModel.setProperty("/rejectedList",       oModel.getProperty("/_fullRejectedList")       || []);
        oModel.setProperty("/poCreatedList",      oModel.getProperty("/_fullPOCreatedList")      || []);
        oModel.setProperty("/poContractList",     oModel.getProperty("/_fullPOContractList")     || []);
        oModel.setProperty("/contractSAList",     oModel.getProperty("/_fullContractSAList")     || []);
        oModel.setProperty("/poSAList",           oModel.getProperty("/_fullPOSAList")           || []);
        oModel.setProperty("/completedList",      oModel.getProperty("/_fullCompletedList")      || []);
        oModel.setProperty("/documentsList",      oModel.getProperty("/_fullDocumentsList")      || []);
      },

      onApplyFilter: function () {
        var sNfaExpr   = this.byId("filterNFAExpression").getValue().trim().toLowerCase();
        var sStatus    = this.byId("filterStatus").getSelectedKey();
        var sDocStatus = "";
        var oStartDate = this.byId("filterStartDate").getDateValue();
        var oEndDate   = this.byId("filterEndDate").getDateValue();

        if (oEndDate) {
          oEndDate = new Date(oEndDate);
          oEndDate.setHours(23, 59, 59, 999);
        }

        var oModel = this.getView().getModel();

        var mStatusKeyMap = {
          "Pending":             ["Pending", "Approval Pending", "Send for Approval"],
          "ContractCreated":     ["Contract Created"],
          "POAndSACreate":       ["PO & SA Create", "PO, SA Created"],
          "POAndContractCreate": ["PO & Contract Create", "PO, Contract Created"],
          "SAAndContractCreate": ["SA & Contract Create", "Contract, SA Created"],
          "Complete":            ["Complete", "Completed"]
        };

        var fnFilter = function (oItem) {
          if (sNfaExpr && oItem.eventId.toLowerCase().indexOf(sNfaExpr) === -1) { return false; }
          var sActiveStatus = sStatus || sDocStatus;
          if (sActiveStatus) {
            var aAllowed = mStatusKeyMap[sActiveStatus];
            if (aAllowed) {
              if (aAllowed.indexOf(oItem.currentStatus) === -1) { return false; }
            } else if (oItem.currentStatus !== sActiveStatus) { return false; }
          }
          if (oItem.biDateRaw) {
            if (oStartDate && oItem.biDateRaw < oStartDate) { return false; }
            if (oEndDate   && oItem.biDateRaw > oEndDate)   { return false; }
          }
          return true;
        };

        var fnDocFilter = function (oItem) {
          if (sNfaExpr && oItem.eventId.toLowerCase().indexOf(sNfaExpr) === -1) { return false; }
          var sActiveDocStatus = sDocStatus || sStatus;
          if (sActiveDocStatus) {
            var aAllowed = mStatusKeyMap[sActiveDocStatus];
            if (aAllowed) {
              if (aAllowed.indexOf(oItem.currentStatus) === -1) { return false; }
            } else if (oItem.currentStatus !== sActiveDocStatus) { return false; }
          }
          if (oItem.biDateRaw) {
            if (oStartDate && oItem.biDateRaw < oStartDate) { return false; }
            if (oEndDate   && oItem.biDateRaw > oEndDate)   { return false; }
          }
          return true;
        };

        oModel.setProperty("/nfaList",           (oModel.getProperty("/_fullNfaList")           || []).filter(fnFilter));
        oModel.setProperty("/approvedList",       (oModel.getProperty("/_fullApprovedList")       || []).filter(fnFilter));
        oModel.setProperty("/pendingList",        (oModel.getProperty("/_fullPendingList")        || []).filter(fnFilter));
        oModel.setProperty("/draftList",          (oModel.getProperty("/_fullDraftList")          || []).filter(fnFilter));
        oModel.setProperty("/approvalPendingList",(oModel.getProperty("/_fullApprovalPendingList") || []).filter(fnFilter));
        oModel.setProperty("/rejectedList",       (oModel.getProperty("/_fullRejectedList")       || []).filter(fnFilter));
        oModel.setProperty("/poCreatedList",      (oModel.getProperty("/_fullPOCreatedList")      || []).filter(fnFilter));
        oModel.setProperty("/poContractList",     (oModel.getProperty("/_fullPOContractList")     || []).filter(fnFilter));
        oModel.setProperty("/contractSAList",     (oModel.getProperty("/_fullContractSAList")     || []).filter(fnFilter));
        oModel.setProperty("/poSAList",           (oModel.getProperty("/_fullPOSAList")           || []).filter(fnFilter));
        oModel.setProperty("/completedList",      (oModel.getProperty("/_fullCompletedList")      || []).filter(fnFilter));
        oModel.setProperty("/documentsList",      (oModel.getProperty("/_fullDocumentsList")      || []).filter(fnDocFilter));
      },
      onViewLevels: function (oEvent) {
        var sNfaRefNo = oEvent.getSource().getBindingContext().getProperty("eventId");

        if (!this._oLevelsModel) {
          this._oLevelsModel = new JSONModel({ versions: [] });
          this.getView().setModel(this._oLevelsModel, "selectedItem");
        }

        this._oLevelsModel.setProperty("/versions", []);

        if (!this._oLevelsDialog) {
          this._oLevelsDialog = this.byId("levelsDialog");
        }
        this._oLevelsDialog.setTitle("Approval Levels - " + sNfaRefNo);
        this._oLevelsDialog.open();

        this.getOwnerComponent().getModel().read("/et_approval_dataSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          success: function (oData) {
            // Group by Version → Phase
            var oVersionMap = {};
            var aVersionOrder = [];
            oData.results.forEach(function (oItem) {
              var sVersion = oItem.Version || "1";
              var sPhase   = String(oItem.Phase || "1");
              var sSapId   = oItem.SapId || "";
              var sSapName = oItem.SapName || "";
              if (!oVersionMap[sVersion]) {
                oVersionMap[sVersion] = { phaseMap: {}, phaseOrder: [] };
                aVersionOrder.push(sVersion);
              }
              var oVer = oVersionMap[sVersion];
              if (!oVer.phaseMap[sPhase]) {
                oVer.phaseMap[sPhase] = [];
                oVer.phaseOrder.push(sPhase);
              }
              oVer.phaseMap[sPhase].push({
                level:   oItem.Sno,
                sapId:   sSapId,
                sapName: sSapName,
                status:  oItem.ApprovedRejectInfo === "A" ? "Approved" : oItem.ApprovedRejectInfo === "R" ? "Rejected" : "Pending",
                state:   oItem.ApprovedRejectInfo === "A" ? "Success"  : oItem.ApprovedRejectInfo === "R" ? "Error"    : "Warning"
              });
            });
            aVersionOrder.sort(function (a, b) { return parseInt(a) - parseInt(b); });
            var aVersions = aVersionOrder.map(function (sVersion) {
              var oVer = oVersionMap[sVersion];
              oVer.phaseOrder.sort(function (a, b) { return parseInt(a) - parseInt(b); });
              return {
                versionLabel: "Version " + parseInt(sVersion),
                phases: oVer.phaseOrder.map(function (sPhase) {
                  return { phaseLabel: "Phase " + sPhase, rows: oVer.phaseMap[sPhase] };
                })
              };
            });
            this._oLevelsModel.setProperty("/versions", aVersions);
          }.bind(this),
          error: function () {
            MessageToast.show("Failed to load approval levels.");
          }
        });
      },
      onCloseLevelsDialog: function () {
        this._oLevelsDialog.close();
      },

      onNavigateToDetails: function (oEvent) {
        var oSource = oEvent.getSource();
        var oContext = oSource.getBindingContext();
        var sEventId = oContext.getProperty("eventId");
        var sCurrentStatus = oContext.getProperty("currentStatus");
        var sAribaDocNo = oContext.getProperty("aribaDocNo") || "";

        // Reliably detect Documents tab by checking which table the row belongs to
        var oIconTabBar = this.byId("icontab1");
        var sSelectedTab = oIconTabBar ? oIconTabBar.getSelectedKey() : "";
        var bFromDocuments = sSelectedTab === "Documents";

        // Documents tab statuses: PO Created, PO+Contract, Contract+SA, PO+SA, Completed
        // These are statuses that exist ONLY in the Documents tab — use as a safety net too
        var aDocStatuses = ["PO Created", "PO, Contract Created", "Contract, SA Created", "PO, SA Created", "Completed", "Document Created"];
        var bIsDocStatus = aDocStatuses.indexOf(sCurrentStatus) !== -1;

        var aNoEditStatuses = ["Approval Pending", "Send for Approval", "Approved"];
        var bBlockEdit = aNoEditStatuses.indexOf(sCurrentStatus) !== -1;

        var sMode;
        if (bFromDocuments || bIsDocStatus) {
          // Documents tab: restricted edit — only Incoterms & Payment Terms editable, no add/remove vendor
          sMode = "docEdit";
        } else if (sCurrentStatus === "Approved") {
          sMode = "approved";
        } else if (bBlockEdit) {
          sMode = "view";
        } else if (sAribaDocNo) {
          sMode = "ARIBA";
        } else {
          sMode = "edit";
        }

        this.getOwnerComponent().getRouter().navTo("RoutenfaCreate", {
          mode: sMode,
          docNo: sEventId
        });
      },

      onApprovedSelectionChange: function () {
        var oTable = this.byId("approvedTable");
        var iCount = oTable.getSelectedItems().length;
        this.getView().getModel().setProperty("/approvedSelected", iCount);
      },

      onDocumentsSelectionChange: function () {
        var iCount = this.byId("documentsTable").getSelectedItems().length;
        this.getView().getModel().setProperty("/documentsSelected", iCount);
      },

      onOpenCreateDocumentFromDocs: function () {
        var oTable = this.byId("documentsTable");
        var aSelected = oTable.getSelectedItems();
        if (!aSelected.length) {
          MessageBox.warning("Please select at least one document.");
          return;
        }
        var aIds = aSelected.map(function (oItem) {
          return oItem.getBindingContext().getProperty("eventId");
        }).join(", ");
        if (!this._oCdModel) { this._oCdModel = new JSONModel(); }
        this._oCdModel.setData({
          selectedNfaIds: aIds, docTypeVisible: false, docTypeLabel: "",
          docTypes: [], selectedDocType: "", selectedRadio: "", busy: false
        });
        var oView = this.getView();
        if (!this._oCreateDocDialog) {
          this._oCreateDocDialog = sap.ui.xmlfragment(
            oView.getId(), "com.df.nfa.creator_v2.view.fragments.CreateDocumentDialog", this
          );
          oView.addDependent(this._oCreateDocDialog);
        }
        this._oCreateDocDialog.setModel(this._oCdModel, "cdModel");
        this.byId("docTypeRadioGroup").setSelectedIndex(-1);
        this._oCreateDocDialog.open();
      },

      onIconTabSelected: function () {
        var oTable = this.byId("approvedTable");
        if (oTable) {
          oTable.removeSelections(true);
          this.getView().getModel().setProperty("/approvedSelected", 0);
        }
        var oDocsTable = this.byId("documentsTable");
        if (oDocsTable) {
          oDocsTable.removeSelections(true);
          this.getView().getModel().setProperty("/documentsSelected", 0);
        }
      },

      onOpenCreateDocument: function () {
        var oTable = this.byId("approvedTable");
        var aSelected = oTable.getSelectedItems();
        if (!aSelected.length) {
          MessageBox.warning("Please select at least one approved NFA.");
          return;
        }

        var aIds = aSelected.map(function (oItem) {
          return oItem.getBindingContext().getProperty("eventId");
        });
        var sFirstNfaRefNo = aIds[0];
        var sJoinedIds = aIds.join(", ");
        var that = this;

        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel().read("/CreateUpdate_ButtonSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sFirstNfaRefNo)],
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            if (oData.results && oData.results.length) {
              that._openUpdateDocumentDialog(oData.results);
            } else {
              that._openCreateDocumentDialog(sJoinedIds);
            }
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            that._openCreateDocumentDialog(sJoinedIds);
          }
        });
      },

      _openUpdateDocumentDialog: function (aResults) {
        if (!this._oUpdateDocModel) {
          this._oUpdateDocModel = new JSONModel();
        }
        var oFirst = aResults[0];
        var bPO       = aResults.some(function (r) { return !!r.PurchaseOrder; });
        var bContract = aResults.some(function (r) { return !!r.ContractNo; });
        var bSA       = aResults.some(function (r) { return !!r.SchlAgreementNo; });
        this._oUpdateDocModel.setData({
          NfaRefNo:     oFirst.NfaRefNo    || "",
          DocumentType: oFirst.DocumentType || "",
          DocTypeDesc:  oFirst.DocTypeDesc  || "",
          bPO:          bPO,
          bContract:    bContract,
          bSA:          bSA,
          documents:    (function () {
            var aRows = [];
            aResults.forEach(function (r) {
              if (r.PurchaseOrder)   { aRows.push({ label: "Purchase Order",        value: r.PurchaseOrder }); }
              if (r.ContractNo)      { aRows.push({ label: "Contract",              value: r.ContractNo }); }
              if (r.SchlAgreementNo) { aRows.push({ label: "Scheduling Agreement", value: r.SchlAgreementNo }); }
            });
            return aRows;
          })(),
          busy: false
        });

        if (!this._oUpdateDocDialog) {
          this._oUpdateDocDialog = sap.ui.xmlfragment(
            this.getView().getId(),
            "com.df.nfa.creator_v2.view.fragments.UpdateDocumentDialog",
            this
          );
          this.getView().addDependent(this._oUpdateDocDialog);
        }
        this._oUpdateDocDialog.setModel(this._oUpdateDocModel, "updateDocModel");
        this._oUpdateDocDialog.open();
      },

      onConfirmUpdateDocument: function () {
        var oData = this._oUpdateDocModel.getData();
        var oODataModel = this.getOwnerComponent().getModel();
        var that = this;
        var bPO       = !!oData.bPO;
        var bContract = !!oData.bContract;
        var bSA       = !!oData.bSA;

        this._oUpdateDocModel.setProperty("/busy", true);

        oODataModel.create("/et_document_createSet", {
          NfaRefNo:       oData.NfaRefNo,
          NfaDocType:     oData.DocumentType,
          DocTypeDesc:    oData.DocTypeDesc || "",
          PoCreate:       bPO       ? "X" : "",
          ContractCreate: bContract ? "X" : "",
          SaCreate:       bSA       ? "X" : "",
          MessageType:    "",
          MessageText:    "",
          RETURN: { results: [{ Type: "", Id: "", Number: "", Message: "", LogNo: "", LogMsgNo: "", MessageV1: "", MessageV2: "", MessageV3: "", MessageV4: "", Parameter: "", Row: 0, Field: "", System: "" }] }
        }, {
          success: function (oResult) {
            that._oUpdateDocModel.setProperty("/busy", false);
            var aMessages = (oResult.RETURN && oResult.RETURN.results) || [];
            var aErrors = aMessages
              .filter(function (m) { return (m.Type || "") !== "S"; })
              .map(function (m) { return (m.Message || "").trim(); })
              .filter(function (s) { return s.length > 0; });

            if (aErrors.length) {
              MessageBox.error("Update failed:\n" + aErrors.join("\n"));
            } else {
              that._oUpdateDocDialog.close();
              MessageToast.show("Document updated successfully!");
              that._loadNfaData();
            }
          },
          error: function (oError) {
            that._oUpdateDocModel.setProperty("/busy", false);
            var sMsg = "";
            try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText || "Unknown error"; }
            MessageBox.error("Update failed: " + sMsg);
          }
        });
      },

      onCloseUpdateDocument: function () {
        if (this._oUpdateDocDialog) { this._oUpdateDocDialog.close(); }
      },

      _openCreateDocumentDialog: function (sJoinedIds) {
        if (!this._oCdModel) {
          this._oCdModel = new JSONModel();
        }
        this._oCdModel.setData({
          selectedNfaIds:  sJoinedIds,
          docTypeVisible:  false,
          docTypeLabel:    "",
          docTypes:        [],
          selectedDocType: "",
          selectedRadio:   "",
          busy:            false
        });

        var oView = this.getView();
        if (!this._oCreateDocDialog) {
          this._oCreateDocDialog = sap.ui.xmlfragment(
            oView.getId(),
            "com.df.nfa.creator_v2.view.fragments.CreateDocumentDialog",
            this
          );
          oView.addDependent(this._oCreateDocDialog);
        }
        this._oCreateDocDialog.setModel(this._oCdModel, "cdModel");
        this.byId("docTypeRadioGroup").setSelectedIndex(-1);
        this._oCreateDocDialog.open();
      },

      onDocTypeRadioChange: function (oEvent) {
        var iIdx = oEvent.getParameter("selectedIndex");
        var aKeys = ["CONTRACT", "SA", "PO"];
        var aLabels = ["Contract Doc Type", "Scheduling Agreement Doc Type", "Purchase Order Doc Type"];
        var aTypes  = ["CONTRACT_DOC_TYPE", "SA_DOC_TYPE", "PO_DOC_TYPE"];

        var sType = aTypes[iIdx];
        this._oCdModel.setProperty("/selectedRadio", aKeys[iIdx]);
        this._oCdModel.setProperty("/docTypeLabel", aLabels[iIdx]);
        this._oCdModel.setProperty("/selectedDocType", "");
        this._oCdModel.setProperty("/docTypes", []);
        this._oCdModel.setProperty("/docTypeVisible", false);

        var oODataModel = this.getOwnerComponent().getModel();
        var that = this;
        oODataModel.read("/et_nfa_search_helpSet", {
          filters: [new Filter("Type", FilterOperator.EQ, sType)],
          success: function (oData) {
            that._oCdModel.setProperty("/docTypes", oData.results);
            that._oCdModel.setProperty("/docTypeVisible", oData.results.length > 0);
          },
          error: function () {
            MessageToast.show("Failed to load doc types.");
          }
        });
      },

      onConfirmCreateDocument: function () {
        var oData = this._oCdModel.getData();
        if (!oData.selectedDocType) {
          MessageBox.warning("Please select a document type.");
          return;
        }

        var aNfaIds = oData.selectedNfaIds.split(", ");
        var oODataModel = this.getOwnerComponent().getModel();
        var that = this;

        // Determine flags based on radio selection
        var bPO       = oData.selectedRadio === "PO";
        var bContract = oData.selectedRadio === "CONTRACT";
        var bSA       = oData.selectedRadio === "SA";

        // Get the description of the selected doc type
        var oSelectedType = (oData.docTypes || []).find(function (o) {
          return o.KeyDataType === oData.selectedDocType;
        });
        var sDocTypeDesc = oSelectedType ? oSelectedType.Description : "";

        var mLabel = { CONTRACT: "Contract", SA: "Scheduling Agreement", PO: "Purchase Order" };
        var sLabel = mLabel[oData.selectedRadio];

        var aPromises = aNfaIds.map(function (sNfaId) {
          return new Promise(function (resolve, reject) {
            oODataModel.create("/et_document_createSet", {
              NfaRefNo:       sNfaId.trim(),
              NfaDocType:     oData.selectedDocType,
              DocTypeDesc:    sDocTypeDesc,
              PoCreate:       bPO       ? "X" : "",
              ContractCreate: bContract ? "X" : "",
              SaCreate:       bSA       ? "X" : "",
              MessageType:    "",
              MessageText:    "",
              RETURN: {
                results: [{ Type: "", Id: "", Number: "", Message: "", LogNo: "", LogMsgNo: "", MessageV1: "", MessageV2: "", MessageV3: "", MessageV4: "", Parameter: "", Row: 0, Field: "", System: "" }]
              }
            }, {
              success: function (oResult) {
                var aMessages = (oResult.RETURN && oResult.RETURN.results) || [];
                console.log("[CreateDoc] RETURN results count:", aMessages.length);
                aMessages.forEach(function(m, i) {
                  console.log("[CreateDoc] msg["+i+"] Message=["+m.Message+"] len="+(m.Message||'').length);
                });

                var aErrorMsgs = aMessages
                  .filter(function (m) { return (m.Type || "") !== "S"; })
                  .map(function (m) { return (m.Message || "").replace(/^\s+/, ""); })
                  .filter(function (s) { return s.length > 0; });

                // Backend returns PoCreate="X" even on failure, so rely on RETURN messages
                // MessageType "S" = Success, treat as non-failure
                var bHasMessages = aErrorMsgs.length > 0;
                var bFailed = bHasMessages ||
                              (oResult.MessageType === "E") ||
                              (oResult.MessageType !== "" && oResult.MessageType !== "S" && oResult.MessageType !== undefined && oResult.MessageType !== null) ||
                              (bPO       && oResult.PoCreate       !== "X") ||
                              (bContract && oResult.ContractCreate  !== "X") ||
                              (bSA       && oResult.SaCreate        !== "X");

                if (bFailed) {
                  var sErr = aErrorMsgs.length
                    ? aErrorMsgs.join("\n")
                    : (oResult.MessageText || "Document creation failed.");
                  reject(sErr);
                } else {
                  resolve(oResult);
                }
              },
              error: function (oError) {
                var sMsg = "";
                try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText || "Unknown error"; }
                reject(sMsg);
              }
            });
          });
        });

        that._oCdModel.setProperty("/busy", true);

        Promise.all(aPromises)
          .then(function () {
            that._oCdModel.setProperty("/busy", false);
            that._oCreateDocDialog.close();
            MessageToast.show(sLabel + " created successfully!");
            that.byId("approvedTable").removeSelections(true);
            that.getView().getModel().setProperty("/approvedSelected", 0);
            that._loadNfaData();
          })
          .catch(function (sMsg) {
            that._oCdModel.setProperty("/busy", false);
            MessageBox.error(sLabel + " creation failed: " + sMsg);
          });
      },

      onCloseCreateDocument: function () {
        this._oCreateDocDialog.close();
      },

      _getStatusState: function (sStatus) {
        var mStateMap = {
          "Draft":                "None",
          "Approval Pending":     "Warning",
          "Send for Approval":    "Warning",
          "Pending":              "Warning",
          "Approved":             "Success",
          "Rejected":             "Error",
          "PO Created":           "Success",
          "PO, Contract Created": "Success",
          "Contract, SA Created": "Success",
          "PO, SA Created":       "Success",
          "Completed":            "Success",
          "Document Created":     "Success"
        };
        return mStateMap[sStatus] || "None";
      },

      onTestPosting: function () {
        this.getOwnerComponent().getRouter().navTo("RoutePostingTest");
      },

      onNfaReport: function () {
        this.getOwnerComponent().getRouter().navTo("RouteNfaReport");
      }
    });
  },
);




