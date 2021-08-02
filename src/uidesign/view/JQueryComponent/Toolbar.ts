import BaseUI from "../BaseUI";
import {DragEventCallbackOptions} from "jsplumb";
import ClickEvent = JQuery.ClickEvent;
import DraggableEventUIParams = JQueryUI.DraggableEventUIParams;

export class Toolbar<T extends ToolbarInfo> extends BaseUI<T> {
    private lstButton = new Array<ToolbarButton<any>>();
    private doubleClickHandler: Function;
    private toolbarDragHandler: (event, ui: DraggableEventUIParams) => void;

    protected createUI(): HTMLElement {
        return $(require("./template/Toolbar.html")).get(0);
    }

    afterComponentAssemble(): void {
        if (this.properties && this.properties.btns) {
            for (let i = 0; i < this.properties.btns.length; i++) {
                let handler = null;
                if (this.properties.handler && this.properties.handler.length > i) {
                    handler = this.properties.handler[i];
                }
                this.addBtn(this.properties.btns[i], handler);
            }
        }

        super.afterComponentAssemble();
    }

    protected initSubControls() {
        if (this.properties.float) {
            this.$element.addClass("float-toolbar");
            let opt = {};
            opt['stop'] = (params: DragEventCallbackOptions) => {

            };
            this.$element.draggable({
                stop: (params, uiparam) => {
                    if (this.toolbarDragHandler) {
                        this.toolbarDragHandler(params, uiparam);
                    }
                }
            });
        } else {
            this.$element.css("position", "inherit");
        }
        if (this.properties.fullWidth) {
            this.$element.addClass("full-width");
            this.$element.addClass("justify-content-center");
        }
    }

    setDoubleClickHandler(doubleClickHandler: Function) {
        this.doubleClickHandler = doubleClickHandler;
    }

    setToolbarDragedListener(toolbarDragHandler: (event, ui: DraggableEventUIParams) => void) {
        this.toolbarDragHandler = toolbarDragHandler;
    }

    public addBtn(id, title: string, handler?: (event) => void) {
        let btnInfo: ButtonInfo = {id: id, text: title, clickHandler: handler};
        this.addButton(btnInfo);
    }

    public addButton(btnInfo: ButtonInfo) {
        if (!this.$element) {
            this.getViewUI();
        }
        let button = new ToolbarButton(btnInfo);
        this.lstButton.push(button);
        this.$element.append(button.getViewUI());
        //      button.afterComponentAssemble();

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

    public addButtons(lstButton: Array<ButtonInfo>) {
        if (lstButton) {
            for (let btn of lstButton) {
                this.addButton(btn);
            }
        }

    }

    destroy(): boolean {
        for (let btn of this.lstButton) {
            btn.destroy();
        }
        this.$element.find(".toolbar-handler").off("dblclick");
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

    protected initEvent() {
        this.$element.find(".toolbar-handler").on("dblclick", (event) => {
            if (this.doubleClickHandler) {
                this.doubleClickHandler(event);
            }
        });
    }


    setPosition(left, top) {
        this.$element.css("position", "absolute");
        this.$element.css("left", left);
        this.$element.css("top", top);
    }
}

export class ToolbarButton<T extends ButtonInfo> extends BaseUI<T> {
    protected createUI(): HTMLElement {

        let $dom = $(require("./template/ToolbarButton.html"));
        if (this.properties.text) {
            $dom.find(".button-label").text(this.properties.text);
        }
        if (this.properties.iconClass) {
            $dom.find(".button-icon").addClass(this.properties.iconClass);
        }
        if (this.properties.clickHandler) {
            $dom.on("click", (event) => {
                this.properties.clickHandler(event);
            });
        }
        if (this.properties.hint) {
            $dom.attr("title", this.properties.hint);
            $dom.attr("data-tip", this.properties.hint);
        }
        return $dom.get(0);
    }

    public updateShow() {
        this.setVisible((!this.properties.isShow) || this.properties.isShow(this.properties.id))
    }

    public setEnable(enabled: boolean) {
        if (enabled) {
            this.$element.removeClass("disabled");
        } else {
            this.$element.addClass("disabled");
        }

    }

    public setVisible(visible: boolean) {
        if (visible) {
            this.$element.removeClass(ToolbarButton.HIDDEN_CLASS);
        } else {
            this.$element.addClass(ToolbarButton.HIDDEN_CLASS);
        }
    }

    getId() {
        return this.properties.id;
    }

    destroy(): boolean {
        this.$element.off("click");
        return super.destroy();
    }


}

export interface ButtonInfo {
    id: string;
    text?: string;
    iconClass?: string;
    hint?: string;
    isShow?: (id: string | any) => boolean;
    clickHandler?: (event: ClickEvent, data?, sourceComponent?) => void;
}

export interface ToolbarInfo {
    btns?: Array<string>,
    handler?: Array<(event) => void>,
    float: boolean;
    fullWidth?: boolean;
}
