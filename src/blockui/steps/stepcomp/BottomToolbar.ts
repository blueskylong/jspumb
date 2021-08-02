import BaseUI from "../../../uidesign/view/BaseUI";
import {ButtonInfo, ToolbarButton} from "../../../uidesign/view/JQueryComponent";

export class BottomToolbar<T extends BottomToolbarInfo> extends BaseUI<T> {
    private lstButton = new Array<ToolbarButton<any>>();
    private $fix: JQuery;
    private $adjust: JQuery;


    protected createUI(): HTMLElement {
        return $(require("./template/BottomToolbar.html")).get(0);
    }

    
    protected initSubControls() {
        this.$adjust = this.$element.find(".button-adjust");
        this.$fix = this.$element.find(".button-fix");
    }

    public addButtonFix(btnInfo: ButtonInfo) {
        if (!this.$element) {
            this.getViewUI();
        }
        let button = new ToolbarButton(btnInfo);
        this.lstButton.push(button);
        this.$fix.append(button.getViewUI());
    }

    public addButtonAdjust(btnInfo: ButtonInfo) {
        if (!this.$element) {
            this.getViewUI();
        }
        let button = new ToolbarButton(btnInfo);
        this.lstButton.push(button);
        this.$adjust.append(button.getViewUI());
    }

    public removeButton(btnInfo: ButtonInfo) {
        if (btnInfo) {
            for (let index = 0; index < this.lstButton.length; index++) {
                let button = this.lstButton[index];
                if (button.getId() === btnInfo.id) {
                    button.destroy();
                    this.lstButton.splice(index, 1);
                }
            }
        }
    }

    public removeButtons(btns: Array<ButtonInfo>) {
        if (btns) {
            for (let btnInfo of btns) {
                this.removeButton(btnInfo);
            }
        }
    }

    public addButtonsAdjust(lstButton: Array<ButtonInfo>) {
        if (lstButton) {
            for (let btn of lstButton) {
                this.addButtonAdjust(btn);
            }
        }

    }

    destroy(): boolean {
        for (let btn of this.lstButton) {
            btn.destroy();
        }
        this.lstButton = null;
        return super.destroy();
    }

    updateShow() {
        if (this.lstButton) {
            for (let btn of this.lstButton) {
                btn.updateShow();
            }
        }
    }

}

export interface BottomToolbarInfo {
    fullWidth?: boolean;
}
