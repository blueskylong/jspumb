import "./template/style.css"
import {Step, StepInfo} from "./Step";
import {StepShowPosition, StepShowType} from "../common/StepConstants";
import BaseUI from "../../../uidesign/view/BaseUI";
import {GeneralEventListener} from "../../event/GeneralEventListener";
import {Constants} from "../../../common/Constants";


/**
 * 分步控件
 */
export class Steps<T extends StepsInfo> extends BaseUI<T> {

    private lstStep: Array<Step<StepInfo>>;

    private clickHandler: GeneralEventListener;
    /**
     * 当前选中索引
     */
    private curIndex = -1;
    /**
     * 最高选中索引
     */
    private lastIndex = -1;

    protected createUI(): HTMLElement {
        return $(require("./template/Steps.html")).get(0);
    }

    /**
     * 当前是否选择的最后一个激活步骤
     */
    isSelectLastActiveStep() {
        return this.curIndex === this.lastIndex;
    }

    /**
     * 当前是否选择的最后一个激活步骤
     */
    isSelectLastStep() {
        return this.curIndex === this.lstStep.length - 1;
    }

    getCurrentStepIndex() {
        return this.curIndex;
    }

    protected initSubControls() {

        if (this.properties.showType && this.properties.showType === StepShowType.ROUND) {
            this.$element.find(".nav").addClass("step-round");
        } else {
            this.$element.find(".nav").addClass("step-arrow");
        }
        this.lstStep = new Array<Step<StepInfo>>();
        this.clickHandler = {
            handleEvent: (eventType: string, index: any, source: any, extObject?: any) => {
                if (this.properties.readonly && !this.properties.canSelectReadyStep) {
                    return;
                }
                //如果不只读，则已过步骤和当前索引都修改
                if (!this.properties.readonly) {
                    this.setActiveIndex(index);
                    this.setCurrentIndex(index)
                } else {
                    //如果只响应切换已走步骤
                    if (this.properties.canSelectReadyStep) {
                        this.setCurrentIndex(index)
                    }
                }

            }
        };
        if (this.properties.lstStepInfo) {
            let step: Step<StepInfo>;
            let index = 0;
            let container = this.$element.find(".nav");
            for (let stepInfo of this.properties.lstStepInfo) {
                stepInfo.index = index++;
                stepInfo.readonly = this.properties.readonly;
                step = new Step(stepInfo);
                step.addClickListener(this.clickHandler);
                container.append(step.getViewUI());
                this.lstStep.push(step);
            }
        }
    }


    addSelectChangeListener(listener: GeneralEventListener) {
        this.addListener(Constants.GeneralEventType.SELECT_CHANGE_EVENT, listener);
    }

    setReadOnly(readOnly) {
        this.properties.readonly = readOnly;
        if (this.lstStep) {
            for (let step of this.lstStep) {
                step.setReadOnly(readOnly);
            }
        }
    }


    /**
     * 设置最高选中的索引
     * @param index
     */
    setActiveIndex(index: number) {
        if (index < 0) {
            return;
        }
        this.lastIndex = index;
        for (let step of this.lstStep) {
            step.setActive(step.getIndex() <= index);
        }
    }

    /**
     *  设置当前选中的索引
     * @param index
     */
    setCurrentIndex(index: number, silence = false) {
        //不让选中还没有激活的步骤
        if (this.lastIndex < index) {
            return;
        }

        //如果没有变化,不处理
        if (this.curIndex === index) {
            return;
        }
        let preIndex = this.curIndex;
        this.curIndex = index;
        for (let step of this.lstStep) {
            step.setCurrent(step.getIndex() == index);
        }
        if (!silence) {
            this.fireEvent(Constants.GeneralEventType.SELECT_CHANGE_EVENT, this.curIndex, this, {
                previousIndex: preIndex,
                currentIndex: index
            });
        }

    }

    /**
     * 针对所有步骤,回退一步
     * 注意,可能会存在不可见步骤,则路过
     */
    stepPrevious(): boolean {
        let preIndex = this.lastIndex - 1;
        for (; preIndex >= 0; preIndex--) {
            if (this.lstStep[preIndex].getDtoInfo().visible) {
                this.setActiveIndex(preIndex);
                this.setCurrentIndex(preIndex);
                return true;
            }

        }
        return false;
    }


    /**
     *  针对所有步骤,前进一步
     */
    stepNext(): boolean {
        let nextIndex = this.lastIndex + 1;
        for (; nextIndex < this.lstStep.length; nextIndex++) {
            if (this.lstStep[nextIndex].getDtoInfo().visible) {
                this.setActiveIndex(nextIndex);
                this.setCurrentIndex(nextIndex);
                return true;
            }
        }
        return false;
    }

    selectPrevious(): boolean {
        if (this.curIndex === 0) {
            return false;
        }
        let preIndex = this.curIndex - 1;
        for (; preIndex >= 0; preIndex--) {
            if (this.lstStep[preIndex].getDtoInfo().visible) {
                this.setCurrentIndex(preIndex);
                return true;
            }

        }
        return false;
    }

    canStepNext(): boolean {
        let nextIndex = this.lastIndex + 1;
        for (; nextIndex < this.lstStep.length; nextIndex++) {
            if (this.lstStep[nextIndex].getDtoInfo().visible) {
                return true;
            }
        }
        return false;
    }

    canSelectNext(): boolean {
        let nextIndex = this.curIndex + 1;
        for (; nextIndex <= this.lastIndex; nextIndex++) {
            if (this.lstStep[nextIndex].getDtoInfo().visible) {
                return true;
            }
        }
        return false;
    }

    canStepPrevious() {
        let preIndex = this.lastIndex - 1;
        for (; preIndex >= 0; preIndex--) {
            if (this.lstStep[preIndex].getDtoInfo().visible) {
                return true;
            }

        }
        return false;
    }

    canSelectPrevious() {
        let preIndex = this.curIndex - 1;
        for (; preIndex >= 0; preIndex--) {
            if (this.lstStep[preIndex].getDtoInfo().visible) {
                return true;
            }

        }
        return false;
    }

    selectNext(): boolean {
        let nextIndex = this.curIndex + 1;
        for (; nextIndex <= this.lastIndex; nextIndex++) {
            if (this.lstStep[nextIndex].getDtoInfo().visible) {
                this.setCurrentIndex(nextIndex);
                return true;
            }
        }
        return false;
    }

    destroy(): boolean {
        if (this.lstStep) {
            for (let step of this.lstStep) {
                step.destroy();
            }
        }

        return super.destroy();
    }

    static getDefaultStepsInfo(): StepsInfo {
        return {
            showType: StepShowType.BLOCK,
            showPosition: StepShowPosition.TOP,
            canSelectReadyStep: true,
            readonly: true
        }
    }


}

export interface StepsInfo {
    /**
     * 每一步的信息
     */
    lstStepInfo?: Array<StepInfo>;
    /**
     * 显示样式
     */
    showType?: StepShowType,
    /**
     * 显示位置
     */
    showPosition?: StepShowPosition,
    /**
     * 是否响应点击,只针对已走过的步骤，修改当前选择的步骤索引
     */
    canSelectReadyStep?: boolean;
    /**
     * 不可以手动点击未激活的步骤
     */
    readonly?: boolean;

}

export interface StepEventObject {
    previousIndex: number,
    currentIndex: number
}

