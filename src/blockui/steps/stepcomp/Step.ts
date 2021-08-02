/**
 * 一个步骤
 */
import BaseUI from "../../../uidesign/view/BaseUI";
import {CommonUtils} from "../../../common/CommonUtils";
import {Constants} from "../../../common/Constants";
import {GeneralEventListener} from "../../event/GeneralEventListener";


export class Step<T extends StepInfo> extends BaseUI<T> {
    static ACTIVE_CLASS = "active";
    static ERROR_CLASS = "error";
    static CURRENT_CLASS = "current";
    static READONLY_CLASS = "read-only";

    protected createUI(): HTMLElement {
        return $(require("./template/Step.html")).get(0);
    }

    protected initSubControls() {
        this.setTitle(this.properties.title);
        this.setActive(this.properties.active);
        this.setCurrent(this.properties.isCurrent);
        this.setError(this.properties.hasError);
        this.setReadOnly(this.properties.readonly);
        this.setVisible(CommonUtils.isEmpty(this.properties.visible) ? true : this.properties.visible);
        this.setMemo(this.properties.memo);

    }

    public isActive() {
        return this.properties.active;
    }

    public getIndex() {
        return this.properties.index;
    }

    protected initEvent() {
        this.$element.on("click", (event) => {
            this.fireEvent(Constants.GeneralEventType.EVENT_CLICK, this.properties.index, this);
        });
    }

    setError(hasError) {
        this.properties.hasError = hasError;
        hasError ? this.$element.addClass(Step.ERROR_CLASS) : this.$element.removeClass(Step.ERROR_CLASS);
    }

    setTitle(title: string) {
        this.properties.title = title;
        this.$element.find(".step-title").text(this.properties.title);
    }

    setReadOnly(isReadOnly) {
        this.properties.readonly = isReadOnly;
        if (isReadOnly) {
            this.$element.addClass(Step.READONLY_CLASS)
        } else {
            this.$element.removeClass(Step.READONLY_CLASS)
        }

    }

    setMemo(memo) {
        this.properties.memo = memo;
        this.$element.attr("title", this.properties.memo);
    }

    setActive(isActive) {
        this.properties.active = isActive;
        isActive ? this.$element.addClass(Step.ACTIVE_CLASS) : this.$element.removeClass(Step.ACTIVE_CLASS);
    }

    addClickListener(listener: GeneralEventListener) {
        this.addListener(Constants.GeneralEventType.EVENT_CLICK, listener);
    }

    setCurrent(isCurrent) {
        this.properties.isCurrent = isCurrent;
        if (isCurrent) {
            this.$element.addClass(Step.CURRENT_CLASS)
        } else {
            this.$element.removeClass(Step.CURRENT_CLASS)
        }

    }

    setVisible(bool) {
        this.properties.visible = bool;
        if (bool) {
            this.$element.removeClass(Step.HIDDEN_CLASS);
        } else {
            this.$element.addClass(Step.HIDDEN_CLASS);
        }
    }
}

export interface StepInfo {
    title: string;
    index?: number;
    hasError?: boolean;
    memo?: string;
    active?: boolean;
    isCurrent?: boolean;
    readonly?: boolean;
    visible?: boolean;
}
