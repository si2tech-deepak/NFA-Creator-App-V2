sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/Fragment",
  "sap/ui/table/Column",
  "sap/m/Label",
  "sap/m/Input",
  "sap/m/MessageBox",
  "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
  "sap/ui/table/Column",
  "sap/m/Column",
  "sap/m/ColumnListItem",
  "sap/m/Text",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/DatePicker",
  "sap/ui/comp/filterbar/FilterBar",
  "sap/ui/comp/filterbar/FilterGroupItem",
  // Start: added by SI2 Tech - PO info popover (Unit LPP ⓘ)
  "com/df/nfa/creator_v2/controller/mixin/PoHistory"
  // End: added by SI2 Tech
], function (Controller, JSONModel, Fragment, Column, Label, Input, MessageBox, ValueHelpDialog, UITableColumn, MColumn, ColumnListItem, Text, Filter, FilterOperator, DatePicker, FilterBar, FilterGroupItem, PoHistory) { // PoHistory: added by SI2 Tech
  "use strict";

  // Start: added by SI2 Tech - PoHistory mixed in via Object.assign (closed at the end of the file)
  return Controller.extend("com.df.nfa.creator_v2.controller.QCS", Object.assign({}, PoHistory, {
  // End: added by SI2 Tech

    // onInit: function () {

    //   this._vendors = [
    //     { VendorIndex: 1, VendorName: "L&T Ltd" },
    //     { VendorIndex: 2, VendorName: "Tata Projects" }
    //   ];

    //   this._summaryLabels = [
    //     "Basic Amount Total",
    //     "P & F Charges (Rs)",
    //     "Freight (Rs)",
    //     "GST (%)",
    //     "Insurance",
    //     "Net Landed Cost (Rs)",
    //     "Commercial Rating",
    //     "Delivery Date",
    //     "Payment Terms"
    //   ];

    //   this.getView().setModel(new JSONModel({
    //     SelectedPR: "",
    //     SelectedPRItem: "",
    //     PRItemsForVH: [],
    //     TreeData: this._buildSummaryRows()   // ⬅ always present
    //   }), "view");

    //   this.getView().setModel(new JSONModel({
    //     PRNumbers: [{
    //       PrNumber: "4500000010",
    //       Items: [
    //         { PrItem: "10", Material: "Copper Rod", Qty: 10, UOM: "KG" },
    //         { PrItem: "20", Material: "Steel Plate", Qty: 5, UOM: "MT" }
    //       ]
    //     },
    //     {
    //       PrNumber: "4500000011",
    //       Items: [
    //         { PrItem: "10", Material: "Copper Rod1", Qty: 10, UOM: "KG" },
    //         { PrItem: "20", Material: "Steel Plate1", Qty: 5, UOM: "MT" },
    //         { PrItem: "20", Material: "Steel Plate2", Qty: 5, UOM: "MT" }
    //       ]
    //     }
    //   ]
    //   }), "pr");

    //   this._addVendorColumns();
    // }
 onInit: function () {
  this._summaryLabels = [
    "Basic Amount Total",
    "P & F Charges (%)",
    "Freight (Rs)",
    "Insurance",
    "Total Basic",
    "GST (%)",
    "Net Landed Cost (Rs)",
    "Commercial Rating",
    "Commercial Loading",
    "Loading Comments",
    "Total Amt with Comm. Loading",
    "Delivery Date",
    "Payment Terms"
  ];

  this.getView().setModel(new JSONModel({
    SelectedPR: "",
    SelectedPRItem: "",
    PRItemsForVH: [],
    TreeData: this._buildSummaryRows(),
    mode: "create",
    nfaRefNo: "",
    editable: false,
    isApprovedMode: false,
    submitEnabled: false,
    selectionMode: "PR",
    hasTableData: false,
    ManualMaterialDisplay: "",
    ReasonForAmendment: "",
    prApiEmpty: false
  }), "view");

  this.getView().setModel(new JSONModel({
    PRNumbers: [{
      PrNumber: "4500000010",
      Items: [
        { PrItem: "10", Material: "Copper Rod", Qty: 10, UOM: "KG" },
        { PrItem: "20", Material: "Steel Plate", Qty: 5, UOM: "MT" }
      ]
    },
    {
      PrNumber: "4500000011",
      Items: [
        { PrItem: "10", Material: "Copper Rod1", Qty: 10, UOM: "KG" },
        { PrItem: "20", Material: "Steel Plate1", Qty: 5, UOM: "MT" },
        { PrItem: "30", Material: "Steel Plate2", Qty: 5, UOM: "MT" }
      ]
    }]
  }), "pr");

  this.getView().setModel(new JSONModel({
  header: {}, vendors: [], approvalPhases: [], approvalVersions: [], buyerDocs: []
}), "nfaModel");

  this._vendors = [];

  this.getOwnerComponent()
    .getRouter()
    .getRoute("RouteQCS")
    .attachPatternMatched(this._onRouteMatched, this);
},

// onAfterRendering: function () {
//   var that = this;
//   var oTable = this.byId("vendorTreeTable");
//   if (!oTable) return;

//   if (!this._oHoverPopover) {
//     this._oHoverPopover = new sap.m.Popover({
//       showHeader: true,
//       title: "Long Text",
//       placement: "PreferredRightOrFlip",
//       contentWidth: "420px",
//       afterOpen: function () {
//         // Allow mouse to enter popover without closing
//         that._bMouseInPopover = false;
//       },
//       content: [
//         new sap.m.ScrollContainer({
//           vertical: true,
//           height: "280px",
//           content: [
//             new sap.m.Text({
//               id: this.getView().getId() + "--hoverPopText",
//               wrapping: true,
//               width: "100%"
//             }).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")
//           ]
//         })
//       ]
//     });
//     this.getView().addDependent(this._oHoverPopover);

//     // Keep popover open when mouse is inside it
//     this._oHoverPopover.attachBrowserEvent("mouseenter", function () {
//       that._bMouseInPopover = true;
//     });
//     this._oHoverPopover.attachBrowserEvent("mouseleave", function () {
//       that._bMouseInPopover = false;
//       that._oHoverPopover.close();
//     });
//   }

//   var $table = oTable.$();

//   $table.off("mouseenter.qcsDesc").on("mouseenter.qcsDesc", ".qcsDescText, .qcsLongTextIcon", function (oEv) {
//     // Walk up to find the row and get MaterialLongText from binding context
//     var $row = jQuery(oEv.currentTarget).closest(".sapUiTableRow");
//     var iRowIndex = $row.data("sap-ui-rowindex");
//     if (iRowIndex === undefined) {
//       iRowIndex = oTable.getRows().findIndex(function (r) {
//         return r.$().is($row);
//       });
//     }
//     var sText = "";
//     var oRow = oTable.getRows()[iRowIndex];
//     if (oRow) {
//       var oCtx = oRow.getBindingContext("view");
//       if (oCtx) sText = oCtx.getProperty("MaterialLongText") || "";
//     }
//     if (!sText) return;
//     var oPopText = sap.ui.getCore().byId(that.getView().getId() + "--hoverPopText");
//     if (oPopText) oPopText.setText(sText);
//     that._oHoverPopover.openBy(oEv.currentTarget);
//   });

//   $table.off("mouseleave.qcsDesc").on("mouseleave.qcsDesc", ".qcsDescText, .qcsLongTextIcon", function () {
//     setTimeout(function () {
//       if (!that._bMouseInPopover) {
//         that._oHoverPopover.close();
//       }
//     }, 80);
//   });
  
// },

onAfterRendering: function () {
  var that = this;
  var oTable = this.byId("vendorTreeTable");
  if (!oTable) return;

  if (!this._oHoverPopover) {
    this._oHoverPopover = new sap.m.Popover({
      showHeader: true,
      title: "Long Text",
      placement: "PreferredRightOrFlip",
      contentWidth: "420px",
      afterOpen: function () { that._bMouseInPopover = false; },
      content: [
        new sap.m.ScrollContainer({
          vertical: true, height: "280px",
          content: [
            new sap.m.Text({
              id: this.getView().getId() + "--hoverPopText",
              wrapping: true, width: "100%"
            }).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")
          ]
        })
      ]
    });
    this.getView().addDependent(this._oHoverPopover);
    this._oHoverPopover.attachBrowserEvent("mouseenter", function () { that._bMouseInPopover = true; });
    this._oHoverPopover.attachBrowserEvent("mouseleave", function () {
      that._bMouseInPopover = false;
      that._oHoverPopover.close();
    });
  }

  var $table = oTable.$();

  $table.off("mouseenter.qcsDesc").on("mouseenter.qcsDesc", ".qcsDescText, .qcsLongTextIcon", function (oEv) {
    var $row = jQuery(oEv.currentTarget).closest(".sapUiTableRow");
    var iRowIndex = $row.data("sap-ui-rowindex");
    if (iRowIndex === undefined) {
      iRowIndex = oTable.getRows().findIndex(function (r) { return r.$().is($row); });
    }
    var sText = "";
    var oRow = oTable.getRows()[iRowIndex];
    if (oRow) {
      var oCtx = oRow.getBindingContext("view");
      if (oCtx) sText = oCtx.getProperty("MaterialLongText") || "";
    }
    if (!sText) return;
    var oPopText = sap.ui.getCore().byId(that.getView().getId() + "--hoverPopText");
    if (oPopText) oPopText.setText(sText);
    that._oHoverPopover.openBy(oEv.currentTarget);
  });

  $table.off("mouseleave.qcsDesc").on("mouseleave.qcsDesc", ".qcsDescText, .qcsLongTextIcon", function () {
    setTimeout(function () {
      if (!that._bMouseInPopover) { that._oHoverPopover.close(); }
    }, 80);
  });

  // Right-click menu on PR NO./Short Text column header
if (!this._oPRColMenu) {
  this._oPRColMenu = new sap.ui.unified.Menu({
    items: [
      // new sap.ui.unified.MenuItem({ text: "Sort A→Z (PR Number)",  select: function () { that._applyPRSort("PrNumber", false); } }),
      // new sap.ui.unified.MenuItem({ text: "Sort Z→A (PR Number)",  select: function () { that._applyPRSort("PrNumber", true);  } }),
      new sap.ui.unified.MenuItem({ text: "Sort Asc (PR Item)",    select: function () { that._applyPRSort("PrItem", false);   } }),
      new sap.ui.unified.MenuItem({ text: "Sort Desc (PR Item)",   select: function () { that._applyPRSort("PrItem", true);    } }),
      new sap.ui.unified.MenuTextFieldItem({
        label: "Filter (PR No or PR Item)",
        select: function (oEv) { that._applyPRFilter(oEv.getSource().getValue()); }
      }),
      // new sap.ui.unified.MenuItem({ text: "Clear Sort & Filter",   select: function () { that._clearPRSortFilter(); } })
    ]
  });
  this.getView().addDependent(this._oPRColMenu);
}

var oMenu = this._oPRColMenu;
// Use the first column's DOM element directly — works regardless of fixed/scrollable split
var oFirstCol = oTable.getColumns()[0];
if (oFirstCol) {
  var $colDom = oFirstCol.$();
  $colDom.off("contextmenu.qcsPRCol").on("contextmenu.qcsPRCol", function (oEv) {
    oEv.preventDefault();
    oEv.stopPropagation();
    oMenu.open(false, oEv.target, "BeginTop", "BeginBottom", oEv.target);
  });
}

},


_onRouteMatched: function (oEvent) {
  var oArgs = oEvent.getParameter("arguments");
  var sMode = oArgs.mode || "create";
  var sNfaRefNo = oArgs.nfaRefNo || "";
  var oQuery = oArgs["?query"] || {};
  var bNewNfa = oQuery.newNfa === "true";
  var sAribaDocNo = oQuery.aribaDocNo || "";
  var bDocEditMode = oQuery.docEdit === "true";
  var sStatus = oQuery.status || "";
  var bApprovalPending = sStatus === "Approval Pending" || sStatus === "Send for Approval";
  var bDraft = sStatus === "Draft";
  var bApproved = sMode === "approved";
  var oVM = this.getView().getModel("view");
  var that = this;

  // Block access if no NFA reference number
  if (!sNfaRefNo) {
    MessageBox.error("QCS requires a valid NFA Reference Number. Please save the NFA draft with vendor data first.", {
      onClose: function () {
        that.getOwnerComponent().getRouter().navTo("RoutenfaCreator", {}, true);
      }
    });
    return;
  }

  // Full view model reset before loading fresh data
  oVM.setData({
    SelectedPR: "",
    SelectedPRItem: "",
    PRItemsForVH: [],
    TreeData: this._buildSummaryRows(),
    mode: sMode,
    nfaRefNo: sNfaRefNo,
    nfaVersion: null,
    editable: !bApprovalPending && sMode === "edit" && bNewNfa,
    isApprovedMode: sMode === "approved",
    isApprovalPending: bApprovalPending,
    isDocEditMode: bDocEditMode,
    isAribaMode: !!sAribaDocNo,
    submitEnabled: false,
    selectionMode: "PR",
    hasTableData: false,
    ManualMaterialDisplay: "",
    ReasonForAmendment: "",
    showReasonForAmendment: !bApproved && !bDraft && !bApprovalPending && !bNewNfa,
    prApiEmpty: false
  });
  this._vendors = [];
  this._bDirty = false;
  this._nfaDetails = {};
  this._sAribaDocNo = sAribaDocNo;
  this.getView().getModel("nfaModel").setData({ header: {}, vendors: [], approvalPhases: [], approvalVersions: [], buyerDocs: [] });
  if (this._oManualMaterialDialog) {
    this._oManualMaterialDialog.destroy();
    this._oManualMaterialDialog = null;
  }

  // Remove previously added dynamic vendor columns
  var oTable = this.byId("vendorTreeTable");
  var aFixed = 10;
  while (oTable.getColumns().length > aFixed) {
    oTable.removeColumn(oTable.getColumns()[aFixed]);
  }

  var oODataModel = this.getOwnerComponent().getModel();

  sap.ui.core.BusyIndicator.show(0);

  // Load version number
  this._loadQCSVersion(sNfaRefNo, oVM);

  // Fetch NFA header details first to get PurchaseOrg/PurchaseGroup, then load vendors
  oODataModel.read("/et_nfa_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oNfaData) {
      var oNfa = (oNfaData.results || [])[0] || {};
      that._nfaDetails = {
        PurchaseOrg:       oNfa.PurchaseOrg      || "",
        PurchaseOrgDesc:   oNfa.PurchaseOrgDesc  || "",
        PurchaseGroup:     oNfa.PurchaseGroup    || "",
        PurchaseGroupDesc: oNfa.PurchaseGroupDesc || "",
        Version:           oNfa.Version           || "",
        OldPO:             oNfa.OldPO             || ""
      };
      that._loadNfaSection1(oNfa, sNfaRefNo, oODataModel);
      that._loadVendorsAndPRItems(oODataModel, sNfaRefNo, sAribaDocNo, oVM, that);
    },
    error: function () {
      that._nfaDetails = {};
      that._loadVendorsAndPRItems(oODataModel, sNfaRefNo, sAribaDocNo, oVM, that);
    }
  });
},


_loadQCSVersion: function (sNfaRefNo, oVM) {
  var oODataModel = this.getOwnerComponent().getModel();
  oODataModel.read("/et_version_logSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    urlParameters: { "$expand": "VENDOR_LOG,VENDOR_PR_LOG" },
    forceServerDataRequest: true,
    success: function (oData) {
      var mSeen = {}, aVersions = [];
      (oData.results || []).forEach(function (r) {
        var sKey = r.NfaRefNo + "|" + r.Version;
        if (!mSeen[sKey]) { mSeen[sKey] = true; aVersions.push(parseInt(r.Version) || 0); }
      });
      aVersions.sort(function (a, b) { return a - b; });
      oVM.setProperty("/nfaVersion", aVersions.length ? aVersions[aVersions.length - 1] : null);
    },
    error: function () { oVM.setProperty("/nfaVersion", null); }
  });
},

_loadVendorsAndPRItems: function (oODataModel, sNfaRefNo, sAribaDocNo, oVM, that) {
  var sMode = oVM.getProperty("/mode");
  oODataModel.read("/et_vendor_item_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oVendorData) {
      var aResults = oVendorData.results || [];

      if (!aResults.length) {
        sap.ui.core.BusyIndicator.hide();
        MessageBox.error("No vendor data found for this NFA. Please add vendor details before accessing QCS.", {
          onClose: function () {
            that.getOwnerComponent().getRouter().navTo("RoutenfaCreate", {
              mode: sMode,
              docNo: sNfaRefNo
            });
          }
        });
        return;
      }

      that._vendors = aResults.map(function (item, index) {
        return {
          VendorIndex: index + 1,
          VendorNo: item.VendorNo || "",
          VendorName: item.VendorName || "",
          paymentTerms: item.PaymentTerms || "",
          paymentTermsDesc: item.PaymentTermsDesc || "",
          deliveryDate: item.DeliveryDate || "",
          lpp: item.Lpp || "0",
          plant: item.Plant || "",
          ta: item.Ta || "",
          vendorQa: item.VendorQa || "",
          purchaseOrder: item.PurchaseOrder || "",
          contractNo: item.ContractNo || "",
          schlAgreementNo: item.SchlAgreementNo || "",
          techinicalRating: item.TechinicalRating || "",
          qualifScore: item.QualifScore || "",
          aribaDocNo: item.AribaDocNo || "",
          vendorIceFlag: item.VendorIceFlag || ""
        };
      });

      // In docEdit mode, only show vendors that have at least one split (ordered) qty
      if (oVM.getProperty("/isDocEditMode")) {
        var oODataModelInner = that.getOwnerComponent().getModel();
        oODataModelInner.read("/et_vendor_pr_item_detailsSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          forceServerDataRequest: true,
          success: function (oPRCheck) {
            var mVendorsWithSplit = {};
            (oPRCheck.results || []).forEach(function (row) {
              if (parseFloat(row.SplitPoQty) > 0) { mVendorsWithSplit[row.VendorNo] = true; }
            });
            that._vendors = that._vendors.filter(function (v) { return mVendorsWithSplit[v.VendorNo]; });
            that._vendors.forEach(function (v, i) { v.VendorIndex = i + 1; });
            if (that._vendors.length) { that._addVendorColumns(); }
            that._fetchAndBuildPRTree(oODataModel, sNfaRefNo, sAribaDocNo, oVM);
          },
          error: function () {
            if (that._vendors.length) { that._addVendorColumns(); }
            that._fetchAndBuildPRTree(oODataModel, sNfaRefNo, sAribaDocNo, oVM);
          }
        });
        return;
      }

      if (that._vendors.length) {
        that._addVendorColumns();
      }

      that._fetchAndBuildPRTree(oODataModel, sNfaRefNo, sAribaDocNo, oVM);
    },
    error: function (oError) {
      sap.ui.core.BusyIndicator.hide();
      console.error("Error loading vendor items:", oError);
    }
  });
},

_fetchAndBuildPRTree: function (oODataModel, sNfaRefNo, sAribaDocNo, oVM) {
  var that = this;

  // Always try NfaRefNo first (saved data with SplitPoQty/RemainingQty).
  // Only fall back to AribaDocNo if no saved data exists yet.
  oODataModel.read("/et_vendor_pr_item_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oNfaCheck) {
      var aPRFilters = (oNfaCheck.results && oNfaCheck.results.length)
        ? [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)]
        : (sAribaDocNo ? [new Filter("AribaDocNo", FilterOperator.EQ, sAribaDocNo)] : [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)]);

      oODataModel.read("/et_vendor_pr_item_detailsSet", {
        filters: aPRFilters,
        forceServerDataRequest: true,
        success: function (oPRData) {
          that._buildPRTree(oPRData, oVM, oODataModel, sNfaRefNo);
        },
        error: function (oError) {
          sap.ui.core.BusyIndicator.hide();
          console.error("Error loading PR items:", oError);
        }
      });
    },
    error: function () {
      // On error checking NfaRefNo, fall back to AribaDocNo
      var aPRFilters = sAribaDocNo
        ? [new Filter("AribaDocNo", FilterOperator.EQ, sAribaDocNo)]
        : [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)];
      oODataModel.read("/et_vendor_pr_item_detailsSet", {
        filters: aPRFilters,
        forceServerDataRequest: true,
        success: function (oPRData) {
          that._buildPRTree(oPRData, oVM, oODataModel, sNfaRefNo);
        },
        error: function (oError) {
          sap.ui.core.BusyIndicator.hide();
          console.error("Error loading PR items:", oError);
        }
      });
    }
  });
},

_buildPRTree: function (oPRData, oVM, oODataModel, sNfaRefNo) {
  var that = this;
  var aPRResults = oPRData.results || [];
  if (!aPRResults.length) {
    // If this is a new NFA (Version 0) and Vendor PR API returned no data,
    // mark prApiEmpty so Purchase Org, Plant, Purchase Group remain editable
    var bNewNfa = oVM.getProperty("/editable");
    var iVersion = oVM.getProperty("/nfaVersion");
    if (bNewNfa && (iVersion === 0 || iVersion === null)) {
      oVM.setProperty("/prApiEmpty", true);
    }
    sap.ui.core.BusyIndicator.hide();
    return;
  }
  // Inline the original tree-building logic below
  (function () {

      // Group by PrNo
      var mPRNodes = {};
      var bHasManual = false;
      aPRResults.forEach(function (row) {
        if (!mPRNodes[row.PrNo]) {
          mPRNodes[row.PrNo] = { NodeType: "PR", PrNumber: row.PrNo, children: [] };
        }
        var oPRNode = mPRNodes[row.PrNo];
        var bIsManual = row.PrNo === "MANUAL";
        if (bIsManual) bHasManual = true;

        var oItem = bIsManual
          ? oPRNode.children.find(function (i) { return i.Material === row.Material; })
          : oPRNode.children.find(function (i) { return i.PrItem === row.PrItem; });

        if (!oItem) {
          oItem = {
            NodeType: "ITEM",
            PrItem: row.PrItem,
            IsManual: bIsManual,
            Material: row.Material || "",
            MaterialDesc: row.MaterialDescription || "",
            MaterialLongText: row.MaterialLongText || "",
            Qty: row.Qty || "0",
            UOM: row.Uom || "",
            Plant: row.Plant || "",
            MaterialGroup: row.MaterialGroup || "",
            MaterialGroupDescription: row.MaterialGroupDescription || "",
            PurchaseOrg: row.PurchaseOrg || "",
            PurchaseOrgDesc: row.PurchaseOrgDesc || "",
            PurchaseGroup: row.PurchaseGroup || "",
            PurchaseGroupDesc: row.PurchaseGroupDesc || "",
            Lpp: row.UnitLpp || "0",
            UnitLpp: row.UnitLpp || "0",
            TotalLpp: row.TotalLpp != null ? String(row.TotalLpp) : (parseFloat(row.UnitLpp || 0) * parseFloat(row.Qty || 0)).toFixed(3),
            PrBudget: row.PrBudget != null ? String(row.PrBudget) : "0",
            WbsBudget: row.WbsBudget != null ? String(row.WbsBudget) : "0",
            WbsElement: row.WbsElement || "",
            children: []
          };
          oPRNode.children.push(oItem);
        }

        var oVendor = that._vendors.find(function (v) { return v.VendorNo === row.VendorNo; });
        if (oVendor) {
          var idx = oVendor.VendorIndex;
          oItem["v" + idx + "SplitQty"]     = (row.SplitPoQty != null) ? parseFloat(row.SplitPoQty) : 0;
          oItem["v" + idx + "InitPrice"]     = row.InitialPrice || "";
          oItem["v" + idx + "NegPrice"]      = row.NegotiatedPrice || "";
          oItem["v" + idx + "FinalPrice"]    = row.FinilizedLinePrice || "0";
          oItem["v" + idx + "NegPriceTotal"] = (parseFloat(row.NegotiatedPrice) || 0) * (parseFloat(oItem.Qty) || 0);
        }
      });

      Object.values(mPRNodes).forEach(function (prNode) {
        prNode.FromBackend = true;
        (prNode.children || []).forEach(function (child) {
          if (child.NodeType === "ITEM") child.FromBackend = true;
        });
      });

      var aPRNodes = Object.values(mPRNodes);

      if (bHasManual) {
        oVM.setProperty("/selectionMode", "MANUAL");
        var oManualNode = mPRNodes["MANUAL"];
        if (oManualNode) {
          oVM.setProperty("/ManualMaterialDisplay",
            oManualNode.children.map(function (c) { return c.Material; }).join(", ")
          );
        }
      }

      aPRNodes.forEach(function (prNode) {
        (prNode.children || []).forEach(function (oItem) {
          if (oItem.NodeType !== "ITEM") return;
          var fQty = parseFloat(oItem.Qty) || 0;
          var fTotalSplit = 0;
          that._vendors.forEach(function (v) {
            if (v.vendorIceFlag === "X") return;
            fTotalSplit += parseFloat(oItem["v" + v.VendorIndex + "SplitQty"] || 0);
          });
          oItem.RemainingQty = parseFloat((fQty - fTotalSplit).toFixed(3));
        });
      });

      aPRNodes.forEach(function (prNode) {
        var aWithDesc = [];
        prNode.children.forEach(function (oItem) {
          aWithDesc.push(oItem);
          if (oItem.NodeType === "ITEM") {
            aWithDesc.push({ NodeType: "DESC", PrItem: oItem.PrItem, Material: oItem.Material || "", MaterialLongText: oItem.MaterialLongText || "", DescText: "" });
          }
        });
        prNode.children = aWithDesc;
      });

      that._recalculateSummaries(aPRNodes);
      var aSummaryRows = that._getSummaryRows();
      that._aOriginalPRNodes = null;
      that._aOriginalTreeData = null;
      that._sPRColumnFilter = "";
      that._sPRColumnSort = null;
      oVM.setProperty("/TreeData", aPRNodes.concat(aSummaryRows));
      that._populateSummaryDefaults();

      oODataModel.read("/et_vendor_item_detailsSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        forceServerDataRequest: true,
        success: function (oSummaryData) {
              var aCurrentTree = oVM.getProperty("/TreeData") || [];

              (oSummaryData.results || []).forEach(function (oVendorRow) {
                var oVendor = that._vendors.find(function (v) { return v.VendorNo === oVendorRow.VendorNo; });
                if (!oVendor) return;
                var idx = oVendor.VendorIndex;

                // Restore vendorIceFlag from summary fetch in case it was not set
                if (!oVendor.vendorIceFlag && oVendorRow.VendorIceFlag) {
                  oVendor.vendorIceFlag = oVendorRow.VendorIceFlag;
                }

                var fPfPct  = parseFloat(oVendorRow.PfPercent)  || 0;
                var fGstPct = parseFloat(oVendorRow.GstPercentage) || 0;

                var mSummaryMap = {
                  "P & F Charges (%)":     { negPrice: fPfPct  > 0 ? String(fPfPct)  + "%" : "", finalPrice: oVendorRow.PfAmount,   negPriceTotal: oVendorRow.NegPFAmount },
                  "Freight (Rs)":          { negPrice: oVendorRow.Freight,                        finalPrice: oVendorRow.Freight,    negPriceTotal: oVendorRow.NegFreight },
                  "GST (%)":               { negPrice: fGstPct > 0 ? String(fGstPct) + "%" : "", finalPrice: oVendorRow.GstAmount,  negPriceTotal: oVendorRow.NegGstAmount },
                  "Insurance":             { negPrice: oVendorRow.Insurance,                      finalPrice: oVendorRow.Insurance,  negPriceTotal: oVendorRow.NegInsurance },
                  "Basic Amount Total":    { negPriceTotal: oVendorRow.NegBasicTotal },
                  "Total Basic":           { negPriceTotal: oVendorRow.NegTotalBasic },
                  "Net Landed Cost (Rs)":  { negPriceTotal: oVendorRow.NegNetCost },
                  "Commercial Loading":    { negPrice: oVendorRow.CommercialLoading, negPriceTotal: oVendorRow.CommercialLoading },
                  "Loading Comments":      { loadingComments: oVendorRow.LoadingComments },
                  "Total Amt with Comm. Loading": { negPriceTotal: oVendorRow.TotalCommLoading },
                  "Commercial Rating":     { singleValue: oVendorRow.CommercialRating }
                };

                aCurrentTree.forEach(function (row) {
                  if (row.NodeType !== "SUMMARY") return;
                  var oMap = mSummaryMap[row.Label];
                  if (!oMap) return;
                  if (oMap.finalPrice    !== undefined) row["v" + idx + "FinalPrice"]      = parseFloat(oMap.finalPrice)    || 0;
                  if (oMap.negPrice      !== undefined) row["v" + idx + "NegPrice"]        = oMap.negPrice;
                  if (oMap.negPriceTotal !== undefined) row["v" + idx + "NegPriceTotal"]   = parseFloat(oMap.negPriceTotal) || 0;
                  if (oMap.singleValue   !== undefined) row["v" + idx + "SingleValue"]     = oMap.singleValue || "";
                  if (oMap.loadingComments !== undefined) row["v" + idx + "LoadingComments"] = oMap.loadingComments || "";
                });
              });

              // Recalculate Basic Amount Total from PR items (in case backend value was "0.000")
              var aPRNodes = aCurrentTree.filter(function (n) { return n.NodeType === "PR"; });
              that._recalculateSummaries(aPRNodes);

              // Collect vendor nos that actually returned data from backend
              var aBackendVendorNos = (oSummaryData.results || []).map(function (r) { return r.VendorNo; });

              var oPfRow      = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "P & F Charges (%)"; });
              var oGstRow     = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "GST (%)"; });
              var oFreightRow = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Freight (Rs)"; });
              var oInsRow     = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Insurance"; });

              // Recompute P&F, Freight, Insurance, GST FinalPrice from saved percentages × recalculated amounts
              var oBasicRow   = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Basic Amount Total"; });
              var oTotalBasicRow = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Total Basic"; });
              that._vendors.forEach(function (v) {
                var fBasic = parseFloat(oBasicRow ? oBasicRow["v" + v.VendorIndex + "FinalPrice"] : 0) || 0;
                if (oPfRow) {
                  var fPf = parseFloat((oPfRow["v" + v.VendorIndex + "NegPrice"] || "0").toString().replace("%", "")) || 0;
                  oPfRow["v" + v.VendorIndex + "FinalPrice"] = fBasic * fPf / 100;
                }
                if (oFreightRow) {
                  var fFreightFinal = parseFloat(oFreightRow["v" + v.VendorIndex + "NegPrice"] || 0) || 0;
                  oFreightRow["v" + v.VendorIndex + "FinalPrice"] = fFreightFinal;
                }
                if (oInsRow) {
                  var fInsFinal = parseFloat(oInsRow["v" + v.VendorIndex + "NegPrice"] || 0) || 0;
                  oInsRow["v" + v.VendorIndex + "FinalPrice"] = fInsFinal;
                }
                // Recalculate Total Basic FinalPrice = Basic + P&F + Freight + Insurance
                that._updateTotalBasic(aCurrentTree, v.VendorIndex);
                // GST must be applied on Total Basic, not Basic Amount Total
                if (oGstRow) {
                  var fTotalBasic = parseFloat(oTotalBasicRow ? oTotalBasicRow["v" + v.VendorIndex + "FinalPrice"] : 0) || 0;
                  var fGst = parseFloat((oGstRow["v" + v.VendorIndex + "NegPrice"] || "0").toString().replace("%", "")) || 0;
                  oGstRow["v" + v.VendorIndex + "FinalPrice"] = fTotalBasic * fGst / 100;
                }
                that._updateNetLandedCost(aCurrentTree, v.VendorIndex);
              });

              // Recalculate NegPriceTotal chain fully after all summary values are restored
              that._vendors.forEach(function (v) {
                that._updateTotalBasicNegPriceTotal(aCurrentTree, v.VendorIndex);
                that._updateNegPriceTotalForNetLanded(aCurrentTree, v.VendorIndex);
                that._updateTotalAmtWithCommLoading(aCurrentTree, v.VendorIndex);
              });
              that._calculateCommercialRating(aCurrentTree);

              // Re-populate delivery date and payment terms AFTER all summary
              // values have been restored from the backend, so they are not
              // overwritten by a stale model refresh.
              that._populateSummaryDefaults();

              that._aOriginalPRNodes = JSON.parse(JSON.stringify(
                aCurrentTree.filter(function (n) { return n.NodeType === "PR"; })
              ));
              that._sPRColumnFilter = "";
              that._sPRColumnSort = null;

              oVM.setProperty("/TreeData", aCurrentTree);
              oVM.refresh();
              that._updateHasTableData();
              sap.ui.core.BusyIndicator.hide();
            },
            error: function (oError) {
              sap.ui.core.BusyIndicator.hide();
              console.error("Error loading vendor summary data:", oError);
            }
          });
  }());
},


