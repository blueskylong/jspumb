import {IManagedStep} from "../ManagedStepUI";
import {ManagedPage} from "../../../managedView/ManagedPage";
import {PageUIInfo} from "../../../PageUI";
import {StepGlobalInfo} from "../StepUI";
import {ButtonInfo} from "../../../../uidesign/view/JQueryComponent";
import BaseUI from "../../../../uidesign/view/BaseUI";
import {StepDetail} from "../dto/StepDetail";
import {ApplicationContext, BeanFactory} from "../../../../decorator/decorator";
import {AutoManagedUI, IManageCenter} from "../../../managedView/AutoManagedUI";
import {BaseComponent} from "../../../../uidesign/view/BaseComponent";
import {MenuButtonDto} from "../../../../sysfunc/menu/dto/MenuButtonDto";
import {PageDetailDto} from "../../../../funcdesign/dto/PageDetailDto";

export class ManagedCustomStep<T extends StepDetail> extends BaseComponent<T> implements IManagedStep {
    needCacheUI: boolean;
    title = this.properties.detailName;
    private customUi: BaseUI<T>;

    protected initStructure() {
        let funcClazz = ApplicationContext.getCustomStepUI(this.properties.customStep);
        this.customUi = <BaseUI<T>>BeanFactory.createBean(funcClazz, [this.properties]);
    }

    protected createUI(): HTMLElement {
        return this.customUi.getViewUI();
    }


    getShowCom(): BaseUI<any> {
        return this.customUi;
    }

    setManageCenter(manageCenter: IManageCenter) {
        if (typeof this.customUi['setManageCenter'] === 'function') {
            this.customUi['setManageCenter'](manageCenter);
        }
    }

    getCommonButtons(callBack: (btns: Array<ButtonInfo>) => void) {
        return null;
    }

    checkAndSave(): Promise<boolean> {
        if (typeof this.customUi['checkAndSave'] === 'function') {
            return this.customUi['checkAndSave']();
        }
        return new Promise<boolean>(resolve => resolve(true));
    }
}

