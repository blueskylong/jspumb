import {TextInput} from "./TextInput";
import {Component} from "../../../blockui/uiruntime/Component";
import {RegComponent} from "../../../decorator/decorator";
import {Constants} from "../../../common/Constants";
@RegComponent(Constants.ComponentType.label)
export class Label<T extends Component> extends TextInput<T> {

    protected getEditorType() {
        return "label";
    }

    protected createEditor(id: string) {
        return $("<label class='com-editor form-control' id='" + id
            + "' />");
    }

    setValue(value: any) {
        this.getEditor().text(value);
    }

    getValue() {
        return this.getEditor().text();
    }
}