/* ================= SELECTION MODE ================= */

onSelectionModeChange: function (oEvent) {
  var oVM = this.getView().getModel("view");
  oVM.setProperty("/SelectedPR", "");
  oVM.setProperty("/SelectedPRItem", "");
  oVM.setProperty("/ManualMaterialDisplay", "");
},

// Shared helper: add et_sh_material data objects to the MANUAL tree node
_addMaterialsToTree: function (aDataArray) {
  var oVM = this.getView().getModel("view");
  var that = this;
  var aTreeData = oVM.getProperty("/TreeData") || [];
  var aPRNodes = aTreeData.filter(function (n) { return n.NodeType === "PR"; });
  var sGroupKey = "MANUAL";
  var oManualNode = aPRNodes.find(function (p) { return p.PrNumber === sGroupKey; });
  if (!oManualNode) {
    oManualNode = { NodeType: "PR", PrNumber: sGroupKey, children: [] };
    aPRNodes.push(oManualNode);
  }
  var iNextIndex = oManualNode.children.filter(function (c) { return c.NodeType === "ITEM"; }).length + 1;
  aDataArray.forEach(function (oData) {
    var bExists = oManualNode.children.some(function (c) { return c.Material === oData.Material; });
    if (bExists) return;
    var fQty = parseFloat(oData.Qty);
    var fUnitLpp = parseFloat(oData.UnitLpp || 0);
    var fEffQty = (!isNaN(fQty) && fQty > 0) ? fQty : 0;
    var sPrItem = String(iNextIndex++);
    var oNewItem = {
      NodeType: "ITEM", PrItem: sPrItem, IsManual: true,
      Material: oData.Material || "",
      MaterialDesc: oData.MaterialDescription || oData.MaterialDesc || "",
      MaterialLongText: oData.LongText || "",
      Qty: fEffQty > 0 ? String(fEffQty) : "0",
      UOM: oData.Uom || "", Plant: oData.Plant || "",
      MaterialGroup: oData.MaterialGroup || "",
      MaterialGroupDescription: oData.MaterialGrpDesc || "",
      Lpp: fUnitLpp > 0 ? String(fUnitLpp) : "0",
      UnitLpp: fUnitLpp > 0 ? String(fUnitLpp) : "0",
      TotalLpp: (fUnitLpp * fEffQty).toFixed(3),
      PrBudget: "0", WbsElement: "",
      PurchaseOrg: that._nfaDetails.PurchaseOrg || "",
      PurchaseOrgDesc: that._nfaDetails.PurchaseOrgDesc || "",
      PurchaseGroup: that._nfaDetails.PurchaseGroup || "",
      PurchaseGroupDesc: that._nfaDetails.PurchaseGroupDesc || "",
      children: []
    };
    that._vendors.forEach(function (v) {
      oNewItem["v" + v.VendorIndex + "InitPrice"] = "";
      oNewItem["v" + v.VendorIndex + "NegPrice"] = "";
      oNewItem["v" + v.VendorIndex + "FinalPrice"] = 0;
    });
    oManualNode.children.push(oNewItem);
    oManualNode.children.push({ NodeType: "DESC", PrItem: sPrItem, Material: oData.Material || "", MaterialLongText: oData.LongText || "", DescText: "" });
  });
  oVM.setProperty("/ManualMaterialDisplay",
    oManualNode.children.filter(function (c) { return c.NodeType === "ITEM"; }).map(function (c) { return c.Material; }).join(", ")
  );
  that._recalculateSummaries(aPRNodes);
  var aExistingSummary = aTreeData.filter(function (n) { return n.NodeType === "SUMMARY"; });
  oVM.setProperty("/TreeData", aPRNodes.concat(aExistingSummary.length ? aExistingSummary : that._getSummaryRows()));
  that._updateHasTableData();
  that._expandPRNode(sGroupKey);
},

// Called when user presses Enter in the Manual Material input — triggers backend API
onManualMaterialEnter: function (oEvent) {
  var sMaterial = (oEvent.getParameter("value") || "").trim();
  if (!sMaterial) return;
  var oModel = this.getOwnerComponent().getModel();
  var sNfaRefNo = this.getView().getModel("view").getProperty("/nfaRefNo");
  var that = this;
  sap.ui.core.BusyIndicator.show(0);
  oModel.read("/et_sh_materialSet", {
    filters: [
      new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
      new Filter("Material", FilterOperator.EQ, sMaterial)
    ],
    success: function (oData) {
      sap.ui.core.BusyIndicator.hide();
      var aResults = oData.results || [];
      if (!aResults.length) {
        sap.m.MessageToast.show("Material '" + sMaterial + "' not found.");
        return;
      }
      that._addMaterialsToTree(aResults);
    },
    error: function (oError) {
      sap.ui.core.BusyIndicator.hide();
      console.error("Manual material enter fetch error:", oError);
      sap.m.MessageToast.show("Failed to fetch material details.");
    }
  });
},

// onManualMaterialVH: function () {
//   var oModel = this.getOwnerComponent().getModel();
//   var oVM = this.getView().getModel("view");
//   var sNfaRefNo = oVM.getProperty("/nfaRefNo");
//   var that = this;

//   if (!this._oManualMaterialDialog) {
//     this._oManualMaterialDialog = new sap.m.SelectDialog({
//       title: "Select Materials",
//       noDataText: "No materials found",
//       multiSelect: true,
//       search: function (oEvent) {
//         var sVal = oEvent.getParameter("value") || "";
//         var oBinding = oEvent.getParameter("itemsBinding");
//         if (!oBinding) return;
//         var aFilters = [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)];
//         if (sVal.trim()) {
//           aFilters.push(new Filter({
//             filters: [
//               new Filter("Material", FilterOperator.Contains, sVal.trim()),
//               new Filter("MaterialDescription", FilterOperator.Contains, sVal.trim())
//             ],
//             and: false
//           }));
//         }
//         oBinding.filter(aFilters);
//         oBinding.refresh();
//       },
//       confirm: function (oEvent) {
//                 sap.ui.core.BusyIndicator.show(0);

//         var aSelectedItems = oEvent.getParameter("selectedItems") || [];
//         if (!aSelectedItems.length) return;

//         // Snapshot data immediately while binding contexts are still valid
//         var aSelectedData = aSelectedItems.map(function (oItem) {
//           return oItem.getBindingContext().getObject();
//         });

//         sap.ui.core.BusyIndicator.show(0);
//         setTimeout(function () {
//           var aTreeData = oVM.getProperty("/TreeData") || [];
//           var aPRNodes = aTreeData.filter(function (n) { return n.NodeType === "PR"; });

//           var sGroupKey = "MANUAL";
//           var oManualNode = aPRNodes.find(function (p) { return p.PrNumber === sGroupKey; });
//           if (!oManualNode) {
//             oManualNode = { NodeType: "PR", PrNumber: sGroupKey, children: [] };
//             aPRNodes.push(oManualNode);
//           }

//           var iNextIndex = oManualNode.children.filter(function (c) { return c.NodeType === "ITEM"; }).length + 1;

//           aSelectedData.forEach(function (oData) {
//             var bExists = oManualNode.children.some(function (c) { return c.Material === oData.Material; });
//             if (bExists) return;

//             var fQty = parseFloat(oData.Qty);
//             var fUnitLpp = parseFloat(oData.UnitLpp || 0);
//             var fEffQty = (!isNaN(fQty) && fQty > 0) ? fQty : 0;
//             var sPrItem = String(iNextIndex);
//             iNextIndex++;

//             var oNewItem = {
//               NodeType: "ITEM",
//               PrItem: sPrItem,
//               IsManual: true,
//               Material: oData.Material || "",
//               MaterialDesc: oData.MaterialDescription || "",
//               MaterialLongText: oData.LongText || "",
//               Qty: fEffQty > 0 ? String(fEffQty) : "0",
//               UOM: oData.Uom || "",
//               Plant: oData.Plant || "",
//               MaterialGroup: oData.MaterialGroup || "",
//               MaterialGroupDescription: oData.MaterialGrpDesc || "",
//               Lpp: fUnitLpp > 0 ? String(fUnitLpp) : "0",
//               UnitLpp: fUnitLpp > 0 ? String(fUnitLpp) : "0",
//               TotalLpp: (fUnitLpp * fEffQty).toFixed(3),
//               PrBudget: "0",
//               WbsElement: "",
//               PurchaseOrg:       that._nfaDetails.PurchaseOrg      || "",
//               PurchaseOrgDesc:   that._nfaDetails.PurchaseOrgDesc  || "",
//               PurchaseGroup:     that._nfaDetails.PurchaseGroup    || "",
//               PurchaseGroupDesc: that._nfaDetails.PurchaseGroupDesc || "",
//               children: []
//             };

//             that._vendors.forEach(function (v) {
//               oNewItem["v" + v.VendorIndex + "InitPrice"] = "";
//               oNewItem["v" + v.VendorIndex + "NegPrice"]  = "";
//               oNewItem["v" + v.VendorIndex + "FinalPrice"] = 0;
//             });

//             oManualNode.children.push(oNewItem);
//             oManualNode.children.push({ NodeType: "DESC", PrItem: sPrItem, Material: oData.Material || "", MaterialLongText: oData.LongText || "", DescText: "" });
//           });

//           oVM.setProperty("/ManualMaterialDisplay",
//             oManualNode.children.filter(function (c) { return c.NodeType === "ITEM"; }).map(function (c) { return c.Material; }).join(", ")
//           );

//           that._recalculateSummaries(aPRNodes);
//           var aExistingSummary = aTreeData.filter(function (n) { return n.NodeType === "SUMMARY"; });
//           var aSummaryRows = aExistingSummary.length ? aExistingSummary : that._getSummaryRows();
//           oVM.setProperty("/TreeData", aPRNodes.concat(aSummaryRows));
//           that._updateHasTableData();

//           that._expandPRNode(sGroupKey);
//           sap.ui.core.BusyIndicator.hide();
//         }, 50);
//       }
//     });
//     this.getView().addDependent(this._oManualMaterialDialog);
//   }

//   this._oManualMaterialDialog.setGrowing(true);
//   this._oManualMaterialDialog.setGrowingThreshold(20);
//   // Access the inner List to enforce the threshold before binding
//   var oInnerList = this._oManualMaterialDialog._oList || this._oManualMaterialDialog.getAggregation("_list");
//   if (oInnerList) {
//     oInnerList.setGrowingThreshold(20);
//   }
//   this._oManualMaterialDialog.setModel(oModel);
//   this._oManualMaterialDialog.bindAggregation("items", {
//     path: "/et_sh_materialSet",
//     filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
//     template: new sap.m.StandardListItem({
//       title: "{Material}",
//       description: "{MaterialDescription}",
//       type: "Active"
//     }),
//     parameters: {
//       operationMode: "Server",
//       countMode: "Inline"
//     }
//   });
//   this._oManualMaterialDialog.open();
// }
onManualMaterialVH: function () {
  var oModel = this.getOwnerComponent().getModel();
  var oVM = this.getView().getModel("view");
  var sNfaRefNo = oVM.getProperty("/nfaRefNo");
  var that = this;

  if (!this._oManualMaterialDialog) {
    this._oManualMaterialDialog = new sap.m.SelectDialog({
      title: "Select Materials",
      noDataText: "No materials found",
      multiSelect: true,
      growing: true,
      growingThreshold: 20,

      // KEY FIX: rememberSelections keeps checked state across searches
      rememberSelections: true,

      search: function (oEvent) {
        var sVal = (oEvent.getParameter("value") || "").trim();

        // itemsBinding can be null for OData-bound SelectDialog — fall back to the inner list binding
        var oBinding = oEvent.getParameter("itemsBinding");
        if (!oBinding) {
          var oInnerList = that._oManualMaterialDialog._oList ||
                           that._oManualMaterialDialog.getAggregation("_list");
          oBinding = oInnerList ? oInnerList.getBinding("items") : null;
        }
        if (!oBinding) return;

        var aFilters = [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)];

        if (sVal) {
          aFilters.push(new Filter("Material", FilterOperator.EQ, sVal));
        }

        oBinding.filter(
          new Filter({ filters: aFilters, and: true }),
          "Application"
        );
      },

      confirm: function (oEvent) {
  var aSelectedItems = oEvent.getParameter("selectedItems") || [];
  if (!aSelectedItems.length) return;
  var oModel = that.getOwnerComponent().getModel();
  var sNfaRefNo = that.getView().getModel("view").getProperty("/nfaRefNo");
  sap.ui.core.BusyIndicator.show(0);
  var aPromises = aSelectedItems.map(function (oItem) {
    var sMaterial = oItem.getBindingContext().getProperty("Material");
    return new Promise(function (resolve) {
      oModel.read("/et_sh_materialSet", {
        filters: [
          new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
          new Filter("Material", FilterOperator.EQ, sMaterial)
        ],
        success: function (oData) { resolve(oData.results || []); },
        error: function () { resolve([]); }
      });
    });
  });
  Promise.all(aPromises).then(function (aResultSets) {
    var aAllResults = aResultSets.reduce(function (acc, r) { return acc.concat(r); }, []);
    sap.ui.core.BusyIndicator.hide();
    if (!aAllResults.length) {
      sap.m.MessageToast.show("No material details found.");
      return;
    }
    that._addMaterialsToTree(aAllResults);
  });
}
    });

    this.getView().addDependent(this._oManualMaterialDialog);
  }

  // Reset the dialog search state and apply initial binding each time it opens
  // so it doesn't carry over stale filters from the previous open
  this._oManualMaterialDialog.setModel(oModel);
  this._oManualMaterialDialog.bindAggregation("items", {
    path: "/et_sh_materialSet",
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    template: new sap.m.StandardListItem({
      title: "{Material}",
      description: "{MaterialDescription}",
      type: "Active"
    }),
    parameters: {
      operationMode: "Server",
      countMode: "Inline"
    }
  });

  this._oManualMaterialDialog.open();
}
,

    /* ================= SUMMARY ROWS ================= */

    _buildSummaryRows: function () {
      return this._summaryLabels.map(l => ({
        NodeType: "SUMMARY",
        Label: l
      }));
    },

    /* ================= VALUE HELPS ================= */

    onPRNumberVH: function () {
  var sNfaRefNo = this.getView().getModel("view").getProperty("/nfaRefNo");
  this._fetchPRItemsByNfaRefNo(sNfaRefNo);
},

_fetchPRItemsByNfaRefNo: function (sNfaRefNo) {
  var oModel = this.getOwnerComponent().getModel();
  var that = this;

  sap.ui.core.BusyIndicator.show(0);

  oModel.read("/ZNFA_SH_PR_ITEMSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    success: function (oData) {
      sap.ui.core.BusyIndicator.hide();
      that._openPRPickerDialog(oData.results || []);
    },
    error: function (oError) {
      sap.ui.core.BusyIndicator.hide();
      sap.m.MessageBox.error("Failed to fetch PR items.");
      console.error("PR item fetch error:", oError);
    }
  });
},

_fetchPRItemsByPR: function (sPrNo) {
  var oModel = this.getOwnerComponent().getModel();
  var sNfaRefNo = this.getView().getModel("view").getProperty("/nfaRefNo");
  var oVM = this.getView().getModel("view");
  var that = this;

  sap.ui.core.BusyIndicator.show(0);

  oModel.read("/ZNFA_SH_PR_ITEMSet", {
    filters: [
      new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
      new Filter("PrNo", FilterOperator.EQ, String(sPrNo))
    ],
    success: function (oData) {
      var aResults = (oData.results || []).map(function (i) {
        return {
          PrItem: i.PrItem || "",
          Material: i.Material || "",
          MaterialDesc: i.MaterialDesc || "",
          Qty: i.Qty != null ? String(i.Qty) : "0",
          UOM: i.Uom || i.UOM || "",
          Plant: i.Plant || "",
          MaterialGroup: i.MaterialGroup || "",
          MaterialGroupDescription: i.MaterialGroupDescription || "",
          PurchaseOrg: i.PurchaseOrg || "",
          PurchaseOrgDesc: i.PurchaseOrgDesc || "",
          PurchaseGroup: i.PurchaseGroup || "",
          PurchaseGroupDesc: i.PurchaseGroupDesc || "",
          Lpp: i.UnitLpp != null ? String(i.UnitLpp) : "0",
          UnitLpp: i.UnitLpp != null ? String(i.UnitLpp) : "0",
          TotalLpp: i.TotalLpp != null ? String(i.TotalLpp) : "0",
          PrBudget: i.PrBudget != null ? String(i.PrBudget) : "0",
          WbsBudget: i.WbsBudget != null ? String(i.WbsBudget) : "0",
          WbsElement: i.WbsElement || "",
          MaterialLongText: i.LongText || ""
        };
      });
      oVM.setProperty("/PRItemsForVH", aResults);
      setTimeout(function () {
        sap.ui.core.BusyIndicator.hide();
        that.onPRItemVH();
      }, 300);
    },
    error: function (oError) {
      sap.ui.core.BusyIndicator.hide();
      sap.m.MessageBox.error("Failed to fetch PR items.");
      console.error("PR item fetch error:", oError);
    }
  });
},

_openPRPickerDialog: function (aItems) {
  var that = this;
  var oVM = this.getView().getModel("view");

  // Deduplicate PR numbers
  var aPRNumbers = [];
  var mSeen = {};
  aItems.forEach(function (i) {
    var sPrNo = String(i.PrNo);
    if (!mSeen[sPrNo]) {
      mSeen[sPrNo] = true;
      aPRNumbers.push({ PrNo: sPrNo });
    }
  });

  var oPRItemsModel = new sap.ui.model.json.JSONModel({ items: aPRNumbers, allItems: aPRNumbers });

  if (!this._oPRPickerDialog) {
    this._oPRPickerDialog = new sap.m.SelectDialog({
      title: "Select PR Number",
      noDataText: "No PR items found",
      search: function (oEvent) {
        var sVal = oEvent.getParameter("value").trim();
        var oDialogModel = that._oPRPickerDialog.getModel("prItems");
        var aAll = oDialogModel.getProperty("/allItems");
        var aFiltered = sVal
          ? aAll.filter(function (o) { return o.PrNo.indexOf(sVal) !== -1; })
          : aAll;
        oDialogModel.setProperty("/items", aFiltered);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oData = oItem.getBindingContext("prItems").getObject();
        oVM.setProperty("/SelectedPR", oData.PrNo);
        that._fetchPRItemsByPR(oData.PrNo);
      }
    });
    this.getView().addDependent(this._oPRPickerDialog);
  }

  this._oPRPickerDialog.setModel(oPRItemsModel, "prItems");
  this._oPRPickerDialog.bindAggregation("items", {
    path: "prItems>/items",
    template: new sap.m.StandardListItem({ title: "{prItems>PrNo}" })
  });
  this._oPRPickerDialog.open();
},

    onPRItemVH: function () {
  var that = this;
  var oVM = this.getView().getModel("view");
  var aAllItems = oVM.getProperty("/PRItemsForVH") || [];

  var oColModel = new JSONModel({
    cols: [
      { label: "PR Item",        template: "PrItem" },
      { label: "Material Code",  template: "Material" },
      { label: "Description",    template: "MaterialDesc" },
      { label: "Quantity",       template: "Qty" },
      { label: "UOM",            template: "UOM" },
      { label: "Plant",          template: "Plant" },
      { label: "Material Group", template: "MaterialGroup" }
    ]
  });

  // Always create fresh — destroyed on afterClose
  this._oPRItemVHDialog = new ValueHelpDialog({
    title: "Select PR Items",
    supportMultiselect: true,
    supportRanges: false,
    supportRangesOnly: false,
    key: "PrItem",
    descriptionKey: "Material",
    stretch: sap.ui.Device.system.phone,
    ok: this.onPRItemVHOk.bind(this),
    cancel: this.onPRItemVHCancel.bind(this),
    afterClose: function () {
      that._oPRItemVHDialog.destroy();
      that._oPRItemVHDialog = null;
    }
  });

  this.getView().addDependent(this._oPRItemVHDialog);

  // FilterBar with PR Item, Material Code, Material Group
  var oFilterBar = new FilterBar({
    advancedMode: true,
    filterBarExpanded: true,
    showGoOnFB: true,
    search: function () {
      var sPrItem      = oFilterBar.getFilterGroupItems()[0].getControl().getValue().trim().toLowerCase();
      var sMaterial    = oFilterBar.getFilterGroupItems()[1].getControl().getValue().trim().toLowerCase();
      var sMatGrp      = oFilterBar.getFilterGroupItems()[2].getControl().getValue().trim().toLowerCase();

      var aFiltered = aAllItems.filter(function (item) {
        var bPrItem   = !sPrItem   || (item.PrItem        || "").toLowerCase().indexOf(sPrItem)   !== -1;
        var bMaterial = !sMaterial || (item.Material      || "").toLowerCase().indexOf(sMaterial) !== -1;
        var bMatGrp   = !sMatGrp   || (item.MaterialGroup || "").toLowerCase().indexOf(sMatGrp)   !== -1;
        return bPrItem && bMaterial && bMatGrp;
      });

      var oFilteredModel = new JSONModel({ PRItemsForVH: aFiltered });
      oTable.setModel(oFilteredModel);
      oTable.bindRows("/PRItemsForVH");
      that._oPRItemVHDialog.update();
    },
    filterGroupItems: [
      new FilterGroupItem({
        groupName:   "__basic",
        name:        "PrItem",
        label:       "PR Item",
        visibleInFilterBar: true,
        control: new sap.m.Input({ placeholder: "PR Item" })
      }),
      new FilterGroupItem({
        groupName:   "__basic",
        name:        "Material",
        label:       "Material Code",
        visibleInFilterBar: true,
        control: new sap.m.Input({ placeholder: "Material Code" })
      }),
      new FilterGroupItem({
        groupName:   "__basic",
        name:        "MaterialGroup",
        label:       "Material Group",
        visibleInFilterBar: true,
        control: new sap.m.Input({ placeholder: "Material Group" })
      })
    ]
  });

  this._oPRItemVHDialog.setFilterBar(oFilterBar);

  var oTable;
  this._oPRItemVHDialog.getTableAsync().then(function (oT) {
    oTable = oT;
    oTable.setModel(oColModel, "columns");
    oTable.setModel(oVM);
    oTable.bindRows("/PRItemsForVH");
    if (oTable.setSelectionMode) {
      oTable.setSelectionMode("MultiToggle");
    }
    if (oTable.bindItems) {
      oTable.bindAggregation("items", "/PRItemsForVH", function () {
        return new ColumnListItem({
          cells: oColModel.getData().cols.map(function (oCol) {
            return new Text({ text: "{" + oCol.template + "}" });
          })
        });
      });
    }
    that._oPRItemVHDialog.update();
  });

  this._oPRItemVHDialog.open();
},

