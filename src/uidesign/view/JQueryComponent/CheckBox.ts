import {TextInput} from "./TextInput";
import {Component} from "../../../blockui/uiruntime/Component";
import {RegComponent} from "../../../decorator/decorator";
import {Constants} from "../../../common/Constants";

@RegComponent(Constants.ComponentType.checkbox)
export class CheckBox<T extends Component> extends TextInput<T> {

    protected getEditorType() {
        return "checkbox";
    }

    getValue(): any {
        return this.getEditor().prop("checked") ? 1 : 0;
    }

    setValue(value: any) {
        let realValue = (value === 1 || '1' === value) ? 1 : 0;
        this.getEditor().prop("checked", realValue);
    }

    setEditable(editable: boolean) {
        super.setEditable(editable);
        if (editable) {
            this.getEditor().removeAttr("disabled");
        } else {
            this.getEditor().attr("disabled", "readonly");
        }
    }

    setEnable(enable: boolean) {
        super.setEnable(enable);
        if (enable) {
            this.getEditor().removeAttr("disabled");
        } else {
            this.getEditor().attr("disabled", "disabled");
        }
    }

}
