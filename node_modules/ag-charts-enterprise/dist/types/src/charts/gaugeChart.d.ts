import { _ModuleSupport } from 'ag-charts-community';
declare const Chart: typeof _ModuleSupport.Chart;
export declare class GaugeChart extends Chart {
    static readonly className = "GaugeChart";
    static readonly type: "gauge";
    getChartType(): "gauge";
    protected performLayout(ctx: _ModuleSupport.LayoutContext): void;
    protected getAriaLabel(): string;
}
export {};
