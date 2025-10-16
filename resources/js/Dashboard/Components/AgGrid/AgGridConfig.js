import {
  AllCommunityModule,
  ModuleRegistry,
  themeAlpine,
} from "ag-grid-community";
import {
  AllEnterpriseModule,
  LicenseManager,
  IntegratedChartsModule,
} from "ag-grid-enterprise";
import { AgChartsEnterpriseModule } from "ag-charts-enterprise";
import { AgGridReact } from "ag-grid-react";
ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
]);
LicenseManager.setLicenseKey("test");
const gridTheme = themeAlpine.withParams({
  spacing: 6,
  accentColor: "blue",
  wrapperBorder: true,
  headerHeight: 40,
});
const defaultColDef = {
  flex: 1,
  sortable: true,
  filter: true,
  floatingFilter: true,
  resizable: true,
  editable: true,
};
const sideBarConfig = {
  toolPanels: [
    {
      id: "columns",
      labelDefault: "Columns",
      labelKey: "columns",
      iconKey: "columns",
      toolPanel: "agColumnsToolPanel",
    },
    {
      id: "filters",
      labelDefault: "Filters",
      labelKey: "filters",
      iconKey: "filter",
      toolPanel: "agFiltersToolPanel",
    },
  ],
  defaultToolPanel: "columns",
  position: "right",
};
const STORAGE_KEY = "agGridColumnState";
const gridOptionsConfig = {
  onGridReady: (params) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      params.api.applyColumnState({
        state: JSON.parse(saved),
        applyOrder: true,
      });
    }
  },
  onColumnMoved: (params) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(params.api.getColumnState())
    );
  },
  onColumnPinned: (params) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(params.api.getColumnState())
    );
  },
  onColumnVisible: (params) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(params.api.getColumnState())
    );
  },
  onColumnResized: (params) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(params.api.getColumnState())
    );
  },
  onSortChanged: (params) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(params.api.getColumnState())
    );
  },
  resetColumnState: (api) => {
    api.resetColumnState();
    localStorage.removeItem(STORAGE_KEY);
  },
};
export {
  AgGridReact,
  gridTheme,
  defaultColDef,
  sideBarConfig,
  gridOptionsConfig,
};
