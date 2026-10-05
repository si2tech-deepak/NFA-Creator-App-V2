sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    // Start: added by SI2 Tech - PO info popover (Unit LPP ⓘ) shared with the QCS page
    "com/df/nfa/creator_v2/controller/mixin/PoHistory",
    // End: added by SI2 Tech
  ],
  function (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, PoHistory) { // PoHistory: added by SI2 Tech
    "use strict";

    // Start: added by SI2 Tech - PoHistory mixed in via Object.assign (closed at the end of the file)
    return Controller.extend("com.df.nfa.creator_v2.controller.nfaCreate", Object.assign({}, PoHistory, {
    // End: added by SI2 Tech
      onInit: function () {
        this.getOwnerComponent()
          .getRouter()
          .getRoute("RoutenfaCreate")
          .attachPatternMatched(this._onRouteMatched, this);



        var oViewModel = new JSONModel({
            header: {
              BiDate: new Date()
            },
            vendors: [],
            vendorPR: [],
            showSubmit: false,
            nfaDraftSaved: false,
            vendorDraftSaved: false,
            isAribaMode: false,
            isEditMode: false,
            isApprovedMode: false,
            isDocEditMode: false,
            prevPoReadOnly: false,
            pageTitle: "NFA Create Page",
            approvalData: [],
            approvalVersions: [],
            approvalPhases: [],
            nfaVersion: null,
            versionHistory: [],
            versionView: {},
            companyCodeEditable: false,
            purchaseGroupEditable: false
          });

        this._bIsDirty = false;

        this.getView().setModel(oViewModel, "viewModel");

        // Guard flag - prevents double dialog
        this._bDialogOpen = false;
        this._sCurrentNfaHash = null;

        // Store hash each time nfaCreate route is matched (merged into _onRouteMatched to avoid double attachment)

        // Browser back / two-finger swipe — just call onBack which already handles dirty check
        this._fnHashChange = function () {
          var oVM = this.getView().getModel("viewModel");
          if (!this._bIsDirty || !oVM || !oVM.getProperty("/isEditMode")) { return; }
          // Restore hash first so URL stays on nfaCreate page
          sap.ui.core.routing.HashChanger.getInstance().replaceHash(this._sCurrentNfaHash);
          // Reuse the same onBack logic — single dialog, no duplication
          this.onBack();
        }.bind(this);
        window.addEventListener("hashchange", this._fnHashChange);

        // Fiori Launchpad shell navigation filter
        if (sap.ushell && sap.ushell.Container) {
          try {
            var oShellService = sap.ushell.Container.getService("ShellNavigation");
            if (oShellService && oShellService.registerNavigationFilter) {
              this._fnNavFilter = function () {
                var oVM = this.getView().getModel("viewModel");
                if (this._bIsDirty && oVM && oVM.getProperty("/isEditMode")) {
                  this._showDirtyConfirmDialog();
                  return oShellService.NavigationFilterStatus.Abandon;
                }
                return oShellService.NavigationFilterStatus.Continue;
              }.bind(this);
              oShellService.registerNavigationFilter(this._fnNavFilter);
            }
          } catch (e) { /* not on Launchpad */ }
        }

        var oBuyerModel = new JSONModel({ items: [] });
        this.getView().setModel(oBuyerModel, "buyerDocs");

        var oSupplierModel = new JSONModel({ items: [] });
        this.getView().setModel(oSupplierModel, "supplierDocs");

        // Start: added by SI2 Tech - Download Form only for users in ZNFA_SEARCHHELP (TYPE FORM_DOWNLOAD)
        this._si2LoadFormAccess();
        // End: added by SI2 Tech
      },

      // Start: added by SI2 Tech - Download Form only for users in ZNFA_SEARCHHELP (TYPE FORM_DOWNLOAD)
      // Component model "formAccess" { canDownload }: loaded once per app session, shared with the QCS page.
      // The SAP user ID is in DESCRIPTION; any error or missing user keeps the button hidden.
      _si2LoadFormAccess: function () {
        var oComponent = this.getOwnerComponent();
        if (oComponent.getModel("formAccess")) { return; }
        var oAccessModel = new JSONModel({ canDownload: false });
        oComponent.setModel(oAccessModel, "formAccess");
        var oODataModel = oComponent.getModel();

        // SI2 Tech: replaced by the block below - the local sandbox launchpad reports DEFAULT_USER, not the SAP user
        // var pUserId;
        // try {
        //   if (sap.ushell && sap.ushell.Container) {
        //     pUserId = sap.ushell.Container.getServiceAsync
        //       ? sap.ushell.Container.getServiceAsync("UserInfo").then(function (oUserInfo) { return oUserInfo.getId(); })
        //       : Promise.resolve(sap.ushell.Container.getUser().getId());
        //   } else {
        //     pUserId = Promise.resolve(""); // no launchpad: button stays hidden
        //   }
        // } catch (e) {
        //   pUserId = Promise.resolve("");
        // }
        // Start: added by SI2 Tech - user ID from the SAP system (/sap/bc/ui2/start_up = logged-on user, also via the
        // local proxy); the launchpad user is only the fallback
        var fnShellUser = function () {
          try {
            if (sap.ushell && sap.ushell.Container) {
              return sap.ushell.Container.getServiceAsync
                ? sap.ushell.Container.getServiceAsync("UserInfo").then(function (oUserInfo) { return oUserInfo.getId(); })
                : Promise.resolve(sap.ushell.Container.getUser().getId());
            }
          } catch (e) { /* no launchpad */ }
          return Promise.resolve(""); // no user: button stays hidden
        };
        var pUserId = fetch("/sap/bc/ui2/start_up", { credentials: "same-origin", headers: { Accept: "application/json" } })
          .then(function (oResp) {
            if (!oResp.ok) { throw new Error("start_up " + oResp.status); }
            return oResp.json();
          })
          .then(function (oStartUp) {
            if (!oStartUp || !oStartUp.id) { throw new Error("start_up: no user"); }
            return oStartUp.id;
          })
          .catch(fnShellUser);
        // End: added by SI2 Tech

        pUserId.then(function (sUserId) {
          var sUser = String(sUserId || "").trim().toUpperCase();
          if (!sUser) { return; }
          oODataModel.read("/et_nfa_search_helpSet", {
            filters: [new Filter("Type", FilterOperator.EQ, "FORM_DOWNLOAD")],
            success: function (oData) {
              var bAllowed = (oData.results || []).some(function (r) {
                return String(r.Type || "").trim() === "FORM_DOWNLOAD" &&
                       !String(r.DeletionFlag || "").trim() &&
                       String(r.Description || "").trim().toUpperCase() === sUser;
              });
              oAccessModel.setProperty("/canDownload", bAllowed);
            },
            error: function () {
              oAccessModel.setProperty("/canDownload", false);
            }
          });
        }).catch(function () {
          oAccessModel.setProperty("/canDownload", false);
        });
      },
      // End: added by SI2 Tech

  //      var oModel = this.getOwnerComponent().getModel();
  // oModel.read("/ZNFA_SH_VENDORSet", {
  //   success: function(oData) {
  //     console.log("ZNFA_SH_VENDORSet data:", oData);
  //   },
  //   error: function(oError) {
  //     console.error("Error reading ZNFA_SH_VENDORSet:", oError);
  //   }
  // });


// _loadTestData: function () {
//   var oODataModel = this.getOwnerComponent().getModel();
//   var that = this;

//   oODataModel.read("/et_nfa_detailsSet", {
//     filters: [new Filter("NfaRefNo", FilterOperator.EQ, "NFA000000000011")],
//     success: function (oData) {
//       console.log("Test Data:", oData);
//       if (oData.results && oData.results.length) {
//         that.getView().getModel("viewModel").setProperty("/header", oData.results[0]);
//         that._loadVendorData(oData.results[0].NfaRefNo);
//       }
//     },
//     error: function (oError) {
//       console.error("Error loading test data:", oError);
//     }
//   });
// },

      _onRouteMatched: function (oEvent) {
        var sMode = oEvent.getParameter("arguments").mode;
        var sDocNo = oEvent.getParameter("arguments").docNo;

        var oViewModel = this.getView().getModel("viewModel");

        // Reset validation error states on all validated controls
        var aControlIds = ["companyCodeInput", "purchaseOrgInput", "purchaseGroupInput", "currencyInput", "incotermsInput", "headerPlantInput",
                           "ldClauseAmtInput", "advanceBgAmtInput", "performanceBgAmtInput", "cpbgAmtInput", "nfaTitleHeaderInput"];
        aControlIds.forEach(function (sId) {
          var oCtrl = this.byId(sId);
          if (oCtrl) { oCtrl.setValueState("None"); }
        }.bind(this));

        // Always clear stale data before loading a new NFA
        this._bIsDirty = false;
        this._bCompanyCodeSelected   = false;
        this._bPurchaseOrgSelected   = false;
        this._bPurchaseGroupSelected = false;
        this._bCurrencySelected      = false;
        this._bIncotermsSelected     = false;
        this._bPlantSelected         = false;
        oViewModel.setProperty("/isDocEditMode", false);
        oViewModel.setProperty("/vendors", []);
        oViewModel.setProperty("/vendorPR", []);
        oViewModel.setProperty("/header", { BiDate: new Date(), TbdDate: null });
        this.getView().getModel("buyerDocs").setProperty("/items", []);

        if (sMode === "ARIBA" && sDocNo) {
          oViewModel.setProperty("/isAribaMode", true);
          oViewModel.setProperty("/isApprovedMode", false);
          // If docNo looks like an NFA ref (not an Ariba doc no), load via NFA ref
          var bIsNfaRef = sDocNo.indexOf("NFA") === 0;
          if (bIsNfaRef) {
            oViewModel.setProperty("/isEditMode", true);
            oViewModel.setProperty("/pageTitle", "Edit NFA " + sDocNo);
            this._loadNfaData(sDocNo);
          } else {
            oViewModel.setProperty("/isEditMode", true);
            oViewModel.setProperty("/pageTitle", "NFA Create Page");
            this._loadAribaData(sDocNo);
          }
        } else if (sMode === "docEdit" && sDocNo) {
          oViewModel.setProperty("/isAribaMode", false);
          oViewModel.setProperty("/isEditMode", false);
          oViewModel.setProperty("/isApprovedMode", false);
          oViewModel.setProperty("/isDocEditMode", true);
          oViewModel.setProperty("/pageTitle", "Edit NFA " + sDocNo);
          this._loadNfaData(sDocNo);
        } else if (sMode === "edit" && sDocNo) {
          oViewModel.setProperty("/isAribaMode", false);
          oViewModel.setProperty("/isEditMode", true);
          oViewModel.setProperty("/isApprovedMode", false);
          oViewModel.setProperty("/isDocEditMode", false);
          oViewModel.setProperty("/pageTitle", "Edit NFA " + sDocNo);
          this._loadNfaData(sDocNo);
        } else if (sMode === "view" && sDocNo) {
          oViewModel.setProperty("/isAribaMode", false);
          oViewModel.setProperty("/isEditMode", false);
          oViewModel.setProperty("/isApprovedMode", false);
          oViewModel.setProperty("/isDocEditMode", false);
          var bFromQCS = oEvent.getParameter("arguments")["?query"] && oEvent.getParameter("arguments")["?query"].fromQCS === "true";
          oViewModel.setProperty("/pageTitle", bFromQCS ? "NFA Create Page" : "Edit NFA " + sDocNo);
          oViewModel.setProperty("/prevPoReadOnly", bFromQCS);
          this._loadNfaData(sDocNo);
        } else if (sMode === "approved" && sDocNo) {
          oViewModel.setProperty("/isAribaMode", false);
          oViewModel.setProperty("/isEditMode", false);
          oViewModel.setProperty("/isApprovedMode", true);
          oViewModel.setProperty("/isDocEditMode", false);
          oViewModel.setProperty("/pageTitle", "Approved NFA " + sDocNo);
          this._loadNfaData(sDocNo);
        } else if (sMode === "MANUAL") {
          oViewModel.setProperty("/isAribaMode", false);
          oViewModel.setProperty("/isEditMode", true);
          oViewModel.setProperty("/isApprovedMode", false);
          oViewModel.setProperty("/isDocEditMode", false);
          oViewModel.setProperty("/pageTitle", "NFA Create Page");
          this._initializeEmptyForm();
        }

        // Capture current hash for dirty-check back navigation
        this._sCurrentNfaHash = sap.ui.core.routing.HashChanger.getInstance().getHash();

        // Clear version for new NFAs (no docNo)
        if (!sDocNo) {
          this.getView().getModel("viewModel").setProperty("/nfaVersion", null);
          this.getView().getModel("viewModel").setProperty("/versionHistory", []);
        }

        // Restore vendors from QCS if coming back from QCS page
        this._restoreVendorsFromQCS();
        this._updateCompanyCodeEditable();
      },

      onExit: function () {
        // Deregister shell navigation filter
        if (sap.ushell && sap.ushell.Container && this._fnNavFilter) {
          try {
            var oShellService = sap.ushell.Container.getService("ShellNavigation");
            if (oShellService && oShellService.unregisterNavigationFilter) {
              oShellService.unregisterNavigationFilter(this._fnNavFilter);
            }
          } catch (e) { /* ignore */ }
        }
        // Remove hashchange listener
        if (this._fnHashChange) {
          window.removeEventListener("hashchange", this._fnHashChange);
        }
      },

      _showDirtyConfirmDialog: function () {
        var that = this;
        this._bDialogOpen = true;
        sap.m.MessageBox.confirm("You have unsaved changes. Are you sure you want to go back?", {
          title: "Unsaved Changes",
          onClose: function (sAction) {
            that._bDialogOpen = false;
            if (sAction === sap.m.MessageBox.Action.OK) {
              that._bIsDirty = false;
              that.getOwnerComponent().getRouter().navTo("RoutenfaCreator", {}, true);
            }
          }
        });
      },

      onEdit: function () {
        var oViewModel = this.getView().getModel("viewModel");
        oViewModel.setProperty("/isEditMode", true);
        // When user clicks Edit after returning from QCS, clear prevPoReadOnly
        // so the Prev PO field becomes editable (controlled by onNfaTypeCheckbox from here)
        oViewModel.setProperty("/prevPoReadOnly", false);
        // isDocEditMode stays as-is — restrictions remain active in docEdit flow
        // Re-evaluate field editability now that isEditMode is true
        this._updateCompanyCodeEditable();
      },

      onCancelEdit: function () {
        var oViewModel = this.getView().getModel("viewModel");
        oViewModel.setProperty("/isEditMode", false);
        // reload to discard changes
        var sNfaRefNo = oViewModel.getProperty("/header/NfaRefNo");
        if (sNfaRefNo) { this._loadNfaData(sNfaRefNo); }
      },

      _loadVersionHistoryCombo: function (sNfaRefNo) {
        var oODataModel = this.getOwnerComponent().getModel();
        var oViewModel = this.getView().getModel("viewModel");

        oODataModel.read("/et_version_logSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          urlParameters: { "$expand": "VENDOR_LOG,VENDOR_PR_LOG,APP_FORM_LOG" },
          forceServerDataRequest: true,
          success: function (oData) {
            var aResults = oData.results || [];
            // One entry per unique NfaRefNo+Version
            var mSeen = {};
            var aVersions = [];
            aResults.forEach(function (r) {
              var sKey = r.NfaRefNo + "|" + r.Version;
              if (!mSeen[sKey]) {
                mSeen[sKey] = true;
                aVersions.push({ NfaRefNo: r.NfaRefNo, Version: r.Version });
              }
            });
            // Sort ascending by Version number
            aVersions.sort(function (a, b) {
              return (parseInt(a.Version) || 0) - (parseInt(b.Version) || 0);
            });
            oViewModel.setProperty("/versionHistory", aVersions);
            var iLatest = aVersions.length ? (parseInt(aVersions[aVersions.length - 1].Version) || 0) : null;
            oViewModel.setProperty("/nfaVersion", iLatest);
          },
          error: function () {
            oViewModel.setProperty("/versionHistory", []);
            oViewModel.setProperty("/nfaVersion", null);
          }
        });
      },

      onVersionHistoryPress: function () {
        var oViewModel = this.getView().getModel("viewModel");
        var sNfaRefNo = oViewModel.getProperty("/header/NfaRefNo");
        var that = this;

        oViewModel.setProperty("/versionView", {});

        // Lazy-load the fragment
        if (!this._oVersionHistoryDialog) {
          this._oVersionHistoryDialog = sap.ui.xmlfragment(
            this.getView().getId(),
            "com.df.nfa.creator_v2.view.fragments.VersionHistoryDialog",
            this
          );
          this.getView().addDependent(this._oVersionHistoryDialog);
        }

        var oCombo = this.byId("versionHistoryCombo");
        if (oCombo) { oCombo.setSelectedKey(""); }

        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel().read("/et_version_logSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          urlParameters: { "$expand": "VENDOR_LOG,VENDOR_PR_LOG" },
          forceServerDataRequest: true,
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            var aResults = oData.results || [];
            if (!aResults.length) {
              sap.m.MessageToast.show("No version history available for this NFA.");
              return;
            }
            that._aVersionLogResults = aResults;
            var mSeen = {}, aVersions = [];
            aResults.forEach(function (r) {
              var sKey = r.NfaRefNo + "|" + r.Version;
              if (!mSeen[sKey]) {
                mSeen[sKey] = true;
                aVersions.push({ NfaRefNo: r.NfaRefNo, Version: r.Version });
              }
            });
            aVersions.sort(function (a, b) {
              return (parseInt(a.Version) || 0) - (parseInt(b.Version) || 0);
            });
            oViewModel.setProperty("/versionHistory", aVersions);
            that._oVersionHistoryDialog.open();
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            sap.m.MessageToast.show("Failed to load version history.");
          }
        });
      },

      onCloseVersionHistoryDialog: function () {
        if (this._oVersionHistoryDialog) { this._oVersionHistoryDialog.close(); }
      },

       // ---------- Begin of code by SI2 Tech. on 24.09.2025 ----------
      // Version Comparison dialog

      onVersionComparePress: function () {
        var oViewModel = this.getView().getModel("viewModel");
        var sNfaRefNo = oViewModel.getProperty("/header/NfaRefNo");
        var that = this;
        if (!sNfaRefNo) { return; }

        if (!this._oVcModel) {
          this._oVcModel = new JSONModel({
            title: "", availableVersions: [], selectedVersions: [],
            tree: [], allTree: [], cards: [], viewMode: "all",
            cols: { vendor: true, change: true, itemCode: true, poNo: true } // SI2 Tech: frozen columns shown
          });
        }
        if (!this._oVcDialog) {
          this._oVcDialog = sap.ui.xmlfragment(
            this.getView().getId(),
            "com.df.nfa.creator_v2.view.fragments.VersionCompareDialog",
            this
          );
          this.getView().addDependent(this._oVcDialog);
          this._oVcDialog.setModel(this._oVcModel, "vcModel");
        }
        this._vcAttachLongText(); // SI2 Tech: Long Text popover in the comparison table

        // Same call Version History uses: blank Version returns the list of versions.
        // $expand is required - without it Gateway does not route to GET_EXPANDED_ENTITYSET.
        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel().read("/et_version_logSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          urlParameters: { "$expand": "VENDOR_LOG,VENDOR_PR_LOG,APP_FORM_LOG" },
          forceServerDataRequest: true,
          success: function (oData) {
            var mSeen = {};
            var aVersions = [];
            (oData.results || []).forEach(function (r) {
              var iVer = parseInt(r.Version, 10);
              if (!iVer || mSeen[iVer]) { return; }
              mSeen[iVer] = true;
              aVersions.push({ key: r.Version, num: iVer, text: that._vcVersionLabel(iVer) });
            });
            aVersions.sort(function (a, b) { return a.num - b.num; });

            if (aVersions.length < 2) {
              sap.ui.core.BusyIndicator.hide();
              MessageBox.information("NFA " + sNfaRefNo + " has only one version. There is nothing to compare yet.");
              return;
            }

            // Start: added by SI2 Tech - "Original" renamed to "Original Scope"
            // Default: Current + Previous + Original Scope.
            // End: added by SI2 Tech
            // Current = the version open on the page (viewModel>/nfaVersion); falls back to the latest.
            var iPageVer = parseInt(that.getView().getModel("viewModel").getProperty("/nfaVersion"), 10);
            var iCur = aVersions.length - 1;
            aVersions.forEach(function (v, idx) { if (v.num === iPageVer) { iCur = idx; } });
            var aDefaultKeys = [aVersions[0], aVersions[Math.max(iCur - 1, 0)], aVersions[iCur]]
              .map(function (v) { return v.key; })
              .filter(function (k, i, arr) { return arr.indexOf(k) === i; });
            if (aDefaultKeys.length < 2) {   // page is on V1 -> compare V1 with V2
              aDefaultKeys.push(aVersions[1].key);
            }

            // Items first, then selection: the dialog is reused across NFAs, and setting
            // selectedKeys before the new items exist makes the MultiComboBox keep the old selection.
            that._oVcModel.setData({
              title: "Version Comparison - " + sNfaRefNo,
              nfaRefNo: sNfaRefNo,
              availableVersions: aVersions,
              selectedVersions: aDefaultKeys,
              tree: [], allTree: [], cards: [], viewMode: "all",
              // SI2 Tech: keep the user's column choice when the dialog is opened again
              cols: that._oVcModel.getProperty("/cols") || { vendor: true, change: true, itemCode: true, poNo: true }
            });
            that.byId("vcVersionSelect").setSelectedKeys(aDefaultKeys);
            // Start: added by SI2 Tech - PO filter
            // Every version is read once (cached), so the PO drop down lists all POs created by this NFA.
            // Default: all POs selected = same view as before.
            that._oVcModel.setSizeLimit(100000); // JSONModel lists show only 100 entries by default
            that._vcSnapCache = {};
            that._oVcModel.setProperty("/availablePos", []);
            that._oVcModel.setProperty("/selectedPos", []);
            that._oVcModel.setProperty("/poFiltered", false);
            that.byId("vcPoSelect").setSelectedKeys([]);
            that._oVcDialog.open();
            // SI2 Tech: replaced by the call below (long texts are read together with the versions)
            // that._vcPreloadVersions(sNfaRefNo, aVersions).then(function () {
            //   that._vcLoadAndRender();
            // });
            Promise.all([that._vcPreloadVersions(sNfaRefNo, aVersions), that._vcLoadLongTexts(sNfaRefNo)]).then(function () {
              that._vcLoadAndRender();
            });
            // End: added by SI2 Tech
            // SI2 Tech: replaced by the block above
            // that._oVcDialog.open();
            // that._vcLoadAndRender();
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            MessageToast.show("Failed to load the version list.");
          }
        });
      },

      onVcVersionsChange: function () {
        var aKeys = this.byId("vcVersionSelect").getSelectedKeys();
        if (aKeys.length < 2) {
          MessageToast.show("Select at least two versions to compare.");
          return;
        }
        this._oVcModel.setProperty("/selectedVersions", aKeys);
        this._vcLoadAndRender();
      },

      // Start: added by SI2 Tech - PO filter
      // Key used in the PO drop down for lines whose vendor has no PO yet in that version
      VC_PO_NONE: "__NONE__",

      onVcPoChange: function () {
        var oCombo = this.byId("vcPoSelect");
        var aKeys = oCombo.getSelectedKeys();
        if (!aKeys.length) {
          MessageToast.show("Select at least one PO.");
          oCombo.setSelectedKeys(this._oVcModel.getProperty("/selectedPos") || []);
          return;
        }
        var iAll = (this._oVcModel.getProperty("/availablePos") || []).length;
        this._oVcModel.setProperty("/selectedPos", aKeys);
        this._oVcModel.setProperty("/poFiltered", aKeys.length < iAll);
        this._vcLoadAndRender();
      },

      // Reads every version of the NFA (own $batch each) into the cache and fills the PO drop down.
      // A version that fails here is skipped; it is read again (and the error shown) when it is selected.
      _vcPreloadVersions: function (sNfaRefNo, aVersions) {
        var that = this;
        return Promise.all(aVersions.map(function (v) {
          return that._vcGetVersion(sNfaRefNo, v.key).then(null, function () { return null; });
        })).then(function (aSnaps) {
          var aPos = that._vcCollectPos(aSnaps);
          var aKeys = aPos.map(function (p) { return p.key; });
          // Items first, then selection (same reason as the version drop down)
          that._oVcModel.setProperty("/availablePos", aPos);
          that._oVcModel.setProperty("/selectedPos", aKeys);
          that._oVcModel.setProperty("/poFiltered", false);
          that.byId("vcPoSelect").setSelectedKeys(aKeys);
        });
      },

      // Version snapshot from the cache, read from the backend only the first time
      _vcGetVersion: function (sNfaRefNo, sKey) {
        var that = this;
        var iVer = parseInt(sKey, 10);
        this._vcSnapCache = this._vcSnapCache || {};
        if (this._vcSnapCache[iVer]) { return Promise.resolve(this._vcSnapCache[iVer]); }
        return this._vcReadVersion(sNfaRefNo, sKey).then(function (oSnap) {
          that._vcSnapCache[iVer] = oSnap;
          return oSnap;
        });
      },

      // POs created by this NFA: the PO of every vendor that has an ordered (non-ICE) line, over all versions.
      // Lines whose vendor has no PO yet are collected under "PO not created yet".
      _vcCollectPos: function (aSnaps) {
        var that = this;
        var mPo = {};
        var bNone = false;
        aSnaps.forEach(function (oSnap) {
          if (!oSnap) { return; }
          var mVendorPo = {}, mVendorName = {};
          oSnap.vendors.forEach(function (v) {
            mVendorPo[v.VendorNo] = v.PurchaseOrder || "";
            mVendorName[v.VendorNo] = v.VendorName || v.VendorNo;
          });
          oSnap.lines.forEach(function (l) {
            if ((parseFloat(l.SplitPoQty) || 0) === 0 || l.VendorIceFlag === "X") { return; }
            var sPo = mVendorPo[l.VendorNo] || "";
            if (!sPo) { bNone = true; return; }
            if (!mPo[sPo]) { mPo[sPo] = { key: sPo, text: sPo + " · " + (mVendorName[l.VendorNo] || l.VendorNo) }; }
          });
        });
        var aPos = Object.keys(mPo).sort().map(function (k) { return mPo[k]; });
        if (bNone) { aPos.push({ key: that.VC_PO_NONE, text: "PO not created yet" }); }
        return aPos;
      },

      // Text of the PO selection for the Download Form
      _vcPoSelectionText: function () {
        var aAll = this._oVcModel.getProperty("/availablePos") || [];
        var mSel = {};
        (this._oVcModel.getProperty("/selectedPos") || []).forEach(function (k) { mSel[k] = true; });
        var bFiltered = !!this._oVcModel.getProperty("/poFiltered");
        var aText = aAll.filter(function (p) { return !bFiltered || mSel[p.key]; }).map(function (p) { return p.text; });
        return (bFiltered ? "" : "All POs: ") + (aText.join(", ") || "PO not created yet");
      },
      // End: added by SI2 Tech

      // Start: added by SI2 Tech - Long Text (material PO text), same "Long Text" link and hover popover as the QCS page
      // The version log lines do not carry the long text (GET_VERSION_LOG does not read it), so it is taken per material
      // from the NFA's current lines (/et_vendor_pr_item_detailsSet, filled by FETCH_MATERIAL_LONG_TEXT).
      _vcLoadLongTexts: function (sNfaRefNo) {
        var that = this;
        this._vcLongText = {};
        return new Promise(function (resolve) {
          that.getOwnerComponent().getModel().read("/et_vendor_pr_item_detailsSet", {
            filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
            success: function (oData) {
              (oData.results || []).forEach(function (r) {
                var sKey = that._vcMatKey(r.Material);
                if (sKey && r.MaterialLongText && !that._vcLongText[sKey]) { that._vcLongText[sKey] = r.MaterialLongText; }
              });
              resolve();
            },
            error: function () { resolve(); } // no long texts - the comparison still opens
          });
        });
      },

      _vcMatKey: function (sMaterial) {
        return String(sMaterial || "").trim().replace(/^0+(?=.)/, "");
      },

      _vcLongTextOf: function (sMaterial) {
        return (this._vcLongText || {})[this._vcMatKey(sMaterial)] || "";
      },

      // Delegated hover / click handler on the table (rows are re-used while scrolling, so no per-row handlers)
      _vcAttachLongText: function () {
        var that = this;
        var oTable = this.byId("vcTable");
        if (!oTable || this._bVcLongTextDelegate) { return; }
        this._bVcLongTextDelegate = true;
        oTable.addEventDelegate({
          onAfterRendering: function () {
            var $table = oTable.$();
            $table.off(".vcLongText");
            $table.on("mouseenter.vcLongText click.vcLongText", ".vcLongText", function (oEv) {
              that._vcOpenLongText(oEv.currentTarget);
            });
            $table.on("mouseleave.vcLongText", ".vcLongText", function () {
              setTimeout(function () {
                if (!that._bVcInLongTextPop && that._oVcLongTextPop) { that._oVcLongTextPop.close(); }
              }, 80);
            });
          }
        });
      },

      _vcOpenLongText: function (oDom) {
        var that = this;
        var Element = sap.ui.require("sap/ui/core/Element");
        var oCtl = Element && Element.closestTo ? Element.closestTo(oDom) : null;
        var oCtx = oCtl && oCtl.getBindingContext("vcModel");
        var sText = oCtx ? oCtx.getProperty("LongText") : "";
        if (!sText) { return; }
        if (!this._oVcLongTextPop) {
          this._oVcLongTextText = new sap.m.Text({ wrapping: true, width: "100%" })
            .addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom");
          this._oVcLongTextPop = new sap.m.Popover({
            showHeader: true,
            title: "Long Text",
            placement: "PreferredRightOrFlip",
            contentWidth: "420px",
            afterOpen: function () { that._bVcInLongTextPop = false; },
            afterClose: function () { that._oVcLongTextOpener = null; },
            content: [new sap.m.ScrollContainer({ vertical: true, horizontal: false, height: "280px", content: [this._oVcLongTextText] })]
          });
          this._oVcLongTextPop.attachBrowserEvent("mouseenter", function () { that._bVcInLongTextPop = true; });
          this._oVcLongTextPop.attachBrowserEvent("mouseleave", function () {
            that._bVcInLongTextPop = false;
            that._oVcLongTextPop.close();
          });
          this._oVcDialog.addDependent(this._oVcLongTextPop);
        }
        if (this._oVcLongTextPop.isOpen() && this._oVcLongTextOpener === oDom) { return; }
        this._oVcLongTextText.setText(sText);
        this._oVcLongTextOpener = oDom;
        this._oVcLongTextPop.openBy(oDom);
      },
      // End: added by SI2 Tech

      onVcFilterChange: function () {
        var bChangedOnly = this._oVcModel.getProperty("/viewMode") === "changed";
        var aAll = this._oVcModel.getProperty("/allTree") || [];
        var aTree = aAll;
        if (bChangedOnly) {
          aTree = [];
          aAll.forEach(function (oNode) {
            if (oNode.NodeType !== "PR") { aTree.push(oNode); return; }
            var aKids = oNode.children.filter(function (c) { return c.changed; });
            if (aKids.length) { aTree.push(Object.assign({}, oNode, { children: aKids })); }
          });
        }
        this._oVcModel.setProperty("/tree", aTree);
        this.onVcExpandAll();
      },

      onVcExpandAll: function () {
        var oTable = this.byId("vcTable");
        if (oTable) { oTable.expandToLevel(1); }
      },

      onVcCollapseAll: function () {
        var oTable = this.byId("vcTable");
        if (oTable) { oTable.collapseAll(); }
      },

      onVcClose: function () {
        if (this._oVcDialog) { this._oVcDialog.close(); }
      },

      _vcVersionLabel: function (iVer) {
        // Start: added by SI2 Tech - "Original" renamed to "Original Scope"
        return iVer === 1 ? "V1 · Original Scope" : "V" + iVer + " · Amendment " + (iVer - 1);
        // End: added by SI2 Tech
      },

      _vcLoadAndRender: function () {
        var that = this;
        var sNfaRefNo = this._oVcModel.getProperty("/nfaRefNo");
        var aKeys = (this._oVcModel.getProperty("/selectedVersions") || []).slice();

        // Oldest version on the left
        aKeys.sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });

        sap.ui.core.BusyIndicator.show(0);
        // SI2 Tech: replaced by the line below (versions already read come from the cache)
        // Promise.all(aKeys.map(function (sKey) { return that._vcReadVersion(sNfaRefNo, sKey); }))
        Promise.all(aKeys.map(function (sKey) { return that._vcGetVersion(sNfaRefNo, sKey); })) // SI2 Tech
          .then(function (aSnapshots) {
            try {
              var aNums = aSnapshots.map(function (s) { return s.version; });
              var oResult = that._vcBuildTree(aSnapshots);
              that._vcSnapshots = aSnapshots;
              that._vcBuildColumns(aNums);
              that._oVcModel.setProperty("/cards", []); // SI2 Tech: re-create the boxes - ObjectStatus does not refresh a changed icon
              that._oVcModel.setProperty("/cards", oResult.cards);
              that._oVcModel.setProperty("/allTree", oResult.tree);
              that.onVcFilterChange();
            } catch (e) {
              // Frontend error while building the table (not a backend problem)
              console.error("Version Comparison render failed", e); // eslint-disable-line no-console
              MessageBox.error("Version Comparison could not be displayed.", { details: String(e && e.message) });
            }
            sap.ui.core.BusyIndicator.hide();
          })
          .catch(function (oErr) {
            sap.ui.core.BusyIndicator.hide();
            MessageBox.error("Could not load " + that._vcVersionLabel(oErr.version) + ".", {
              details: "HTTP " + oErr.status + ": " + oErr.message
            });
          });
      },

      _vcReadVersion: function (sNfaRefNo, sVersion) {
        var oModel = this.getOwnerComponent().getModel();
        var iVer = parseInt(sVersion, 10);
        return new Promise(function (resolve, reject) {
          oModel.read("/et_version_logSet", {
            // Own $batch per version: a backend failure in one version does not take the others down
            groupId: "vcVersion" + iVer,
            filters: [
              new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
              new Filter("Version", FilterOperator.EQ, sVersion)
            ],
            urlParameters: { "$expand": "VENDOR_LOG,VENDOR_PR_LOG,APP_FORM_LOG" },
            forceServerDataRequest: true,
            success: function (oData) {
              var o = (oData.results || [])[0] || {};
              resolve({
                version: iVer,
                header: o,
                vendors: (o.VENDOR_LOG && o.VENDOR_LOG.results) || [],
                lines: (o.VENDOR_PR_LOG && o.VENDOR_PR_LOG.results) || [],
                form: ((o.APP_FORM_LOG && o.APP_FORM_LOG.results) || [])[0] || {}
              });
            },
            error: function (oError) {
              var sMsg = (oError && (oError.message || oError.statusText)) || "Unknown error";
              try {
                sMsg = JSON.parse(oError.responseText).error.message.value || sMsg;
              } catch (e) { /* responseText is not JSON (e.g. a short dump page) */ }
              reject({ version: iVer, status: oError && oError.statusCode, message: sMsg });
            }
          });
        });
      },

      _vcFmt: function (v) {
        if (v === "NA") { return "–"; }
        if (v === null || v === undefined || v === "") { return ""; }
        return Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },

      _vcFmtDelta: function (v) {
        if (v === null || v === undefined || v === "" || v === "NA") { return ""; }
        var s = Number(Math.abs(v)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return v > 0.005 ? "+" + s : (v < -0.005 ? "−" + s : "0.00");
      },

      // Start: added by SI2 Tech - % change vs a base amount, in brackets: "(+5.25%)" / "(−3.10%)" / "(0.00%)".
      // Blank when there is no base to compare with (base 0 / not a number).
      _vcFmtPct: function (fCur, fBase) {
        if (typeof fCur !== "number" || typeof fBase !== "number" || Math.abs(fBase) < 0.005) { return ""; }
        var p = Math.round((fCur - fBase) / Math.abs(fBase) * 10000) / 100;
        var s = Math.abs(p).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return "(" + (p > 0 ? "+" + s : (p < 0 ? "−" + s : "0.00")) + "%)";
      },
      // End: added by SI2 Tech

      // Builds: PR nodes (subtotals) -> ITEM children, a Grand Total node, and the summary cards.
      // Line values: q = SplitPoQty, r = NegotiatedPrice, t = q × r. Only ordered, non-ICE lines (same filter NFA_PO uses).
      _vcBuildTree: function (aSnapshots) {
        var that = this;
        var EPS = 0.005;
        var n = aSnapshots.length;
        var iLast = n - 1;
        var fnRound = function (x) { return Math.round(x * 100) / 100; };
        var fnDiff = function (a, b) { return Math.abs((a || 0) - (b || 0)) > EPS; };
        var fnDeltaState = function (d) { return d > EPS ? "Error" : (d < -EPS ? "Success" : "None"); };
        var aVer = aSnapshots.map(function (s) { return s.version; });
        // Start: added by SI2 Tech - PO filter + basic-amount movements for the summary boxes
        var bPoFiltered = !!this._oVcModel.getProperty("/poFiltered");
        var mPoSel = {};
        (this._oVcModel.getProperty("/selectedPos") || []).forEach(function (k) { mPoSel[k] = true; });
        var aVendorsIn = aSnapshots.map(function () { return {}; });   // vendors with at least one shown line, per version
        var aMove = aSnapshots.map(function () { return { inc: 0, dec: 0, add: 0, rem: 0 }; }); // vs the previous version
        // End: added by SI2 Tech

        // 1. Collect every line across the selected versions
        var mLines = {};
        var aKeys = [];
        aSnapshots.forEach(function (oSnap, i) {
          var mVendorName = {};
          var mVendorPo = {};
          oSnap.vendors.forEach(function (v) {
            mVendorName[v.VendorNo] = v.VendorName;
            mVendorPo[v.VendorNo] = v.PurchaseOrder || "";
          });
          oSnap.lines.forEach(function (l) {
            var fQty = parseFloat(l.SplitPoQty) || 0;
            if (fQty === 0 || l.VendorIceFlag === "X") { return; }
            // Start: added by SI2 Tech - PO filter: the line counts in this version only when its PO is selected
            if (bPoFiltered && !mPoSel[mVendorPo[l.VendorNo] || that.VC_PO_NONE]) { return; }
            aVendorsIn[i][l.VendorNo] = true;
            // End: added by SI2 Tech
            var sItem = String(parseInt(l.PrItem, 10) || l.PrItem || "");
            var sKey = [l.PrNo, sItem, l.Material, l.VendorNo].join("|");
            if (!mLines[sKey]) {
              mLines[sKey] = {
                PrNo: l.PrNo || "", PrItem: sItem, Material: l.Material || "",
                MaterialDescription: l.MaterialDescription || "",
                VendorNo: l.VendorNo, VendorName: mVendorName[l.VendorNo] || l.VendorNo,
                Uom: l.Uom || "", vals: {}
              };
              aKeys.push(sKey);
            }
            // Start: added by SI2 Tech - Long Text: from the log line if filled, else per material from the current NFA lines
            if (!mLines[sKey].LongText) { mLines[sKey].LongText = l.MaterialLongText || that._vcLongTextOf(l.Material); }
            // End: added by SI2 Tech
            var fRate = parseFloat(l.NegotiatedPrice) || 0;
            mLines[sKey].vals[i] = { qty: fQty, rate: fRate, total: fnRound(fQty * fRate), po: mVendorPo[l.VendorNo] || "" };
          });
        });

        aKeys.sort(function (a, b) {
          var ra = mLines[a], rb = mLines[b];
          return ra.PrNo.localeCompare(rb.PrNo) ||
                 (parseInt(ra.PrItem, 10) || 0) - (parseInt(rb.PrItem, 10) || 0) ||
                 String(ra.VendorNo || "").localeCompare(String(rb.VendorNo || ""));
        });

        // 2. ITEM rows grouped under PR nodes
        var mPr = {};
        var aPrOrder = [];
        aKeys.forEach(function (sKey) {
          var r = mLines[sKey];
          var oItem = {
            NodeType: "ITEM",
            label: (r.PrItem ? r.PrItem + " / " : "") + r.MaterialDescription,
            PrNo: r.PrNo, PrItem: r.PrItem, Material: r.Material,
            MaterialDescription: r.MaterialDescription,
            VendorName: r.VendorName, Uom: r.Uom,
            changed: false
          };
          oItem.LongText = r.LongText || ""; // SI2 Tech: Long Text link + Excel
          // SI2 Tech: Vendor column shows "(Vendor No.) Name"
          oItem.VendorNo = r.VendorNo || "";
          oItem.vendorText = oItem.VendorNo && r.VendorName !== oItem.VendorNo
            ? "(" + oItem.VendorNo + ") " + (r.VendorName || "")
            : (r.VendorName || "");
          var iFirstSeen = -1, iLastSeen = -1;

          for (var i = 0; i < n; i++) {
            var cur = r.vals[i];
            var prev = i > 0 ? r.vals[i - 1] : null;
            if (cur) { if (iFirstSeen < 0) { iFirstSeen = i; } iLastSeen = i; }
            oItem["q" + i] = cur ? cur.qty : "NA";
            oItem["r" + i] = cur ? cur.rate : "NA";
            oItem["t" + i] = cur ? cur.total : "NA";
            oItem["p" + i] = cur ? cur.po : "NA";
            oItem["qs" + i] = oItem["rs" + i] = oItem["ts" + i] = oItem["ps" + i] = "None";
            oItem["qp" + i] = oItem["rp" + i] = oItem["tp" + i] = oItem["pp" + i] = "";
            if (i === 0) { continue; }

            var fDelta = fnRound((cur ? cur.total : 0) - (prev ? prev.total : 0));
            oItem["d" + i] = (cur || prev) ? fDelta : null;
            oItem["ds" + i] = fnDeltaState(fDelta);
            // Start: added by SI2 Tech - qty / rate change columns
            // Qty change: also for added / removed lines (from / to 0). Rate change: only when the line is in both versions.
            var fDq = fnRound((cur ? cur.qty : 0) - (prev ? prev.qty : 0));
            oItem["dq" + i] = (cur || prev) ? fDq : null;
            oItem["dqs" + i] = Math.abs(fDq) > EPS ? "Information" : "None";
            var fDr = (cur && prev) ? fnRound(cur.rate - prev.rate) : null;
            oItem["dr" + i] = fDr;
            oItem["drs" + i] = fnDeltaState(fDr || 0);
            // End: added by SI2 Tech
            // Start: added by SI2 Tech - basic-amount movements vs the previous version (summary boxes)
            if (cur && prev) {
              if (fDelta > EPS) { aMove[i].inc += fDelta; } else if (fDelta < -EPS) { aMove[i].dec -= fDelta; }
            } else if (cur) {
              aMove[i].add += cur.total;
            } else if (prev) {
              aMove[i].rem += prev.total;
            }
            // End: added by SI2 Tech
            var sWas = "V" + aVer[i - 1] + ": ";
            if (cur && !prev) {
              oItem["qs" + i] = oItem["rs" + i] = oItem["ts" + i] = oItem["ps" + i] = "Success";
              oItem.changed = true;
            } else if (cur && prev) {
              // PO number: flag only when both versions have one and they differ
              // (a blank PO just means the document is not created yet for that version)
              if (cur.po && prev.po && cur.po !== prev.po) {
                oItem["ps" + i] = "Warning"; oItem["pp" + i] = sWas + prev.po; oItem.changed = true;
              }
              if (fnDiff(cur.qty, prev.qty)) {
                oItem["qs" + i] = "Warning"; oItem["qp" + i] = sWas + that._vcFmt(prev.qty); oItem.changed = true;
              }
              if (fnDiff(cur.rate, prev.rate)) {
                oItem["rs" + i] = "Warning"; oItem["rp" + i] = sWas + that._vcFmt(prev.rate); oItem.changed = true;
              }
              if (fnDiff(cur.total, prev.total)) {
                oItem["ts" + i] = "Warning"; oItem["tp" + i] = sWas + that._vcFmt(prev.total);
              }
            } else if (!cur && prev) {
              oItem.changed = true;
            }
          }

          // Start: added by SI2 Tech - single PO No. column before the versions (latest PO of the line)
          var aPoHist = [];
          oItem.poNo = "";
          for (var k = 0; k < n; k++) {
            var sPo = r.vals[k] && r.vals[k].po;
            if (sPo) { oItem.poNo = sPo; aPoHist.push("V" + aVer[k] + ": " + sPo); }
          }
          var bPoChanged = aPoHist.some(function (s) { return s.split(": ")[1] !== oItem.poNo; });
          oItem.poState = bPoChanged ? "Warning" : "None";
          oItem.poTip = bPoChanged ? aPoHist.join("\n") : oItem.poNo;
          // End: added by SI2 Tech

          // Start: added by SI2 Tech - "original" renamed to "original scope"
          // Delta current vs original scope (only when 3+ versions are compared)
          // End: added by SI2 Tech
          if (n > 2) {
            var o0 = r.vals[0], oN = r.vals[iLast];
            var fOrig = fnRound((oN ? oN.total : 0) - (o0 ? o0.total : 0));
            oItem.dO = (o0 || oN) ? fOrig : null;
            oItem.dOs = fnDeltaState(fOrig);
            // Start: added by SI2 Tech - qty / rate change columns
            var fDqO = fnRound((oN ? oN.qty : 0) - (o0 ? o0.qty : 0));
            oItem.dqO = (o0 || oN) ? fDqO : null;
            oItem.dqOs = Math.abs(fDqO) > EPS ? "Information" : "None";
            oItem.drO = (o0 && oN) ? fnRound(oN.rate - o0.rate) : null;
            oItem.drOs = fnDeltaState(oItem.drO || 0);
            // End: added by SI2 Tech
          }

          // Status shown in the "Change" column (replaces the colour legend)
          if (iFirstSeen > 0 && iLastSeen < iLast) {
            oItem.statusText = iFirstSeen === iLastSeen
              ? "Only in V" + aVer[iFirstSeen]
              : "V" + aVer[iFirstSeen] + " to V" + aVer[iLastSeen] + " only";
            oItem.statusState = "Error"; oItem.statusIcon = "sap-icon://less"; oItem.highlight = "Error";
          } else if (iFirstSeen > 0) {
            oItem.statusText = "Added in V" + aVer[iFirstSeen]; oItem.statusState = "Success";
            oItem.statusIcon = "sap-icon://add"; oItem.highlight = "Success";
          } else if (iLastSeen < iLast) {
            oItem.statusText = "Removed in V" + aVer[iLastSeen + 1]; oItem.statusState = "Error";
            oItem.statusIcon = "sap-icon://less"; oItem.highlight = "Error";
          } else if (oItem.changed) {
            oItem.statusText = "Changed"; oItem.statusState = "Warning";
            oItem.statusIcon = "sap-icon://edit"; oItem.highlight = "Warning";
          } else {
            oItem.statusText = "No change"; oItem.statusState = "None";
            oItem.statusIcon = ""; oItem.highlight = "None";
          }

          if (!mPr[r.PrNo]) {
            mPr[r.PrNo] = { NodeType: "PR", PrNo: r.PrNo, children: [] };
            aPrOrder.push(r.PrNo);
          }
          mPr[r.PrNo].children.push(oItem);
        });

        // 3. PR subtotals + Grand Total
        var oGrand = { NodeType: "TOTAL", label: "Grand Total (Qty × Rate)", highlight: "Information", changed: false };
        var aGrand = aSnapshots.map(function () { return 0; });

        var aTree = aPrOrder.map(function (sPr) {
          var oPr = mPr[sPr];
          var aSub = aSnapshots.map(function () { return 0; });
          var aHas = aSnapshots.map(function () { return false; });
          var iChanged = 0;
          oPr.children.forEach(function (c) {
            if (c.changed) { iChanged++; }
            for (var i = 0; i < n; i++) {
              if (typeof c["t" + i] === "number") { aSub[i] += c["t" + i]; aHas[i] = true; }
            }
          });
          var iCount = oPr.children.length;
          oPr.label = (sPr ? "PR " + sPr : "Manual items") + "  (" + iCount + (iCount === 1 ? " line)" : " lines)");
          oPr.highlight = "Information";
          oPr.changed = iChanged > 0;
          oPr.statusText = iChanged ? iChanged + " of " + iCount + " changed" : "No change";
          oPr.statusState = iChanged ? "Warning" : "None";
          oPr.statusIcon = "";
          for (var i = 0; i < n; i++) {
            aSub[i] = fnRound(aSub[i]);
            aGrand[i] += aSub[i];
            oPr["q" + i] = null; oPr["r" + i] = null; oPr["t" + i] = aHas[i] ? aSub[i] : "NA";
            oPr["ts" + i] = "None";
            if (i > 0) {
              oPr["d" + i] = (aHas[i] || aHas[i - 1]) ? fnRound(aSub[i] - aSub[i - 1]) : null;
              oPr["ds" + i] = fnDeltaState(oPr["d" + i] || 0);
            }
          }
          if (n > 2) {
            oPr.dO = (aHas[iLast] || aHas[0]) ? fnRound(aSub[iLast] - aSub[0]) : null;
            oPr.dOs = fnDeltaState(oPr.dO || 0);
          }
          return oPr;
        });

        for (var g = 0; g < n; g++) {
          aGrand[g] = fnRound(aGrand[g]);
          oGrand["q" + g] = null; oGrand["r" + g] = null; oGrand["t" + g] = aGrand[g];
          oGrand["ts" + g] = "None";
          if (g > 0) {
            oGrand["d" + g] = fnRound(aGrand[g] - aGrand[g - 1]);
            oGrand["ds" + g] = fnDeltaState(oGrand["d" + g]);
            // SI2 Tech: % change of the grand total vs the previous version, shown next to the Total Amount
            oGrand["tpct" + g] = that._vcFmtPct(aGrand[g], aGrand[g - 1]);
            oGrand["tpcts" + g] = oGrand["ds" + g];
            // SI2 Tech: same % next to the Total Amount change vs the previous version
            oGrand["dpct" + g] = oGrand["tpct" + g];
          }
        }
        if (n > 2) { oGrand.dO = fnRound(aGrand[iLast] - aGrand[0]); oGrand.dOs = fnDeltaState(oGrand.dO); }
        // SI2 Tech: % change of the grand total vs the original scope, next to the Total Amount change vs the first version
        if (n > 2) { oGrand.dOpct = that._vcFmtPct(aGrand[iLast], aGrand[0]); }
        oGrand.statusText = ""; oGrand.statusState = "None"; oGrand.statusIcon = "";
        aTree.push(oGrand);

        // 4. Summary cards: PO amount from the approval form of each version
        var aPo = aSnapshots.map(function (s) { return fnRound(parseFloat(s.form.CurrentPoAmt) || 0); });
        // Start: added by SI2 Tech - PO filter: PO amount = net landed cost of the vendors (= POs) shown in that version
        // (all POs selected: approval form amount as before; it is the sum of the same vendor net landed costs)
        if (bPoFiltered) {
          aPo = aSnapshots.map(function (s, i) {
            var mDone = {};
            return fnRound(s.vendors.reduce(function (fSum, v) {
              if (!aVendorsIn[i][v.VendorNo] || v.VendorIceFlag === "X" || mDone[v.VendorNo]) { return fSum; }
              mDone[v.VendorNo] = true;
              return fSum + (parseFloat(v.NetLandedCost) || 0);
            }, 0));
          });
        }
        var aBasic = aSnapshots.map(function (s, i) { return fnRound(typeof oGrand["t" + i] === "number" ? oGrand["t" + i] : 0); });
        // End: added by SI2 Tech
        var aCards = aSnapshots.map(function (s, i) {
          // PO numbers of the vendors that have ordered lines in this version
          var mOrdered = {};
          s.lines.forEach(function (l) {
            if ((parseFloat(l.SplitPoQty) || 0) !== 0 && l.VendorIceFlag !== "X") { mOrdered[l.VendorNo] = true; }
          });
          mOrdered = aVendorsIn[i]; // SI2 Tech: PO filter - only vendors with a shown line (unfiltered: the same vendors)
          var aPoNos = [];
          s.vendors.forEach(function (v) {
            if (mOrdered[v.VendorNo] && v.PurchaseOrder && aPoNos.indexOf(v.PurchaseOrder) < 0) { aPoNos.push(v.PurchaseOrder); }
          });
          // Start: added by SI2 Tech
          // Split of the PO amount: basic (= Grand Total of the table) + charges & GST
          var fBasic = fnRound(typeof oGrand["t" + i] === "number" ? oGrand["t" + i] : 0);
          var fCharges = fnRound(aPo[i] - fBasic);
          var sBasicText = "Basic " + that._vcFmt(fBasic);
          var sChargesText = "Charges & GST " + that._vcFmt(fCharges);
          // End: added by SI2 Tech
          var oCard = {
            label: that._vcVersionLabel(s.version),
            tint: String(i % 3), // SI2 Tech: same background tint as this version's columns in the table
            poNos: aPoNos,
            poNosText: aPoNos.length ? "PO " + aPoNos.join(", ") : "PO not created yet",
            poAmtText: that._vcFmt(aPo[i]),
            // Start: added by SI2 Tech
            basicText: sBasicText,
            chargesText: sChargesText,
            splitText: aPo[i] === 0 ? sBasicText + " · PO amount not saved yet" : sBasicText + " · " + sChargesText,
            // End: added by SI2 Tech
            deltaText: "Baseline", deltaState: "None", deltaIcon: "",
            deltaOrigText: "", deltaOrigState: "None"
          };
          // SI2 Tech: replaced by the block below - net impact is now on the basic amount, not the PO amount
          // if (i > 0) {
          //   var d = fnRound(aPo[i] - aPo[i - 1]);
          //   oCard.deltaText = that._vcFmtDelta(d) + " vs V" + aVer[i - 1];
          //   oCard.deltaState = fnDeltaState(d);
          //   oCard.deltaIcon = d > EPS ? "sap-icon://trend-up" : (d < -EPS ? "sap-icon://trend-down" : "");
          // }
          // if (i === iLast && n > 2) {
          //   var dO = fnRound(aPo[i] - aPo[0]);
          //   // Start: added by SI2 Tech - "original" renamed to "original scope"
          //   oCard.deltaOrigText = that._vcFmtDelta(dO) + " vs V" + aVer[0] + " (original scope)";
          //   // End: added by SI2 Tech
          //   oCard.deltaOrigState = fnDeltaState(dO);
          // }
          // Start: added by SI2 Tech - summary box: basic / charges rows, movements vs previous version, net impact on basic
          var oMv = aMove[i];
          var bNotSaved = aPo[i] === 0 && aBasic[i] !== 0;
          oCard.poAmt = aPo[i];
          oCard.basicAmt = aBasic[i];
          oCard.chargesAmt = bNotSaved ? null : fnRound(aPo[i] - aBasic[i]);
          oCard.basicValText = that._vcFmt(aBasic[i]);
          oCard.chargesValText = bNotSaved ? "Not saved yet" : that._vcFmt(oCard.chargesAmt);
          // Start: added by SI2 Tech - % change vs the previous version, in brackets next to the amounts
          // (blank on the first version, and where this or the previous amount is not saved yet)
          oCard.poAmtPct = ""; oCard.poAmtPctState = "None";
          oCard.basicPct = ""; oCard.basicPctState = "None";
          oCard.chargesPct = ""; oCard.chargesPctState = "None";
          if (i > 0) {
            var bPrevNotSaved = aPo[i - 1] === 0 && aBasic[i - 1] !== 0;
            var fPrevCharges = bPrevNotSaved ? null : fnRound(aPo[i - 1] - aBasic[i - 1]);
            if (aPo[i] !== 0) {
              oCard.poAmtPct = that._vcFmtPct(aPo[i], aPo[i - 1]);
              oCard.poAmtPctState = fnDeltaState(aPo[i] - aPo[i - 1]);
            }
            oCard.basicPct = that._vcFmtPct(aBasic[i], aBasic[i - 1]);
            oCard.basicPctState = fnDeltaState(aBasic[i] - aBasic[i - 1]);
            if (oCard.chargesAmt !== null && fPrevCharges !== null) {
              oCard.chargesPct = that._vcFmtPct(oCard.chargesAmt, fPrevCharges);
              oCard.chargesPctState = fnDeltaState(oCard.chargesAmt - fPrevCharges);
            }
          }
          // End: added by SI2 Tech
          oCard.poAmtTip = bPoFiltered ? "Net landed cost of the selected PO(s) in this version"
                                       : "PO amount on the approval form of this version";
          if (bPoFiltered && !Object.keys(aVendorsIn[i]).length) { oCard.poNosText = "No lines on the selected PO(s)"; }
          oCard.move = { inc: fnRound(oMv.inc), dec: fnRound(oMv.dec), add: fnRound(oMv.add), rem: fnRound(oMv.rem) };
          oCard.moveHdrText = i > 0 ? "Changes vs V" + aVer[i - 1] + " (basic amount)" : "Changes (basic amount)";
          oCard.incText = i > 0 ? that._vcFmtDelta(oCard.move.inc) : "–";
          oCard.incState = i > 0 ? fnDeltaState(oCard.move.inc) : "None";
          oCard.decText = i > 0 ? that._vcFmtDelta(-oCard.move.dec) : "–";
          oCard.decState = i > 0 ? fnDeltaState(-oCard.move.dec) : "None";
          oCard.addText = i > 0 ? that._vcFmtDelta(oCard.move.add) : "–";
          oCard.addState = i > 0 ? fnDeltaState(oCard.move.add) : "None";
          oCard.remText = i > 0 ? that._vcFmtDelta(-oCard.move.rem) : "–";
          oCard.remState = i > 0 ? fnDeltaState(-oCard.move.rem) : "None";
          oCard.netImpact = null;
          oCard.netImpactFirst = null;
          oCard.deltaText = "–";
          oCard.deltaState = "None";
          oCard.deltaIcon = "";
          if (i > 0) {
            var dB = fnRound(aBasic[i] - aBasic[i - 1]);
            oCard.netImpact = dB;
            oCard.netImpactFirst = fnRound(aBasic[i] - aBasic[0]);
            // SI2 Tech: % change of the basic amount added in brackets next to the amount
            oCard.deltaText = [that._vcFmtDelta(dB), that._vcFmtPct(aBasic[i], aBasic[i - 1]), "vs V" + aVer[i - 1]]
              .filter(Boolean).join(" ");
            oCard.deltaState = fnDeltaState(dB);
            oCard.deltaIcon = dB > EPS ? "sap-icon://trend-up" : (dB < -EPS ? "sap-icon://trend-down" : "");
          }
          if (i === iLast && n > 2) {
            var dBO = fnRound(aBasic[i] - aBasic[0]);
            // SI2 Tech: % change of the basic amount vs the original scope added in brackets next to the amount
            oCard.deltaOrigText = [that._vcFmtDelta(dBO), that._vcFmtPct(aBasic[i], aBasic[0]), "vs V" + aVer[0] + " (original scope)"]
              .filter(Boolean).join(" ");
            oCard.deltaOrigState = fnDeltaState(dBO);
          }
          // End: added by SI2 Tech
          return oCard;
        });

        return { tree: aTree, cards: aCards };
      },

      _vcBuildColumns: function (aVersionNums) {
        var oTable = this.byId("vcTable");
        var iFixed = 5; // SI2 Tech: 4 -> 5, PO No. column added to the fragment
        var that = this;
        var n = aVersionNums.length;
        var aVerCols = []; // SI2 Tech: column ids per version, for the background shading
        while (oTable.getColumns().length > iFixed) {
          oTable.removeColumn(oTable.getColumns()[iFixed]).destroy();
        }
        var fnFmt = this._vcFmt.bind(this);
        var fnFmtDelta = this._vcFmtDelta.bind(this);
        var fnBold = function (sType) { return sType === "PR" || sType === "TOTAL"; };

        aVersionNums.forEach(function (iVer, i) {
          var aCols = [
            // SI2 Tech: PO No. shown once in the fixed PO No. column of the fragment, not per version
            // { label: "PO No.", tip: "Purchase order of the line's vendor in this version", val: "p" + i, state: "ps" + i, prev: "pp" + i, text: true },
            // SI2 Tech: headers renamed Qty -> PO Qty, Total -> Total Amount (also in the change columns below)
            { label: "PO Qty", tip: "Ordered (split) quantity", val: "q" + i, state: "qs" + i, prev: "qp" + i, fmt: fnFmt, unit: true },
            { label: "Unit Rate", tip: "Negotiated price per unit", val: "r" + i, state: "rs" + i, prev: "rp" + i, fmt: fnFmt },
            { label: "Total Amount", tip: "PO Qty × Unit Rate", val: "t" + i, state: "ts" + i, prev: "tp" + i, fmt: fnFmt }
          ];
          // SI2 Tech: Grand Total row shows the % change vs the previous version next to the Total Amount
          if (i > 0) { aCols[2].pct = "tpct" + i; aCols[2].pctState = "tpcts" + i; }
          // Start: added by SI2 Tech - qty / rate change columns
          // Change columns in words (no symbols): PO Qty change / Unit Rate change / Total Amount change vs the compared version
          if (i > 0) {
            var sPrevV = "V" + aVersionNums[i - 1];
            aCols.push({ label: "PO Qty change vs " + sPrevV, tip: "Quantity in V" + iVer + " minus quantity in " + sPrevV,
                         val: "dq" + i, state: "dqs" + i, fmt: fnFmtDelta, delta: true, unit: true });
            aCols.push({ label: "Unit Rate change vs " + sPrevV, tip: "Unit rate in V" + iVer + " minus unit rate in " + sPrevV,
                         val: "dr" + i, state: "drs" + i, fmt: fnFmtDelta, delta: true });
            aCols.push({ label: "Total Amount change vs " + sPrevV, tip: "Total Amount (PO Qty × Unit Rate) in V" + iVer + " minus total in " + sPrevV,
                         val: "d" + i, state: "ds" + i, fmt: fnFmtDelta, delta: true,
                         pct: "dpct" + i, pctState: "ds" + i, pctTip: "Change vs " + sPrevV }); // SI2 Tech: % on the Grand Total row
          }
          if (i === n - 1 && n > 2) {
            var sOrigV = "V" + aVersionNums[0];
            aCols.push({ label: "PO Qty change vs " + sOrigV, tip: "Quantity in V" + iVer + " minus quantity in " + sOrigV + " (original scope)",
                         val: "dqO", state: "dqOs", fmt: fnFmtDelta, delta: true, unit: true });
            aCols.push({ label: "Unit Rate change vs " + sOrigV, tip: "Unit rate in V" + iVer + " minus unit rate in " + sOrigV + " (original scope)",
                         val: "drO", state: "drOs", fmt: fnFmtDelta, delta: true });
            aCols.push({ label: "Total Amount change vs " + sOrigV, tip: "Total in V" + iVer + " minus total in " + sOrigV + " (original scope)",
                         val: "dO", state: "dOs", fmt: fnFmtDelta, delta: true,
                         pct: "dOpct", pctState: "dOs", pctTip: "Change vs " + sOrigV + " (original scope)" }); // SI2 Tech: % on the Grand Total row
          }
          // End: added by SI2 Tech

          aCols.forEach(function (c, j) {
            if (c.text) {
              var mText = {
                width: "8rem",
                hAlign: "Begin",
                multiLabels: [
                  new sap.m.Label({ text: that._vcVersionLabel(iVer), textAlign: "Center", width: "100%", design: "Bold" }),
                  new sap.m.Label({ text: c.label, tooltip: c.tip, width: "100%" })
                ],
                template: new sap.m.ObjectStatus({
                  text: { path: "vcModel>" + c.val, formatter: function (v) { return v === "NA" ? "–" : (v || ""); } },
                  state: "{vcModel>" + c.state + "}",
                  tooltip: "{vcModel>" + c.prev + "}"
                })
              };
              if (j === 0) { mText.headerSpan = [aCols.length, 1]; }
              oTable.addColumn(new sap.ui.table.Column(mText));
              return;
            }
            var mNumber = {
              number: { path: "vcModel>" + c.val, formatter: c.fmt },
              state: "{vcModel>" + c.state + "}",
              emphasized: { path: "vcModel>NodeType", formatter: fnBold },
              textAlign: "End"
            };
            if (c.prev) { mNumber.tooltip = "{vcModel>" + c.prev + "}"; }
            if (c.unit) {
              mNumber.unit = {
                parts: ["vcModel>" + c.val, "vcModel>Uom"],
                formatter: function (v, u) { return typeof v === "number" ? u : ""; }
              };
            }
            var mSettings = {
              // SI2 Tech: replaced - width from the header length so the header stays on one line
              // width: c.delta ? "10rem" : (c.unit ? "8.5rem" : "8rem"), // SI2 Tech: wider for the worded change headers
              width: Math.max(8.5, Math.ceil(c.label.length * 0.5 + 2)) + "rem",
              hAlign: "End",
              multiLabels: [
                new sap.m.Label({ text: that._vcVersionLabel(iVer), textAlign: "Center", width: "100%", design: "Bold" }),
                new sap.m.Label({ text: c.label, tooltip: c.tip, textAlign: "End", width: "100%" })
              ],
              template: new sap.m.ObjectNumber(mNumber)
            };
            // Start: added by SI2 Tech - % in brackets right next to the amount (only filled on the Grand Total row)
            if (c.pct) {
              // SI2 Tech: at least 13rem for the amount + %; the wider change headers keep their own width
              mSettings.width = Math.max(13, parseFloat(mSettings.width)) + "rem";
              mSettings.template = new sap.m.HBox({
                justifyContent: "End",
                alignItems: "Center",
                width: "100%",
                items: [
                  mSettings.template,
                  new sap.m.ObjectStatus({
                    text: "{vcModel>" + c.pct + "}",
                    state: "{vcModel>" + c.pctState + "}",
                    visible: { path: "vcModel>" + c.pct, formatter: function (v) { return !!v; } },
                    tooltip: c.pctTip || "Change vs the previous version"
                  }).addStyleClass("sapUiTinyMarginBegin")
                ]
              });
            }
            // End: added by SI2 Tech
            if (j === 0) { mSettings.headerSpan = [aCols.length, 1]; }
            oTable.addColumn(new sap.ui.table.Column(mSettings));
          });
          // Start: added by SI2 Tech - remember this version's columns for the background shading below
          aVerCols.push(oTable.getColumns().slice(-aCols.length).map(function (oCol) { return oCol.getId(); }));
          // End: added by SI2 Tech
        });
        this._vcShadeVersionColumns(aVerCols); // SI2 Tech: very light background per version
        this._vcColumnsForExport = aVersionNums;
      },

      // Start: added by SI2 Tech - Columns button: ticked frozen columns are shown, unticked are hidden
      onVcColumnsPress: function (oEvent) {
        this.byId("vcColumnsPopover").openBy(oEvent.getSource());
      },
      // End: added by SI2 Tech

      // Start: added by SI2 Tech - very light background per version group (3 tints, repeated), so it is clear
      // where one version's columns end when scrolling sideways. sap.ui.table.Column takes no style class, so the
      // cells are matched by their data-sap-ui-colid attribute (set on header and body cells).
      // SI2 Tech: tints follow the UI5 theme - light themes: very light tints, dark themes: dark tints,
      // high-contrast themes: no backgrounds, only the edge lines (solid / dashed / dotted per version).
      _vcShadeVersionColumns: function (aVerCols) {
        var that = this;
        this._vcShadeCols = aVerCols; // rebuilt with the new theme's colours on a theme change
        if (!this._bVcThemeHandler) {
          this._bVcThemeHandler = true;
          sap.ui.getCore().attachThemeChanged(function () {
            if (that._vcShadeCols) { that._vcShadeVersionColumns(that._vcShadeCols); }
          });
        }
        var sTheme = sap.ui.getCore().getConfiguration().getTheme() || "";
        var bHc = /_hc[bw]$/.test(sTheme);
        var bDark = /_dark$/.test(sTheme);
        var aTints = bHc ? [
          { edge: "currentColor", line: "solid" },
          { edge: "currentColor", line: "dashed" },
          { edge: "currentColor", line: "dotted" }
        ] : bDark ? [
          { cell: "#1e2a38", head: "#253447", hover: "#2a3a4f", edge: "#4a6a8f", line: "solid" }, // dark blue
          { cell: "#1e2c25", head: "#25382e", hover: "#2a3f33", edge: "#4d7a5c", line: "solid" }, // dark green
          { cell: "#2f2920", head: "#3b3326", hover: "#41382a", edge: "#8a744d", line: "solid" }  // dark sand
        ] : [
          { cell: "#f4f8fd", head: "#e6effa", hover: "#eaf1fa", edge: "#b8cfe8", line: "solid" }, // light blue
          { cell: "#f5faf5", head: "#e5f2e7", hover: "#ebf4ec", edge: "#b9d8be", line: "solid" }, // light green
          { cell: "#fdf9f1", head: "#f8eedb", hover: "#f7f0e2", edge: "#e2cfa6", line: "solid" }  // light sand
        ];
        var aRules = [];
        // Summary card of the same version gets the same tint (card model property "tint" = version index % 3)
        aTints.forEach(function (t, k) {
          var sCard = ".vcCard[data-vc-tint=\"" + k + "\"]";
          aRules.push(sCard + "{" + (t.cell ? "background-color:" + t.cell + ";" : "") +
                      "border:1px " + t.line + " " + t.edge + ";border-top:4px " + t.line + " " + t.edge + ";}");
          if (t.cell) { aRules.push(sCard + " .sapFCardContent{background-color:transparent;}"); }
        });
        aVerCols.forEach(function (aIds, i) {
          var t = aTints[i % aTints.length];
          aIds.forEach(function (sId, j) {
            var sCell = ".vcTable td[data-sap-ui-colid=\"" + sId + "\"]";
            if (t.cell) {
              aRules.push(sCell + "{background-color:" + t.cell + ";}");
              aRules.push(".vcTable .sapUiTableColHdrTr " + sCell.replace(".vcTable ", "") + "{background-color:" + t.head + ";}");
              aRules.push(".vcTable .sapUiTableRowHvr " + sCell.replace(".vcTable ", "") + "{background-color:" + t.hover + ";}");
            }
            if (j === 0) { aRules.push(sCell + "{border-left:2px " + t.line + " " + t.edge + ";}"); }
          });
        });
        var oStyle = document.getElementById("vcVersionColStyles");
        if (!oStyle) {
          oStyle = document.createElement("style");
          oStyle.id = "vcVersionColStyles";
          document.head.appendChild(oStyle);
        }
        oStyle.textContent = aRules.join("\n");
      },
      // End: added by SI2 Tech

      onVcExport: function () {
        var aTree = this._oVcModel.getProperty("/tree") || [];
        var aNums = this._vcColumnsForExport || [];
        var n = aNums.length;
        var that = this;
        if (!aTree.length) { MessageToast.show("Nothing to export."); return; }

        // Flatten: PR subtotal row, then its lines, then Grand Total. "–" (not in version) becomes blank.
        var fnClean = function (o) {
          var c = Object.assign({}, o);
          Object.keys(c).forEach(function (k) { if (c[k] === "NA") { c[k] = null; } });
          delete c.children;
          return c;
        };
        var aRows = [];
        aTree.forEach(function (oNode) {
          var oRow = fnClean(oNode);
          oRow.Level = oNode.NodeType === "PR" ? "PR subtotal" : "Grand total";
          aRows.push(oRow);
          (oNode.children || []).forEach(function (c) {
            var oItem = fnClean(c);
            oItem.Level = "Line";
            aRows.push(oItem);
          });
        });

        var aCols = [
          { label: "Level", property: "Level", type: "String" },
          { label: "PR No", property: "PrNo", type: "String" },
          { label: "PR Item", property: "PrItem", type: "String" },
          { label: "Item Code", property: "Material", type: "String" },
          { label: "Description", property: "MaterialDescription", type: "String" },
          { label: "Long Text", property: "LongText", type: "String", width: 60, wrap: true }, // SI2 Tech: long text against the line
          { label: "Vendor", property: "VendorName", type: "String" },
          { label: "UoM", property: "Uom", type: "String" },
          { label: "Change", property: "statusText", type: "String" }
        ];
        aNums.forEach(function (iVer, i) {
          var sV = "V" + iVer;
          aCols.push({ label: sV + " PO No.", property: "p" + i, type: "String" });
          aCols.push({ label: sV + " Qty", property: "q" + i, type: "Number", scale: 3 });
          aCols.push({ label: sV + " Unit Rate", property: "r" + i, type: "Number", scale: 2 });
          aCols.push({ label: sV + " Total", property: "t" + i, type: "Number", scale: 2 });
          // Start: added by SI2 Tech - qty / rate change columns
          if (i > 0) {
            aCols.push({ label: sV + " Qty change vs V" + aNums[i - 1], property: "dq" + i, type: "Number", scale: 3 });
            aCols.push({ label: sV + " Rate change vs V" + aNums[i - 1], property: "dr" + i, type: "Number", scale: 2 });
            aCols.push({ label: sV + " Total change vs V" + aNums[i - 1], property: "d" + i, type: "Number", scale: 2 });
          }
          // End: added by SI2 Tech
        });
        // Start: added by SI2 Tech - qty / rate change columns
        if (n > 2) {
          var sL = "V" + aNums[n - 1], sF = "V" + aNums[0];
          aCols.push({ label: sL + " Qty change vs " + sF, property: "dqO", type: "Number", scale: 3 });
          aCols.push({ label: sL + " Rate change vs " + sF, property: "drO", type: "Number", scale: 2 });
          aCols.push({ label: sL + " Total change vs " + sF, property: "dO", type: "Number", scale: 2 });
        }
        // End: added by SI2 Tech

        sap.ui.require(["sap/ui/export/Spreadsheet"], function (Spreadsheet) {
          new Spreadsheet({
            workbook: { columns: aCols },
            dataSource: aRows,
            fileName: "Version_Comparison_" + that._oVcModel.getProperty("/nfaRefNo") + ".xlsx"
          }).build().finally(function () { MessageToast.show("Export complete."); });
        });
      },

      // ---------- Download Form (print / Save as PDF, same format as Version History) ----------

      onVcDownloadFormPress: function () {
        // Start: added by SI2 Tech - Download Form only for users in ZNFA_SEARCHHELP (TYPE FORM_DOWNLOAD)
        var oAccess = this.getOwnerComponent().getModel("formAccess");
        if (!oAccess || !oAccess.getProperty("/canDownload")) { return; }
        // End: added by SI2 Tech
        var that = this;
        var aSnaps = this._vcSnapshots || [];
        var aTree = this._oVcModel.getProperty("/allTree") || [];
        var sNfaRefNo = this._oVcModel.getProperty("/nfaRefNo");
        if (aSnaps.length < 2 || !aTree.length) {
          MessageToast.show("Nothing to download. Load at least two versions first.");
          return;
        }
        // Open the window inside the click handler so the popup blocker allows it
        var oPrintWin = window.open("", "_blank", "width=1400,height=900");
        if (!oPrintWin) { MessageToast.show("Please allow popups to download the PDF."); return; }
        oPrintWin.document.write("<p style='font-family:Arial;padding:20px'>Preparing Version Comparison form...</p>");

        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel().read("/et_approval_dataSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            that._vcWriteForm(oPrintWin, aSnaps, aTree, (oData && oData.results) || []);
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            that._vcWriteForm(oPrintWin, aSnaps, aTree, []);
          }
        });
      },

      _vcWriteForm: function (oPrintWin, aSnaps, aTree, aApprovals) {
        var that = this;
        var n = aSnaps.length;
        var iLast = n - 1;
        var aVer = aSnaps.map(function (s) { return s.version; });
        var oCur = aSnaps[iLast].header || {};
        var sNfaRefNo = this._oVcModel.getProperty("/nfaRefNo");
        var aCards = this._oVcModel.getProperty("/cards") || [];
        var oGrand = aTree.filter(function (x) { return x.NodeType === "TOTAL"; })[0] || {};

        var fnEsc = function (v) {
          return String(v === null || v === undefined ? "" : v)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        };
        var fnNum = function (v) { return fnEsc(that._vcFmt(v)); };
        var fnDelta = function (v) {
          var s = that._vcFmtDelta(v);
          if (!s) { return ""; }
          var sCls = v > 0.005 ? "up" : (v < -0.005 ? "down" : "");
          return "<span class='" + sCls + "'>" + fnEsc(s) + "</span>";
        };
        var fnDate = function (d) {
          if (!d) { return ""; }
          var o = d instanceof Date ? d : new Date(d);
          if (isNaN(o.getTime())) { return String(d); }
          return String(o.getDate()).padStart(2, "0") + "." + String(o.getMonth() + 1).padStart(2, "0") + "." + o.getFullYear();
        };
        var fnKv = function (sTitle, aRows) {
          return "<div class='section'><div class='sec-title'>" + fnEsc(sTitle) + "</div><table class='kv'>" +
            aRows.map(function (r) { return "<tr><td class='lbl'>" + fnEsc(r[0]) + "</td><td>" + fnEsc(r[1]) + "</td></tr>"; }).join("") +
            "</table></div>";
        };
        var mStateCls = { Warning: "chg", Success: "new", Error: "rem" };

        var sVersionsText = aVer.map(function (v) { return that._vcVersionLabel(v); }).join("  vs  ");
        var sTitle = "Version Comparison | NFA Ref: " + sNfaRefNo + " | " + aVer.map(function (v) { return "V" + v; }).join(" vs ");

        // ---- 1. Header ----
        var iChanged = 0, iLines = 0;
        aTree.forEach(function (p) {
          (p.children || []).forEach(function (c) { iLines++; if (c.changed) { iChanged++; } });
        });
        var sHdr = fnKv("Header Information", [
          ["NFA Reference Number", sNfaRefNo],
          ["NFA Title", oCur.NfaTitle || ""],
          ["NFA Type", oCur.NfaTypeDesc || ""],
          ["Ariba Document Number", oCur.AribaDocNo || ""],
          ["Purchase Group", oCur.PurchaseGroupDesc || ""],
          ["Plant", oCur.PlantDesc || ""],
          ["Status (V" + aVer[iLast] + ")", oCur.Status || ""],
          ["Versions Compared", sVersionsText],
          ["Purchase Orders", this._vcPoSelectionText()], // SI2 Tech: PO filter
          ["Lines Changed", iChanged + " of " + iLines]
        ]);

        // ---- 2. Version summary ----
        // SI2 Tech: replaced by the block below - amounts follow the PO selection (from the summary boxes),
        // net impact is on the basic amount and the basic-amount movements are listed per version
        // var sVerRows = aSnaps.map(function (s, i) {
        //   var h = s.header || {};
        //   var fPo = parseFloat(s.form.CurrentPoAmt) || 0;
        //   var fPrev = i > 0 ? (parseFloat(aSnaps[i - 1].form.CurrentPoAmt) || 0) : null;
        //   var fOrig = parseFloat(aSnaps[0].form.CurrentPoAmt) || 0;
        //   // Start: added by SI2 Tech
        //   var fLine = typeof oGrand["t" + i] === "number" ? oGrand["t" + i] : 0;
        //   var fCharges = Math.round((fPo - fLine) * 100) / 100;
        //   // End: added by SI2 Tech
        //   return "<tr>" +
        //     "<td><b>" + fnEsc(that._vcVersionLabel(s.version)) + "</b></td>" +
        //     "<td>" + fnEsc(h.Status || "") + "</td>" +
        //     "<td>" + fnEsc(i === 0 ? (h.CreatedBy || "") : (h.AmendedBy || "")) + "</td>" +
        //     "<td>" + fnEsc(i === 0 ? fnDate(h.BiDate) : fnDate(h.AmendedOn)) + "</td>" +
        //     "<td class='wrap'>" + fnEsc(s.version > 1 ? (h.AmendedReason || s.form.AmendedReason || "") : "") + "</td>" +
        //     "<td class='wrap'>" + fnEsc(((aCards[i] || {}).poNos || []).join(", ")) + "</td>" +
        //     "<td class='num'>" + fnNum(oGrand["t" + i]) + "</td>" +
        //     "<td class='num'><b>" + fnNum(fPo) + "</b></td>" +
        //     // Start: added by SI2 Tech - Charges & GST column
        //     "<td class='num'>" + fnNum(fCharges) + "</td>" +
        //     // End: added by SI2 Tech
        //     "<td class='num'>" + (i > 0 ? fnDelta(Math.round((fPo - fPrev) * 100) / 100) : "Baseline") + "</td>" +
        //     "<td class='num'>" + (i > 0 ? fnDelta(Math.round((fPo - fOrig) * 100) / 100) : "") + "</td>" +
        //     "</tr>";
        // }).join("");
        // var sVerSummary = "<div class='section'><div class='sec-title'>Version Summary</div><table class='data'><thead><tr>" +
        //   "<th>Version</th><th>Status</th><th>Created / Amended By</th><th>Date</th><th>Reason for Amendment</th><th>PO No.</th>" +
        //   // Start: added by SI2 Tech - header renamed to "PO Amount (Net Landed Cost)" + new "Charges & GST" column
        //   "<th>Line Total (Qty &times; Rate)</th><th>PO Amount (Net Landed Cost)</th><th>Charges &amp; GST</th><th>PO Amount change vs previous version</th><th>PO Amount change vs V" + aVer[0] + "</th>" + // SI2 Tech: worded headers
        //   // End: added by SI2 Tech
        //   "</tr></thead><tbody>" + sVerRows + "</tbody></table></div>";
        // Start: added by SI2 Tech - version summary from the summary boxes (PO filter aware)
        var sVerRows = aSnaps.map(function (s, i) {
          var h = s.header || {};
          var oC = aCards[i] || {};
          return "<tr>" +
            "<td><b>" + fnEsc(that._vcVersionLabel(s.version)) + "</b></td>" +
            "<td>" + fnEsc(h.Status || "") + "</td>" +
            "<td>" + fnEsc(i === 0 ? (h.CreatedBy || "") : (h.AmendedBy || "")) + "</td>" +
            "<td>" + fnEsc(i === 0 ? fnDate(h.BiDate) : fnDate(h.AmendedOn)) + "</td>" +
            "<td class='wrap'>" + fnEsc(s.version > 1 ? (h.AmendedReason || s.form.AmendedReason || "") : "") + "</td>" +
            "<td class='wrap'>" + fnEsc((oC.poNos || []).join(", ")) + "</td>" +
            "<td class='num'><b>" + fnNum(oC.poAmt) + "</b></td>" +
            "<td class='num'>" + fnNum(oC.basicAmt) + "</td>" +
            "<td class='num'>" + (oC.chargesAmt === null ? "Not saved yet" : fnNum(oC.chargesAmt)) + "</td>" +
            "</tr>";
        }).join("");
        var sMoveRows = aSnaps.map(function (s, i) {
          var oC = aCards[i] || {};
          var oM = oC.move || {};
          if (i === 0) {
            return "<tr><td><b>" + fnEsc(that._vcVersionLabel(s.version)) + "</b></td>" +
              "<td class='num'>&ndash;</td><td class='num'>&ndash;</td><td class='num'>&ndash;</td><td class='num'>&ndash;</td>" +
              "<td class='num'>&ndash;</td><td class='num'>&ndash;</td></tr>";
          }
          return "<tr><td><b>" + fnEsc(that._vcVersionLabel(s.version)) + "</b></td>" +
            "<td class='num'>" + fnDelta(oM.inc) + "</td>" +
            "<td class='num'>" + fnDelta(-oM.dec) + "</td>" +
            "<td class='num'>" + fnDelta(oM.add) + "</td>" +
            "<td class='num'>" + fnDelta(-oM.rem) + "</td>" +
            "<td class='num'><b>" + fnDelta(oC.netImpact) + "</b></td>" +
            "<td class='num'>" + fnDelta(oC.netImpactFirst) + "</td></tr>";
        }).join("");
        var sVerSummary = "<div class='section'><div class='sec-title'>Version Summary</div><table class='data'><thead><tr>" +
          "<th>Version</th><th>Status</th><th>Created / Amended By</th><th>Date</th><th>Reason for Amendment</th><th>PO No.</th>" +
          "<th>PO Amount (Net Landed Cost)</th><th>Basic Amount (Qty &times; Rate)</th><th>Charges &amp; GST</th>" +
          "</tr></thead><tbody>" + sVerRows + "</tbody></table></div>" +
          "<div class='section'><div class='sec-title'>Change vs Previous Version (Basic Amount)</div><table class='data'><thead><tr>" +
          "<th>Version</th><th>Increase in existing line items</th><th>Decrease in existing line items</th>" +
          "<th>New line items added</th><th>Line items removed</th><th>Net impact vs previous version</th>" +
          "<th>Net impact vs V" + aVer[0] + "</th>" +
          "</tr></thead><tbody>" + sMoveRows + "</tbody></table></div>";
        // End: added by SI2 Tech

        // ---- 3. What changed (plain-language list) ----
        var aChanges = [];
        aTree.forEach(function (p) {
          (p.children || []).forEach(function (c) {
            if (!c.changed) { return; }
            var aParts = [];
            for (var i = 1; i < n; i++) {
              var sStep = "V" + aVer[i - 1] + " &rarr; V" + aVer[i] + ": ";
              var bCur = typeof c["q" + i] === "number", bPrev = typeof c["q" + (i - 1)] === "number";
              if (bCur && !bPrev) {
                aParts.push(sStep + "added (Qty " + fnNum(c["q" + i]) + " " + fnEsc(c.Uom) + " @ " + fnNum(c["r" + i]) + ")");
              } else if (!bCur && bPrev) {
                aParts.push(sStep + "removed");
              } else if (bCur && bPrev) {
                var a = [];
                if (c["qs" + i] === "Warning") { a.push("Qty " + fnNum(c["q" + (i - 1)]) + " &rarr; " + fnNum(c["q" + i])); }
                if (c["rs" + i] === "Warning") { a.push("Unit Rate " + fnNum(c["r" + (i - 1)]) + " &rarr; " + fnNum(c["r" + i])); }
                var sTot = (c["qs" + i] === "Warning" || c["rs" + i] === "Warning") ? " (Total " + fnDelta(c["d" + i]) + ")" : "";
                if (c["ps" + i] === "Warning") { a.push("PO " + fnEsc(c["p" + (i - 1)]) + " &rarr; " + fnEsc(c["p" + i])); }
                if (a.length) { aParts.push(sStep + a.join(", ") + sTot); }
              }
            }
            aChanges.push("<tr><td>" + fnEsc((c.PrNo ? c.PrNo + " / " : "") + c.PrItem) + "</td><td>" + fnEsc(c.Material) +
              "</td><td class='wrap'>" + fnEsc(c.MaterialDescription) + "</td><td>" + fnEsc(c.VendorName) +
              "</td><td><span class='tag " + (mStateCls[c.statusState] || "") + "'>" + fnEsc(c.statusText) +
              "</span></td><td class='wrap'>" + aParts.join("<br/>") + "</td></tr>");
          });
        });
        var sChanges = "<div class='section'><div class='sec-title'>Changes</div>" +
          (aChanges.length
            ? "<table class='data'><thead><tr><th>PR / Item</th><th>Item Code</th><th>Description</th><th>Vendor</th><th>Change</th><th>Details</th></tr></thead><tbody>" + aChanges.join("") + "</tbody></table>"
            : "<div class='empty'>No line-level changes between the compared versions.</div>") + "</div>";

        // ---- 4. Line item comparison ----
        // SI2 Tech: replaced by the block below - the wide version-by-version table needed very small text on A4
        // var aGroupCols = aVer.map(function (v, i) {
        //   var a = ["PO No.", "Qty", "Unit Rate", "Total"];
        //   // Start: added by SI2 Tech - qty / rate change columns
        //   if (i > 0) {
        //     a.push("Qty change vs V" + aVer[i - 1], "Rate change vs V" + aVer[i - 1], "Total change vs V" + aVer[i - 1]);
        //   }
        //   if (i === iLast && n > 2) {
        //     a.push("Qty change vs V" + aVer[0], "Rate change vs V" + aVer[0], "Total change vs V" + aVer[0]);
        //   }
        //   // End: added by SI2 Tech
        //   return a;
        // });
        // var sHead1 = "<tr><th rowspan='2' class='c-item'>PR No. / Item</th><th rowspan='2'>Item Code</th><th rowspan='2' class='c-vendor'>Vendor</th><th rowspan='2'>UoM</th><th rowspan='2'>Change</th>" +
        //   aVer.map(function (v, i) { return "<th colspan='" + aGroupCols[i].length + "' class='grp'>" + fnEsc(that._vcVersionLabel(v)) + "</th>"; }).join("") + "</tr>";
        // var sHead2 = "<tr>" + aGroupCols.map(function (a) { return a.map(function (h) { return "<th>" + h + "</th>"; }).join(""); }).join("") + "</tr>";
        //
        // var fnCells = function (x, bItem) {
        //   return aVer.map(function (v, i) {
        //     var fnCell = function (sVal, sState) {
        //       var sCls = bItem ? (mStateCls[x[sState]] || "") : "";
        //       return "<td class='num " + sCls + "'>" + fnNum(x[sVal]) + "</td>";
        //     };
        //     var sPo = x["p" + i] === "NA" ? "&ndash;" : fnEsc(x["p" + i] || "");
        //     var s = "<td class='" + (bItem ? (mStateCls[x["ps" + i]] || "") : "") + "'>" + sPo + "</td>" +
        //       fnCell("q" + i, "qs" + i) + fnCell("r" + i, "rs" + i) + fnCell("t" + i, "ts" + i);
        //     // Start: added by SI2 Tech - qty / rate change columns
        //     var fnQty = function (v) { var t = fnDelta(v); return t && x.Uom ? t + " " + fnEsc(x.Uom) : t; };
        //     if (i > 0) {
        //       s += "<td class='num'>" + fnQty(x["dq" + i]) + "</td>" +
        //            "<td class='num'>" + fnDelta(x["dr" + i]) + "</td>" +
        //            "<td class='num'>" + fnDelta(x["d" + i]) + "</td>";
        //     }
        //     if (i === iLast && n > 2) {
        //       s += "<td class='num'>" + fnQty(x.dqO) + "</td>" +
        //            "<td class='num'>" + fnDelta(x.drO) + "</td>" +
        //            "<td class='num'>" + fnDelta(x.dO) + "</td>";
        //     }
        //     // End: added by SI2 Tech
        //     return s;
        //   }).join("");
        // };
        // var aRows = [];
        // aTree.forEach(function (p) {
        //   if (p.NodeType === "PR") {
        //     aRows.push("<tr class='pr-row'><td colspan='4'>" + fnEsc(p.label) + "</td><td>" + fnEsc(p.statusText) + "</td>" + fnCells(p, false) + "</tr>");
        //     p.children.forEach(function (c) {
        //       aRows.push("<tr class='item-row'><td class='wrap'>" + fnEsc(c.label) + "</td><td>" + fnEsc(c.Material) + "</td><td class='wrap'>" +
        //         fnEsc(c.VendorName) + "</td><td>" + fnEsc(c.Uom) + "</td><td><span class='tag " + (mStateCls[c.statusState] || "") + "'>" +
        //         fnEsc(c.statusText) + "</span></td>" + fnCells(c, true) + "</tr>");
        //     });
        //   } else {
        //     aRows.push("<tr class='sum-row'><td colspan='5'>" + fnEsc(p.label) + "</td>" + fnCells(p, false) + "</tr>");
        //   }
        // });
        // var sLines = "<div class='section'><div class='sec-title'>Line Item Comparison</div>" +
        //   "<div class='note'>Qty = ordered (split) quantity &middot; Unit Rate = negotiated price &middot; Total = Qty &times; Unit Rate &middot; " +
        //   "<span class='tag chg'>changed vs previous version</span> <span class='tag new'>added</span> <span class='tag rem'>removed</span> &middot; &ndash; = line not in that version</div>" +
        //   "<table class='data qcs-table" + (aGroupCols.reduce(function (s, a) { return s + a.length; }, 0) > 14 ? " dense" : "") + "'><thead>" + sHead1 + sHead2 + "</thead><tbody>" + aRows.join("") + "</tbody></table></div>";
        // Start: added by SI2 Tech - A4-readable line item comparison
        // Fixed 8 columns whatever the number of versions: every line gets a heading row and one row per version.
        var fnQtyU = function (v, sUom) {
          return typeof v === "number" ? fnNum(v) + (sUom ? " " + fnEsc(sUom) : "") : "&ndash;";
        };
        var fnVal = function (v) { return typeof v === "number" ? fnNum(v) : "&ndash;"; };
        var fnChg = function (v, sUom) {
          var t = fnDelta(v);
          return t ? t + (sUom ? " " + fnEsc(sUom) : "") : "&ndash;";
        };
        var fnVerTotals = function (x) {
          return aVer.map(function (v, i) {
            return "<span class='st'>V" + v + ": " + (typeof x["t" + i] === "number" ? fnNum(x["t" + i]) : "&ndash;") + "</span>";
          }).join(" ");
        };
        var aLineRows = [];
        aTree.forEach(function (p) {
          if (p.NodeType !== "PR") { return; }
          var sPrRow = "<tr class='pr-row'><td colspan='8'>" + fnEsc(p.label) + " &middot; " + fnEsc(p.statusText) + "</td></tr>";
          p.children.forEach(function (c, iChild) {
            var sHead = "<tr class='line-row'><td colspan='8'>" +
              "<span class='tag " + (mStateCls[c.statusState] || "") + "'>" + fnEsc(c.statusText) + "</span> " +
              "<b>" + fnEsc((c.PrNo ? c.PrNo + " / " : "") + c.PrItem) + "</b> &middot; " + fnEsc(c.MaterialDescription) +
              " &middot; Item code " + fnEsc(c.Material) + " &middot; " + fnEsc(c.VendorName) +
              (c.Uom ? " &middot; UoM " + fnEsc(c.Uom) : "") + "</td></tr>";
            var aVerRows = aVer.map(function (v, i) {
              var bIn = typeof c["q" + i] === "number";
              var fnCls = function (sState) { return mStateCls[c[sState]] || ""; };
              return "<tr><td class='ver'>" + fnEsc(that._vcVersionLabel(v)) + "</td>" +
                "<td class='" + fnCls("ps" + i) + "'>" + (bIn ? (fnEsc(c["p" + i]) || "Not created yet") : "&ndash;") + "</td>" +
                "<td class='num " + fnCls("qs" + i) + "'>" + fnQtyU(c["q" + i], c.Uom) + "</td>" +
                "<td class='num " + fnCls("rs" + i) + "'>" + fnVal(c["r" + i]) + "</td>" +
                "<td class='num " + fnCls("ts" + i) + "'>" + fnVal(c["t" + i]) + "</td>" +
                "<td class='num'>" + (i > 0 ? fnChg(c["dq" + i], c.Uom) : "&ndash;") + "</td>" +
                "<td class='num'>" + (i > 0 ? fnChg(c["dr" + i]) : "&ndash;") + "</td>" +
                "<td class='num'>" + (i > 0 ? fnChg(c["d" + i]) : "&ndash;") + "</td></tr>";
            });
            if (n > 2) {
              aVerRows.push("<tr class='orig-row'><td colspan='5'>Change V" + aVer[iLast] + " vs V" + aVer[0] + " (original scope)</td>" +
                "<td class='num'>" + fnChg(c.dqO, c.Uom) + "</td><td class='num'>" + fnChg(c.drO) + "</td>" +
                "<td class='num'>" + fnChg(c.dO) + "</td></tr>");
            }
            // One tbody per line: kept together on one page; the PR heading stays with its first line
            aLineRows.push("<tbody class='grp'>" + (iChild === 0 ? sPrRow : "") + sHead + aVerRows.join("") + "</tbody>");
          });
          aLineRows.push("<tbody class='grp'><tr class='sub-row'><td colspan='8'>PR subtotal (Qty &times; Rate) &nbsp; " +
            fnVerTotals(p) + "</td></tr></tbody>");
        });
        var oTotalRow = aTree.filter(function (x) { return x.NodeType === "TOTAL"; })[0];
        if (oTotalRow) {
          aLineRows.push("<tbody class='grp'><tr class='sum-row'><td colspan='8'>Grand Total (Qty &times; Rate) &nbsp; " +
            fnVerTotals(oTotalRow) + "</td></tr></tbody>");
        }
        var sLines = "<div class='section'><div class='sec-title'>Line Item Comparison</div>" +
          "<div class='note'>Each line shows one row per version. Qty = ordered (split) quantity &middot; Unit Rate = negotiated price &middot; " +
          "Total = Qty &times; Unit Rate &middot; changes are against the previous compared version &middot; " +
          "<span class='tag chg'>changed</span> <span class='tag new'>added</span> <span class='tag rem'>removed</span> &middot; " +
          "&ndash; = line not in that version</div>" +
          "<table class='data lines'><thead><tr><th>Version</th><th>PO No.</th><th>Qty</th><th>Unit Rate</th><th>Total</th>" +
          "<th>Qty change</th><th>Rate change</th><th>Total change</th></tr></thead>" + aLineRows.join("") + "</table></div>";
        // End: added by SI2 Tech

        // ---- 5. Approval history of the compared versions ----
        var mVer = {};
        aVer.forEach(function (v) { mVer[v] = true; });
        var mByVer = {};
        aApprovals.forEach(function (ap) {
          var iV = parseInt(ap.Version || "1", 10);
          if (!mVer[iV]) { return; }
          var sPh = ap.Phase || "1";
          mByVer[iV] = mByVer[iV] || {};
          (mByVer[iV][sPh] = mByVer[iV][sPh] || []).push(ap);
        });
        var sApproval = "";
        var aApprVers = Object.keys(mByVer).map(Number).sort(function (a, b) { return a - b; });
        if (aApprVers.length) {
          sApproval = "<div class='section'><div class='sec-title'>Approval History</div>" + aApprVers.map(function (iV) {
            var aPhases = Object.keys(mByVer[iV]).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
            return "<div class='sub-title'>" + fnEsc(that._vcVersionLabel(iV)) + "</div>" + aPhases.map(function (sPh) {
              var sRows = mByVer[iV][sPh].map(function (r) {
                var sRaw = r.StatusUpdatedOn || "";
                var sOn = sRaw.length === 8 ? sRaw.substring(6, 8) + "-" + sRaw.substring(4, 6) + "-" + sRaw.substring(0, 4) : sRaw;
                var sSt = r.ApprovedRejectInfo === "A" ? "Approved" : (r.ApprovedRejectInfo === "R" ? "Rejected" : "Pending");
                return "<tr><td>" + fnEsc(r.Sno) + "</td><td>" + fnEsc(r.SapId) + "</td><td>" + fnEsc(r.SapName) + "</td><td>" + sSt +
                  "</td><td>" + fnEsc(sOn) + "</td><td class='wrap'>" + fnEsc(r.RejectionRemarks) + "</td></tr>";
              }).join("");
              return "<div class='phase-label'>Phase " + fnEsc(sPh) + "</div><table class='data'><thead><tr><th>Sno</th><th>User ID</th><th>User Name</th><th>Status</th><th>Updated On</th><th>Remarks</th></tr></thead><tbody>" + sRows + "</tbody></table>";
            }).join("");
          }).join("") + "</div>";
        }

        // SI2 Tech: replaced by the block below - larger print sizes for A4 (no text below 12px)
        // var sCSS = [
        //   "@page { size: A4 landscape; margin: 12mm 10mm 10mm 10mm; }",
        //   "* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
        //   "body { font-family: 'SAP72', Arial, Helvetica, sans-serif; font-size: 12px; color: #000; background: #FFF; }",
        //   ".page-title { font-size: 22px; font-weight: bold; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 3px solid #1A6496; }",
        //   ".page-meta { font-size: 11px; color: #555; margin-bottom: 16px; }",
        //   ".section { margin-bottom: 14px; border: 1px solid #CCC; }",
        //   ".sec-title { background: #1A6496; color: #FFF; font-size: 16px; font-weight: bold; padding: 8px 10px; }",
        //   ".sub-title { background: #2E75B6; color: #FFF; font-size: 14px; font-weight: bold; padding: 6px 10px; }",
        //   ".phase-label { font-size: 12px; font-weight: bold; color: #1A6496; padding: 6px 10px 4px; background: #EEF5FB; border-bottom: 1px solid #CCC; }",
        //   ".note { font-size: 11px; color: #333; padding: 6px 10px; background: #FAFAFA; border-bottom: 1px solid #CCC; }",
        //   ".empty { padding: 10px; font-style: italic; }",
        //   "table { border-collapse: collapse; width: 100%; background: #FFF; }",
        //   ".kv td { border: 1px solid #CCC; padding: 8px 10px; vertical-align: top; }",
        //   ".lbl { font-weight: bold; width: 220px; background: #D9E8F5; white-space: nowrap; }",
        //   ".data thead th { background: #D9E8F5; font-weight: bold; text-align: center; border: 1px solid #CCC; padding: 7px 8px; }",
        //   ".data tbody td { border: 1px solid #CCC; padding: 6px 8px; vertical-align: middle; white-space: nowrap; }",
        //   ".data .wrap { white-space: normal; word-break: break-word; }",
        //   ".data .grp { background: #BCD6EE; }",
        //   ".qcs-table thead th, .qcs-table tbody td { font-size: 10px; padding: 5px; }",
        //   ".qcs-table.dense thead th, .qcs-table.dense tbody td { font-size: 8px; padding: 3px; }",
        //   ".qcs-table th.c-item { min-width: 120px; } .qcs-table th.c-vendor { min-width: 80px; }", // SI2 Tech: keep text columns readable
        //   ".qcs-table td.wrap { word-break: normal; overflow-wrap: break-word; }",
        //   ".qcs-table .pr-row td { background: #1A6496; color: #FFF; font-weight: bold; font-size: 11px; }",
        //   ".qcs-table .pr-row .up, .qcs-table .pr-row .down { color: #FFF; }",
        //   ".qcs-table .sum-row td { background: #E8F4E8; font-weight: bold; }",
        //   ".num { text-align: right; }",
        //   "td.chg { background: #FFF1D6; font-weight: bold; } td.new { background: #E3F4E3; } td.rem { background: #FBE3E3; }",
        //   ".tag { padding: 1px 6px; border-radius: 3px; font-size: 10px; white-space: nowrap; }",
        //   ".tag.chg { background: #FFF1D6; color: #8A5300; } .tag.new { background: #E3F4E3; color: #256F3A; } .tag.rem { background: #FBE3E3; color: #AA0808; }",
        //   ".up { color: #AA0808; font-weight: bold; } .down { color: #256F3A; font-weight: bold; }",
        //   "tr { page-break-inside: avoid; } thead { display: table-header-group; }",
        //   ".sec-title, .sub-title, .phase-label, .note { page-break-after: avoid; break-after: avoid; }"
        // ].join(" ");
        // Start: added by SI2 Tech - A4 print layout: body 13px, tables 12px, numbers never wrap, one line kept on one page
        var sCSS = [
          "@page { size: A4 landscape; margin: 12mm 10mm 12mm 10mm; }",
          "* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
          "body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.35; color: #000; background: #FFF; }",
          ".page-title { font-size: 20px; font-weight: bold; padding-bottom: 6px; border-bottom: 3px solid #1A6496; }",
          ".page-meta { font-size: 12px; color: #333; margin: 6px 0 14px; }",
          ".section { margin-bottom: 16px; border: 1px solid #BBB; }",
          ".sec-title { background: #1A6496; color: #FFF; font-size: 16px; font-weight: bold; padding: 8px 10px; }",
          ".sub-title { background: #2E75B6; color: #FFF; font-size: 14px; font-weight: bold; padding: 6px 10px; }",
          ".phase-label { font-size: 13px; font-weight: bold; color: #1A6496; padding: 6px 10px; background: #EEF5FB; border-bottom: 1px solid #BBB; }",
          ".note { font-size: 12px; padding: 7px 10px; background: #F4F7FA; border-bottom: 1px solid #BBB; }",
          ".empty { padding: 10px; font-style: italic; }",
          "table { border-collapse: collapse; width: 100%; background: #FFF; }",
          ".kv td { border: 1px solid #BBB; padding: 7px 10px; font-size: 13px; vertical-align: top; }",
          ".lbl { font-weight: bold; width: 230px; background: #D9E8F5; }",
          ".data th { background: #D9E8F5; font-size: 12px; font-weight: bold; text-align: center; vertical-align: bottom; border: 1px solid #BBB; padding: 7px 8px; }",
          ".data td { font-size: 12px; border: 1px solid #BBB; padding: 6px 8px; vertical-align: top; }",
          ".data .wrap { white-space: normal; overflow-wrap: break-word; }",
          ".num { text-align: right; white-space: nowrap; }",
          ".lines td.ver { font-weight: bold; white-space: nowrap; }",
          ".data td:first-child b { white-space: nowrap; }",
          ".lines .pr-row td { background: #1A6496; color: #FFF; font-weight: bold; font-size: 13px; padding: 7px 8px; }",
          ".lines .line-row td { background: #EEF4FA; font-size: 12px; padding: 7px 8px; }",
          ".lines .orig-row td { background: #FAFAFA; font-style: italic; }",
          ".lines .sub-row td { background: #F2F2F2; font-weight: bold; }",
          ".lines .sum-row td { background: #E3F4E3; font-weight: bold; font-size: 13px; }",
          ".st { display: inline-block; margin-right: 16px; white-space: nowrap; }",
          "td.chg { background: #FFF1D6; font-weight: bold; } td.new { background: #E3F4E3; } td.rem { background: #FBE3E3; }",
          ".tag { padding: 1px 6px; border-radius: 3px; font-size: 12px; font-weight: bold; white-space: nowrap; }",
          ".tag.chg { background: #FFF1D6; color: #8A5300; } .tag.new { background: #E3F4E3; color: #256F3A; } .tag.rem { background: #FBE3E3; color: #AA0808; }",
          ".up { color: #AA0808; font-weight: bold; } .down { color: #256F3A; font-weight: bold; }",
          "thead { display: table-header-group; }",
          "tr, tbody.grp { page-break-inside: avoid; break-inside: avoid; }",
          ".sec-title, .sub-title, .phase-label, .note { page-break-after: avoid; break-after: avoid; }",
          ".sec-title, .note { page-break-inside: avoid; break-inside: avoid; }"
        ].join(" ");
        // End: added by SI2 Tech

        var sHtml = "<!DOCTYPE html><html><head><meta charset='UTF-8'/><title>" + fnEsc(sTitle) + "</title><style>" + sCSS + "</style></head><body>" +
          "<div class='page-title'>" + fnEsc(sTitle) + "</div>" +
          "<div class='page-meta'>Generated on: " + new Date().toLocaleDateString("en-IN") + " &middot; Amounts in " + fnEsc(oCur.CurrencyDesc || oCur.Currency || "INR") + "</div>" +
          sHdr + sVerSummary + sChanges + sLines + sApproval +
          "</body></html>";

        oPrintWin.document.open();
        oPrintWin.document.write(sHtml);
        oPrintWin.document.close();
        oPrintWin.focus();
        setTimeout(function () { oPrintWin.print(); }, 300);
      },

      // ---------- End of code by SI2 Tech. on 24.09.2025 ----------

      onVersionSummaryPress: function () {
        var oViewModel = this.getView().getModel("viewModel");
        var sNfaRefNo = oViewModel.getProperty("/versionView/NfaRefNo");
        var sVersion  = oViewModel.getProperty("/versionView/Version");
        var that = this;

        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel().read("/et_version_logSet", {
          filters: [
            new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
            new Filter("Version",  FilterOperator.EQ, sVersion)
          ],
          urlParameters: { "$expand": "APP_FORM_LOG" },
          forceServerDataRequest: true,
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            var o = (oData.results || [])[0] || {};
            var oLog = (o.APP_FORM_LOG && o.APP_FORM_LOG.results && o.APP_FORM_LOG.results[0]) || o;

            if (!that._oNfaDraftFormDialog) {
              that._oNfaDraftFormDialog = sap.ui.xmlfragment(
                that.getView().getId(),
                "com.df.nfa.creator_v2.view.fragments.NfaDraftForm",
                that
              );
              that.getView().addDependent(that._oNfaDraftFormDialog);
            }

            var oDraftModel = new sap.ui.model.json.JSONModel({
              Discipline:           oLog.Discipline           || "",
              PoType:               oLog.PoType               || "",
              VendorAssessment:     oLog.VendorAssessment     || "",
              VendorName:           oLog.VendorName           || "",
              Currency:             oLog.Currency             || "",
              BudgetedAmount:       oLog.BudgetedAmount       || "",
              LppAmount:            oLog.LppAmount            || "",
              IceAmount:            oLog.IceAmount            || "",
              TotalBasicAmount:     oLog.TotalBasicAmount     || "",
              GstAmount:            oLog.GstAmount            || "",
              PoAmount:             oLog.PoAmount             || "",
              NetImpact:            oLog.NetImpact            || "",
              PrevPoAmt:            oLog.PrevPoAmt            || "",
              OrginalPoAmt:         oLog.OrginalPoAmt         || "",
              ContractEffDate:      oLog.ContractEffDate      || "",
              ContractDelivDate:    oLog.ContractDelivDate    || "",
              MobilizationDate:     oLog.MobilizationDate     || "",
              ImpactOnSchedule:     oLog.ImpactOnSchedule     || "",
              ImpactRemarks:        oLog.ImpactRemarks        || "",
              WbsInfo:              oLog.WbsInfo              || "",
              Incoterm:             oLog.Incoterm             || "",
              DeviationOnCommTerms: oLog.DeviationOnCommTerms || "",
              SpecialCommTerms:     oLog.SpecialCommTerms     || "",
              Recommendation:       oLog.Recommendation       || "",
              AdditionalInfo:       oLog.AdditionalInfo       || "",
              AmendedReason:        oLog.AmendedReason        || "",
              formEditable:         false,
              summaryMode:          true,
              isDocEditMode:        !!(oLog.AmendedReason)
            });
            that._oNfaDraftFormDialog.setModel(oDraftModel, "draftForm");
            that._oNfaDraftFormDialog.open();
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            sap.m.MessageToast.show("Failed to load summary data.");
          }
        });
      },

      onVersionDialogComboChange: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        if (!oItem) { return; }
        var sVersion = oItem.getKey();
        if (!sVersion) { return; }
        var sNfaRefNo = this.getView().getModel("viewModel").getProperty("/header/NfaRefNo");
        if (!sNfaRefNo) { return; }

        var oViewModel = this.getView().getModel("viewModel");
        var that = this;

        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel().read("/et_version_logSet", {
          filters: [
            new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
            new Filter("Version",  FilterOperator.EQ, sVersion)
          ],
          urlParameters: { "$expand": "VENDOR_LOG,VENDOR_PR_LOG" },
          forceServerDataRequest: true,
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            var aResults = oData.results || [];
            if (!aResults.length) {
              sap.m.MessageBox.information("No data found for " + sNfaRefNo + " Version " + sVersion);
              return;
            }
            var o = aResults[0];
            var aVendorLog = (o.VENDOR_LOG && o.VENDOR_LOG.results) ? o.VENDOR_LOG.results : [];
            var aVendorPRLog = (o.VENDOR_PR_LOG && o.VENDOR_PR_LOG.results) ? o.VENDOR_PR_LOG.results : [];

            // Build QCS tree data from VENDOR_PR_LOG
            var aQcsTree = that._buildVersionQcsTree(aVendorLog, aVendorPRLog);

            oViewModel.setProperty("/versionView", {
              NfaRefNo:           o.NfaRefNo           || "",
              Version:            sVersion,
              NfaTitle:           o.NfaTitle           || "",
              Status:             o.Status             || "",
              AribaDocNo:         o.AribaDocNo         || "",
              NfaTypeDesc:        o.NfaTypeDesc        || "",
              BiDate:             o.BiDate             || "",
              CompanyDescription: o.CompanyDescription || "",
              PurchaseOrgDesc:    o.PurchaseOrgDesc    || "",
              PurchaseGroupDesc:  o.PurchaseGroupDesc  || "",
              PlantDesc:          o.PlantDesc          || "",
              CurrencyDesc:       o.CurrencyDesc       || "",
              IncotermDesc:       o.IncotermDesc       || "",
              TbdDate:            o.TbdDate            || "",
              CreatedBy:          o.CreatedBy          || "",
              PrBudget:           o.PrBudget           || "",
              WbsBudget:          o.WbsBudget          || "",
              BaselineSpend:      o.BaselineSpend      || "",
              Description:        o.LongText           || "",
              LdClause:           o.LdClause           || "",
              LdClauseAmt:        o.LdClauseAmt        || "",
              AdvanceBg:          o.AdvanceBg          || "",
              AdavanceBgAmt:      o.AdavanceBgAmt      || "",
              PerformanceBg:      o.PerformanceBg      || "",
              PerformanceBpAmt:   o.PerformanceBpAmt   || "",
              Cpbg:               o.Cpbg               || "",
              CpbgAmt:            o.CpbgAmt            || "",
              OtherTerms:         o.OtherTerms         || "",
              LowestBasis:        o.LowestBasis        || "",
              TechAccepLowBasis:  o.TechAccepLowBasis  || "",
              ProprietaryBasis:   o.ProprietaryBasis   || "",
              SingleTenderBasis:  o.SingleTenderBasis  || "",
              RepeatOrderBasis:   o.RepeatOrderBasis   || "",
              RateContract:       o.RateContract       || "",
              Regularization:     o.Regularization     || "",
              FinalSettlement:    o.FinalSettlement    || "",
              ProjectTeamRecommendation: o.ProjectTeamRecommendation || "",
              JustificationRemarks: o.JustificationRemarks || "",
              ScopeOfWork:        o.ScopeOfWork        || "",
              AdditionalInfo:     o.AdditionalInfo     || "",
              NegotiationStrategy: o.NegotiationStrategy || "",
              vendors: aVendorLog.map(function (v, i) {
                return {
                  slNo: i + 1,
                  vendorNo:                 v.VendorNo             || "",
                  vendorName:               v.VendorName           || "",
                  technicalAcceptability:   v.Ta                   || "",
                  technicalRating:          v.TechinicalRating     || "",
                  commercialRating:         v.CommercialRating     || "",
                  vendorQualification:      v.VendorQa             || "",
                  vendorQualificationScore: v.QualifScore          || "",
                  paymentTermsDesc:         v.PaymentTermsDesc     || "",
                  netLandedCost:            v.NetLandedCost        || "",
                  negNetCost:               v.NegNetCost           || "",
                  poNo:                     v.PurchaseOrder        || "",
                  schedulingAgreementNo:    v.SchlAgreementNo      || "",
                  contractNo:               v.ContractNo           || ""
                };
              }),
              qcsTreeData: aQcsTree.treeData,
              qcsVendors:  aQcsTree.vendors
            });

            // Build dynamic vendor columns on the QCS tree table
            that._buildVersionQcsColumns(aQcsTree.vendors);
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            sap.m.MessageBox.error("Failed to load version data.");
          }
        });
      },

      onVersionDownloadFormPress: function () {
        // Start: added by SI2 Tech - Download Form only for users in ZNFA_SEARCHHELP (TYPE FORM_DOWNLOAD)
        var oAccess = this.getOwnerComponent().getModel("formAccess");
        if (!oAccess || !oAccess.getProperty("/canDownload")) { return; }
        // End: added by SI2 Tech
        var oViewModel = this.getView().getModel("viewModel");
        var oVersionView = oViewModel.getProperty("/versionView") || {};
        var sNfaRefNo = oVersionView.NfaRefNo || "";
        var sVersion  = oVersionView.Version  || "";
        if (!sNfaRefNo || !sVersion) { return; }

        var that = this;
        var oModel = this.getOwnerComponent().getModel();

        var fnEsc = function (s) {
          return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };
        var fnFmt = function (val) {
          var n = parseFloat(val);
          if (isNaN(n) || n === 0) return "";
          return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

        sap.ui.core.BusyIndicator.show(0);

        // Fetch version log with all expansions
        oModel.read("/et_version_logSet", {
          filters: [
            new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
            new Filter("Version",  FilterOperator.EQ, sVersion)
          ],
          urlParameters: { "$expand": "VENDOR_LOG,VENDOR_PR_LOG,APP_FORM_LOG" },
          forceServerDataRequest: true,
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            var o = (oData.results || [])[0] || {};
            var aVendorLog   = (o.VENDOR_LOG    && o.VENDOR_LOG.results)    ? o.VENDOR_LOG.results    : [];
            var aVendorPRLog = (o.VENDOR_PR_LOG && o.VENDOR_PR_LOG.results) ? o.VENDOR_PR_LOG.results : [];
            var oAppForm     = (o.APP_FORM_LOG  && o.APP_FORM_LOG.results  && o.APP_FORM_LOG.results[0]) ? o.APP_FORM_LOG.results[0] : o;

            var sTitle = "QCS Form | NFA Ref: " + sNfaRefNo + " | Version " + sVersion;

            // ---- Header Information ----
            var sHdr = fnSection("Header Information", [
              ["NFA Reference Number", o.NfaRefNo || ""],
              ["Ariba Document Number", o.AribaDocNo || ""],
              ["NFA Title", o.NfaTitle || ""],
              ["NFA Type", o.NfaTypeDesc || ""],
              ["Status", o.Status || ""]
            ]);

            // ---- Approval History ----
            var sApproval = "";
            oModel.read("/et_approval_dataSet", {
              filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
              success: function (oApprData) {
                var oVersionMap = {}, aVersionOrder = [];
                (oApprData.results || []).forEach(function (ap) {
                  var sVer   = ap.Version || "1";
                  var sPhase = ap.Phase   || "1";
                  var sRaw   = ap.StatusUpdatedOn || "";
                  var sFmt   = sRaw.length === 8 ? sRaw.substring(6,8)+"-"+sRaw.substring(4,6)+"-"+sRaw.substring(0,4) : sRaw;
                  if (!oVersionMap[sVer]) { oVersionMap[sVer] = { phaseMap: {}, phaseOrder: [] }; aVersionOrder.push(sVer); }
                  var oVer = oVersionMap[sVer];
                  if (!oVer.phaseMap[sPhase]) { oVer.phaseMap[sPhase] = []; oVer.phaseOrder.push(sPhase); }
                  oVer.phaseMap[sPhase].push({
                    Sno: ap.Sno, SapId: ap.SapId, SapName: ap.SapName,
                    statusText: ap.ApprovedRejectInfo === "A" ? "Approved" : ap.ApprovedRejectInfo === "R" ? "Rejected" : "Pending",
                    RejectionRemarks: ap.RejectionRemarks, StatusUpdatedOn: sFmt
                  });
                });
                if (aVersionOrder.length) {
                  aVersionOrder.sort(function (a, b) { return parseInt(a) - parseInt(b); });
                  var sVersionHtml = aVersionOrder.map(function (sVer) {
                    var oVer = oVersionMap[sVer];
                    oVer.phaseOrder.sort(function (a, b) { return parseInt(a) - parseInt(b); });
                    var sPhaseHtml = oVer.phaseOrder.map(function (p) {
                      var sRows = (oVer.phaseMap[p] || []).map(function (r) {
                        return "<tr><td>" + fnEsc(r.Sno) + "</td><td>" + fnEsc(r.SapId) + "</td><td>" + fnEsc(r.SapName) + "</td><td>" + fnEsc(r.statusText) + "</td><td>" + fnEsc(r.StatusUpdatedOn) + "</td><td style='word-wrap:break-word;white-space:normal;max-width:300px;'>" + fnEsc(r.RejectionRemarks) + "</td></tr>";
                      }).join("");
                      return "<div class='phase-label'>Phase " + fnEsc(p) + "</div><table class='data'><thead><tr><th>Sno</th><th>User ID</th><th>User Name</th><th>Status</th><th>Updated On</th><th>Remarks</th></tr></thead><tbody>" + sRows + "</tbody></table>";
                    }).join("");
                    return "<div class='sec-title' style='background:#2E75B6;font-size:14px;padding:6px 10px;'>Version " + fnEsc(parseInt(sVer)) + "</div>" + sPhaseHtml;
                  }).join("");
                  sApproval = "<div class='section'><div class='sec-title'>Approval History</div>" + sVersionHtml + "</div>";
                }
                that._resolveDescAndPrint(oAppForm, function (oResolved) {
                  that._buildAndPrintVersionForm(o, aVendorLog, aVendorPRLog, oResolved, sHdr, sApproval, sTitle, sCSS, fnSection, fnTable, fnFmt, fnEsc, fnDate);
                });
              },
              error: function () {
                that._resolveDescAndPrint(oAppForm, function (oResolved) {
                  that._buildAndPrintVersionForm(o, aVendorLog, aVendorPRLog, oResolved, sHdr, "", sTitle, sCSS, fnSection, fnTable, fnFmt, fnEsc, fnDate);
                });
              }
            });
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            sap.m.MessageToast.show("Failed to load version data for download.");
          }
        });
      },

      _resolveDescAndPrint: function (oAppForm, fnCallback) {
        var oModel = this.getOwnerComponent().getModel();
        var oResolved = JSON.parse(JSON.stringify(oAppForm));
        var mDisc = {}, mPo = {};
        var fnDone = function () {
          if (oResolved.Discipline) { oResolved.Discipline = mDisc[oResolved.Discipline] || oResolved.Discipline; }
          if (oResolved.PoType)     { oResolved.PoType     = mPo[oResolved.PoType]         || oResolved.PoType; }
          fnCallback(oResolved);
        };
        oModel.read("/et_nfa_search_helpSet", {
          filters: [new Filter("Type", FilterOperator.EQ, "DISCIPLINE")],
          success: function (oSH) {
            (oSH.results || []).forEach(function (r) { mDisc[r.KeyDataType] = r.Description; });
            oModel.read("/et_nfa_search_helpSet", {
              filters: [new Filter("Type", FilterOperator.EQ, "PO_TYPE")],
              success: function (oSH2) { (oSH2.results || []).forEach(function (r) { mPo[r.KeyDataType] = r.Description; }); fnDone(); },
              error: fnDone
            });
          },
          error: function () {
            oModel.read("/et_nfa_search_helpSet", {
              filters: [new Filter("Type", FilterOperator.EQ, "PO_TYPE")],
              success: function (oSH2) { (oSH2.results || []).forEach(function (r) { mPo[r.KeyDataType] = r.Description; }); fnDone(); },
              error: fnDone
            });
          }
        });
      },

      _buildAndPrintVersionForm: function (o, aVendorLog, aVendorPRLog, oAppForm, sHdr, sApproval, sTitle, sCSS, fnSection, fnTable, fnFmt, fnEsc, fnDate) {
        // ---- Basic Information ----
        var sBasic = fnSection("Basic Information", [
          ["Date", fnDate(o.BiDate)],
          ["Company Code", o.CompanyDescription || ""],
          ["Purchase Org", o.PurchaseOrgDesc || ""],
          ["Plant", o.PlantDesc || ""],
          ["Purchase Group", o.PurchaseGroupDesc || ""],
          ["PR Budget", o.PrBudget || ""],
          ["WBS Budget", o.WbsBudget || ""],
          ["Currency", o.CurrencyDesc || ""],
          ["Incoterms", o.IncotermDesc || ""],
          ["TBE Date", fnDate(o.TbdDate)],
          ["Created By", o.CreatedBy || ""],
          ["Long Text", o.LongText || ""]
        ]);

        // ---- Vendors Quoted ----
        var sVendors = fnTable("Vendors Quoted",
          ["Sl. No.", "Vendor", "Tech. Acceptability", "Technical Rating", "Commercial Rating", "Vendor Qualification", "Qualification Score", "Payment Terms", "PO Amount", "Vendor Quoted Amount", "PO Number", "Scheduling Agr. No.", "Contract Number"],
          aVendorLog.map(function (v, i) {
            return [i + 1, v.VendorName || "", v.Ta || "", v.TechinicalRating || "", v.CommercialRating || "",
              v.VendorQa || "", v.QualifScore || "", v.PaymentTermsDesc || "",
              fnFmt(v.NetLandedCost), fnFmt(v.NegNetCost), v.PurchaseOrder || "", v.SchlAgreementNo || "", v.ContractNo || ""];
          })
        );

        // ---- Terms and Conditions ----
        var sTerms = fnSection("Terms and Condition", [
          ["LD Clause", o.LdClause || ""], ["LD Clause %", o.LdClauseAmt || ""],
          ["Advance B.G.", o.AdvanceBg || ""], ["Advance B.G. %", o.AdavanceBgAmt || ""],
          ["Performance B.G.", o.PerformanceBg || ""], ["Performance B.G. %", o.PerformanceBpAmt || ""],
          ["CPBG", o.Cpbg || ""], ["CPBG %", o.CpbgAmt || ""],
          ["PO Header Text", o.OtherTerms || ""]
        ]);

        // ---- Justification For Price ----
        var aJustChecks = [
          ["Lowest Basis", o.LowestBasis], ["Technically acceptable lowest basis", o.TechAccepLowBasis],
          ["Proprietory basis", o.ProprietaryBasis], ["Single Vendor basis", o.SingleTenderBasis],
          ["Repeat order basis", o.RepeatOrderBasis], ["Rate Contract", o.RateContract],
          ["Regularization", o.Regularization], ["Final Settlement", o.FinalSettlement],
          ["Project team Recommendation basis", o.ProjectTeamRecommendation]
        ];
        var sJustChecks = aJustChecks.map(function (c) {
          return "<span class='chk'>" + (c[1] === "X" ? "&#9745;" : "&#9744;") + " " + fnEsc(c[0]) + "</span>";
        }).join("");
        var sJust = "<div class='section'><div class='sec-title'>Justification For Price</div><div class='chk-grid'>" + sJustChecks + "</div>" +
          "<table class='kv'><tr><td class='lbl'>Remarks / Comments</td><td>" + fnEsc(o.JustificationRemarks || "") + "</td></tr></table></div>";

        // ---- Special Remarks ----
        var sRemarks = fnSection("Special Remarks", [
          ["Scope of Work", o.ScopeOfWork || ""],
          ["Additional Information", o.AdditionalInfo || ""],
          ["Negotiation Strategy", o.NegotiationStrategy || ""]
        ]);

        // ---- NFA Summary (Approval Form) ----
        var sSummary = fnSection("NFA Summary", [
          ["Discipline",                  oAppForm.Discipline           || ""],
          ["PO Type",                     oAppForm.PoType               || ""],
          ["Vendor Assessment",           oAppForm.VendorAssessment     || ""],
          ["Awarded Vendor",              oAppForm.VendorName           || ""],
          ["Currency",                    oAppForm.Currency             || ""],
          ["Budgeted Amount",             fnFmt(oAppForm.BudgetedAmount)],
          ["LPP",                         fnFmt(oAppForm.LppAmount)],
          ["ICE",                         fnFmt(oAppForm.IceAmount)],
          ["Total Basic",                 fnFmt(oAppForm.TotalBasicAmount || oAppForm.TotalBasic)],
          ["GST Amount",                  fnFmt(oAppForm.GstAmount)],
          ["Purchase Order (PO) Amount",  fnFmt(oAppForm.CurrentPoAmt   || oAppForm.PoAmount)],
          ["Net Impact",                  fnFmt(oAppForm.NetImpact)],
          ["Previous PO Amount",          fnFmt(oAppForm.PrevPoAmt)],
          ["Original PO Amount",          fnFmt(oAppForm.OrginalPoAmt)],
          ["Contract Effective Date",     oAppForm.ContractEffDate      || ""],
          ["Contract Delivery Date",      oAppForm.ContractDelivDate    || ""],
          ["Mobilization Date",           oAppForm.MobilizationDate     || ""],
          ["Impact on Schedule",          oAppForm.ImpactOnSchedule     || ""],
          ["Impact Remarks",              oAppForm.ImpactRemarks        || ""],
          ["WBS Information",             oAppForm.WbsInfo              || ""],
          ["Incoterm",                    oAppForm.Incoterm             || ""],
          ["Deviation on Commercial Terms", oAppForm.DeviationOnCommTerms || oAppForm.DeviationComments || ""],
          ["Special Commercial Terms",    oAppForm.SpecialCommTerms     || ""],
          ["Recommendation",              oAppForm.Recommendation       || ""],
          ["Additional Information",      oAppForm.AdditionalInfo       || ""],
          ["Reason for Amendment",        oAppForm.AmendedReason        || ""]
        ]);

        // ---- QCS Vendor Comparison ----
        var aQcsTree = this._buildVersionQcsTree(aVendorLog, aVendorPRLog);
        var aQCSVendors = aQcsTree.vendors;
        var aTreeData   = aQcsTree.treeData;

        var aFixedCols = ["PR No./Short Text", "Item Code", "Remaining PR Qty", "UOM", "Plant", "Remaining Qty for PO Creation", "Unit LPP"];
        var aVendorCols = [];
        aQCSVendors.forEach(function (v) {
          aVendorCols.push(v.VendorName + "\nInit Price", v.VendorName + "\nNeg Price",
            v.VendorName + "\nNeg Price Total", v.VendorName + "\nOrdered QTY", v.VendorName + "\nOrder Value");
        });
        var aAllCols = aFixedCols.concat(aVendorCols);

        var aQCSRows = [];
        var aFlatNodes = [];
        aTreeData.forEach(function (node) {
          if (node.NodeType === "PR") {
            aQCSRows.push([node.PrNumber, "", "", "", "", "", ""].concat(aQCSVendors.reduce(function (a) { return a.concat(["", "", "", "", ""]); }, [])));
            aFlatNodes.push({ type: "PR" });
            (node.children || []).forEach(function (item) {
              if (item.NodeType === "ITEM") {
                var aRow = [(item.PrItem ? item.PrItem + " / " : "") + (item.MaterialDesc || ""),
                  item.Material || "", item.Qty || "", item.UOM || "", item.Plant || "",
                  item.RemainingQty != null ? item.RemainingQty : (item.Qty || ""), item.UnitLpp || ""];
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
                aFlatNodes.push({ type: "ITEM" });
              }
            });
          } else if (node.NodeType === "SUMMARY") {
            var aSumRow = [node.Label, "", "", "", "", "", ""];
            aQCSVendors.forEach(function (v) {
              aSumRow.push(node["v" + v.VendorIndex + "NegPrice"] || "");
              aSumRow.push("");
              var fNPT = parseFloat(node["v" + v.VendorIndex + "NegPriceTotal"]);
              aSumRow.push(!isNaN(fNPT) && fNPT ? fnFmt(fNPT) : "");
              aSumRow.push("");
              var fFP = parseFloat(node["v" + v.VendorIndex + "FinalPrice"]);
              aSumRow.push(!isNaN(fFP) && fFP ? fnFmt(fFP) : (node["v" + v.VendorIndex + "SingleValue"] || ""));
            });
            aQCSRows.push(aSumRow);
            aFlatNodes.push({ type: "SUMMARY" });
          }
        });

        var sTh = aAllCols.map(function (h) { return "<th>" + fnEsc(h).replace("\n", "<br/>") + "</th>"; }).join("");
        var sTrs = aQCSRows.map(function (r, i) {
          var sClass = aFlatNodes[i] ? (aFlatNodes[i].type === "PR" ? " class='pr-row'" : aFlatNodes[i].type === "SUMMARY" ? " class='sum-row'" : " class='item-row'") : "";
          return "<tr" + sClass + ">" + r.map(function (c) { return "<td>" + fnEsc(c) + "</td>"; }).join("") + "</tr>";
        }).join("");
        var sQCS = "<div class='section'><div class='sec-title'>QCS \u2013 Vendor Comparison | Version " + fnEsc(o.Version || "") + "</div><table class='data qcs-table'><thead><tr>" + sTh + "</tr></thead><tbody>" + sTrs + "</tbody></table></div>";

        var sHtml = "<!DOCTYPE html>" +
          "<html><head><meta charset='UTF-8'/><title>" + fnEsc(sTitle) + "</title>" +
          "<style>" + sCSS + "</style></head><body>" +
          "<div class='page-title'>" + fnEsc(sTitle) + "</div>" +
          "<div class='page-meta'>Generated on: " + new Date().toLocaleDateString("en-IN") + "</div>" +
          sHdr + sApproval + sBasic + sVendors + sTerms + sJust + sRemarks + sSummary + sQCS +
          "</body></html>";

        var oPrintWin = window.open("", "_blank", "width=1400,height=900");
        if (!oPrintWin) { sap.m.MessageToast.show("Please allow popups to download the PDF."); return; }
        oPrintWin.document.write(sHtml);
        oPrintWin.document.close();
        oPrintWin.focus();
        oPrintWin.onload = function () { oPrintWin.print(); };
      },

      onDraftFormCancel: function () {
        if (this._oNfaDraftFormDialog) { this._oNfaDraftFormDialog.close(); }
      },

      onVersionDropdownChange: function (oEvent) {
        // kept for backward compatibility — delegates to combo change handler
        this.onVersionDialogComboChange(oEvent);
      },

      // Builds a flat tree array + vendor list from VENDOR_PR_LOG for the version history QCS view
      _buildVersionQcsTree: function (aVendorLog, aVendorPRLog) {
        var summaryLabels = [
          "Basic Amount Total", "P & F Charges (%)", "Freight (Rs)", "Insurance",
          "Total Basic", "GST (%)", "Net Landed Cost (Rs)", "Commercial Rating",
          "Commercial Loading", "Loading Comments", "Total Amt with Comm. Loading",
          "Delivery Date", "Payment Terms"
        ];

        // Build vendor index map
        var aVendors = aVendorLog.map(function (v, i) {
          return {
            VendorIndex: i + 1,
            VendorNo:    v.VendorNo   || "",
            VendorName:  v.VendorName || "",
            paymentTermsDesc: v.PaymentTermsDesc || "",
            commercialRating: v.CommercialRating || ""
          };
        });
        var mVendorIdx = {};
        aVendors.forEach(function (v) { mVendorIdx[v.VendorNo] = v.VendorIndex; });

        // Group PR log rows into PR → ITEM nodes
        var mPRNodes = {};
        var aPROrder = [];
        aVendorPRLog.forEach(function (row) {
          var sPrNo = row.PrNo || "";
          if (!mPRNodes[sPrNo]) {
            mPRNodes[sPrNo] = { NodeType: "PR", PrNumber: sPrNo, children: [] };
            aPROrder.push(sPrNo);
          }
          var oPRNode = mPRNodes[sPrNo];
          var oItem = oPRNode.children.find(function (i) { return i.PrItem === row.PrItem; });
          if (!oItem) {
            oItem = {
              NodeType:     "ITEM",
              PrItem:       row.PrItem       || "",
              Material:     row.Material     || "",
              MaterialDesc: row.MaterialDescription || "",
              Qty:          row.Qty          || "0",
              UOM:          row.Uom          || "",
              Plant:        row.Plant        || "",
              UnitLpp:      row.UnitLpp      || "0",
              RemainingQty: row.RemainingQty || "0",
              children: []
            };
            oPRNode.children.push(oItem);
          }
          var idx = mVendorIdx[row.VendorNo];
          if (idx !== undefined) {
            oItem["v" + idx + "InitPrice"]  = row.InitialPrice     || "";
            oItem["v" + idx + "NegPrice"]   = row.NegotiatedPrice  || "";
            oItem["v" + idx + "SplitQty"]   = row.SplitPoQty       || "";
            oItem["v" + idx + "FinalPrice"] = row.FinilizedLinePrice || "";
          }
        });

        var aPRNodes = aPROrder.map(function (k) { return mPRNodes[k]; });

        // Build summary rows populated from VENDOR_LOG
        var aSummaryRows = summaryLabels.map(function (sLabel) {
          var oRow = { NodeType: "SUMMARY", Label: sLabel };
          aVendors.forEach(function (v) {
            var oVL = aVendorLog.find(function (x) { return x.VendorNo === v.VendorNo; }) || {};
            if (sLabel === "Basic Amount Total")  { oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.NegBasicTotal || ""; oRow["v" + v.VendorIndex + "FinalPrice"] = oVL.BasicTotalAmt || ""; }
            else if (sLabel === "P & F Charges (%)") { oRow["v" + v.VendorIndex + "NegPrice"] = oVL.PfPercent ? oVL.PfPercent + "%" : ""; oRow["v" + v.VendorIndex + "FinalPrice"] = oVL.PfAmount || ""; oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.NegPFAmount || ""; }
            else if (sLabel === "Freight (Rs)")      { oRow["v" + v.VendorIndex + "NegPrice"] = oVL.Freight || ""; oRow["v" + v.VendorIndex + "FinalPrice"] = oVL.Freight || ""; oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.NegFreight || ""; }
            else if (sLabel === "Insurance")         { oRow["v" + v.VendorIndex + "NegPrice"] = oVL.Insurance || ""; oRow["v" + v.VendorIndex + "FinalPrice"] = oVL.Insurance || ""; oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.NegInsurance || ""; }
            else if (sLabel === "Total Basic")       { oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.NegTotalBasic || ""; }
            else if (sLabel === "GST (%)")           { oRow["v" + v.VendorIndex + "NegPrice"] = oVL.GstPercentage ? oVL.GstPercentage + "%" : ""; oRow["v" + v.VendorIndex + "FinalPrice"] = oVL.GstAmount || ""; oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.NegGstAmount || ""; }
            else if (sLabel === "Net Landed Cost (Rs)") { oRow["v" + v.VendorIndex + "FinalPrice"] = oVL.NetLandedCost || ""; oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.NegNetCost || ""; }
            else if (sLabel === "Commercial Rating")    { oRow["v" + v.VendorIndex + "SingleValue"] = oVL.CommercialRating || ""; }
            else if (sLabel === "Commercial Loading")   { oRow["v" + v.VendorIndex + "NegPrice"] = oVL.CommercialLoading || ""; oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.CommercialLoading || ""; }
            else if (sLabel === "Loading Comments")     { oRow["v" + v.VendorIndex + "LoadingComments"] = oVL.LoadingComments || ""; }
            else if (sLabel === "Total Amt with Comm. Loading") { oRow["v" + v.VendorIndex + "NegPriceTotal"] = oVL.TotalCommLoading || ""; }
            else if (sLabel === "Delivery Date")  { oRow["v" + v.VendorIndex + "SingleValue"] = oVL.DeliveryDate || ""; }
            else if (sLabel === "Payment Terms")  { oRow["v" + v.VendorIndex + "SingleValue"] = oVL.PaymentTermsDesc || ""; }
          });
          return oRow;
        });

        return { treeData: aPRNodes.concat(aSummaryRows), vendors: aVendors };
      },

      // Start: added by SI2 Tech
      // Unit LPP ⓘ in the version history QCS table - same popover as the QCS page (mixin/PoHistory),
      // but the rows are bound to "viewModel" instead of "view"
      onVhLppInfoPress: function (oEvent) {
        var oSource = oEvent.getSource();
        var oItem = oSource.getBindingContext("viewModel").getObject();
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

      // Negotiated Price ⓘ in the version history QCS table - last 10 POs for material + vendor + plant
      // (same popover and backend query as the QCS page; rows are bound to "viewModel")
      onVhNegPriceInfoPress: function (oVendor, oEvent) {
        var oSource = oEvent.getSource();
        var oItem = oSource.getBindingContext("viewModel").getObject();
        var sNfaRefNo = this.getView().getModel("viewModel").getProperty("/versionView/NfaRefNo") ||
                        this.getView().getModel("viewModel").getProperty("/header/NfaRefNo") || "";
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
      // End: added by SI2 Tech

      // Adds read-only vendor columns to the version history QCS TreeTable
      _buildVersionQcsColumns: function (aVendors) {
        var oTable = this.byId("versionQcsTreeTable");
        if (!oTable) { return; }
        var that = this; // SI2 Tech: needed for the Negotiated Price info button handler

        // Remove previously added dynamic columns (keep first 7 fixed)
        var iFixed = 7;
        while (oTable.getColumns().length > iFixed) {
          oTable.removeColumn(oTable.getColumns()[iFixed]);
        }

        var formatINR = function (val) {
          var n = parseFloat(val);
          if (isNaN(n) || n === 0) { return ""; }
          return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        aVendors.forEach(function (v) {
          var idx = v.VendorIndex;

          // Initial Price
          oTable.addColumn(new sap.ui.table.Column({
            width: "110px", hAlign: "End",
            multiLabels: [
              new sap.m.Label({ text: "Vendor " + idx + " - " + v.VendorName, textAlign: "Center" }),
              new sap.m.Label({ text: "Initial Price", textAlign: "Center" })
            ],
            template: new sap.m.Text({
              text: { path: "viewModel>v" + idx + "InitPrice", formatter: formatINR },
              visible: "{= ${viewModel>NodeType} === 'ITEM' }",
              textAlign: "End"
            })
          }));

          // Negotiated Price
          oTable.addColumn(new sap.ui.table.Column({
            width: "150px", hAlign: "End", // SI2 Tech: 110px -> 150px for the info button
            multiLabels: [
              new sap.m.Label({ text: "" }),
              new sap.m.Label({ text: "Negotiated Price", textAlign: "Center" })
            ],
            template: new sap.m.VBox({
              width: "100%", alignItems: "End",
              items: [
                // Start: added by SI2 Tech - item-row price + info button (last 10 POs for material + vendor + plant)
                new sap.m.HBox({
                  justifyContent: "End",
                  alignItems: "Center",
                  visible: "{= ${viewModel>NodeType} === 'ITEM' }",
                  items: [
                    new sap.m.Text({
                      text: { path: "viewModel>v" + idx + "NegPrice", formatter: formatINR },
                      textAlign: "End"
                    }),
                    new sap.m.Button({
                      icon: "sap-icon://hint",
                      type: "Transparent",
                      tooltip: "Last 10 POs for this material and plant from " + (v.VendorName || "this vendor"),
                      visible: "{= !!${viewModel>Material} && !!${viewModel>Plant} }",
                      press: that.onVhNegPriceInfoPress.bind(that, v)
                    })
                  ]
                }),
                // End: added by SI2 Tech
                new sap.m.Text({
                  text: "{viewModel>v" + idx + "NegPrice}",
                  visible: "{= ${viewModel>NodeType} === 'SUMMARY' && ${viewModel>Label} !== 'Basic Amount Total' && ${viewModel>Label} !== 'Total Basic' && ${viewModel>Label} !== 'Net Landed Cost (Rs)' && ${viewModel>Label} !== 'Commercial Rating' && ${viewModel>Label} !== 'Loading Comments' && ${viewModel>Label} !== 'Delivery Date' && ${viewModel>Label} !== 'Payment Terms' && ${viewModel>Label} !== 'Total Amt with Comm. Loading' }",
                  textAlign: "End"
                }),
                new sap.m.Text({
                  text: "{viewModel>v" + idx + "LoadingComments}",
                  visible: "{= ${viewModel>NodeType} === 'SUMMARY' && ${viewModel>Label} === 'Loading Comments' }",
                  textAlign: "Begin"
                })
              ]
            })
          }));

          // Negotiated Price Total
          oTable.addColumn(new sap.ui.table.Column({
            width: "120px", hAlign: "End",
            multiLabels: [
              new sap.m.Label({ text: "" }),
              new sap.m.Label({ text: "Neg. Price Total", textAlign: "Center" })
            ],
            template: new sap.m.VBox({
              width: "100%", alignItems: "End",
              items: [
                new sap.m.Text({
                  text: { path: "viewModel>v" + idx + "NegPriceTotal", formatter: formatINR },
                  visible: "{= ${viewModel>NodeType} === 'ITEM' || (${viewModel>NodeType} === 'SUMMARY' && ${viewModel>Label} !== 'Commercial Rating' && ${viewModel>Label} !== 'Loading Comments' && ${viewModel>Label} !== 'Delivery Date' && ${viewModel>Label} !== 'Payment Terms') }",
                  textAlign: "End",
                  design: "{= ${viewModel>Label} === 'Net Landed Cost (Rs)' ? 'Bold' : 'Standard' }"
                }),
                new sap.m.Text({
                  text: "{viewModel>v" + idx + "SingleValue}",
                  visible: "{= ${viewModel>NodeType} === 'SUMMARY' && (${viewModel>Label} === 'Commercial Rating' || ${viewModel>Label} === 'Delivery Date' || ${viewModel>Label} === 'Payment Terms') }",
                  textAlign: "Center"
                })
              ]
            })
          }));

          // Ordered QTY
          oTable.addColumn(new sap.ui.table.Column({
            width: "90px", hAlign: "End",
            multiLabels: [
              new sap.m.Label({ text: "" }),
              new sap.m.Label({ text: "Ordered QTY", textAlign: "Center" })
            ],
            template: new sap.m.Text({
              text: { path: "viewModel>v" + idx + "SplitQty", formatter: function (val) {
                var f = parseFloat(val); return (isNaN(f) || f === 0) ? "" : String(f);
              }},
              visible: "{= ${viewModel>NodeType} === 'ITEM' }",
              textAlign: "End"
            })
          }));

          // Order Value
          oTable.addColumn(new sap.ui.table.Column({
            width: "110px", hAlign: "End",
            multiLabels: [
              new sap.m.Label({ text: "" }),
              new sap.m.Label({ text: "Order Value", textAlign: "Center" })
            ],
            template: new sap.m.Text({
              text: { path: "viewModel>v" + idx + "FinalPrice", formatter: formatINR },
              visible: "{= ${viewModel>NodeType} === 'ITEM' || (${viewModel>NodeType} === 'SUMMARY' && ${viewModel>Label} !== 'Commercial Rating' && ${viewModel>Label} !== 'Loading Comments' && ${viewModel>Label} !== 'Delivery Date' && ${viewModel>Label} !== 'Payment Terms' && ${viewModel>Label} !== 'Total Amt with Comm. Loading' && ${viewModel>Label} !== 'Commercial Loading') }",
              textAlign: "End"
            })
          }));
        });
      },

      _updateCompanyCodeEditable: function () {
        var oViewModel = this.getView().getModel("viewModel");
        var bIsAribaMode  = oViewModel.getProperty("/isAribaMode");
        var bIsEditMode   = oViewModel.getProperty("/isEditMode");
        var bIsDocEdit    = oViewModel.getProperty("/isDocEditMode");
        var sNfaRefNo     = oViewModel.getProperty("/header/NfaRefNo");
        var sStatus       = oViewModel.getProperty("/header/Status") || "";
        var iVersion      = oViewModel.getProperty("/nfaVersion");
        var aVendors      = oViewModel.getProperty("/vendors") || [];
        var aVendorPR     = oViewModel.getProperty("/vendorPR") || [];

        var bEditable;
        if (!bIsAribaMode && bIsEditMode && !bIsDocEdit && sNfaRefNo && sStatus === "Draft" && iVersion === 1) {
          // Version 1, Draft: editable only when no vendor data and no Vendor PR data
          bEditable = aVendors.length === 0 && aVendorPR.length === 0;
        } else if (!bIsAribaMode && bIsEditMode && !bIsDocEdit && sNfaRefNo && sStatus === "Draft" && (iVersion === 0 || iVersion === null)) {
          // Version 0 Draft (newly saved NFA): editable when no vendor data and no Vendor PR data
          bEditable = aVendors.length === 0 && aVendorPR.length === 0;
        } else if (!bIsAribaMode && bIsEditMode && !bIsDocEdit && !sNfaRefNo) {
          // No NfaRefNo yet (unsaved): editable only when no vendors selected
          bEditable = aVendors.length === 0;
        } else {
          // All other versions/statuses: non-editable
          bEditable = false;
        }
        oViewModel.setProperty("/companyCodeEditable", bEditable);
        oViewModel.setProperty("/purchaseGroupEditable", bIsEditMode && !bIsDocEdit);
      },

      _restoreVendorsFromQCS: function () {
        var oQCSModel = this.getOwnerComponent().getModel("qcsData");
        if (oQCSModel) {
          var aVendors = oQCSModel.getProperty("/vendors");
          if (aVendors && aVendors.length) {
            var oViewModel = this.getView().getModel("viewModel");
            var aCurrentVendors = oViewModel.getProperty("/vendors") || [];
            
            // Merge QCS vendor data back to current vendors
            aVendors.forEach(function (qcsVendor, index) {
              if (aCurrentVendors[index]) {
                // Preserve QCS data while keeping other vendor fields
                aCurrentVendors[index].initialPrice = qcsVendor.initialPrice || aCurrentVendors[index].initialPrice;
                aCurrentVendors[index].negotiatedAmount = qcsVendor.negotiatedAmount || aCurrentVendors[index].negotiatedAmount;
              }
            });
            
            oViewModel.setProperty("/vendors", aCurrentVendors);
          }
        }
      },
      _loadNfaData: function (sNfaRefNo) {
        var oODataModel = this.getOwnerComponent().getModel();
        var oViewModel = this.getView().getModel("viewModel");
        var that = this;

        sap.ui.core.BusyIndicator.show(0);

        oODataModel.read("/et_nfa_detailsSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          forceServerDataRequest: true,
          success: function (oData) {
            if (oData.results && oData.results.length) {
              var o = oData.results[0];

              // If DocCreated flag is active, enforce docEdit mode regardless of current status
              if (o.DocCreated === "X") {
                oViewModel.setProperty("/isDocEditMode", true);
                oViewModel.setProperty("/isEditMode", false);
              }

              oViewModel.setProperty("/header", {
                NfaRefNo:            o.NfaRefNo,
                PoNo:                o.NfaRefNo,
                AribaDocNo:          o.AribaDocNo,
                NfaType:             o.NfaType,
                NfaTypeDesc:         o.NfaTypeDesc,
                NfaTitle:            o.NfaTitle,
                Status:              o.Status,
                StatusState:         that._getStatusState(o.Status),
                BiDate:              o.BiDate ? new Date(o.BiDate) : null,
                PurchaseOrg:         o.PurchaseOrg,
                PurchaseOrgDesc:     o.PurchaseOrgDesc,
                PurchaseGroup:       o.PurchaseGroup,
                PurchaseGroupDesc:   o.PurchaseGroupDesc,
                CompanyCode:         o.CompanyCode,
                CompanyDescription:  o.CompanyDescription,
                PrBudget:            o.PrBudget,
                WbsBudget:           o.WbsBudget,
                Description:         o.LongText,
                BaselineSpend:       o.BaselineSpend,
                Currency:            o.Currency,
                CurrencyDesc:        o.CurrencyDesc,
                Remarks:             o.Remarks,
                LdClause:            o.LdClause,
                LdClauseAmt:         o.LdClauseAmt ? String(parseFloat(o.LdClauseAmt)) : "",
                AdvanceBg:           o.AdvanceBg,
                AdavanceBgAmt:       o.AdavanceBgAmt ? String(parseFloat(o.AdavanceBgAmt)) : "",
                PerformanceBg:       o.PerformanceBg,
                PerformanceBpAmt:    o.PerformanceBpAmt ? String(parseFloat(o.PerformanceBpAmt)) : "",
                Cpbg:                o.Cpbg,
                CpbgAmt:             o.CpbgAmt ? String(parseFloat(o.CpbgAmt)) : "",
                LowestBasis:         o.LowestBasis,
                TechAccepLowBasis:   o.TechAccepLowBasis,
                ProprietaryBasis:    o.ProprietaryBasis,
                SingleTenderBasis:   o.SingleTenderBasis,
                RepeatOrderBasis:    o.RepeatOrderBasis,
                RateContract:        o.RateContract,
                JustificationRemarks: o.JustificationRemarks,
                ScopeOfWork:         o.ScopeOfWork,
                AdditionalInfo:      o.AdditionalInfo,
                NegotiationStrategy: o.NegotiationStrategy,
                VendorCategory:      o.VendorCategory,
                VendorCategoryDesc:  o.VendorCategoryDesc,
                Incoterm:            o.Incoterm,
                IncotermDesc:        o.IncotermDesc,
                TbdDate:             o.TbdDate ? new Date(o.TbdDate) : null,
                Plant:               o.Plant,
                PlantDesc:           o.PlantDesc,
                OtherTerms:          o.OtherTerms,
                Regularization:      o.Regularization,
                FinalSettlement:     o.FinalSettlement,
                ProjectTeamRecommendation: o.ProjectTeamRecommendation,
                RefPoNo:             o.RefPoNo || o.OldPO || "",
                RepeatOrder:         o.RepeatOrder || "",
                CreatedBy:           o.CreatedBy || "",
                DocCreated:          o.DocCreated || ""
              });
              oViewModel.setProperty("/nfaVersion", parseInt(o.Version) || null);
              var iPending = 4;
              var fnDone = function () { if (--iPending === 0) { sap.ui.core.BusyIndicator.hide(); } };
              // mark all VH fields as "selected from backend" so validation passes
              that._bCompanyCodeSelected  = !!o.CompanyCode;
              that._bPurchaseOrgSelected  = !!o.PurchaseOrg;
              that._bPurchaseGroupSelected = !!o.PurchaseGroup;
              that._bCurrencySelected      = !!o.Currency;
              that._bIncotermsSelected     = !!o.Incoterm;
              that._bPlantSelected         = !!o.Plant;
              that._loadVendorData(o.NfaRefNo, fnDone);
              that._loadVendorPR(o.NfaRefNo, fnDone);
              that._loadBuyerAttachments(o.NfaRefNo, fnDone);
              that._loadApprovalData(o.NfaRefNo, fnDone);
            } else {
              sap.ui.core.BusyIndicator.hide();
              MessageToast.show("No data found");
              that._initializeEmptyForm();
            }
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            MessageToast.show("Error loading NFA data");
            that._initializeEmptyForm();
          },
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

      _loadVendorPR: function (sNfaRefNo, fnDone) {
        var oODataModel = this.getOwnerComponent().getModel();
        var oViewModel = this.getView().getModel("viewModel");
        var that = this;

        oODataModel.read("/et_vendor_pr_item_detailsSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          forceServerDataRequest: true,
          success: function (oData) {
            var aPR = (oData.results || []).map(function (p, i) {
              return {
                slNo:                i + 1,
                vendorNo:            p.VendorNo,
                prNo:                p.PrNo,
                prItem:              p.PrItem,
                material:            p.Material,
                materialDescription: p.MaterialDescription,
                qty:                 p.Qty,
                uom:                 p.Uom,
                plant:               p.Plant,
                remainingQty:        p.RemainingQty,
                splitPoQty:          p.SplitPoQty,
                finalizedLinePrice:  p.FinilizedLinePrice,
                freight:             p.Freight,
                gstPercentage:       p.GstPercentage,
                gstAmount:           p.GstAmount,
                insurance:           p.Insurance
              };
            });
            oViewModel.setProperty("/vendorPR", aPR);
            that._updateCompanyCodeEditable();
            if (fnDone) { fnDone(); }
          },
          error: function () { MessageToast.show("Failed to load vendor PR details"); if (fnDone) { fnDone(); } }
        });
      },

      _loadAribaData: function (sDocNo) {
        var oODataModel = this.getOwnerComponent().getModel();
        var oViewModel = this.getView().getModel("viewModel");
        var that = this;

        sap.ui.core.BusyIndicator.show(0);

        var pNfa = new Promise(function (resolve, reject) {
          oODataModel.read("/et_nfa_detailsSet", {
            filters: [
              new Filter("AribaDocNo", FilterOperator.EQ, sDocNo),
              new Filter("Status", FilterOperator.EQ, "NEW")
            ],
            success: resolve,
            error: reject
          });
        });

        var pVendor = new Promise(function (resolve, reject) {
          oODataModel.read("/et_vendor_item_detailsSet", {
            filters: [new Filter("AribaDocNo", FilterOperator.EQ, sDocNo)],
            success: resolve,
            error: reject
          });
        });

        var pVendorPR = new Promise(function (resolve, reject) {
          oODataModel.read("/et_vendor_pr_item_detailsSet", {
            filters: [new Filter("AribaDocNo", FilterOperator.EQ, sDocNo)],
            success: resolve,
            error: reject
          });
        });

        Promise.all([pNfa, pVendor, pVendorPR]).then(function (aResults) {
          sap.ui.core.BusyIndicator.hide();
          var oNfaData = aResults[0];
          var oVendorData = aResults[1];
          var oVendorPRData = aResults[2];
          console.log("Ariba NFA Data:", oNfaData.results);
          console.log("Ariba Vendor Data:", oVendorData.results);
          console.log("Ariba Vendor PR Data:", oVendorPRData.results);

          if (!oNfaData.results || !oNfaData.results.length) {
            MessageToast.show("No data found for Ariba Doc: " + sDocNo);
            that._initializeEmptyForm();
            return;
          }

          var o = oNfaData.results[0];
          oViewModel.setProperty("/header", {
            NfaRefNo:            o.NfaRefNo,
            PoNo:                o.NfaRefNo,
            AribaDocNo:          o.AribaDocNo,
            NfaType:             o.NfaType,
            NfaTypeDesc:         o.NfaTypeDesc,
            NfaTitle:            o.NfaTitle,
            Status:              o.Status,
            StatusState:         that._getStatusState(o.Status),
            BiDate:              o.BiDate ? new Date(o.BiDate) : new Date(),
            PurchaseOrg:         o.PurchaseOrg,
            PurchaseOrgDesc:     o.PurchaseOrgDesc,
            PurchaseGroup:       o.PurchaseGroup,
            PurchaseGroupDesc:   o.PurchaseGroupDesc,
            CompanyCode:         o.CompanyCode,
            CompanyDescription:  o.CompanyDescription,
            PrBudget:            o.PrBudget,
            WbsBudget:           o.WbsBudget,
            Description:         o.LongText,
            BaselineSpend:       o.BaselineSpend,
            Currency:            o.Currency,
            CurrencyDesc:        o.CurrencyDesc,
            Remarks:             o.Remarks,
            LdClause:            o.LdClause,
            LdClauseAmt:         o.LdClauseAmt ? String(parseFloat(o.LdClauseAmt)) : "",
            AdvanceBg:           o.AdvanceBg,
            AdavanceBgAmt:       o.AdavanceBgAmt ? String(parseFloat(o.AdavanceBgAmt)) : "",
            PerformanceBg:       o.PerformanceBg,
            PerformanceBpAmt:    o.PerformanceBpAmt ? String(parseFloat(o.PerformanceBpAmt)) : "",
            Cpbg:                o.Cpbg,
            CpbgAmt:             o.CpbgAmt ? String(parseFloat(o.CpbgAmt)) : "",
            LowestBasis:         o.LowestBasis,
            TechAccepLowBasis:   o.TechAccepLowBasis,
            ProprietaryBasis:    o.ProprietaryBasis,
            SingleTenderBasis:   o.SingleTenderBasis,
            RepeatOrderBasis:    o.RepeatOrderBasis,
            RateContract:        o.RateContract,
            JustificationRemarks: o.JustificationRemarks,
            ScopeOfWork:         o.ScopeOfWork,
            AdditionalInfo:      o.AdditionalInfo,
            NegotiationStrategy: o.NegotiationStrategy,
            VendorCategory:      o.VendorCategory,
            VendorCategoryDesc:  o.VendorCategoryDesc,
            Incoterm:            o.Incoterm,
            IncotermDesc:        o.IncotermDesc,
            RefPoNo:             o.Old_PO,
            TbdDate:             o.TbdDate ? new Date(o.TbdDate) : null,
            Plant:               o.Plant,
            PlantDesc:           o.PlantDesc,
            OtherTerms:          o.OtherTerms,
            Regularization:      o.Regularization,
            FinalSettlement:     o.FinalSettlement,
            ProjectTeamRecommendation: o.ProjectTeamRecommendation,
            CreatedBy:           o.CreatedBy || ""
          });

          // Populate vendors from et_vendor_item_detailsSet using AribaDocNo
          // mark all VH fields as selected (loaded from Ariba backend)
          that._bCompanyCodeSelected  = !!o.CompanyCode;
          that._bPurchaseOrgSelected  = !!o.PurchaseOrg;
          that._bPurchaseGroupSelected = !!o.PurchaseGroup;
          that._bCurrencySelected      = !!o.Currency;
          that._bIncotermsSelected     = !!o.Incoterm;
          that._bPlantSelected         = !!o.Plant;
          var aVendors = (oVendorData.results || []).map(function (item, index) {
            return {
              slNo:                   index + 1,
              vendorNo:               item.VendorNo,
              vendorName:             item.VendorName,
              plant:                  item.Plant || "",
              initialPrice:           item.InitialPrice,
              negotiatedAmount:       item.NegotiatedPrice,
              totalPrice:             item.TotalPrice,
              negNetCost:             item.NegNetCost,
              lpp:                    item.Lpp,
              technicalAcceptability: item.Ta,
              technicalRating:        item.TechinicalRating,
              vendorQualification:    item.VendorQa,
              vendorQualificationScore: item.QualifScore,
              basicTotalAmt:          item.BasicTotalAmt,
              pfPercent:              item.PfPercent,
              pfAmount:               item.PfAmount,
              freight:                item.Freight,
              gstPercentage:          item.GstPercentage,
              gstAmount:              item.GstAmount,
              insurance:              item.Insurance,
              netLandedCost:          item.NetLandedCost,
              commercialRating:       item.CommercialRating,
              PaymentTerms:           item.PaymentTerms,
              paymentTermsDesc:       item.PaymentTermsDesc,
              poNo:                   item.PurchaseOrder,
              contractNo:             item.ContractNo,
              schedulingAgreementNo:  item.SchlAgreementNo,
              vendorIceFlag:          item.VendorIceFlag || "",
              fromBackend:            true
            };
          });
          oViewModel.setProperty("/vendors", aVendors);

          // Populate PR items from Ariba filter result (already fetched in Promise.all)
          var aPR = (oVendorPRData.results || []).map(function (p, i) {
            return {
              slNo:                i + 1,
              vendorNo:            p.VendorNo,
              prNo:                p.PrNo,
              prItem:              p.PrItem,
              material:            p.Material,
              materialDescription: p.MaterialDescription,
              qty:                 p.Qty,
              uom:                 p.Uom,
              plant:               p.Plant,
              remainingQty:        p.RemainingQty,
              splitPoQty:          p.SplitPoQty,
              finalizedLinePrice:  p.FinilizedLinePrice,
              freight:             p.Freight,
              gstPercentage:       p.GstPercentage,
              gstAmount:           p.GstAmount,
              insurance:           p.Insurance
            };
          });
          oViewModel.setProperty("/vendorPR", aPR);

          that._initBuyerDocs();
          if (o.NfaRefNo) {
            that._loadBuyerAttachments(o.NfaRefNo);
          }
        }).catch(function () {
          sap.ui.core.BusyIndicator.hide();
          MessageToast.show("Error loading Ariba data");
          that._initializeEmptyForm();
        });
      },

      _loadManualData: function () {
        var oODataModel = this.getOwnerComponent().getModel();
        var that = this;

        oODataModel.read("/et_nfa_detailsSet", {
          success: function (oData) {
            if (oData.results && oData.results.length) {
              var oHeader = oData.results[0];
              that
                .getView()
                .getModel("viewModel")
                .setProperty("/header", oHeader);
              that._loadVendorData(oHeader.NfaRefNo);
            } else {
              that._initializeEmptyForm();
            }
          },
          error: function () {
            that._initializeEmptyForm();
          },
        });
      },

      _initializeEmptyForm: function () {
        this.getView().getModel("viewModel").setProperty("/header", {
          NfaRefNo: "",
          PoNo: "",
          ContractNo: "",
          SchlAgreementNo: "",
          AribaDocNo: "",
          NfaType: "",
          SuggestedVendor: "",
          ProposedVendor: "",
          PurchaseOrg: "",
          PurchaseOrgDesc: "",
          PurchaseGroup: "",
          PurchaseGroupDesc: "",
          Remarks: "",
          BiDate: new Date(),
          Commodity: "",
          CompanyCode: "",
          CompanyDescription: "",
          PrBudget: "",
          WbsBudget: "",
          BaselineSpend: "",
          Currency: "",
          CurrencyDesc: "",
          Description: "",
          LdClause: "",
          AdvanceBg: "",
          AdavanceBgAmt: "",
          PerformanceBg: "",
          PerformanceBpAmt: "",
          Cpbg: "",
          CpbgAmt: "",
          LowestBasis: "",
          TechAccepLowBasis: "",
          ProprietaryBasis: "",
          SingleTenderBasis: "",
          RepeatOrderBasis: "",
          RateContract: "",
          JustificationRemarks: "",
          ScopeOfWork: "",
          AdditionalInfo: "",
          NegotiationStrategy: "",
          Incoterm: "",
          IncotermDesc: "",
          VendorCategory: "",
          VendorCategoryDesc: "",
          RefPoNo: "",
          TbdDate: null
        });
        this.getView().getModel("viewModel").setProperty("/vendors", []);
        this._initBuyerDocs();
      },

      _loadVendorData: function (sNfaRefNo, fnDone) {
        var oModel = this.getOwnerComponent().getModel();
        var oViewModel = this.getView().getModel("viewModel");

        oModel.read("/et_vendor_item_detailsSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          forceServerDataRequest: true,
          success: function (oData) {
            var aVendors = (oData.results || []).map(function (item, index) {
              return {
                slNo:                   index + 1,
                vendorNo:               item.VendorNo,
                vendorName:             item.VendorName,
                plant:                  item.Plant || "",
                initialPrice:           item.InitialPrice,
                negotiatedAmount:       item.NegotiatedPrice,
                totalPrice:             item.TotalPrice,
                negNetCost:             item.NegNetCost,
                lpp:                    item.Lpp,
                technicalAcceptability: item.Ta,
                technicalRating:        item.TechinicalRating,
                vendorQualification:    item.VendorQa,
                vendorQualificationScore: item.QualifScore,
                basicTotalAmt:          item.BasicTotalAmt,
                pfPercent:              item.PfPercent,
                pfAmount:               item.PfAmount,
                freight:                item.Freight,
                gstPercentage:          item.GstPercentage,
                gstAmount:              item.GstAmount,
                insurance:              item.Insurance,
                netLandedCost:          item.NetLandedCost,
                commercialRating:       item.CommercialRating,
                PaymentTerms:           item.PaymentTerms,
                paymentTermsDesc:       item.PaymentTermsDesc,
                poNo:                   item.PurchaseOrder,
                contractNo:             item.ContractNo,
                schedulingAgreementNo:  item.SchlAgreementNo,
                vendorIceFlag:          item.VendorIceFlag || "",
                LoadingComments:        item.LoadingComments || "",
                CommercialLoading:      item.CommercialLoading || "",
                fromBackend:            true
              };
            });
            oViewModel.setProperty("/vendors", aVendors);
            if (fnDone) { fnDone(); }
          },
          error: function () { if (fnDone) { fnDone(); } }
        });
      },


//      onAddVendor: function () {
//   var oModel = this.getView().getModel("viewModel");
//   var aVendors = oModel.getProperty("/vendors");

//   aVendors.push({
//     slNo: aVendors.length + 1,
//     vendorNo: "",
//     vendorName: "",
//     plant: "",
//     initialPrice: "",
//     negotiatedAmount: "",
//     lpp: "",
//     technicalAcceptability: "",
//     deliveryRemarks: "",
//     vendorQualification: "",
//     gstCredit: "",
//     PaymentTerms: "",
//     remark: "",
//   });

//   oModel.setProperty("/vendors", aVendors);
// }

onAddVendor: function () {
  var oModel = this.getView().getModel("viewModel");
  if (oModel.getProperty("/isDocEditMode")) { return; }
  var aVendors = oModel.getProperty("/vendors");
  aVendors.push({
    slNo: aVendors.length + 1,
    vendorNo: "",
    vendorName: "",
    plant: "",
    initialPrice: "",
    negotiatedAmount: "",
    lpp: "",
    technicalAcceptability: "No",
    deliveryRemarks: "",
    vendorQualification: "No",
    gstCredit: "",
    PaymentTerms: "",
    remark: "",
    vendorIceFlag: ""
  });
  oModel.setProperty("/vendors", aVendors);
  if (aVendors.length === 1) {
    oModel.setProperty("/header/SuggestedVendor", aVendors[0].vendorNo);
    oModel.setProperty("/header/SuggestedVendorDesc", aVendors[0].vendorName);
  }
  this._updateCompanyCodeEditable();
  this._bIsDirty = true;
}
,


      onDeleteVendor: function () {
        var oModel = this.getView().getModel("viewModel");
        if (oModel.getProperty("/isDocEditMode")) { return; }
        var oTable = this.byId("vendorTable");
        var aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          MessageToast.show("Please select a row to delete.");
          return;
        }

        var aVendors = oModel.getProperty("/vendors");

        // Block deletion of backend vendors
        var aBackendRows = aSelectedIndices.filter(function (iIndex) {
          return aVendors[iIndex] && aVendors[iIndex].fromBackend;
        });
        if (aBackendRows.length) {
          MessageBox.warning("Vendors loaded from the system cannot be deleted.");
          return;
        }

        // Remove in reverse order to keep indices stable
        aSelectedIndices.slice().reverse().forEach(function (iIndex) {
          aVendors.splice(iIndex, 1);
        });

        aVendors.forEach(function (item, index) {
          item.slNo = index + 1;
        });

        oModel.setProperty("/vendors", aVendors);
        oTable.clearSelection();
        this._updateCompanyCodeEditable();
        MessageToast.show("Row deleted successfully.");
      },

      _calculateGrandTotal: function () {
        var oModel = this.getView().getModel("viewModel");
        if (!oModel) return;

        var aVendors = oModel.getProperty("/vendors") || [];
        var iTotal = aVendors.reduce(function (sum, row) {
          return sum + Number(row.negotiatedAmount || 0);
        }, 0);

        oModel.setProperty("/header/PrBudget", iTotal);
      },

      onValueChange: function () {
        this._calculateGrandTotal();
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

      onDirtyChange: function () {
        this._bIsDirty = true;
      },

      onBack: function () {
        if (this._bDialogOpen) { return; }
        if (!this._bIsDirty) {
          this.getOwnerComponent().getRouter().navTo("RoutenfaCreator", {}, true);
          return;
        }
        this._showDirtyConfirmDialog();
      },

      _loadApprovalData: function (sNfaRefNo, fnDone) {
        var oModel = this.getOwnerComponent().getModel();
        var oViewModel = this.getView().getModel("viewModel");

        oModel.read("/et_approval_dataSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          success: function (oData) {
            var oVersionMap = {};
            var aVersionOrder = [];
            var aRows = (oData.results || []).map(function (o) {
              var sStatus = o.ApprovedRejectInfo === "A" ? "Approved"
                          : o.ApprovedRejectInfo === "R" ? "Rejected"
                          : "Pending";
              var sState  = o.ApprovedRejectInfo === "A" ? "Success"
                          : o.ApprovedRejectInfo === "R" ? "Error"
                          : "Warning";
              var sRaw = o.StatusUpdatedOn || "";
              var sFormatted = sRaw.length === 8
                ? sRaw.substring(6, 8) + "-" + sRaw.substring(4, 6) + "-" + sRaw.substring(0, 4)
                : sRaw;
              return {
                Sno:              o.Sno,
                SapId:            o.SapId,
                SapName:          o.SapName,
                ApproverMailId:   o.ApproverMailId,
                ApprovedRejectInfo: o.ApprovedRejectInfo,
                StatusUpdatedOn:  sFormatted,
                RejectionRemarks: o.RejectionRemarks,
                statusText:       sStatus,
                statusState:      sState,
                Phase:            String(o.Phase || "1"),
                Version:          o.Version || "1"
              };
            });

            // Group by Version → Phase
            aRows.forEach(function (oRow) {
              var sVersion = oRow.Version;
              var sPhase   = oRow.Phase;
              if (!oVersionMap[sVersion]) {
                oVersionMap[sVersion] = { phaseMap: {}, phaseOrder: [] };
                aVersionOrder.push(sVersion);
              }
              var oVer = oVersionMap[sVersion];
              if (!oVer.phaseMap[sPhase]) {
                oVer.phaseMap[sPhase] = [];
                oVer.phaseOrder.push(sPhase);
              }
              oVer.phaseMap[sPhase].push(oRow);
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

            oViewModel.setProperty("/approvalData", aRows);
            oViewModel.setProperty("/approvalVersions", aVersions);
            if (fnDone) { fnDone(); }
          },
          error: function () {
            oViewModel.setProperty("/approvalData", []);
            oViewModel.setProperty("/approvalVersions", []);
            if (fnDone) { fnDone(); }
          }
        });
      },

      onRefreshApprovalStatus: function () {
        var sNfaRefNo = this.getView().getModel("viewModel").getProperty("/header/NfaRefNo");
        if (sNfaRefNo) {
          this._loadApprovalData(sNfaRefNo);
        }
      },

      // onQCSPress: function () {
      //   this.getOwnerComponent().getRouter().navTo("RouteQCS");
      // }
      onQCSPress: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var sNfaRefNo = oViewModel.getProperty("/header/NfaRefNo") || "";
            var aVendors = oViewModel.getProperty("/vendors") || [];
            var bApproved = oViewModel.getProperty("/isApprovedMode") || false;

            if (!sNfaRefNo) {
              MessageBox.warning("Please save the NFA draft first to generate an NFA Reference Number before proceeding to QCS.");
              return;
            }

            if (!this._validateRepeatOrderPrevPoNo(true)) {
              return;
            }

            if (!aVendors.length) {
              MessageBox.warning("Please add at least one vendor before proceeding to QCS.");
              return;
            }

            var bIsNewNfa = oViewModel.getProperty("/isAribaMode") ||
                            oViewModel.getProperty("/pageTitle") === "NFA Create Page";

            var sStatus = oViewModel.getProperty("/header/Status") || "";
            this.getOwnerComponent().getRouter().navTo("RouteQCS", {
              mode: bApproved ? "approved" : "edit",
              nfaRefNo: sNfaRefNo,
              "?query": { newNfa: bIsNewNfa ? "true" : "false", aribaDocNo: oViewModel.getProperty("/header/AribaDocNo") || "", docEdit: oViewModel.getProperty("/isDocEditMode") ? "true" : "false", status: sStatus }
            });
          }
      ,

      _predefinedBuyerDocs: [
        "Purchase MOM",
        "Signed QCS",
        "TBA",
        "SCC/SPC/PTC",
        "GCC/GPC/GTC",
        "Commercial Offer",
        "Details Documents"
      ],

      _initBuyerDocs: function () {
        var aItems = this._predefinedBuyerDocs.map(function (sName, i) {
          return {
            slNo: i + 1,
            BuyerDocName: sName,
            BuyerFileName: "",
            Check_box: "",
            BuyerSpl: "",
            mimeType: "",
            base64: null,
            isPredefined: true,
            status: "New",
            statusState: "None"
          };
        });
        this.getView().getModel("buyerDocs").setProperty("/items", aItems);
        this._buyerRowFiles = {};
      },

      onAddBuyerAttachmentRow: function () {
        var oBuyerModel = this.getView().getModel("buyerDocs");
        var aItems = oBuyerModel.getProperty("/items") || [];
        aItems.push({
          slNo: aItems.length + 1,
          BuyerDocName: "",
          BuyerFileName: "",
          Check_box: "",
          BuyerSpl: "",
          mimeType: "",
          base64: null,
          isPredefined: false,
          status: "New",
          statusState: "None"
        });
        oBuyerModel.setProperty("/items", aItems);
        this._buyerRowFiles = this._buyerRowFiles || {};
      },

      onBuyerCheckboxSelect: function (oEvent) {
        var bSelected = oEvent.getParameter("selected");
        var oCtx = oEvent.getSource().getBindingContext("buyerDocs");
        var iIdx = parseInt(oCtx.getPath().split("/").pop());
        var oBuyerModel = this.getView().getModel("buyerDocs");
        oBuyerModel.setProperty("/items/" + iIdx + "/Check_box", bSelected ? "X" : "");
        // Mark as Modified if already uploaded so it gets re-posted
        if (oBuyerModel.getProperty("/items/" + iIdx + "/status") === "Uploaded") {
          oBuyerModel.setProperty("/items/" + iIdx + "/status", "Modified");
          oBuyerModel.setProperty("/items/" + iIdx + "/statusState", "Warning");
        }
      },

      onBuyerSplChange: function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext("buyerDocs");
        var iIdx = parseInt(oCtx.getPath().split("/").pop());
        var oRow = oCtx.getObject();
        // Only react to already-uploaded rows
        if (oRow.status !== "Uploaded") { return; }
        var sOriginal = (this._originalSpl || {})[iIdx];
        var sNew = oEvent.getParameter("value");
        var oBuyerModel = this.getView().getModel("buyerDocs");
        if (sNew !== sOriginal) {
          oBuyerModel.setProperty("/items/" + iIdx + "/status", "Modified");
          oBuyerModel.setProperty("/items/" + iIdx + "/statusState", "Warning");
        } else {
          oBuyerModel.setProperty("/items/" + iIdx + "/status", "Uploaded");
          oBuyerModel.setProperty("/items/" + iIdx + "/statusState", "Success");
        }
      },

      onBuyerRowFileChange: function (oEvent) {
        var oFile = oEvent.getParameter("files")[0];
        if (!oFile) { return; }
        var oUploader = oEvent.getSource();
        var oCtx = oUploader.getBindingContext("buyerDocs");
        var iIdx = parseInt(oCtx.getPath().split("/").pop());
        var oBuyerModel = this.getView().getModel("buyerDocs");
        oBuyerModel.setProperty("/items/" + iIdx + "/BuyerFileName", oFile.name);
        oBuyerModel.setProperty("/items/" + iIdx + "/mimeType", oFile.type || "application/octet-stream");
        // If row was already uploaded, mark as Modified so it gets re-posted on next save
        var sStatus = oBuyerModel.getProperty("/items/" + iIdx + "/status");
        if (sStatus === "Uploaded") {
          oBuyerModel.setProperty("/items/" + iIdx + "/status", "Modified");
          oBuyerModel.setProperty("/items/" + iIdx + "/statusState", "Warning");
        }
        this._buyerRowFiles = this._buyerRowFiles || {};
        this._buyerRowFiles[iIdx] = oFile;
      },

      onDeleteBuyerAttachmentRow: function (oEvent) {
        var oBuyerModel = this.getView().getModel("buyerDocs");
        var iIdx = parseInt(oEvent.getSource().getBindingContext("buyerDocs").getPath().split("/").pop());
        var aItems = oBuyerModel.getProperty("/items");
        // clean up stored file reference
        if (this._buyerRowFiles) { delete this._buyerRowFiles[iIdx]; }
        aItems.splice(iIdx, 1);
        aItems.forEach(function (o, i) { o.slNo = i + 1; });
        oBuyerModel.setProperty("/items", aItems);
        // re-key stored files
        var oNewFiles = {};
        Object.keys(this._buyerRowFiles || {}).forEach(function (k) {
          var iOld = parseInt(k);
          if (iOld > iIdx) { oNewFiles[iOld - 1] = this._buyerRowFiles[k]; }
          else if (iOld < iIdx) { oNewFiles[iOld] = this._buyerRowFiles[k]; }
        }.bind(this));
        this._buyerRowFiles = oNewFiles;
      },

      onUploadAllBuyerAttachments: function () {
        var oViewModel = this.getView().getModel("viewModel");
        var sNfaRefNo = oViewModel.getProperty("/header/NfaRefNo");
        if (!sNfaRefNo) { sap.m.MessageBox.warning("Please save the NFA draft first."); return; }

        var oBuyerModel = this.getView().getModel("buyerDocs");
        var aItems = oBuyerModel.getProperty("/items") || [];

        // Validate: every pending row must have a file OR a SharePoint link
        var aInvalid = aItems.filter(function (o, i) {
          return o.status !== "Uploaded" && !(this._buyerRowFiles || {})[i] && !o.BuyerSpl;
        }.bind(this));
        if (aInvalid.length) {
          sap.m.MessageBox.error(
            "Each line item must have a file or a SharePoint link before uploading.\n" +
            "Missing on row(s): " + aInvalid.map(function (o) { return o.slNo; }).join(", ")
          );
          return;
        }

        // Include new rows (status !== Uploaded) with file/link, AND modified uploaded rows
        var aNew = aItems.filter(function (o, i) {
          var bPending = o.status !== "Uploaded" && o.status !== "Modified" && ((this._buyerRowFiles || {})[i] || o.BuyerSpl);
          var bModified = o.status === "Modified";
          return bPending || bModified;
        }.bind(this));

        if (!aNew.length) { sap.m.MessageToast.show("No new items to upload."); return; }

        var oODataModel = this.getOwnerComponent().getModel();
        var that = this;

        // Separate rows with files (need FileReader) from link-only / modified-link rows
        var aFileRows = aNew.filter(function (o) { return (that._buyerRowFiles || {})[aItems.indexOf(o)]; });
        var aLinkOnlyRows = aNew.filter(function (o) { return !(that._buyerRowFiles || {})[aItems.indexOf(o)]; });

        var aReaders = aFileRows.map(function (oRow) {
          var iIdx = aItems.indexOf(oRow);
          return new Promise(function (resolve, reject) {
            var oReader = new FileReader();
            oReader.onload = function (e) { resolve({ idx: iIdx, row: oRow, base64: e.target.result.split(",")[1] }); };
            oReader.onerror = reject;
            oReader.readAsDataURL(that._buyerRowFiles[iIdx]);
          });
        });

        Promise.all(aReaders).then(function (aFileResults) {
          var aLinkResults = aLinkOnlyRows.map(function (oRow) {
            return { idx: aItems.indexOf(oRow), row: oRow, base64: "" };
          });
          var aAllResults = aFileResults.concat(aLinkResults);

          var aBuyItems = aAllResults.map(function (r) {
            // BuyerFileName is part of the entity key — must not be empty
            // For link-only rows use BuyerDocName as fallback
            var sFileName = r.row.BuyerFileName || r.row.BuyerDocName || ("DOC_" + r.idx);
            return {
              NfaRefNo: sNfaRefNo,
              BuyerFileName: sFileName,
              Check_box: r.row.Check_box || "",
              BuyerDocName: r.row.BuyerDocName || "",
              BuyerDocMime: that._getMimeTypeShort(r.row.mimeType || ""),
              BuyerFileData: r.base64 || "",
              BuyerSpl: r.row.BuyerSpl || ""
            };
          });

          oODataModel.create("/et_attachHeadSet", { NfaRefNo: sNfaRefNo, ATTACH_BUY: { results: aBuyItems } }, {
            success: function () {
              aAllResults.forEach(function (r) {
                oBuyerModel.setProperty("/items/" + r.idx + "/status", "Uploaded");
                oBuyerModel.setProperty("/items/" + r.idx + "/statusState", "Success");
                if (that._buyerRowFiles) { delete that._buyerRowFiles[r.idx]; }
                // Update the stored original so re-editing detects changes correctly
                if (that._originalSpl) { that._originalSpl[r.idx] = r.row.BuyerSpl || ""; }
              });
              sap.m.MessageBox.success(aBuyItems.length + " item(s) uploaded successfully.");
            },
            error: function (oError) {
              var sMsg = "Upload failed";
              try { sMsg += ": " + JSON.parse(oError.responseText).error.message.value; } catch (e) {}
              sap.m.MessageBox.error(sMsg);
            }
          });
        }).catch(function () {
          sap.m.MessageBox.error("Error reading files.");
        });
      },

      onFetchBuyerFiles: function () {
        var sNfaRefNo = this.getView().getModel("viewModel").getProperty("/header/NfaRefNo");
        if (!sNfaRefNo) {
          MessageBox.warning("No NFA Reference Number available.");
          return;
        }
        this._loadBuyerAttachments(sNfaRefNo);
      },

      _loadBuyerAttachments: function (sNfaRefNo, fnDone) {
        var oODataModel = this.getOwnerComponent().getModel();
        var oBuyerModel = this.getView().getModel("buyerDocs");
        var that = this;

        oODataModel.read("/et_attachment_buyerSet", {
          filters: [new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo)],
          success: function (oData) {
            var aResults = oData.results || [];
            if (!aResults.length) {
              // nothing uploaded yet — keep predefined rows as-is
              if (fnDone) { fnDone(); }
              return;
            }
            // start fresh with predefined rows, then merge uploaded records
            that._initBuyerDocs();
            that._originalSpl = {};
            var aItems = oBuyerModel.getProperty("/items");
            aResults.forEach(function (o) {
              // try to match an existing predefined row by BuyerDocName
              var oMatch = aItems.filter(function (r) { return r.BuyerDocName === o.BuyerDocName; })[0];
              if (oMatch) {
                oMatch.BuyerFileName = o.BuyerFileName || "";
                oMatch.Check_box    = o.Check_box || "";
                oMatch.BuyerSpl     = o.BuyerSpl || "";
                oMatch.mimeType     = o.BuyerDocMime || "";
                oMatch.base64       = o.BuyerFileData || null;
                oMatch.status       = "Uploaded";
                oMatch.statusState  = "Success";
                that._originalSpl[aItems.indexOf(oMatch)] = o.BuyerSpl || "";
              } else {
                // custom row added by user — append it
                var iNewIdx = aItems.length;
                aItems.push({
                  slNo:         iNewIdx + 1,
                  BuyerDocName: o.BuyerDocName || "",
                  BuyerFileName: o.BuyerFileName || "",
                  Check_box:    o.Check_box || "",
                  BuyerSpl:     o.BuyerSpl || "",
                  mimeType:     o.BuyerDocMime || "",
                  base64:       o.BuyerFileData || null,
                  isPredefined: false,
                  status:       "Uploaded",
                  statusState:  "Success"
                });
                that._originalSpl[iNewIdx] = o.BuyerSpl || "";
              }
            });
            oBuyerModel.setData({ items: aItems });
            if (fnDone) { fnDone(); }
          },
          error: function () { MessageToast.show("Failed to fetch buyer attachments."); if (fnDone) { fnDone(); } }
        });
      },

      onOpenBuyerFile: function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext("buyerDocs");
        var oData = oCtx.getObject();
        if (!oData.base64) {
          sap.m.MessageToast.show("File content not available. Fetch attachments first.");
          return;
        }
        this._openBase64InTab(oData.base64, oData.mimeType || "application/octet-stream", oData.BuyerFileName);
      },

      onPreviewBuyerFile: function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext("buyerDocs");
        var oData = oCtx.getObject();
        var sMime = oData.mimeType || "application/octet-stream";
        if (!oData.base64 && oData.content) {
          var oReader = new FileReader();
          oReader.onload = function (e) {
            this._openBase64InTab(e.target.result.split(",")[1], sMime, oData.fileName);
          }.bind(this);
          oReader.readAsDataURL(oData.content);
          return;
        }
        if (!oData.base64) {
          // no content yet — trigger download via the toolbar button instead
          MessageToast.show("File not yet uploaded. Use 'Upload All' first, then fetch to preview.");
          return;
        }
        this._openBase64InTab(oData.base64, sMime, oData.fileName);
      },

      _openBase64InTab: function (sBase64, sMime, sFileName) {
        try {
          sMime = this._getMimeTypeFull(sMime);
          var sBinary = atob(sBase64);
          var aBytes = new Uint8Array(sBinary.length);
          for (var i = 0; i < sBinary.length; i++) { aBytes[i] = sBinary.charCodeAt(i); }
          var oBlob = new Blob([aBytes], { type: sMime });
          var sUrl = URL.createObjectURL(oBlob);

          var bIsImage = sMime.indexOf("image/") === 0;
          var oContent;

          if (bIsImage) {
            oContent = new sap.m.Image({ src: sUrl, width: "100%", densityAware: false });
          } else {
            oContent = new sap.ui.core.HTML({
              content: "<iframe src='" + sUrl + "' style='width:100%;height:100%;border:none;'></iframe>"
            });
          }

          var oDialog = new sap.m.Dialog({
            title: sFileName,
            contentWidth: "80vw",
            contentHeight: "80vh",
            horizontalScrolling: false,
            verticalScrolling: bIsImage,
            content: [oContent],
            endButton: new sap.m.Button({
              text: "Close",
              press: function () {
                oDialog.close();
              }
            }),
            afterClose: function () {
              URL.revokeObjectURL(sUrl);
              oDialog.destroy();
            }
          });

          this.getView().addDependent(oDialog);
          oDialog.open();
        } catch (e) {
          MessageToast.show("Could not preview file: " + e.message);
        }
      },

      onRemoveBuyerFiles: function () {
        var oTable = this.byId("buyerTable");
        var aIndices = oTable.getSelectedIndices();
        if (!aIndices.length) {
          MessageToast.show("Select at least one file to remove.");
          return;
        }
        var oModel = this.getView().getModel("buyerDocs");
        var aItems = oModel.getProperty("/items");
        // remove in reverse so indices stay valid
        aIndices.slice().sort(function(a,b){return b-a;}).forEach(function (i) { aItems.splice(i, 1); });
        // re-number Sno
        aItems.forEach(function (o, i) { o.Sno = String(i + 1).padStart(3, "0"); });
        oModel.setProperty("/items", aItems);
        oTable.clearSelection();
      },

      onRemoveSupplierFiles: function () {
        this._removeFiles("supplierTable", "supplierDocs");
      },

      _removeFiles: function (sTableId, sModelName) {
        var oTable = this.byId(sTableId);
        var aSelected = oTable.getSelectedItems();
        if (!aSelected.length) {
          MessageToast.show("Select file to remove.");
          return;
        }
        var oModel = this.getView().getModel(sModelName);
        var aItems = oModel.getProperty("/items");
        aSelected.reverse().forEach(function (oItem) {
          var iIndex = oTable.indexOfItem(oItem);
          aItems.splice(iIndex, 1);
        });
        oModel.setProperty("/items", aItems);
        oTable.removeSelections(true);
      },

      onDownloadBuyerFiles: function () {
        var oTable = this.byId("buyerTable");
        var aIndices = oTable.getSelectedIndices();
        if (!aIndices.length) {
          MessageToast.show("Select a file to download.");
          return;
        }
        var oModel = this.getView().getModel("buyerDocs");
        var that = this;
        aIndices.forEach(function (i) {
          var oData = oModel.getProperty("/items/" + i);
          that._downloadFileItem(oData);
        });
      },

      onDownloadSupplierFiles: function () {
        this._downloadFiles("supplierTable", "supplierDocs");
      },

      _downloadFiles: function (sTableId, sModelName) {
        var oTable = this.byId(sTableId);
        var aSelected = oTable.getSelectedItems();
        if (!aSelected.length) {
          MessageToast.show("Select file to download.");
          return;
        }
        var that = this;
        aSelected.forEach(function (oItem) {
          var oData = oItem.getBindingContext(sModelName).getObject();
          that._downloadFileItem(oData);
        });
      },

      _downloadFileItem: function (oData) {
        var oBlob, sUrl;
        var sMime = this._getMimeTypeFull(oData.mimeType || "application/octet-stream");
        if (oData.base64) {
          var sBinary = atob(oData.base64);
          var aBytes = new Uint8Array(sBinary.length);
          for (var i = 0; i < sBinary.length; i++) { aBytes[i] = sBinary.charCodeAt(i); }
          oBlob = new Blob([aBytes], { type: sMime });
        } else if (oData.content) {
          oBlob = new Blob([oData.content], { type: sMime });
        } else {
          MessageToast.show("File content not available for: " + oData.fileName);
          return;
        }
        sUrl = URL.createObjectURL(oBlob);
        var oLink = document.createElement("a");
        oLink.href = sUrl;
        oLink.download = oData.fileName;
        oLink.click();
        URL.revokeObjectURL(sUrl);
      },

      onCheckboxSelect: function (oEvent) {
        var sText = oEvent.getSource().getText();
        var bSelected = oEvent.getParameter("selected");
        var oModel = this.getView().getModel("viewModel");
        var mMap = {
          "Lowest Basis": "LowestBasis",
          "Technically acceptable lowest basis": "TechAccepLowBasis",
          "Proprietory basis": "ProprietaryBasis",
          "Single Vendor basis": "SingleTenderBasis",
          "Repeat order basis": "RepeatOrderBasis",
          "Rate Contract": "RateContract",
          "Regularization": "Regularization",
          "Final Settlement": "FinalSettlement",
          "Project team Recommendation basis": "ProjectTeamRecommendation",
        };
        var sProperty = mMap[sText];
        if (sProperty) {
          oModel.setProperty("/header/" + sProperty, bSelected ? "X" : "");
        }
        this._bIsDirty = true;
      },

      // Company Code F4
      // onCompanyCodeVH: function () {
      //   this._openSearchHelp(
      //     "COMPANY_CODE",
      //     "Company Code",
      //     "KeyDataType",
      //     "Description",
      //     "/header/CompanyCode",
      //     "companyCodeInput"
      //   );
      // }
      // Company Code F4
      onCompanyCodeVH: function () {
        var that = this;

        if (!this._oCompanyCodeDialog) {
          this._oCompanyCodeDialog = new sap.m.SelectDialog({
            title: "Select Company Code",
            noDataText: "No data found",
            search: function (oEvent) {
              var sValue = oEvent.getParameter("value").toLowerCase();
              var aFiltered = (that._aCompanyCodeItems || []).filter(function (o) {
                return !sValue || o.Description.toLowerCase().indexOf(sValue) !== -1 || o.KeyDataType.toLowerCase().indexOf(sValue) !== -1;
              });
              that._oCompanyCodeDialog.getModel("ccLocal").setProperty("/items", aFiltered);
            },
            confirm: function (oEvent) {
              var oItem = oEvent.getParameter("selectedItem");
              var oData = oItem.getBindingContext("ccLocal").getObject();
              var oVM = that.getView().getModel("viewModel");
              oVM.setProperty("/header/CompanyCode", oData.KeyDataType);
              oVM.setProperty("/header/CompanyDescription", oData.Description);
              oVM.setProperty("/header/PurchaseOrg", "");
              oVM.setProperty("/header/PurchaseOrgDesc", "");
              that._bPurchaseOrgSelected = false;
              that._aPurchaseOrgItems = null;
              that.byId("companyCodeInput").setValueState("None");
              that.byId("purchaseOrgInput").setValueState("None");
              that._bCompanyCodeSelected = true;
              that._bIsDirty = true;
            }
          });

          var oLocalModel = new sap.ui.model.json.JSONModel({ items: [] });
          this._oCompanyCodeDialog.setModel(oLocalModel, "ccLocal");
          this._oCompanyCodeDialog.bindAggregation("items", {
            path: "ccLocal>/items",
            template: new sap.m.StandardListItem({
              title: "{ccLocal>Description}",
              description: "{ccLocal>KeyDataType}"
            })
          });
          this.getView().addDependent(this._oCompanyCodeDialog);
        }

        // Fetch fresh data each time and populate local model
        var oODataModel = this.getOwnerComponent().getModel();
        sap.ui.core.BusyIndicator.show(0);
        oODataModel.read("/et_nfa_search_helpSet", {
          filters: [new Filter("Type", FilterOperator.EQ, "COMPANY_CODE")],
          success: function (oData) {
            var aItems = (oData.results || []).filter(function (o) { return o.Type === "COMPANY_CODE"; });
            that._aCompanyCodeItems = aItems;
            that._oCompanyCodeDialog.getModel("ccLocal").setProperty("/items", aItems);
            sap.ui.core.BusyIndicator.hide();
            that._oCompanyCodeDialog.open("");
          },
          error: function () { sap.ui.core.BusyIndicator.hide(); }
        });
      }
      ,

      // NFA Type F4
