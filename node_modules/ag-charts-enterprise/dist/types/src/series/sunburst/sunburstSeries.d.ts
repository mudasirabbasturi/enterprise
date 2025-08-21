import { _ModuleSupport } from 'ag-charts-community';
import type { FontStyle, FontWeight } from 'ag-charts-types';
import { SunburstSeriesProperties } from './sunburstSeriesProperties';
declare class SunburstNode extends _ModuleSupport.HierarchyNode<SunburstNode> {
    label: LabelLayout | undefined;
    secondaryLabel: LabelLayout | undefined;
    contentHeight: number;
    bbox: _ModuleSupport.BBox | undefined;
    startAngle: number;
    endAngle: number;
}
interface LabelLayout {
    text: string;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle;
    fontFamily: string;
    fontWeight: FontWeight;
    color: string;
    labelPlacement: LabelPlacement;
    circleQuarter: number;
    radius: number;
    theta: number;
    width: number;
    height: number;
}
declare enum LabelPlacement {
    CenterCircle = 0,
    Parallel = 1,
    Perpendicular = 2
}
export declare class SunburstSeries extends _ModuleSupport.HierarchySeries<_ModuleSupport.Sector, SunburstSeriesProperties, SunburstNode> {
    static readonly className = "SunburstSeries";
    static readonly type: "sunburst";
    NodeClass: typeof SunburstNode;
    properties: SunburstSeriesProperties;
    private readonly scalingGroup;
    private readonly sectorGroup;
    private readonly sectorLabelGroup;
    private readonly highlightSectorGroup;
    readonly datumSelection: _ModuleSupport.Selection<_ModuleSupport.Sector<any>, SunburstNode>;
    private readonly labelSelection;
    private readonly highlightSelection;
    processData(): void;
    updateSelections(): void;
    private getItemBaseStyle;
    private getItemStyleOverrides;
    updateNodes(): void;
    getTooltipContent(datumIndex: number[]): _ModuleSupport.TooltipContent | undefined;
    createNodeData(): undefined;
    protected pickNodeClosestDatum(point: _ModuleSupport.Point): _ModuleSupport.SeriesNodePickMatch | undefined;
    protected animateEmptyUpdateReady(): void;
    protected computeFocusBounds(node: _ModuleSupport.Sector): _ModuleSupport.Path | undefined;
}
export {};
