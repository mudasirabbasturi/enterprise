import { _ModuleSupport } from 'ag-charts-community';
declare const Chart: typeof _ModuleSupport.Chart;
export declare class HierarchyChart extends Chart {
    static readonly className = "HierarchyChart";
    static readonly type: "hierarchy";
    getChartType(): "hierarchy";
    protected performLayout(ctx: _ModuleSupport.LayoutContext): void;
    protected getAriaLabel(): string;
}
export {};
