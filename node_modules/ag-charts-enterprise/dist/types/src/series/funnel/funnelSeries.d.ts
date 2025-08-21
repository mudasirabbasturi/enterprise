import { type AgFunnelSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import { BaseFunnelSeries, type Bounds, type FunnelAnimationData, type FunnelNodeDatum, type FunnelNodeLabelDatum, type FunnelSeriesShapeStyle } from './baseFunnelSeries';
import { FunnelProperties } from './funnelProperties';
type ItemStyle = Pick<AgFunnelSeriesStyle, 'fill' | 'stroke'> & Required<Omit<AgFunnelSeriesStyle, 'fill' | 'stroke'>>;
export declare class FunnelSeries extends BaseFunnelSeries<_ModuleSupport.Rect<FunnelNodeDatum>> {
    static readonly className = "FunnelSeries";
    static readonly type: "funnel";
    properties: FunnelProperties;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    getBandScalePadding(): {
        inner: number;
        outer: number;
    };
    protected connectorEnabled(): boolean;
    protected barStyle(): FunnelSeriesShapeStyle;
    protected connectorStyle(): FunnelSeriesShapeStyle;
    protected nodeFactory(): _ModuleSupport.Rect;
    protected createLabelData({ datumIndex, rect, yDatum, datum, visible, }: {
        datumIndex: number;
        rect: Bounds;
        barAlongX: boolean;
        yDatum: number;
        datum: any;
        visible: boolean;
    }): FunnelNodeLabelDatum | undefined;
    private getItemBaseStyle;
    private getItemStyleOverrides;
    protected updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, FunnelNodeDatum>;
        isHighlight: boolean;
    }): void;
    protected tooltipStyle(datum: unknown, datumIndex: number): Required<ItemStyle>;
    animateEmptyUpdateReady(params: FunnelAnimationData<_ModuleSupport.Rect>): void;
    animateWaitingUpdateReady(data: FunnelAnimationData<_ModuleSupport.Rect>): void;
}
export {};