onPRItemVHOk: function (oEvent) {
  const aTokens = oEvent.getParameter("tokens");
  if (!aTokens || !aTokens.length) return;

  const oVM = this.getView().getModel("view");
  const sSelectedPR = oVM.getProperty("/SelectedPR");
  const aPRItems = oVM.getProperty("/PRItemsForVH");

  let aTreeData = oVM.getProperty("/TreeData") || [];
  let aPRNodes = aTreeData.filter(n => n.NodeType === "PR");
  let oPRNode = aPRNodes.find(p => p.PrNumber === sSelectedPR);

  const aNewItems = aTokens.map(oToken => {
    const sKey = oToken.getKey();
    // Match by PrItem — try exact string, then numeric, then description key fallback
    const oData = aPRItems.find(item =>
      String(item.PrItem) === String(sKey) ||
      String(item.Material) === String(sKey) ||
      parseInt(item.PrItem, 10) === parseInt(sKey, 10)
    );
    if (!oData) {
      console.warn("[QCS] No PRItem match for token key:", sKey, "Available:", aPRItems.map(i => i.PrItem));
      return null;
    }

    console.log("[QCS] PR item selected from VH:", JSON.stringify(oData));

    const oNewItem = {
      NodeType: "ITEM",
      PrItem: oData.PrItem || "",
      IsManual: false,
      Material: oData.Material || "",
      MaterialDesc: oData.MaterialDesc || "",
      Qty: oData.Qty != null && oData.Qty !== "" ? String(oData.Qty) : "0",
      UOM: oData.UOM || "",
      Plant: oData.Plant || "",
      MaterialGroup: oData.MaterialGroup || "",
      MaterialGroupDescription: oData.MaterialGroupDescription || "",
      Lpp: oData.UnitLpp || oData.Lpp || "0",
      UnitLpp: oData.UnitLpp || oData.Lpp || "0",
      TotalLpp: oData.TotalLpp || (parseFloat(oData.UnitLpp || oData.Lpp || 0) * parseFloat(oData.Qty != null && oData.Qty !== "" ? oData.Qty : 0)).toFixed(3),
      PrBudget: oData.PrBudget || "0",
      WbsBudget: oData.WbsBudget || "0",
      WbsElement: oData.WbsElement || "",
      MaterialLongText: oData.MaterialLongText || "",
      PurchaseOrg: oData.PurchaseOrg || "",
      PurchaseOrgDesc: oData.PurchaseOrgDesc || "",
      PurchaseGroup: oData.PurchaseGroup || "",
      PurchaseGroupDesc: oData.PurchaseGroupDesc || "",
      children: []
    };

    this._vendors.forEach(v => {
      oNewItem["v" + v.VendorIndex + "InitPrice"] = "";
      oNewItem["v" + v.VendorIndex + "NegPrice"] = "";
      oNewItem["v" + v.VendorIndex + "FinalPrice"] = 0;
    });

    return oNewItem;
  }).filter(Boolean);

  if (!oPRNode) {
    oPRNode = { NodeType: "PR", PrNumber: sSelectedPR, children: [] };
    aNewItems.forEach(oNewItem => {
      oPRNode.children.push(oNewItem);
      oPRNode.children.push({ NodeType: "DESC", PrItem: oNewItem.PrItem, MaterialLongText: oNewItem.MaterialLongText || "", DescText: "" });
    });
    aPRNodes.push(oPRNode);
  } else {
    aNewItems.forEach(oNewItem => {
      const bExists = oPRNode.children.some(i =>
        String(i.PrItem) === String(oNewItem.PrItem) && i.NodeType === "ITEM"
      );
      if (!bExists) {
        oPRNode.children.push(oNewItem);
        oPRNode.children.push({ NodeType: "DESC", PrItem: oNewItem.PrItem, MaterialLongText: oNewItem.MaterialLongText || "", DescText: "" });
      }
    });
  }

  this._recalculateSummaries(aPRNodes);
  const aExistingSummaryRows = aTreeData.filter(n => n.NodeType === "SUMMARY");
  const aSummaryRows = aExistingSummaryRows.length ? aExistingSummaryRows : this._getSummaryRows();
  oVM.setProperty("/TreeData", [...aPRNodes, ...aSummaryRows]);
  this._updateHasTableData();

  // Set Header WBS Budget to the first PR line item's WbsBudget (not a sum)
  var oFirstItem = null;
  for (var i = 0; i < aPRNodes.length && !oFirstItem; i++) {
    oFirstItem = (aPRNodes[i].children || []).find(function (c) { return c.NodeType === "ITEM"; });
  }
  if (oFirstItem) {
    this.getView().getModel("nfaModel").setProperty("/header/WbsBudget", oFirstItem.WbsBudget || "");
  }

  setTimeout(() => { this._expandPRNode(sSelectedPR); }, 0);

  this._oPRItemVHDialog.close();
},

onPRItemVHCancel: function () {
  this._oPRItemVHDialog.close();
},


    onPRNumberVHConfirm: function (oEvent) {

      const sPr = oEvent.getParameter("selectedItem").getTitle();
      const oVM = this.getView().getModel("view");

      const oPR = this.getView().getModel("pr")
        .getProperty("/PRNumbers")
        .find(p => p.PrNumber === sPr);

      oVM.setProperty("/SelectedPR", sPr);
      oVM.setProperty("/PRItemsForVH", oPR.Items);
    },


onPRItemVHConfirm: function (oEvent) {
  const aSelectedItems = oEvent.getParameter("selectedItems") || [];
  if (!aSelectedItems.length) return;

  const oVM = this.getView().getModel("view");
  const sSelectedPR = oVM.getProperty("/SelectedPR");
  let aTreeData = oVM.getProperty("/TreeData") || [];
  let aPRNodes = aTreeData.filter(n => n.NodeType === "PR");
  let oPRNode = aPRNodes.find(p => p.PrNumber === sSelectedPR);

  const aNewItems = aSelectedItems.map(oItem => {
    const oData = oItem.getBindingContext("view").getObject();
    const oNewItem = {
      NodeType: "ITEM",
      ...oData,
      children: []
    };
    this._vendors.forEach(v => {
      oNewItem[`v${v.VendorIndex}InitPrice`] = "";
      oNewItem[`v${v.VendorIndex}NegPrice`] = "";
      oNewItem[`v${v.VendorIndex}FinalPrice`] = 0;
    });
    return oNewItem;
  });

  if (!oPRNode) {
    oPRNode = { NodeType: "PR", PrNumber: sSelectedPR, children: aNewItems };
    aPRNodes.push(oPRNode);
  } else {
    aNewItems.forEach(oNewItem => {
      const bExists = oPRNode.children.some(i => i.PrItem === oNewItem.PrItem);
      if (!bExists) oPRNode.children.push(oNewItem);
    });
  }

  this._recalculateSummaries(aPRNodes);
  oVM.setProperty("/TreeData", [...aPRNodes, ...this._getSummaryRows()]);
  setTimeout(() => { this._expandPRNode(sSelectedPR); }, 0);
}

,

_expandPRNode: function (sPrNumber) {

  const oTable = this.byId("vendorTreeTable");
  const oBinding = oTable.getBinding("rows");

  if (!oBinding) {
    return;
  }

  for (let i = 0; i < oBinding.getLength(); i++) {
    const oCtx = oBinding.getContextByIndex(i);
    if (!oCtx) {
      continue;
    }

    const oObj = oCtx.getObject();
    if (oObj.NodeType === "PR" && oObj.PrNumber === sPrNumber) {
      oTable.expand(i);
      break;
    }
  }
}
,

onDeleteRow: function (oEvent) {

  const oCtxObj = oEvent.getSource()
    .getBindingContext("view")
    .getObject();

  const oVM = this.getView().getModel("view");

  MessageBox.confirm(
    `Are you sure you want to delete this ${oCtxObj.NodeType}?`,
    {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.OK,
      onClose: sAction => {

        if (sAction !== MessageBox.Action.OK) {
          return;
        }

        this._bDirty = true;
        let aTreeData = oVM.getProperty("/TreeData") || [];

        // Keep only PR nodes
        let aPRNodes = aTreeData.filter(n => n.NodeType === "PR");

        if (oCtxObj.NodeType === "PR") {
          aPRNodes = aPRNodes.filter(
            p => p.PrNumber !== oCtxObj.PrNumber
          );
        }

        if (oCtxObj.NodeType === "ITEM") {
          aPRNodes.forEach(p => {
            // Remove the ITEM and its paired DESC row
            p.children = p.children.filter(i =>
              !(i.PrItem === oCtxObj.PrItem && (i.NodeType === "ITEM" || i.NodeType === "DESC")) &&
              !(i.NodeType === "DESC" && i.Material && i.Material === oCtxObj.Material)
            );
          });

          // Remove PR if empty
          aPRNodes = aPRNodes.filter(p => p.children.length);
        }

        const aExistingSummary = aTreeData.filter(n => n.NodeType === "SUMMARY");
        const aSummary = aExistingSummary.length ? aExistingSummary : this._getSummaryRows();
        oVM.setProperty("/TreeData", [
          ...aPRNodes,
          ...aSummary
        ]);
        this._updateHasTableData();
      }
    }
  );
}

,


_getSummaryRows: function () {
  return this._summaryLabels.map(l => ({
    NodeType: "SUMMARY",
    Label: l
  }));
},

_updateHasTableData: function () {
  var oVM = this.getView().getModel("view");
  var aTreeData = oVM.getProperty("/TreeData") || [];
  oVM.setProperty("/hasTableData", aTreeData.some(function (n) { return n.NodeType === "PR"; }));
},

_getPRNodesOnly: function (aTreeData) {
  return aTreeData.filter(n => n.NodeType === "PR");
},



    /* ================= VENDOR COLUMNS ================= */


