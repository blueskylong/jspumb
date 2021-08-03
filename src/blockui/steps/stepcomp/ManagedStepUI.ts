import BaseUI from "../../../uidesign/view/BaseUI";
import {StepConfigInfo} from "./dto/StepConfigInfo";
import {IStep, StepUI, StepUIInfo} from "./StepUI";
import {Steps} from "./Steps";
import {StepDetail} from "./dto/StepDetail";
import {AutoManagedUI} from "../../managedView/AutoManagedUI";
import {ManagedCustomStep} from "./stepimpl/ManagedCutomStep";
import {ManagedPageStep} from "./stepimpl/ManagedPageStep";
import {ManagedUiCenter} from "../../managedView/ManagedUiCenter";

/**
 * 自动管理的步骤全体
 */
export class ManagedStepUI<T extends StepConfigInfo> extends BaseUI<T> {
    private stepUI: StepUI<StepUIInfo>;
    private lstStepUI: Array<IManagedStep>;
    private managedUiCenter: ManagedUiCenter = new ManagedUiCenter(this.properties.getStepMain().schemaId);

    protected async initStructure() {
        let stepsInfo = Steps.getDefaultStepsInfo();
        this.stepUI = new StepUI<StepUIInfo>({
            steps: null,
            stepsInfo: stepsInfo,
            finishHandler: () => {
                return true;
            },
            editable: true
        });
        this.lstStepUI = await this.getSteps();
        this.stepUI.setSteps(this.lstStepUI);
        this.fireReadyEvent();

    }

    public setActiveIndex(index) {
        this.stepUI.setActiveIndex(index);
    }

    async getSteps(): Promise<Array<IManagedStep>> {
        let lstDetail = this.properties.getLstDetail();
        if (!lstDetail) {
            return null;
        }
        let result = new Array<IManagedStep>();
        for (let detail of lstDetail) {
            result.push(await this.createIStep(detail));
        }
        return new Promise(resolve => {
            resolve(result);
        });
    }

    /**
     * 创建步骤信息
     * @param detail
     */
    private async createIStep(detail: StepDetail): Promise<IManagedStep> {
        if (detail.customStep) {
            return new Promise(resolve => {
                let ui = new ManagedCustomStep(detail);
                ui.addReadyListener(() => {
                    this.managedUiCenter.registerManagedUI(ui.getSubManagedUI());
                });
                resolve();
            })
        } else if (detail.pageId) {
            let ui = new ManagedPageStep({pageId: detail.pageId, stepInfo: detail});
            ui.addReadyListener(() => {
                this.managedUiCenter.registerManagedUI(ui.getSubManagedUI());
            });
            return new Promise(resolve => resolve(ui))
        }
        return null;
    }

    protected createUI(): HTMLElement {
        return this.stepUI.getViewUI();
    }

}


export interface IManagedStep extends IStep, AutoManagedUI {

}