onNfaTypeVH: function () {
  var oModel = this.getOwnerComponent().getModel();
  var that = this;

  if (!this._oNfaTypeDialog) {
    this._oNfaTypeDialog = new sap.m.SelectDialog({
      title: "Select NFA Type",
      noDataText: "No data found",
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var aFilters = [new Filter("Type", FilterOperator.EQ, "NFA_TYPE")];
        if (sValue) {
          aFilters.push(new Filter("Description", FilterOperator.Contains, sValue));
        }
        oEvent.getSource().getBinding("items").filter(aFilters);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oContext = oItem.getBindingContext();
        var oData = oContext.getObject();
        
        that.getView().getModel("viewModel").setProperty("/header/NfaType", oData.KeyDataType);
        that.getView().getModel("viewModel").setProperty("/header/NfaTypeDesc", oData.Description);
        that.getView().getModel("viewModel").setProperty("/header/NfaTitle", oData.Description);
        that.byId("nfaTypeInput").setValueState("None");
      }
    });
    this.getView().addDependent(this._oNfaTypeDialog);
  }

  this._oNfaTypeDialog.bindAggregation("items", {
    path: "/et_nfa_search_helpSet",
    filters: [new Filter("Type", FilterOperator.EQ, "NFA_TYPE")],
    template: new sap.m.StandardListItem({
      title: "{Description}",
      description: "{KeyDataType}"
    })
  });

  this._oNfaTypeDialog.setModel(oModel);
  this._oNfaTypeDialog.open();
},

    onIncotermsVH: function () {
      var that = this;
      if (!this._oIncotermsDialog) {
        this._oIncotermsDialog = new sap.m.SelectDialog({
          title: "Select Incoterms",
          noDataText: "No data found",
          search: function (oEvent) {
            var sValue = oEvent.getParameter("value").toLowerCase();
            var aFiltered = (that._aIncotermsItems || []).filter(function (o) {
              return !sValue || o.Description.toLowerCase().indexOf(sValue) !== -1 || o.KeyDataType.toLowerCase().indexOf(sValue) !== -1;
            });
            that._oIncotermsDialog.getModel("incoLocal").setProperty("/items", aFiltered);
          },
          confirm: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            var oData = oItem.getBindingContext("incoLocal").getObject();
            that.getView().getModel("viewModel").setProperty("/header/Incoterm", oData.KeyDataType);
            that.getView().getModel("viewModel").setProperty("/header/IncotermDesc", oData.Description);
            that.byId("incotermsInput").setValueState("None");
            that._bIncotermsSelected = true;
            that._bIsDirty = true;
          }
        });
        this._oIncotermsDialog.setModel(new sap.ui.model.json.JSONModel({ items: [] }), "incoLocal");
        this._oIncotermsDialog.bindAggregation("items", {
          path: "incoLocal>/items",
          template: new sap.m.StandardListItem({ title: "{incoLocal>Description}", description: "{incoLocal>KeyDataType}" })
        });
        this.getView().addDependent(this._oIncotermsDialog);
      }
      sap.ui.core.BusyIndicator.show(0);
      this.getOwnerComponent().getModel().read("/et_nfa_search_helpSet", {
        filters: [new Filter("Type", FilterOperator.EQ, "INCOTERMS")],
        success: function (oData) {
          var aItems = (oData.results || []).filter(function (o) { return o.Type === "INCOTERMS"; });
          that._aIncotermsItems = aItems;
          that._oIncotermsDialog.getModel("incoLocal").setProperty("/items", aItems);
          sap.ui.core.BusyIndicator.hide();
          that._oIncotermsDialog.open("");
        },
        error: function () { sap.ui.core.BusyIndicator.hide(); }
      });
    },

    onVendorCategoryVH: function () {
  var that = this;
  if (!this._oVendorCategoryDialog) {
    this._oVendorCategoryDialog = new sap.m.SelectDialog({
      title: "Select Vendor Category",
      noDataText: "No data found",
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value").toLowerCase();
        var aFiltered = (that._aVendorCategoryItems || []).filter(function (o) {
          return !sValue || o.Description.toLowerCase().indexOf(sValue) !== -1 || o.KeyDataType.toLowerCase().indexOf(sValue) !== -1;
        });
        that._oVendorCategoryDialog.getModel("vcLocal").setProperty("/items", aFiltered);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oData = oItem.getBindingContext("vcLocal").getObject();
        that.getView().getModel("viewModel").setProperty("/header/VendorCategory", oData.KeyDataType);
        that.getView().getModel("viewModel").setProperty("/header/VendorCategoryDesc", oData.Description);
      }
    });
    this._oVendorCategoryDialog.setModel(new sap.ui.model.json.JSONModel({ items: [] }), "vcLocal");
    this._oVendorCategoryDialog.bindAggregation("items", {
      path: "vcLocal>/items",
      template: new sap.m.StandardListItem({ title: "{vcLocal>Description}", description: "{vcLocal>KeyDataType}" })
    });
    this.getView().addDependent(this._oVendorCategoryDialog);
  }
  sap.ui.core.BusyIndicator.show(0);
  this.getOwnerComponent().getModel().read("/et_nfa_search_helpSet", {
    filters: [new Filter("Type", FilterOperator.EQ, "VENDOR_CATEGORY")],
    success: function (oData) {
      var aItems = (oData.results || []).filter(function (o) { return o.Type === "VENDOR_CATEGORY"; });
      that._aVendorCategoryItems = aItems;
      that._oVendorCategoryDialog.getModel("vcLocal").setProperty("/items", aItems);
      sap.ui.core.BusyIndicator.hide();
      that._oVendorCategoryDialog.open();
    },
    error: function () { sap.ui.core.BusyIndicator.hide(); }
  });
},
onCurrencyVH: function () {
  var that = this;
  if (!this._oCurrencyDialog) {
    this._oCurrencyDialog = new sap.m.SelectDialog({
      title: "Select Currency",
      noDataText: "No data found",
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value").toLowerCase();
        var aFiltered = (that._aCurrencyItems || []).filter(function (o) {
          return !sValue || o.Description.toLowerCase().indexOf(sValue) !== -1 || o.KeyDataType.toLowerCase().indexOf(sValue) !== -1;
        });
        that._oCurrencyDialog.getModel("ccyLocal").setProperty("/items", aFiltered);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oData = oItem.getBindingContext("ccyLocal").getObject();
        that.getView().getModel("viewModel").setProperty("/header/Currency", oData.KeyDataType);
        that.getView().getModel("viewModel").setProperty("/header/CurrencyDesc", oData.Description);
        that.byId("currencyInput").setValueState("None");
        that._bCurrencySelected = true;
        that._bIsDirty = true;
      }
    });
    this._oCurrencyDialog.setModel(new sap.ui.model.json.JSONModel({ items: [] }), "ccyLocal");
    this._oCurrencyDialog.bindAggregation("items", {
      path: "ccyLocal>/items",
      template: new sap.m.StandardListItem({ title: "{ccyLocal>Description}", description: "{ccyLocal>KeyDataType}" })
    });
    this.getView().addDependent(this._oCurrencyDialog);
  }
  sap.ui.core.BusyIndicator.show(0);
  this.getOwnerComponent().getModel().read("/et_nfa_search_helpSet", {
    filters: [new Filter("Type", FilterOperator.EQ, "CURRENCY")],
    success: function (oData) {
      var aItems = (oData.results || []).filter(function (o) { return o.Type === "CURRENCY"; });
      that._aCurrencyItems = aItems;
      that._oCurrencyDialog.getModel("ccyLocal").setProperty("/items", aItems);
      sap.ui.core.BusyIndicator.hide();
      that._oCurrencyDialog.open();
    },
    error: function () { sap.ui.core.BusyIndicator.hide(); }
  });
},

      // onNfaTypeVH: function () {
      //   this._openSearchHelp(
      //     "NFA_TYPE",
      //     "NFA Type",
      //     "KeyDataType",
      //     "Description",
      //     "/header/NfaType",
      //     "nfaTypeInput"
      //   );
      // }

      // Vendor VH — direct SelectDialog filtered by CompanyCode
      onVendorVH: function (oEvent) {
  var oViewModel = this.getView().getModel("viewModel");
  var sCompanyCode = oViewModel.getProperty("/header/CompanyCode");
  if (!sCompanyCode || sCompanyCode.trim() === "") {
    MessageBox.warning("Company Code is required. Please select a Company Code in Basic Information first.");
    return;
  }
  var oModel = this.getOwnerComponent().getModel();
  var oSource = oEvent.getSource();
  this._selectedVendorContextPath = oSource.getBindingContext("viewModel") ? oSource.getBindingContext("viewModel").getPath() : null;
  var that = this;

  if (!this._oVendorDialog) {
    this._oVendorDialog = new sap.m.SelectDialog({
      title: "Select Vendor",
      noDataText: "No vendors found",
          search: function (oEv) {
            var sValue = oEv.getParameter("value").toLowerCase();
            var aFiltered = (that._aVendorItems || []).filter(function (o) {
              return !sValue || (o.VendorName && o.VendorName.toLowerCase().indexOf(sValue) !== -1) || (o.VendorCode && o.VendorCode.toLowerCase().indexOf(sValue) !== -1);
            });
            that._oVendorDialog.getModel("vendorLocal").setProperty("/items", aFiltered);
      },
      confirm: function (oEv) {
            var oItem = oEv.getParameter("selectedItem");
            var oData = oItem.getBindingContext("vendorLocal").getObject();
            var sPath = that._selectedVendorContextPath;
            var aVendors = oViewModel.getProperty("/vendors") || [];
            var iCurrentIdx = sPath ? parseInt(sPath.split("/").pop()) : -1;
            var bDuplicate = aVendors.some(function (v, i) {
              return i !== iCurrentIdx && v.vendorNo === oData.VendorCode;
            });
            if (bDuplicate) {
              MessageBox.warning("Vendor '" + oData.VendorName + "' is already added. Same vendor cannot be repeated.");
              return;
            }
            if (sPath) {
              oViewModel.setProperty(sPath + "/vendorNo", oData.VendorCode);
              oViewModel.setProperty(sPath + "/vendorName", oData.VendorName);
              oViewModel.setProperty(sPath + "/vendorIceFlag", oData.VendorIceFlag || "");
            }
            if (sPath && sPath.endsWith("/0")) {
              oViewModel.setProperty("/header/SuggestedVendor", oData.VendorCode);
              oViewModel.setProperty("/header/SuggestedVendorDesc", oData.VendorName);
            }
            that._bIsDirty = true;
      }
    });
        this._oVendorDialog.setModel(new sap.ui.model.json.JSONModel({ items: [] }), "vendorLocal");
        this._oVendorDialog.bindAggregation("items", {
          path: "vendorLocal>/items",
          template: new sap.m.StandardListItem({
            title: "{vendorLocal>VendorName}",
            description: "{vendorLocal>VendorCode}"
          })
        });
    this.getView().addDependent(this._oVendorDialog);
  }

  sap.ui.core.BusyIndicator.show(0);
  oModel.read("/ZNFA_SH_VENDORSet", {
    filters: [new Filter("CompanyCode", FilterOperator.EQ, sCompanyCode)],
    success: function (oData) {
      that._aVendorItems = oData.results || [];
      that._oVendorDialog.getModel("vendorLocal").setProperty("/items", that._aVendorItems);
      sap.ui.core.BusyIndicator.hide();
      that._oVendorDialog.open("");
    },
    error: function () {
      sap.ui.core.BusyIndicator.hide();
      MessageToast.show("Failed to load Vendors.");
    }
  });
},

