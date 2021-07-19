//TODO 完善成提示信息

export class UiUtils {

    static lstResizeListener = new Array<() => void>();

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

    static fireResizeEvent() {
        //处理autoFix类的高度
        $(".autofit").each((index, el) => {
            UiUtils.autoSize(el);
        });
        if (UiUtils.lstResizeListener.length > 0) {
            for (let listener of UiUtils.lstResizeListener) {
                listener();
            }
        }

    }

    static autoSize(el: HTMLElement) {
        let height = UiUtils.getAutoFitHeight(el);
        if (height < 1) {
            return;
        }
        $(el).height(height);
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
                brotherHeight += $(children.get(i)).height();
            }
        }
        if (parHeight <= brotherHeight) {
            return -1;
        }
        return parHeight - brotherHeight;
    }

    static addAutoHeightFit(el: HTMLElement) {
        $(el).addClass("autofit");
    }
}

$(window).on("resize", function () {
    UiUtils.fireResizeEvent();
});

