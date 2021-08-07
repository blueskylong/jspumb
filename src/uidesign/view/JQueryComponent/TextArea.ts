import {TextInput} from "./TextInput";
import {Component} from "../../../blockui/uiruntime/Component";
import {RegComponent} from "../../../decorator/decorator";
import {Constants} from "../../../common/Constants";

@RegComponent(Constants.ComponentType.textarea)
export class TextArea<T extends Component> extends TextInput<T> {

    protected getEditorType() {
        return "textarea";
    }

    protected createEditor(id: string) {
        return $("<textarea class='com-editor form-control ' id='" + id
            + "' name='" + this.properties.getColumn().getColumnDto().fieldName + "'/>");
    }

    protected handleEditor($dom: JQuery<HTMLElement>, id: string) {
        //为了使用bootstrap 样式
        super.handleEditor($dom, id);

        if (!this.properties.componentDto.verSpan || this.properties.componentDto.verSpan <= 0 || this.properties.componentDto.verSpan === 1) {
            this.editor.height(TextInput.rowHeight - 11);
        }
    }
}