// Proposed Bidder F4 - Shows vendors from Vendors Quoted table
onProposedBidder: function () {
  var oViewModel = this.getView().getModel("viewModel");
  var aVendors = oViewModel.getProperty("/vendors") || [];
  var that = this;

  if (aVendors.length === 0) {
    MessageToast.show("Please add vendors in Vendors Quoted section first");
    return;
  }

  if (!this._oProposedBidderDialog) {
    this._oProposedBidderDialog = new sap.m.SelectDialog({
      title: "Select Proposed Bidder",
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new Filter("vendorName", FilterOperator.Contains, sValue);
        oEvent.getSource().getBinding("items").filter([oFilter]);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oContext = oItem.getBindingContext("viewModel");
        var oData = oContext.getObject();
        
        that.getView().getModel("viewModel").setProperty("/header/ProposedVendor", oData.vendorName);
        that.getView().getModel("viewModel").setProperty("/header/ProposedVendorDesc", oData.vendorNo);
      }
    });
    this.getView().addDependent(this._oProposedBidderDialog);
  }

  this._oProposedBidderDialog.bindAggregation("items", {
    path: "viewModel>/vendors",
    template: new sap.m.StandardListItem({
      title: "{viewModel>vendorName}",
      description: "{viewModel>vendorNo}"
    })
  });

  this._oProposedBidderDialog.open();
},





      onPlantVH: function (oEvent) {
  var oModel = this.getOwnerComponent().getModel();
  var oSource = oEvent.getSource();
  var oBindingContext = oSource.getBindingContext("viewModel");
  var that = this;

  if (!this._oPlantDialog) {
    this._oPlantDialog = new sap.m.SelectDialog({
      title: "Select Plant",
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var aFilters = sValue ? [new Filter([
          new Filter("PlantDesc", FilterOperator.Contains, sValue),
          new Filter("Plant", FilterOperator.Contains, sValue)
        ], false)] : [];
        oEvent.getSource().getBinding("items").filter(aFilters);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oData = oItem.getBindingContext().getObject();
        var sPath = that._selectedPlantContextPath;
        if (sPath) {
          var oViewModel = that.getView().getModel("viewModel");
          oViewModel.setProperty(sPath + "/plant", oData.Plant);
          oViewModel.setProperty(sPath + "/plantDesc", oData.PlantDesc);
        }
      }
    });
    this.getView().addDependent(this._oPlantDialog);
  }

  this._selectedPlantContext = oBindingContext;
  this._selectedPlantContextPath = oBindingContext ? oBindingContext.getPath() : null;

  this._oPlantDialog.bindAggregation("items", {
    path: "/ZvhWerksSet",
    template: new sap.m.StandardListItem({
      title: "{PlantDesc}",
      description: "{Plant}",
    }),
  });

  this._oPlantDialog.setModel(oModel);
  this._oPlantDialog.open();
},