_addVendorColumns: function () {
  const oTable = this.byId("vendorTreeTable");

  this._vendors.forEach(v => {

    // Initial Price
    oTable.addColumn(new Column({
      width: "120px",
      hAlign: "End",
      headerSpan: [5, 5, 1],
      multiLabels: [
        new Label({ text: "Vendor " + v.VendorIndex, textAlign: "Center" }),
        new Label({ text: v.VendorName, textAlign: "Center", tooltip: [
          "Vendor No: "       + (v.VendorNo          || "-"),
          "Plant: "           + (v.plant              || "-"),
          "TA: "              + (v.ta                 || "-"),
          "Vendor QA: "       + (v.vendorQa           || "-"),
          "Delivery Date: "   + (v.deliveryDate       || "-"),
          "Payment Terms: "   + (v.paymentTermsDesc   || v.paymentTerms || "-"),
          "Purchase Order: "  + (v.purchaseOrder      || "-"),
          "Contract No: "     + (v.contractNo         || "-"),
          "Ariba Doc No: "    + (v.aribaDocNo         || "-"),
          "Technical Rating: "+ (v.techinicalRating   || "-"),
          "Qualif. Score: "   + (v.qualifScore        || "-")
        ].join("\n") }),
        new Label({ text: "Initial Price", textAlign: "Center" })
      ],
      template: new Input({
        value: `{view>v${v.VendorIndex}InitPrice}`,
        visible: "{= ${view>NodeType} === 'ITEM' }",
        textAlign: "End",
        editable: "{= ${view>/editable} && !${view>/isAribaMode} }",
        liveChange: this._onPriceChange.bind(this, v.VendorIndex, "Init")
      })
    }));

    // Negotiated Price
    oTable.addColumn(new Column({
      width: "100px",
      hAlign: "End",
      multiLabels: [
        new Label({ text: "" }),
        new Label({ text: "" }),
        new Label({ text: "Negotiated Price", textAlign: "Center" })
      ],
      template: new sap.m.VBox({
        width: "100%",
        alignItems: "End",
        items: [
          new Input({
            value: `{view>v${v.VendorIndex}NegPrice}`,
            visible: "{= ${view>NodeType} === 'ITEM' }",
            editable: "{= ${view>/editable} && !${view>/isAribaMode} }",
            textAlign: "End",
            liveChange: this._onPriceChange.bind(this, v.VendorIndex, "Neg")
          }),
          new Input({
            value: `{view>v${v.VendorIndex}NegPrice}`,
            visible: "{= ${view>NodeType} === 'SUMMARY' && ${view>Label} !== 'Basic Amount Total' && ${view>Label} !== 'Total Basic' && ${view>Label} !== 'Net Landed Cost (Rs)' && ${view>Label} !== 'Commercial Rating' && ${view>Label} !== 'Loading Comments' && ${view>Label} !== 'Delivery Date' && ${view>Label} !== 'Payment Terms' && ${view>Label} !== 'Total Amt with Comm. Loading' }",
            editable: "{= ${view>/editable} && (!${view>/isAribaMode} || ${view>Label} === 'Commercial Loading') }",
            textAlign: "End",
            liveChange: this._onPriceChange.bind(this, v.VendorIndex, "Neg")
          }),
          new Input({
            value: "{view>v" + v.VendorIndex + "LoadingComments}",
            visible: "{= ${view>NodeType} === 'SUMMARY' && ${view>Label} === 'Loading Comments' }",
            editable: "{view>/editable}",
            tooltip: "{= !${view>/editable} ? ${view>v" + v.VendorIndex + "LoadingComments} : '' }",
            maxLength: 100,
            textAlign: "Begin",
            liveChange: this._onLoadingCommentsChange.bind(this, v.VendorIndex)
          }),
          new DatePicker({
            value: "{view>v" + v.VendorIndex + "SingleValue}",
            displayFormat: "dd.MM.yyyy",
            valueFormat: "dd.MM.yyyy",
            visible: "{= ${view>NodeType} === 'SUMMARY' && ${view>Label} === 'Delivery Date' }",
            editable: "{view>/editable}",
            width: "100%",
            change: this._onDeliveryDateChange.bind(this, v.VendorIndex)
          })
        ]
      })
    }));

    // Negotiated Price Total
    oTable.addColumn(new Column({
      width: "110px",
      hAlign: "End",
      multiLabels: [
        new Label({ text: "" }),
        new Label({ text: "" }),
        new Label({ text: "Negotiated Price Total", textAlign: "Center" })
      ],
      template: new sap.m.VBox({
        width: "100%",
        alignItems: "End",
        items: [
          new sap.m.Label({
            text: {
              path: "view>v" + v.VendorIndex + "NegPriceTotal",
              formatter: function (val) {
                var n = parseFloat(val);
                if (isNaN(n) || n === 0) return "";
                return " " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
            },
            visible: "{= ${view>NodeType} === 'ITEM' || (${view>NodeType} === 'SUMMARY' && ${view>Label} !== 'Commercial Rating') }",
            textAlign: "End",
            design: "{= ${view>Label} === 'Net Landed Cost (Rs)' ? 'Bold' : 'Standard' }",
            width: "100%"
          }),
          new sap.m.Label({
            text: "{view>v" + v.VendorIndex + "SingleValue}",
            visible: "{= ${view>NodeType} === 'SUMMARY' && ${view>Label} === 'Commercial Rating' }",
            textAlign: "Center",
            design: "Bold",
            width: "100%"
          })
        ]
      })
    }));

    // Split PO QTY (moved here — just before Finalized Price)
    oTable.addColumn(new Column({
      width: "90px",
      hAlign: "End",
      multiLabels: [
        new Label({ text: "" }),
        new Label({ text: "" }),
        new Label({ text: "Ordered QTY", textAlign: "Center" })
      ],
      template: new sap.m.VBox({
        width: "100%",
        alignItems: "End",
        items: [
          new sap.m.Text({
            text: {
              path: "view>v" + v.VendorIndex + "SplitQty",
              formatter: function (val) {
                if (val === null || val === undefined || val === "") return "";
                var f = parseFloat(val);
                return isNaN(f) ? "" : String(f);
              }
            },
            visible: "{= !${view>/editable} && ${view>NodeType} === 'ITEM' }",
            textAlign: "End",
            width: "100%"
          }),
          new Input({
            value: "{view>v" + v.VendorIndex + "SplitQty}",
            visible: "{= ${view>/editable} && ${view>NodeType} === 'ITEM' }",
            textAlign: "End",
            editable: true,
            liveChange: this._onSplitQtyChange.bind(this, v.VendorIndex)
          })
        ]
      })
    }));

    // Finalized Price
    oTable.addColumn(new Column({
      width: "100px",
      hAlign: "End",
      multiLabels: [
        new Label({ text: "" }),
        new Label({ text: "" }),
        new Label({ text: "Order Value", textAlign: "Center" })
      ],
      template: new sap.m.VBox({
        width: "100%",
        alignItems: "End",
        items: [
          new sap.m.Label({
            text: {
              path: "view>v" + v.VendorIndex + "FinalPriceDisplay",
              formatter: function (val) {
                var n = parseFloat(val);
                if (isNaN(n) || n === 0) return "";
                return " " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
            },
            visible: "{= ${view>NodeType} === 'SUMMARY' && (${view>Label} === 'Basic Amount Total' || ${view>Label} === 'Total Basic' || ${view>Label} === 'Net Landed Cost (Rs)') }",
            textAlign: "End",
            design: "{= ${view>Label} === 'Net Landed Cost (Rs)' ? 'Bold' : 'Standard' }",
            width: "100%"
          }),
          new Input({
            value: "{view>v" + v.VendorIndex + "FinalPrice}",
            visible: "{= ${view>NodeType} === 'ITEM' || (${view>NodeType} === 'SUMMARY' && ${view>Label} !== 'Commercial Rating' && ${view>Label} !== 'Commercial Loading' && ${view>Label} !== 'Loading Comments' && ${view>Label} !== 'Total Amt with Comm. Loading' && ${view>Label} !== 'Delivery Date' && ${view>Label} !== 'Payment Terms' && ${view>Label} !== 'Basic Amount Total' && ${view>Label} !== 'Total Basic' && ${view>Label} !== 'Net Landed Cost (Rs)') }",
            editable: false,
            textAlign: "End"
          }),
          new Text({
            text: {
              path: "view>v" + v.VendorIndex + "FinalPrice",
              formatter: function (val) {
                var n = parseFloat(val);
                if (isNaN(n) || n === 0) return "";
                return " " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
            },
            visible: "{= ${view>NodeType} === 'SUMMARY' && ${view>Label} === 'Total Amt with Comm. Loading' }",
            textAlign: "End"
          }),
          new Text({
            text: "{view>v" + v.VendorIndex + "SingleValue}",
            visible: "{= ${view>NodeType} === 'SUMMARY' && (${view>Label} === 'Delivery Date' || ${view>Label} === 'Payment Terms') }",
            textAlign: "Center"
          })
        ]
      })
    }));
  });
}

,

_onSplitQtyChange: function (iVendor, oEvent) {
  const oCtx = oEvent.getSource().getBindingContext("view");
  const oCtxObj = oCtx.getObject();
  const fSplitQty = parseFloat(oEvent.getParameter("value")) || 0;
  const fOriginalQty = parseFloat(oCtxObj.Qty) || 0;

  const oCurrentVendor = this._vendors.find(v => v.VendorIndex === iVendor);
  const bIsIce = oCurrentVendor && oCurrentVendor.vendorIceFlag === "X";

  // Validation: Initial Price and Negotiated Price must be filled before entering Ordered QTY
  const sInitPrice = String(oCtxObj["v" + iVendor + "InitPrice"] || "").trim();
  const sNegPrice  = String(oCtxObj["v" + iVendor + "NegPrice"]  || "").trim();
  if (!sInitPrice || !sNegPrice) {
    oEvent.getSource().setValue("");
    oEvent.getSource().setValueState("Error");
    oEvent.getSource().setValueStateText("Please fill Initial Price and Negotiated Price before entering Ordered QTY.");
    return;
  }

  // Validation 1 — split qty must not exceed item qty (applies to ALL vendors including ICE)
  if (fSplitQty > fOriginalQty) {
    oEvent.getSource().setValueState("Error");
    oEvent.getSource().setValueStateText("Split quantity cannot exceed item quantity");
    return;
  }

  // Validation 2 — total split must not exceed item qty (only for NON-ICE vendors)
  if (!bIsIce) {
    let fOtherVendorsSplit = 0;
    this._vendors.forEach(v => {
      if (v.VendorIndex === iVendor) return;
      if (v.vendorIceFlag === "X") return;  // exclude ICE from total check
      fOtherVendorsSplit += parseFloat(oCtxObj[`v${v.VendorIndex}SplitQty`]) || 0;
    });

    if ((fOtherVendorsSplit + fSplitQty) > fOriginalQty) {
      oEvent.getSource().setValueState("Error");
      oEvent.getSource().setValueStateText(
        "Total split quantity exceeds original quantity (" + fOriginalQty + "). " +
        "Remaining available: " + parseFloat((fOriginalQty - fOtherVendorsSplit).toFixed(3))
      );
      return;
    }
  }

  oEvent.getSource().setValueState("None");

  this._bDirty = true;
  oCtxObj[`v${iVendor}SplitQty`] = fSplitQty;

  // Recalculate RemainingQty from all vendors' SplitQty — exclude ICE vendors
  let fTotalSplit = 0;
  this._vendors.forEach(v => {
    if (v.vendorIceFlag === "X") return;
    fTotalSplit += parseFloat(oCtxObj[`v${v.VendorIndex}SplitQty`]) || 0;
  });
  oCtxObj.RemainingQty = parseFloat((fOriginalQty - fTotalSplit).toFixed(3));

  // Recalculate FinalPrice for ALL vendors (split qty redistribution affects all)
  this._vendors.forEach(v => {
    const fNeg = parseFloat(oCtxObj[`v${v.VendorIndex}NegPrice`]) || 0;
    const fSplit = parseFloat(oCtxObj[`v${v.VendorIndex}SplitQty`]) || 0;
    const bMultiVendor = this._vendors.length > 1;

    let fEffectiveQty;
    if (fSplit > 0) {
      fEffectiveQty = fSplit;
    } else if (!bMultiVendor) {
      fEffectiveQty = fOriginalQty;
    } else {
      // Multi-vendor, no split qty for this vendor → 0
      fEffectiveQty = 0;
    }
    oCtxObj[`v${v.VendorIndex}FinalPrice`] = fNeg * fEffectiveQty;
  });

  const oVM = this.getView().getModel("view");
  const aTreeData = oVM.getProperty("/TreeData") || [];
  this._recalculateSummaries(aTreeData.filter(n => n.NodeType === "PR"));
  oCtx.getModel().refresh();
},




// _onPriceChange: function (iVendor, sType, oEvent) {

//   const oCtx = oEvent.getSource().getBindingContext("view").getObject();

//   if (oCtx.NodeType !== "ITEM") {
//     return;
//   }

//   const fPrice = parseFloat(oEvent.getParameter("value")) || 0;
//   oCtx[`v${iVendor}${sType}Total`] = oCtx.Qty * fPrice;
// }

_onPriceChange: function (iVendor, sType, oEvent) {
  const oCtx = oEvent.getSource().getBindingContext("view");
  const oCtxObj = oCtx.getObject();
  const fPrice = parseFloat(oEvent.getParameter("value")) || 0;
  this._bDirty = true;

  // ITEM: Init — just store
  if (oCtxObj.NodeType === "ITEM" && sType === "Init") {
    oCtxObj[`v${iVendor}InitPrice`] = fPrice;
    oCtx.getModel().refresh();
    return;
  }

  // ITEM: Neg — store unit price, calculate FinalPrice with split qty or full qty
  if (oCtxObj.NodeType === "ITEM" && sType === "Neg") {
    oCtxObj[`v${iVendor}NegPrice`] = fPrice;
    const fSplitQty = parseFloat(oCtxObj[`v${iVendor}SplitQty`]) || 0;
    const bMultiVendor = this._vendors.length > 1;
    const oCurrentVendor = this._vendors.find(v => v.VendorIndex === iVendor);
    const bIsIce = oCurrentVendor && oCurrentVendor.vendorIceFlag === "X";
    let fQty;
    if (fSplitQty > 0) {
      fQty = fSplitQty;
    } else if (!bMultiVendor || bIsIce) {
      fQty = parseFloat(oCtxObj.Qty) || 0;
    } else {
      fQty = 0;
    }
    if (bMultiVendor && !bIsIce && fSplitQty === 0) {
      const fRem = parseFloat(oCtxObj.RemainingQty);
      if (!isNaN(fRem) && fRem <= 0) fQty = 0;
    }
    oCtxObj[`v${iVendor}FinalPrice`] = fPrice * fQty;
    // NegPriceTotal at item level = NegPrice × full Qty (always full qty, not split)
    oCtxObj[`v${iVendor}NegPriceTotal`] = fPrice * (parseFloat(oCtxObj.Qty) || 0);
    const oVM = this.getView().getModel("view");
    const aTreeData = oVM.getProperty("/TreeData") || [];
    this._recalculateSummaries(aTreeData.filter(n => n.NodeType === "PR"));
    oCtx.getModel().refresh();
    return;
  }

  // SUMMARY: SummaryInit — just store per vendor
  if (oCtxObj.NodeType === "SUMMARY" && sType === "SummaryInit") {
    oCtxObj[`v${iVendor}SummaryInitPrice`] = fPrice;
    oCtx.getModel().refresh();
    return;
  }

  // SUMMARY: Neg — per vendor independently, no sharing
  if (oCtxObj.NodeType === "SUMMARY" && sType === "Neg") {
    const aAutoCalc = ["Basic Amount Total", "Net Landed Cost (Rs)", "Total Basic", "Total Amt with Comm. Loading"];
    if (aAutoCalc.includes(oCtxObj.Label)) return;
    const aNonEditable = ["Commercial Rating", "Delivery Date", "Payment Terms"];
    if (aNonEditable.includes(oCtxObj.Label)) return;

    const oVM = this.getView().getModel("view");
    const aTreeData = oVM.getProperty("/TreeData") || [];
    const oBasicRow      = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Basic Amount Total");
    const oTotalBasicRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic");
    const fBasic      = parseFloat(oBasicRow      ? oBasicRow[`v${iVendor}FinalPrice`]      : 0) || 0;
    const fNegBasic   = parseFloat(oBasicRow      ? oBasicRow[`v${iVendor}NegBasicAmt`]     : 0) || 0;
    const fTotalBasic    = parseFloat(oTotalBasicRow ? oTotalBasicRow[`v${iVendor}FinalPrice`]    : 0) || 0;
    const fTotalBasicNeg = parseFloat(oTotalBasicRow ? oTotalBasicRow[`v${iVendor}NegPriceTotal`] : 0) || 0;

    // Check if this vendor has split qty (multi-vendor only)
    const bMultiVendor = this._vendors.length > 1;
    const aPRNodes = aTreeData.filter(n => n.NodeType === "PR");
    const bHasSplitQty = !bMultiVendor || aPRNodes.some(n =>
      (n.children || []).some(i => i.NodeType === "ITEM" && parseFloat(i[`v${iVendor}SplitQty`]) > 0)
    );

    if (oCtxObj.Label === "P & F Charges (%)") {
      const fPct = parseFloat(oEvent.getParameter("value").replace("%", "")) || 0;
      oCtxObj[`v${iVendor}NegPrice`] = fPct + "%";
      oCtxObj[`v${iVendor}FinalPrice`] = bHasSplitQty ? fBasic * fPct / 100 : 0;
      oCtxObj[`v${iVendor}NegPriceTotal`] = fNegBasic * fPct / 100;
      oEvent.getSource().setValue(fPct + "%");
    } else if (oCtxObj.Label === "GST (%)") {
      const fPct = parseFloat(oEvent.getParameter("value").replace("%", "")) || 0;
      oCtxObj[`v${iVendor}NegPrice`] = fPct + "%";
      oCtxObj[`v${iVendor}FinalPrice`] = bHasSplitQty ? fTotalBasic * fPct / 100 : 0;
      oCtxObj[`v${iVendor}NegPriceTotal`] = fTotalBasicNeg * fPct / 100;
      oEvent.getSource().setValue(fPct + "%");
    } else if (oCtxObj.Label === "Commercial Loading") {
      oCtxObj[`v${iVendor}NegPrice`] = fPrice;
      oCtxObj[`v${iVendor}NegPriceTotal`] = fPrice;
    } else {
      oCtxObj[`v${iVendor}NegPrice`] = fPrice;
      oCtxObj[`v${iVendor}FinalPrice`] = bHasSplitQty ? fPrice : 0;
      oCtxObj[`v${iVendor}NegPriceTotal`] = fPrice;
    }

    // Recalculate Total Basic after any charge changes
    this._updateTotalBasic(aTreeData, iVendor);
    this._updateTotalBasicNegPriceTotal(aTreeData, iVendor);
    // Recalculate GST on updated Total Basic (if current row is not GST itself)
    if (oCtxObj.Label !== "GST (%)") {
      const oGstRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "GST (%)");
      if (oGstRow) {
        const fNewTotalBasic    = parseFloat(aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic")[`v${iVendor}FinalPrice`]) || 0;
        const fNewTotalBasicNeg = parseFloat(aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic")[`v${iVendor}NegPriceTotal`]) || 0;
        const fGstPct = parseFloat((oGstRow[`v${iVendor}NegPrice`] || "0").toString().replace("%", "")) || 0;
        oGstRow[`v${iVendor}FinalPrice`]    = fNewTotalBasic    * fGstPct / 100;
        oGstRow[`v${iVendor}NegPriceTotal`] = fNewTotalBasicNeg * fGstPct / 100;
      }
    }

    this._updateNetLandedCost(aTreeData, iVendor);
    this._updateNegNetLandedCost(aTreeData, iVendor);
    this._updateNegPriceTotalForNetLanded(aTreeData, iVendor);
    this._updateTotalAmtWithCommLoading(aTreeData, iVendor);
    this._calculateCommercialRating(aTreeData);
    oCtx.getModel().refresh();
  }
}


// _onPriceChange: function (iVendor, sType, oEvent) {
//   const oCtx = oEvent.getSource().getBindingContext("view");
//   const oCtxObj = oCtx.getObject();

//   if (oCtxObj.NodeType !== "ITEM") {
//     return;
//   }

//   const fPrice = parseFloat(oEvent.getParameter("value")) || 0;
  
//   if (sType === "Neg") {
//     const fQty = parseFloat(oCtxObj.Qty) || 0;
//     oCtxObj[`v${iVendor}FinalPrice`] = fPrice * fQty;
//     oCtx.getModel().refresh();
//   }
// }
,


    /* ================= FRAGMENT LOADER ================= */

    _openVH: function (sName) {
      if (!this[sName]) {
        Fragment.load({
          name: sName,
          controller: this
        }).then(oFrag => {
          this.getView().addDependent(oFrag);
          this[sName] = oFrag;
          oFrag.open();
        });
      } else {
        this[sName].open();
      }
    },

    _populateSummaryDefaults: function () {
  var oVM = this.getView().getModel("view");
  var aTreeData = oVM.getProperty("/TreeData") || [];

  var oDeliveryRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Delivery Date");
  var oPaymentRow  = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Payment Terms");

  this._vendors.forEach(function (v) {
    if (oDeliveryRow) {
      var sFormattedDate = "";
      if (v.deliveryDate) {
        // Handle OData DateTime string "/Date(ms)/" or JS Date object
        var oDate;
        if (v.deliveryDate instanceof Date) {
          oDate = v.deliveryDate;
        } else if (typeof v.deliveryDate === "string" && v.deliveryDate.indexOf("/Date(") !== -1) {
          var ms = parseInt(v.deliveryDate.replace(/\/Date\((\d+)\)\//, "$1"), 10);
          oDate = new Date(ms);
        } else {
          oDate = new Date(v.deliveryDate);
        }
        if (oDate && !isNaN(oDate.getTime())) {
          var sDay   = String(oDate.getDate()).padStart(2, "0");
          var sMon   = String(oDate.getMonth() + 1).padStart(2, "0");
          sFormattedDate = sDay + "." + sMon + "." + oDate.getFullYear();
        }
      }
      oDeliveryRow["v" + v.VendorIndex + "SingleValue"] = sFormattedDate;
    }
    if (oPaymentRow) {
      oPaymentRow["v" + v.VendorIndex + "SingleValue"] = v.paymentTermsDesc || v.paymentTerms || "";
    }
  });

  oVM.refresh();
},

_findParentItem: function (oChildObj) {
  const oVM = this.getView().getModel("view");
  const aTreeData = oVM.getProperty("/TreeData") || [];
  
  for (let oPR of aTreeData) {
    if (oPR.NodeType === "PR" && oPR.children) {
      for (let oItem of oPR.children) {
        if (oItem.children && oItem.children.includes(oChildObj)) {
          return oItem;
        }
      }
    }
  }
  return null;
},

_recalculateSummaries: function (aPRNodes) {
  const oVM = this.getView().getModel("view");
  const aTreeData = oVM.getProperty("/TreeData") || [];

  const oRows = {};
  ["Basic Amount Total", "P & F Charges (%)", "Freight (Rs)", "Insurance", "Total Basic", "GST (%)", "Commercial Loading"].forEach(label => {
    oRows[label] = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === label);
  });

  this._vendors.forEach(v => {
    const bMultiVendor = this._vendors.length > 1;

    const bIsIceVendor = v.vendorIceFlag === "X";

    // Check if this vendor has ANY split qty across all items
    // ICE vendors always calculate using full qty (no split qty required)
    let bHasSplitQty = false;
    if (!bMultiVendor || bIsIceVendor) {
      bHasSplitQty = true;
    } else {
      aPRNodes.forEach(node => {
        (node.children || []).forEach(item => {
          if (item.NodeType !== "ITEM") return;
          if (parseFloat(item[`v${v.VendorIndex}SplitQty`]) > 0) bHasSplitQty = true;
        });
      });
    }

    // Basic Amount Total = sum of all ITEM FinalPrices
    let fBasic = 0;
    let fBasicSplit = 0;
    aPRNodes.forEach(node => {
      (node.children || []).forEach(item => {
        if (item.NodeType !== "ITEM") return;
        fBasic += parseFloat(item[`v${v.VendorIndex}FinalPrice`]) || 0;
        if (bHasSplitQty) {
          fBasicSplit += parseFloat(item[`v${v.VendorIndex}FinalPrice`]) || 0;
        }
      });
    });
    if (oRows["Basic Amount Total"]) {
      oRows["Basic Amount Total"][`v${v.VendorIndex}FinalPrice`]        = bHasSplitQty ? fBasic : 0;
      oRows["Basic Amount Total"][`v${v.VendorIndex}FinalPriceDisplay`] = bHasSplitQty ? fBasicSplit : 0;
    }

    if (oRows["P & F Charges (%)"]) {
      const fPf = parseFloat((oRows["P & F Charges (%)"][`v${v.VendorIndex}NegPrice`] || "0").toString().replace("%", "")) || 0;
      oRows["P & F Charges (%)"][`v${v.VendorIndex}FinalPrice`] = bHasSplitQty ? fBasic * fPf / 100 : 0;
      oRows["P & F Charges (%)"][`v${v.VendorIndex}FinalPriceDisplay`] = bHasSplitQty ? fBasicSplit * fPf / 100 : 0;
    }
    if (oRows["Freight (Rs)"]) {
      const fFreight = parseFloat(oRows["Freight (Rs)"][`v${v.VendorIndex}NegPrice`] || 0) || 0;
      oRows["Freight (Rs)"][`v${v.VendorIndex}FinalPrice`] = bHasSplitQty ? fFreight : 0;
      oRows["Freight (Rs)"][`v${v.VendorIndex}FinalPriceDisplay`] = bHasSplitQty ? fFreight : 0;
    }
    if (oRows["Insurance"]) {
      const fIns = parseFloat(oRows["Insurance"][`v${v.VendorIndex}NegPrice`] || 0) || 0;
      oRows["Insurance"][`v${v.VendorIndex}FinalPrice`] = bHasSplitQty ? fIns : 0;
      oRows["Insurance"][`v${v.VendorIndex}FinalPriceDisplay`] = bHasSplitQty ? fIns : 0;
    }

    // Total Basic = Basic + P&F + Freight + Insurance
    this._updateTotalBasic(aTreeData, v.VendorIndex);
    this._updateTotalBasicDisplay(aTreeData, v.VendorIndex);

    // GST % applied on Total Basic
    if (oRows["GST (%)"]) {
      const fTotalBasic = parseFloat(aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic")[`v${v.VendorIndex}FinalPrice`]) || 0;
      const fGst = parseFloat((oRows["GST (%)"][`v${v.VendorIndex}NegPrice`] || "0").toString().replace("%", "")) || 0;
      oRows["GST (%)"][`v${v.VendorIndex}FinalPrice`] = fTotalBasic * fGst / 100;
      const fTotalBasicDisp = bHasSplitQty ? (parseFloat(aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic")[`v${v.VendorIndex}FinalPriceDisplay`]) || 0) : 0;
      oRows["GST (%)"][`v${v.VendorIndex}FinalPriceDisplay`] = fTotalBasicDisp * fGst / 100;
    }
    if (oRows["Commercial Loading"]) {
      const fCL = parseFloat(oRows["Commercial Loading"][`v${v.VendorIndex}NegPrice`] || 0) || 0;
      // Commercial Loading only affects NegPriceTotal, not FinalPrice (Finalized column)
      oRows["Commercial Loading"][`v${v.VendorIndex}NegPriceTotal`] = fCL;
    }

    this._updateNetLandedCost(aTreeData, v.VendorIndex);
    this._updateTotalAmtWithCommLoading(aTreeData, v.VendorIndex);

    // NegPriceTotal at item level = NegPrice × full Qty
    aPRNodes.forEach(node => {
      (node.children || []).forEach(item => {
        if (item.NodeType !== "ITEM") return;
        item[`v${v.VendorIndex}NegPriceTotal`] = (parseFloat(item[`v${v.VendorIndex}NegPrice`]) || 0) * (parseFloat(item.Qty) || 0);
      });
    });

    // NegBasicAmt = sum of NegPrice × Qty for all items
    let fNegBasic = 0;
    aPRNodes.forEach(node => {
      (node.children || []).forEach(item => {
        if (item.NodeType !== "ITEM") return;
        fNegBasic += (parseFloat(item[`v${v.VendorIndex}NegPrice`]) || 0) * (parseFloat(item.Qty) || 0);
      });
    });
    if (oRows["Basic Amount Total"]) {
      oRows["Basic Amount Total"][`v${v.VendorIndex}NegBasicAmt`] = fNegBasic;
      oRows["Basic Amount Total"][`v${v.VendorIndex}NegPriceTotal`] = fNegBasic;
    }

    // NegPriceTotal for P&F, Freight, Insurance
    if (oRows["P & F Charges (%)"]) {
      const fPf = parseFloat((oRows["P & F Charges (%)"][`v${v.VendorIndex}NegPrice`] || "0").toString().replace("%", "")) || 0;
      oRows["P & F Charges (%)"][`v${v.VendorIndex}NegPriceTotal`] = fNegBasic * fPf / 100;
    }
    if (oRows["Freight (Rs)"]) {
      const fFreight = parseFloat(oRows["Freight (Rs)"][`v${v.VendorIndex}NegPrice`] || 0) || 0;
      oRows["Freight (Rs)"][`v${v.VendorIndex}NegPriceTotal`] = fFreight;
    }
    if (oRows["Insurance"]) {
      const fIns = parseFloat(oRows["Insurance"][`v${v.VendorIndex}NegPrice`] || 0) || 0;
      oRows["Insurance"][`v${v.VendorIndex}NegPriceTotal`] = fIns;
    }

    // Total Basic NegPriceTotal = NegBasic + P&F + Freight + Insurance
    this._updateTotalBasicNegPriceTotal(aTreeData, v.VendorIndex);

    // GST NegPriceTotal = TotalBasicNegPriceTotal × GST%
    if (oRows["GST (%)"]) {
      const oTotalBasicRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic");
      const fTotalBasicNeg = parseFloat(oTotalBasicRow ? oTotalBasicRow[`v${v.VendorIndex}NegPriceTotal`] : 0) || 0;
      const fGst = parseFloat((oRows["GST (%)"][`v${v.VendorIndex}NegPrice`] || "0").toString().replace("%", "")) || 0;
      oRows["GST (%)"][`v${v.VendorIndex}NegPriceTotal`] = fTotalBasicNeg * fGst / 100;
    }

    this._updateNegNetLandedCost(aTreeData, v.VendorIndex);
    this._updateNegPriceTotalForNetLanded(aTreeData, v.VendorIndex);
  });

  this._calculateCommercialRating(aTreeData);
},



_updateTotalBasic: function (aTreeData, iVendor) {
  const oTotalBasicRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic");
  if (!oTotalBasicRow) return;

  // In multi-vendor, only calculate if this vendor has split qty (ICE vendors always calculate)
  const bMultiVendor = this._vendors.length > 1;
  const oVendor = this._vendors.find(v => v.VendorIndex === iVendor);
  const bIsIce = oVendor && oVendor.vendorIceFlag === "X";
  if (bMultiVendor && !bIsIce) {
    const aPRNodes = aTreeData.filter(n => n.NodeType === "PR");
    const bHasSplit = aPRNodes.some(n => (n.children || []).some(i => i.NodeType === "ITEM" && parseFloat(i[`v${iVendor}SplitQty`]) > 0));
    if (!bHasSplit) {
      oTotalBasicRow[`v${iVendor}FinalPrice`] = 0;
      return;
    }
  }

  const aLabels = ["Basic Amount Total", "P & F Charges (%)", "Freight (Rs)", "Insurance"];
  let fTotal = 0;
  aLabels.forEach(label => {
    const oRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === label);
    if (oRow) fTotal += parseFloat(oRow[`v${iVendor}FinalPrice`]) || 0;
  });
  oTotalBasicRow[`v${iVendor}FinalPrice`] = fTotal;
},

_updateTotalBasicDisplay: function (aTreeData, iVendor) {
  const oTotalBasicRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic");
  if (!oTotalBasicRow) return;
  const aLabels = ["Basic Amount Total", "P & F Charges (%)", "Freight (Rs)", "Insurance"];
  let fTotal = 0;
  aLabels.forEach(label => {
    const oRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === label);
    if (oRow) fTotal += parseFloat(oRow[`v${iVendor}FinalPriceDisplay`]) || 0;
  });
  oTotalBasicRow[`v${iVendor}FinalPriceDisplay`] = fTotal;
},

_updateTotalBasicNegPriceTotal: function (aTreeData, iVendor) {
  const oTotalBasicRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic");
  if (!oTotalBasicRow) return;
  const aLabels = ["Basic Amount Total", "P & F Charges (%)", "Freight (Rs)", "Insurance"];
  let fTotal = 0;
  aLabels.forEach(label => {
    const oRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === label);
    if (oRow) fTotal += parseFloat(oRow[`v${iVendor}NegPriceTotal`]) || 0;
  });
  oTotalBasicRow[`v${iVendor}NegPriceTotal`] = fTotal;
},

_updateTotalAmtWithCommLoading: function (aTreeData, iVendor) {
  const oTotalCommRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Amt with Comm. Loading");
  if (!oTotalCommRow) return;
  const oNetLandedRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Net Landed Cost (Rs)");
  const oCommLoadRow  = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Commercial Loading");
  const fNetLanded    = parseFloat(oNetLandedRow ? oNetLandedRow[`v${iVendor}FinalPrice`]    : 0) || 0;
  const fNetLandedNeg = parseFloat(oNetLandedRow ? oNetLandedRow[`v${iVendor}NegPriceTotal`] : 0) || 0;
  const fCommLoad     = parseFloat(oCommLoadRow  ? oCommLoadRow[`v${iVendor}NegPrice`]       : 0) || 0;
  // FinalPrice must be 0 so nothing shows in the Finalized column
  oTotalCommRow[`v${iVendor}FinalPrice`]    = 0;
  // NegPriceTotal (Negotiated Price Total column) = Net Landed (neg) + Comm Loading
  oTotalCommRow[`v${iVendor}NegPriceTotal`] = fNetLandedNeg + fCommLoad;
  oTotalCommRow[`v${iVendor}TotalAmtCommLoad`] = fNetLandedNeg + fCommLoad;
},

_updateNetLandedCost: function (aTreeData, iVendor) {
  const oNetLandedRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Net Landed Cost (Rs)");
  if (!oNetLandedRow) return;

  // In multi-vendor, only calculate if this vendor has split qty (ICE vendors always calculate)
  const bMultiVendor = this._vendors.length > 1;
  const oVendor = this._vendors.find(v => v.VendorIndex === iVendor);
  const bIsIce = oVendor && oVendor.vendorIceFlag === "X";
  if (bMultiVendor && !bIsIce) {
    const aPRNodes = aTreeData.filter(n => n.NodeType === "PR");
    const bHasSplit = aPRNodes.some(n => (n.children || []).some(i => i.NodeType === "ITEM" && parseFloat(i[`v${iVendor}SplitQty`]) > 0));
    if (!bHasSplit) {
      oNetLandedRow[`v${iVendor}FinalPrice`]        = 0;
      oNetLandedRow[`v${iVendor}FinalPriceDisplay`] = 0;
      return;
    }
  }

  const aLabels = ["Total Basic", "GST (%)"];
  let fTotal = 0;
  let fTotalDisp = 0;
  aLabels.forEach(label => {
    const oRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === label);
    if (oRow) {
      fTotal     += parseFloat(oRow[`v${iVendor}FinalPrice`])        || 0;
      fTotalDisp += parseFloat(oRow[`v${iVendor}FinalPriceDisplay`]) || 0;
    }
  });
  oNetLandedRow[`v${iVendor}FinalPrice`]        = fTotal;
  oNetLandedRow[`v${iVendor}FinalPriceDisplay`] = fTotalDisp;
},

_updateNegNetLandedCost: function (aTreeData, iVendor) {
  const oNetLandedRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Net Landed Cost (Rs)");
  if (!oNetLandedRow) return;

  // NegNetLanded = Total Basic (neg) + GST (neg)
  const oTotalBasicRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Total Basic");
  const oGstRow        = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "GST (%)");

  const fTotalBasicNeg = parseFloat(oTotalBasicRow ? oTotalBasicRow[`v${iVendor}NegPriceTotal`] : 0) || 0;
  const fGstPct        = parseFloat((oGstRow ? (oGstRow[`v${iVendor}NegPrice`] || "0") : "0").toString().replace("%", "")) || 0;
  const fGstNeg        = fTotalBasicNeg * fGstPct / 100;

  oNetLandedRow[`v${iVendor}NegNetLanded`] = fTotalBasicNeg + fGstNeg;
},

_updateNegPriceTotalForNetLanded: function (aTreeData, iVendor) {
  const oNetLandedRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Net Landed Cost (Rs)");
  if (!oNetLandedRow) return;

  // NegPriceTotal for Net Landed = Total Basic + GST
  const aLabels = ["Total Basic", "GST (%)"];
  let fTotal = 0;
  aLabels.forEach(label => {
    const oRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === label);
    if (oRow) fTotal += parseFloat(oRow[`v${iVendor}NegPriceTotal`]) || 0;
  });
  oNetLandedRow[`v${iVendor}NegPriceTotal`] = fTotal;
},

_calculateCommercialRating: function (aTreeData) {
  const oNetLandedRow = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Net Landed Cost (Rs)");
  const oRatingRow   = aTreeData.find(r => r.NodeType === "SUMMARY" && r.Label === "Commercial Rating");
  if (!oNetLandedRow || !oRatingRow) return;

  // Rank by NegPriceTotal of Net Landed Cost (Neg. Price Total column) in ascending order
  const aRankable = this._vendors
    .map(v => ({ idx: v.VendorIndex, val: parseFloat(oNetLandedRow[`v${v.VendorIndex}NegPriceTotal`]) || 0 }))
    .filter(o => o.val > 0)
    .sort((a, b) => a.val - b.val);

  // Clear all ratings first
  this._vendors.forEach(v => { oRatingRow[`v${v.VendorIndex}SingleValue`] = ""; });

  // Assign L1, L2 ... Ln
  aRankable.forEach((o, i) => { oRatingRow[`v${o.idx}SingleValue`] = "L" + (i + 1); });
},



onBackNavigate: function () {
  var oVM = this.getView().getModel("view");
  var sNfaRefNo = oVM.getProperty("/nfaRefNo") || "";
  var bApproved = oVM.getProperty("/isApprovedMode") || false;
  var bDocEdit  = oVM.getProperty("/isDocEditMode") || false;
  var that = this;

  var fnNavigate = function () {
    that.getOwnerComponent().getRouter().navTo("RoutenfaCreate", {
      mode: bApproved ? "approved" : (bDocEdit ? "docEdit" : "view"),
      docNo: sNfaRefNo,
      "?query": { fromQCS: "true" }
    }, true);
  };

  if (that._bDirty) {
    MessageBox.confirm("You have unsaved changes. Save as draft before leaving?", {
      actions: ["Save Draft", "Leave", MessageBox.Action.CANCEL],
      emphasizedAction: "Save Draft",
      onClose: function (sAction) {
        if (sAction === "Save Draft") {
          that._saveAsDraft(function () {
            that._openDraftFormDialog(fnNavigate);
          });
        } else if (sAction === "Leave") {
          that._bDirty = false;
          fnNavigate();
        }
      }
    });
  } else {
    fnNavigate();
  }
},

onToggleEdit: function () {
  var oVM = this.getView().getModel("view");
  var bEditable = oVM.getProperty("/editable");
  oVM.setProperty("/editable", !bEditable);
},

onSave: function () {
  var oVM = this.getView().getModel("view");
  var bDocEdit = oVM.getProperty("/isDocEditMode");
  var that = this;

  // if (bDocEdit) {
  //   var sNfaRefNo = oVM.getProperty("/nfaRefNo") || "";

  //   // Build dialog with input field for Reason for Amendment
  //   var oReasonInput = new sap.m.Input({
  //     placeholder: "Enter reason for amendment (max 255 chars)",
  //     maxLength: 255,
  //     width: "100%",
  //     value: oVM.getProperty("/ReasonForAmendment") || ""
  //   });

  //   var oDialog = new sap.m.Dialog({
  //     title: "Confirm Save – DocEdit Mode",
  //     type: "Message",
  //     content: [
  //       new sap.m.VBox({
  //         items: [
  //           new sap.m.Text({ text: "NFA Ref No: " + sNfaRefNo }).addStyleClass("sapUiSmallMarginBottom"),
  //           new sap.m.Label({ text: "Reason for Amendment", required: true }),
  //           oReasonInput
  //         ]
  //       }).addStyleClass("sapUiSmallMargin")
  //     ],
  //     beginButton: new sap.m.Button({
  //       text: "Confirm",
  //       type: "Emphasized",
  //       press: function () {
  //         var sReason = (oReasonInput.getValue() || "").trim();
  //         if (!sReason) {
  //           oReasonInput.setValueState("Error");
  //           oReasonInput.setValueStateText("Reason for Amendment is mandatory.");
  //           return;
  //         }
  //         if (sReason.length > 255) {
  //           oReasonInput.setValueState("Error");
  //           oReasonInput.setValueStateText("Maximum 255 characters allowed.");
  //           return;
  //         }
  //         oReasonInput.setValueState("None");
  //         oVM.setProperty("/ReasonForAmendment", sReason);
  //         oDialog.close();
  //         sap.ui.core.BusyIndicator.show(0);
  //         setTimeout(function () {
  //           that._saveAsDraft(function () {
  //             that._openDraftFormDialog(null, true);
  //           });
  //         }, 100);
  //       }
  //     }),
  //     endButton: new sap.m.Button({
  //       text: "Cancel",
  //       press: function () { oDialog.close(); }
  //     }),
  //     afterClose: function () { oDialog.destroy(); }
  //   });

  //   this.getView().addDependent(oDialog);
  //   oDialog.open();
  //   return;
  // }

  sap.ui.core.BusyIndicator.show(0);
  setTimeout(function () {
    that._saveAsDraft(function () {
      that._openDraftFormDialog(null, true);
    });
  }, 100);
},

_openDraftFormDialog: function (fnCallback, bRefreshLpp) {
  var that = this;
  this._draftFormCallback = fnCallback || function () {
    var oVM = that.getView().getModel("view");
    oVM.setProperty("/submitEnabled", true);
    oVM.setProperty("/editable", false);
    sap.m.MessageToast.show("Draft saved successfully.");
    that._reloadSummaryData();
    // Refresh version from et_nfa_detailsSet after save
    var sNfaRefNoForVersion = that._getNfaRefNo();
    if (sNfaRefNoForVersion) {
      that.getOwnerComponent().getModel().read("/et_nfa_detailsSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNoForVersion)],
        forceServerDataRequest: true,
        success: function (oData) {
          var o = (oData.results || [])[0];
          if (o) { oVM.setProperty("/nfaVersion", parseInt(o.Version) || null); }
        }
      });
    }
  };

  if (!this._oDraftFormModel) {
    this._oDraftFormModel = new JSONModel();
  }

  var sNfaRefNo = this._getNfaRefNo();
  var oModel = this.getOwnerComponent().getModel();

  var aAllowedKeys = [
    "Discipline", "PoType", "VendorAssessment", "VendorName",
    "Currency", "BudgetedAmount", "WbsAmount", "PoAmount", "LppAmount", "IceAmount",
    "GstAmount", "TotalBasic", "NetImpact", "PrevPoAmt", "OrginalPoAmt",
    "ContractEffDate", "ContractDelivDate", "MobilizationDate",
    "ImpactOnSchedule", "ImpactRemarks", "WbsInfo",
    "Incoterm", "IncotermDesc", "DeviationOnCommTerms",
    "SpecialCommTerms", "Recommendation", "AdditionalInfo", "AmendedReason"
  ];

  var aTreeData = that.getView().getModel("view").getProperty("/TreeData") || [];
  var aPRNodesForVendor = aTreeData.filter(function (n) { return n.NodeType === "PR"; });
  var aVendorsWithSplit = that._vendors.filter(function (v) {
    return aPRNodesForVendor.some(function (pr) {
      return (pr.children || []).some(function (item) {
        return item.NodeType === "ITEM" && parseFloat(item["v" + v.VendorIndex + "SplitQty"]) > 0;
      });
    });
  });
  var aVendorNameSource = aVendorsWithSplit.length ? aVendorsWithSplit : that._vendors;
  var sAutoVendorName = aVendorNameSource.map(function (v) { return v.VendorName; }).filter(Boolean).join(", ");

  // Build vendor assessment: each vendor on a separate line as "VendorName – QualifScore"
  var sAutoVendorAssessment = that._vendors.map(function (v) {
    var sName = v.VendorName || "";
    var sScore = v.qualifScore || "";
    return sName + " \u2013 " + sScore;
  }).filter(Boolean).join("\n");

  // Calculate PO Amount = sum of all NON-ICE vendors' Net Landed Cost
  // ICE vendor Net Landed Cost goes separately into IceAmount
  var oNetLandedRow = aTreeData.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Net Landed Cost (Rs)"; });
  var oGstSummaryRow = aTreeData.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "GST (%)"; });
  var oTotalBasicSummaryRow = aTreeData.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Total Basic"; });
  var fPoAmount = 0;
  var fGstAmount = 0;
  var fTotalBasicAmount = 0;
  var fIceAmount = 0;
  if (oNetLandedRow) {
    that._vendors.forEach(function (v) {
      var fVal = parseFloat(oNetLandedRow["v" + v.VendorIndex + "FinalPrice"] || 0) || 0;
      if (v.vendorIceFlag === "X") {
        fIceAmount += fVal;
      } else {
        fPoAmount += fVal;
      }
    });
  }
  if (oGstSummaryRow) {
    aVendorsWithSplit.forEach(function (v) {
      if (v.vendorIceFlag === "X") return;
      fGstAmount += parseFloat(oGstSummaryRow["v" + v.VendorIndex + "FinalPrice"] || 0) || 0;
    });
  }
  if (oTotalBasicSummaryRow) {
    aVendorsWithSplit.forEach(function (v) {
      if (v.vendorIceFlag === "X") return;
      fTotalBasicAmount += parseFloat(oTotalBasicSummaryRow["v" + v.VendorIndex + "FinalPrice"] || 0) || 0;
    });
  }

  // Calculate LPP Amount = sum of all items' TotalLpp
  var fLppAmount = 0;
  aTreeData.filter(function (n) { return n.NodeType === "PR"; }).forEach(function (prNode) {
    (prNode.children || []).forEach(function (item) {
      fLppAmount += parseFloat(item.TotalLpp || 0) || 0;
    });
  });

  // Derive CDD from L1 vendor's delivery date in the QCS tree
  var sAutoCDD = "";
  var oDeliverySummaryRow = aTreeData.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Delivery Date"; });
  var oRatingSummaryRow   = aTreeData.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Commercial Rating"; });
  if (oDeliverySummaryRow) {
    // Prefer L1 vendor's delivery date
    var oL1Vendor = that._vendors.find(function (v) {
      return oRatingSummaryRow && oRatingSummaryRow["v" + v.VendorIndex + "SingleValue"] === "L1";
    });
    if (oL1Vendor) {
      sAutoCDD = oDeliverySummaryRow["v" + oL1Vendor.VendorIndex + "SingleValue"] || "";
    }
    // Fallback: first vendor with a date
    if (!sAutoCDD) {
      that._vendors.forEach(function (v) {
        if (!sAutoCDD) {
          sAutoCDD = oDeliverySummaryRow["v" + v.VendorIndex + "SingleValue"] || "";
        }
      });
    }
  }

  var fnOpenDialog = function (oData, bEditable, sNfaCurrency, sNfaIncoterm, sNfaPrBudget) {
    var aVendorOptions = aVendorNameSource.map(function (v) { return { name: v.VendorName }; });
    var oSafeDefaults = {
      Discipline: "", PoType: "", VendorAssessment: sAutoVendorAssessment, VendorName: sAutoVendorName,
      vendorOptions: aVendorOptions,
      Currency: sNfaCurrency || "", BudgetedAmount: sNfaPrBudget || "", WbsAmount: "",
      PoAmount: fPoAmount > 0 ? fPoAmount.toFixed(3) : "",
      LppAmount: fLppAmount > 0 ? fLppAmount.toFixed(3) : "",
      IceAmount: fIceAmount > 0 ? fIceAmount.toFixed(3) : "",
      GstAmount: fGstAmount > 0 ? fGstAmount.toFixed(3) : "",
      TotalBasic: fTotalBasicAmount > 0 ? fTotalBasicAmount.toFixed(3) : "",
      TotalBasicAmount: fTotalBasicAmount > 0 ? fTotalBasicAmount.toFixed(3) : "",
      NetImpact: "", PrevPoAmt: "", OrginalPoAmt: "",
      ContractEffDate: "", ContractDelivDate: sAutoCDD, MobilizationDate: "",
      ImpactOnSchedule: "", ImpactRemarks: "", WbsInfo: "",
      Incoterm: sNfaIncoterm || "", IncotermDesc: "", DeviationOnCommTerms: "",
      SpecialCommTerms: "", Recommendation: "", AdditionalInfo: "",
      AmendedReason: that.getView().getModel("view").getProperty("/ReasonForAmendment") || "",
      isDocEditMode: that.getView().getModel("view").getProperty("/isDocEditMode") || false,
      formEditable: bEditable,
      isExisting: !bEditable
    };
    if (oData) {
      aAllowedKeys.forEach(function (sKey) {
        if (Object.prototype.hasOwnProperty.call(oData, sKey)) {
          oSafeDefaults[sKey] = String(oData[sKey] || "");
        }
      });
      // Always use QCS-derived vendor name (description only, no vendor code)
      oSafeDefaults.VendorName = sAutoVendorName || oSafeDefaults.VendorName;
      oSafeDefaults.VendorAssessment = sAutoVendorAssessment;
      // Map backend field DeviationComments → frontend model property DeviationOnCommTerms
      if (oData.DeviationComments) oSafeDefaults.DeviationOnCommTerms = String(oData.DeviationComments);
      if (!oSafeDefaults.Currency && sNfaCurrency) oSafeDefaults.Currency = sNfaCurrency;
      if (!oSafeDefaults.Incoterm && sNfaIncoterm) oSafeDefaults.Incoterm = sNfaIncoterm;
      // If backend has no CDD saved, auto-populate from QCS Delivery Date row
      if (!oSafeDefaults.ContractDelivDate && sAutoCDD) oSafeDefaults.ContractDelivDate = sAutoCDD;
      // BudgetedAmount and WbsAmount always come from et_approval_formSet (backend-calculated)
      if (oData.BudgetedAmount) oSafeDefaults.BudgetedAmount = String(oData.BudgetedAmount);
      if (oData.WbsAmount) oSafeDefaults.WbsAmount = String(oData.WbsAmount);
      // Always override computed amounts
      if (fPoAmount > 0) oSafeDefaults.PoAmount = fPoAmount.toFixed(3);
      if (fLppAmount > 0) oSafeDefaults.LppAmount = fLppAmount.toFixed(3);
      if (fIceAmount > 0) oSafeDefaults.IceAmount = fIceAmount.toFixed(3);
      if (fGstAmount > 0) { oSafeDefaults.GstAmount = fGstAmount.toFixed(3); }
      if (fTotalBasicAmount > 0) { oSafeDefaults.TotalBasic = fTotalBasicAmount.toFixed(3); oSafeDefaults.TotalBasicAmount = fTotalBasicAmount.toFixed(3); }
    }
    that._oDraftFormModel.setData(oSafeDefaults);

    var fnShow = function (oDialog) {
      oDialog.setModel(that._oDraftFormModel, "draftForm");
      sap.ui.core.BusyIndicator.hide();
      oDialog.open();
      if (bRefreshLpp) { that._refreshLppAmountFromApprovalForm(); }
      setTimeout(function () { that._refreshCharCounters(oDialog); }, 100);
    };

    if (that._oDraftFormDialog) {
      fnShow(that._oDraftFormDialog);
    } else {
      Fragment.load({
        id: that.getView().getId(),
        name: "com.df.nfa.creator_v2.view.fragments.NfaDraftForm",
        controller: that
      }).then(function (oDialog) {
        that._oDraftFormDialog = oDialog;
        that.getView().addDependent(oDialog);
        fnShow(oDialog);
      });
    }
  };

  // First fetch NFA details for Currency and Incoterm, then check approval form
  oModel.read("/et_nfa_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oNfaData) {
      var oNfa = (oNfaData.results || [])[0] || {};
      var sNfaCurrency = oNfa.Currency || "";
      var sNfaIncoterm = oNfa.Incoterm || "";
      var sNfaPrBudget = oNfa.PrBudget || "";

      oModel.read("/et_approval_formSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        forceServerDataRequest: true,
        success: function (oData) {
          var oRaw = (oData.results || [])[0];
          if (oRaw) {
            fnOpenDialog(JSON.parse(JSON.stringify(oRaw)), false, sNfaCurrency, sNfaIncoterm, sNfaPrBudget);
          } else {
            fnOpenDialog(null, true, sNfaCurrency, sNfaIncoterm, sNfaPrBudget);
          }
        },
        error: function () {
          fnOpenDialog(null, true, sNfaCurrency, sNfaIncoterm, sNfaPrBudget);
        }
      });
    },
    error: function () {
      // Fallback: open without NFA data
      oModel.read("/et_approval_formSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        forceServerDataRequest: true,
        success: function (oData) {
          var oRaw = (oData.results || [])[0];
          fnOpenDialog(oRaw ? JSON.parse(JSON.stringify(oRaw)) : null, !oRaw, "", "", "");
        },
        error: function () { fnOpenDialog(null, true, "", "", ""); }
      });
    }
  });
},

