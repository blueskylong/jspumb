import BaseUI from "../../../../uidesign/view/BaseUI";
import {IStep} from "../StepUI";
import {ButtonInfo} from "../../../../uidesign/view/JQueryComponent";
import {CommonUtils} from "../../../../common/CommonUtils";
import {Alert} from "../../../../uidesign/view/JQueryComponent/Alert";


export class BaseUIDemo<T extends BaseUIDemoInfo> extends BaseUI<T> implements IStep {
    title = this.properties.text;
    private buttons: Array<ButtonInfo>;

    protected createUI(): HTMLElement {
        let $ele = BaseUIDemo.createFullPanel();
        $ele.text(this.properties.text);
        return $ele.get(0);
    }


    checkAndSaveStep(globalInfo: object, callback: (errorInfo: string) => void) {
        console.log("doSave!");
        return callback(this.properties.err);
    }

    getCommonButtons(): Array<ButtonInfo> {
        if (this.buttons) {
            return this.buttons;
        }
        if (this.properties.btnTitle) {
            let btn = {
                id: CommonUtils.genUUID(), text: this.properties.btnTitle, clickHandler: () => {
                    Alert.showMessage(this.properties.text + " 按钮被点击了");
                }
            };
            this.buttons = [btn];
            return this.buttons;
        }
        return null;
    }

    getShowCom(globalInfo: object): BaseUI<any> {

        return this;
    }


}

export interface BaseUIDemoInfo {
    text: string;
    btnTitle?: string;
    err?: string;
}