onHeaderPlantVH: function () {
  var oViewModel = this.getView().getModel("viewModel");
  var sPurchaseOrg = oViewModel.getProperty("/header/PurchaseOrg");
  if (!sPurchaseOrg || sPurchaseOrg.trim() === "") {
    MessageBox.warning("Please select Purchase Org first.");
    return;
  }

  var oModel = this.getOwnerComponent().getModel();
  var that = this;

  if (!this._oHeaderPlantDialog) {
    this._oHeaderPlantDialog = new sap.m.SelectDialog({
      title: "Select Plant",
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var sPurOrg = that.getView().getModel("viewModel").getProperty("/header/PurchaseOrg");
        var aFilters = [new Filter("PurOrg", FilterOperator.EQ, sPurOrg)];
        if (sValue) {
          aFilters.push(new Filter([
            new Filter("PlantDesc", FilterOperator.Contains, sValue),
            new Filter("Plant", FilterOperator.Contains, sValue)
          ], false));
        }
        oEvent.getSource().getBinding("items").filter(aFilters);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oData = oItem.getBindingContext().getObject();
        oViewModel.setProperty("/header/Plant", oData.Plant);
        oViewModel.setProperty("/header/PlantDesc", oData.PlantDesc);
        // Clear PurchaseGroup since it depends on Plant
        oViewModel.setProperty("/header/PurchaseGroup", "");
        oViewModel.setProperty("/header/PurchaseGroupDesc", "");
        that._aPurchaseGroupItems = null;
        that._bPurchaseGroupSelected = false;
        that._bPlantSelected = true;
        that._bIsDirty = true;
      }
    });
    this.getView().addDependent(this._oHeaderPlantDialog);
  }

  this._oHeaderPlantDialog.bindAggregation("items", {
    path: "/ZvhWerksSet",
    filters: [new Filter("PurOrg", FilterOperator.EQ, sPurchaseOrg)],
    template: new sap.m.StandardListItem({
      title: "{PlantDesc}",
      description: "{Plant}"
    })
  });

  this._oHeaderPlantDialog.setModel(oModel);
  this._oHeaderPlantDialog.open();
},


      // Commodity F4
      // onCommodityVH: function () {
      //   var oModel = this.getOwnerComponent().getModel();
      //   var that = this;

      //   if (!this._oCommodityDialog) {
      //     this._oCommodityDialog = new sap.m.SelectDialog({
      //       title: "Select Commodity",
      //       search: function (oEvent) {
      //         var sValue = oEvent.getParameter("value");
      //         var oFilter = new sap.ui.model.Filter(
      //           "Matkl",
      //           sap.ui.model.FilterOperator.Contains,
      //           sValue,
      //         );
      //         oEvent.getSource().getBinding("items").filter([oFilter]);
      //       },
      //       confirm: function (oEvent) {
      //         var oItem = oEvent.getParameter("selectedItem");
      //         that
      //           .getView()
      //           .getModel("viewModel")
      //           .setProperty("/header/Commodity", oItem.getTitle());
      //         that.byId("commodityInput").setValueState("None");
      //       },
      //     });
      //     this.getView().addDependent(this._oCommodityDialog);
      //   }

      //   this._oCommodityDialog.bindAggregation("items", {
      //     path: "/ZnfaShCommoditySet",
      //     template: new sap.m.StandardListItem({
      //       title: "{Matkl}",
      //       description: "{Wgbez}",
      //     }),
      //   });

      //   this._oCommodityDialog.setModel(oModel);
      //   this._oCommodityDialog.open();
      // },

      // Payment Terms F4
      onPaymentTermsVH: function (oEvent) {
        var oSource = oEvent.getSource();
        var oBindingContext = oSource.getBindingContext("viewModel");
        var that = this;

        if (!this._oPaymentDialog) {
          this._oPaymentDialog = new sap.m.SelectDialog({
            title: "Select Payment Terms",
            noDataText: "No data found",
            search: function (oEvent) {
              var sValue = oEvent.getParameter("value").toLowerCase();
              var aFiltered = (that._aPaymentTermsItems || []).filter(function (o) {
                return !sValue || (o.Text1 && o.Text1.toLowerCase().indexOf(sValue) !== -1) || (o.Zterm && o.Zterm.toLowerCase().indexOf(sValue) !== -1);
              });
              that._oPaymentDialog.getModel("ptLocal").setProperty("/items", aFiltered);
            },
            confirm: function (oEvent) {
              var oItem = oEvent.getParameter("selectedItem");
              var oData = oItem.getBindingContext("ptLocal").getObject();
              var sPath = that._selectedPaymentContextPath;
              if (sPath) {
                var oViewModel = that.getView().getModel("viewModel");
                oViewModel.setProperty(sPath + "/PaymentTerms", oData.Zterm);
                oViewModel.setProperty(sPath + "/paymentTermsDesc", oData.Text1);
              }
            }
          });
          this._oPaymentDialog.setModel(new sap.ui.model.json.JSONModel({ items: [] }), "ptLocal");
          this._oPaymentDialog.bindAggregation("items", {
            path: "ptLocal>/items",
            template: new sap.m.StandardListItem({ title: "{ptLocal>Text1}", description: "{ptLocal>Zterm}" })
          });
          this.getView().addDependent(this._oPaymentDialog);
        }

        this._selectedPaymentContextPath = oBindingContext ? oBindingContext.getPath() : null;

        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel().read("/ZnfaShPaymentTermsSet", {
          success: function (oData) {
            that._aPaymentTermsItems = oData.results || [];
            that._oPaymentDialog.getModel("ptLocal").setProperty("/items", that._aPaymentTermsItems);
            sap.ui.core.BusyIndicator.hide();
            that._oPaymentDialog.open("");
          },
          error: function () { sap.ui.core.BusyIndicator.hide(); MessageToast.show("Failed to load Payment Terms."); }
        });
      },
      // Purchase Organization F4
