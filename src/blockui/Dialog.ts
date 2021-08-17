import BaseUI from "../uidesign/view/BaseUI";
import ClickEvent = JQuery.ClickEvent;
import {CommonUtils} from "../common/CommonUtils";
import {UiUtils} from "../common/UiUtils";

export class Dialog<T extends DialogInfo> extends BaseUI<T> {

    public static SIZE = {
        small: "modal-sm",
        middle: "modal-md",
        large: "modal-lg",
        x_large: "modal-xl"
    };
    private static TEMPLATE = require("./template/Dialog.html");
    private static FOOTER_SELECTOR = ".modal-footer";
    private static OK_BUTTON_SELECTOR = ".dlg-ok-button";
    private static CLOSE_BUTTON_SELECTOR = ".dlg-close-button";
    protected importValue: any;
    protected hasInited = false;

    private btns: Array<HTMLElement | string> = new Array<HTMLElement | string>();
    private btnListeners: Array<(event: ClickEvent) => void> = new Array<(ClickEvent) => void>();

    private x = 0;
    private y = 0;
    private isDragging = false;
    private dragHandler: (event) => void;
    private upHandler: (event) => void;

    public show(value?: any, size?) {
        $("body").append(this.getViewUI());
        if (size || this.properties.size) {
            this.setSize(size || this.properties.size);
        }

        this.beforeShow(value);
        this.importValue = value;
        this.$element.modal({backdrop: "static"});
        this.$element.modal('show');
        if (!this.hasInited && (this.properties.draggable == null || this.properties.draggable)) {

            //TODO 需要转成移动标题，来移动窗口
            // this.$element.find(".modal-dialog").draggable();
        }

        this.afterShow();
        this.hasInited = true;

    }

    protected initEvent() {
        this.dragHandler = (event) => {
            //是否为可移动状态
            if (this.isDragging) {
                let moveX = event.clientX - this.x;//得到距离左边移动距离
                let moveY = event.clientY - this.y;//得到距离上边移动距离

                this.$element.css("left", moveX + "px");
                this.$element.css("top", moveY + "px");
            } else {
                return;
            }
        };
        this.upHandler = (event) => {
            this.isDragging = false;
        };
        this.$element.find(".modal-header").on("mousedown",
            (event) => {

                this.x = event.clientX - this.$element.get(0).offsetLeft;
                this.y = event.clientY - this.$element.get(0).offsetTop;
                this.isDragging = true;
            });

        $(document).on("mousemove", this.dragHandler);
        $(document).on("mouseup", this.upHandler);
    }

    protected afterShow() {

    }

    setSize(size) {
        if (this.$element) {
            if (Array.isArray(size)) {
                this.$element.find(".modal-dialog").width(size[0]);
                this.$element.find(".modal-body").height(size[1]);
                this.$element.find(".modal-dialog").addClass(Dialog.SIZE.x_large);
            } else {
                this.$element.find(".modal-dialog").addClass(size);
            }
        } else {
            if (Array.isArray(size)) {
                this.properties.width = size[0];
                this.properties.height = size[1];
            } else {
                this.properties.size = size;
            }

        }
    }

    public close() {
        if (this.properties.beforeClose) {
            if (!this.properties.beforeClose()) {
                return;
            }
        }

        this.$element.modal('hide');

    }

    destroy(): boolean {
        this.btnListeners = new Array<(ClickEvent) => void>();
        this.btns = new Array<HTMLElement | string>();
        this.hasInited = false;
        $(document).off("mousedown", this.dragHandler);
        $(document).off("mouseup", this.upHandler);
        return super.destroy();
    }

    protected beforeShow(value?: any) {

    }


    protected createUI(): HTMLElement {
        let $ele = $(Dialog.TEMPLATE);
        let sub = this.getBody();
        $ele.find(".modal-title").text(this.properties.title);
        if (sub) {
            $ele.find(".modal-body").append(sub);
        }
        if (this.properties.height) {
            $ele.find(".modal-body")
                .css("height", this.properties.height);
        }
        if (this.properties.width) {
            $ele.find(".modal-body").css("width", this.properties.width);
        }

        if (this.btns) {
            let index = 0;
            for (let btn of this.btns) {
                this.appendButton(btn, this.btnListeners[index++], $ele);
            }
        }

        this.addEventHandler($ele);
        return $ele.get(0);

    }

