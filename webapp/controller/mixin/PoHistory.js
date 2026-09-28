/**
 * QCS page - PO info icons (mixed into QCS.controller.js via Object.assign).
 *   Unit LPP ⓘ          -> the PO the Unit LPP came from (NFA plant, highlighted) and the last PO
 *                          of the material from that PO's vendor in every other plant (QueryType 'LPP')
 *   Negotiated Price ⓘ  -> last 10 POs for material + vendor + plant (QueryType 'VENDOR')
 * Reads the read-only entity set /et_po_histSet.
 */
sap.ui.define([
  "sap/ui/core/Fragment",
  "sap/m/Button",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Fragment, Button, JSONModel, Filter, FilterOperator) {
  "use strict";

  return {

    /* ---------- Unit LPP ⓘ (press handler set in QCS.view.xml) ---------- */
    onLppInfoPress: function (oEvent) {
      var oSource = oEvent.getSource();
      var oItem = oSource.getBindingContext("view").getObject();
      var fLpp = parseFloat(oItem.UnitLpp) || 0;

      this._openPoHistory(oSource, {
        mode: "LPP",
        title: "Unit LPP source – " + (oItem.MaterialDesc || oItem.Material),
        subtitle: "Item " + (oItem.Material || "") + " · Plant " + (oItem.Plant || "") + " · Unit LPP " + this._poFmt(fLpp)
      }, [
        new Filter("QueryType", FilterOperator.EQ, "LPP"),
        new Filter("Material", FilterOperator.EQ, oItem.Material || ""),
        new Filter("Plant", FilterOperator.EQ, oItem.Plant || ""),
        new Filter("NetPrice", FilterOperator.EQ, String(fLpp))
      ], oItem);
    },

    /* ---------- Negotiated Price ⓘ (button created in _addVendorColumns) ---------- */
    _createNegPriceInfoIcon: function (oVendor) {
      return new Button({
        icon: "sap-icon://hint",
        type: "Transparent",
        tooltip: "Last 10 POs for this material and plant from " + (oVendor.VendorName || "this vendor"),
        visible: "{= ${view>NodeType} === 'ITEM' && !!${view>Material} && !!${view>Plant} }",
        press: this.onNegPriceInfoPress.bind(this, oVendor)
      });
    },

    onNegPriceInfoPress: function (oVendor, oEvent) {
      var oSource = oEvent.getSource();
      var oItem = oSource.getBindingContext("view").getObject();
      var sNfaRefNo = this.getView().getModel("view").getProperty("/nfaRefNo") || "";
      var aFilters = [
        new Filter("QueryType", FilterOperator.EQ, "VENDOR"),
        new Filter("Material", FilterOperator.EQ, oItem.Material || ""),
        new Filter("Plant", FilterOperator.EQ, oItem.Plant || ""),
        new Filter("VendorNo", FilterOperator.EQ, oVendor.VendorNo || "")
      ];
      if (sNfaRefNo) {
        aFilters.push(new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo));
      }
      this._openPoHistory(oSource, {
        mode: "VENDOR",
        title: "Last POs – " + (oVendor.VendorName || oVendor.VendorNo),
        subtitle: "Item " + (oItem.Material || "") + " – " + (oItem.MaterialDesc || "") +
          " · Plant " + (oItem.Plant || "") + " · Vendor " + this._poStrip(oVendor.VendorNo)
      }, aFilters, oItem);
    },

    onPoHistoryClose: function () {
      if (this._oPoHistPopover) { this._oPoHistPopover.close(); }
    },

    /* ---------- shared ---------- */
    _openPoHistory: function (oOpener, oHeader, aFilters, oItem) {
      var that = this;
      if (!this._oPoHistModel) {
        this._oPoHistModel = new JSONModel();
        // Start: added by SI2 Tech - a JSONModel shows only 100 list entries by default;
        // one PO can have hundreds of items, so lift the limit for the popup table
        this._oPoHistModel.setSizeLimit(100000);
        // End: added by SI2 Tech
      }
      this._oPoHistModel.setData(Object.assign({
        busy: true, rows: [], po: null, note: "", noteType: "Information", noData: "Loading...",
        caption: "" // SI2 Tech: Unit LPP popup - line above the plant table
      }, oHeader));

      this._getPoHistPopover().then(function (oPopover) {
        oPopover.openBy(oOpener);
        that._readPoHistory(oHeader.mode, aFilters, oItem);
      });
    },

    _getPoHistPopover: function () {
      var that = this;
      if (!this._pPoHistPopover) {
        this._pPoHistPopover = Fragment.load({
          id: this.getView().getId(),
          name: "com.df.nfa.creator_v2.view.fragments.PoHistoryPopover",
          controller: this
        }).then(function (oPopover) {
          that.getView().addDependent(oPopover);
          oPopover.setModel(that._oPoHistModel, "po");
          that._oPoHistPopover = oPopover;
          return oPopover;
        });
      }
      return this._pPoHistPopover;
    },

    // true once the backend entity set et_po_histSet is in ZNFA_SRV's $metadata
    _isPoHistAvailable: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oMeta = oModel && oModel.getServiceMetadata && oModel.getServiceMetadata();
      if (!oMeta || !oMeta.dataServices) { return false; }
      return (oMeta.dataServices.schema || []).some(function (oSchema) {
        return (oSchema.entityContainer || []).some(function (oContainer) {
          return (oContainer.entitySet || []).some(function (oSet) { return oSet.name === "et_po_histSet"; });
        });
      });
    },

    _readPoHistory: function (sMode, aFilters, oItem) {
      var that = this;
      var oM = this._oPoHistModel;

      // Frontend is deployed ahead of the backend: until et_po_histSet exists, say so instead of failing
      if (!this._isPoHistAvailable()) {
        oM.setProperty("/note", "PO details will be available once the backend update for this feature is deployed.");
        oM.setProperty("/noteType", "Information");
        oM.setProperty("/noData", "Nothing to show yet.");
        oM.setProperty("/busy", false);
        return;
      }

      this.getOwnerComponent().getModel().read("/et_po_histSet", {
        filters: aFilters,
        success: function (oData) {
          var aRows = (oData.results || []).slice().sort(function (a, b) {
            return (parseInt(a.Seq, 10) || 0) - (parseInt(b.Seq, 10) || 0);
          }).map(that._poDecorate.bind(that));

          var sNote = "", sType = "Information";
          if (sMode === "LPP") {
            var oPo = aRows[0] || null;
            var fLpp = parseFloat(oItem.UnitLpp) || 0;
            if (!oPo) {
              sNote = "No purchase order found for this material in plant " + (oItem.Plant || "") +
                ". The Unit LPP was entered manually.";
              sType = "Warning";
            //} else if (oPo.MatchType === "PRICE") {
            //  sNote = "A newer PO has been posted since this PR was pulled. Shown is the latest PO at the Unit LPP price.";
            } else if (oPo.MatchType === "NO_MATCH") {
              sNote = "No PO for this material and plant has the price " + that._poFmt(fLpp) +
                ". Shown is the current last PO. The Unit LPP may have been entered manually or the PO price has changed.";
              sType = "Warning";
            }
            oM.setProperty("/po", oPo);
            // Start: added by SI2 Tech - Unit LPP popup as a plant table
            // Seq 1 = the Unit LPP source PO of the NFA plant; the other rows are the last PO of this
            // material from the same vendor in the other plants (newest first)
            var sNfaPlant = String(oItem.Plant || "").trim();
            aRows.forEach(function (r) {
              r.isNfaPlant = String(r.Plant || "").trim() === sNfaPlant;
              r.plantNameText = r.PlantName || "";
            });
            if (oPo) {
              oM.setProperty("/caption", "Last PO of this material from " + (oPo.VendorName || oPo.vendorNoText) +
                " in each plant that bought it from this vendor. The NFA plant is highlighted.");
            }
            // End: added by SI2 Tech
          } else if (!aRows.length) {
            sNote = "No previous purchase orders for this material from this vendor in plant " + (oItem.Plant || "") + ".";
          } else {
            // Start: added by SI2 Tech - 10 POs (not 10 lines): one row per PO, PO items in a drop down
            aRows = that._poGroupByPo(aRows);
            // End: added by SI2 Tech
          }

          oM.setProperty("/rows", aRows);
          oM.setProperty("/note", sNote);
          oM.setProperty("/noteType", sType);
          oM.setProperty("/noData", "No purchase orders found.");
          oM.setProperty("/busy", false);
        },
        error: function () {
          oM.setProperty("/rows", []);
          oM.setProperty("/po", null);
          oM.setProperty("/note", "Could not load the purchase orders. Please try again.");
          oM.setProperty("/noteType", "Error");
          oM.setProperty("/noData", "Nothing to show.");
          oM.setProperty("/busy", false);
        }
      });
    },

    // Start: added by SI2 Tech - Negotiated Price popup: group the backend lines by PO
    // Backend returns up to 10 POs; Seq = PO rank, several items of one PO share the same Seq.
    // A PO with PO_EXPAND_MIN_ITEMS or more items gets a drop down (collapsed), otherwise it is one row.
    PO_EXPAND_MIN_ITEMS: 2,

    _poGroupByPo: function (aLines) {
      var that = this;
      var aOrder = [], mGroups = {};
      aLines.forEach(function (r) {
        var sKey = r.PoNo;
        if (!mGroups[sKey]) { mGroups[sKey] = []; aOrder.push(sKey); }
        mGroups[sKey].push(r);
      });

      var aOut = [];
      aOrder.forEach(function (sKey) {
        var aItems = mGroups[sKey];
        var oFirst = aItems[0];
        if (aItems.length < that.PO_EXPAND_MIN_ITEMS) {
          aItems.forEach(function (r) {
            aOut.push(Object.assign({}, r, { kind: "PO", expandable: false, expanded: false, visible: true, itemsText: "" }));
          });
          return;
        }
        // PO header row: price when all items have the same unit price, else the range; qty summed when one UoM
        var aUnit = aItems.map(function (r) { return (parseFloat(r.NetPrice) || 0) / (parseFloat(r.PriceUnit) || 1); });
        var fMin = Math.min.apply(null, aUnit), fMax = Math.max.apply(null, aUnit);
        var bOneUom = aItems.every(function (r) { return r.Uom === oFirst.Uom; });
        var fQty = aItems.reduce(function (s, r) { return s + (parseFloat(r.PoQty) || 0); }, 0);
        aOut.push({
          kind: "PO", expandable: true, expanded: false, visible: true,
          PoNo: sKey, poText: sKey, itemsText: aItems.length + " items",
          dateText: oFirst.dateText, VendorName: oFirst.VendorName, vendorNoText: oFirst.vendorNoText,
          priceText: Math.abs(fMax - fMin) < 0.005 ? that._poFmt(fMin) : that._poFmt(fMin) + " – " + that._poFmt(fMax),
          priceUnitText: (oFirst.Currency || "") + " / " + (bOneUom ? (oFirst.Uom || "unit") : "unit"),
          qtyText: bOneUom ? that._poFmt(fQty, 3) : "",
          Uom: bOneUom ? oFirst.Uom : ""
        });
        aItems.forEach(function (r) {
          aOut.push(Object.assign({}, r, {
            kind: "ITEM", parent: sKey, expandable: false, expanded: false, visible: false,
            poText: "Item " + (parseInt(r.PoItem, 10) || r.PoItem), itemsText: "",
            dateText: "", VendorName: "", vendorNoText: ""
          }));
        });
      });
      return aOut;
    },

    onPoHistToggle: function (oEvent) {
      var oRow = oEvent.getSource().getBindingContext("po").getObject();
      oRow.expanded = !oRow.expanded;
      (this._oPoHistModel.getProperty("/rows") || []).forEach(function (r) {
        if (r.kind === "ITEM" && r.parent === oRow.PoNo) { r.visible = oRow.expanded; }
      });
      this._oPoHistModel.refresh(true);
    },
    // End: added by SI2 Tech

    _poDecorate: function (r) {
      var fPriceUnit = parseFloat(r.PriceUnit) || 1;
      return Object.assign({}, r, {
        poText: r.PoNo + " / " + (parseInt(r.PoItem, 10) || r.PoItem),
        dateText: this._poDate(r.PoDate),
        vendorNoText: this._poStrip(r.VendorNo),
        vendorText: (r.VendorName || "") + " (" + this._poStrip(r.VendorNo) + ")",
        priceText: this._poFmt(r.NetPrice),
        priceUnitText: (r.Currency || "") + (fPriceUnit !== 1 ? " / " + fPriceUnit + " " + (r.Uom || "") : ""),
        qtyText: this._poFmt(r.PoQty, 3)
      });
    },

    _poStrip: function (s) {
      return String(s || "").replace(/^0+(?=.)/, "");
    },

    _poFmt: function (v, iDec) {
      var n = parseFloat(v);
      if (isNaN(n)) { return ""; }
      var d = iDec === undefined ? 2 : iDec;
      return n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
    },

    _poDate: function (d) {
      if (!d) { return ""; }
      var o = d instanceof Date ? d : new Date(d);
      if (isNaN(o.getTime())) { return String(d); }
      // Edm.DateTime arrives as UTC midnight - UTC parts keep the day stable
      return String(o.getUTCDate()).padStart(2, "0") + "." +
             String(o.getUTCMonth() + 1).padStart(2, "0") + "." + o.getUTCFullYear();
    }
  };
});