onPurchaseOrgVH: function () {
  var oViewModel = this.getView().getModel("viewModel");
  if (!oViewModel.getProperty("/header/CompanyCode")) {
    MessageBox.warning("Please select Company Code first.");
    return;
  }
  var oModel = this.getOwnerComponent().getModel();
  var sCompanyCode = oViewModel.getProperty("/header/CompanyCode") || "0001";
  var that = this;

  if (!this._oPurchaseOrgDialog) {
    this._oPurchaseOrgDialog = new sap.m.SelectDialog({
      title: "Select Purchase Organization",
      noDataText: "No data found",
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var sCC = that.getView().getModel("viewModel").getProperty("/header/CompanyCode") || "0001";
        var oCCFilter = new Filter("CompanyCode", FilterOperator.EQ, sCC);
        var oFinalFilter;
        if (sValue && sValue.trim()) {
          var oSearchFilter = new Filter([
            new Filter("PurOrgDesc", FilterOperator.Contains, sValue),
            new Filter("PurOrg", FilterOperator.Contains, sValue)
          ], false);
          oFinalFilter = new Filter([oCCFilter, oSearchFilter], true);
        } else {
          oFinalFilter = oCCFilter;
        }
        oEvent.getSource().getBinding("items").filter([oFinalFilter]);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oContext = oItem.getBindingContext();
        var oData = oContext.getObject();
        that.getView().getModel("viewModel").setProperty("/header/PurchaseOrg", oData.PurOrg);
        that.getView().getModel("viewModel").setProperty("/header/PurchaseOrgDesc", oData.PurOrgDesc);
        that.byId("purchaseOrgInput").setValueState("None");
        that._bPurchaseOrgSelected = true;
        that._aHeaderPlantItems = null; // reset plant cache when purchase org changes
        // Clear Plant and PurchaseGroup since they depend on PurchaseOrg
        oViewModel.setProperty("/header/Plant", "");
        oViewModel.setProperty("/header/PlantDesc", "");
        oViewModel.setProperty("/header/PurchaseGroup", "");
        oViewModel.setProperty("/header/PurchaseGroupDesc", "");
        that._aPurchaseGroupItems = null;
        that._bPurchaseGroupSelected = false;
        that._bIsDirty = true;
      }
    });
    this.getView().addDependent(this._oPurchaseOrgDialog);
  }

  this._oPurchaseOrgDialog.bindAggregation("items", {
    path: "/ZNFA_SH_PUR_ORGSet",
    template: new sap.m.StandardListItem({
      title: "{PurOrgDesc}",
      description: "{PurOrg}"
    })
  });

  this._oPurchaseOrgDialog.setModel(oModel);
  this._oPurchaseOrgDialog.getBinding("items").filter([new Filter("CompanyCode", FilterOperator.EQ, sCompanyCode)]);
  this._oPurchaseOrgDialog.open("");
},

