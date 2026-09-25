sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageToast", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"],
    function (Controller, JSONModel, MessageToast, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("com.df.nfa.creator_v2.controller.nfaReport", {

            onInit: function () {
                var oReportModel = new JSONModel({ items: [] });
                this.getView().setModel(oReportModel, "reportModel");
            },

            onBack: function () {
                this.getOwnerComponent().getRouter().navTo("RoutenfaCreator", {}, true);
            },

            onSearch: function () {
                var sPlant         = this.byId("filterPlant").getValue().trim();
                var sNfaNo         = this.byId("filterNfaNo").getValue().trim();
                var sStatus        = this.byId("filterStatus").getSelectedKey();
                var sPurchaseGroup = this.byId("filterPurchaseGroup").getValue().trim();
                var oDateFrom      = this.byId("filterDateFrom").getDateValue();
                var oDateTo        = this.byId("filterDateTo").getDateValue();

                var aFilters = [];
                if (sPlant)         { aFilters.push(new Filter("Plant", FilterOperator.EQ, sPlant)); }
                if (sNfaNo)         { aFilters.push(new Filter("NfaRefNo", FilterOperator.Contains, sNfaNo)); }
                if (sStatus)        { aFilters.push(new Filter("Status", FilterOperator.EQ, sStatus)); }
                if (sPurchaseGroup) { aFilters.push(new Filter("PurchaseGroup", FilterOperator.EQ, sPurchaseGroup)); }
                if (oDateFrom)      { aFilters.push(new Filter("BiDate", FilterOperator.GE, oDateFrom)); }
                if (oDateTo) {
                    var oEndOfDay = new Date(oDateTo);
                    oEndOfDay.setHours(23, 59, 59, 999);
                    aFilters.push(new Filter("BiDate", FilterOperator.LE, oEndOfDay));
                }

                sap.ui.core.BusyIndicator.show(0);
                var that = this;
                this.getOwnerComponent().getModel().read("/et_nfa_detailsSet", {
                    filters: aFilters,
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        var aItems = (oData.results || []).map(function (o) {
                            var oDate = o.BiDate ? new Date(o.BiDate) : null;
                            return {
                                NfaRefNo:          o.NfaRefNo         || "",
                                NfaTitle:          o.NfaTitle         || "",
                                Plant:             o.Plant            || "",
                                PlantDesc:         o.PlantDesc        || o.Plant || "",
                                PurchaseOrg:       o.PurchaseOrg      || "",
                                PurchaseOrgDesc:   o.PurchaseOrgDesc  || o.PurchaseOrg || "",
                                PurchaseGroup:     o.PurchaseGroup    || "",
                                PurchaseGroupDesc: o.PurchaseGroupDesc|| o.PurchaseGroup || "",
                                CompanyCode:       o.CompanyCode      || "",
                                CompanyDescription:o.CompanyDescription || o.CompanyCode || "",
                                Currency:          o.Currency         || "",
                                CurrencyDesc:      o.CurrencyDesc     || o.Currency || "",
                                Status:            o.Status           || "",
                                StatusState:       that._getStatusState(o.Status),
                                BiDateFormatted:   oDate ? oDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""
                            };
                        });
                        that.getView().getModel("reportModel").setProperty("/items", aItems);
                        if (!aItems.length) { MessageToast.show("No records found for the selected filters."); }
                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Failed to load report data.");
                    }
                });
            },

            onReset: function () {
                this.byId("filterPlant").setValue("");
                this.byId("filterNfaNo").setValue("");
                this.byId("filterStatus").setSelectedKey("");
                this.byId("filterPurchaseGroup").setValue("");
                this.byId("filterDateFrom").setValue("");
                this.byId("filterDateTo").setValue("");
                this.getView().getModel("reportModel").setProperty("/items", []);
            },

            onExport: function () {
                var aItems = this.getView().getModel("reportModel").getProperty("/items");
                if (!aItems || !aItems.length) {
                    MessageToast.show("No data to export.");
                    return;
                }

                var aColumns = [
                    { label: "File Note No.",   property: "NfaRefNo" },
                    { label: "NFA Title",        property: "NfaTitle" },
                    { label: "Plant",            property: "PlantDesc" },
                    { label: "Purchase Org",     property: "PurchaseOrgDesc" },
                    { label: "Purchase Group",   property: "PurchaseGroupDesc" },
                    { label: "Company Code",     property: "CompanyDescription" },
                    { label: "Currency",         property: "CurrencyDesc" },
                    { label: "Status",           property: "Status" },
                    { label: "Created On",       property: "BiDateFormatted" }
                ];

                sap.ui.require(["sap/ui/export/Spreadsheet"], function (Spreadsheet) {
                    var oSettings = {
                        workbook: {
                            columns: aColumns.map(function (col) {
                                return { label: col.label, property: col.property, type: "String" };
                            })
                        },
                        dataSource: aItems,
                        fileName: "NFA_Report_" + new Date().toISOString().slice(0, 10) + ".xlsx"
                    };
                    new Spreadsheet(oSettings).build().then(function () {
                        MessageToast.show("Export successful.");
                    });
                });
            },

            _getStatusState: function (sStatus) {
                var mMap = {
                    "Draft": "None", "Approval Pending": "Warning", "Send for Approval": "Warning",
                    "Pending": "Warning", "Approved": "Success", "Rejected": "Error",
                    "PO Created": "Success", "PO, Contract Created": "Success",
                    "Contract, SA Created": "Success", "PO, SA Created": "Success", "Completed": "Success"
                };
                return mMap[sStatus] || "None";
            }
        });
    }
);
