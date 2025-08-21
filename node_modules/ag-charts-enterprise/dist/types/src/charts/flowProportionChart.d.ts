import { _ModuleSupport } from 'ag-charts-community';
declare const Chart: typeof _ModuleSupport.Chart;
export declare class FlowProportionChart extends Chart {
    static readonly className = "FlowProportionChart";
    static readonly type: "flow-proportion";
    nodes?: any[];
    getChartType(): "flow-proportion";
    updateData(): Promise<void>;
    protected performLayout(ctx: _ModuleSupport.LayoutContext): void;
}
export {};