// Purchase Group F4
onPurchaseGroupVH: function () {
  var oViewModel = this.getView().getModel("viewModel");
  if (!oViewModel.getProperty("/header/CompanyCode")) {
    MessageBox.warning("Please select Company Code first.");
    return;
  }
  if (!oViewModel.getProperty("/header/PurchaseOrg")) {
    MessageBox.warning("Please select Purchase Org first.");
    return;
  }
  if (!oViewModel.getProperty("/header/Plant")) {
    MessageBox.warning("Please select Plant first.");
    return;
  }
  var that = this;

  if (!this._oPurchaseGroupDialog) {
    this._oPurchaseGroupDialog = new sap.m.SelectDialog({
      title: "Select Purchase Group",
      noDataText: "No data found",
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value").toLowerCase();
        var aFiltered = (that._aPurchaseGroupItems || []).filter(function (o) {
          return !sValue || o.Eknam.toLowerCase().indexOf(sValue) !== -1 || o.Ekgrp.toLowerCase().indexOf(sValue) !== -1;
        });
        that._oPurchaseGroupDialog.getModel("pgLocal").setProperty("/items", aFiltered);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oData = oItem.getBindingContext("pgLocal").getObject();
        that.getView().getModel("viewModel").setProperty("/header/PurchaseGroup", oData.Ekgrp);
        that.getView().getModel("viewModel").setProperty("/header/PurchaseGroupDesc", oData.Eknam);
        that.byId("purchaseGroupInput").setValueState("None");
        that._bPurchaseGroupSelected = true;
        that._bIsDirty = true;
      }
    });
    this._oPurchaseGroupDialog.setModel(new sap.ui.model.json.JSONModel({ items: [] }), "pgLocal");
    this._oPurchaseGroupDialog.bindAggregation("items", {
      path: "pgLocal>/items",
      template: new sap.m.StandardListItem({ title: "{pgLocal>Eknam}", description: "{pgLocal>Ekgrp}" })
    });
    this.getView().addDependent(this._oPurchaseGroupDialog);
  }

  var sPlant = oViewModel.getProperty("/header/Plant");
  sap.ui.core.BusyIndicator.show(0);
  this.getOwnerComponent().getModel().read("/ZnfaShPurGrpSet", {
    filters: [new Filter("Werks", FilterOperator.EQ, sPlant)],
    success: function (oData) {
      that._aPurchaseGroupItems = oData.results || [];
      that._oPurchaseGroupDialog.getModel("pgLocal").setProperty("/items", that._aPurchaseGroupItems);
      sap.ui.core.BusyIndicator.hide();
      that._oPurchaseGroupDialog.open("");
    },
    error: function () { sap.ui.core.BusyIndicator.hide(); MessageToast.show("Failed to load Purchase Groups."); }
  });
},


      // Generic Search Help Handler
      // _openSearchHelp: function (sType, sTitle, sKeyField, sDescField, sTargetPath) {
      //   var oModel = this.getOwnerComponent().getModel();
      //   var that = this;

      //   if (!this._oSearchDialog) {
      //     this._oSearchDialog = new sap.m.SelectDialog({
      //       title: sTitle,
      //       search: function (oEvent) {
      //         var sValue = oEvent.getParameter("value");
      //         var oFilter = new sap.ui.model.Filter(sKeyField, sap.ui.model.FilterOperator.Contains, sValue);
      //         oEvent.getSource().getBinding("items").filter([oFilter]);
      //       },
      //       confirm: function (oEvent) {
      //         var oItem = oEvent.getParameter("selectedItem");
      //         that.getView().getModel("viewModel").setProperty(sTargetPath, oItem.getTitle());
      //       }
      //     });
      //     this.getView().addDependent(this._oSearchDialog);
      //   }

      //   this._oSearchDialog.setTitle(sTitle);
      //   this._oSearchDialog.bindAggregation("items", {
      //     path: "/et_nfa_search_helpSet",
      //     filters: [new sap.ui.model.Filter("Type", sap.ui.model.FilterOperator.EQ, sType)],
      //     template: new sap.m.StandardListItem({
      //       title: "{" + sKeyField + "}",
      //       description: "{" + sDescField + "}"
      //     })
      //   });

      //   this._oSearchDialog.setModel(oModel);
      //   this._oSearchDialog.open();
      // },
      // Generic Search Help Handler - FIXED
      
      
