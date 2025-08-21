import { AllCommunityModule, ModuleRegistry, themeAlpine, } from "ag-grid-community"
// import { AllEnterpriseModule, LicenseManager, IntegratedChartsModule } from "ag-grid-enterprise";
// import { AgChartsEnterpriseModule } from "ag-charts-enterprise";

import { AgGridReact } from "ag-grid-react"
ModuleRegistry.registerModules([
    AllCommunityModule,
    // AllEnterpriseModule,
    // IntegratedChartsModule.with(AgChartsEnterpriseModule)
])
// LicenseManager.setLicenseKey("[TRIAL]_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-087410}_is_granted_for_evaluation_only___Use_in_production_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_purchasing_a_production_key_please_contact_info@ag-grid.com___You_are_granted_a_{Single_Application}_Developer_License_for_one_application_only___All_Front-End_JavaScript_developers_working_on_the_application_would_need_to_be_licensed___This_key_will_deactivate_on_{14 June 2025}____[v3]_[0102]_MTc0OTg1NTYwMDAwMA==d32caadaa45d7052a15febfa3ab0a37e");

const gridTheme = themeAlpine.withParams({
    spacing: 6, accentColor: "blue",
    wrapperBorder: true, headerHeight: 40,
})
const defaultColDef = {
    flex: 1,
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    editable: true,
}
export { AgGridReact, gridTheme, defaultColDef }