    protected addEventHandler($element) {
        $element.on('hidden.bs.modal', () => {
            if (this.properties.destroyOnClose == null ||
                this.properties.destroyOnClose) {
                this.destroy();
            }
        });
        $element.find(Dialog.OK_BUTTON_SELECTOR).on("click", (e) => {
            if (!this.beforeOK()) {
                return;
            }
            if (this.properties.onOk) {
                if (this.properties.onOk(this.getValue())) {
                    this.close();
                }
            } else {
                this.close();
            }
        });
        $element.find(Dialog.CLOSE_BUTTON_SELECTOR).on("click", () => {
            this.close();
        });

        // $element.on('shown.bs.modal', function () {
        //     var $this = $(this);
        //     var $modal_dialog = $this.find('.modal-dialog');
        //     var m_top = ($(window).height() - $modal_dialog.height()) / 2 - 100;
        //     $modal_dialog.animate({'top': m_top + 'px'},"fast");
        // });


    }

    protected getValue() {
        return this.importValue
    }

    protected beforeOK(): boolean {
        return true;
    }

    setOkButtonVisible(isShow) {
        if (isShow) {
            this.$element.find(Dialog.OK_BUTTON_SELECTOR).removeClass(Dialog.HIDDEN_CLASS);
        } else {
            this.$element.find(Dialog.OK_BUTTON_SELECTOR).addClass(Dialog.HIDDEN_CLASS);
        }
    }

    setOkButtonText(text) {
        this.$element.find(Dialog.OK_BUTTON_SELECTOR).text(text);
    }

    setCancelButtonVisible(isShow) {
        if (isShow) {
            this.$element.find(Dialog.CLOSE_BUTTON_SELECTOR).removeClass(Dialog.HIDDEN_CLASS);
        } else {
            this.$element.find(Dialog.CLOSE_BUTTON_SELECTOR).addClass(Dialog.HIDDEN_CLASS);
        }
    }

    public addButton(btn: HTMLElement | string, clickHandler: (event: ClickEvent) => void) {
        if (this.$element) {
            this.appendButton(btn, clickHandler, this.$element);
        }
        this.btns.push(btn);
        this.btnListeners.push(clickHandler);
    }

    protected appendButton(btn: HTMLElement | string, clickHandler: (event: ClickEvent) => void, $element: JQuery) {
        let $close = $element.find(Dialog.FOOTER_SELECTOR);
        if (typeof btn === "string") {
            btn = $("<button type=\"button\" class=\"btn btn-success \">" + btn + "</button>").get(0);
        }
        $close.prepend(btn);
        $(btn).on("click", (e) => {
            clickHandler(e);
        })
    }

    setBodyContent(html: HTMLElement) {
        if (this.$element) {
            this.$element.find(".modal-body").append(html);
        } else {
            this.properties.content = html;
        }

    }


    protected getBody(): HTMLElement {
        if (this.properties.content) {
            if (typeof this.properties.content === "string") {
                return $("<label>" + this.properties.content + "</label>").get(0);
            } else {
                return this.properties.content;
            }

        }
        return null;

    }

    setContent(content?: string | HTMLElement) {
        this.properties.content = content;
        let sub = this.getBody();
        if (this.$element && sub) {
            this.$element.find(".modal-body").children().remove();
            this.$element.find(".modal-body").append(sub);
        }
    }

    static showConfirm(message, onOk) {
        let dlgInfo = {
            title: "确认",

            onOk: () => {
                onOk();
                return true
            },
            content: message
        };
        new Dialog(dlgInfo).show();
    }

}

export interface DialogInfo {
    title: string,
    width?: number;
    height?: number;
    size?: string;
    beforeClose?: () => boolean;
    onOk?: (...items) => boolean;
    content?: string | HTMLElement;
    destroyOnClose?: boolean;
    draggable?: boolean;
}
