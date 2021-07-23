import BaseUI from "../../uidesign/view/BaseUI";
import {PageWidget} from "./PageWidget";
import {PageWidgetBox} from "./PageWidgetBox";
import "./templates/BlockedHomePage.css"
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import {UiUtils} from "../../common/UiUtils";

export class BlockedHomePage extends BaseUI<any> {
    static HOME_BLOCKS = {};

    static regHomePageBlock(name: string, constructor: { new(...args: Array<any>): any }) {
        BlockedHomePage.HOME_BLOCKS[name] = constructor;
    }

    static unRegHomePageBlock(name: string) {
        delete BlockedHomePage.HOME_BLOCKS[name];
    }

    private lstBlockBox: Array<PageWidgetBox> = [];

    protected createUI(): HTMLElement {
        return $(require("./templates/BlockedHomePage.html")).get(0);
    }

    protected initEvent() {
        this.$element.find(".refresh-button").on("click", (event) => {
            this.refresh();
        });

        this.resizeListener = () => {
            this.refresh();
        };
        UiUtils.regOnWindowResized(this.resizeListener);
        this.addReadyListener(() => {
            let lstSortBlocks = new Array<PageWidget>();
            for (let name in BlockedHomePage.HOME_BLOCKS) {
                lstSortBlocks.push(new BlockedHomePage.HOME_BLOCKS[name]());
            }
            //排序
            lstSortBlocks.sort((a, b) => {
                return a.getOrder() - b.getOrder();
            });
            //生成界面
            for (let block of lstSortBlocks) {
                let pageWidgetBox = new PageWidgetBox(block);
                this.$element.append(pageWidgetBox.getViewUI());
                this.lstBlockBox.push(pageWidgetBox);
            }
        });
    }

    private refresh() {
        for (let blockBox of this.lstBlockBox) {
            try {
                blockBox.refresh();
            } catch (e) {
                console.log(e.stack)
            }

        }
    }

    afterComponentAssemble(): void {

        this.fireReadyEvent();
    }

    destroy(): boolean {
        if (this.lstBlockBox) {
            for (let box of this.lstBlockBox) {
                box.destroy();
            }
        }
        return super.destroy();
    }


}