_openSearchHelp: function (
  sType,
  sTitle,
  sKeyField,
  sDescField,
  sTargetPath,
  sControlId
) {
  var oModel = this.getOwnerComponent().getModel();
  var that = this;

  this._currentSearchType = sType;
  this._currentKeyField = sKeyField;
  this._currentDescField = sDescField;
  this._currentTargetPath = sTargetPath;
  this._currentControlId = sControlId;

  if (!this._oSearchDialog) {
    this._oSearchDialog = new sap.m.SelectDialog({
      title: sTitle,
      search: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var aFilters = [
          new Filter("Type", FilterOperator.EQ, that._currentSearchType),
          new Filter(that._currentKeyField, FilterOperator.Contains, sValue),
        ];
        oEvent.getSource().getBinding("items").filter(aFilters);
      },
      confirm: function (oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var oContext = oItem.getBindingContext();
        var oData = oContext.getObject();
        
        that.getView().getModel("viewModel").setProperty(that._currentTargetPath, oData[that._currentKeyField]);
        that.getView().getModel("viewModel").setProperty(that._currentTargetPath + "Desc", oData[that._currentDescField]);
        
        if (that._currentControlId) {
          that.byId(that._currentControlId).setValueState("None");
        }
      },
    });
    this.getView().addDependent(this._oSearchDialog);
  }

  this._oSearchDialog.setTitle(sTitle);
  this._oSearchDialog.bindAggregation("items", {
    path: "/et_nfa_search_helpSet",
    filters: [new Filter("Type", FilterOperator.EQ, sType)],
    template: new sap.m.StandardListItem({
      title: "{" + sDescField + "}",
      description: "{" + sKeyField + "}",
    }),
  });

  this._oSearchDialog.setModel(oModel);
  this._oSearchDialog.open();
}


      // _openSearchHelp: function (
      //   sType,
      //   sTitle,
      //   sKeyField,
      //   sDescField,
      //   sTargetPath,
      //   sControlId
      // ) {
      //   var oModel = this.getOwnerComponent().getModel();
      //   var that = this;

      //   if (!this._oSearchDialog) {
      //     this._oSearchDialog = new sap.m.SelectDialog({
      //       title: sTitle,
      //       search: function (oEvent) {
      //         var sValue = oEvent.getParameter("value");
      //         var aFilters = [
      //           new Filter("Type", FilterOperator.EQ, sType),
      //           new Filter(sKeyField, FilterOperator.Contains, sValue),
      //         ];
      //         oEvent.getSource().getBinding("items").filter(aFilters);
      //       },
      //       confirm: function (oEvent) {
      //         var oItem = oEvent.getParameter("selectedItem");
      //         that
      //           .getView()
      //           .getModel("viewModel")
      //           .setProperty(sTargetPath, oItem.getTitle());
      //         if (sControlId) {
      //           that.byId(sControlId).setValueState("None");
      //         }
      //       },
      //     });
      //     this.getView().addDependent(this._oSearchDialog);
      //   }

      //   this._oSearchDialog.setTitle(sTitle);
      //   this._oSearchDialog.bindAggregation("items", {
      //     path: "/et_nfa_search_helpSet",
      //     filters: [new Filter("Type", FilterOperator.EQ, sType)],
      //     template: new sap.m.StandardListItem({
      //       title: "{" + sKeyField + "}",
      //       description: "{" + sDescField + "}",
      //     }),
      //   });

      //   this._oSearchDialog.setModel(oModel);
      //   this._oSearchDialog.open();
      // }
      ,

      // _formatDateForBackend: function (oDate) {
      //   if (!oDate) return null;
      //   if (typeof oDate === "string") {
      //     return "/Date(" + new Date(oDate).getTime() + ")/";
      //   }
      //   return "/Date(" + oDate.getTime() + ")/";
      // }
      // ===== SUGGESTION HANDLERS =====

      // ===== SELECTION FLAGS — reset on liveChange, set on suggestion/F4 select =====
      _isFieldSelected: function (sFlag) {
        return !!this[sFlag];
      },

      _resetSelectionFlag: function (sFlag) {
        this[sFlag] = false;
      },

      onCompanyCodeSuggest: function (oEvent) {
        var sVal = oEvent.getParameter("suggestValue").toLowerCase();
        var oInput = oEvent.getSource();
        if (!this._aCompanyCodeItems || !this._aCompanyCodeItems.length) {
          var that = this;
          this.getOwnerComponent().getModel().read("/et_nfa_search_helpSet", {
            filters: [new Filter("Type", FilterOperator.EQ, "COMPANY_CODE")],
            success: function (oData) {
              that._aCompanyCodeItems = (oData.results || []).filter(function (o) { return o.Type === "COMPANY_CODE"; });
              that._filterAndBindSuggestions(oInput, that._aCompanyCodeItems, sVal, "ccSug");
            }
          });
          return;
        }
        this._filterAndBindSuggestions(oInput, this._aCompanyCodeItems, sVal, "ccSug");
      },

      onPurchaseOrgSuggest: function (oEvent) {
        var sVal = oEvent.getParameter("suggestValue").toLowerCase();
        var oInput = oEvent.getSource();
        var sCC = this.getView().getModel("viewModel").getProperty("/header/CompanyCode");
        if (!sCC) { return; }
        if (!this._aPurchaseOrgItems || !this._aPurchaseOrgItems.length) {
          var that = this;
          this.getOwnerComponent().getModel().read("/ZNFA_SH_PUR_ORGSet", {
            filters: [new Filter("CompanyCode", FilterOperator.EQ, sCC)],
            success: function (oData) {
              that._aPurchaseOrgItems = oData.results || [];
              that._filterAndBindSuggestions(oInput, that._aPurchaseOrgItems, sVal, "poSug", ["PurOrgDesc", "PurOrg"]);
            }
          });
          return;
        }
        this._filterAndBindSuggestions(oInput, this._aPurchaseOrgItems, sVal, "poSug", ["PurOrgDesc", "PurOrg"]);
      },

      onPurchaseGroupSuggest: function (oEvent) {
        var sVal = oEvent.getParameter("suggestValue").toLowerCase();
        var oInput = oEvent.getSource();
        var sPlant = this.getView().getModel("viewModel").getProperty("/header/Plant");
        if (!sPlant) { return; }
        if (!this._aPurchaseGroupItems || !this._aPurchaseGroupItems.length) {
          var that = this;
          this.getOwnerComponent().getModel().read("/ZnfaShPurGrpSet", {
            filters: [new Filter("Werks", FilterOperator.EQ, sPlant)],
            success: function (oData) {
              that._aPurchaseGroupItems = oData.results || [];
              that._filterAndBindSuggestions(oInput, that._aPurchaseGroupItems, sVal, "pgSug", ["Eknam", "Ekgrp"]);
            }
          });
          return;
        }
        this._filterAndBindSuggestions(oInput, this._aPurchaseGroupItems, sVal, "pgSug", ["Eknam", "Ekgrp"]);
      },

      onCurrencySuggest: function (oEvent) {
        var sVal = oEvent.getParameter("suggestValue").toLowerCase();
        var oInput = oEvent.getSource();
        if (!this._aCurrencyItems || !this._aCurrencyItems.length) {
          var that = this;
          this.getOwnerComponent().getModel().read("/et_nfa_search_helpSet", {
            filters: [new Filter("Type", FilterOperator.EQ, "CURRENCY")],
            success: function (oData) {
              that._aCurrencyItems = (oData.results || []).filter(function (o) { return o.Type === "CURRENCY"; });
              that._filterAndBindSuggestions(oInput, that._aCurrencyItems, sVal, "ccySug");
            }
          });
          return;
        }
        this._filterAndBindSuggestions(oInput, this._aCurrencyItems, sVal, "ccySug");
      },

      onHeaderPlantSuggest: function (oEvent) {
        var sVal = oEvent.getParameter("suggestValue").toLowerCase();
        var oInput = oEvent.getSource();
        var sPurOrg = this.getView().getModel("viewModel").getProperty("/header/PurchaseOrg");
        if (!sPurOrg) { return; }
        if (!this._aHeaderPlantItems || !this._aHeaderPlantItems.length) {
          var that = this;
          this.getOwnerComponent().getModel().read("/ZvhWerksSet", {
            filters: [new Filter("PurOrg", FilterOperator.EQ, sPurOrg)],
            success: function (oData) {
              that._aHeaderPlantItems = oData.results || [];
              that._filterAndBindSuggestions(oInput, that._aHeaderPlantItems, sVal, "plantSug", ["PlantDesc", "Plant"]);
            }
          });
          return;
        }
        this._filterAndBindSuggestions(oInput, this._aHeaderPlantItems, sVal, "plantSug", ["PlantDesc", "Plant"]);
      },

      onIncotermsSuggest: function (oEvent) {
        var sVal = oEvent.getParameter("suggestValue").toLowerCase();
        var oInput = oEvent.getSource();
        if (!this._aIncotermsItems || !this._aIncotermsItems.length) {
          var that = this;
          this.getOwnerComponent().getModel().read("/et_nfa_search_helpSet", {
            filters: [new Filter("Type", FilterOperator.EQ, "INCOTERMS")],
            success: function (oData) {
              that._aIncotermsItems = (oData.results || []).filter(function (o) { return o.Type === "INCOTERMS"; });
              that._filterAndBindSuggestions(oInput, that._aIncotermsItems, sVal, "incoSug");
            }
          });
          return;
        }
        this._filterAndBindSuggestions(oInput, this._aIncotermsItems, sVal, "incoSug");
      },

      // Generic helper: filters array by sVal across key fields and binds to input suggestion model
      _filterAndBindSuggestions: function (oInput, aItems, sVal, sModelName, aFields) {
        var aKeys = aFields || ["Description", "KeyDataType"];
        var aFiltered = sVal ? aItems.filter(function (o) {
          return aKeys.some(function (k) { return o[k] && o[k].toLowerCase().indexOf(sVal) !== -1; });
        }) : aItems;
        var oSugModel = oInput.getModel(sModelName);
        if (!oSugModel) {
          oSugModel = new sap.ui.model.json.JSONModel();
          oInput.setModel(oSugModel, sModelName);
        }
        oSugModel.setData(aFiltered);
        // bind suggestion items using Item (text = description, key = code)
        oInput.bindAggregation("suggestionItems", {
          path: sModelName + ">/",
          template: new sap.ui.core.Item({
            key: "{" + sModelName + ">" + aKeys[1] + "}",
            text: "{" + sModelName + ">" + aKeys[1] + "} - {" + sModelName + ">" + aKeys[0] + "}"
          }),
          templateShareable: false
        });
        // attach only once per input
        if (!oInput._bSugHandlerAttached) {
          oInput._bSugHandlerAttached = true;
          oInput.attachSuggestionItemSelected(function (oEv) {
            var oItem = oEv.getParameter("selectedItem");
            if (!oItem) { return; }
            var sKey  = oItem.getKey();
            var sText = oItem.getText();
            // extract pure description (strip the "CODE - " prefix)
            var sDesc = sText.indexOf(" - ") !== -1 ? sText.substring(sText.indexOf(" - ") + 3) : sText;
            var oViewModel = this.getView().getModel("viewModel");
            if (sModelName === "ccSug") {
              oViewModel.setProperty("/header/CompanyDescription", sDesc);
              oViewModel.setProperty("/header/CompanyCode", sKey);
              oViewModel.setProperty("/header/PurchaseOrg", "");
              oViewModel.setProperty("/header/PurchaseOrgDesc", "");
              this._bPurchaseOrgSelected = false;
              this._aPurchaseOrgItems = null;
              this.byId("companyCodeInput").setValueState("None");
              this.byId("purchaseOrgInput").setValueState("None");
              this._bCompanyCodeSelected = true;
            } else if (sModelName === "poSug") {
              oViewModel.setProperty("/header/PurchaseOrgDesc", sDesc);
              oViewModel.setProperty("/header/PurchaseOrg", sKey);
              this.byId("purchaseOrgInput").setValueState("None");
              this._bPurchaseOrgSelected = true;
              // Clear Plant and PurchaseGroup caches since they depend on PurchaseOrg
              this._aHeaderPlantItems = null;
              this._aPurchaseGroupItems = null;
              this._bPurchaseGroupSelected = false;
              oViewModel.setProperty("/header/Plant", "");
              oViewModel.setProperty("/header/PlantDesc", "");
              oViewModel.setProperty("/header/PurchaseGroup", "");
              oViewModel.setProperty("/header/PurchaseGroupDesc", "");
            } else if (sModelName === "pgSug") {
              oViewModel.setProperty("/header/PurchaseGroupDesc", sDesc);
              oViewModel.setProperty("/header/PurchaseGroup", sKey);
              this.byId("purchaseGroupInput").setValueState("None");
              this._bPurchaseGroupSelected = true;
            } else if (sModelName === "ccySug") {
              oViewModel.setProperty("/header/CurrencyDesc", sDesc);
              oViewModel.setProperty("/header/Currency", sKey);
              this.byId("currencyInput").setValueState("None");
              this._bCurrencySelected = true;
            } else if (sModelName === "incoSug") {
              oViewModel.setProperty("/header/IncotermDesc", sDesc);
              oViewModel.setProperty("/header/Incoterm", sKey);
              this.byId("incotermsInput").setValueState("None");
              this._bIncotermsSelected = true;
            } else if (sModelName === "plantSug") {
              oViewModel.setProperty("/header/PlantDesc", sDesc);
              oViewModel.setProperty("/header/Plant", sKey);
              this.byId("headerPlantInput").setValueState("None");
              this._bPlantSelected = true;
              // Clear PurchaseGroup cache since it depends on Plant
              this._aPurchaseGroupItems = null;
              this._bPurchaseGroupSelected = false;
              oViewModel.setProperty("/header/PurchaseGroup", "");
              oViewModel.setProperty("/header/PurchaseGroupDesc", "");
            }
            this._bIsDirty = true;
          }.bind(this));
        }
      },

      _formatDateForBackend: function (oDate) {
        if (!oDate) return null;
        var oParsedDate = (typeof oDate === "string") ? new Date(oDate) : oDate;
        if (isNaN(oParsedDate.getTime())) return null;
        var y = oParsedDate.getFullYear();
        var m = String(oParsedDate.getMonth() + 1).padStart(2, "0");
        var d = String(oParsedDate.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + d + "T00:00:00";
      },

      // onSaveDraft: function () {
      //   var oViewModel = this.getView().getModel("viewModel");
      //   var oODataModel = this.getOwnerComponent().getModel();
      //   var oHeader = oViewModel.getProperty("/header");
      //   var aVendors = oViewModel.getProperty("/vendors");

      //   var oPayload = {
      //     NfaRefNo: oHeader.NfaRefNo || "",
      //     PoNo: oHeader.PoNo || "",
      //     ContractNo: oHeader.ContractNo || "",
      //     SchlAgreementNo: oHeader.SchlAgreementNo || "",
      //     AribaDocNo: oHeader.AribaDocNo || "",
      //     NfaType: oHeader.NfaType || "",
      //     SuggestedVendor: oHeader.SuggestedVendor || "",
      //     ProposedVendor: oHeader.ProposedVendor || "",
      //     PurchaseOrg: oHeader.PurchaseOrg || "",
      //     Remarks: oHeader.Remarks || "",
      //     BiDate: this._formatDateForBackend(oHeader.BiDate),
      //     Commodity: oHeader.Commodity || "",
      //     CompanyCode: oHeader.CompanyCode || "",
      //     PrBudget: String(oHeader.PrBudget || "0"),
      //     Description: oHeader.Description || "",
      //     LdClause: oHeader.LdClause || "",
      //     AdvanceBg: oHeader.AdvanceBg || "",
      //     AdavanceBgAmt: String(oHeader.AdavanceBgAmt || "0"),
      //     PerformanceBg: oHeader.PerformanceBg || "",
      //     PerformanceBpAmt: String(oHeader.PerformanceBpAmt || "0"),
      //     LowestBasis: oHeader.LowestBasis || "",
      //     TechAccepLowBasis: oHeader.TechAccepLowBasis || "",
      //     ProprietaryBasis: oHeader.ProprietaryBasis || "",
      //     SingleTenderBasis: oHeader.SingleTenderBasis || "",
      //     RepeatOrderBasis: oHeader.RepeatOrderBasis || "",
      //     RateContract: oHeader.RateContract || "",
      //     JustificationRemarks: oHeader.JustificationRemarks || "",
      //     ScopeOfWork: oHeader.ScopeOfWork || "",
      //     AdditionalInfo: oHeader.AdditionalInfo || "",
      //     NegotiationStrategy: oHeader.NegotiationStrategy || "",
      //     VendorCategory: oHeader.VendorCategory || ""
      //   };

      //   oODataModel.create("/et_nfa_detailsSet", oPayload, {
      //     success: function (oData) {
      //       MessageToast.show("NFA Header saved successfully");
      //       var sNfaRefNo = oData.NfaRefNo;
      //       if (aVendors && aVendors.length) {
      //         this._saveVendorDetails(sNfaRefNo, aVendors);
      //       }
      //     }.bind(this),
      //     error: function (oError) {
      //       MessageToast.show("Error saving NFA Header");
      //     }
      //   });
      // },

      // _saveVendorDetails: function (sNfaRefNo, aVendors) {
      //   var oODataModel = this.getOwnerComponent().getModel();

      //   var oVendorPayload = {
      //     NfaRefNo: sNfaRefNo,
      //     VENDOR_ITEMS: aVendors.map(function (item) {
      //       return {
      //         VendorNo: item.vendorNo || "",
      //         VendorName: item.vendorName || "",
      //         InitialPrice: String(item.initialPrice || "0"),
      //         NegotiatedPrice: String(item.negotiatedAmount || "0"),
      //         TotalPrice: String(item.negotiatedAmount || "0"),
      //         Lpp: String(item.lpp || "0"),
      //         Ta: item.technicalAcceptability || "",
      //         VendorQa: item.vendorQualification || "",
      //         GstCredit: item.gstCredit || "",
      //         GstRemarks: item.remark || "",
      //         DeliveryRemarks: item.deliveryRemarks || "",
      //         PaymentTerms: item.PaymentTerms || ""
      //       };
      //     })
      //   };

      //   oODataModel.create("/et_vendor_detailsSet", oVendorPayload, {
      //     success: function (oData) {
      //       MessageToast.show("Vendor details saved successfully");
      //     },
      //     error: function () {
      //       MessageToast.show("Error saving vendor details");
      //     }
      //   });
      // }

      _validateForm: function () {
  var oViewModel = this.getView().getModel("viewModel");
  var oHeader = oViewModel.getProperty("/header");
  var aErrors = [];

  // 1. Company Code
  var oCompanyCode = this.byId("companyCodeInput");
  if (!oHeader.CompanyCode || oHeader.CompanyCode.trim() === "") {
    oCompanyCode.setValueState("Error");
    oCompanyCode.setValueStateText("Please select Company Code");
    aErrors.push("Company Code");
  } else if (!this._bCompanyCodeSelected) {
    oCompanyCode.setValueState("Error");
    oCompanyCode.setValueStateText("Please select Company Code from the list");
    aErrors.push("Company Code (must be selected from list)");
  }

  // 2. Purchase Org
  var oPurchaseOrg = this.byId("purchaseOrgInput");
  if (!oHeader.PurchaseOrg || oHeader.PurchaseOrg.trim() === "") {
    oPurchaseOrg.setValueState("Error");
    oPurchaseOrg.setValueStateText("Please select Purchase Org");
    aErrors.push("Purchase Org");
  } else if (!this._bPurchaseOrgSelected) {
    oPurchaseOrg.setValueState("Error");
    oPurchaseOrg.setValueStateText("Please select Purchase Org from the list");
    aErrors.push("Purchase Org (must be selected from list)");
  }

  // 2b. Purchase Group
  var oPurchaseGroup = this.byId("purchaseGroupInput");
  if (!oHeader.PurchaseGroup || oHeader.PurchaseGroup.trim() === "") {
    oPurchaseGroup.setValueState("Error");
    oPurchaseGroup.setValueStateText("Please select Purchase Group");
    aErrors.push("Purchase Group");
  } else if (!this._bPurchaseGroupSelected) {
    oPurchaseGroup.setValueState("Error");
    oPurchaseGroup.setValueStateText("Please select Purchase Group from the list");
    aErrors.push("Purchase Group (must be selected from list)");
  }

  // 3. Currency
  var oCurrency = this.byId("currencyInput");
  if (!oHeader.Currency || oHeader.Currency.trim() === "") {
    oCurrency.setValueState("Error");
    oCurrency.setValueStateText("Please select Currency");
    aErrors.push("Currency");
  } else if (!this._bCurrencySelected) {
    oCurrency.setValueState("Error");
    oCurrency.setValueStateText("Please select Currency from the list");
    aErrors.push("Currency (must be selected from list)");
  }

  // 4. Incoterms
  var oIncoterms = this.byId("incotermsInput");
  if (!oHeader.Incoterm || oHeader.Incoterm.trim() === "") {
    oIncoterms.setValueState("Error");
    oIncoterms.setValueStateText("Please select Incoterms");
    aErrors.push("Incoterms");
  } else if (!this._bIncotermsSelected) {
    oIncoterms.setValueState("Error");
    oIncoterms.setValueStateText("Please select Incoterms from the list");
    aErrors.push("Incoterms (must be selected from list)");
  }

  // 4b. Plant
  var oPlant = this.byId("headerPlantInput");
  if (oPlant) {
    if (!oHeader.Plant || oHeader.Plant.trim() === "") {
      oPlant.setValueState("Error");
      oPlant.setValueStateText("Please select Plant");
      aErrors.push("Plant");
    } else if (!this._bPlantSelected) {
      oPlant.setValueState("Error");
      oPlant.setValueStateText("Please select Plant from the list");
      aErrors.push("Plant (must be selected from list)");
    }
  }

  // 5. NFA Title (header field only)
  var oNfaTitleInput = this.byId("nfaTitleHeaderInput");
  if (!oHeader.NfaTitle || oHeader.NfaTitle.trim() === "") {
    if (oNfaTitleInput) { oNfaTitleInput.setValueState("Error"); oNfaTitleInput.setValueStateText("Please enter NFA Title"); }
    aErrors.push("NFA Title");
  } else if (oHeader.NfaTitle.length > 30) {
    if (oNfaTitleInput) { oNfaTitleInput.setValueState("Error"); oNfaTitleInput.setValueStateText("NFA Title cannot exceed 30 characters"); }
    aErrors.push("NFA Title (max 30 characters)");
  } else {
    if (oNfaTitleInput) { oNfaTitleInput.setValueState("None"); }
  }

  // 6. Long Text
  if (!oHeader.Description || oHeader.Description.trim() === "") {
    aErrors.push("Long Text");
  }

  // 6. Other Terms amount validation
  var aOtherTerms = [
    { flag: oHeader.LdClause,      amt: oHeader.LdClauseAmt,      id: "ldClauseAmtInput",      label: "LD Clause %" },
    { flag: oHeader.AdvanceBg,     amt: oHeader.AdavanceBgAmt,    id: "advanceBgAmtInput",     label: "Advance B.G. %" },
    { flag: oHeader.PerformanceBg, amt: oHeader.PerformanceBpAmt, id: "performanceBgAmtInput", label: "Performance B.G. %" }
  ];
  aOtherTerms.forEach(function (oTerm) {
    var oCtrl = this.byId(oTerm.id);
    if (oTerm.flag === "Yes" && (!oTerm.amt || String(oTerm.amt).trim() === "" || oTerm.amt === "0")) {
      if (oCtrl) { oCtrl.setValueState("Error"); oCtrl.setValueStateText(oTerm.label + " is mandatory"); }
      aErrors.push(oTerm.label);
    } else if (oTerm.flag === "Yes" && parseFloat(oTerm.amt) > 100) {
      if (oCtrl) { oCtrl.setValueState("Error"); oCtrl.setValueStateText(oTerm.label + " must be less than or equal to 100"); }
      aErrors.push(oTerm.label + " must be less than or equal to 100");
    } else if (oTerm.flag === "Yes") {
      if (oCtrl) oCtrl.setValueState("None");
    }
  }.bind(this));

  // 5. Justification checkbox
  if (!oHeader.LowestBasis && !oHeader.TechAccepLowBasis && !oHeader.ProprietaryBasis &&
      !oHeader.SingleTenderBasis && !oHeader.RepeatOrderBasis && !oHeader.RateContract &&
      !oHeader.Regularization && !oHeader.FinalSettlement && !oHeader.ProjectTeamRecommendation) {
    aErrors.push("Justification For Price (select at least one)");
  }

  if (!this._validateRepeatOrderPrevPoNo(false)) {
    aErrors.push("Prev. PO No.");
  }

  if (aErrors.length) {
    var sMessage = "Please fill the following required fields:\n\n";
    aErrors.forEach(function (sField, i) {
      sMessage += (i + 1) + ". " + sField + "\n";
    });
    MessageBox.error(sMessage);
    return false;
  }

  return true;
},

_validateRepeatOrderPrevPoNo: function (bShowMessage) {
  var oViewModel = this.getView().getModel("viewModel");
  var oHeader = oViewModel.getProperty("/header");
  var oPrevPoNo = this.byId("prevPoNoInput");

  if (oHeader.RepeatOrder === "X" && (!oHeader.RefPoNo || String(oHeader.RefPoNo).trim() === "")) {
    if (oPrevPoNo) {
      oPrevPoNo.setValueState("Error");
      oPrevPoNo.setValueStateText("This field is required");
    }
    if (bShowMessage) {
      MessageBox.error("Please fill the following required fields:\n\n1. Prev. PO No.");
    }
    return false;
  }

  if (oHeader.RepeatOrder === "X" && oHeader.RefPoNo && !/^[0-9]+$/.test(String(oHeader.RefPoNo).trim())) {
    if (oPrevPoNo) {
      oPrevPoNo.setValueState("Error");
      oPrevPoNo.setValueStateText("Only numeric values are allowed");
    }
    if (bShowMessage) {
      MessageBox.error("Prev. PO No. must contain numeric values only.");
    }
    return false;
  }

  if (oPrevPoNo) {
    oPrevPoNo.setValueState("None");
    oPrevPoNo.setValueStateText("");
  }

  return true;
},

_validateVendors: function () {
  var oViewModel = this.getView().getModel("viewModel");
  var aVendors = oViewModel.getProperty("/vendors") || [];
  var aErrors = [];

  aVendors.forEach(function (oVendor, iIndex) {
    var iRow = iIndex + 1;
    var sLabel = "Row " + iRow + " (" + (oVendor.vendorName || "Vendor") + ")";
    if (!oVendor.PaymentTerms || String(oVendor.PaymentTerms).trim() === "") {
      aErrors.push(sLabel + ": Payment Terms is mandatory");
    }
    if (oVendor.technicalAcceptability === "Yes" && (!oVendor.technicalRating || String(oVendor.technicalRating).trim() === "")) {
      aErrors.push(sLabel + ": Technical Rating is mandatory when Tech. Acceptability is Yes");
    }
    if (oVendor.vendorQualification === "Yes" && (!oVendor.vendorQualificationScore || String(oVendor.vendorQualificationScore).trim() === "")) {
      aErrors.push(sLabel + ": Qualification Score is mandatory when Vendor Qualification is Yes");
    }
  });

  if (aErrors.length) {
    MessageBox.error(aErrors.join("\n"));
    return false;
  }
  return true;
},

onPrevPoNoLiveChange: function (oEvent) {
  var oControl = oEvent.getSource();
  var sValue = oEvent.getParameter("value");
  var sClean = sValue.replace(/[^0-9]/g, "");
  if (sClean !== sValue) {
    oControl.setValue(sClean);
    this.getView().getModel("viewModel").setProperty("/header/RefPoNo", sClean);
    oControl.setValueState("Error");
    oControl.setValueStateText("Only numeric values are allowed");
  } else if (sClean === "") {
    oControl.setValueState("None");
  } else {
    oControl.setValueState("None");
  }
  this._bIsDirty = true;
},

onNfaTitleLiveChange: function (oEvent) {
  var oControl = oEvent.getSource();
  var sValue = oEvent.getParameter("value") || "";
  if (sValue.length > 30) {
    oControl.setValueState("Error");
    oControl.setValueStateText("NFA Title cannot exceed 30 characters");
  } else {
    oControl.setValueState("None");
  }
  this._bIsDirty = true;
},

onNfaTypeCheckbox: function (oEvent) {
  var bSelected = oEvent.getParameter("selected");
  var oViewModel = this.getView().getModel("viewModel");
  oViewModel.setProperty("/header/RepeatOrder", bSelected ? "X" : "");
  if (!bSelected) {
    oViewModel.setProperty("/header/RefPoNo", "");
  }
  oViewModel.setProperty("/prevPoReadOnly", false);
  this._bIsDirty = true;
},

onFieldChange: function (oEvent) {
  var oControl = oEvent.getSource();
  var sValue = oControl.getValue ? oControl.getValue() : oControl.getSelectedKey();
  if (sValue && sValue.trim() !== "") {
    oControl.setValueState("None");
  }
  this._bIsDirty = true;
},

onVHFieldChange: function (oEvent) {
  var oControl = oEvent.getSource();
  var sId = oControl.getId ? oControl.getId() : "";
  var sVal = oControl.getValue ? oControl.getValue() : "";
  var oViewModel = this.getView().getModel("viewModel");
  var aItems, fnMatch, sKeyProp;

  if (sId.indexOf("companyCodeInput") !== -1) {
    aItems = this._aCompanyCodeItems || [];
    sKeyProp = "/header/CompanyCode";
    fnMatch = function (o) {
      return o.Description === sVal || o.KeyDataType === sVal ||
             (o.KeyDataType + " - " + o.Description) === sVal;
    };
    // Reset Purchase Org whenever Company Code changes
    oViewModel.setProperty("/header/PurchaseOrg", "");
    oViewModel.setProperty("/header/PurchaseOrgDesc", "");
    this._bPurchaseOrgSelected = false;
    this._aPurchaseOrgItems = null;
    this.byId("purchaseOrgInput").setValueState("None");
  } else if (sId.indexOf("purchaseOrgInput") !== -1) {
    aItems = this._aPurchaseOrgItems || [];
    sKeyProp = "/header/PurchaseOrg";
    fnMatch = function (o) {
      return o.PurOrgDesc === sVal || o.PurOrg === sVal ||
             (o.PurOrg + " - " + o.PurOrgDesc) === sVal;
    };
  } else if (sId.indexOf("purchaseGroupInput") !== -1) {
    aItems = this._aPurchaseGroupItems || [];
    sKeyProp = "/header/PurchaseGroup";
    fnMatch = function (o) {
      return o.Eknam === sVal || o.Ekgrp === sVal ||
             (o.Ekgrp + " - " + o.Eknam) === sVal;
    };
  } else if (sId.indexOf("currencyInput") !== -1) {
    aItems = this._aCurrencyItems || [];
    sKeyProp = "/header/Currency";
    fnMatch = function (o) {
      return o.Description === sVal || o.KeyDataType === sVal ||
             (o.KeyDataType + " - " + o.Description) === sVal;
    };
  } else if (sId.indexOf("incotermsInput") !== -1) {
    aItems = this._aIncotermsItems || [];
    sKeyProp = "/header/Incoterm";
    fnMatch = function (o) {
      return o.Description === sVal || o.KeyDataType === sVal ||
             (o.KeyDataType + " - " + o.Description) === sVal;
    };
  } else if (sId.indexOf("headerPlantInput") !== -1) {
    aItems = this._aHeaderPlantItems || [];
    sKeyProp = "/header/Plant";
    fnMatch = function (o) {
      return o.PlantDesc === sVal || o.Plant === sVal ||
             (o.Plant + " - " + o.PlantDesc) === sVal;
    };
  } else {
    this._bIsDirty = true;
    return;
  }

  // empty value — just mark error
  if (!sVal || sVal.trim() === "") {
    oControl.setValueState("Error");
    oControl.setValueStateText("This field is required");
    oViewModel.setProperty(sKeyProp, "");
    this._bIsDirty = true;
    return;
  }

  // check if typed value matches a valid list entry
  var bValid = aItems.length > 0 && aItems.some(fnMatch);
  if (!bValid && aItems.length > 0) {
    // invalid free-text — clear the key and show error
    oControl.setValueState("Error");
    oControl.setValueStateText("Please select a valid value from the list");
    oViewModel.setProperty(sKeyProp, "");
  } else {
    oControl.setValueState("None");
  }
  this._bIsDirty = true;
},

onCharLimitChange: function (oEvent) {
  var oControl = oEvent.getSource();
  var sBinding = oControl.getBindingPath("value");
  var sValue = oEvent.getParameter("value");
  this.getView().getModel("viewModel").setProperty("/header/" + sBinding.split("/").pop(), sValue);
},

onTextAreaLimitChange: function (oEvent) {
  var oControl = oEvent.getSource();
  var iMax = oControl.getMaxLength();
  var sValue = oEvent.getParameter("value");
  if (sValue.length > iMax) {
    sValue = sValue.substring(0, iMax);
    oControl.setValue(sValue);
  }
  var sPath = oControl.getBindingPath("value");
  this.getView().getModel("viewModel").setProperty(sPath, sValue);
},

onPercentageChange: function (oEvent) {
  var oControl = oEvent.getSource();
  var sValue = oEvent.getParameter("value");

  // Remove any non-numeric characters except decimal point
  sValue = sValue.replace(/[^0-9.]/g, "");

  // Limit decimal to 2 places
  if (sValue.indexOf(".") !== -1) {
    var parts = sValue.split(".");
    sValue = parts[0] + "." + parts[1].substring(0, 2);
  }

  var fValue = parseFloat(sValue);

  if (sValue && fValue > 100) {
    oControl.setValueState("Error");
    oControl.setValueStateText("Value must be less than or equal to 100");
  } else {
    oControl.setValueState("None");
  }

  // Update the model
  var sBinding = oControl.getBindingPath("value");
  if (sBinding) {
    this.getView().getModel("viewModel").setProperty(sBinding, sValue);
  }
},
     onSaveDraft: function () {
  if (!this._validateForm()) {
    return;
  }
  if (!this._validateVendors()) {
    return;
  }
  this._saveData();
},


      // _saveData: function () {
      //     var oViewModel = this.getView().getModel("viewModel");
      //     var oODataModel = this.getOwnerComponent().getModel();
      //     var oHeader = oViewModel.getProperty("/header");
      //     var aVendors = oViewModel.getProperty("/vendors");

      //     var oPayload = {
      //       NfaRefNo: oHeader.NfaRefNo || "",
      //       PoNo: oHeader.PoNo || "",
      //       ContractNo: oHeader.ContractNo || "",
      //       SchlAgreementNo: oHeader.SchlAgreementNo || "",
      //       AribaDocNo: oHeader.AribaDocNo || "",
      //       NfaType: oHeader.NfaType || "",
      //       SuggestedVendor: oHeader.SuggestedVendor || "",
      //       ProposedVendor: oHeader.ProposedVendor || "",
      //       PurchaseOrg: oHeader.PurchaseOrg || "",
      //       Remarks: oHeader.Remarks || "",
      //       BiDate: this._formatDateForBackend(oHeader.BiDate),
      //       Commodity: oHeader.Commodity || "",
      //       CompanyCode: oHeader.CompanyCode || "",
      //       PrBudget: String(oHeader.PrBudget || "0"),
      //       Description: oHeader.Description || "",
      //       LdClause: oHeader.LdClause || "",
      //       AdvanceBg: oHeader.AdvanceBg || "",
      //       AdavanceBgAmt: String(oHeader.AdavanceBgAmt || "0"),
      //       PerformanceBg: oHeader.PerformanceBg || "",
      //       PerformanceBpAmt: String(oHeader.PerformanceBpAmt || "0"),
      //       LowestBasis: oHeader.LowestBasis || "",
      //       TechAccepLowBasis: oHeader.TechAccepLowBasis || "",
      //       ProprietaryBasis: oHeader.ProprietaryBasis || "",
      //       SingleTenderBasis: oHeader.SingleTenderBasis || "",
      //       RepeatOrderBasis: oHeader.RepeatOrderBasis || "",
      //       RateContract: oHeader.RateContract || "",
      //       JustificationRemarks: oHeader.JustificationRemarks || "",
      //       ScopeOfWork: oHeader.ScopeOfWork || "",
      //       AdditionalInfo: oHeader.AdditionalInfo || "",
      //       NegotiationStrategy: oHeader.NegotiationStrategy || "",
      //       VendorCategory: oHeader.VendorCategory || "",
      //     };

      //     oODataModel.create("/et_nfa_detailsSet", oPayload, {
      //       success: function (oData) {
      //         MessageBox.success("NFA draft saved successfully");
      //         var sNfaRefNo = oData.NfaRefNo;
      //         oViewModel.setProperty("/header/NfaRefNo", sNfaRefNo);
      //         oViewModel.setProperty("/nfaDraftSaved", true);
              
      //         if (aVendors && aVendors.length) {
      //           this._saveVendorDetails(sNfaRefNo, aVendors);
      //         }
      //         this._checkSubmitVisibility();
      //       }.bind(this),
      //       error: function () {
      //         MessageBox.error("Error saving draft");
      //       },
      //     });
      //   },


      _saveData: function () {
  var oViewModel = this.getView().getModel("viewModel");
  var oODataModel = this.getOwnerComponent().getModel();
  var oHeader = oViewModel.getProperty("/header");
  var aVendors = oViewModel.getProperty("/vendors");
  var sNfaRefNo = oHeader.NfaRefNo;
  var that = this;

  var oPayload = {
    NfaRefNo: sNfaRefNo || "",
    Version: String(oViewModel.getProperty("/nfaVersion") || "0"),
    AribaDocNo: oHeader.AribaDocNo || "",
    NfaType: oHeader.NfaType || "",
    RepeatOrder: oHeader.RepeatOrder || "",
    NfaTypeDesc: oHeader.NfaTypeDesc || "",
    NfaTitle: oHeader.NfaTitle || oHeader.NfaTypeDesc || "",
    PurchaseOrg: oHeader.PurchaseOrg || "",
    PurchaseOrgDesc: oHeader.PurchaseOrgDesc || "",
    PurchaseGroup: oHeader.PurchaseGroup || "",
    PurchaseGroupDesc: oHeader.PurchaseGroupDesc || "",
    Remarks: oHeader.Remarks || "",
    BiDate: this._formatDateForBackend(oHeader.BiDate),
    CompanyCode: oHeader.CompanyCode || "",
    CompanyDescription: oHeader.CompanyDescription || "",
    PrBudget: String(oHeader.PrBudget || "0"),
    WbsBudget: String(oHeader.WbsBudget || "0"),
    BaselineSpend: String(oHeader.BaselineSpend || "0"),
    OldPO: oHeader.RefPoNo || "",
    Currency: oHeader.Currency || "",
    CurrencyDesc: oHeader.CurrencyDesc || "",
    LongText: oHeader.Description || "",
    Incoterm: oHeader.Incoterm || "",
    IncotermDesc: oHeader.IncotermDesc || "",
    TbdDate: this._formatDateForBackend(oHeader.TbdDate),
    Plant: oHeader.Plant || "",
    PlantDesc: oHeader.PlantDesc || "",
    OtherTerms: oHeader.OtherTerms || "",
    LdClause: oHeader.LdClause || "No",
    LdClauseAmt: oHeader.LdClauseAmt || "0",
    AdvanceBg: oHeader.AdvanceBg || "No",
    AdavanceBgAmt: oHeader.AdavanceBgAmt || "0",
    PerformanceBg: oHeader.PerformanceBg || "No",
    PerformanceBpAmt: oHeader.PerformanceBpAmt || "0",
    Cpbg: oHeader.Cpbg || "No",
    CpbgAmt: oHeader.CpbgAmt || "0",
    LowestBasis: oHeader.LowestBasis || "",
    TechAccepLowBasis: oHeader.TechAccepLowBasis || "",
    ProprietaryBasis: oHeader.ProprietaryBasis || "",
    SingleTenderBasis: oHeader.SingleTenderBasis || "",
    RepeatOrderBasis: oHeader.RepeatOrderBasis || "",
    RateContract: oHeader.RateContract || "",
    Regularization: oHeader.Regularization || "",
    FinalSettlement: oHeader.FinalSettlement || "",
    ProjectTeamRecommendation: oHeader.ProjectTeamRecommendation || "",
    JustificationRemarks: oHeader.JustificationRemarks || "",
    ScopeOfWork: oHeader.ScopeOfWork || "",
    AdditionalInfo: oHeader.AdditionalInfo || "",
    NegotiationStrategy: oHeader.NegotiationStrategy || "",
    VendorCategory: oHeader.VendorCategory || "",
    RequestedApprovalOn: oHeader.RequestedApprovalOn || "",
    Status: "Draft",
    CreatedBy: oHeader.CreatedBy || "",
    DocCreated: oHeader.DocCreated || ""
  };

  sap.ui.core.BusyIndicator.show(0);

  var fnSuccess = function (oData) {
    var sSavedRef = (oData && oData.NfaRefNo) ? oData.NfaRefNo : sNfaRefNo;
    oViewModel.setProperty("/header/NfaRefNo", sSavedRef);
    if (oData && oData.CreatedBy) {
      oViewModel.setProperty("/header/CreatedBy", oData.CreatedBy);
    }
    // Refresh version from backend after save
    if (oData && oData.Version) {
      oViewModel.setProperty("/nfaVersion", parseInt(oData.Version) || null);
    }
    // Also do a fresh GET to ensure version and CreatedBy are up to date
    that.getOwnerComponent().getModel().read("/et_nfa_detailsSet", {
      filters: [new Filter("NfaRefNo", FilterOperator.EQ, sSavedRef)],
      forceServerDataRequest: true,
      success: function (oRefreshData) {
        var oRefreshed = (oRefreshData.results || [])[0];
        if (oRefreshed) {
          oViewModel.setProperty("/nfaVersion", parseInt(oRefreshed.Version) || null);
          if (oRefreshed.CreatedBy) {
            oViewModel.setProperty("/header/CreatedBy", oRefreshed.CreatedBy);
          }
        }
      }
    });
    oViewModel.setProperty("/nfaDraftSaved", true);
    oViewModel.setProperty("/isEditMode", false);
    that._bIsDirty = false;
    that._updateCompanyCodeEditable();
    if (aVendors && aVendors.length) {
      that._saveVendorDetails(sSavedRef, aVendors, oHeader.BiDate);
    } else {
      sap.ui.core.BusyIndicator.hide();
      MessageBox.success("Draft saved successfully", {
        onClose: function () {
          oViewModel.setProperty("/isEditMode", false);
        }
      });
      that._checkSubmitVisibility();
    }
    that._postBuyerAttachments(sSavedRef);
  };

  var fnError = function () {
    sap.ui.core.BusyIndicator.hide();
    MessageBox.error("NFA save failed. Draft not saved.");
  };

  oODataModel.create("/et_nfa_detailsSet", oPayload, {
    success: fnSuccess,
    error: fnError
  });
},

//       _saveData: function () {
//   var oViewModel = this.getView().getModel("viewModel");
//   var oODataModel = this.getOwnerComponent().getModel();
//   var oHeader = oViewModel.getProperty("/header");
//   var aVendors = oViewModel.getProperty("/vendors");

//   var oPayload = {
//     NfaRefNo: oHeader.NfaRefNo || "",
//     PoNo: oHeader.PoNo || "",
//     ContractNo: oHeader.ContractNo || "",
//     SchlAgreementNo: oHeader.SchlAgreementNo || "",
//     AribaDocNo: oHeader.AribaDocNo || "",
//     NfaType: oHeader.NfaType || "",
//     NfaTypeDesc: oHeader.NfaTypeDesc || "",
//     SuggestedVendor: oHeader.SuggestedVendor || "",
//    // SuggestedVendorDesc: oHeader.SuggestedVendorDesc || "",
//     ProposedVendor: oHeader.ProposedVendor || "",
//     ProposedVendorDesc: oHeader.ProposedVendorDesc || "",
//     PurchaseOrg: oHeader.PurchaseOrg || "",
//    // PurchaseOrgDesc: oHeader.PurchaseOrgDesc || "",
//     PurchaseGroup: oHeader.PurchaseGroup || "",
//    // PurchaseGroupDesc: oHeader.PurchaseGroupDesc || "",
//     Remarks: oHeader.Remarks || "",
//     BiDate: this._formatDateForBackend(oHeader.BiDate),
//    // Commodity: oHeader.Commodity || "",
//    // CommodityDesc: oHeader.CommodityDesc || "",
//     CompanyCode: oHeader.CompanyCode || "",
//    // CompanyDescription: oHeader.CompanyCodeDesc || "",
//     PrBudget: String(oHeader.PrBudget || "0"),
//     Description: oHeader.Description || "",
//     LdClause: oHeader.LdClause || "",
//     AdvanceBg: oHeader.AdvanceBg || "",
//     AdavanceBgAmt: String(oHeader.AdavanceBgAmt || "0"),
//     PerformanceBg: oHeader.PerformanceBg || "",
//     PerformanceBpAmt: String(oHeader.PerformanceBpAmt || "0"),
//     LowestBasis: oHeader.LowestBasis || "",
//     TechAccepLowBasis: oHeader.TechAccepLowBasis || "",
//     ProprietaryBasis: oHeader.ProprietaryBasis || "",
//     SingleTenderBasis: oHeader.SingleTenderBasis || "",
//     RepeatOrderBasis: oHeader.RepeatOrderBasis || "",
//     RateContract: oHeader.RateContract || "",
//     JustificationRemarks: oHeader.JustificationRemarks || "",
//     ScopeOfWork: oHeader.ScopeOfWork || "",
//     AdditionalInfo: oHeader.AdditionalInfo || "",
//     NegotiationStrategy: oHeader.NegotiationStrategy || "",
//     VendorCategory: oHeader.VendorCategory || "",
//   };

//   oODataModel.create("/et_nfa_detailsSet", oPayload, {
//     success: function (oData) {
//       MessageBox.success("NFA draft saved successfully");
//       var sNfaRefNo = oData.NfaRefNo;
//       oViewModel.setProperty("/header/NfaRefNo", sNfaRefNo);
//       oViewModel.setProperty("/nfaDraftSaved", true);
      
//       if (aVendors && aVendors.length) {
//         this._saveVendorDetails(sNfaRefNo, aVendors);
//       }
//       this._checkSubmitVisibility();
//     }.bind(this),
//     error: function () {
//       MessageBox.error("Error saving draft");
//     },
//   });
// }


_postBuyerAttachments: function (sNfaRefNo) {
  var oBuyerModel = this.getView().getModel("buyerDocs");
  var aItems = oBuyerModel.getProperty("/items") || [];
  var oODataModel = this.getOwnerComponent().getModel();
  var that = this;

  // All rows that are not already uploaded, plus Modified rows (re-browsed file)
  var aPending = aItems.filter(function (o) {
    return o.status !== "Uploaded";
  });

  if (!aPending.length) {
    sap.ui.core.BusyIndicator.hide();
    that._loadBuyerAttachments(sNfaRefNo);
    return;
  }

  var aFileRows = aPending.filter(function (o) { return (that._buyerRowFiles || {})[aItems.indexOf(o)]; });
  var aLinkOnlyRows = aPending.filter(function (o) { return !(that._buyerRowFiles || {})[aItems.indexOf(o)]; });

  var aReaders = aFileRows.map(function (oRow) {
    var iIdx = aItems.indexOf(oRow);
    return new Promise(function (resolve, reject) {
      var oReader = new FileReader();
      oReader.onload = function (e) { resolve({ idx: iIdx, row: oRow, base64: e.target.result.split(",")[1] }); };
      oReader.onerror = reject;
      oReader.readAsDataURL(that._buyerRowFiles[iIdx]);
    });
  });

  Promise.all(aReaders).then(function (aFileResults) {
    var aLinkResults = aLinkOnlyRows.map(function (oRow) {
      return { idx: aItems.indexOf(oRow), row: oRow, base64: "" };
    });
    var aAllResults = aFileResults.concat(aLinkResults);

    var aBuyItems = aAllResults.map(function (r) {
      var sFileName = r.row.BuyerFileName || r.row.BuyerDocName || ("DOC_" + r.idx);
      return {
        NfaRefNo: sNfaRefNo,
        BuyerFileName: sFileName,
        Check_box: r.row.Check_box || "",
        BuyerDocName: r.row.BuyerDocName || "",
        BuyerDocMime: that._getMimeTypeShort(r.row.mimeType || ""),
        BuyerFileData: r.base64 || "",
        BuyerSpl: r.row.BuyerSpl || ""
      };
    });

    oODataModel.create("/et_attachHeadSet", { NfaRefNo: sNfaRefNo, ATTACH_BUY: { results: aBuyItems } }, {
      groupId: "nfa_attach_" + Date.now(),
      changeSetId: "nfa_attach_cs_" + Date.now(),
      success: function () {
        aAllResults.forEach(function (r) {
          oBuyerModel.setProperty("/items/" + r.idx + "/status", "Uploaded");
          oBuyerModel.setProperty("/items/" + r.idx + "/statusState", "Success");
          if (that._buyerRowFiles) { delete that._buyerRowFiles[r.idx]; }
          if (that._originalSpl) { that._originalSpl[r.idx] = r.row.BuyerSpl || ""; }
        });
        sap.ui.core.BusyIndicator.hide();
        that._loadBuyerAttachments(sNfaRefNo);
      },
      error: function (oError) {
        var sMsg = "Buyer attachment upload failed";
        try { sMsg += ": " + JSON.parse(oError.responseText).error.message.value; } catch (e) {}
        sap.ui.core.BusyIndicator.hide();
        MessageBox.error(sMsg);
      }
    });
  }).catch(function () {
    MessageBox.error("Error reading buyer attachment files.");
  });
},

_saveVendorDetails: function (sNfaRefNo, aVendors, sBiDate) {
  var oODataModel = this.getOwnerComponent().getModel();
  var oViewModel = this.getView().getModel("viewModel");
  var that = this;
  var sDeliveryDate = that._formatDateForBackend(sBiDate);

  // Assign decremented vendor numbers (9999999999, 9999999998, ...) to vendors without a vendorNo
  var iNext = 9999999999;
  aVendors.forEach(function (item) {
    if (!item.vendorNo) {
      item.vendorNo = String(iNext--);
    }
  });

  var oVendorPayload = {
    NfaRefNo: sNfaRefNo,
    Version: String(oViewModel.getProperty("/nfaVersion") || "0"),
    VENDOR_ITEMS: aVendors.map(function (item) {
      return {
        NfaRefNo:         sNfaRefNo,
        Version:          String(oViewModel.getProperty("/nfaVersion") || "0"),
        VendorNo:         item.vendorNo || "",
        VendorName:       item.vendorName || "",
        Plant:            item.plant || "",
        TotalPrice:       parseFloat(item.totalPrice || 0).toFixed(3),
        Ta:               item.technicalAcceptability || "No",
        TechinicalRating: item.technicalAcceptability === "Yes" ? (item.technicalRating || "") : "No",
        VendorQa:         item.vendorQualification || "No",
        QualifScore:      item.vendorQualification === "Yes" ? (item.vendorQualificationScore || "") : "No",
        BasicTotalAmt:    parseFloat(item.basicTotalAmt || 0).toFixed(3),
        PfPercent:        parseFloat(item.pfPercent || 0).toFixed(3),
        PfAmount:         parseFloat(item.pfAmount || 0).toFixed(3),
        Freight:          parseFloat(item.freight || 0).toFixed(3),
        GstPercentage:    item.gstPercentage || "",
        GstAmount:        parseFloat(item.gstAmount || 0).toFixed(3),
        Insurance:        parseFloat(item.insurance || 0).toFixed(3),
        NetLandedCost:    parseFloat(item.netLandedCost || 0).toFixed(3),
        CommercialRating: item.commercialRating || "",
        DeliveryDate:     sDeliveryDate,
        PaymentTerms:     item.PaymentTerms || "",
        PaymentTermsDesc: item.paymentTermsDesc || "",
        PurchaseOrder:    item.poNo || "",
        ContractNo:       item.contractNo || "",
        SchlAgreementNo:  item.schedulingAgreementNo || "",
        VendorIceFlag:    item.vendorIceFlag || "",
        LoadingComments:        item.LoadingComments || "",
        CommercialLoading:      parseFloat(item.CommercialLoading || 0).toFixed(3),
      };
    }),
  };

  oODataModel.create("/et_vendor_detailsSet", oVendorPayload, {
    groupId: "nfa_vendor_" + Date.now(),
    changeSetId: "nfa_vendor_cs_" + Date.now(),
    success: function (oData) {
      oViewModel.setProperty("/vendorDraftSaved", true);
      // Post any staged supplier attachments now that vendor details are saved
      that._postStagedSupplierAttachments(sNfaRefNo, function () {
        sap.ui.core.BusyIndicator.hide();
        MessageBox.success("Draft saved successfully", {
          onClose: function () {
            oViewModel.setProperty("/isEditMode", false);
          }
        });
        that._checkSubmitVisibility();
      });
    },
    error: function (oError) {
      var sMsg = "Vendor save failed. NFA draft saved, vendor details not saved.";
      try { sMsg += "\nReason: " + JSON.parse(oError.responseText).error.message.value; } catch(e) {}
      sap.ui.core.BusyIndicator.hide();
      MessageBox.error(sMsg);
    },
  });
},


          _checkSubmitVisibility: function () {
              var oViewModel = this.getView().getModel("viewModel");
              var bNfaSaved = oViewModel.getProperty("/nfaDraftSaved");
              var bVendorSaved = oViewModel.getProperty("/vendorDraftSaved");

              if (bNfaSaved && bVendorSaved) {
                oViewModel.setProperty("/showSubmit", true);
              }
            },

            _submitData: function () {
              MessageBox.success("Data submitted successfully");
              this.getOwnerComponent().getRouter().navTo("RoutenfaCreator");
            },
            onSubmit: function () {
              if (this._validateForm()) {
                this._submitData();
              }
            },

// ============= SEQUENTIAL POSTING METHODS =============

_executeSequentialPost: function () {
  var oViewModel = this.getView().getModel("viewModel");
  var oODataModel = this.getOwnerComponent().getModel();
  var oHeader = oViewModel.getProperty("/header");
  var aVendors = oViewModel.getProperty("/vendors");
  var that = this;

  // Step 1: Post NFA Details
  var oNfaPayload = {
    Mandt: "",
    NfaRefNo: "",
    Version: oViewModel.getProperty("/nfaVersion") || "",
    AribaDocNo: oHeader.AribaDocNo || "",
    NfaType: oHeader.NfaType || "",
    NfaTypeDesc: oHeader.NfaTypeDesc || "",
    NfaTitle: oHeader.ContractNo || "",
    PurchaseOrg: oHeader.PurchaseOrg || "",
    PurchaseOrgDesc: oHeader.PurchaseOrgDesc || "",
    PurchaseGroup: oHeader.PurchaseGroup || "",
    PurchaseGroupDesc: oHeader.PurchaseGroupDesc || "",
    Remarks: oHeader.Remarks || "",
    BiDate: this._formatDateForBackend(oHeader.BiDate),
    CompanyCode: oHeader.CompanyCode || "",
    CompanyDescription: oHeader.CompanyDescription || "",
    PrBudget: String(oHeader.PrBudget || "0"),
    WbsBudget: String(oHeader.WbsBudget || "0"),
    WbsBudget: String(oHeader.WbsBudget || "0"),
    Old_PO: oHeader.RefPoNo || "",
    LongText: oHeader.Description || "",
    LdClause: oHeader.LdClause || "No",
    AdvanceBg: oHeader.AdvanceBg || "No",
    AdavanceBgAmt: String(oHeader.AdavanceBgAmt || "0"),
    PerformanceBg: oHeader.PerformanceBg || "No",
    PerformanceBpAmt: String(oHeader.PerformanceBpAmt || "0"),
    LowestBasis: oHeader.LowestBasis || "",
    TechAccepLowBasis: oHeader.TechAccepLowBasis || "",
    ProprietaryBasis: oHeader.ProprietaryBasis || "",
    SingleTenderBasis: oHeader.SingleTenderBasis || "",
    RepeatOrderBasis: oHeader.RepeatOrderBasis || "",
    RateContract: oHeader.RateContract || "",
    Regularization: oHeader.Regularization || "",
    FinalSettlement: oHeader.FinalSettlement || "",
    ProjectTeamRecommendation: oHeader.ProjectTeamRecommendation || "",
    Regularization: oHeader.Regularization || "",
    FinalSettlement: oHeader.FinalSettlement || "",
    ProjectTeamRecommendation: oHeader.ProjectTeamRecommendation || "",
    Regularization: oHeader.Regularization || "",
    FinalSettlement: oHeader.FinalSettlement || "",
    ProjectTeamRecommendation: oHeader.ProjectTeamRecommendation || "",
    JustificationRemarks: oHeader.JustificationRemarks || "",
    ScopeOfWork: oHeader.ScopeOfWork || "",
    AdditionalInfo: oHeader.AdditionalInfo || "",
    NegotiationStrategy: oHeader.NegotiationStrategy || "",
    VendorCategory: oHeader.VendorCategory || "",
    RequestedApprovalOn: this._formatDateForBackend(oHeader.BiDate),
    Status: "Pending"
  };

  oODataModel.create("/et_nfa_detailsSet", oNfaPayload, {
    success: function (oData) {
      var sNfaRefNo = oData.NfaRefNo;
      MessageToast.show("NFA Posted! Ref: " + sNfaRefNo);
      oViewModel.setProperty("/header/NfaRefNo", sNfaRefNo);
      
      // Step 2: Post Vendor Details
      that._postVendorDetailsSequential(sNfaRefNo, aVendors);
    },
    error: function (oError) {
      MessageBox.error("NFA Post Failed");
      console.error(oError);
    }
  });
},

_postVendorDetailsSequential: function (sNfaRefNo, aVendors) {
  var oODataModel = this.getOwnerComponent().getModel();
  var that = this;

  // Assign decremented vendor numbers (9999999999, 9999999998, ...) to vendors without a vendorNo
  var iNext = 9999999999;
  aVendors.forEach(function (item) {
    if (!item.vendorNo) {
      item.vendorNo = String(iNext--);
    }
  });

  var oVendorPayload = {
    NfaRefNo: sNfaRefNo,
    Version: that.getView().getModel("viewModel").getProperty("/nfaVersion") || "",
    VENDOR_ITEMS: aVendors.map(function (item) {
      return {
        NfaRefNo: sNfaRefNo,
        Version: that.getView().getModel("viewModel").getProperty("/nfaVersion") || "",
        VendorNo: item.vendorNo || "",
        VendorName: item.vendorName || "",
        Plant: item.plant || "",
        InitialPrice: String(item.initialPrice || "0"),
        NegotiatedPrice: String(item.negotiatedAmount || "0"),
        TotalPrice: String(item.negotiatedAmount || "0"),
        Lpp: String(item.lpp || "0"),
        Ta:               item.technicalAcceptability || "No",
        TechinicalRating: item.technicalAcceptability === "Yes" ? (item.technicalRating || "") : "No",
        VendorQa:         item.vendorQualification || "No",
        QualifScore:      item.vendorQualification === "Yes" ? (item.vendorQualificationScore || "") : "No",
        PaymentTerms:     item.PaymentTerms || "",
        VendorIceFlag:    item.vendorIceFlag || ""
      };
    })
  };

  oODataModel.create("/et_vendor_detailsSet", oVendorPayload, {
    success: function (oData) {
      MessageToast.show("Vendor Details Posted!");
      
      // Navigate to QCS with NFA Ref for PR posting
      that.getOwnerComponent().getRouter().navTo("RouteQCS", {
        nfaRefNo: sNfaRefNo
      });
    },
    error: function (oError) {
      MessageBox.error("Vendor Post Failed");
      console.error(oError);
    }
  });
},

// ===== SUPPLIER ATTACHMENT DIALOG =====

onOpenVendorAttachDialog: function (oEvent) {
  var oCtx = oEvent.getSource().getBindingContext("viewModel");
  var oVendor = oCtx.getObject();
  var oViewModel = this.getView().getModel("viewModel");
  var sNfaRefNo = oViewModel.getProperty("/header/NfaRefNo");
  var oODataModel = this.getOwnerComponent().getModel();

  // Store staged files per vendor keyed by vendorNo
  this._supplierAttachMap = this._supplierAttachMap || {};
  var sKey = oVendor.vendorNo || ("idx_" + oCtx.getPath().split("/").pop());

  if (!this._supplierAttachMap[sKey]) {
    this._supplierAttachMap[sKey] = [];
  }

  // Use a shared JSONModel for the dialog
  if (!this._oAttachDialogModel) {
    this._oAttachDialogModel = new sap.ui.model.json.JSONModel();
  }

  this._oAttachDialogModel.setData({
    vendorNo: oVendor.vendorNo || "",
    vendorName: oVendor.vendorName || oVendor.vendorNo || "",
    nfaRefNo: sNfaRefNo || "",
    supplierSpl: "",
    stagedFiles: this._supplierAttachMap[sKey],
    fileCountText: this._supplierAttachMap[sKey].length ? this._supplierAttachMap[sKey].length + " document(s) selected." : "No documents selected yet.",
    existingFiles: [],
    fetchStatus: sNfaRefNo ? "Fetching existing documents..." : "Save draft first to see existing documents.",
    fetchStatusState: sNfaRefNo ? "Warning" : "None"
  });

  this._currentVendorKey = sKey;

  if (!this._oVendorAttachDialog) {
    this._oVendorAttachDialog = sap.ui.xmlfragment(
      this.getView().getId(),
      "com.df.nfa.creator_v2.view.fragments.VendorAttachDialog",
      this
    );
    this.getView().addDependent(this._oVendorAttachDialog);
  }
  this._oVendorAttachDialog.setModel(this._oAttachDialogModel, "testModel");
  this._oVendorAttachDialog.open();

  // Fetch existing if NFA ref is available
  if (sNfaRefNo && oVendor.vendorNo) {
    oODataModel.read("/et_attachment_supplierSet", {
      filters: [
        new Filter("NfaRefNo", FilterOperator.EQ, sNfaRefNo),
        new Filter("VendorNo", FilterOperator.EQ, oVendor.vendorNo)
      ],
      success: function (oData) {
        var aResults = (oData.results || []).map(function (o, i) {
          return Object.assign({}, o, { idx: i + 1 });
        });
        this._oAttachDialogModel.setProperty("/existingFiles", aResults);
        this._oAttachDialogModel.setProperty("/fetchStatus", aResults.length ? aResults.length + " document(s) found" : "No existing documents");
        this._oAttachDialogModel.setProperty("/fetchStatusState", aResults.length ? "Success" : "None");
      }.bind(this),
      error: function () {
        this._oAttachDialogModel.setProperty("/fetchStatus", "Failed to fetch existing documents");
        this._oAttachDialogModel.setProperty("/fetchStatusState", "Error");
      }.bind(this)
    });
  }
},

onAddVendorAttachRow: function () {
  var aStaged = this._oAttachDialogModel.getProperty("/stagedFiles") || [];
  aStaged.push({
    idx: aStaged.length + 1,
    fileName: "",
    mimeType: "",
    supplierSpl: "",
    _fileObject: null
  });
  this._oAttachDialogModel.setProperty("/stagedFiles", aStaged.slice());
  if (this._currentVendorKey) {
    this._supplierAttachMap[this._currentVendorKey] = aStaged;
  }
},

onVendorAttachRowFileChange: function (oEvent) {
  var oFileUploader = oEvent.getSource();
  var oDomRef = oFileUploader.getDomRef();
  var oNativeInput = oDomRef ? oDomRef.querySelector("input[type='file']") : null;
  var aFiles = oNativeInput ? oNativeInput.files : oEvent.getParameter("files");
  if (!aFiles || !aFiles.length) { return; }

  var oFile = aFiles[0];
  var oCtx = oFileUploader.getBindingContext("testModel");
  var iIdx = parseInt(oCtx.getPath().split("/").pop());
  var aStaged = this._oAttachDialogModel.getProperty("/stagedFiles") || [];
  aStaged[iIdx].fileName = oFile.name;
  aStaged[iIdx].mimeType = oFile.type || "application/octet-stream";
  aStaged[iIdx]._fileObject = oFile;
  this._oAttachDialogModel.setProperty("/stagedFiles", aStaged.slice());
  this._oAttachDialogModel.refresh(true);
  if (this._currentVendorKey) {
    this._supplierAttachMap[this._currentVendorKey] = aStaged;
  }
},

onVendorAttachFileChange: function (oEvent) {
  // legacy handler kept for safety — delegates to row-based
  this.onVendorAttachRowFileChange(oEvent);
},

onRemoveVendorAttachFile: function (oEvent) {
  var iIdx = parseInt(oEvent.getSource().getBindingContext("testModel").getPath().split("/").pop());
  var aStaged = this._oAttachDialogModel.getProperty("/stagedFiles");
  aStaged.splice(iIdx, 1);
  aStaged.forEach(function (o, i) { o.idx = i + 1; });
  this._oAttachDialogModel.setProperty("/stagedFiles", aStaged.slice());
  this._oAttachDialogModel.refresh(true);
  if (this._currentVendorKey) {
    this._supplierAttachMap[this._currentVendorKey] = aStaged;
  }
},

onPreviewVendorAttachment: function (oEvent) {
  var oCtx = oEvent.getSource().getBindingContext("testModel");
  var oFile = oCtx.getObject();
  if (!oFile._fileObject) { return; }
  window.open(URL.createObjectURL(oFile._fileObject), "_blank");
},

onPreviewExistingAttachment: function (oEvent) {
  var oCtx = oEvent.getSource().getBindingContext("testModel");
  var oFile = oCtx.getObject();
  if (!oFile.SupplierFileData) { MessageToast.show("No file data available to preview."); return; }
  var sByteChars = atob(oFile.SupplierFileData);
  var aBytes = new Uint8Array(sByteChars.length);
  for (var i = 0; i < sByteChars.length; i++) { aBytes[i] = sByteChars.charCodeAt(i); }
  window.open(URL.createObjectURL(new Blob([aBytes], { type: oFile.SupplierDocMime || "application/octet-stream" })), "_blank");
},

onConfirmVendorAttach: function () {
  var aStaged = this._oAttachDialogModel.getProperty("/stagedFiles") || [];

  // Validate: each row must have at least a file or a SharePoint link
  var bValid = aStaged.length > 0 && aStaged.every(function (o) {
    return o._fileObject || (o.supplierSpl && o.supplierSpl.trim());
  });

  if (!aStaged.length) {
    MessageBox.warning("Please add at least one attachment row.");
    return;
  }
  if (!bValid) {
    MessageBox.warning("Each row must have a file or a SharePoint link.");
    return;
  }

  // Sync SPL values back to the map
  if (this._currentVendorKey) {
    this._supplierAttachMap[this._currentVendorKey] = aStaged;
  }

  if (this._oVendorAttachDialog) { this._oVendorAttachDialog.close(); }
  MessageToast.show(aStaged.length + " row(s) staged. They will be saved when you click Save as Draft.");
},

onCloseVendorAttachDialog: function () {
  if (this._oVendorAttachDialog) { this._oVendorAttachDialog.close(); }
},

formatINR: function (val) {
  var n = parseFloat(val);
  if (isNaN(n)) return val || "";
  return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
},

_getMimeTypeShort: function (sMime) {
  var mMap = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "application/xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "application/docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "application/pptx",
    "application/vnd.ms-excel": "application/xls",
    "application/vnd.ms-powerpoint": "application/ppt",
    "application/msword": "application/doc"
  };
  return mMap[sMime] || sMime;
},

