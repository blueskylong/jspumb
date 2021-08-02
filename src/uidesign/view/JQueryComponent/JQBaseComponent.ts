import {BaseComponent} from "../BaseComponent";
import "./template/JQComponentStyle.css";
import {Component} from "../../../blockui/uiruntime/Component";
import {GeneralEventListener} from "../../../blockui/event/GeneralEventListener";

export abstract class JQBaseComponent<T extends Component> extends BaseComponent<T> {


    public constructor(dto: T, eventHandler?: GeneralEventListener) {
        super(dto);
        this.addValueChangeListener(eventHandler);
    }

    private isMaskChange = false;
    /**
     * 主要输入控件
     */
    protected editor: JQuery;

    protected editable = true;
    protected enabled = true;

    getValue(): any {
        if (!this.editor) {
            return null;
        }
        return this.editor.val();
    }

    getEditor() {
        return this.editor;
    }


    setEditable(editable: boolean) {
        this.editable = editable;
        if (!this.editor) {
            return;
        }
        if (editable) {
            this.editor.removeAttr("readonly");
        } else {
            this.editor.attr("readonly", "readonly")
        }
    }

    setEnable(enable: boolean) {
        this.enabled = enable;
        if (!this.editor) {
            return;
        }
        if (enable) {
            this.editor.removeAttr("disabled");
        } else {
            this.editor.attr("disabled", "disabled")
        }
    }

    setValue(value: any, extendData?) {
        if (!this.editor) {
            return;
        }
        this.isMaskChange = true;
        try {
            this.editor.val(value);
        } finally {
            this.isMaskChange = false;
        }

    }


}


