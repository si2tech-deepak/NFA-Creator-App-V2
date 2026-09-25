sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/df/nfa/creator_v2/model/models"
], (UIComponent, models) => {
    "use strict";
    return UIComponent.extend("com.df.nfa.creator_v2.Component", {
        metadata: {
            manifest: "json",
            interfaces: ["sap.ui.core.IAsyncContentCreation"]
        },
        init() {
            UIComponent.prototype.init.apply(this, arguments);
            this.setModel(models.createDeviceModel(), "device");
            this.getRouter().initialize();

            // Register thirdparty path so xlsx.min.js is deployable via FLP
            sap.ui.loader.config({
                paths: {
                    "com/df/nfa/creator_v2/thirdparty": sap.ui.require.toUrl("com/df/nfa/creator_v2") + "/thirdparty"
                }
            });
        }
    });
});
