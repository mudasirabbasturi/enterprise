import { _ModuleSupport, _Widget } from 'ag-charts-community';
type AxesHandlers = {
    onDragStart: (id: string, direction: _ModuleSupport.ChartAxisDirection) => void;
    onDrag: (event: _Widget.DragWidgetEvent<'drag-move'>) => void;
    onDragEnd: () => void;
    onDoubleClick: (id: string, direction: _ModuleSupport.ChartAxisDirection) => void;
};
export declare class ZoomDOMProxy {
    private readonly axesHandlers;
    private axes;
    constructor(axesHandlers: AxesHandlers);
    destroy(): void;
    update(enableAxisDragging: boolean, ctx: _ModuleSupport.ModuleContext): void;
    toggleAxisDraggingCursor(direction: _ModuleSupport.ChartAxisDirection, enabled: boolean): void;
    private getCursor;
    private initAxis;
    private diffAxisIds;
}
export {};
