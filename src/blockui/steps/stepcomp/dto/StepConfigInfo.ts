import {StepDetail} from "./StepDetail";
import {StepMain} from "./StepMain";
import {PopulateBean} from "../../../../decorator/decorator";

export class StepConfigInfo {
    /**
     * 主表信息
     */

    private stepMain: StepMain;
    /**
     * 明细信息
     */
    private lstDetail: Array<StepDetail>;

    @PopulateBean(StepMain)
    setStepMain(stepMain: StepMain) {
        this.stepMain = stepMain;
    }

    @PopulateBean(StepDetail)
    setLstDetail(lstDetail: Array<StepDetail>) {
        this.lstDetail = lstDetail;
    }

    getStepMain() {
        return this.stepMain;
    }

    getLstDetail() {
        return this.lstDetail;
    }

}
