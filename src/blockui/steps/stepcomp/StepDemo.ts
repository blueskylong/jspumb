import {StepUI, StepUIInfo} from "./StepUI";
import {MenuFunction} from "../../MenuFunction";
import {MenuInfo} from "../../../sysfunc/menu/dto/MenuInfo";
import {BeanFactory, MenuFunc} from "../../../decorator/decorator";
import {UiService} from "../../service/UiService";
import {ManagedStepUI} from "./ManagedStepUI";
import {StepConfigInfo} from "./dto/StepConfigInfo";
import {HandleResult} from "../../../common/HandleResult";

@MenuFunc("StepDemo")
export class StepDemo<T extends MenuInfo> extends MenuFunction<T> {


    private stepId = 5140841325619712;
    private manageStep: ManagedStepUI<StepConfigInfo>;

    protected createUI(): HTMLElement {
        return StepDemo.createFullPanel("demo-body").get(0);
    }

    protected initSubControls() {
        UiService.findStepInfo(this.stepId, (result: HandleResult) => {
            if (result.data) {
                let stepInfo = BeanFactory.populateBean(StepConfigInfo, result.data);
                this.manageStep = new ManagedStepUI<StepConfigInfo>(stepInfo);
                this.$element.append(this.manageStep.getViewUI());
            }
            this.manageStep.addReadyListener(() => {
                this.manageStep.setActiveIndex(0);
            });
            this.fireReadyEvent();
        });
    }

}