_getMimeTypeFull: function (sMime) {
  var mMap = {
    "application/xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/xls": "application/vnd.ms-excel",
    "application/ppt": "application/vnd.ms-powerpoint",
    "application/doc": "application/msword"
  };
  return mMap[sMime] || sMime;
},

_postStagedSupplierAttachments: function (sNfaRefNo, fnCallback) {
  var oODataModel = this.getOwnerComponent().getModel();
  var oViewModel = this.getView().getModel("viewModel");
  var aVendors = oViewModel.getProperty("/vendors") || [];
  var that = this;

  if (!this._supplierAttachMap || !Object.keys(this._supplierAttachMap).length) {
    if (fnCallback) { fnCallback(); }
    return;
  }

  // Collect all rows across all vendors
  var aAllJobs = [];
  Object.keys(this._supplierAttachMap).forEach(function (sKey) {
    var aRows = that._supplierAttachMap[sKey] || [];
    var sVendorNo = sKey.startsWith("idx_") ?
      (aVendors[parseInt(sKey.replace("idx_", ""))] || {}).vendorNo || "" : sKey;
    aRows.forEach(function (oRow) {
      aAllJobs.push({ vendorNo: sVendorNo, row: oRow });
    });
  });

  if (!aAllJobs.length) {
    if (fnCallback) { fnCallback(); }
    return;
  }

  // Separate rows that need FileReader from link-only rows
  var aFileJobs = aAllJobs.filter(function (j) { return !!j.row._fileObject; });
  var aLinkJobs = aAllJobs.filter(function (j) { return !j.row._fileObject; });

  var aReaders = aFileJobs.map(function (oJob) {
    return new Promise(function (resolve, reject) {
      var oReader = new FileReader();
      oReader.onload = function (e) { resolve({ job: oJob, base64: e.target.result.split(",")[1] }); };
      oReader.onerror = reject;
      oReader.readAsDataURL(oJob.row._fileObject);
    });
  });

  Promise.all(aReaders).then(function (aFileResults) {
    // Combine file results + link-only rows
    var aAllResults = aFileResults.concat(aLinkJobs.map(function (j) {
      return { job: j, base64: "" };
    }));

    // Group by vendorNo
    var oByVendor = {};
    aAllResults.forEach(function (oResult) {
      var sVendorNo = oResult.job.vendorNo;
      if (!oByVendor[sVendorNo]) { oByVendor[sVendorNo] = []; }
      oByVendor[sVendorNo].push(oResult);
    });

    var aVendorKeys = Object.keys(oByVendor);
    var iVendorIndex = 0;

    function postNextVendor() {
      if (iVendorIndex >= aVendorKeys.length) {
        that._supplierAttachMap = {};
        if (fnCallback) { fnCallback(); }
        return;
      }
      var sVendorNo = aVendorKeys[iVendorIndex];
      var aVendorResults = oByVendor[sVendorNo];
      var aSupItems = aVendorResults.map(function (oResult) {
        return {
          NfaRefNo: sNfaRefNo,
          VendorNo: sVendorNo,
          SupplierDoc: oResult.job.row.fileName || "",
          SupplierDocMime: that._getMimeTypeShort(oResult.job.row.mimeType || ""),
          SupplierFileData: oResult.base64 || "",
          SupplierSpl: oResult.job.row.supplierSpl || ""
        };
      });
      oODataModel.create("/et_attachHeadSet", {
        NfaRefNo: sNfaRefNo,
        ATTACH_SUP: { results: aSupItems }
      }, {
        success: function () { iVendorIndex++; postNextVendor(); },
        error: function (oError) {
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { sMsg = oError.responseText || "Unknown"; }
          MessageBox.error("Failed to save supplier attachment: " + sMsg);
        }
      });
    }
    postNextVendor();
  }).catch(function () {
    MessageBox.error("Error reading attachment files.");
  });
}



    // Start: added by SI2 Tech - closes Object.assign({}, PoHistory, { ... })
    }));
    // End: added by SI2 Tech
  },
);