onOpenSummary: function () {
  var that = this;
  sap.ui.core.BusyIndicator.show(0);
  if (!this._oDraftFormModel) {
    this._oDraftFormModel = new JSONModel();
  }
  var fnOriginalSetData = this._oDraftFormModel.setData.bind(this._oDraftFormModel);
  this._oDraftFormModel.setData = function (oData) {
    oData.formEditable = false;
    oData.summaryMode = true;
    fnOriginalSetData(oData);
    that._oDraftFormModel.setData = fnOriginalSetData;
  };
  this._openDraftFormDialog(function () { /* read-only, no action */ });
},

onDraftFormEdit: function () {
  this._oDraftFormModel.setProperty("/formEditable", true);
  this._oDraftFormModel.setProperty("/isExisting", true);
  var that = this;
  setTimeout(function () { that._refreshCharCounters(that._oDraftFormDialog); }, 100);
},

onDraftFormConfirm: function () {
  var oData = this._oDraftFormModel.getData();
  var bIsDocEdit = this.getView().getModel("view").getProperty("/isDocEditMode") || false;
  if (!oData.Discipline || !oData.PoType || !oData.Currency || !oData.Incoterm) {
    MessageBox.error("Please fill in all required fields: Discipline, PO Type, Currency, and Incoterm.");
    return;
  }
  if (bIsDocEdit && !(oData.AmendedReason || "").trim()) {
    MessageBox.error("Reason for Amendment is mandatory.");
    return;
  }

  var sNfaRefNo = this._getNfaRefNo();
  var oModel = this.getOwnerComponent().getModel();
  var that = this;

  var oPayload = {
    NfaRefNo:          sNfaRefNo,
    VendorName:        oData.VendorName        || "",
    Discipline:        oData.Discipline        || "",
    PoType:            oData.PoType            || "",
    VendorAssessment:  oData.VendorAssessment  || "",
    Currency:          oData.Currency          || "",
    BudgetedAmount:    oData.BudgetedAmount     ? oData.BudgetedAmount.toString() : "0",
    WbsAmount:         oData.WbsAmount           ? oData.WbsAmount.toString()      : "0",
    CurrentPoAmt:          oData.PoAmount           ? oData.PoAmount.toString()       : "0",
    LppAmount:         oData.LppAmount          ? oData.LppAmount.toString()      : "0",
    IceAmount:         oData.IceAmount          ? oData.IceAmount.toString()      : "0",
    GstAmount:         oData.GstAmount          ? oData.GstAmount.toString()       : "0",
    TotalBasic:        oData.TotalBasic         ? oData.TotalBasic.toString()      : "0",
    NetImpact:         oData.NetImpact          ? oData.NetImpact.toString()       : "0",
    PrevPoAmt:         oData.PrevPoAmt          ? oData.PrevPoAmt.toString()       : "0",
    OrginalPoAmt:      oData.OrginalPoAmt       ? oData.OrginalPoAmt.toString()    : "0",
    ContractEffDate:   oData.ContractEffDate   || "",
    ContractDelivDate: oData.ContractDelivDate || "",
    MobilizationDate:  oData.MobilizationDate  || "",
    ImpactOnSchedule:  oData.ImpactOnSchedule  || "",
    ImpactRemarks:     oData.ImpactRemarks     || "",
    WbsInfo:           oData.WbsInfo           || "",
    Incoterm:          oData.Incoterm          || "",
    IncotermDesc:      "",
    DeviationComments: oData.DeviationOnCommTerms || "",
    SpecialCommTerms:  oData.SpecialCommTerms  || "",
    Recommendation:    oData.Recommendation   || "",
    AdditionalInfo:    oData.AdditionalInfo    || "",
    AmendedReason:     oData.AmendedReason     || ""
  };

  sap.ui.core.BusyIndicator.show(0);

  var fnSuccess = function () {
    that._oDraftFormDialog.close();
    that._draftFormCallback();
  };
  var fnError = function (oError) {
    sap.ui.core.BusyIndicator.hide();
    MessageBox.error("Failed to save approval form data.");
    console.error("et_approval_formSet error:", oError);
  };

  oModel.create("/et_approval_formSet", oPayload, { success: fnSuccess, error: fnError });
},

onDraftFormCancel: function () {
  this._oDraftFormDialog.close();
},

onCharCount: function (oEvent) {
  var oTA = oEvent.getSource();
  var sValue = oEvent.getParameter("value") || "";
  var iLen = sValue.length;
  var iMax = oTA.getMaxLength();
  var oVBox = oTA.getParent();
  var oCounter = oVBox.getItems()[1];
  oCounter.setText(iLen + "/" + iMax);
  if (iLen >= iMax) {
    oCounter.addStyleClass("nfaCharCounterExceeded");
  } else {
    oCounter.removeStyleClass("nfaCharCounterExceeded");
  }
},

_refreshCharCounters: function (oDialog) {
  // Find all VBox wrappers with char counters and sync them with current field values
  oDialog.findAggregatedObjects(true, function (oCtrl) {
    if (oCtrl.isA("sap.m.VBox") && oCtrl.hasStyleClass("nfaCharCountWrapper")) {
      var aItems = oCtrl.getItems();
      var oTA = aItems[0];
      var oCounter = aItems[1];
      if (oTA && oTA.isA("sap.m.TextArea") && oCounter && oCounter.isA("sap.m.Text")) {
        var iLen = (oTA.getValue() || "").length;
        var iMax = oTA.getMaxLength();
        oCounter.setText(iLen + "/" + iMax);
        if (iLen >= iMax) {
          oCounter.addStyleClass("nfaCharCounterExceeded");
        } else {
          oCounter.removeStyleClass("nfaCharCounterExceeded");
        }
      }
    }
  });
},

_saveAsDraft: function (fnCallback) {
  var oVM = this.getView().getModel("view");
  var aTreeData = oVM.getProperty("/TreeData") || [];
  var sNfaRefNo = this._getNfaRefNo();
  var oModel = this.getOwnerComponent().getModel();
  var that = this;

  if (!sNfaRefNo) {
    MessageBox.error("NFA Reference Number not found");
    return;
  }

  // Validate: split/ordered qty must not exceed remaining qty
  var aCurrentTree = oVM.getProperty("/TreeData") || [];
  var aPRNodesForDelivery = aCurrentTree.filter(function (n) { return n.NodeType === "PR"; });

  var aQtyErrors = [];
  aPRNodesForDelivery.forEach(function (prNode) {
    (prNode.children || []).forEach(function (item) {
      if (item.NodeType !== "ITEM") return;
      var fOriginalQty = parseFloat(item.Qty) || 0;
      // Check individual vendor split qty
      that._vendors.forEach(function (vendor) {
        var fSplitQty = parseFloat(item["v" + vendor.VendorIndex + "SplitQty"]) || 0;
        if (fSplitQty > fOriginalQty) {
          aQtyErrors.push("PR " + prNode.PrNumber + " / Item " + item.PrItem + " (" + (item.MaterialDesc || item.Material) + "): " +
            (vendor.VendorName || "Vendor " + vendor.VendorIndex) + " ordered qty (" + fSplitQty + ") exceeds item qty (" + fOriginalQty + ").");
        }
      });
      // Check total split qty across non-ICE vendors
      var fTotalSplit = 0;
      that._vendors.forEach(function (v) {
        if (v.vendorIceFlag === "X") return;
        fTotalSplit += parseFloat(item["v" + v.VendorIndex + "SplitQty"] || 0);
      });
      if (fTotalSplit > fOriginalQty) {
        aQtyErrors.push("PR " + prNode.PrNumber + " / Item " + item.PrItem + " (" + (item.MaterialDesc || item.Material) + "): Total ordered qty (" + fTotalSplit + ") exceeds item qty (" + fOriginalQty + ").");
      }
    });
  });

  if (aQtyErrors.length) {
    sap.ui.core.BusyIndicator.hide();
    MessageBox.error("Cannot save. Ordered quantity exceeds available quantity:\n\n" + aQtyErrors.join("\n"));
    return;
  }

  var oDeliveryRow = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Delivery Date"; });

  var aMissingDateVendors = that._vendors.filter(function (v) {
    var bHasSplitOrOrderedQty = aPRNodesForDelivery.some(function (pr) {
      return (pr.children || []).some(function (item) {
        return item.NodeType === "ITEM" && parseFloat(item["v" + v.VendorIndex + "SplitQty"]) > 0;
      });
    });
    if (!bHasSplitOrOrderedQty) return false;
    var sDisplayDate = oDeliveryRow ? (oDeliveryRow["v" + v.VendorIndex + "SingleValue"] || "") : "";
    return !sDisplayDate.trim();
  });

  if (aMissingDateVendors.length) {
    var sNames = aMissingDateVendors.map(function (v) { return v.VendorName || "Vendor " + v.VendorIndex; }).join(", ");
    sap.ui.core.BusyIndicator.hide();
    MessageBox.error("Delivery date is mandatory for: " + sNames);
    return;
  }

  var aPRNodes = aTreeData.filter(function (n) { return n.NodeType === "PR"; });

  // Validate: at least one PR with items must exist
  if (!aPRNodes.length) {
    sap.ui.core.BusyIndicator.hide();
    MessageBox.error("No PR items found. Please select a PR number and add items before saving.");
    return;
  }

  var bHasItems = aPRNodes.some(function (pr) { return (pr.children || []).length > 0; });
  if (!bHasItems) {
    sap.ui.core.BusyIndicator.hide();
    MessageBox.error("No line items found under the selected PR. Please add PR items before saving.");
    return;
  }

  var aUnassignedItems = [];
  aPRNodes.forEach(function (prNode) {
    (prNode.children || []).forEach(function (item) {
      if (item.NodeType !== "ITEM") return;
      var fQty = parseFloat(item.Qty) || 0;
      var fTotalSplit = 0;
      that._vendors.forEach(function (v) {
        if (v.vendorIceFlag === "X") return;
        fTotalSplit += parseFloat(item["v" + v.VendorIndex + "SplitQty"] || 0);
      });
      var fRemaining = fQty - fTotalSplit;
      if (fRemaining === fQty) {
        aUnassignedItems.push("PR " + prNode.PrNumber + " / Item " + item.PrItem + " (" + (item.MaterialDesc || item.Material) + ")");
      }
    });
  });
  if (aUnassignedItems.length) {
    sap.ui.core.BusyIndicator.hide();
    var iTotal = aUnassignedItems.length;
    var aDisplay = aUnassignedItems.slice(0, 10);
    var sSuffix = iTotal > 10 ? "\n...and " + (iTotal - 10) + " more item(s) have no ordered quantity assigned." : "";
    MessageBox.error("Ordered quantity not assigned for the following " + iTotal + " item(s):\n\n" + aDisplay.join("\n") + sSuffix);
    return;
  }

  // Build VENDOR_PR items — post ALL vendors for ALL items regardless of split qty
  var aVendorPRItems = [];
  aPRNodes.forEach(function (prNode) {
    (prNode.children || []).forEach(function (item) {
      if (item.NodeType !== "ITEM") return;
      that._vendors.forEach(function (vendor) {
        var fSplitQty = parseFloat(item["v" + vendor.VendorIndex + "SplitQty"]) || 0;
        aVendorPRItems.push({
          NfaRefNo: sNfaRefNo,
          Version: that._nfaDetails.Version || "",
          VendorNo: vendor.VendorNo || "",
          PrNo: prNode.PrNumber || "",
          PrItem: item.PrItem || "",
          Material: item.Material || "",
          MaterialDescription: item.MaterialDesc || "",
          Qty: parseFloat(item.Qty || 0).toFixed(3),
          Uom: item.UOM || "",
          Plant: item.Plant || "",
          PlantDescription: "",
          MaterialGroup: item.MaterialGroup || "",
          MaterialGroupDescription: "",
          PurchaseOrg: that._nfaDetails.PurchaseOrg || item.PurchaseOrg || "",
          PurchaseOrgDesc: that._nfaDetails.PurchaseOrgDesc || item.PurchaseOrgDesc || "",
          PurchaseGroup: that._nfaDetails.PurchaseGroup || item.PurchaseGroup || "",
          PurchaseGroupDesc: that._nfaDetails.PurchaseGroupDesc || item.PurchaseGroupDesc || "",
          RemainingQty: (function () {
            var fQty = parseFloat(item.Qty || 0);
            var fTotalSplit = 0;
            that._vendors.forEach(function (v) {
              if (v.vendorIceFlag === "X") return;
              fTotalSplit += parseFloat(item["v" + v.VendorIndex + "SplitQty"] || 0);
            });
            return (fQty - fTotalSplit).toFixed(3);
          }()),
          SplitPoQty: fSplitQty.toFixed(3),
          VendorIceFlag: vendor.vendorIceFlag || "",
          InitialPrice: parseFloat(item["v" + vendor.VendorIndex + "InitPrice"] || 0).toFixed(3),
          NegotiatedPrice: parseFloat(item["v" + vendor.VendorIndex + "NegPrice"] || 0).toFixed(3),
          UnitLpp: parseFloat(item.UnitLpp || item.Lpp || 0).toFixed(3),
          TotalLpp: parseFloat(item.TotalLpp || 0).toFixed(3),
          PrBudget: parseFloat(item.PrBudget || 0).toFixed(3),
          WbsElement: item.WbsElement || "",
          WbsBudget: parseFloat(item.WbsBudget || 0).toFixed(3),
          MaterialLongText: item.MaterialLongText || "",
          MaterialGroupDescription: item.MaterialGroupDescription || "",
          AribaDocNo: vendor.aribaDocNo || "",
          OldPO: that._nfaDetails.OldPO || "",
          FinilizedLinePrice: parseFloat(item["v" + vendor.VendorIndex + "FinalPrice"] || 0).toFixed(3),
          NegotiatedTotalValue: (parseFloat(item["v" + vendor.VendorIndex + "NegPrice"] || 0) * parseFloat(item.Qty || 0)).toFixed(3)
        });
      });
    });
  });

  var oPRPayload = { NfaRefNo: sNfaRefNo, Version: that._nfaDetails.Version || "", VENDOR_PR: aVendorPRItems };

  oModel.create("/et_vendor_pr_detailsSet", oPRPayload, {
    success: function (oData) {
      if (oData && oData.MessageType === "E") {
        sap.ui.core.BusyIndicator.hide();
        MessageBox.error(oData.MessageText || "Failed to save draft");
        return;
      }
      // Now update vendor item details with summary data
      that._postVendorItemSummary(sNfaRefNo, aTreeData, function () {
        that._bDirty = false;
        if (fnCallback) fnCallback();
      });
    },
    error: function (oError) {
      MessageBox.error("Failed to save draft");
      console.error(oError);
    }
  });
},

_postVendorItemSummary: function (sNfaRefNo, aTreeData, fnCallback) {
  var oModel = this.getOwnerComponent().getModel();
  var that = this;

  var aPRNodes = aTreeData.filter(function (n) { return n.NodeType === "PR"; });
  var bMultiVendor = this._vendors.length > 1;

  // Identify which vendors have SplitQty in current session (untouched = no SplitQty)
  var mHasSplit = {};
  that._vendors.forEach(function (vendor) {
    var bIsIce = vendor.vendorIceFlag === "X";
    if (!bMultiVendor || bIsIce) {
      mHasSplit[vendor.VendorNo] = true;
      return;
    }
    mHasSplit[vendor.VendorNo] = aPRNodes.some(function (pr) {
      return (pr.children || []).some(function (item) {
        return item.NodeType === "ITEM" && parseFloat(item["v" + vendor.VendorIndex + "SplitQty"]) > 0;
      });
    });
  });

  // Fetch existing backend values for untouched vendors to preserve their Neg fields
  oModel.read("/et_vendor_item_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oBackendData) {
      // Build a map: VendorNo → backend row
      var mBackend = {};
      (oBackendData.results || []).forEach(function (row) {
        mBackend[row.VendorNo] = row;
      });

      var aVendorItems = that._vendors.map(function (vendor) {
        var bHasSplit = mHasSplit[vendor.VendorNo];
        var oBackend  = mBackend[vendor.VendorNo] || {};

        var oItem = {
          NfaRefNo:         sNfaRefNo,
          Version:          that._nfaDetails.Version || "",
          VendorNo:         vendor.VendorNo || "",
          VendorName:       vendor.VendorName || "",
          Plant:            vendor.plant || "",
          Ta:               vendor.ta || "",
          VendorQa:         vendor.vendorQa || "",
          DeliveryDate:     vendor.deliveryDate || "",
          PaymentTerms:     vendor.paymentTerms || "",
          PaymentTermsDesc: vendor.paymentTermsDesc || "",
          PurchaseOrder:    vendor.purchaseOrder || "",
          ContractNo:       vendor.contractNo || "",
          SchlAgreementNo:  vendor.schlAgreementNo || "",
          TechinicalRating: vendor.techinicalRating || "",
          QualifScore:      vendor.qualifScore || "",
          AribaDocNo:       vendor.aribaDocNo || "",
          VendorIceFlag:    vendor.vendorIceFlag || "",
          // Order fields — always 0 for untouched vendors (no SplitQty)
          TotalPrice:       "0.000",
          BasicTotalAmt:    "0.000",
          PfPercent:        "0.000",
          PfAmount:         "0.000",
          Freight:          "0.000",
          GstPercentage:    "0",
          GstAmount:        "0.000",
          Insurance:        "0.000",
          NetLandedCost:    "0.000",
          CommercialRating: "",
          // Neg fields — always save current screen values for all vendors
          NegBasicTotal:    "0.000",
          NegPFAmount:      "0.000",
          NegFreight:       "0.000",
          NegInsurance:     "0.000",
          NegTotalBasic:    "0.000",
          NegGstAmount:     "0.000",
          NegNetCost:       "0.000",
          CommercialLoading: "0.000",
          LoadingComments:  "",
          TotalCommLoading: "0.000",
          ReasonForAmendment: that.getView().getModel("view").getProperty("/ReasonForAmendment") || ""
        };

        // Populate from current tree data
        aTreeData.forEach(function (row) {
          if (row.NodeType !== "SUMMARY") return;
          var fFinal    = parseFloat(row["v" + vendor.VendorIndex + "FinalPrice"])    || 0;
          var fNegTotal = parseFloat(row["v" + vendor.VendorIndex + "NegPriceTotal"]) || 0;
          var sNeg = (row["v" + vendor.VendorIndex + "NegPrice"] || "0").toString().replace("%", "");

          if (row.Label === "Basic Amount Total") {
            oItem.BasicTotalAmt = fFinal.toFixed(3);
            oItem.NegBasicTotal = fNegTotal.toFixed(3);
          } else if (row.Label === "P & F Charges (%)") {
            oItem.PfPercent = (parseFloat(sNeg) || 0).toFixed(3);
            oItem.PfAmount  = fFinal.toFixed(3);
            oItem.NegPFAmount = fNegTotal.toFixed(3);
          } else if (row.Label === "Freight (Rs)") {
            oItem.Freight = fFinal.toFixed(3);
            oItem.NegFreight = fNegTotal.toFixed(3);
          } else if (row.Label === "GST (%)") {
            oItem.GstPercentage = String(parseFloat(sNeg) || 0).substring(0, 3);
            oItem.GstAmount     = fFinal.toFixed(3);
            oItem.NegGstAmount = fNegTotal.toFixed(3);
          } else if (row.Label === "Insurance") {
            oItem.Insurance = fFinal.toFixed(3);
            oItem.NegInsurance = fNegTotal.toFixed(3);
          } else if (row.Label === "Total Basic") {
            oItem.NegTotalBasic = fNegTotal.toFixed(3);
          } else if (row.Label === "Net Landed Cost (Rs)") {
            oItem.NetLandedCost = fFinal.toFixed(3);
            oItem.TotalPrice    = fFinal.toFixed(3);
            oItem.NegNetCost = fNegTotal.toFixed(3);
          } else if (row.Label === "Commercial Loading") {
            oItem.CommercialLoading = fNegTotal.toFixed(3);
          } else if (row.Label === "Loading Comments") {
            oItem.LoadingComments = row["v" + vendor.VendorIndex + "LoadingComments"] || "";
          } else if (row.Label === "Total Amt with Comm. Loading") {
            oItem.TotalCommLoading = fNegTotal.toFixed(3);
          } else if (row.Label === "Commercial Rating") {
            oItem.CommercialRating = row["v" + vendor.VendorIndex + "SingleValue"] || "";
          }
        });

        return oItem;
      });

      oModel.create("/et_vendor_detailsSet", {
        NfaRefNo:     sNfaRefNo,
        Version:      that._nfaDetails.Version || "",
        VENDOR_ITEMS: aVendorItems
      }, {
        success: function () {
          if (fnCallback) fnCallback();
        },
        error: function (oError) {
          console.error("Vendor summary post failed:", oError);
          if (fnCallback) fnCallback();
        }
      });
    },
    error: function () {
      // Fallback: post with current tree data only (original behavior)
      var aVendorItems = that._vendors.map(function (vendor) {
        var oItem = {
          NfaRefNo: sNfaRefNo, Version: that._nfaDetails.Version || "", VendorNo: vendor.VendorNo || "", VendorName: vendor.VendorName || "",
          Plant: vendor.plant || "", Ta: vendor.ta || "", VendorQa: vendor.vendorQa || "",
          DeliveryDate: vendor.deliveryDate || "", PaymentTerms: vendor.paymentTerms || "",
          PaymentTermsDesc: vendor.paymentTermsDesc || "", PurchaseOrder: vendor.purchaseOrder || "",
          ContractNo: vendor.contractNo || "", SchlAgreementNo: vendor.schlAgreementNo || "",
          TechinicalRating: vendor.techinicalRating || "", QualifScore: vendor.qualifScore || "",
          AribaDocNo: vendor.aribaDocNo || "", VendorIceFlag: vendor.vendorIceFlag || "",
          TotalPrice: "0.000", BasicTotalAmt: "0.000", PfPercent: "0.000", PfAmount: "0.000",
          Freight: "0.000", GstPercentage: "0", GstAmount: "0.000", Insurance: "0.000",
          NetLandedCost: "0.000", CommercialRating: "", NegBasicTotal: "0.000",
          NegPFAmount: "0.000", NegFreight: "0.000", NegInsurance: "0.000",
          NegTotalBasic: "0.000", NegGstAmount: "0.000", NegNetCost: "0.000",
          CommercialLoading: "0.000", LoadingComments: "", TotalCommLoading: "0.000",
          ReasonForAmendment: that.getView().getModel("view").getProperty("/ReasonForAmendment") || ""
        };
        aTreeData.forEach(function (row) {
          if (row.NodeType !== "SUMMARY") return;
          var fFinal    = parseFloat(row["v" + vendor.VendorIndex + "FinalPrice"])    || 0;
          var fNegTotal = parseFloat(row["v" + vendor.VendorIndex + "NegPriceTotal"]) || 0;
          var sNeg = (row["v" + vendor.VendorIndex + "NegPrice"] || "0").toString().replace("%", "");
          if (row.Label === "Basic Amount Total")           { oItem.BasicTotalAmt = fFinal.toFixed(3); oItem.NegBasicTotal = fNegTotal.toFixed(3); }
          else if (row.Label === "P & F Charges (%)")       { oItem.PfPercent = (parseFloat(sNeg)||0).toFixed(3); oItem.PfAmount = fFinal.toFixed(3); oItem.NegPFAmount = fNegTotal.toFixed(3); }
          else if (row.Label === "Freight (Rs)")            { oItem.Freight = fFinal.toFixed(3); oItem.NegFreight = fNegTotal.toFixed(3); }
          else if (row.Label === "GST (%)")                 { oItem.GstPercentage = String(parseFloat(sNeg)||0).substring(0,3); oItem.GstAmount = fFinal.toFixed(3); oItem.NegGstAmount = fNegTotal.toFixed(3); }
          else if (row.Label === "Insurance")               { oItem.Insurance = fFinal.toFixed(3); oItem.NegInsurance = fNegTotal.toFixed(3); }
          else if (row.Label === "Total Basic")             { oItem.NegTotalBasic = fNegTotal.toFixed(3); }
          else if (row.Label === "Net Landed Cost (Rs)")    { oItem.NetLandedCost = fFinal.toFixed(3); oItem.TotalPrice = fFinal.toFixed(3); oItem.NegNetCost = fNegTotal.toFixed(3); }
          else if (row.Label === "Commercial Loading")      { oItem.CommercialLoading = fNegTotal.toFixed(3); }
          else if (row.Label === "Loading Comments")        { oItem.LoadingComments = row["v" + vendor.VendorIndex + "LoadingComments"] || ""; }
          else if (row.Label === "Total Amt with Comm. Loading") { oItem.TotalCommLoading = fNegTotal.toFixed(3); }
          else if (row.Label === "Commercial Rating")       { oItem.CommercialRating = row["v" + vendor.VendorIndex + "SingleValue"] || ""; }
        });
        return oItem;
      });
      oModel.create("/et_vendor_detailsSet", { NfaRefNo: sNfaRefNo, Version: that._nfaDetails.Version || "", VENDOR_ITEMS: aVendorItems }, {
        success: function () { if (fnCallback) fnCallback(); },
        error: function (oError) { console.error("Vendor summary post failed:", oError); if (fnCallback) fnCallback(); }
      });
    }
  });
},


