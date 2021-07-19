import {FlowLayout} from "../../../../blockui/layout/FlowLayout";
import BaseUI from "../../BaseUI";
import {DmConstants} from "../../../../datamodel/DmConstants";
import {FormulaParse} from "../../../../datamodel/DmRuntime/formula/FormulaParse";

export class ButtonPanel<T extends ButtonPanelProperty> extends FlowLayout<T> {

    private mathPad: FlowLayout<any>;
    private logicPad: FlowLayout<any>;
    private groupPad: FlowLayout<any>;
    private mathEle = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ".", "+", "-", "*", "/", "(", ")"];

    protected initSubControls() {
        this.mathPad = new FlowLayout({});
        this.addUI(this.mathPad);
        this.mathPad.setWidth(200);
        for (let i = 0; i < this.mathEle.length; i++) {
            this.mathPad.addUI(new AcButton({
                width: 30, height: 30, title: this.mathEle[i], value: this.mathEle[i],
                clickHandle: (value) => {
                    this.properties.clickHandle(value);
                }
            }));
        }
        this.groupPad = new FlowLayout({});
        this.addUI(this.groupPad);
        this.groupPad.setWidth(100);
        for (let exp of FormulaParse.getTransElements()) {
            if (exp.getElementType() === DmConstants.FormulaElementType.group) {
                this.groupPad.addUI(new AcButton({
                    width: 80,
                    height: 30,
                    title: exp.getName(),
                    value: exp.getExpressionCN(),
                    clickHandle: (value) => {
                        this.properties.clickHandle(" " + value + " ");
                    }
                }));
            }
        }

        //增加逻辑按钮
        if (this.properties.isFilter) {
            this.logicPad = new FlowLayout<any>({});
            this.addUI(this.logicPad);
            this.logicPad.setWidth(300);
            for (let exp of FormulaParse.getTransElements()) {
                if (exp.getElementType() === DmConstants.FormulaElementType.logic ||
                    exp.getElementType() === DmConstants.FormulaElementType.compare) {
                    this.logicPad.addUI(new AcButton({
                        width: 80,
                        height: 30,
                        title: exp.getName(),
                        value: exp.getExpressionCN(),
                        clickHandle: (value) => {
                            this.properties.clickHandle(" " + value + " ");
                        }
                    }));
                }
            }
        }
        this.fireReadyEvent();
    }


    destroy(): boolean {
        this.mathPad.destroy();
        return super.destroy();
    }


}

export interface ButtonPanelProperty {
    clickHandle: (value) => void;
    isFilter: boolean;
}

class AcButton<T extends AcButtonProperty> extends BaseUI<T> {
    protected createUI(): HTMLElement {
        let ele = $("<button class='btn-info btn  btn-acbtn'></button>");
        ele.text(this.properties.title);
        ele.on("click", (e) => {
            if (this.properties.clickHandle) {
                this.properties.clickHandle(this.properties.value);
            }
        });
        return ele.get(0);
    }

    protected initSubControls() {
        this.setHeight(this.properties.height);
        this.setWidth(this.properties.width);
    }

    destroy(): boolean {
        this.$element.off("click");
        return super.destroy();
    }
}

export interface AcButtonProperty {
    width: number;
    height: number;
    title: string;
    value: string;
    clickHandle: (value) => void;
}
