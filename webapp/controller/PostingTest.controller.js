sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageBox, MessageToast, Filter, FilterOperator) {
  "use strict";

  return Controller.extend("com.df.nfa.creator_v2.controller.PostingTest", {

    onInit: function () {
      this.getView().setModel(new JSONModel({
        status: "Ready",
        statusState: "None",
        nfaRefNo: "",
        aribaDocNo: "",
        aribaPostStatus: "Ready",
        aribaPostStatusState: "None",
        aribaFetchDocNo: "",
        aribaResults: [],
        aribaFetchStatus: "Ready",
        aribaFetchStatusState: "None",
        aribaCreateStatus: "",
        aribaCreateStatusState: "None",
        aribaVendorResults: [],
        aribaVendorStatus: "Ready",
        aribaVendorStatusState: "None",
        aribaVendorPrResults: [],
        aribaVendorPrStatus: "Ready",
        aribaVendorPrStatusState: "None",
        aribaVendorItemResults: [],
        aribaVendorItemStatus: "Ready",
        aribaVendorItemStatusState: "None",
        aribaVendorFetchDocNo: "",
        buyerNfaRefNo: "",
        buyerStatus: "Ready",
        buyerStatusState: "None",
        _buyerPendingFile: null,
        nfa: {},
        vendors: [],
        vendorPR: [],
        nfaList: [],
        nfaListStatus: "",
        debugRawResponse: "",
        attachments: [],
        stagedAttachments: [],
        hasStaged: false,
        attachmentStatus: "Ready",
        attachmentStatusState: "None",
        _pendingFile: null,
        paymentTermsResults: [],
        paymentTermsStatus: "Ready",
        paymentTermsStatusState: "None",
        searchHelpType: "",
        searchHelpKey: "",
        searchHelpStatus: "Ready",
        searchHelpStatusState: "None",
        searchHelpResults: [],
        approvalFormNfaRefNo: "",
        approvalFormStatus: "Ready",
        approvalFormStatusState: "None",
        approvalFormResults: [],
        approvalDataNfaRefNo: "",
        approvalDataMailId: "",
        approvalDataStatus: "Ready",
        approvalDataStatusState: "None",
        approvalDataResults: [],
        approvalDataAllResults: [],
        approvalDataAllStatus: "Ready",
        approvalDataAllStatusState: "None",
        buyerAttach: { BuyerDocName: "", BuyerFileName: "", BuyerSpl: "", _fileObject: null },
        buyerAttachNfaRefNo: "",
        stagedBuyerAttachments: [],
        hasStagedBuyer: false,
        buyerAttachStatus: "Ready",
        buyerAttachStatusState: "None",
        buyerAttachFetchNfaRefNo: "",
        buyerAttachFetchStatus: "",
        buyerAttachFetchStatusState: "None",
        fetchedBuyerAttachments: [],
        supplierAttachFetchNfaRefNo: "",
        supplierAttachFetchVendorNo: "",
        supplierAttachStatus: "Ready",
        supplierAttachStatusState: "None",
        approveNfaRefNo: "",
        approveStatus: "Ready",
        approveStatusState: "None",
        versionDataNfaRefNo: "",
        versionDataVersionNo: "",
        versionDataStatus: "Ready",
        versionDataStatusState: "None",
        versionDataResults: [],
        vendorAmendNfaRefNo: "",
        vendorAmendReason: "",
        vendorAmendStatus: "Ready",
        vendorAmendStatusState: "None",
        vendorAmendResults: [],
        vendorQuotedNfaRefNo: "",
        vendorQuotedStatus: "",
        vendorQuotedStatusState: "None",
        vendorQuotedList: [],
        attachDialog: {
          vendorNo: "",
          vendorName: "",
          nfaRefNo: "",
          stagedFiles: [],
          fileCountText: "No documents selected yet.",
          existingFiles: [],
          fetchStatus: "",
          fetchStatusState: "None"
        },
        createUpdateBtnNfaRefNo: "",
        createUpdateBtnStatus: "Ready",
        createUpdateBtnStatusState: "None",
        createUpdateBtnResults: [],
        docTypeDesc: "",
        docCreateStatus: "",
        docCreateStatusState: "None",
        nfaAmendNfaRefNo: "",
        nfaAmendReason: "",
        nfaAmendNfaRefNoState: "None",
        nfaAmendReasonState: "None",
        nfaAmendStatus: "Ready",
        nfaAmendStatusState: "None"
      }), "testModel");
    },

    onFetchBuyerAttachments: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/buyerAttachFetchNfaRefNo");
      if (!sNfaRefNo) { sap.m.MessageBox.warning("Please enter NFA Ref No to fetch."); return; }

      oTestModel.setProperty("/buyerAttachFetchStatus", "Fetching...");
      oTestModel.setProperty("/buyerAttachFetchStatusState", "Warning");
      oTestModel.setProperty("/fetchedBuyerAttachments", []);

      oModel.read("/et_attachment_buyerSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/fetchedBuyerAttachments", aResults);
          oTestModel.setProperty("/buyerAttachFetchStatus", aResults.length + " record(s) found");
          oTestModel.setProperty("/buyerAttachFetchStatusState", aResults.length ? "Success" : "Warning");
          console.log("[et_attachment_buyerSet] Fetch:", aResults);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/buyerAttachFetchStatus", "Fetch Failed");
          oTestModel.setProperty("/buyerAttachFetchStatusState", "Error");
          console.error("[et_attachment_buyerSet] Error:", oError);
        }
      });
    },

    onBuyerAttachFileChange: function (oEvent) {
      var oFile = oEvent.getParameter("files")[0];
      if (!oFile) { return; }
      var oTestModel = this.getView().getModel("testModel");
      oTestModel.setProperty("/buyerAttach/BuyerFileName", oFile.name);
      oTestModel.setProperty("/buyerAttach/_fileObject", oFile);
    },

    onAddBuyerAttachRow: function () {
      var oTestModel = this.getView().getModel("testModel");
      var oAttach = oTestModel.getProperty("/buyerAttach");
      if (!oAttach.BuyerDocName) { sap.m.MessageBox.warning("Please enter BuyerDocName."); return; }
      if (!oAttach._fileObject) { sap.m.MessageBox.warning("Please choose a file."); return; }
      var aStaged = oTestModel.getProperty("/stagedBuyerAttachments") || [];
      aStaged.push({
        Sno: String(aStaged.length + 1).padStart(3, "0"),
        BuyerDocName: oAttach.BuyerDocName,
        BuyerFileName: oAttach.BuyerFileName,
        BuyerSpl: oAttach.BuyerSpl || "",
        _fileObject: oAttach._fileObject
      });
      oTestModel.setProperty("/stagedBuyerAttachments", aStaged);
      oTestModel.setProperty("/hasStagedBuyer", true);
      oTestModel.setProperty("/buyerAttach", { BuyerDocName: "", BuyerFileName: "", BuyerSpl: "", _fileObject: null });
      this.byId("buyerAttachFileUploader").clear();
    },

    onRemoveBuyerAttachRow: function (oEvent) {
      var oTestModel = this.getView().getModel("testModel");
      var iIdx = parseInt(oEvent.getSource().getBindingContext("testModel").getPath().split("/").pop());
      var aStaged = oTestModel.getProperty("/stagedBuyerAttachments");
      aStaged.splice(iIdx, 1);
      aStaged.forEach(function (o, i) { o.Sno = String(i + 1).padStart(3, "0"); });
      oTestModel.setProperty("/stagedBuyerAttachments", aStaged);
      oTestModel.setProperty("/hasStagedBuyer", aStaged.length > 0);
    },

    onPostBuyerAttachments: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var aStaged = oTestModel.getProperty("/stagedBuyerAttachments") || [];
      var sNfaRefNo = oTestModel.getProperty("/buyerAttachNfaRefNo");
      if (!sNfaRefNo) { sap.m.MessageBox.warning("Please enter NFA Ref No."); return; }
      if (!aStaged.length) { sap.m.MessageBox.warning("No attachments staged."); return; }

      oTestModel.setProperty("/buyerAttachStatus", "Reading files...");
      oTestModel.setProperty("/buyerAttachStatusState", "Warning");

      var aReaders = aStaged.map(function (oRow) {
        return new Promise(function (resolve, reject) {
          var oReader = new FileReader();
          oReader.onload = function (e) { resolve({ row: oRow, base64: e.target.result.split(",")[1] }); };
          oReader.onerror = reject;
          oReader.readAsDataURL(oRow._fileObject);
        });
      });

      Promise.all(aReaders).then(function (aResults) {
        var aBuyItems = aResults.map(function (oResult) {
          return {
            NfaRefNo: sNfaRefNo,
            BuyerFileName: oResult.row.BuyerFileName,
            BuyerDocName: oResult.row.BuyerDocName,
            BuyerDocMime: oResult.row._fileObject.type || "application/octet-stream",
            BuyerFileData: oResult.base64,
            BuyerSpl: oResult.row.BuyerSpl || ""
          };
        });
        var oPayload = { NfaRefNo: sNfaRefNo, ATTACH_BUY: { results: aBuyItems } };
        console.log("[BuyerAttach] POST payload:", JSON.stringify(oPayload));
        oTestModel.setProperty("/buyerAttachStatus", "Posting...");
        oModel.create("/et_attachHeadSet", oPayload, {
          success: function () {
            oTestModel.setProperty("/buyerAttachStatus", "Posted Successfully!");
            oTestModel.setProperty("/buyerAttachStatusState", "Success");
            oTestModel.setProperty("/stagedBuyerAttachments", []);
            oTestModel.setProperty("/hasStagedBuyer", false);
            sap.m.MessageToast.show("Buyer attachments posted!");
          },
          error: function (oError) {
            var sMsg = "";
            try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
            oTestModel.setProperty("/buyerAttachStatus", "Post Failed");
            oTestModel.setProperty("/buyerAttachStatusState", "Error");
            sap.m.MessageBox.error("Post Failed: " + sMsg);
          }
        });
      }).catch(function (err) {
        oTestModel.setProperty("/buyerAttachStatus", "File Read Error");
        oTestModel.setProperty("/buyerAttachStatusState", "Error");
      });
    },

    // RAW XHR test - bypasses OData model to see exact HTTP response
    onRawPostTest: function () {
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/buyerNfaRefNo");
      var oPending = oTestModel.getProperty("/_buyerPendingFile");

      if (!sNfaRefNo || !oPending) {
        MessageBox.warning("Enter NFA Ref No and choose a file first.");
        return;
      }

      var oReader = new FileReader();
      oReader.onload = function (e) {
        var sBase64 = e.target.result.split(",")[1];

        var oPayload = {
          NfaRefNo: sNfaRefNo,
          ATTACH_BUY: {
            results: [{
              NfaRefNo: sNfaRefNo,
              Sno: "001",
              BuyerDoc: oPending.fileName,
              BuyerDocMime: oPending.mimeType,
              BuyerFileData: sBase64
            }]
          }
        };

        // Step 1: get CSRF token
        var sBaseUrl = "/sap/opu/odata/sap/ZNFA_SRV";
        var xhrToken = new XMLHttpRequest();
        xhrToken.open("GET", sBaseUrl + "/et_attachHeadSet", true);
        xhrToken.setRequestHeader("X-CSRF-Token", "Fetch");
        xhrToken.setRequestHeader("Accept", "application/json");
        xhrToken.onload = function () {
          var sToken = xhrToken.getResponseHeader("X-CSRF-Token");
          console.log("[RawXHR] CSRF Token:", sToken);

          // Step 2: POST with token
          var xhrPost = new XMLHttpRequest();
          xhrPost.open("POST", sBaseUrl + "/et_attachHeadSet", true);
          xhrPost.setRequestHeader("Content-Type", "application/json");
          xhrPost.setRequestHeader("Accept", "application/json");
          xhrPost.setRequestHeader("X-CSRF-Token", sToken || "");
          xhrPost.onload = function () {
            console.log("[RawXHR] POST Status:", xhrPost.status);
            console.log("[RawXHR] POST Response:", xhrPost.responseText);
            oTestModel.setProperty("/buyerStatus", "Raw XHR: HTTP " + xhrPost.status);
            oTestModel.setProperty("/buyerStatusState", xhrPost.status < 300 ? "Success" : "Error");
            oTestModel.setProperty("/debugRawResponse", "RAW POST Status: " + xhrPost.status + "\n\n" + xhrPost.responseText);
          };
          xhrPost.onerror = function () {
            console.error("[RawXHR] Network error");
            oTestModel.setProperty("/buyerStatus", "Raw XHR: Network Error");
            oTestModel.setProperty("/buyerStatusState", "Error");
          };
          xhrPost.send(JSON.stringify(oPayload));
        };
        xhrToken.onerror = function () { console.error("[RawXHR] Token fetch failed"); };
        xhrToken.send();
      };
      oReader.readAsDataURL(oPending.fileObject);
    },

    onGetBuyerAttachments: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");

      oTestModel.setProperty("/buyerStatus", "Fetching...");
      oTestModel.setProperty("/buyerStatusState", "Warning");

      oModel.read("/et_attachment_buyerSet", {
        success: function (oData) {
          oTestModel.setProperty("/buyerStatus", (oData.results || []).length + " record(s) fetched");
          oTestModel.setProperty("/buyerStatusState", "Success");
          console.log("[et_attachment_buyerSet] Results:", oData.results);
        },
        error: function (oError) {
          oTestModel.setProperty("/buyerStatus", "Fetch Failed");
          oTestModel.setProperty("/buyerStatusState", "Error");
          console.error("[et_attachment_buyerSet] Error:", oError.responseText);
        }
      });
    },

    onGetSupplierAttachments: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/supplierAttachFetchNfaRefNo");
      var sVendorNo = oTestModel.getProperty("/supplierAttachFetchVendorNo");

      oTestModel.setProperty("/supplierAttachStatus", "Fetching...");
      oTestModel.setProperty("/supplierAttachStatusState", "Warning");

      var aFilters = [];
      if (sNfaRefNo) { aFilters.push(new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)); }
      if (sVendorNo) { aFilters.push(new Filter("VendorNo", FilterOperator.EQ, sVendorNo)); }

      oModel.read("/et_attachment_supplierSet", {
        filters: aFilters,
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/supplierAttachStatus", aResults.length + " record(s) fetched");
          oTestModel.setProperty("/supplierAttachStatusState", aResults.length ? "Success" : "Warning");
          console.log("[et_attachment_supplierSet] Results:", aResults);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/supplierAttachStatus", "Fetch Failed");
          oTestModel.setProperty("/supplierAttachStatusState", "Error");
          console.error("[et_attachment_supplierSet] Error:", oError.responseText);
        }
      });
    },

    onBuyerFileChange: function (oEvent) {
      var oFile = oEvent.getParameter("files")[0];
      if (!oFile) { return; }
      this.getView().getModel("testModel").setProperty("/_buyerPendingFile", {
        fileName: oFile.name,
        mimeType: oFile.type || "application/octet-stream",
        fileObject: oFile
      });
    },

    onPostBuyerAttachment: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/buyerNfaRefNo");
      var oPending = oTestModel.getProperty("/_buyerPendingFile");

      if (!sNfaRefNo || !oPending) {
        MessageBox.warning("Please enter NFA Ref No and choose a buyer file.");
        return;
      }

      oTestModel.setProperty("/buyerStatus", "Reading file...");
      oTestModel.setProperty("/buyerStatusState", "Warning");

      var oReader = new FileReader();
      oReader.onload = function (e) {
        var sBase64 = e.target.result.split(",")[1];

        // GET feed shows: ATTACH_BUY is a feed (1-to-many) → results array
        // ATTACH_SUP is a single entry (1-to-1) → plain object, no results array
        // Head entity only carries NfaRefNo
        var oPayload = {
          NfaRefNo: sNfaRefNo,
          ATTACH_BUY: {
            results: [{
              NfaRefNo: sNfaRefNo,
              Sno: "001",
              BuyerDoc: oPending.fileName,
              BuyerDocMime: oPending.mimeType,
              BuyerFileData: sBase64
            }]
          }
        };

        console.log("[et_attachHeadSet] Buyer POST Payload:", JSON.stringify(oPayload));

        oModel.create("/et_attachHeadSet", oPayload, {
          success: function (oData) {
            oTestModel.setProperty("/buyerStatus", "Posted Successfully!");
            oTestModel.setProperty("/buyerStatusState", "Success");
            oTestModel.setProperty("/_buyerPendingFile", null);
            console.log("[et_attachHeadSet] Buyer POST Success:", oData);
          },
          error: function (oError) {
            var sMsg = "";
            try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
            oTestModel.setProperty("/buyerStatus", "Post Failed");
            oTestModel.setProperty("/buyerStatusState", "Error");
            console.error("[et_attachHeadSet] Buyer POST Error:", oError.responseText);
            MessageBox.error("Buyer POST Failed: " + sMsg);
          }
        });
      };
      oReader.onerror = function () {
        oTestModel.setProperty("/buyerStatus", "File Read Error");
        oTestModel.setProperty("/buyerStatusState", "Error");
      };
      oReader.readAsDataURL(oPending.fileObject);
    },

    onAttachFileChange: function (oEvent) {
      var oFile = oEvent.getParameter("files")[0];
      if (!oFile) { return; }
      this.getView().getModel("testModel").setProperty("/_pendingFile", {
        fileName: oFile.name,
        mimeType: oFile.type || "application/octet-stream",
        fileObject: oFile
      });
    },

    onAddAttachmentRow: function () {
      var oTestModel = this.getView().getModel("testModel");
      var oPending = oTestModel.getProperty("/_pendingFile");
      if (!oPending) {
        MessageBox.warning("Please choose a file first.");
        return;
      }
      var sType = this.byId("attachTypeSelect").getSelectedKey();
      var sVendorNo = this.byId("attachVendorNoInput").getValue();
      var aStaged = oTestModel.getProperty("/stagedAttachments") || [];
      var iSno = aStaged.length + 1;
      aStaged.push({
        Sno: String(iSno).padStart(3, "0"),
        type: sType,
        vendorNo: sVendorNo,
        fileName: oPending.fileName,
        mimeType: oPending.mimeType,
        fileObject: oPending.fileObject
      });
      oTestModel.setProperty("/stagedAttachments", aStaged);
      oTestModel.setProperty("/hasStaged", aStaged.length > 0);
      oTestModel.setProperty("/_pendingFile", null);
      this.byId("attachFileUploader").clear();
      this.byId("attachVendorNoInput").setValue("");
    },

    onRemoveAttachmentRow: function (oEvent) {
      var oTestModel = this.getView().getModel("testModel");
      var oCtx = oEvent.getSource().getBindingContext("testModel");
      var aStaged = oTestModel.getProperty("/stagedAttachments");
      var iIdx = parseInt(oCtx.getPath().split("/").pop());
      aStaged.splice(iIdx, 1);
      // re-number
      aStaged.forEach(function (o, i) { o.Sno = String(i + 1).padStart(3, "0"); });
      oTestModel.setProperty("/stagedAttachments", aStaged);
      oTestModel.setProperty("/hasStaged", aStaged.length > 0);
    },

    // onPostAttachment: function () {
    //   var oModel = this.getOwnerComponent().getModel();
    //   var oTestModel = this.getView().getModel("testModel");
    //   var aStaged = oTestModel.getProperty("/stagedAttachments") || [];

    //   if (!aStaged.length) {
    //     MessageBox.warning("No attachments staged.");
    //     return;
    //   }

    //   oTestModel.setProperty("/attachmentStatus", "Reading files...");
    //   oTestModel.setProperty("/attachmentStatusState", "Warning");

    //   var aReaders = aStaged.map(function (oRow) {
    //     return new Promise(function (resolve) {
    //       var oReader = new FileReader();
    //       oReader.onload = function (e) {
    //         var sBase64 = e.target.result.split(",")[1];
    //         var oItem = { Mandt: "", NfaRefNo: "NFA000000000001", Sno: oRow.Sno };
    //         if (oRow.type === "supplier") {
    //           oItem.SupplierDoc = oRow.fileName;
    //           oItem.SupplierDocMime = oRow.mimeType;
    //           oItem.SupplierFileData = sBase64;
    //           oItem.BuyerDoc = "";
    //           oItem.BuyerDocMime = "";
    //           oItem.BuyerFileData = "";
    //         } else {
    //           oItem.BuyerDoc = oRow.fileName;
    //           oItem.BuyerDocMime = oRow.mimeType;
    //           oItem.BuyerFileData = sBase64;
    //           oItem.SupplierDoc = "";
    //           oItem.SupplierDocMime = "";
    //           oItem.SupplierFileData = "";
    //         }
    //         resolve(oItem);
    //       };
    //       oReader.readAsDataURL(oRow.fileObject);
    //     });
    //   });

    //   Promise.all(aReaders).then(function (aItems) {
    //     var oPayload = {
    //       NfaRefNo: "NFA000000000001",
    //       ATTACH: { results: aItems }
    //     };
    //     oTestModel.setProperty("/attachmentStatus", "Posting...");
    //     oModel.create("/et_attachHeadSet", oPayload, {
    //       success: function () {
    //         oTestModel.setProperty("/attachmentStatus", "Attachments Posted!");
    //         oTestModel.setProperty("/attachmentStatusState", "Success");
    //         oTestModel.setProperty("/stagedAttachments", []);
    //         oTestModel.setProperty("/hasStaged", false);
    //         MessageToast.show("Attachments posted successfully!");
    //       },
    //       error: function (oError) {
    //         var sMsg = "";
    //         try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
    //         oTestModel.setProperty("/attachmentStatus", "Post Failed");
    //         oTestModel.setProperty("/attachmentStatusState", "Error");
    //         MessageBox.error("Attachment Post Failed: " + sMsg);
    //       }
    //     });
    //   });
    // }
    onPostAttachment: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var aStaged = oTestModel.getProperty("/stagedAttachments") || [];
      var sNfaRefNo = oTestModel.getProperty("/nfaRefNo") || "NFA000000000001";

      if (!aStaged.length) {
        MessageBox.warning("No attachments staged.");
        return;
      }

      oTestModel.setProperty("/attachmentStatus", "Reading files...");
      oTestModel.setProperty("/attachmentStatusState", "Warning");

      var aReaders = aStaged.map(function (oRow) {
        return new Promise(function (resolve, reject) {
          var oReader = new FileReader();
          oReader.onload = function (e) {
            resolve({ row: oRow, base64: e.target.result.split(",")[1] });
          };
          oReader.onerror = reject;
          oReader.readAsDataURL(oRow.fileObject);
        });
      });

      Promise.all(aReaders).then(function (aResults) {
        var aBuyItems = [], oSupItem = null, iBuySno = 1;

        aResults.forEach(function (oResult) {
          var oRow = oResult.row;
          if (oRow.type === "buyer") {
            // ATTACH_BUY = feed (1-to-many) → results array
            aBuyItems.push({
              NfaRefNo: sNfaRefNo,
              Sno: String(iBuySno++).padStart(3, "0"),
              BuyerDoc: oRow.fileName,
              BuyerDocMime: oRow.mimeType,
              BuyerFileData: oResult.base64
            });
          } else {
            // ATTACH_SUP = entry (1-to-1) → plain object, NOT results array
            oSupItem = {
              NfaRefNo: sNfaRefNo,
              VendorNo: oRow.vendorNo || "",
              Sno: "001",
              SupplierDoc: oRow.fileName,
              SupplierDocMime: oRow.mimeType,
              SupplierFileData: oResult.base64
            };
          }
        });

        var oPayload = { NfaRefNo: sNfaRefNo };
        if (aBuyItems.length) { oPayload.ATTACH_BUY = { results: aBuyItems }; }
        if (oSupItem)         { oPayload.ATTACH_SUP = oSupItem; }  // plain object, no results wrapper

        console.log("[et_attachHeadSet] POST Payload:", JSON.stringify(oPayload));

        oTestModel.setProperty("/attachmentStatus", "Posting...");
        oTestModel.setProperty("/attachmentStatusState", "Warning");

        oModel.create("/et_attachHeadSet", oPayload, {
          success: function (oData) {
            oTestModel.setProperty("/attachmentStatus", "Attachments Posted!");
            oTestModel.setProperty("/attachmentStatusState", "Success");
            oTestModel.setProperty("/stagedAttachments", []);
            oTestModel.setProperty("/hasStaged", false);
            MessageToast.show("Attachments posted successfully!");
            console.log("[et_attachHeadSet] POST Success:", oData);
          },
          error: function (oError) {
            var sMsg = "";
            try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText || "Unknown error"; }
            oTestModel.setProperty("/attachmentStatus", "Post Failed");
            oTestModel.setProperty("/attachmentStatusState", "Error");
            MessageBox.error("Attachment Post Failed: " + sMsg);
            console.error("[et_attachHeadSet] POST Error:", oError);
          }
        });
      }).catch(function (err) {
        oTestModel.setProperty("/attachmentStatus", "File Read Error");
        oTestModel.setProperty("/attachmentStatusState", "Error");
        MessageBox.error("Error reading file: " + err.message);
      });
    },


    onSearchHelpFetchAll: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      oTestModel.setProperty("/searchHelpStatus", "Fetching all...");
      oTestModel.setProperty("/searchHelpStatusState", "Warning");
      oTestModel.setProperty("/searchHelpResults", []);

      oModel.read("/et_nfa_search_helpSet", {
        success: function (oData) {
          oTestModel.setProperty("/searchHelpResults", oData.results);
          oTestModel.setProperty("/searchHelpStatus", "Fetched " + oData.results.length + " records");
          oTestModel.setProperty("/searchHelpStatusState", "Success");
          console.log("Search Help - All:", oData.results);
        },
        error: function (oError) {
          oTestModel.setProperty("/searchHelpStatus", "Fetch Failed");
          oTestModel.setProperty("/searchHelpStatusState", "Error");
          console.error("Search Help Fetch All Error:", oError);
        }
      });
    },

    onSearchHelpFetchByType: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sType = oTestModel.getProperty("/searchHelpType");

      if (!sType) {
        MessageBox.warning("Please enter a Type value.");
        return;
      }

      oTestModel.setProperty("/searchHelpStatus", "Fetching by Type...");
      oTestModel.setProperty("/searchHelpStatusState", "Warning");
      oTestModel.setProperty("/searchHelpResults", []);

      oModel.read("/et_nfa_search_helpSet", {
        filters: [new Filter("Type", FilterOperator.EQ, sType)],
        success: function (oData) {
          oTestModel.setProperty("/searchHelpResults", oData.results);
          oTestModel.setProperty("/searchHelpStatus", "Fetched " + oData.results.length + " records for Type='" + sType + "'");
          oTestModel.setProperty("/searchHelpStatusState", oData.results.length ? "Success" : "Warning");
          console.log("Search Help - By Type [" + sType + "]:", oData.results);
        },
        error: function (oError) {
          oTestModel.setProperty("/searchHelpStatus", "Fetch Failed");
          oTestModel.setProperty("/searchHelpStatusState", "Error");
          console.error("Search Help Fetch By Type Error:", oError);
        }
      });
    },

    onSearchHelpReadSingle: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sType = oTestModel.getProperty("/searchHelpType");
      var sKey = oTestModel.getProperty("/searchHelpKey");

      if (!sType || !sKey) {
        MessageBox.warning("Please enter both Type and KeyDataType.");
        return;
      }

      oTestModel.setProperty("/searchHelpStatus", "Reading single record...");
      oTestModel.setProperty("/searchHelpStatusState", "Warning");
      oTestModel.setProperty("/searchHelpResults", []);

      var sPath = "/et_nfa_search_helpSet(Type='" + encodeURIComponent(sType) + "',KeyDataType='" + encodeURIComponent(sKey) + "')";
      console.log("Reading path:", sPath);

      oModel.read(sPath, {
        success: function (oData) {
          oTestModel.setProperty("/searchHelpResults", [oData]);
          oTestModel.setProperty("/searchHelpStatus", "Record found: " + oData.Description);
          oTestModel.setProperty("/searchHelpStatusState", "Success");
          console.log("Search Help - Single Record:", oData);
        },
        error: function (oError) {
          oTestModel.setProperty("/searchHelpStatus", "Record Not Found");
          oTestModel.setProperty("/searchHelpStatusState", "Error");
          console.error("Search Help Read Single Error:", oError);
        }
      });
    },

    onFetchAttachments: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/nfaRefNo") || "NFA000000000001";

      oTestModel.setProperty("/attachmentStatus", "Fetching...");
      oTestModel.setProperty("/attachmentStatusState", "Warning");

      oModel.read("/et_attachHeadSet('" + sNfaRefNo + "')", {
        urlParameters: { "$expand": "ATTACH_BUY,ATTACH_SUP" },
        success: function (oData) {
          var aBuy = (oData.ATTACH_BUY && oData.ATTACH_BUY.results) || [];
          var aSup = (oData.ATTACH_SUP && oData.ATTACH_SUP.results) || [];
          var aAll = aBuy.map(function(o) { return Object.assign({}, o, { _type: "Buyer" }); })
                       .concat(aSup.map(function(o) { return Object.assign({}, o, { _type: "Supplier" }); }));
          oTestModel.setProperty("/attachments", aAll);
          oTestModel.setProperty("/attachmentStatus", aBuy.length + " buyer, " + aSup.length + " supplier record(s) fetched");
          oTestModel.setProperty("/attachmentStatusState", "Success");
          console.log("[et_attachHeadSet] GET Expand:", oData);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/attachmentStatus", "Fetch Failed");
          oTestModel.setProperty("/attachmentStatusState", "Error");
          MessageBox.error("Attachment Fetch Failed: " + sMsg);
        }
      });
    },

    onPostAribaDocNo: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sAribaDocNo = oTestModel.getProperty("/aribaDocNo");

      if (!sAribaDocNo) {
        MessageBox.warning("Please enter an Ariba Doc No.");
        return;
      }

      oTestModel.setProperty("/aribaPostStatus", "Posting...");
      oTestModel.setProperty("/aribaPostStatusState", "Warning");
      oTestModel.setProperty("/aribaFetchStatus", "Ready");
      oTestModel.setProperty("/aribaFetchStatusState", "None");
      oTestModel.setProperty("/aribaResults", []);
      oTestModel.setProperty("/aribaVendorResults", []);
      oTestModel.setProperty("/aribaVendorStatus", "Ready");
      oTestModel.setProperty("/aribaVendorStatusState", "None");
      oTestModel.setProperty("/aribaVendorPrResults", []);
      oTestModel.setProperty("/aribaVendorPrStatus", "Ready");
      oTestModel.setProperty("/aribaVendorPrStatusState", "None");

      var oNfaPayload = {
        AribaDocNo: sAribaDocNo,
        Status: "NEW"
      };

      console.log("[Ariba] POST et_nfa_detailsSet payload:", JSON.stringify(oNfaPayload));

      oModel.create("/et_nfa_detailsSet", oNfaPayload, {
        success: function (oData) {
          var sNfaRefNo = oData.NfaRefNo;
          console.log("[Ariba] POST success. Response:", oData);
          oTestModel.setProperty("/aribaPostStatus", "Posted! NfaRefNo: " + sNfaRefNo);
          oTestModel.setProperty("/aribaPostStatusState", "Success");

          // GET et_nfa_detailsSet filtered by AribaDocNo AND Status=NEW
          oTestModel.setProperty("/aribaFetchStatus", "Fetching...");
          oTestModel.setProperty("/aribaFetchStatusState", "Warning");

          oModel.read("/et_nfa_detailsSet", {
            filters: [
              new Filter("AribaDocNo", FilterOperator.EQ, sAribaDocNo),
              new Filter("Status", FilterOperator.EQ, "NEW")
            ],
            success: function (oNfaData) {
              var aResults = oNfaData.results || [];
              oTestModel.setProperty("/aribaResults", aResults);
              oTestModel.setProperty("/aribaFetchStatus", aResults.length + " record(s) found");
              oTestModel.setProperty("/aribaFetchStatusState", aResults.length ? "Success" : "Warning");
              console.log("[Ariba] GET et_nfa_detailsSet AribaDocNo='" + sAribaDocNo + "' Status='NEW':", aResults);
            },
            error: function (oErr) {
              var sMsg = "";
              try { sMsg = JSON.parse(oErr.responseText).error.message.value; } catch (e) { sMsg = oErr.responseText; }
              oTestModel.setProperty("/aribaFetchStatus", "Fetch Failed");
              oTestModel.setProperty("/aribaFetchStatusState", "Error");
              console.error("[Ariba] GET error:", oErr.responseText);
            }
          });

        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/aribaPostStatus", "Post Failed");
          oTestModel.setProperty("/aribaPostStatusState", "Error");
          MessageBox.error("Ariba Post Failed: " + sMsg);
        }
      });
    },

    onCreateNfaFromAriba: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var aResults = oTestModel.getProperty("/aribaResults");

      if (!aResults || !aResults.length) {
        MessageBox.warning("No fetched records to post. Fetch by Ariba Doc No first.");
        return;
      }

      var oRecord = aResults[0];
      var oPayload = Object.assign({}, oRecord, { NfaRefNo: "", Mandt: "" });
      delete oPayload.__metadata;

      oTestModel.setProperty("/aribaCreateStatus", "Posting...");
      oTestModel.setProperty("/aribaCreateStatusState", "Warning");

      console.log("[Ariba] Create NFA Reference POST payload:", JSON.stringify(oPayload));

      oModel.create("/et_nfa_detailsSet", oPayload, {
        success: function (oData) {
          var sNfaRefNo = oData.NfaRefNo;
          oTestModel.setProperty("/aribaCreateStatus", "NFA Reference Created: " + sNfaRefNo);
          oTestModel.setProperty("/aribaCreateStatusState", "Success");
          console.log("[Ariba] NFA Reference created. NfaRefNo:", sNfaRefNo);
          MessageToast.show("NFA Reference created: " + sNfaRefNo);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/aribaCreateStatus", "Create Failed");
          oTestModel.setProperty("/aribaCreateStatusState", "Error");
          MessageBox.error("Create NFA Reference Failed: " + sMsg);
        }
      });
    },

    onPostNfaStatusApproved: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/approveNfaRefNo");

      if (!sNfaRefNo) {
        MessageBox.warning("Please enter an NFA Ref No.");
        return;
      }

      oTestModel.setProperty("/approveStatus", "Posting...");
      oTestModel.setProperty("/approveStatusState", "Warning");

      var oPayload = { NfaRefNo: sNfaRefNo,
                      AribaDocNo: "",
                      NfaType: "NEWS",
                      RepeatOrder: "",
                      NfaTypeDesc: "Single Source",
                      NfaTitle: "NFA TT122",
                      PurchaseOrg: "2000",
                      PurchaseOrgDesc: "DPL Purchase Org.",
                      PurchaseGroup: "204",
                      PurchaseGroupDesc: "Engineering - Mech",
                      Remarks: "",
                     // BiDate: "2026-04-16T00:00:00:000Z",
                      CompanyCode: "2000",
                      CompanyDescription: "Deepak Phenolics Limited",
                      PrBudget: "0.000",
                      BaselineSpend: "0.000",
                      Currency: "INR",
                      CurrencyDesc: "Indian Rupee",
                      LongText: "",
                      Incoterm: "CFR",
                      IncotermDesc: "Costs and Freight",
                      LdClause: "Yes",
                      LdClauseAmt: "020",
                      AdvanceBg: "No",
                      AdavanceBgAmt: "000",
                      PerformanceBg: "No",
                      PerformanceBpAmt: "000",
                      Cpbg: "Yes",
                      CpbgAmt: "020",
                      LowestBasis: "X",
                      TechAccepLowBasis: "",
                      ProprietaryBasis: "",
                      SingleTenderBasis: "",
                      RepeatOrderBasis: "",
                      RateContract: "",
                      JustificationRemarks: "",
                      ScopeOfWork: "",
                      AdditionalInfo: "",
                      NegotiationStrategy: "",
                      VendorCategory: "AUTHORIZED",
                      RequestedApprovalOn: "16.04.2026",
                       Status: "Approved" };
      console.log("[Approve] POST et_nfa_detailsSet payload:", JSON.stringify(oPayload));

      oModel.create("/et_nfa_detailsSet", oPayload, {
        success: function (oData) {
          oTestModel.setProperty("/approveStatus", "Status set to Approved");
          oTestModel.setProperty("/approveStatusState", "Success");
          console.log("[Approve] POST success:", oData);
          MessageToast.show("NFA " + sNfaRefNo + " status set to Approved");
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/approveStatus", "Post Failed");
          oTestModel.setProperty("/approveStatusState", "Error");
          MessageBox.error("Post Failed: " + sMsg);
        }
      });
    },

    onFetchVendorByAribaDocNo: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sAribaDocNo = oTestModel.getProperty("/aribaVendorFetchDocNo");

      if (!sAribaDocNo) {
        MessageBox.warning("Please enter an Ariba Doc No.");
        return;
      }

      oTestModel.setProperty("/aribaVendorResults", []);
      oTestModel.setProperty("/aribaVendorStatus", "Fetching...");
      oTestModel.setProperty("/aribaVendorStatusState", "Warning");
      oTestModel.setProperty("/aribaVendorPrResults", []);
      oTestModel.setProperty("/aribaVendorPrStatus", "Fetching...");
      oTestModel.setProperty("/aribaVendorPrStatusState", "Warning");
      oTestModel.setProperty("/aribaVendorItemResults", []);
      oTestModel.setProperty("/aribaVendorItemStatus", "Fetching...");
      oTestModel.setProperty("/aribaVendorItemStatusState", "Warning");

      oModel.read("/et_vendor_item_detailsSet", {
        filters: [
          new Filter("AribaDocNo", FilterOperator.EQ, sAribaDocNo),
          //new Filter("Status", FilterOperator.EQ, "NEW")
        ],
        success: function (oData) {
          var aVendors = oData.results || [];
          oTestModel.setProperty("/aribaVendorResults", aVendors);
          oTestModel.setProperty("/aribaVendorStatus", aVendors.length + " record(s) found");
          oTestModel.setProperty("/aribaVendorStatusState", aVendors.length ? "Success" : "Warning");
          console.log("[Ariba] GET et_vendor_detailsSet AribaDocNo='" + sAribaDocNo + "' Status='NEW':", aVendors);
        },
        error: function (oErr) {
          oTestModel.setProperty("/aribaVendorStatus", "Fetch Failed");
          oTestModel.setProperty("/aribaVendorStatusState", "Error");
          console.error("[Ariba] GET et_vendor_detailsSet error:", oErr.responseText);
        }
      });

      oModel.read("/et_vendor_pr_item_detailsSet", {
        filters: [
          new Filter("AribaDocNo", FilterOperator.EQ, sAribaDocNo)
          //new Filter("Status", FilterOperator.EQ, "NEW")
        ],
        success: function (oPrData) {
          var aPrItems = oPrData.results || [];
          oTestModel.setProperty("/aribaVendorPrResults", aPrItems);
          oTestModel.setProperty("/aribaVendorPrStatus", aPrItems.length + " record(s) found");
          oTestModel.setProperty("/aribaVendorPrStatusState", aPrItems.length ? "Success" : "Warning");
          console.log("[Ariba] GET et_vendor_pr_item_detailsSet AribaDocNo='" + sAribaDocNo + "' Status='NEW':", aPrItems);
        },
        error: function (oErr) {
          oTestModel.setProperty("/aribaVendorPrStatus", "Fetch Failed");
          oTestModel.setProperty("/aribaVendorPrStatusState", "Error");
          console.error("[Ariba] GET et_vendor_pr_item_detailsSet error:", oErr.responseText);
        }
      });

      oModel.read("/et_attachment_supplierSet", {
        filters: [
          new Filter("NfaRefNo", FilterOperator.EQ, ""),
          new Filter("AribaDocNo", FilterOperator.EQ, sAribaDocNo),
          new Filter("VendorNo", FilterOperator.EQ, ""),

        ],
        success: function (oData) {
          var aItems = oData.results || [];
          oTestModel.setProperty("/aribaVendorItemResults", aItems);
          oTestModel.setProperty("/aribaVendorItemStatus", aItems.length + " record(s) found");
          oTestModel.setProperty("/aribaVendorItemStatusState", aItems.length ? "Success" : "Warning");
          console.log("[Ariba] GET et_vendor_item_detailsSet AribaDocNo='" + sAribaDocNo + "' Status='NEW':", aItems);
        },
        error: function (oErr) {
          oTestModel.setProperty("/aribaVendorItemStatus", "Fetch Failed");
          oTestModel.setProperty("/aribaVendorItemStatusState", "Error");
          console.error("[Ariba] GET et_vendor_item_detailsSet error:", oErr.responseText);
        }
      });
    },

    onFetchNfaByAribaDocNo: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sAribaDocNo = oTestModel.getProperty("/aribaFetchDocNo");

      if (!sAribaDocNo) {
        MessageBox.warning("Please enter an Ariba Doc No.");
        return;
      }

      oTestModel.setProperty("/aribaFetchStatus", "Fetching...");
      oTestModel.setProperty("/aribaFetchStatusState", "Warning");
      oTestModel.setProperty("/aribaResults", []);

      oModel.read("/et_nfa_detailsSet", {
        filters: [
          new Filter("AribaDocNo", FilterOperator.EQ, sAribaDocNo),
          new Filter("Status", FilterOperator.EQ, "NEW")
        ],
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/aribaResults", aResults);
          oTestModel.setProperty("/aribaFetchStatus", aResults.length + " record(s) found");
          oTestModel.setProperty("/aribaFetchStatusState", aResults.length ? "Success" : "Warning");
          console.log("[Ariba] GET et_nfa_detailsSet AribaDocNo='" + sAribaDocNo + "' Status='NEW':", aResults);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/aribaFetchStatus", "Fetch Failed");
          oTestModel.setProperty("/aribaFetchStatusState", "Error");
          console.error("[Ariba] GET error:", oError.responseText);
        }
      });
    },

    onFetchAllApprovalData: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");

      oTestModel.setProperty("/approvalDataAllStatus", "Fetching...");
      oTestModel.setProperty("/approvalDataAllStatusState", "Warning");
      oTestModel.setProperty("/approvalDataAllResults", []);

      oModel.read("/et_approval_dataSet", {
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/approvalDataAllResults", aResults);
          oTestModel.setProperty("/approvalDataAllStatus", aResults.length + " record(s) found");
          oTestModel.setProperty("/approvalDataAllStatusState", aResults.length ? "Success" : "Warning");
          console.log("[et_approval_dataSet] All Results:", aResults);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/approvalDataAllStatus", "Fetch Failed: " + sMsg);
          oTestModel.setProperty("/approvalDataAllStatusState", "Error");
          console.error("[et_approval_dataSet] All Fetch Error:", oError);
        }
      });
    },

    onFetchApprovalData: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/approvalDataNfaRefNo");
      var sMailId = oTestModel.getProperty("/approvalDataMailId");

      oTestModel.setProperty("/approvalDataStatus", "Fetching...");
      oTestModel.setProperty("/approvalDataStatusState", "Warning");
      oTestModel.setProperty("/approvalDataResults", []);

      var aFilters = [];
      //if (sNfaRefNo) { aFilters.push(new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)); }
      if (sMailId)   { aFilters.push(new Filter("ApproverMailId", FilterOperator.EQ, sMailId)); }

      oModel.read("/et_approval_dataSet", {
        filters: aFilters,
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/approvalDataResults", aResults);
          oTestModel.setProperty("/approvalDataStatus", aResults.length + " record(s) found");
          oTestModel.setProperty("/approvalDataStatusState", aResults.length ? "Success" : "Warning");
          console.log("[et_approval_dataSet] Results:", aResults);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/approvalDataStatus", "Fetch Failed: " + sMsg);
          oTestModel.setProperty("/approvalDataStatusState", "Error");
          console.error("[et_approval_dataSet] Error:", oError);
        }
      });
    },

    onFetchApprovalForm: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/approvalFormNfaRefNo");

      oTestModel.setProperty("/approvalFormStatus", "Fetching...");
      oTestModel.setProperty("/approvalFormStatusState", "Warning");
      oTestModel.setProperty("/approvalFormResults", []);

      var mParams = {};
      if (sNfaRefNo) {
        mParams.filters = [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)];
      }

      oModel.read("/et_approval_formSet", Object.assign(mParams, {
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/approvalFormResults", aResults);
          oTestModel.setProperty("/approvalFormStatus", aResults.length + " record(s) fetched");
          oTestModel.setProperty("/approvalFormStatusState", aResults.length ? "Success" : "Warning");
          console.log("[et_approval_formSet] Results:", aResults);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/approvalFormStatus", "Fetch Failed");
          oTestModel.setProperty("/approvalFormStatusState", "Error");
          console.error("[et_approval_formSet] Error:", oError);
        }
      }));
    },

    onFetchPaymentTerms: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      oTestModel.setProperty("/paymentTermsResults", []);
      oTestModel.setProperty("/paymentTermsStatus", "Fetching...");
      oTestModel.setProperty("/paymentTermsStatusState", "Warning");

      oModel.read("/ZnfaShPaymentTermsSet", {
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/paymentTermsResults", aResults);
          oTestModel.setProperty("/paymentTermsStatus", aResults.length + " record(s) found");
          oTestModel.setProperty("/paymentTermsStatusState", aResults.length ? "Success" : "Warning");
          console.log("[ZnfaShPaymentTermsSet]:", aResults);
        },
        error: function (oErr) {
          var sMsg = "";
          try { sMsg = JSON.parse(oErr.responseText).error.message.value; } catch (e) { sMsg = oErr.responseText; }
          oTestModel.setProperty("/paymentTermsStatus", "Fetch Failed");
          oTestModel.setProperty("/paymentTermsStatusState", "Error");
          console.error("[ZnfaShPaymentTermsSet] Error:", oErr.responseText);
        }
      });
    },

    onFetchApprovalTable: function () {
      var oModel = this.getOwnerComponent().getModel();

      oModel.read("/et_approval_tableSet", {
        success: function (oData) {
          console.log("[et_approval_tableSet] Results:", oData.results);
        },
        error: function (oError) {
          console.error("[et_approval_tableSet] Error:", oError.responseText);
        }
      });
    },

    onBack: function () {
      this.getOwnerComponent().getRouter().navTo("RoutenfaCreator");
    },

    onTestSequentialPost: function () {
      this._executeSequentialPost();
    },

    // _executeSequentialPost: function () {
    //   var oModel = this.getOwnerComponent().getModel();
    //   var oTestModel = this.getView().getModel("testModel");
    //   var that = this;

    //   oTestModel.setProperty("/status", "Posting NFA Details...");
    //   oTestModel.setProperty("/statusState", "Warning");
    //   oTestModel.setProperty("/nfa", {});
    //   oTestModel.setProperty("/vendors", []);
    //   oTestModel.setProperty("/vendorPR", []);

    //   var oNfaPayload = {
    //     Mandt: "",
    //     NfaRefNo: "",
    //     AribaDocNo: "",
    //     NfaType: "TYPE",
    //     NfaTypeDesc: "Procurement Type",
    //     NfaTitle: "Purchase",
    //     PurchaseOrg: "P100",
    //     PurchaseOrgDesc: "Central Purchasing",
    //     PurchaseGroup: "PG1",
    //     PurchaseGroupDesc: "Mechanical",
    //     Remarks: "Urgent requirement",
    //     BiDate: new Date("2026-03-13T00:00:00"),
    //     CompanyCode: "1000",
    //     CompanyDescription: "ABC Manufacturing Ltd",
    //     PrBudget: "250000.000",
    //     LongText: "Procurement required for project execution",
    //     LdClause: "YES",
    //     LdClauseAmt: "0.000",
    //     AdvanceBg: "YES",
    //     AdavanceBgAmt: "10000.000",
    //     PerformanceBg: "YES",
    //     PerformanceBpAmt: "15000.000",
    //     LowestBasis: "Y",
    //     TechAccepLowBasis: "Y",
    //     ProprietaryBasis: "N",
    //     SingleTenderBasis: "N",
    //     RepeatOrderBasis: "N",
    //     RateContract: "N",
    //     JustificationRemarks: "Lowest technically acceptable vendor",
    //     ScopeOfWork: "Supply and installation",
    //     AdditionalInfo: "Delivery within 30 days",
    //     NegotiationStrategy: "Price negotiations",
    //     VendorCategory: "OEM",
    //     RequestedApprovalOn: "00.00.0000",
    //     Status: "Pending"
    //   };

    //   oModel.create("/et_nfa_detailsSet", oNfaPayload, {
    //     success: function (oData) {
    //       var sNfaRefNo = oData.NfaRefNo;
    //       oTestModel.setProperty("/status", "NFA Posted! Posting Vendors...");
    //       oTestModel.setProperty("/statusState", "Warning");
    //       oTestModel.setProperty("/nfaRefNo", sNfaRefNo);
    //       that._postVendorDetails(sNfaRefNo);
    //     },
    //     error: function (oError) {
    //       var sMsg = "";
    //       try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
    //       oTestModel.setProperty("/status", "NFA Post Failed");
    //       oTestModel.setProperty("/statusState", "Error");
    //       MessageBox.error("NFA Post Failed: " + sMsg);
    //     }
    //   });
    // },

    _postVendorDetails: function (sNfaRefNo) {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var that = this;

      var aVendorItems = [
        {
          NfaRefNo: sNfaRefNo,
          VendorNo: "V001",
          VendorName: "Vendor 1",
          Plant: "0001",
          TotalPrice: "950.00",
          Lpp: "10.00",
          Ta: "001",
          VendorQa: "A",
          GstCredit: "Y",
          GstRemarks: "GST eligible",
          DeliveryRemarks: "Fast delivery",
          BasicTotalAmt: "950.00",
          PfPercent: "5.00",
          PfAmount: "47.50",
          Freight: "20.00",
          GstPercentage: "18",
          GstAmount: "171.00",
          Insurance: "15.00",
          NetLandedCost: "1203.50",
          CommercialRating: "A",
          DeliveryDate: "2026-03-01T00:00:00",
          PaymentTerms: "0010",
          PaymentTermsDesc: "30 Days"
        },
        {
          NfaRefNo: sNfaRefNo,
          VendorNo: "V002",
          VendorName: "Vendor 2",
          Plant: "0001",
          TotalPrice: "950.00",
          Lpp: "10.00",
          Ta: "001",
          VendorQa: "A",
          GstCredit: "Y",
          GstRemarks: "GST eligible",
          DeliveryRemarks: "Fast delivery",
          BasicTotalAmt: "950.00",
          PfPercent: "5.00",
          PfAmount: "47.50",
          Freight: "20.00",
          GstPercentage: "18",
          GstAmount: "171.00",
          Insurance: "15.00",
          NetLandedCost: "1203.50",
          CommercialRating: "A",
          DeliveryDate: "2026-03-01T00:00:00",
          PaymentTerms: "0010",
          PaymentTermsDesc: "30 Days"
        }
      ];

      var oVendorPayload = {
        NfaRefNo: sNfaRefNo,
        VENDOR_ITEMS: aVendorItems
      };

      oModel.create("/et_vendor_detailsSet", oVendorPayload, {
        success: function () {
          oTestModel.setProperty("/status", "Vendors Posted! Posting PR Details...");
          oTestModel.setProperty("/statusState", "Warning");
          that._postVendorPRDetails(sNfaRefNo, aVendorItems);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/status", "Vendor Post Failed");
          oTestModel.setProperty("/statusState", "Error");
          MessageBox.error("Vendor Post Failed: " + sMsg);
        }
      });
    },

    _postVendorPRDetails: function (sNfaRefNo, aVendorItems) {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var that = this;

      var aVendorPR = aVendorItems.map(function (oVendor) {
        return {
          Mandt: "",
          NfaRefNo: sNfaRefNo,
          VendorNo: oVendor.VendorNo,
          PrNo: "1000001234",
          PrItem: "00010",
          Material: "MAT-10001",
          MaterialDescription: "Steel Bolt M10",
          Qty: "100.000",
          Uom: "EA",
          Plant: "1000",
          PlantDescription: "Main Plant",
          MaterialGroup: "MG001",
          MaterialGroupDescription: "Fasteners",
          PurchaseOrg: "P100",
          PurchaseOrgDesc: "Central Purchasing",
          PurchaseGroup: "PG1",
          PurchaseGroupDesc: "Mechanical",
          InitialPrice: "90.000",
          NegotiatedPrice: "80.000",
          RemainingQty: "50.000",
          SplitPoQty: "50.000",
          FinilizedLinePrice: "5000.000",
          Freight: "200.000",
          GstPercentage: "18",
          GstAmount: "936.000",
          Insurance: "50.000"
        };
      });

      var oPRPayload = {
        NfaRefNo: sNfaRefNo,
        VENDOR_PR: aVendorPR
      };

      oModel.create("/et_vendor_pr_detailsSet", oPRPayload, {
        success: function () {
          oTestModel.setProperty("/status", "All Posts Completed!");
          oTestModel.setProperty("/statusState", "Success");
          MessageToast.show("All 3 posts done! Fetching data...");
          that.onFetchAll();
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/status", "PR Post Failed");
          oTestModel.setProperty("/statusState", "Error");
          MessageBox.error("PR Post Failed: " + sMsg);
        }
      });
    },

    // ===== FETCH ALL DATA =====
    onFetchAll: function () {
      var sNfaRefNo = this.getView().getModel("testModel").getProperty("/nfaRefNo");
      if (!sNfaRefNo) {
        MessageBox.warning("Please enter or post to get an NFA Reference Number first.");
        return;
      }
      this._fetchNfaDetails(sNfaRefNo);
      this._fetchVendorDetails(sNfaRefNo);
      this._fetchVendorPRDetails(sNfaRefNo);
    },

    // Fetch ALL NFA records without filter - uses $top to bypass server paging
    onFetchAllNfaList: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");

      oTestModel.setProperty("/nfaList", []);
      oTestModel.setProperty("/nfaListStatus", "Fetching...");
      oTestModel.setProperty("/debugRawResponse", "");

      // Try all 3 approaches and log each
      // Approach 1: plain read with high $top
      oModel.read("/et_nfa_detailsSet", {
        urlParameters: { "$top": "9999" },
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/nfaList", aResults);
          oTestModel.setProperty("/nfaListStatus",
            "Backend returned: " + aResults.length + " record(s). " +
            (oData.__count ? "Total count: " + oData.__count : "(no __count)"));
          oTestModel.setProperty("/debugRawResponse",
            JSON.stringify(aResults.map(function(r) {
              return { NfaRefNo: r.NfaRefNo, Status: r.Status, CompanyCode: r.CompanyCode };
            }), null, 2));
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch(e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/nfaListStatus", "Error: " + sMsg);
          oTestModel.setProperty("/debugRawResponse", oError.responseText);
        }
      });
    },

    onSelectNfaFromList: function (oEvent) {
      var oItem = oEvent.getParameter("listItem");
      var oCtx = oItem.getBindingContext("testModel");
      var sNfaRefNo = oCtx.getProperty("NfaRefNo");
      this.getView().getModel("testModel").setProperty("/nfaRefNo", sNfaRefNo);
      this._fetchNfaDetails(sNfaRefNo);
      this._fetchVendorDetails(sNfaRefNo);
      this._fetchVendorPRDetails(sNfaRefNo);
    },

    _fetchNfaDetails: function (sNfaRefNo) {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sServiceUrl = oModel.sServiceUrl || "/sap/opu/odata/sap/ZNFA_SRV";
      var sFilterUrl = sServiceUrl + "/et_nfa_detailsSet?$filter=NfaRefNo eq '" + sNfaRefNo + "'";

      oTestModel.setProperty("/debugRawResponse", "Fetching: " + sFilterUrl);

      oModel.read("/et_nfa_detailsSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        success: function (oData) {
          if (oData.results && oData.results.length) {
            oTestModel.setProperty("/nfa", oData.results[0]);
            oTestModel.setProperty("/debugRawResponse",
              "URL: " + sFilterUrl + "\n\nResponse:\n" + JSON.stringify(oData.results[0], null, 2));
          } else {
            oTestModel.setProperty("/debugRawResponse",
              "URL: " + sFilterUrl + "\n\nNo records returned.");
          }
        },
        error: function (oError) {
          oTestModel.setProperty("/debugRawResponse",
            "URL: " + sFilterUrl + "\n\nError: " + oError.responseText);
          MessageToast.show("Failed to fetch NFA details");
        }
      });
    },

    _fetchVendorDetails: function (sNfaRefNo) {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");

      oModel.read("/et_vendor_item_detailsSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        success: function (oData) {
          oTestModel.setProperty("/vendors", oData.results || []);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/debugRawResponse", "Vendor fetch error (" + oError.statusCode + "): " + sMsg);
          MessageToast.show("Vendor fetch failed (" + oError.statusCode + "): " + sMsg);
        }
      });
    },

    _fetchVendorPRDetails: function (sNfaRefNo) {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");

      oModel.read("/et_vendor_pr_item_detailsSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        success: function (oData) {
          oTestModel.setProperty("/vendorPR", oData.results || []);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/debugRawResponse", "Vendor PR fetch error (" + oError.statusCode + "): " + sMsg);
          MessageToast.show("Vendor PR fetch failed (" + oError.statusCode + "): " + sMsg);
        }
      });
    },

    // ===== VENDOR QUOTED SECTION =====

    onFetchVersionData: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/versionDataNfaRefNo");
      var sVersionNo = oTestModel.getProperty("/versionDataVersionNo");
      if (!sNfaRefNo) { MessageBox.warning("Please enter NFA Ref No."); return; }

      oTestModel.setProperty("/versionDataStatus", "Fetching...");
      oTestModel.setProperty("/versionDataStatusState", "Warning");
      oTestModel.setProperty("/versionDataResults", []);

      var aFilters = [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)];
      if (sVersionNo) { aFilters.push(new Filter("Version", FilterOperator.EQ, sVersionNo)); }

      oModel.read("/et_version_logSet", {
        filters: aFilters,
        urlParameters: { "$expand": "VENDOR_LOG,VENDOR_PR_LOG" },
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/versionDataResults", aResults);
          oTestModel.setProperty("/versionDataStatus", aResults.length + " record(s) found");
          oTestModel.setProperty("/versionDataStatusState", aResults.length ? "Success" : "Warning");
          console.log("[et_version_logSet] Results:", aResults);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/versionDataStatus", "Fetch Failed: " + sMsg);
          oTestModel.setProperty("/versionDataStatusState", "Error");
          console.error("[et_version_logSet] Error:", oError);
        }
      });
    },

    onPostVendorAmendment: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/vendorAmendNfaRefNo");
      var sReason = oTestModel.getProperty("/vendorAmendReason");

      if (!sNfaRefNo) { MessageBox.warning("Please enter NFA Ref No."); return; }
      if (!sReason)   { MessageBox.warning("Please enter Reason For Amendment."); return; }

      oTestModel.setProperty("/vendorAmendStatus", "Posting...");
      oTestModel.setProperty("/vendorAmendStatusState", "Warning");
      oTestModel.setProperty("/vendorAmendResults", []);

      var oPayload = {
        NfaRefNo: sNfaRefNo,
        VENDOR_ITEMS: { results: [{ NfaRefNo: sNfaRefNo, VendorNo: "", ReasonForAmendment: sReason }] }
      };

      console.log("[et_vendor_detailsSet] POST Amendment payload:", JSON.stringify(oPayload));

      oModel.create("/et_vendor_detailsSet", oPayload, {
        success: function (oData) {
          oTestModel.setProperty("/vendorAmendStatus", "Posted! Fetching vendor items...");
          oTestModel.setProperty("/vendorAmendStatusState", "Success");
          console.log("[et_vendor_detailsSet] POST success:", oData);

          oModel.read("/et_vendor_item_detailsSet", {
            filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
            success: function (oFetchData) {
              var aResults = oFetchData.results || [];
              oTestModel.setProperty("/vendorAmendResults", aResults);
              oTestModel.setProperty("/vendorAmendStatus", "Posted! " + aResults.length + " vendor item(s) returned");
              console.log("[et_vendor_item_detailsSet] After amendment:", aResults);
            },
            error: function (oErr) {
              var sMsg = "";
              try { sMsg = JSON.parse(oErr.responseText).error.message.value; } catch (e) { sMsg = oErr.responseText; }
              oTestModel.setProperty("/vendorAmendStatus", "Posted but fetch failed: " + sMsg);
              oTestModel.setProperty("/vendorAmendStatusState", "Warning");
            }
          });
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/vendorAmendStatus", "Post Failed: " + sMsg);
          oTestModel.setProperty("/vendorAmendStatusState", "Error");
          MessageBox.error("Amendment Post Failed: " + sMsg);
        }
      });
    },

    onFetchVendorQuoted: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/vendorQuotedNfaRefNo");

      if (!sNfaRefNo) { MessageBox.warning("Please enter NFA Ref No."); return; }

      oTestModel.setProperty("/vendorQuotedStatus", "Fetching...");
      oTestModel.setProperty("/vendorQuotedStatusState", "Warning");
      oTestModel.setProperty("/vendorQuotedList", []);

      oModel.read("/et_vendor_item_detailsSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/vendorQuotedList", aResults);
          oTestModel.setProperty("/vendorQuotedStatus", aResults.length + " vendor(s) found");
          oTestModel.setProperty("/vendorQuotedStatusState", aResults.length ? "Success" : "Warning");
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/vendorQuotedStatus", "Fetch Failed");
          oTestModel.setProperty("/vendorQuotedStatusState", "Error");
          MessageBox.error("Vendor fetch failed: " + sMsg);
        }
      });
    },

    onOpenVendorAttachDialog: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("testModel");
      var oVendor = oCtx.getObject();
      var oTestModel = this.getView().getModel("testModel");
      var oModel = this.getOwnerComponent().getModel();

      oTestModel.setProperty("/attachDialog", {
        vendorNo: oVendor.VendorNo,
        vendorName: oVendor.VendorName || oVendor.VendorNo,
        nfaRefNo: oVendor.NfaRefNo,
        stagedFiles: [],
        fileCountText: "No documents selected yet.",
        existingFiles: [],
        fetchStatus: "Fetching existing documents...",
        fetchStatusState: "Warning"
      });

      if (!this._oVendorAttachDialog) {
        this._oVendorAttachDialog = sap.ui.xmlfragment(
          this.getView().getId(),
          "com.df.nfa.creator_v2.view.fragments.VendorAttachDialog",
          this
        );
        this.getView().addDependent(this._oVendorAttachDialog);
      }
      this._oVendorAttachDialog.setModel(oTestModel, "testModel");
      this._oVendorAttachDialog.open();

      // Fetch existing supplier attachments for this vendor + NFA
      oModel.read("/et_attachment_supplierSet", {
        filters: [
          new Filter("NfaRefNo", FilterOperator.EQ, oVendor.NfaRefNo),
          new Filter("VendorNo", FilterOperator.EQ, oVendor.VendorNo)
        ],
        success: function (oData) {
          var aResults = (oData.results || []).map(function (o, i) {
            return Object.assign({}, o, { idx: i + 1 });
          });
          oTestModel.setProperty("/attachDialog/existingFiles", aResults);
          oTestModel.setProperty("/attachDialog/fetchStatus", aResults.length ? aResults.length + " document(s) found" : "No existing documents");
          oTestModel.setProperty("/attachDialog/fetchStatusState", aResults.length ? "Success" : "None");
        },
        error: function () {
          oTestModel.setProperty("/attachDialog/fetchStatus", "Failed to fetch existing documents");
          oTestModel.setProperty("/attachDialog/fetchStatusState", "Error");
        }
      });
    },

    onVendorAttachFileChange: function (oEvent) {
      var oFileUploader = oEvent.getSource();
      // Access the native file input directly for reliable multi-file support
      var oDomRef = oFileUploader.getDomRef();
      var oNativeInput = oDomRef ? oDomRef.querySelector("input[type='file']") : null;
      var aFiles = oNativeInput ? oNativeInput.files : oEvent.getParameter("files");

      if (!aFiles || !aFiles.length) { return; }

      var oTestModel = this.getView().getModel("testModel");
      var aStaged = oTestModel.getProperty("/attachDialog/stagedFiles") || [];

      for (var i = 0; i < aFiles.length; i++) {
        var oFile = aFiles[i];
        aStaged.push({
          idx: aStaged.length + 1,
          fileName: oFile.name,
          mimeType: oFile.type || "application/octet-stream",
          _fileObject: oFile
        });
      }

      oTestModel.setProperty("/attachDialog/stagedFiles", aStaged.slice());
      oTestModel.setProperty("/attachDialog/fileCountText", aStaged.length + " document(s) selected.");
      // Refresh the model so the table re-renders
      oTestModel.refresh(true);
    },

    onRemoveVendorAttachFile: function (oEvent) {
      var oTestModel = this.getView().getModel("testModel");
      var iIdx = parseInt(oEvent.getSource().getBindingContext("testModel").getPath().split("/").pop());
      var aStaged = oTestModel.getProperty("/attachDialog/stagedFiles");
      aStaged.splice(iIdx, 1);
      // Re-index
      aStaged.forEach(function (o, i) { o.idx = i + 1; });
      oTestModel.setProperty("/attachDialog/stagedFiles", aStaged.slice());
      oTestModel.setProperty("/attachDialog/fileCountText", aStaged.length ? aStaged.length + " document(s) selected." : "No documents selected yet.");
      oTestModel.refresh(true);
    },

    onPreviewVendorAttachment: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("testModel");
      var oFile = oCtx.getObject();
      if (!oFile._fileObject) { return; }
      var sUrl = URL.createObjectURL(oFile._fileObject);
      window.open(sUrl, "_blank");
    },

    onPreviewExistingAttachment: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("testModel");
      var oFile = oCtx.getObject();
      if (!oFile.SupplierFileData) {
        MessageToast.show("No file data available to preview.");
        return;
      }
      var sMime = oFile.SupplierDocMime || "application/octet-stream";
      var sByteChars = atob(oFile.SupplierFileData);
      var aBytes = new Uint8Array(sByteChars.length);
      for (var i = 0; i < sByteChars.length; i++) {
        aBytes[i] = sByteChars.charCodeAt(i);
      }
      var sUrl = URL.createObjectURL(new Blob([aBytes], { type: sMime }));
      window.open(sUrl, "_blank");
    },

    onConfirmVendorAttach: function () {
      var oTestModel = this.getView().getModel("testModel");
      var aStaged = oTestModel.getProperty("/attachDialog/stagedFiles") || [];

      if (!aStaged.length) {
        MessageBox.warning("Please select at least one document.");
        return;
      }

      MessageBox.confirm("Are you sure you want to upload these documents?", {
        title: "Confirm Upload",
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.OK,
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) { return; }
          this._postVendorSupplierAttachments();
        }.bind(this)
      });
    },

    _postVendorSupplierAttachments: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var oDialog = oTestModel.getProperty("/attachDialog");
      var aStaged = oDialog.stagedFiles || [];
      var sNfaRefNo = oDialog.nfaRefNo;
      var sVendorNo = oDialog.vendorNo;

      var aReaders = aStaged.map(function (oRow) {
        return new Promise(function (resolve, reject) {
          var oReader = new FileReader();
          oReader.onload = function (e) { resolve({ row: oRow, base64: e.target.result.split(",")[1] }); };
          oReader.onerror = reject;
          oReader.readAsDataURL(oRow._fileObject);
        });
      });

      Promise.all(aReaders).then(function (aResults) {
        // Mirror buyer pattern: ATTACH_SUP as { results: [...] } — one batch call for all files
        var aSupItems = aResults.map(function (oResult) {
          return {
            NfaRefNo: sNfaRefNo,
            VendorNo: sVendorNo,
            SupplierDoc: oResult.row.fileName,
            SupplierDocMime: oResult.row.mimeType,
            SupplierFileData: oResult.base64,
            SupplierSpl: ""
          };
        });

        var oPayload = { NfaRefNo: sNfaRefNo, ATTACH_SUP: { results: aSupItems } };

        console.log("[SupplierAttach] POST payload:", JSON.stringify(Object.assign({}, oPayload, {
          ATTACH_SUP: { results: aSupItems.map(function (o) { return Object.assign({}, o, { SupplierFileData: "<base64>" }); }) }
        })));

        oModel.create("/et_attachHeadSet", oPayload, {
          success: function () {
            oTestModel.setProperty("/attachDialog/stagedFiles", []);
            oTestModel.setProperty("/attachDialog/fileCountText", "No documents selected yet.");
            MessageToast.show("Supplier attachments saved successfully.");

            oTestModel.setProperty("/attachDialog/fetchStatus", "Refreshing...");
            oTestModel.setProperty("/attachDialog/fetchStatusState", "Warning");
            oModel.read("/et_attachment_supplierSet", {
              filters: [
                new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
                new Filter("VendorNo", FilterOperator.EQ, sVendorNo)
              ],
              success: function (oData) {
                var aRefreshed = (oData.results || []).map(function (o, i) {
                  return Object.assign({}, o, { idx: i + 1 });
                });
                oTestModel.setProperty("/attachDialog/existingFiles", aRefreshed);
                oTestModel.setProperty("/attachDialog/fetchStatus", aRefreshed.length + " document(s) found");
                oTestModel.setProperty("/attachDialog/fetchStatusState", "Success");
              },
              error: function () {
                oTestModel.setProperty("/attachDialog/fetchStatus", "Failed to refresh documents");
                oTestModel.setProperty("/attachDialog/fetchStatusState", "Error");
              }
            });
          },
          error: function (oError) {
            var sMsg = "";
            try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText || "Unknown error"; }
            MessageBox.error("Failed to save attachments: " + sMsg);
          }
        });

      }).catch(function () {
        MessageBox.error("Error reading selected files.");
      });
    },

    onCloseVendorAttachDialog: function () {
      if (this._oVendorAttachDialog) { this._oVendorAttachDialog.close(); }
    },

    onPostNfaAmendment: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/nfaAmendNfaRefNo");
      var sReason = oTestModel.getProperty("/nfaAmendReason");

      // Mandatory validation — mirrors DocEdit mode behaviour
      var bValid = true;
      if (!sNfaRefNo) {
        oTestModel.setProperty("/nfaAmendNfaRefNoState", "Error");
        bValid = false;
      } else {
        oTestModel.setProperty("/nfaAmendNfaRefNoState", "None");
      }
      if (!sReason) {
        oTestModel.setProperty("/nfaAmendReasonState", "Error");
        bValid = false;
      } else {
        oTestModel.setProperty("/nfaAmendReasonState", "None");
      }
      if (!bValid) {
        MessageBox.warning("Reason For Amendment is mandatory when updating NFA in DocEdit mode.");
        return;
      }

      oTestModel.setProperty("/nfaAmendStatus", "Posting...");
      oTestModel.setProperty("/nfaAmendStatusState", "Warning");

      var oPayload = { NfaRefNo: sNfaRefNo, ReasonForAmendment: sReason, Version:'01' };
      console.log("[et_nfa_detailsSet] NFA Amendment POST payload:", JSON.stringify(oPayload));

      oModel.create("/et_nfa_detailsSet", oPayload, {
        success: function (oData) {
          var sMsg = oData.MessageText || "Posted Successfully!";
          oTestModel.setProperty("/nfaAmendStatus", sMsg);
          oTestModel.setProperty("/nfaAmendStatusState", oData.MessageType === "E" ? "Error" : "Success");
          console.log("[et_nfa_detailsSet] NFA Amendment POST success:", oData);
          MessageToast.show("NFA Amendment posted: " + sMsg);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/nfaAmendStatus", "Post Failed: " + sMsg);
          oTestModel.setProperty("/nfaAmendStatusState", "Error");
          MessageBox.error("NFA Amendment Post Failed: " + sMsg);
          console.error("[et_nfa_detailsSet] NFA Amendment POST error:", oError);
        }
      });
    },

    onFetchCreateUpdateButton: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var sNfaRefNo = oTestModel.getProperty("/createUpdateBtnNfaRefNo");

      if (!sNfaRefNo) { MessageBox.warning("Please enter NFA Ref No."); return; }

      oTestModel.setProperty("/createUpdateBtnStatus", "Fetching...");
      oTestModel.setProperty("/createUpdateBtnStatusState", "Warning");
      oTestModel.setProperty("/createUpdateBtnResults", []);
      oTestModel.setProperty("/docCreateStatus", "");
      oTestModel.setProperty("/docCreateStatusState", "None");

      oModel.read("/CreateUpdate_ButtonSet", {
        filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
        success: function (oData) {
          var aResults = oData.results || [];
          oTestModel.setProperty("/createUpdateBtnResults", aResults);
          oTestModel.setProperty("/createUpdateBtnStatus", aResults.length + " record(s) found");
          oTestModel.setProperty("/createUpdateBtnStatusState", aResults.length ? "Success" : "Warning");
          console.log("[CreateUpdate_ButtonSet] Results:", aResults);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/createUpdateBtnStatus", "Fetch Failed: " + sMsg);
          oTestModel.setProperty("/createUpdateBtnStatusState", "Error");
          console.error("[CreateUpdate_ButtonSet] Error:", oError);
        }
      });
    },

    onPostDocumentCreate: function (oEvent) {
      var oModel = this.getOwnerComponent().getModel();
      var oTestModel = this.getView().getModel("testModel");
      var oCtx = oEvent.getSource().getBindingContext("testModel");
      var oRow = oCtx.getObject();
      var sDocTypeDesc = oTestModel.getProperty("/docTypeDesc") || "";

      var oPayload = {
        NfaRefNo:       oRow.NfaRefNo,
        NfaDocType:     oRow.DocumentType,
        DocTypeDesc:    sDocTypeDesc,
        PoCreate:       oRow.PurchaseOrder   ? "X" : "",
        ContractCreate: oRow.ContractNo      ? "X" : "",
        SaCreate:       oRow.SchlAgreementNo ? "X" : "",
        MessageType:    "",
        MessageText:    "",
        RETURN: {
          results: [{
            Type: "", Id: "", Number: "", Message: "",
            LogNo: "", LogMsgNo: "",
            MessageV1: "", MessageV2: "", MessageV3: "", MessageV4: "",
            Parameter: "", Row: 0, Field: "", System: ""
          }]
        }
      };

      console.log("[et_document_createSet] POST payload:", JSON.stringify(oPayload));

      oTestModel.setProperty("/docCreateStatus", "Posting for VendorNo: " + oRow.VendorNo + "...");
      oTestModel.setProperty("/docCreateStatusState", "Warning");

      oModel.create("/et_document_createSet", oPayload, {
        success: function (oData) {
          var sMsg = oData.MessageText || "Posted Successfully!";
          oTestModel.setProperty("/docCreateStatus", "VendorNo " + oRow.VendorNo + ": " + sMsg);
          oTestModel.setProperty("/docCreateStatusState", oData.MessageType === "E" ? "Error" : "Success");
          console.log("[et_document_createSet] POST success:", oData);
          MessageToast.show("Document update posted for VendorNo: " + oRow.VendorNo);
        },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText; }
          oTestModel.setProperty("/docCreateStatus", "Post Failed: " + sMsg);
          oTestModel.setProperty("/docCreateStatusState", "Error");
          MessageBox.error("Post Failed: " + sMsg);
          console.error("[et_document_createSet] POST error:", oError);
        }
      });
    }

  });
});