// ============= POST VENDOR PR DETAILS =============

onPostVendorPRDetails: function () {
  var sNfaRefNo = this._getNfaRefNo();
  var that = this;

  if (!sNfaRefNo) {
    MessageBox.error("NFA Reference Number not found.");
    return;
  }

  MessageBox.confirm(
    "You are about to submit NFA " + sNfaRefNo + " for approval.\n\n" +
    "Once submitted, the document will be routed through the approval workflow.\n\n" +
    "Do you want to proceed?",
    {
      title: "Submit for Approval",
      actions: [MessageBox.Action.YES, MessageBox.Action.NO],
      emphasizedAction: MessageBox.Action.YES,
      onClose: function (sAction) {
        if (sAction !== MessageBox.Action.YES) return;
        that._triggerApprovalWorkflow(sNfaRefNo);
      }
    }
  );
},

_triggerApprovalWorkflow: function (sNfaRefNo) {
  var oModel = this.getOwnerComponent().getModel();
  var that = this;
  var sVersion = String(this.getView().getModel("view").getProperty("/nfaVersion") || "");

  oModel.create("/et_approval_dataSet", {
    NfaRefNo: sNfaRefNo,
    Submit: "X",
    Sno:"",
    SapId:"",
    Version: sVersion,
    ApproverMailId:"",
    ApprovedRejectInfo:"",
    StatusUpdatedOn:"",
    RejectionRemarks:"",
    MessageType: "",
    MessageText: ""
  }, {
    success: function (oData) {
      that.getView().getModel("view").setProperty("/submitEnabled", false);
      that.getView().getModel("view").setProperty("/editable", false);
      MessageBox.warning(
        "NFA " + sNfaRefNo + " has been submitted for approval.\n\nThe document is now pending approval.",
        {
          title: "Submitted for Approval",
          actions: [MessageBox.Action.OK],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function () {
            sap.ui.core.BusyIndicator.show(0);
            setTimeout(function () {
              that.getOwnerComponent().getRouter().navTo("RoutenfaCreator", {}, true);
              sap.ui.core.BusyIndicator.hide();
            }, 800);
          }
        }
      );
    },
    error: function (oError) {
      console.error("Approval workflow trigger failed:", oError);
      MessageBox.error(
        "Failed to initiate the approval workflow for NFA " + sNfaRefNo + ".\n\nPlease try again or contact your system administrator."
      );
    }
  });
},

_onLoadingCommentsChange: function (iVendor, oEvent) {
  const oCtx = oEvent.getSource().getBindingContext("view");
  const oCtxObj = oCtx.getObject();
  oCtxObj["v" + iVendor + "LoadingComments"] = oEvent.getParameter("value");
  this._bDirty = true;
  oCtx.getModel().refresh();
},

_onDeliveryDateChange: function (iVendor, oEvent) {
  const oCtx = oEvent.getSource().getBindingContext("view");
  const oCtxObj = oCtx.getObject();
  const oDP = oEvent.getSource();

  let sBackendDate = "";
  let sDisplayDate = "";

  if (oDP.isValidValue() && oDP.getDateValue()) {
    const oDate = oDP.getDateValue();
    sBackendDate = "\/Date(" + oDate.getTime() + ")\/";
    sDisplayDate = oDP.getValue();
  }

  // Update tree row (display)
  oCtxObj["v" + iVendor + "SingleValue"] = sDisplayDate;
  // Update _vendors so _postVendorItemSummary picks it up on save
  const oVendor = this._vendors.find(function (v) { return v.VendorIndex === iVendor; });
  if (oVendor) oVendor.deliveryDate = sBackendDate;
  this._bDirty = true;
  oCtx.getModel().refresh();
},

_onSingleValueChange: function (iVendor, oEvent) {
  const oCtx = oEvent.getSource().getBindingContext("view");
  const oCtxObj = oCtx.getObject();
  oCtxObj[`v${iVendor}SingleValue`] = oEvent.getParameter("value");
  this._bDirty = true;
  oCtx.getModel().refresh();
},

onManualQtyChange: function (oEvent) {
  var oCtx = oEvent.getSource().getBindingContext("view");
  var oItem = oCtx.getObject();
  var fQty = parseFloat(oEvent.getSource().getValue()) || 0;
  oItem.Qty = String(fQty);
  oItem.TotalLpp = (parseFloat(oItem.Lpp || 0) * fQty).toFixed(3);

  // Recalculate FinalPrice for all vendors using new qty
  this._vendors.forEach(function (v) {
    var fNegPrice = parseFloat(oItem["v" + v.VendorIndex + "NegPrice"]) || 0;
    var fSplitQty = parseFloat(oItem["v" + v.VendorIndex + "SplitQty"]) || 0;
    oItem["v" + v.VendorIndex + "FinalPrice"] = fNegPrice * (fSplitQty > 0 ? fSplitQty : fQty);
  });

  // Recalculate RemainingQty — exclude ICE vendors
  var fTotalSplit = 0;
  this._vendors.forEach(function (v) {
    if (v.vendorIceFlag === "X") return;
    fTotalSplit += parseFloat(oItem["v" + v.VendorIndex + "SplitQty"] || 0);
  });
  oItem.RemainingQty = parseFloat((fQty - fTotalSplit).toFixed(3));

  var oVM = this.getView().getModel("view");
  var aTreeData = oVM.getProperty("/TreeData") || [];
  this._recalculateSummaries(aTreeData.filter(function (n) { return n.NodeType === "PR"; }));
  oCtx.getModel().refresh();
},

onManualLppChange: function (oEvent) {
  var oCtx = oEvent.getSource().getBindingContext("view");
  var oItem = oCtx.getObject();
  var fLpp = parseFloat(oEvent.getSource().getValue()) || 0;
  oItem.UnitLpp = String(fLpp);
  oItem.Lpp = String(fLpp);
  oItem.TotalLpp = (fLpp * (parseFloat(oItem.Qty) || 0)).toFixed(3);

  var oVM = this.getView().getModel("view");
  var aTreeData = oVM.getProperty("/TreeData") || [];
  this._recalculateSummaries(aTreeData.filter(function (n) { return n.NodeType === "PR"; }));
  oCtx.getModel().refresh();
},

onManualMatGrpVH: function (oEvent) {
  var oModel = this.getOwnerComponent().getModel();
  var oSource = oEvent.getSource();
  this._oMatGrpTargetCtx = oSource.getBindingContext("view");
  var that = this;

  if (!this._oMatGrpDialog) {
    this._oMatGrpDialog = new sap.m.SelectDialog({
      title: "Select Material Group",
      noDataText: "No data found",
      search: function (oEv) {
        var sVal = oEv.getParameter("value");
        var aFilters = sVal ? [new Filter("MatGrpDesc", FilterOperator.Contains, sVal)] : [];
        oEv.getSource().getBinding("items").filter(aFilters);
      },
      confirm: function (oEv) {
        var oData = oEv.getParameter("selectedItem").getBindingContext().getObject();
        that._oMatGrpTargetCtx.setProperty("MaterialGroup", oData.MatGrp);
        that.getView().getModel("view").refresh();
      }
    });
    this.getView().addDependent(this._oMatGrpDialog);
  }

  this._oMatGrpDialog.bindAggregation("items", {
    path: "/ZnfaMatGrpSet",
    template: new sap.m.StandardListItem({
      title: "{MatGrpDesc}",
      description: "{MatGrp}"
    })
  });
  this._oMatGrpDialog.setModel(oModel);
  this._oMatGrpDialog.open();
},

_refreshLppFromBackend: function (fnCallback) {
  var oVM = this.getView().getModel("view");
  var sNfaRefNo = this._getNfaRefNo();
  var oModel = this.getOwnerComponent().getModel();

  oModel.read("/et_vendor_pr_item_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oPRData) {
      var aCurrentTree = oVM.getProperty("/TreeData") || [];
      // Track which PrNo+PrItem combos have already been updated to avoid
      // redundant overwrites from duplicate vendor rows for the same item.
      var mUpdated = {};
      (oPRData.results || []).forEach(function (row) {
        var sKey = row.PrNo + "|" + String(parseInt(row.PrItem, 10));
        if (mUpdated[sKey]) return; // already processed this item
        var fBackendUnitLpp = parseFloat(row.UnitLpp);
        var fBackendTotalLpp = parseFloat(row.TotalLpp);
        // Skip rows where backend has no LPP data — nothing to update
        if ((isNaN(fBackendUnitLpp) || fBackendUnitLpp <= 0) &&
            (isNaN(fBackendTotalLpp) || fBackendTotalLpp <= 0)) return;
        var oPRNode = aCurrentTree.find(function (n) {
          return n.NodeType === "PR" && n.PrNumber === row.PrNo;
        });
        if (!oPRNode) return;
        // Match by numeric PrItem to handle zero-padding differences ("0010" vs "10")
        var iRowPrItem = parseInt(row.PrItem, 10);
        var oItem = (oPRNode.children || []).find(function (i) {
          return i.NodeType === "ITEM" && parseInt(i.PrItem, 10) === iRowPrItem;
        });
        if (!oItem) return;
        if (!isNaN(fBackendUnitLpp) && fBackendUnitLpp > 0) {
          oItem.UnitLpp = String(fBackendUnitLpp);
          oItem.Lpp = String(fBackendUnitLpp);
        }
        if (!isNaN(fBackendTotalLpp) && fBackendTotalLpp > 0) {
          oItem.TotalLpp = String(fBackendTotalLpp);
        }
        mUpdated[sKey] = true;
      });
      oVM.setProperty("/TreeData", aCurrentTree);
      oVM.refresh();
      if (fnCallback) fnCallback();
    },
    error: function () {
      if (fnCallback) fnCallback();
    }
  });
},

_refreshLppAmountFromApprovalForm: function () {
  var oModel = this.getOwnerComponent().getModel();
  var sNfaRefNo = this._getNfaRefNo();
  var that = this;
  oModel.read("/et_approval_formSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oData) {
      var oRaw = (oData.results || [])[0];
      if (!oRaw || !that._oDraftFormModel) return;
      var sBackendLpp = String(oRaw.LppAmount || "").trim();
      if (sBackendLpp && parseFloat(sBackendLpp) > 0) {
        that._oDraftFormModel.setProperty("/LppAmount", sBackendLpp);
      }
      // else: backend has no value — retain current screen value
    }
    // on error: retain current screen value silently
  });
},

_reloadSummaryData: function (fnCallback) {
  var oVM = this.getView().getModel("view");
  var sNfaRefNo = this._getNfaRefNo();
  var sAribaDocNo = this._sAribaDocNo || "";
  var oODataModel = this.getOwnerComponent().getModel();
  var that = this;

  // Always reload by NfaRefNo — saved data (with SplitPoQty/RemainingQty) is always under NfaRefNo
  // Step 1: Re-fetch PR item details to refresh Qty, RemainingQty, SplitPoQty per vendor
  oODataModel.read("/et_vendor_pr_item_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oPRData) {
      var aCurrentTree = oVM.getProperty("/TreeData") || [];

      // Patch ITEM nodes with fresh Qty, SplitPoQty from backend
      (oPRData.results || []).forEach(function (row) {
        var oPRNode = aCurrentTree.find(function (n) { return n.NodeType === "PR" && n.PrNumber === row.PrNo; });
        if (!oPRNode) return;
        var oItem = oPRNode.children.find(function (i) { return i.NodeType === "ITEM" && i.PrItem === row.PrItem; });
        if (!oItem) return;

        // Refresh Qty from backend
        oItem.Qty = row.Qty != null ? String(parseFloat(row.Qty)) : oItem.Qty;

        // LPP fallback: use backend value if available, otherwise retain existing screen value
        var fBackendUnitLpp = parseFloat(row.UnitLpp);
        var fBackendTotalLpp = parseFloat(row.TotalLpp);
        if (!isNaN(fBackendUnitLpp) && fBackendUnitLpp > 0) {
          oItem.UnitLpp = String(fBackendUnitLpp);
          oItem.Lpp = String(fBackendUnitLpp);
        }
        if (!isNaN(fBackendTotalLpp) && fBackendTotalLpp > 0) {
          oItem.TotalLpp = String(fBackendTotalLpp);
        }

        var oVendor = that._vendors.find(function (v) { return v.VendorNo === row.VendorNo; });
        if (oVendor) {
          var idx = oVendor.VendorIndex;
          oItem["v" + idx + "SplitQty"]  = parseFloat(row.SplitPoQty)  || 0;
          oItem["v" + idx + "InitPrice"] = row.InitialPrice    || "";
          oItem["v" + idx + "NegPrice"]  = row.NegotiatedPrice || "";
          oItem["v" + idx + "FinalPrice"] = parseFloat(row.FinilizedLinePrice) || 0;
        }
      });

      // Recompute RemainingQty for each ITEM from refreshed SplitQty values
      aCurrentTree.filter(function (n) { return n.NodeType === "PR"; }).forEach(function (prNode) {
        (prNode.children || []).forEach(function (oItem) {
          if (oItem.NodeType !== "ITEM") return;
          var fQty = parseFloat(oItem.Qty) || 0;
          var fTotalSplit = 0;
          that._vendors.forEach(function (v) {
            if (v.vendorIceFlag === "X") return;
            fTotalSplit += parseFloat(oItem["v" + v.VendorIndex + "SplitQty"] || 0);
          });
          oItem.RemainingQty = parseFloat((fQty - fTotalSplit).toFixed(3));
        });
      });

      oVM.setProperty("/TreeData", aCurrentTree);

      // Step 2: Re-fetch vendor summary (charges, ratings, etc.)
      oODataModel.read("/et_vendor_item_detailsSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        forceServerDataRequest: true,
        success: function (oSummaryData) {
          var aTree = oVM.getProperty("/TreeData") || [];

          (oSummaryData.results || []).forEach(function (oVendorRow) {
            var oVendor = that._vendors.find(function (v) { return v.VendorNo === oVendorRow.VendorNo; });
            if (!oVendor) return;
            var idx = oVendor.VendorIndex;

            var fPfPct  = parseFloat(oVendorRow.PfPercent)  || 0;
            var fGstPct = parseFloat(oVendorRow.GstPercentage) || 0;

            var mSummaryMap = {
              "P & F Charges (%)":  { negPrice: fPfPct  > 0 ? String(fPfPct)  + "%" : "", finalPrice: oVendorRow.PfAmount,  negPriceTotal: oVendorRow.NegPFAmount },
              "Freight (Rs)":       { negPrice: oVendorRow.Freight,                        finalPrice: oVendorRow.Freight,   negPriceTotal: oVendorRow.NegFreight },
              "GST (%)":            { negPrice: fGstPct > 0 ? String(fGstPct) + "%" : "", finalPrice: oVendorRow.GstAmount, negPriceTotal: oVendorRow.NegGstAmount },
              "Insurance":          { negPrice: oVendorRow.Insurance,                      finalPrice: oVendorRow.Insurance, negPriceTotal: oVendorRow.NegInsurance },
              "Basic Amount Total": { negPriceTotal: oVendorRow.NegBasicTotal },
              "Total Basic":        { negPriceTotal: oVendorRow.NegTotalBasic },
              "Net Landed Cost (Rs)": { negPriceTotal: oVendorRow.NegNetCost },
              "Commercial Loading": { negPrice: oVendorRow.CommercialLoading, negPriceTotal: oVendorRow.CommercialLoading },
              "Loading Comments":   { loadingComments: oVendorRow.LoadingComments },
              "Total Amt with Comm. Loading": { negPriceTotal: oVendorRow.TotalCommLoading },
              "Commercial Rating":  { singleValue: oVendorRow.CommercialRating }
            };

            aTree.forEach(function (row) {
              if (row.NodeType !== "SUMMARY") return;
              var oMap = mSummaryMap[row.Label];
              if (!oMap) return;
              if (oMap.finalPrice      !== undefined) row["v" + idx + "FinalPrice"]      = parseFloat(oMap.finalPrice)    || 0;
              if (oMap.negPrice        !== undefined) row["v" + idx + "NegPrice"]        = oMap.negPrice;
              if (oMap.negPriceTotal   !== undefined) row["v" + idx + "NegPriceTotal"]   = parseFloat(oMap.negPriceTotal) || 0;
              if (oMap.singleValue     !== undefined) row["v" + idx + "SingleValue"]     = oMap.singleValue || "";
              if (oMap.loadingComments !== undefined) row["v" + idx + "LoadingComments"] = oMap.loadingComments || "";
            });
          });

          // Re-populate delivery date and payment terms last so they are
          // not overwritten by the model refresh above.
          that._populateSummaryDefaults();

          oVM.setProperty("/TreeData", aTree);
          oVM.refresh();
          sap.ui.core.BusyIndicator.hide();
          if (fnCallback) fnCallback();
        },
        error: function (oError) {
          sap.ui.core.BusyIndicator.hide();
          console.error("Error reloading summary data:", oError);
          if (fnCallback) fnCallback();
        }
      });
    },
    error: function (oError) {
      sap.ui.core.BusyIndicator.hide();
      console.error("Error reloading PR item data:", oError);
    }
  });
},

_formatINR: function (val) {
  var n = parseFloat(val);
  if (isNaN(n) || n === 0) return "";
  return " " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
},

_getNfaRefNo: function () {
  return this.getView().getModel("view").getProperty("/nfaRefNo") || "";
},

/* ================= EXCEL DOWNLOAD / UPLOAD ================= */

_loadXlsx: function (fnCallback) {
  if (window.XLSX) { fnCallback(); return; }
  var oScript = document.createElement("script");
  oScript.src = sap.ui.require.toUrl("com/df/nfa/creator_v2") + "/thirdparty/xlsx.min.js";
  oScript.onload = fnCallback;
  document.head.appendChild(oScript);
},

onDownloadExcel: function () {
  var that = this;
  this._loadXlsx(function () { that._generateExcel(); });
},

_generateExcel: function () {
  var oVM   = this.getView().getModel("view");
  var aTree = oVM.getProperty("/TreeData") || [];
  var aVendors = this._vendors;

  // Signature cell value — encodes vendor names so upload can detect tampering
  var sSig = "__QCS_v1__|" + aVendors.map(function (v) { return v.VendorNo + ":" + v.VendorName; }).join(";");

  // ---- Build header rows ----
  // Row 0: signature (hidden visually via row height but present for validation)
  // Row 1: main header
  var aFixedHeaders = ["PR No", "PR Item", "Material", "Short Text", "Qty", "UOM", "Plant", "Material Group", "Rem QTY", "Unit LPP", "Long Text"];
  var aVendorHeaders = [];
  aVendors.forEach(function (v) {
    aVendorHeaders.push(v.VendorName + "_InitPrice");
    aVendorHeaders.push(v.VendorName + "_NegPrice");
    aVendorHeaders.push(v.VendorName + "_OrderedQTY");
  });
  var aAllHeaders = aFixedHeaders.concat(aVendorHeaders);

  // ---- Build data rows from existing ITEM nodes ----
  var aDataRows = [];
  aTree.forEach(function (prNode) {
    if (prNode.NodeType !== "PR") return;
    (prNode.children || []).forEach(function (item) {
      if (item.NodeType !== "ITEM") return;
      var aRow = [
        prNode.PrNumber || "",
        item.PrItem     || "",
        item.Material   || "",
        item.MaterialDesc || "",
        item.Qty        || "",
        item.UOM        || "",
        item.Plant      || "",
        item.MaterialGroup || "",
        item.RemainingQty != null ? item.RemainingQty : (item.Qty || ""),
        item.UnitLpp    || "",
        item.MaterialLongText || ""
      ];
      aVendors.forEach(function (v) {
        aRow.push(item["v" + v.VendorIndex + "InitPrice"] || "");
        aRow.push(item["v" + v.VendorIndex + "NegPrice"]  || "");
        aRow.push(item["v" + v.VendorIndex + "SplitQty"]  || "");
      });
      // Mark this row as existing (locked) via a trailing flag column — stripped on upload
      aRow._isExisting = true;
      aDataRows.push(aRow);
    });
  });

  // ---- Build worksheet ----
  var XLSX = window.XLSX;
  var aSheetData = [];

  // Row 1: signature row
  var aSigRow = [sSig];
  aSheetData.push(aSigRow);

  // Row 2: column headers
  aSheetData.push(aAllHeaders);

  // Data rows
  aDataRows.forEach(function (r) { aSheetData.push(r); });

  var oWS = XLSX.utils.aoa_to_sheet(aSheetData);

  // Style: grey background for fixed columns in existing rows (rows 3 onwards)
  // SheetJS CE does not support full cell styles, but we set column widths for UX
  var aColWidths = [14, 10, 16, 28, 8, 6, 8, 16, 10, 10, 40];
  aVendors.forEach(function () { aColWidths.push(14); aColWidths.push(14); aColWidths.push(12); });
  oWS["!cols"] = aColWidths.map(function (w) { return { wch: w }; });

  // Hide signature row (row height 0 is not supported in CE, so we just keep it visible but labelled)
  oWS["!rows"] = [{ hpx: 0, hidden: true }];

  var oWB = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(oWB, oWS, "QCS Data");

  var sFileName = "QCS_Template_" + (oVM.getProperty("/nfaRefNo") || "Download") + ".xlsx";
  XLSX.writeFile(oWB, sFileName);
},

onUploadExcel: function () {
  var that = this;
  if (!this._oUploadDialog) {
    Fragment.load({
      id: this.getView().getId() + "--uploadDlg",
      name: "com.df.nfa.creator_v2.view.fragments.UploadExcel",
      controller: this
    }).then(function (oDialog) {
      that._oUploadDialog = oDialog;
      that.getView().addDependent(oDialog);
      oDialog.open();
    });
  } else {
    // Reset state before reopening
    this._oExcelFile = null;
    var oFU = sap.ui.core.Fragment.byId(this.getView().getId() + "--uploadDlg", "fileUploader");
    if (oFU) oFU.clear();
    var oStrip = sap.ui.core.Fragment.byId(this.getView().getId() + "--uploadDlg", "uploadErrorStrip");
    if (oStrip) oStrip.setVisible(false);
    this._oUploadDialog.open();
  }
},

onFileChange: function (oEvent) {
  // Hide any previous error strip
  var oStrip = sap.ui.core.Fragment.byId(this.getView().getId() + "--uploadDlg", "uploadErrorStrip");
  if (oStrip) oStrip.setVisible(false);

  // Try all known ways to get the File object from FileUploader
  var oFile = null;

  // Method 1: event parameter "files" (UI5 >= 1.92)
  var aEventFiles = oEvent.getParameter("files");
  if (aEventFiles && aEventFiles.length) {
    oFile = aEventFiles[0];
  }

  // Method 2: FileUploader's own oFileUpload DOM ref
  if (!oFile) {
    var oFU = oEvent.getSource();
    var oInternalInput = oFU.oFileUpload || (oFU.getDomRef() && oFU.getDomRef().querySelector("input[type='file']"));
    if (oInternalInput && oInternalInput.files && oInternalInput.files.length) {
      oFile = oInternalInput.files[0];
    }
  }

  this._oExcelFile = oFile || null;
},

onFileTypeMismatch: function () {
  this._oExcelFile = null;
  var oStrip = sap.ui.core.Fragment.byId(this.getView().getId() + "--uploadDlg", "uploadErrorStrip");
  if (oStrip) {
    oStrip.setText("Only .xlsx files are accepted. Please select a valid QCS template.");
    oStrip.setVisible(true);
  }
},

onCloseUploadDialog: function () {
  this._oExcelFile = null;
  if (this._oUploadDialog) this._oUploadDialog.close();
},

