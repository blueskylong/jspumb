import {StepEventObject, Steps, StepsInfo} from "./Steps";
import {StepInfo} from "./Step";
import ClickEvent = JQuery.ClickEvent;
import BaseUI from "../../../uidesign/view/BaseUI";
import {ButtonInfo, Toolbar, ToolbarInfo} from "../../../uidesign/view/JQueryComponent";
import {UiUtils} from "../../../common/UiUtils";
import {Alert} from "../../../uidesign/view/JQueryComponent/Alert";
import {BottomToolbar, BottomToolbarInfo} from "./BottomToolbar";


export class StepUI<T extends StepUIInfo> extends BaseUI<T> {

    static BTN_ID_PRE = "previous";
    static BTN_ID_NEXT = "next";
    static BTN_ID_FINISH = "finish";
    private toolbar: BottomToolbar<BottomToolbarInfo>;
    private steps: Steps<StepsInfo>;
    private lstUI: Array<BaseUI<any>>;
    private $contentBody: JQuery;

    private globalData: StepGlobalInfo = new StepGlobalInfoImpl();
    /**
     * 用于缓存各步骤，如果需要的话
     */
    private lstPages: Array<JQuery> = new Array<JQuery>();

    /**
     * 取得步骤页面容器
     * @param index
     */
    private getStepPage(index): JQuery {
        let $ele = this.lstPages[index];
        if (!$ele) {
            $ele = StepUI.createFullPanel("step-page");
            this.lstPages[index] = $ele;
            this.$contentBody.append($ele);
        }
        return $ele;
    }

    private isButtonShow = (data) => {
        if (data) {
            if (data === StepUI.BTN_ID_PRE) {
                return this.steps.canSelectPrevious();
            } else if (data === StepUI.BTN_ID_NEXT) {
                return this.steps.canStepNext() || this.steps.canSelectNext();
            } else if (data === StepUI.BTN_ID_FINISH) {
                return this.steps.isSelectLastStep();
            }
        }
        return true;
    };

    protected createUI(): HTMLElement {
        return $(require("./template/StepUI.html")).get(0);
    }

    protected initSubControls() {
        this.lstUI = new Array();
        this.$contentBody = this.$element.find(".content-body");
        this.initToolbar();
        this.initSteps();
    }

    public setActiveIndex(index) {
        this.steps.setActiveIndex(index);
        this.steps.setCurrentIndex(index);
        this.toolbar.updateShow();
    }


    protected initEvent() {
        this.steps.addSelectChangeListener({
            handleEvent: (eventType: string, data: any, source: any, extObject?: StepEventObject) => {
                this.hideStepButtons(extObject.previousIndex);
                this.toolbar.updateShow();
                this.showUI(data)
            }
        });
    }

    /**
     * 显示当前步骤
     * @param index
     */
    private showUI(index) {
        let stepPage = this.getStepPage(index);
        if (stepPage.children().length === 0) {
            stepPage.append(this.properties.steps[index].getShowCom(this.globalData).getViewUI());
        } else {
            this.properties.steps[index].getShowCom(this.globalData).renew({})
        }
        this.$element.find(".step-page").addClass(StepUI.HIDDEN_CLASS);
        stepPage.removeClass(StepUI.HIDDEN_CLASS);
        let btns = this.properties.steps[index].getCommonButtons();
        if (btns) {
            this.toolbar.addButtonsAdjust(btns);
        }
    }

    private initToolbar() {
        let btnPreviousInfo: ButtonInfo = {
            id: StepUI.BTN_ID_PRE,
            text: "上一步",
            clickHandler: (event: ClickEvent, data?, sourceComponent?) => {
                this.previousButtonClick(event, data, sourceComponent);
            },
            isShow: this.isButtonShow
        };
        let btnNextInfo: ButtonInfo = {
            id: StepUI.BTN_ID_NEXT,
            text: "下一步",
            clickHandler: (event: ClickEvent, data?, sourceComponent?) => {
                this.nextButtonClick(event, data, sourceComponent);
            },
            isShow: this.isButtonShow
        };
        let btnFinishInfo: ButtonInfo = {
            id: StepUI.BTN_ID_FINISH,
            text: "完成",
            clickHandler: (event: ClickEvent, data?, sourceComponent?) => {
                this.finishButtonClick(event, data, sourceComponent)
            },
            isShow: this.isButtonShow
        };
        this.toolbar = new BottomToolbar<ToolbarInfo>({float: false, fullWidth: true});

        this.$element.find(".step-toolbar").append(this.toolbar.getViewUI());

        this.toolbar.addButtonFix(btnPreviousInfo);
        this.toolbar.addButtonFix(btnNextInfo);
        this.toolbar.addButtonFix(btnFinishInfo);
    }

