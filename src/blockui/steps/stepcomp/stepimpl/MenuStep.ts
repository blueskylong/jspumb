import {StepDetail} from "../dto/StepDetail";
import {IManagedStep} from "../ManagedStepUI";
import {ManagedFunc} from "../../../ManagedFunc";
import {MenuInfo} from "../../../../sysfunc/menu/dto/MenuInfo";
import {IManageCenter} from "../../../managedView/AutoManagedUI";
import {ButtonInfo} from "../../../../uidesign/view/JQueryComponent";
import BaseUI from "../../../../uidesign/view/BaseUI";
import {CommonUtils} from "../../../../common/CommonUtils";

export class MenuStep<T extends MenuStepInfo> extends ManagedFunc<T> implements IManagedStep {
    needCacheUI: boolean;
    title: string = this.properties.getMenuDto().menuName;
    private lstBtns: Array<ButtonInfo>;

    protected createUI(): HTMLElement {
        this.addReadyListener(() => {
            let buttons = this.getButton();
            let buttonInfos = new Array<ButtonInfo>();
            if (buttons && buttons.length > 0) {
                for (let btn of buttons) {
                    //先处理分隔条件

                    let btnInfo: ButtonInfo = {
                        id: btn.btnId + '', text: btn.title, clickHandler: (event) => {
                            this[btn.funcName](event);
                        }
                    };
                    buttonInfos.push(btnInfo);
                }
            }
            this.lstBtns = buttonInfos;
        });
        return $(require("../../../../blockui/template/FunctionUI.html")).get(0);


    }

    checkAndSave(): Promise<boolean> {
        return new Promise<boolean>(resolve => resolve(true));
    }

    getCommonButtons(callBack: (btns: Array<ButtonInfo>) => void) {
        CommonUtils.readyDo(() => {
            return !!this.lstBtns;
        }, () => {
            callBack(this.lstBtns);
        });
    }

    getShowCom(): BaseUI<any> {
        return this;
    }

    setManageCenter(manageCenter: IManageCenter) {
        this.setManageCenter(manageCenter);
    }


}

export class MenuStepInfo extends MenuInfo {
    stepInfo: StepDetail;
}