onUploadToServer: function () {
  var that = this;

  // Last-chance file grab in case onFileChange missed it
  if (!this._oExcelFile) {
    var oFU = sap.ui.core.Fragment.byId(this.getView().getId() + "--uploadDlg", "fileUploader");
    if (oFU) {
      var oInternalInput = oFU.oFileUpload || (oFU.getDomRef() && oFU.getDomRef().querySelector("input[type='file']"));
      if (oInternalInput && oInternalInput.files && oInternalInput.files.length) {
        this._oExcelFile = oInternalInput.files[0];
      }
    }
  }

  if (!this._oExcelFile) {
    MessageBox.error("Please select an Excel file first.");
    return;
  }
  this._loadXlsx(function () { that._processUploadedExcel(that._oExcelFile); });
},

_processUploadedExcel: function (oFile) {
  var that  = this;
  var oVM   = this.getView().getModel("view");
  var aTree = oVM.getProperty("/TreeData") || [];
  var aVendors = this._vendors;

  var oReader = new FileReader();
  oReader.onload = function (e) {
    try {
      var XLSX   = window.XLSX;
      var oWB    = XLSX.read(e.target.result, { type: "binary" });
      var oWS    = oWB.Sheets[oWB.SheetNames[0]];
      var aRows  = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });

      if (!aRows || aRows.length < 2) {
        MessageBox.error("The uploaded file is empty or invalid."); return;
      }

      // ---- 1. Signature validation ----
      var sSigCell = (aRows[0] && aRows[0][0]) ? String(aRows[0][0]) : "";
      if (sSigCell.indexOf("__QCS_v1__|") !== 0) {
        MessageBox.error("Invalid template. Please download a fresh template from this screen and do not modify the first row.");
        return;
      }
      var sExpectedSig = "__QCS_v1__|" + aVendors.map(function (v) { return v.VendorNo + ":" + v.VendorName; }).join(";");
      if (sSigCell !== sExpectedSig) {
        MessageBox.error("Template mismatch. The vendor configuration in this file does not match the current screen. Please re-download the template.");
        return;
      }

      // ---- 2. Header validation ----
      var aFixedHeaders = ["PR No", "PR Item", "Material", "Short Text", "Qty", "UOM", "Plant", "Material Group", "Rem QTY", "Unit LPP", "Long Text"];
      var aExpVendorHdr = [];
      aVendors.forEach(function (v) {
        aExpVendorHdr.push(v.VendorName + "_InitPrice");
        aExpVendorHdr.push(v.VendorName + "_NegPrice");
        aExpVendorHdr.push(v.VendorName + "_OrderedQTY");
      });
      var aExpHeaders = aFixedHeaders.concat(aExpVendorHdr);
      var aFileHeaders = aRows[1] || [];
      var aMissingHdr = aExpHeaders.filter(function (h, i) { return String(aFileHeaders[i] || "").trim() !== h; });
      if (aMissingHdr.length) {
        MessageBox.error("Column headers have been modified. Please re-download the template and do not rename columns.\n\nMismatched: " + aMissingHdr.join(", "));
        return;
      }

      // ---- 3. Parse data rows (from row index 2 onwards) ----
      var aDataRows = aRows.slice(2).filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
      if (!aDataRows.length) {
        MessageBox.error("No data rows found in the uploaded file."); return;
      }

      // ---- 4. Validate each row ----
      var aErrors = [];
      aDataRows.forEach(function (r, idx) {
        var iRow = idx + 3; // 1-based row for error messages
        var sPrNo   = String(r[0] || "").trim();
        var sPrItem = String(r[1] || "").trim();
        var sQty    = String(r[4] || "").trim();
        var sUOM    = String(r[5] || "").trim();

        if (!sPrNo)   { aErrors.push("Row " + iRow + ": PR No is required."); }
        if (!sPrItem) { aErrors.push("Row " + iRow + ": PR Item is required."); }
        if (!sQty || isNaN(parseFloat(sQty)) || parseFloat(sQty) <= 0) {
          aErrors.push("Row " + iRow + ": Qty must be a positive number.");
        }
        if (!sUOM) { aErrors.push("Row " + iRow + ": UOM is required."); }

        // Vendor numeric checks
        aVendors.forEach(function (v, vi) {
          var iBase = 11 + vi * 3;
          var sInit = String(r[iBase]     || "").trim();
          var sNeg  = String(r[iBase + 1] || "").trim();
          var sOrd  = String(r[iBase + 2] || "").trim();
          if (sInit !== "" && isNaN(parseFloat(sInit))) {
            aErrors.push("Row " + iRow + ": " + v.VendorName + " Initial Price must be numeric.");
          }
          if (sNeg !== "" && isNaN(parseFloat(sNeg))) {
            aErrors.push("Row " + iRow + ": " + v.VendorName + " Neg Price must be numeric.");
          }
          if (sOrd !== "" && isNaN(parseFloat(sOrd))) {
            aErrors.push("Row " + iRow + ": " + v.VendorName + " Ordered QTY must be numeric.");
          }
        });

        // For existing rows: fixed columns must not be tampered
        var oExistingPR = aTree.find(function (n) { return n.NodeType === "PR" && n.PrNumber === sPrNo; });
        if (oExistingPR) {
          var oExistingItem = (oExistingPR.children || []).find(function (i) {
            return i.NodeType === "ITEM" && String(i.PrItem) === sPrItem;
          });
          if (oExistingItem) {
            // Check Qty tampered
            if (String(r[4]).trim() !== "" && parseFloat(r[4]) !== parseFloat(oExistingItem.Qty)) {
              aErrors.push("Row " + iRow + ": Qty for existing item " + sPrNo + "/" + sPrItem + " cannot be changed (locked). Expected: " + oExistingItem.Qty);
            }
            // Check UOM tampered
            if (String(r[5]).trim() !== "" && String(r[5]).trim() !== (oExistingItem.UOM || "").trim()) {
              aErrors.push("Row " + iRow + ": UOM for existing item " + sPrNo + "/" + sPrItem + " cannot be changed (locked).");
            }
          }
        }
      });

      if (aErrors.length) {
        MessageBox.error("Please fix the following errors before uploading:\n\n" + aErrors.slice(0, 10).join("\n") + (aErrors.length > 10 ? "\n...and " + (aErrors.length - 10) + " more." : ""));
        return;
      }

      // ---- 5. Merge into tree model ----
      var aPRNodes = aTree.filter(function (n) { return n.NodeType === "PR"; });
      var aExistingSummary = aTree.filter(function (n) { return n.NodeType === "SUMMARY"; });

      aDataRows.forEach(function (r) {
        var sPrNo    = String(r[0] || "").trim();
        var sPrItem  = String(r[1] || "").trim();
        var sMat     = String(r[2] || "").trim();
        var sDesc    = String(r[3] || "").trim();
        var sQty     = String(r[4] || "").trim();
        var sUOM     = String(r[5] || "").trim();
        var sPlant   = String(r[6] || "").trim();
        var sMatGrp  = String(r[7] || "").trim();
        var sUnitLpp  = String(r[9]  || "").trim();
        var sLongText = String(r[10] || "").trim();

        // Find or create PR node
        var oPRNode = aPRNodes.find(function (p) { return p.PrNumber === sPrNo; });
        if (!oPRNode) {
          oPRNode = { NodeType: "PR", PrNumber: sPrNo, children: [] };
          aPRNodes.push(oPRNode);
        }

        // Find or create ITEM node
        var oItem = (oPRNode.children || []).find(function (i) {
          return i.NodeType === "ITEM" && String(i.PrItem) === sPrItem;
        });
        var bNewItem = !oItem;
        if (bNewItem) {
          oItem = {
            NodeType: "ITEM",
            PrItem: sPrItem,
            IsManual: false,
            Material: sMat,
            MaterialDesc: sDesc,
            Qty: sQty,
            UOM: sUOM,
            Plant: sPlant,
            MaterialGroup: sMatGrp,
            UnitLpp: sUnitLpp || "0",
            Lpp: sUnitLpp || "0",
            TotalLpp: (parseFloat(sUnitLpp || 0) * parseFloat(sQty || 0)).toFixed(3),
            PrBudget: "0",
            WbsElement: "",
            MaterialLongText: sLongText,
            MaterialGroupDescription: "",
            PurchaseOrg: that._nfaDetails.PurchaseOrg || "",
            PurchaseOrgDesc: that._nfaDetails.PurchaseOrgDesc || "",
            PurchaseGroup: that._nfaDetails.PurchaseGroup || "",
            PurchaseGroupDesc: that._nfaDetails.PurchaseGroupDesc || "",
            children: []
          };
          aVendors.forEach(function (v) {
            oItem["v" + v.VendorIndex + "InitPrice"]  = "";
            oItem["v" + v.VendorIndex + "NegPrice"]   = "";
            oItem["v" + v.VendorIndex + "FinalPrice"] = 0;
            oItem["v" + v.VendorIndex + "SplitQty"]   = 0;
          });
          oPRNode.children.push(oItem);
          oPRNode.children.push({ NodeType: "DESC", PrItem: sPrItem, Material: sMat, MaterialLongText: sLongText, DescText: "" });
        }

        // Update vendor price fields (always — for both new and existing items)
        aVendors.forEach(function (v, vi) {
          var iBase = 11 + vi * 3;
          var sInit = String(r[iBase]     || "").trim();
          var sNeg  = String(r[iBase + 1] || "").trim();
          var sOrd  = (r[iBase + 2] === 0 || r[iBase + 2]) ? String(r[iBase + 2]).trim() : "";
          if (sInit !== "") oItem["v" + v.VendorIndex + "InitPrice"] = parseFloat(sInit);
          if (sNeg  !== "") oItem["v" + v.VendorIndex + "NegPrice"]  = parseFloat(sNeg);
          if (sOrd  !== "") oItem["v" + v.VendorIndex + "SplitQty"]  = parseFloat(sOrd);
          // Recalculate FinalPrice
          var fNeg  = parseFloat(oItem["v" + v.VendorIndex + "NegPrice"])  || 0;
          var fSplit = parseFloat(oItem["v" + v.VendorIndex + "SplitQty"]) || 0;
          var fQty   = parseFloat(oItem.Qty) || 0;
          var bMulti = aVendors.length > 1;
          var bIce   = v.vendorIceFlag === "X";
          var fEffQty = fSplit > 0 ? fSplit : (!bMulti || bIce ? fQty : 0);
          oItem["v" + v.VendorIndex + "FinalPrice"] = fNeg * fEffQty;
          oItem["v" + v.VendorIndex + "NegPriceTotal"] = fNeg * fQty;
        });

        // Recalculate RemainingQty
        var fQty = parseFloat(oItem.Qty) || 0;
        var fTotalSplit = 0;
        aVendors.forEach(function (v) {
          if (v.vendorIceFlag === "X") return;
          fTotalSplit += parseFloat(oItem["v" + v.VendorIndex + "SplitQty"] || 0);
        });
        oItem.RemainingQty = parseFloat((fQty - fTotalSplit).toFixed(3));
      });

      // ---- 6. Recalculate summaries and update model ----
      that._recalculateSummaries(aPRNodes);
      var aSummaryRows = aExistingSummary.length ? aExistingSummary : that._getSummaryRows();
      oVM.setProperty("/TreeData", aPRNodes.concat(aSummaryRows));
      that._updateHasTableData();
      that._bDirty = true;
      that.onCloseUploadDialog();
      sap.m.MessageToast.show("Excel uploaded and data merged successfully.");

    } catch (ex) {
      MessageBox.error("Failed to process the Excel file. Please ensure it is a valid QCS template.\n" + ex.message);
    }
  };
  oReader.readAsBinaryString(oFile);
},

onVersionPress: function () {
  var sNfaRefNo = this._getNfaRefNo();
  var oModel = this.getOwnerComponent().getModel();
  var that = this;

  sap.ui.core.BusyIndicator.show(0);

  oModel.read("/et_version_dataSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oData) {
      sap.ui.core.BusyIndicator.hide();
      var aResults = oData.results || [];

      if (!aResults.length) {
        sap.m.MessageBox.information("No version history found for NFA: " + sNfaRefNo);
        return;
      }

      var oVersionModel = new JSONModel({ versions: aResults });

      if (!that._oVersionDialog) {
        that._oVersionDialog = new sap.m.Dialog({
          title: "Version History \u2013 " + sNfaRefNo,
          contentWidth: "500px",
          content: [
            new sap.m.Table({
              columns: [
                new sap.m.Column({ header: new sap.m.Label({ text: "Version" }), width: "120px" }),
                new sap.m.Column({ header: new sap.m.Label({ text: "PO Amount" }), hAlign: "End" })
              ],
              items: {
                path: "version>/versions",
                template: new sap.m.ColumnListItem({
                  cells: [
                    new sap.m.Text({
                      text: {
                        path: "version>Version",
                        formatter: function (val) { return val ? "Version " + val : ""; }
                      }
                    }),
                    new sap.m.Text({
                      text: {
                        path: "version>PoValue",
                        formatter: function (val) {
                          var n = parseFloat(val);
                          if (isNaN(n) || n === 0) return " 0.00";
                          return " " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                      },
                      textAlign: "End"
                    })
                  ]
                })
              }
            })
          ],
          endButton: new sap.m.Button({
            text: "Close",
            press: function () { that._oVersionDialog.close(); }
          })
        });
        that.getView().addDependent(that._oVersionDialog);
      }

      that._oVersionDialog.setModel(oVersionModel, "version");
      that._oVersionDialog.open();
    },
    error: function (oError) {
      sap.ui.core.BusyIndicator.hide();
      console.error("Version data fetch failed:", oError);
      sap.m.MessageBox.error("Failed to load version history.");
    }
  });
},

onColumnSort: function (oEvent) { try { oEvent.preventDefault(); } catch(e) {} },
onColumnFilter: function (oEvent) { try { oEvent.preventDefault(); } catch(e) {} },

_applyPRSort: function (sField, bDesc) {
  console.log("[QCS] _applyPRSort called", sField, bDesc, "original:", this._aOriginalPRNodes);
  var oVM = this.getView().getModel("view");
  var aTreeData = oVM.getProperty("/TreeData") || [];
  var aSummary = aTreeData.filter(function (n) { return n.NodeType === "SUMMARY"; });

  if (!this._aOriginalPRNodes) {
    this._aOriginalPRNodes = JSON.parse(JSON.stringify(
      aTreeData.filter(function (n) { return n.NodeType === "PR"; })
    ));
  }

  this._sPRColumnSort = { field: sField, desc: bDesc };
  oVM.setProperty("/TreeData", this._getFilteredAndSortedPRNodes().concat(aSummary));
  oVM.refresh();
},

_applyPRFilter: function (sValue) {
  var oVM = this.getView().getModel("view");
  var aTreeData = oVM.getProperty("/TreeData") || [];
  var aSummary = aTreeData.filter(function (n) { return n.NodeType === "SUMMARY"; });

  if (!this._aOriginalPRNodes) {
    this._aOriginalPRNodes = JSON.parse(JSON.stringify(
      aTreeData.filter(function (n) { return n.NodeType === "PR"; })
    ));
  }

  this._sPRColumnFilter = (sValue || "").trim();
  oVM.setProperty("/TreeData", this._getFilteredAndSortedPRNodes().concat(aSummary));
  oVM.refresh();
},

_getFilteredAndSortedPRNodes: function () {
  var aPRNodes = JSON.parse(JSON.stringify(this._aOriginalPRNodes || []));
  var sFilter = (this._sPRColumnFilter || "").toLowerCase();

  if (sFilter) {
    aPRNodes = aPRNodes.filter(function (n) {
      var bPrMatch = (n.PrNumber || "").toLowerCase().indexOf(sFilter) !== -1;
      var bItemMatch = (n.children || []).some(function (c) {
        return c.NodeType === "ITEM" && (
          (c.PrItem || "").toLowerCase().indexOf(sFilter) !== -1 ||
          String(parseInt(c.PrItem, 10)).indexOf(sFilter) !== -1
        );
      });
      return bPrMatch || bItemMatch;
    });
    aPRNodes.forEach(function (n) {
      if ((n.PrNumber || "").toLowerCase().indexOf(sFilter) !== -1) return;
      var aMatchingPrItems = (n.children || [])
        .filter(function (c) {
          return c.NodeType === "ITEM" && (
            (c.PrItem || "").toLowerCase().indexOf(sFilter) !== -1 ||
            String(parseInt(c.PrItem, 10)).indexOf(sFilter) !== -1
          );
        })
        .map(function (c) { return c.PrItem; });
      n.children = (n.children || []).filter(function (c) {
        return (c.NodeType === "ITEM" || c.NodeType === "DESC")
          ? aMatchingPrItems.indexOf(c.PrItem) !== -1
          : true;
      });
    });
  }

  var oSort = this._sPRColumnSort;
  if (oSort) {
    if (oSort.field === "PrItem") {
      aPRNodes.forEach(function (n) {
        var aItems = (n.children || []).filter(function (c) { return c.NodeType === "ITEM"; });
        var aDescs = (n.children || []).filter(function (c) { return c.NodeType === "DESC"; });
        aItems.sort(function (a, b) {
          var nA = parseInt(a.PrItem, 10), nB = parseInt(b.PrItem, 10);
          var cmp = (!isNaN(nA) && !isNaN(nB)) ? nA - nB : (a.PrItem || "").localeCompare(b.PrItem || "");
          return oSort.desc ? -cmp : cmp;
        });
        var aRebuilt = [];
        aItems.forEach(function (oItem) {
          aRebuilt.push(oItem);
          var oDesc = aDescs.find(function (d) { return d.PrItem === oItem.PrItem; });
          if (oDesc) aRebuilt.push(oDesc);
        });
        n.children = aRebuilt;
      });
    } else {
      aPRNodes.sort(function (a, b) {
        var sA = (a.PrNumber || "").toLowerCase(), sB = (b.PrNumber || "").toLowerCase();
        return oSort.desc ? sB.localeCompare(sA) : sA.localeCompare(sB);
      });
    }
  }

  return aPRNodes;
},

_clearPRSortFilter: function () {
  this._sPRColumnFilter = "";
  this._sPRColumnSort = null;
  if (this._aOriginalPRNodes) {
    var oVM = this.getView().getModel("view");
    var aTreeData = oVM.getProperty("/TreeData") || [];
    var aSummary = aTreeData.filter(function (n) { return n.NodeType === "SUMMARY"; });
    oVM.setProperty("/TreeData", this._aOriginalPRNodes.concat(aSummary));
    oVM.refresh();
    this._aOriginalPRNodes = null;
  }
  this._aOriginalTreeData = null;
},

_loadNfaSection1: function (oNfa, sNfaRefNo, oODataModel) {
  var oNfaModel = this.getView().getModel("nfaModel");
  var that = this;

  var sStatus = oNfa.Status || "";
  var mStateMap = { "Approved": "Success", "Rejected": "Error", "Approval Pending": "Warning", "Send for Approval": "Warning", "Pending": "Warning", "Draft": "None" };

  oNfaModel.setProperty("/header", {
    NfaRefNo:            oNfa.NfaRefNo            || "",
    AribaDocNo:          oNfa.AribaDocNo          || "",
    NfaTitle:            oNfa.NfaTitle            || "",
    NfaTypeDesc:         oNfa.NfaTypeDesc         || "",
    Status:              sStatus,
    StatusState:         mStateMap[sStatus]        || "None",
    BiDate:              oNfa.BiDate ? new Date(oNfa.BiDate) : null,
    CompanyDescription:  oNfa.CompanyDescription  || "",
    PurchaseOrgDesc:     oNfa.PurchaseOrgDesc     || "",
    PurchaseGroupDesc:   oNfa.PurchaseGroupDesc   || "",
    PlantDesc:           oNfa.PlantDesc           || "",
    PrBudget:            oNfa.PrBudget            || "",
    WbsBudget:           oNfa.WbsBudget           || "",
    CurrencyDesc:        oNfa.CurrencyDesc        || "",
    IncotermDesc:        oNfa.IncotermDesc        || "",
    TbdDate:             oNfa.TbdDate ? new Date(oNfa.TbdDate) : null,
    CreatedBy:           oNfa.CreatedBy           || "",
    Description:         oNfa.LongText            || "",
    LdClause:            oNfa.LdClause            || "",
    LdClauseAmt:         oNfa.LdClauseAmt         || "",
    AdvanceBg:           oNfa.AdvanceBg           || "",
    AdavanceBgAmt:       oNfa.AdavanceBgAmt       || "",
    PerformanceBg:       oNfa.PerformanceBg       || "",
    PerformanceBpAmt:    oNfa.PerformanceBpAmt    || "",
    Cpbg:                oNfa.Cpbg                || "",
    CpbgAmt:             oNfa.CpbgAmt             || "",
    OtherTerms:          oNfa.OtherTerms          || "",
    LowestBasis:         oNfa.LowestBasis         || "",
    TechAccepLowBasis:   oNfa.TechAccepLowBasis   || "",
    ProprietaryBasis:    oNfa.ProprietaryBasis    || "",
    SingleTenderBasis:   oNfa.SingleTenderBasis   || "",
    RepeatOrderBasis:    oNfa.RepeatOrderBasis    || "",
    RateContract:        oNfa.RateContract        || "",
    Regularization:      oNfa.Regularization      || "",
    FinalSettlement:     oNfa.FinalSettlement     || "",
    ProjectTeamRecommendation: oNfa.ProjectTeamRecommendation || "",
    JustificationRemarks: oNfa.JustificationRemarks || "",
    ScopeOfWork:         oNfa.ScopeOfWork         || "",
    AdditionalInfo:      oNfa.AdditionalInfo      || "",
    NegotiationStrategy: oNfa.NegotiationStrategy || ""
  });

  // Load vendors for Section 1
  oODataModel.read("/et_vendor_item_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oVData) {
      var aVendors = (oVData.results || []).map(function (item, i) {
        return {
          slNo: i + 1,
          vendorNo: item.VendorNo || "",
          vendorName: item.VendorName || "",
          technicalAcceptability: item.Ta || "",
          technicalRating: item.TechinicalRating || "",
          commercialRating: item.CommercialRating || "",
          vendorQualification: item.VendorQa || "",
          vendorQualificationScore: item.QualifScore || "",
          paymentTermsDesc: item.PaymentTermsDesc || item.PaymentTerms || "",
          netLandedCost: item.NetLandedCost || "",
          negNetCost: item.NegNetCost || "",
          poNo: item.PurchaseOrder || "",
          schedulingAgreementNo: item.SchlAgreementNo || "",
          contractNo: item.ContractNo || ""
        };
      });
      oNfaModel.setProperty("/vendors", aVendors);
    }
  });

  // Load approval data for Section 1 — grouped by Version → Phase
  oODataModel.read("/et_approval_dataSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    success: function (oApprData) {
      var oVersionMap = {}, aVersionOrder = [];
      (oApprData.results || []).forEach(function (o) {
        var sVer   = o.Version || "1";
        var sPhase = o.Phase   || "1";
        var sRaw   = o.StatusUpdatedOn || "";
        var sFormatted = sRaw.length === 8
          ? sRaw.substring(6, 8) + "-" + sRaw.substring(4, 6) + "-" + sRaw.substring(0, 4) : sRaw;
        var oRow = {
          Sno: o.Sno, SapId: o.SapId, SapName: o.SapName,
          RejectionRemarks: o.RejectionRemarks, StatusUpdatedOn: sFormatted,
          statusText: o.ApprovedRejectInfo === "A" ? "Approved" : o.ApprovedRejectInfo === "R" ? "Rejected" : "Pending",
          statusState: o.ApprovedRejectInfo === "A" ? "Success" : o.ApprovedRejectInfo === "R" ? "Error" : "Warning"
        };
        if (!oVersionMap[sVer]) { oVersionMap[sVer] = { phaseMap: {}, phaseOrder: [] }; aVersionOrder.push(sVer); }
        var oVer = oVersionMap[sVer];
        if (!oVer.phaseMap[sPhase]) { oVer.phaseMap[sPhase] = []; oVer.phaseOrder.push(sPhase); }
        oVer.phaseMap[sPhase].push(oRow);
      });
      aVersionOrder.sort(function (a, b) { return parseInt(a) - parseInt(b); });
      var aVersions = aVersionOrder.map(function (sVer) {
        var oVer = oVersionMap[sVer];
        oVer.phaseOrder.sort(function (a, b) { return parseInt(a) - parseInt(b); });
        return {
          versionLabel: "Version " + parseInt(sVer),
          phases: oVer.phaseOrder.map(function (p) {
            return { phaseLabel: "Phase " + p, rows: oVer.phaseMap[p] };
          })
        };
      });
      oNfaModel.setProperty("/approvalVersions", aVersions);
    }
  });

  // Load buyer attachments for Section 1
  oODataModel.read("/et_attachment_buyerSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    success: function (oBuyerData) {
      var aDocs = (oBuyerData.results || []).map(function (o, i) {
        return {
          slNo: i + 1,
          BuyerDocName: o.BuyerDocName || "",
          BuyerFileName: o.BuyerFileName || "",
          Check_box: o.Check_box || "",
          BuyerSpl: o.BuyerSpl || "",
          mimeType: o.BuyerDocMime || "",
          base64: o.BuyerFileData || null,
          status: "Uploaded",
          statusState: "Success"
        };
      });
      oNfaModel.setProperty("/buyerDocs", aDocs);
    }
  });
},

formatINR: function (val) {
  var n = parseFloat(val);
  if (isNaN(n) || n === 0) return "";
  return " " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
},

onOpenQcsfBuyerFile: function (oEvent) {
  var oCtx = oEvent.getSource().getBindingContext("nfaModel");
  var oData = oCtx.getObject();
  if (!oData.base64) { sap.m.MessageToast.show("File content not available."); return; }
  var sMime = oData.mimeType || "application/octet-stream";
  var sBinary = atob(oData.base64);
  var aBytes = new Uint8Array(sBinary.length);
  for (var i = 0; i < sBinary.length; i++) { aBytes[i] = sBinary.charCodeAt(i); }
  var sUrl = URL.createObjectURL(new Blob([aBytes], { type: sMime }));
  var oDialog = new sap.m.Dialog({
    title: oData.BuyerFileName,
    contentWidth: "80vw", contentHeight: "80vh",
    content: [new sap.ui.core.HTML({ content: "<iframe src='" + sUrl + "' style='width:100%;height:100%;border:none;'></iframe>" })],
    endButton: new sap.m.Button({ text: "Close", press: function () { oDialog.close(); } }),
    afterClose: function () { URL.revokeObjectURL(sUrl); oDialog.destroy(); }
  });
  this.getView().addDependent(oDialog);
  oDialog.open();
},