    /**
     * 设置步骤信息
     * @param steps
     */
    setSteps(steps: Array<IStep>) {
        this.clearSteps();
        this.properties.steps = steps;
        this.steps.setSteps(steps);
    }

    protected clearSteps() {
        if (this.lstUI) {
            for (let ui of this.lstUI) {
                ui.destroy();
            }
            this.lstUI = null;
            this.steps.clearSteps();
        }
        if (this.lstPages) {
            for (let page of this.lstPages) {
                page.remove();
            }
        }
    }

    private initSteps() {
        let stepsInfo: StepsInfo = this.properties.stepsInfo;
        if (!stepsInfo) {
            return;
        }
        //这里只生成步骤信息
        stepsInfo.lstStepInfo = this.properties.steps;
        stepsInfo.canSelectReadyStep = true;
        stepsInfo.readonly = true;
        this.steps = new Steps<StepsInfo>(stepsInfo);
        this.$element.find(".step-steps").append(this.steps.getViewUI());
    }

    afterComponentAssemble(): void {
        UiUtils.fireResizeEvent();
        super.afterComponentAssemble();
    }

    destroy(): boolean {
        if (this.lstUI) {
            for (let ui of this.lstUI) {
                ui.destroy();
            }
        }
        this.steps.destroy();
        this.toolbar.destroy();
        this.$contentBody = null;
        return super.destroy();
    }

    private nextButtonClick(event: ClickEvent, data?, sourceComponent?): void {


        if (!this.properties.editable || !this.steps.isSelectLastActiveStep()) {
            this.steps.selectNext();
        } else {
            if (this.steps.getCurrentStepIndex() < 0) {
                if (this.steps.canStepNext()) {
                    this.steps.stepNext();
                }
                return;
            }
            this.properties.steps[this.steps.getCurrentStepIndex()].checkAndSaveStep(this.globalData,
                (errorInfo) => {
                    if (errorInfo) {
                        Alert.showMessage(errorInfo);
                        return;
                    } else {
                        if (this.steps.canStepNext()) {
                            this.steps.stepNext();
                        }

                    }
                });

        }
    }

    private hideStepButtons(index) {
        if (index < 0) {
            return;
        }
        let btns = this.properties.steps[index].getCommonButtons();
        if (btns) {
            this.toolbar.removeButtons(btns);
        }
    }


    private previousButtonClick(event: ClickEvent, data?, sourceComponent?): void {

        this.steps.selectPrevious();
    }

    private finishButtonClick(event: ClickEvent, data?, sourceComponent?): void {
        if (this.steps.canStepNext()) {
            return;
        }
        Alert.showMessage("准备保存")
    }
}

export interface StepUIInfo {
    steps: Array<IStep>;
    stepsInfo: StepsInfo;
    finishHandler: () => boolean;
    editable?: boolean;

}

export interface IStep extends StepInfo {
    /**
     * 检查并保存,返回的错误信息,如果没有错误信息,则表示成功
     * @param globalInfo
     */
    checkAndSaveStep(globalInfo: StepGlobalInfo, callback: (errorInfo: string) => void);

    getShowCom(globalInfo: StepGlobalInfo): BaseUI<any>;

    getCommonButtons(): Array<ButtonInfo>;

    needCacheUI?: boolean;

}


/**
 * 此类用于步骤整体的数据交换
 */
export class StepGlobalInfoImpl implements StepGlobalInfo {
    private globalData: object;

    getGlobalInfo(): object {
        return this.globalData;
    }

    setGlobalInfo(obj: object) {
        this.globalData = obj;
    }
}

export interface StepGlobalInfo {
    getGlobalInfo(): object;

    setGlobalInfo(obj: object);
}
