import BaseUI from "../../uidesign/view/BaseUI";

export class FlowLayout<T> extends BaseUI<T> {
    private lstUi: Array<BaseUI<any>> = new Array<BaseUI<any>>();

    protected createUI(): HTMLElement {
        return $("<div class = 'full-width-display flow-layout-panel row align-top'></div>").get(0);
    }

    public addUI(ui: BaseUI<any>) {
        this.$element.append(ui.getViewUI());
        this.lstUi.push(ui);
    }

    destroy(): boolean {
        for (let ui of this.lstUi) {
            ui.destroy();
        }
        return super.destroy();
    }


}