onDownloadQCSForm: function () {
  var oVM = this.getView().getModel("view");
  var sNfaRefNo = oVM.getProperty("/nfaRefNo") || "";
  var oODataModel = this.getOwnerComponent().getModel();
  var that = this;

  sap.ui.core.BusyIndicator.show(0);

  // Fetch latest backend data for ALL summary fields before building the download form
  oODataModel.read("/et_vendor_item_detailsSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    forceServerDataRequest: true,
    success: function (oSummaryData) {
      var aCurrentTree = oVM.getProperty("/TreeData") || [];

      (oSummaryData.results || []).forEach(function (oVendorRow) {
        var oVendor = that._vendors.find(function (v) { return v.VendorNo === oVendorRow.VendorNo; });
        if (!oVendor) return;
        var idx = oVendor.VendorIndex;

        var fPfPct  = parseFloat(oVendorRow.PfPercent)  || 0;
        var fGstPct = parseFloat(oVendorRow.GstPercentage) || 0;

        var mSummaryMap = {
          "P & F Charges (%)": { negPrice: fPfPct  > 0 ? String(fPfPct)  + "%" : "", finalPrice: oVendorRow.PfAmount,   negPriceTotal: oVendorRow.NegPFAmount },
          "Freight (Rs)":      { negPrice: oVendorRow.Freight,                        finalPrice: oVendorRow.Freight,    negPriceTotal: oVendorRow.NegFreight },
          "GST (%)":           { negPrice: fGstPct > 0 ? String(fGstPct) + "%" : "", finalPrice: oVendorRow.GstAmount,  negPriceTotal: oVendorRow.NegGstAmount },
          "Insurance":         { negPrice: oVendorRow.Insurance,                      finalPrice: oVendorRow.Insurance,  negPriceTotal: oVendorRow.NegInsurance },
          "Basic Amount Total":{ negPriceTotal: oVendorRow.NegBasicTotal },
          "Total Basic":       { negPriceTotal: oVendorRow.NegTotalBasic },
          "Net Landed Cost (Rs)": { negPriceTotal: oVendorRow.NegNetCost },
          "Commercial Loading":{ negPrice: oVendorRow.CommercialLoading, negPriceTotal: oVendorRow.CommercialLoading },
          "Loading Comments":  { loadingComments: oVendorRow.LoadingComments },
          "Total Amt with Comm. Loading": { negPriceTotal: oVendorRow.TotalCommLoading },
          "Commercial Rating": { singleValue: oVendorRow.CommercialRating }
        };

        aCurrentTree.forEach(function (row) {
          if (row.NodeType !== "SUMMARY") return;
          var oMap = mSummaryMap[row.Label];
          if (!oMap) return;
          if (oMap.finalPrice      !== undefined) row["v" + idx + "FinalPrice"]      = parseFloat(oMap.finalPrice)    || 0;
          if (oMap.negPrice        !== undefined) row["v" + idx + "NegPrice"]        = oMap.negPrice;
          if (oMap.negPriceTotal   !== undefined) row["v" + idx + "NegPriceTotal"]   = parseFloat(oMap.negPriceTotal) || 0;
          if (oMap.singleValue     !== undefined) row["v" + idx + "SingleValue"]     = oMap.singleValue || "";
          if (oMap.loadingComments !== undefined) row["v" + idx + "LoadingComments"] = oMap.loadingComments || "";
        });

        // Also update vendor delivery date in _vendors so _populateSummaryDefaults works correctly
        if (oVendorRow.DeliveryDate) {
          oVendor.deliveryDate = oVendorRow.DeliveryDate;
        }
      });

      // Recalculate FinalPrice chain from restored NegPrice values
      var aPRNodes = aCurrentTree.filter(function (n) { return n.NodeType === "PR"; });
      var oBasicRow      = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Basic Amount Total"; });
      var oTotalBasicRow = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Total Basic"; });
      var oPfRow         = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "P & F Charges (%)"; });
      var oGstRow        = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "GST (%)"; });
      var oFreightRow    = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Freight (Rs)"; });
      var oInsRow        = aCurrentTree.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Insurance"; });

      that._vendors.forEach(function (v) {
        var fBasic = parseFloat(oBasicRow ? oBasicRow["v" + v.VendorIndex + "FinalPrice"] : 0) || 0;
        if (oPfRow) {
          var fPf = parseFloat((oPfRow["v" + v.VendorIndex + "NegPrice"] || "0").toString().replace("%", "")) || 0;
          oPfRow["v" + v.VendorIndex + "FinalPrice"] = fBasic * fPf / 100;
        }
        if (oFreightRow) {
          oFreightRow["v" + v.VendorIndex + "FinalPrice"] = parseFloat(oFreightRow["v" + v.VendorIndex + "NegPrice"] || 0) || 0;
        }
        if (oInsRow) {
          oInsRow["v" + v.VendorIndex + "FinalPrice"] = parseFloat(oInsRow["v" + v.VendorIndex + "NegPrice"] || 0) || 0;
        }
        that._updateTotalBasic(aCurrentTree, v.VendorIndex);
        if (oGstRow) {
          var fTotalBasic = parseFloat(oTotalBasicRow ? oTotalBasicRow["v" + v.VendorIndex + "FinalPrice"] : 0) || 0;
          var fGst = parseFloat((oGstRow["v" + v.VendorIndex + "NegPrice"] || "0").toString().replace("%", "")) || 0;
          oGstRow["v" + v.VendorIndex + "FinalPrice"] = fTotalBasic * fGst / 100;
        }
        that._updateNetLandedCost(aCurrentTree, v.VendorIndex);
        that._updateTotalBasicNegPriceTotal(aCurrentTree, v.VendorIndex);
        that._updateNegPriceTotalForNetLanded(aCurrentTree, v.VendorIndex);
        that._updateTotalAmtWithCommLoading(aCurrentTree, v.VendorIndex);
      });
      that._calculateCommercialRating(aCurrentTree);

      // Ensure Delivery Date and Payment Terms are populated from latest vendor data
      that._populateSummaryDefaults();

      oVM.setProperty("/TreeData", aCurrentTree);
      sap.ui.core.BusyIndicator.hide();
      that._buildAndOpenQCSForm();
    },
    error: function () {
      sap.ui.core.BusyIndicator.hide();
      that._buildAndOpenQCSForm();
    }
  });
},

_buildAndOpenQCSForm: function () {
  var oVM = this.getView().getModel("view");
  var oNfaModel = this.getView().getModel("nfaModel");
  var oHeader = oNfaModel.getProperty("/header") || {};
  var aVendors = oNfaModel.getProperty("/vendors") || [];
  var aBuyerDocs = oNfaModel.getProperty("/buyerDocs") || [];
  var aApprovalPhases = oNfaModel.getProperty("/approvalPhases") || []; // kept for backward compat
  var aTreeData = oVM.getProperty("/TreeData") || [];
  var aQCSVendors = this._vendors || [];
  var sNfaRefNo = oVM.getProperty("/nfaRefNo") || "";
  var sVersion = oVM.getProperty("/nfaVersion") || "";

  var fnFmt = function (val) {
    var n = parseFloat(val);
    if (isNaN(n) || n === 0) return "";
    return " " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  var fnEsc = function (s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var fnDate = function (d) {
    if (!d) return "";
    var o = d instanceof Date ? d : new Date(d);
    if (isNaN(o.getTime())) return String(d);
    return String(o.getDate()).padStart(2, "0") + "." + String(o.getMonth() + 1).padStart(2, "0") + "." + o.getFullYear();
  };

  var fnSection = function (title, rows) {
    var sRows = rows.map(function (r) {
      return "<tr><td class='lbl'>" + fnEsc(r[0]) + "</td><td>" + fnEsc(r[1]) + "</td></tr>";
    }).join("");
    return "<div class='section'><div class='sec-title'>" + fnEsc(title) + "</div><table class='kv'>" + sRows + "</table></div>";
  };

  var fnTable = function (title, aHeaders, aRows) {
    var sTh = aHeaders.map(function (h) { return "<th>" + fnEsc(h) + "</th>"; }).join("");
    var sTrs = aRows.map(function (r) {
      return "<tr>" + r.map(function (c) { return "<td>" + fnEsc(c) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return "<div class='section'><div class='sec-title'>" + fnEsc(title) + "</div><table class='data'><thead><tr>" + sTh + "</tr></thead><tbody>" + sTrs + "</tbody></table></div>";
  };

  // ---- Section 1: Header Information ----
  var sHdr = fnSection("Header Information", [
    ["NFA Reference Number", oHeader.NfaRefNo],
    ["Ariba Document Number", oHeader.AribaDocNo],
    ["NFA Title", oHeader.NfaTitle],
    ["NFA Type", oHeader.NfaTypeDesc],
    ["Status", oHeader.Status]
  ]);

  // ---- Approval History ----
  var aApprovalVersions = oNfaModel.getProperty("/approvalVersions") || [];
  var sApproval = "";
  if (aApprovalVersions.length) {
    var sVersionHtml = aApprovalVersions.map(function (ver) {
      var sPhaseHtml = (ver.phases || []).map(function (phase) {
        var sRows = (phase.rows || []).map(function (r) {
          return "<tr><td>" + fnEsc(r.Sno) + "</td><td>" + fnEsc(r.SapId) + "</td><td>" + fnEsc(r.SapName) + "</td><td>" + fnEsc(r.statusText) + "</td><td>" + fnEsc(r.StatusUpdatedOn) + "</td><td style='word-wrap:break-word;white-space:normal;max-width:300px;'>" + fnEsc(r.RejectionRemarks) + "</td></tr>";
        }).join("");
        return "<div class='phase-label'>" + fnEsc(phase.phaseLabel) + "</div><table class='data'><thead><tr><th>Sno</th><th>User ID</th><th>User Name</th><th>Status</th><th>Updated On</th><th>Remarks</th></tr></thead><tbody>" + sRows + "</tbody></table>";
      }).join("");
      return "<div class='sec-title' style='background:#2E75B6;font-size:14px;padding:6px 10px;'>" + fnEsc(ver.versionLabel) + "</div>" + sPhaseHtml;
    }).join("");
    sApproval = "<div class='section'><div class='sec-title'>Approval History</div>" + sVersionHtml + "</div>";
  }

  // ---- Basic Information ----
  var sBasic = fnSection("Basic Information", [
    ["Date", fnDate(oHeader.BiDate)],
    ["Company Code", oHeader.CompanyDescription],
    ["Purchase Org", oHeader.PurchaseOrgDesc],
    ["Plant", oHeader.PlantDesc],
    ["Purchase Group", oHeader.PurchaseGroupDesc],
    ["PR Budget", oHeader.PrBudget],
    ["WBS Budget", oHeader.WbsBudget],
    ["Currency", oHeader.CurrencyDesc],
    ["Incoterms", oHeader.IncotermDesc],
    ["TBE Date", fnDate(oHeader.TbdDate)],
    ["Created By", oHeader.CreatedBy],
    ["Long Text", oHeader.Description]
  ]);

  // ---- Vendors Quoted ----
  var sVendors = fnTable("Vendors Quoted",
    ["Sl. No.", "Vendor", "Tech. Acceptability", "Technical Rating", "Commercial Rating", "Vendor Qualification", "Qualification Score", "Payment Terms", "PO Amount", "Vendor Quoted Amount", "PO Number", "Scheduling Agr. No.", "Contract Number"],
    aVendors.map(function (v) {
      return [v.slNo, v.vendorName, v.technicalAcceptability, v.technicalRating, v.commercialRating, v.vendorQualification, v.vendorQualificationScore, v.paymentTermsDesc, fnFmt(v.netLandedCost), fnFmt(v.negNetCost), v.poNo, v.schedulingAgreementNo, v.contractNo];
    })
  );

  // ---- Terms and Condition ----
  var sTerms = fnSection("Terms and Condition", [
    ["LD Clause", oHeader.LdClause], ["LD Clause %", oHeader.LdClauseAmt],
    ["Advance B.G.", oHeader.AdvanceBg], ["Advance B.G. %", oHeader.AdavanceBgAmt],
    ["Performance B.G.", oHeader.PerformanceBg], ["Performance B.G. %", oHeader.PerformanceBpAmt],
    ["CPBG", oHeader.Cpbg], ["CPBG %", oHeader.CpbgAmt],
    ["PO Header Text", oHeader.OtherTerms]
  ]);

  // ---- Justification For Price ----
  var aJustChecks = [
    ["Lowest Basis", oHeader.LowestBasis], ["Technically acceptable lowest basis", oHeader.TechAccepLowBasis],
    ["Proprietory basis", oHeader.ProprietaryBasis], ["Single Vendor basis", oHeader.SingleTenderBasis],
    ["Repeat order basis", oHeader.RepeatOrderBasis], ["Rate Contract", oHeader.RateContract],
    ["Regularization", oHeader.Regularization], ["Final Settlement", oHeader.FinalSettlement],
    ["Project team Recommendation basis", oHeader.ProjectTeamRecommendation]
  ];
  var sJustChecks = aJustChecks.map(function (c) {
    return "<span class='chk'>" + (c[1] === "X" ? "&#9745;" : "&#9744;") + " " + fnEsc(c[0]) + "</span>";
  }).join("");
  var sJust = "<div class='section'><div class='sec-title'>Justification For Price</div><div class='chk-grid'>" + sJustChecks + "</div>" +
    "<table class='kv'><tr><td class='lbl'>Remarks / Comments</td><td>" + fnEsc(oHeader.JustificationRemarks) + "</td></tr></table></div>";

  // ---- Special Remarks ----
  var sRemarks = fnSection("Special Remarks", [
    ["Scope of Work", oHeader.ScopeOfWork],
    ["Additional Information", oHeader.AdditionalInfo],
    ["Negotiation Strategy", oHeader.NegotiationStrategy]
  ]);

  // ---- Buyer Attachment ----
  var sBuyer = fnTable("Buyer Attachment",
    ["Sl. No.", "Buyer Doc Name", "File Name", "Attach to NFA", "SharePoint Link", "Status"],
    aBuyerDocs.map(function (d) {
      return [d.slNo, d.BuyerDocName, d.BuyerFileName, d.Check_box === "X" ? "Yes" : "No", d.BuyerSpl, d.status];
    })
  );

  // ---- QCS Vendor Comparison ----
  var aFixedCols = ["PR No./Short Text", "Item Code", "Remaining PR Qty", "UOM", "Plant", "Material Group", "Remaining Qty for PO Creation", "Unit LPP"];
  var aVendorCols = [];
  aQCSVendors.forEach(function (v) {
    aVendorCols.push(v.VendorName + "\nInit Price", v.VendorName + "\nNeg Price", v.VendorName + "\nNeg Price Total", v.VendorName + "\nOrdered QTY", v.VendorName + "\nOrder Value");
  });
  var aAllCols = aFixedCols.concat(aVendorCols);

  var aQCSRows = [];
  aTreeData.forEach(function (node) {
    if (node.NodeType === "PR") {
      aQCSRows.push([node.PrNumber, "", "", "", "", "", "", ""].concat(aQCSVendors.reduce(function (a) { return a.concat(["", "", "", "", ""]); }, [])));
      (node.children || []).forEach(function (item) {
        if (item.NodeType === "ITEM") {
          var aRow = [
            (item.PrItem ? item.PrItem + " / " : "") + (item.MaterialDesc || ""),
            item.Material, item.Qty, item.UOM, item.Plant, item.MaterialGroup,
            item.RemainingQty != null ? item.RemainingQty : item.Qty, item.UnitLpp
          ];
          aQCSVendors.forEach(function (v) {
            aRow.push(item["v" + v.VendorIndex + "InitPrice"] || "");
            aRow.push(item["v" + v.VendorIndex + "NegPrice"] || "");
            var fNPT = parseFloat(item["v" + v.VendorIndex + "NegPriceTotal"]);
            aRow.push(!isNaN(fNPT) && fNPT ? fnFmt(fNPT) : "");
            aRow.push(item["v" + v.VendorIndex + "SplitQty"] || "");
            var fFP = parseFloat(item["v" + v.VendorIndex + "FinalPrice"]);
            aRow.push(!isNaN(fFP) && fFP ? fnFmt(fFP) : "");
          });
          aQCSRows.push(aRow);
        }
      });
    } else if (node.NodeType === "SUMMARY") {
      var aSumRow = [node.Label, "", "", "", "", "", "", ""];
      aQCSVendors.forEach(function (v) {
        if (node.Label === "Loading Comments") {
          // Loading Comments: show in Init Price column (most visible), rest empty
          aSumRow.push(node["v" + v.VendorIndex + "LoadingComments"] || "");
          aSumRow.push("");
          aSumRow.push("");
          aSumRow.push("");
          aSumRow.push("");
        } else if (node.Label === "Delivery Date" || node.Label === "Payment Terms") {
          // Delivery Date / Payment Terms: show in Neg Price Total column
          aSumRow.push("");
          aSumRow.push("");
          aSumRow.push(node["v" + v.VendorIndex + "SingleValue"] || "");
          aSumRow.push("");
          aSumRow.push("");
        } else if (node.Label === "Commercial Rating") {
          // Commercial Rating: show in Neg Price Total column
          aSumRow.push("");
          aSumRow.push("");
          aSumRow.push(node["v" + v.VendorIndex + "SingleValue"] || "");
          aSumRow.push("");
          aSumRow.push("");
        } else {
          aSumRow.push(node["v" + v.VendorIndex + "NegPrice"] || "");
          aSumRow.push("");
          var fNPT = parseFloat(node["v" + v.VendorIndex + "NegPriceTotal"]);
          aSumRow.push(!isNaN(fNPT) && fNPT ? fnFmt(fNPT) : "");
          aSumRow.push("");
          var fFP = parseFloat(node["v" + v.VendorIndex + "FinalPrice"]);
          aSumRow.push(!isNaN(fFP) && fFP ? fnFmt(fFP) : "");
        }
      });
      aQCSRows.push(aSumRow);
    }
  });

  var sTh = aAllCols.map(function (h) { return "<th>" + fnEsc(h).replace("\n", "<br/>") + "</th>"; }).join("");
  var aFlatNodes = [];
  aTreeData.forEach(function (node) {
    if (node.NodeType === "PR") {
      aFlatNodes.push({ type: "PR", ref: node });
      (node.children || []).forEach(function (child) {
        if (child.NodeType === "ITEM") aFlatNodes.push({ type: "ITEM", ref: child });
      });
    } else if (node.NodeType === "SUMMARY") {
      aFlatNodes.push({ type: "SUMMARY", ref: node });
    }
  });
  var sTrs = aQCSRows.map(function (r, i) {
    var oFlat = aFlatNodes[i];
    var sClass = oFlat ? (oFlat.type === "PR" ? " class='pr-row'" : oFlat.type === "SUMMARY" ? " class='sum-row'" : " class='item-row'") : "";
    return "<tr" + sClass + ">" + r.map(function (c) { return "<td>" + fnEsc(c) + "</td>"; }).join("") + "</tr>";
  }).join("");
  var sQCS = "<div class='section'><div class='sec-title'>QCS \u2013 Vendor Comparison" + (sVersion ? " | Version " + sVersion : "") + "</div><table class='data qcs-table'><thead><tr>" + sTh + "</tr></thead><tbody>" + sTrs + "</tbody></table></div>";

  var sTitle = "QCS Form | NFA Ref: " + sNfaRefNo + (sVersion ? " | Version " + sVersion : "");

  var sCSS = [
    "@page { size: A4 landscape; margin: 12mm 10mm 10mm 10mm; }",
    "* { box-sizing: border-box; margin: 0; padding: 0; }",
    "body { font-family: 'SAP72', Arial, Helvetica, sans-serif; font-size: 12px; color: #000000; background: #FFFFFF; }",
    ".page-title { font-size: 22px; font-weight: bold; color: #000000; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 3px solid #1A6496; }",
    ".page-meta { font-size: 11px; color: #555555; margin-bottom: 16px; }",
    ".section { margin-bottom: 14px; page-break-inside: avoid; border: 1px solid #CCCCCC; }",
    ".sec-title { background: #1A6496; color: #FFFFFF; font-size: 16px; font-weight: bold; padding: 8px 10px; letter-spacing: 0.2px; }",
    ".phase-label { font-size: 12px; font-weight: bold; color: #1A6496; padding: 6px 10px 4px; background: #EEF5FB; border-bottom: 1px solid #CCCCCC; }",
    "table { border-collapse: collapse; width: 100%; background: #FFFFFF; }",
    ".kv td { border: 1px solid #CCCCCC; padding: 8px 10px; font-size: 12px; vertical-align: top; }",
    ".lbl { font-weight: bold; font-size: 12px; width: 200px; background: #D9E8F5; color: #000000; white-space: nowrap; }",
    ".data thead tr th { background: #D9E8F5; color: #000000; font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #CCCCCC; padding: 8px 10px; white-space: nowrap; }",
    ".data tbody tr td { background: #E8F4E8; color: #000000; font-size: 12px; border: 1px solid #CCCCCC; padding: 8px 10px; vertical-align: middle; }",
    ".data tbody tr:nth-child(even) td { background: #F4FAF4; }",
    ".chk-grid { display: flex; flex-wrap: wrap; gap: 6px 24px; padding: 8px 10px; background: #FAFAFA; border-bottom: 1px solid #CCCCCC; }",
    ".chk { font-size: 12px; color: #000000; }",
    ".qcs-table thead tr th { background: #D9E8F5; color: #000000; font-size: 10px; font-weight: bold; text-align: center; border: 1px solid #CCCCCC; padding: 6px 5px; white-space: normal; word-break: break-word; }",
    ".qcs-table tbody tr td { font-size: 10px; border: 1px solid #CCCCCC; padding: 5px; vertical-align: middle; background: #FFFFFF; }",
    ".qcs-table .pr-row td { background: #1A6496; color: #FFFFFF; font-weight: bold; font-size: 11px; }",
    ".qcs-table .item-row td { background: #FFFFFF; color: #000000; }",
    ".qcs-table .sum-row td { background: #E8F4E8; color: #000000; font-weight: bold; }",
    "@media print { .section { page-break-inside: avoid; } }"
  ].join(" ");

  // var sHtml = "<!DOCTYPE html>" +
  //   "<html><head><meta charset='UTF-8'/><title>" + fnEsc(sTitle) + "</title>" +
  //   "<style>" + sCSS + "</style></head><body>" +
  //   "<div class='page-title'>" + fnEsc(sTitle) + "</div>" +
  //   "<div class='page-meta'>Generated on: " + new Date().toLocaleDateString("en-IN") + "</div>" +
  //   sHdr + sApproval + sBasic + sVendors + sTerms + sJust + sRemarks + sBuyer + sQCS +
  //   "</body></html>";

  // var oPrintWin = window.open("", "_blank", "width=1400,height=900");
  // if (!oPrintWin) { sap.m.MessageToast.show("Please allow popups to download the PDF."); return; }
  // oPrintWin.document.write(sHtml);
  // oPrintWin.document.close();
  // oPrintWin.focus();
  // oPrintWin.onload = function () { oPrintWin.print(); };
    var fnBuildAndPrint = function (oDraftData) {
    var sDraftForm = "";
    var oLCRow = aTreeData.find(function (r) { return r.NodeType === "SUMMARY" && r.Label === "Loading Comments"; });
    var aLCRows = aQCSVendors.reduce(function (acc, v) {
      var s = oLCRow ? (oLCRow["v" + v.VendorIndex + "LoadingComments"] || "") : "";
      if (s) acc.push(["Loading Comments (" + v.VendorName + ")", s]);
      return acc;
    }, []);
    if (oDraftData) {
      var fnFmtAmt = function (val) {
        var n = parseFloat(val);
        if (isNaN(n) || n === 0) return "";
        return " " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };
      sDraftForm = fnSection("NFA Summary", [
        ["Discipline",                  oDraftData.Discipline           || ""],
        ["PO Type",                     oDraftData.PoType               || ""],
        ["Vendor Assessment",           oDraftData.VendorAssessment     || ""],
        ["Awarded Vendor",              oDraftData.VendorName           || ""],
        ["Currency",                    oDraftData.Currency             || ""],
        ["Budgeted Amount",             fnFmtAmt(oDraftData.BudgetedAmount)],
        ["LPP",                         fnFmtAmt(oDraftData.LppAmount)],
        ["ICE",                         fnFmtAmt(oDraftData.IceAmount)],
        ["Total Basic",                 fnFmtAmt(oDraftData.TotalBasic  || oDraftData.TotalBasicAmount)],
        ["GST Amount",                  fnFmtAmt(oDraftData.GstAmount)],
        ["Purchase Order (PO) Amount",  fnFmtAmt(oDraftData.CurrentPoAmt || oDraftData.PoAmount)],
        ["Net Impact",                  fnFmtAmt(oDraftData.NetImpact)],
        ["Previous PO Amount",          fnFmtAmt(oDraftData.PrevPoAmt)],
        ["Original PO Amount",          fnFmtAmt(oDraftData.OrginalPoAmt)],
        ["Contract Effective Date",     oDraftData.ContractEffDate      || ""],
        ["Contract Delivery Date",      oDraftData.ContractDelivDate    || ""],
        ["Mobilization Date",           oDraftData.MobilizationDate     || ""],
        ["Impact on Schedule",          oDraftData.ImpactOnSchedule     || ""],
        ["Impact Remarks",              oDraftData.ImpactRemarks        || ""],
        ["WBS Information",             oDraftData.WbsInfo              || ""],
        ["Incoterm",                    oDraftData.Incoterm             || ""],
        ["Deviation on Commercial Terms", oDraftData.DeviationComments  || oDraftData.DeviationOnCommTerms || ""],
        ["Special Commercial Terms",    oDraftData.SpecialCommTerms     || ""],
        ["Recommendation",              oDraftData.Recommendation       || ""],
        ["Additional Information",      oDraftData.AdditionalInfo       || ""],
        ["Reason for Amendment",        oDraftData.AmendedReason        || ""]
      ].concat(aLCRows));
    } else if (aLCRows.length) {
      sDraftForm = fnSection("Loading Comments", aLCRows);
    }

    var sHtml = "<!DOCTYPE html>" +
      "<html><head><meta charset='UTF-8'/><title>" + fnEsc(sTitle) + "</title>" +
      "<style>" + sCSS + "</style></head><body>" +
      "<div class='page-title'>" + fnEsc(sTitle) + "</div>" +
      "<div class='page-meta'>Generated on: " + new Date().toLocaleDateString("en-IN") + "</div>" +
      sHdr + sApproval + sBasic + sVendors + sTerms + sJust + sRemarks + sBuyer + sDraftForm + sQCS +
      "</body></html>";

    var oPrintWin = window.open("", "_blank", "width=1400,height=900");
    if (!oPrintWin) { sap.m.MessageToast.show("Please allow popups to download the PDF."); return; }
    oPrintWin.document.write(sHtml);
    oPrintWin.document.close();
    oPrintWin.focus();
    oPrintWin.onload = function () { oPrintWin.print(); };
  };

  // Fetch approval form data + search help descriptions, then build HTML
  var oModel = this.getOwnerComponent().getModel();
  oModel.read("/et_approval_formSet", {
    filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
    success: function (oData) {
      var oDraftRaw = (oData.results || [])[0] || null;
      if (!oDraftRaw) { fnBuildAndPrint(null); return; }

      // Resolve Discipline and PoType descriptions from search help
      var sDisciplineCode = oDraftRaw.Discipline || "";
      var sPoTypeCode     = oDraftRaw.PoType     || "";
      var oDraftResolved  = JSON.parse(JSON.stringify(oDraftRaw));

      var mDisc = {}, mPo = {};
      var fnAfterBoth = function () {
        if (sDisciplineCode) oDraftResolved.Discipline = mDisc[sDisciplineCode] || sDisciplineCode;
        if (sPoTypeCode)     oDraftResolved.PoType     = mPo[sPoTypeCode]        || sPoTypeCode;
        fnBuildAndPrint(oDraftResolved);
      };

      oModel.read("/et_nfa_search_helpSet", {
        filters: [new Filter("Type", FilterOperator.EQ, "DISCIPLINE")],
        success: function (oSH) {
          (oSH.results || []).forEach(function (r) { mDisc[r.KeyDataType] = r.Description; });
          oModel.read("/et_nfa_search_helpSet", {
            filters: [new Filter("Type", FilterOperator.EQ, "PO_TYPE")],
            success: function (oSH2) {
              (oSH2.results || []).forEach(function (r) { mPo[r.KeyDataType] = r.Description; });
              fnAfterBoth();
            },
            error: fnAfterBoth
          });
        },
        error: function () {
          oModel.read("/et_nfa_search_helpSet", {
            filters: [new Filter("Type", FilterOperator.EQ, "PO_TYPE")],
            success: function (oSH2) {
              (oSH2.results || []).forEach(function (r) { mPo[r.KeyDataType] = r.Description; });
              fnAfterBoth();
            },
            error: fnAfterBoth
          });
        }
      });
    },
    error: function () {
      fnBuildAndPrint(null);
    }
  });
},

onOpenQCSForm: function () {
  var oVM = this.getView().getModel("view");
  var sNfaRefNo = oVM.getProperty("/nfaRefNo") || "";
  var sMode = oVM.getProperty("/mode") || "approved";
  this.getOwnerComponent().getRouter().navTo("RouteQCSF", {
    mode: sMode,
    nfaRefNo: sNfaRefNo
  });
},

  // Start: added by SI2 Tech - closes Object.assign({}, PoHistory, { ... })
  }));
  // End: added by SI2 Tech
});
 
