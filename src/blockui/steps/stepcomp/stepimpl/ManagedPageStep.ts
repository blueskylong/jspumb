import {IManagedStep} from "../ManagedStepUI";
import {ManagedPage} from "../../../managedView/ManagedPage";
import {PageUIInfo} from "../../../PageUI";
import {StepGlobalInfo} from "../StepUI";
import {ButtonInfo} from "../../../../uidesign/view/JQueryComponent";
import BaseUI from "../../../../uidesign/view/BaseUI";
import {StepDetail} from "../dto/StepDetail";

export class ManagedPageStep<T extends StepPageUIInfo> extends ManagedPage<T> implements IManagedStep {
    needCacheUI: boolean;
    title = this.properties.stepInfo.detailName;

    checkAndSaveStep(globalInfo: StepGlobalInfo, callback: (errorInfo: string) => void) {
        callback(null);
    }

    getCommonButtons(): Array<ButtonInfo> {
        return null;
    }

    getShowCom(globalInfo: StepGlobalInfo): BaseUI<any> {
        return this;
    }


}

export interface StepPageUIInfo {
    pageId: number;
    version?: string;
    stepInfo: StepDetail;
}

