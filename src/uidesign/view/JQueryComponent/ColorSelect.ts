import {TextInput} from "./TextInput";
import {Component} from "../../../blockui/uiruntime/Component";

export class ColorSelect<T extends Component> extends TextInput<T> {

    protected getEditorType() {
        return "color";
    }

    setValue(value: any) {
        if (!value) {
            value = "#73879C";//默认颜色
        }
        super.setValue(value);
    }
}
