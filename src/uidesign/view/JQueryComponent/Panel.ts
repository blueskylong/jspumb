import {TextInput} from "./TextInput";

import {Component} from "../../../blockui/uiruntime/Component";
import {JQBaseComponent} from "./JQBaseComponent";
import {IComponentGenerator} from "../generator/IComponentGenerator";
import {JQueryGeneralComponentGenerator} from "./JQueryGeneralComponentGenerator";
import {BaseComponent} from "../BaseComponent";
import {RegComponent} from "../../../decorator/decorator";
import {Constants} from "../../../common/Constants";
import {UiUtils} from "../../../common/UiUtils";

@RegComponent(Constants.ComponentType.panel)
export class Panel<T extends Component> extends TextInput<T> {
    protected lstSubControl: Array<BaseComponent<Component>> = [];
    private generator: IComponentGenerator = new JQueryGeneralComponentGenerator();

    protected getEditorType() {
        return "panel";
    }

    protected handleEditor($dom: JQuery) {
        let $editorParent = $dom.find(".base-comp");
        if (this.properties.componentDto.titleSpan > 12) {//如果标题宽度大于12,则表示实际宽度,则剩下的空间给编辑器
            UiUtils.addAutoHeightFit($editorParent.get(0));
        } else {
            $editorParent.addClass("col-md-" + (12 - this.properties.componentDto.titleSpan ? this.properties.componentDto.titleSpan : 0));
        }

    }

    /**
     * 增加下级控件
     */
    addSubComponent(comp: Component) {
        let control = this.generator.generateComponent(comp.getComponentDto().dispType, comp,
            this.$element.find(".comp-body").get(0), this);
        this.lstSubControl.push(control);
        this.$element.append(control.getViewUI());
        //       control.afterComponentAssemble();
        return control;
    }

    addSubControl(control: BaseComponent<any>) {
        this.lstSubControl.push(control);
        this.$element.append(control.getViewUI());
        //      control.afterComponentAssemble();
        return control;
    }

    protected loadTemplate(): string {
        return require("./template/Panel.html");
    }

}
