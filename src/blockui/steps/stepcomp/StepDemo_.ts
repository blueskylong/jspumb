import {StepsInfo, Steps} from "./Steps";
import {IStep, StepUI, StepUIInfo} from "./StepUI";
import {BaseUIDemo} from "./stepimpl/BaseUIDemo";
import {MenuFunction} from "../../MenuFunction";
import {MenuInfo} from "../../../sysfunc/menu/dto/MenuInfo";
import {MenuFunc} from "../../../decorator/decorator";
import {ListUIDemo} from "./stepimpl/ListUIDemo";

@MenuFunc("StepDemo")
export class StepDemo<T extends MenuInfo> extends MenuFunction<T> {
    private stepUI: StepUI<StepUIInfo>;

    protected createUI(): HTMLElement {
        return StepDemo.createFullPanel("demo-body").get(0);
    }

    protected initSubControls() {
        let steps: StepsInfo = Steps.getDefaultStepsInfo();
        let lstStep = new Array<IStep>();
        let step1 = new ListUIDemo({text: "第一步"});
        lstStep.push(step1);
        let step = new BaseUIDemo({text: "第二步"});
        lstStep.push(step);
        step = new BaseUIDemo({text: "第三步", btnTitle: "步骤里的按钮"});//, err: "这里有个错误,不能下一步了"
        lstStep.push(step);
        step = new BaseUIDemo({text: "第四步"});
        lstStep.push(step);
        step = new BaseUIDemo({text: "第五步"});
        lstStep.push(step);
        step = new BaseUIDemo({text: "第六步"});
        lstStep.push(step);


        let stepUIInfo: StepUIInfo = {
            finishHandler: () => {
                return true;
            }, steps: lstStep, stepsInfo: steps, editable: true
        };
        this.stepUI = new StepUI<StepUIInfo>(stepUIInfo);

        this.$element.append(this.stepUI.getViewUI());
        this.fireReadyEvent();
    }

    afterComponentAssemble(): void {
        this.stepUI.setActiveIndex(0);
        super.afterComponentAssemble();
    }
}
