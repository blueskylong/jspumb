//TODO 完善成提示信息

import {Utils} from "tslint";

export class UiUtils {

    static lstResizeListener = new Array<() => void>();
    //是否正在调整大小
    static isResizing = false;
    //是否已错过了变化事件
    static hasLostEvent = false;

    static showInfo(info: string) {
        alert(info);
    }

    static showWarning(info: string) {
        alert(info);
    }

    /**
     * 取得块视图的数据
     * @param blockId
     */
    static getBlockViewDataUrl(blockId) {
        return "/dmdata/findBlockData/" + blockId;
    }

    static getBlockViewNoPageUrl(blockId) {
        return "/dmdata/findBlockDataNoPage/" + blockId;
    }

    static getWindowWidth() {
        let pageWidth = window.innerWidth;

        if (typeof pageWidth != "number") {
            //标准模式
            if (document.compatMode == "CSS1Compat") {
                pageWidth = document.documentElement.clientWidth;
                //怪异模式
            } else {
                pageWidth = document.body.clientWidth;
            }
        }
        return pageWidth;
    }

    static showMask() {
        let $mask = $(".mask-panel");
        if ($mask.length == 0) {
            $("body").append(require("./templates/Mask.html"))
            $mask = $(".mask-panel");
        }
        $mask.modal("show");
    }

    static hideMask() {
        $(".mask-panel").modal("hide");
    }

    static regOnWindowResized(listener: () => void) {
        UiUtils.lstResizeListener.push(listener);
    }

    static unRegOnWindowResized(listener: () => void) {
        let index = UiUtils.lstResizeListener.indexOf(listener);
        if (index != -1) {
            UiUtils.lstResizeListener.splice(index, 1);
        }

    }

    static fireResizeEvent(dom?) {
        if (UiUtils.isResizing) {
            UiUtils.hasLostEvent = true;
            return;
        }
        let $root = $(dom || document);
        try {
            UiUtils.isResizing = true;
            //处理autoFix类的高度
            $root.find(".autofit").each((index, el) => {
                UiUtils.autoSize(el);
            });
            $root.find(".auto-width").each((index, el) => {
                UiUtils.autoWidth(el);
            });
            $root.find(".auto-height").each((index, el) => {
                UiUtils.autoHeight(el);
            });

            if (UiUtils.lstResizeListener.length > 0) {
                for (let listener of UiUtils.lstResizeListener) {
                    listener();
                }
            }

        } finally {
            setTimeout(() => {
                UiUtils.isResizing = false;
                if (UiUtils.hasLostEvent) {
                    UiUtils.hasLostEvent = false;
                    UiUtils.fireResizeEvent();
                }
            }, 100);

        }

    }

    static autoSize(el: HTMLElement) {
        UiUtils.autoWidth(el);
        UiUtils.autoHeight(el);
    }

    static autoHeight(el: HTMLElement) {
        let height = UiUtils.getAutoFitHeight(el);
        if (height < 1) {
            return;
        }
        $(el).height(height);
    }

    static autoWidth(el: HTMLElement) {
        let width = UiUtils.getAutoFitWidth(el);
        if (width < 1) {
            return;
        }
        $(el).width(width);
    }

    static getAutoFitHeight(el: HTMLElement) {
        let parent = $(el).parent();
        if (parent.length == 0) {
            return -1;
        }
        let parHeight = parent.height();
        if (parHeight <= 0) {
            return -1;
        }
        //查询兄弟的高度
        let children = parent.children();
        let brotherHeight = 0;
        if (children.length > 1) {
            for (let i = 0; i < children.length; i++) {
                if (children.get(i) === el) {
                    continue;
                }
                brotherHeight += $(children.get(i)).outerHeight(true);
            }
        }
        if (parHeight <= brotherHeight) {
            return -1;
        }
        //还要去掉自身的margin
        let thisMarginHeight = $(el).outerHeight(true) - $(el).height();
        return parHeight - brotherHeight - thisMarginHeight - 1;
    }

    static getAutoFitWidth(el: HTMLElement) {
        let parent = $(el).parent();
        if (parent.length == 0) {
            return -1;
        }
        let parWidth = parent.width();
        if (parWidth <= 0) {
            return -1;
        }
        //查询兄弟的高度
        let children = parent.children();
        let brotherWidth = 0;
        if (children.length > 1) {
            for (let i = 0; i < children.length; i++) {
                if (children.get(i) === el) {
                    continue;
                }
                brotherWidth += $(children.get(i)).outerWidth(true);
            }
        }
        if (parWidth <= brotherWidth) {
            return -1;
        }
        //还要去掉自身的margin
        let thisMarginWidth = $(el).outerWidth(true) - $(el).width();
        return parWidth - brotherWidth - thisMarginWidth - 1;
    }

    static addAutoHeightFit(el: HTMLElement) {
        $(el).addClass("auto-height");
    }

    static addAutoWidth(el: HTMLElement) {
        $(el).addClass("auto-width");
    }
}

$(window).on("resize", function () {
    UiUtils.fireResizeEvent();
});

