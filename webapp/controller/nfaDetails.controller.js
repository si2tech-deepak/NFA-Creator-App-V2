sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageBox, MessageToast, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("com.df.nfa.creator_v2.controller.nfaDetails", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RoutenfaDetails").attachPatternMatched(this._onObjectMatched, this);

            this.getView().setModel(new JSONModel({
                header: {},
                vendors: [],
                vendorPR: [],
                isEditMode: false,
                editVisible: true
            }), "viewModel");

            this.getView().setModel(new JSONModel({ items: [] }), "buyerDocs");
            this.getView().setModel(new JSONModel({ items: [] }), "supplierDocs");
        },

        _onObjectMatched: function (oEvent) {
            var sEventId = oEvent.getParameter("arguments").eventId;
            this._sCurrentEventId = sEventId;
            // Reset to view mode on every navigation
            this.getView().getModel("viewModel").setProperty("/isEditMode", false);
            this._loadNFADetails(sEventId);
        },

        _loadNFADetails: function (sEventId) {
            var that = this;
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("viewModel");

            oModel.read("/et_nfa_detailsSet", {
                filters: [new Filter("NfaRefNo", FilterOperator.EQ, sEventId)],
                success: function (oData) {
                    if (!oData.results || !oData.results.length) {
                        MessageBox.error("No NFA found for: " + sEventId);
                        return;
                    }
                    var o = oData.results[0];
                    var bEditAllowed = o.Status !== "Approval Pending" && o.Status !== "Pending";
                    oViewModel.setProperty("/editVisible", bEditAllowed);
                    oViewModel.setProperty("/header", {
                        PoNo: o.NfaRefNo,
                        AribaDocNo: o.AribaDocNo,
                        NfaType: o.NfaType,
                        NfaTypeDesc: o.NfaTypeDesc,
                        NfaTitle: o.NfaTitle,
                        Status: o.Status,
                        StatusState: that._getStatusState(o.Status),
                        BiDate: o.BiDate ? new Date(o.BiDate) : null,
                        PurchaseOrg: o.PurchaseOrg,
                        PurchaseOrgDesc: o.PurchaseOrgDesc,
                        PurchaseGroup: o.PurchaseGroup,
                        PurchaseGroupDesc: o.PurchaseGroupDesc,
                        CompanyCode: o.CompanyCode,
                        CompanyDescription: o.CompanyDescription,
                        PrBudget: o.PrBudget,
                        WbsBudget: o.WbsBudget,
                        Description: o.LongText,
                        Remarks: o.Remarks,
                        LdClause: o.LdClause,
                        AdvanceBg: o.AdvanceBg,
                        AdavanceBgAmt: o.AdavanceBgAmt,
                        PerformanceBg: o.PerformanceBg,
                        PerformanceBpAmt: o.PerformanceBpAmt,
                        LowestBasis: o.LowestBasis,
                        TechAccepLowBasis: o.TechAccepLowBasis,
                        ProprietaryBasis: o.ProprietaryBasis,
                        SingleTenderBasis: o.SingleTenderBasis,
                        RepeatOrderBasis: o.RepeatOrderBasis,
                        RateContract: o.RateContract,
                        JustificationRemarks: o.JustificationRemarks,
                        ScopeOfWork: o.ScopeOfWork,
                        AdditionalInfo: o.AdditionalInfo,
                        NegotiationStrategy: o.NegotiationStrategy,
                        VendorCategory: o.VendorCategory
                    });
                    that._loadVendors(sEventId);
                    that._loadVendorPR(sEventId);
                },
                error: function (oError) {
                    var sMsg = "Failed to load NFA details";
                    try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) {}
                    MessageBox.error(sMsg);
                }
            });
        },

        _loadVendors: function (sEventId) {
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("viewModel");

            oModel.read("/et_vendor_item_detailsSet", {
                filters: [new Filter("NfaRefNo", FilterOperator.EQ, sEventId)],
                success: function (oData) {
                    var aVendors = (oData.results || []).map(function (v, i) {
                        return {
                            slNo: i + 1,
                            vendorNo: v.VendorNo,
                            vendorName: v.VendorName,
                            plant: v.Plant,
                            initialPrice: v.InitialPrice,
                            negotiatedAmount: v.NegotiatedPrice,
                            totalPrice: v.TotalPrice,
                            lpp: v.Lpp,
                            technicalAcceptability: v.Ta,
                            vendorQualification: v.VendorQa,
                            gstCredit: v.GstCredit,
                            gstRemarks: v.GstRemarks,
                            deliveryRemarks: v.DeliveryRemarks,
                            basicTotalAmt: v.BasicTotalAmt,
                            pfPercent: v.PfPercent,
                            pfAmount: v.PfAmount,
                            freight: v.Freight,
                            gstPercentage: v.GstPercentage,
                            gstAmount: v.GstAmount,
                            insurance: v.Insurance,
                            netLandedCost: v.NetLandedCost,
                            commercialRating: v.CommercialRating,
                            deliveryDate: v.DeliveryDate,
                            PaymentTerms: v.PaymentTerms,
                            PaymentTermsDesc: v.PaymentTermsDesc
                        };
                    });
                    oViewModel.setProperty("/vendors", aVendors);
                },
                error: function () { MessageToast.show("Failed to load vendors"); }
            });
        },

        _loadVendorPR: function (sEventId) {
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("viewModel");

            oModel.read("/et_vendor_pr_detailsSet", {
                filters: [new Filter("NfaRefNo", FilterOperator.EQ, sEventId)],
                success: function (oData) {
                    var aPR = (oData.results || []).map(function (p, i) {
                        return {
                            slNo: i + 1,
                            vendorNo: p.VendorNo,
                            prNo: p.PrNo,
                            prItem: p.PrItem,
                            material: p.Material,
                            materialDescription: p.MaterialDescription,
                            qty: p.Qty,
                            uom: p.Uom,
                            plant: p.Plant,
                            remainingQty: p.RemainingQty,
                            splitPoQty: p.SplitPoQty,
                            finalizedLinePrice: p.FinilizedLinePrice,
                            freight: p.Freight,
                            gstPercentage: p.GstPercentage,
                            gstAmount: p.GstAmount,
                            insurance: p.Insurance
                        };
                    });
                    oViewModel.setProperty("/vendorPR", aPR);
                },
                error: function () { MessageToast.show("Failed to load vendor PR details"); }
            });
        },

        _getStatusState: function (sStatus) {
            switch (sStatus) {
                case "Approved": return "Success";
                case "Rejected": return "Error";
                case "Pending":  return "Warning";
                default:         return "Information";
            }
        },

        // ===== EDIT / SAVE / CANCEL =====
        onEdit: function () {
            this.getView().getModel("viewModel").setProperty("/isEditMode", true);
        },

        onPrBudgetChange: function (oEvent) {
            var oControl = oEvent.getSource();
            var sValue = oEvent.getParameter("value");

            // Strip anything that isn't a digit or decimal point
            sValue = sValue.replace(/[^0-9.]/g, "");

            // Allow only a single decimal point
            var iDotIndex = sValue.indexOf(".");
            if (iDotIndex !== -1) {
                sValue = sValue.substring(0, iDotIndex + 1) + sValue.substring(iDotIndex + 1).replace(/\./g, "");
            }

            // Match backend precision (Edm.Decimal Scale 3)
            if (sValue.indexOf(".") !== -1) {
                var aParts = sValue.split(".");
                sValue = aParts[0] + "." + aParts[1].substring(0, 3);
            }

            oControl.setValue(sValue);

            var sBinding = oControl.getBindingPath("value");
            if (sBinding) {
                this.getView().getModel("viewModel").setProperty(sBinding, sValue);
            }
        },

        onCancel: function () {
            // Reload original data and exit edit mode
            this.getView().getModel("viewModel").setProperty("/isEditMode", false);
            this._loadNFADetails(this._sCurrentEventId);
        },

        onSave: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oODataModel = this.getOwnerComponent().getModel();
            var oHeader = oViewModel.getProperty("/header");
            var aVendors = oViewModel.getProperty("/vendors");
            var that = this;

            var oPayload = {
                NfaRefNo: oHeader.PoNo,
                AribaDocNo: oHeader.AribaDocNo || "",
                NfaType: oHeader.NfaType || "",
                NfaTypeDesc: oHeader.NfaTypeDesc || "",
                NfaTitle: oHeader.NfaTitle || "",
                PurchaseOrg: oHeader.PurchaseOrg || "",
                PurchaseOrgDesc: oHeader.PurchaseOrgDesc || "",
                PurchaseGroup: oHeader.PurchaseGroup || "",
                PurchaseGroupDesc: oHeader.PurchaseGroupDesc || "",
                CompanyCode: oHeader.CompanyCode || "",
                CompanyDescription: oHeader.CompanyDescription || "",
                Remarks: oHeader.Remarks || "",
                BiDate: oHeader.BiDate ? that._formatDate(oHeader.BiDate) : null,
                PrBudget: String(oHeader.PrBudget || "0"),
                LongText: oHeader.Description || "",
                LdClause: oHeader.LdClause || "",
                AdvanceBg: oHeader.AdvanceBg || "",
                AdavanceBgAmt: String(oHeader.AdavanceBgAmt || "0"),
                PerformanceBg: oHeader.PerformanceBg || "",
                PerformanceBpAmt: String(oHeader.PerformanceBpAmt || "0"),
                LowestBasis: oHeader.LowestBasis || "",
                TechAccepLowBasis: oHeader.TechAccepLowBasis || "",
                ProprietaryBasis: oHeader.ProprietaryBasis || "",
                SingleTenderBasis: oHeader.SingleTenderBasis || "",
                RepeatOrderBasis: oHeader.RepeatOrderBasis || "",
                RateContract: oHeader.RateContract || "",
                JustificationRemarks: oHeader.JustificationRemarks || "",
                ScopeOfWork: oHeader.ScopeOfWork || "",
                AdditionalInfo: oHeader.AdditionalInfo || "",
                NegotiationStrategy: oHeader.NegotiationStrategy || "",
                VendorCategory: oHeader.VendorCategory || "",
                RequestedApprovalOn: null,
                Status: oHeader.Status || "Pending",
                Mandt: ""
            };

            oODataModel.create("/et_nfa_detailsSet", oPayload, {
                success: function (oData) {
                    var sNfaRefNo = oData.NfaRefNo || oHeader.PoNo;
                    // Save vendors too
                    if (aVendors && aVendors.length) {
                        that._saveVendors(sNfaRefNo, aVendors);
                    } else {
                        MessageBox.success("NFA saved successfully!");
                        oViewModel.setProperty("/isEditMode", false);
                    }
                },
                error: function (oError) {
                    var sMsg = "Save failed";
                    try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) {}
                    MessageBox.error(sMsg);
                }
            });
        },

        _saveVendors: function (sNfaRefNo, aVendors) {
            var oODataModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("viewModel");

            var oVendorPayload = {
                NfaRefNo: sNfaRefNo,
                VENDOR_ITEMS: aVendors.map(function (v) {
                    return {
                        NfaRefNo: sNfaRefNo,
                        VendorNo: v.vendorNo || "",
                        VendorName: v.vendorName || "",
                        Plant: v.plant || "",
                        InitialPrice: String(v.initialPrice || "0"),
                        NegotiatedPrice: String(v.negotiatedAmount || "0"),
                        TotalPrice: String(v.totalPrice || v.negotiatedAmount || "0"),
                        Lpp: String(v.lpp || "0"),
                        Ta: v.technicalAcceptability || "",
                        VendorQa: v.vendorQualification || "",
                        GstCredit: v.gstCredit || "",
                        GstRemarks: v.gstRemarks || "",
                        DeliveryRemarks: v.deliveryRemarks || "",
                        BasicTotalAmt: String(v.basicTotalAmt || "0"),
                        PfPercent: String(v.pfPercent || "0"),
                        PfAmount: String(v.pfAmount || "0"),
                        Freight: String(v.freight || "0"),
                        GstPercentage: String(v.gstPercentage || "0"),
                        GstAmount: String(v.gstAmount || "0"),
                        Insurance: String(v.insurance || "0"),
                        NetLandedCost: String(v.netLandedCost || "0"),
                        CommercialRating: v.commercialRating || "",
                        PaymentTerms: v.PaymentTerms || "",
                        PaymentTermsDesc: v.PaymentTermsDesc || ""
                    };
                })
            };

            oODataModel.create("/et_vendor_detailsSet", oVendorPayload, {
                success: function () {
                    MessageBox.success("NFA and Vendor details saved successfully!");
                    oViewModel.setProperty("/isEditMode", false);
                },
                error: function (oError) {
                    var sMsg = "Vendor save failed";
                    try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) {}
                    MessageBox.error(sMsg);
                }
            });
        },

        _formatDate: function (oDate) {
            if (!oDate) return null;
            var d = new Date(oDate);
            return d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                String(d.getDate()).padStart(2, "0") + "T00:00:00";
        },

        onCheckboxEdit: function (oEvent) {
            var sText = oEvent.getSource().getText();
            var bSelected = oEvent.getParameter("selected");
            var oViewModel = this.getView().getModel("viewModel");
            var mMap = {
                "Lowest Basis": "LowestBasis",
                "Technically acceptable lowest basis": "TechAccepLowBasis",
                "Proprietory basis": "ProprietaryBasis",
                "Single Tender basis": "SingleTenderBasis",
                "Repeat order basis": "RepeatOrderBasis",
                "Rate Contract": "RateContract"
            };
            var sProp = mMap[sText];
            if (sProp) oViewModel.setProperty("/header/" + sProp, bSelected ? "X" : "");
        },

        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("RoutenfaCreator");
        },

        onCreateDocument: function () {
            MessageToast.show("Please select document type from dropdown");
        },

        onDocumentTypeSelect: function (oEvent) {
            MessageToast.show("Selected: " + oEvent.getParameter("item").getKey());
        },

        onDownloadBuyerFiles: function () {
            MessageToast.show("Downloading buyer files...");
        },

        onDownloadSupplierFiles: function () {
            MessageToast.show("Downloading supplier files...");
        },

        formatINR: function (val) {
            var n = parseFloat(val);
            if (isNaN(n)) return val || "";
            return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    });
});
