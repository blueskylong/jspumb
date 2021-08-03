/**
 * 显示配置页面
 */
import {BorderLayout, BorderLayoutProperty} from "./layout/BorderLayout";
import {BaseComponent} from "../uidesign/view/BaseComponent";
import {GlobalParams} from "../common/GlobalParams";
import {UiService} from "./service/UiService";
import {PageInfoDto} from "../funcdesign/dto/PageInfoDto";
import {PageInfo} from "../funcdesign/dto/PageInfo";
import {PageDetailDto} from "../funcdesign/dto/PageDetailDto";
import {Constants} from "../common/Constants";
import {Table} from "./table/Table";
import {ServerRenderProvider} from "./table/TableRenderProvider";
import {TreeUI} from "./JsTree/TreeUI";
import {Form} from "./Form";
import {ReferenceTree} from "./JsTree/ReferenceTree";
import BaseUI from "../uidesign/view/BaseUI";
import {ManagedCustomPanelContainer} from "./managedView/ManagedCustomPanelContainer";

export default class PageUI<T extends PageUIInfo> extends BaseComponent<T> {

    protected layout: BorderLayout<any>;
    protected pageInfo: PageInfo;
    protected lstBaseUI: Array<BaseUI<any>> = new Array<BaseUI<any>>();
    protected readyCount = 0;

    protected createUI(): HTMLElement {

        return $("<div class='full-display'></div>").get(0);
    }

    static getInstance(pageId, version?) {
        let blockDto = new PageInfoDto();
        blockDto.pageId = pageId;
        blockDto.versionCode = version || GlobalParams.getLoginVersion();
        let pageUI = new PageUI(blockDto);
        return pageUI;
    }


    async initSubControls() {
        if (!this.pageInfo) {
            console.log("------>1");
            this.pageInfo = await UiService.findPageInfo(this.properties.pageId) as any;
            console.log("------>2");
        }
        if (!this.pageInfo || !this.pageInfo.getPageDetail()) {
            console.log("------>3");
            return;
        }
        console.log("------>4");
        let lstPageDetail = this.pageInfo.getPageDetail();
        if (!lstPageDetail || lstPageDetail.length == 0) {
            return;
        }
        console.log("------>5");
        this.layout = new BorderLayout<any>(this.initWidthAndHeight(lstPageDetail));
        for (let detail of lstPageDetail) {
            let baseUI = await this.createSubUI(detail);
            this.lstBaseUI.push(baseUI);
            this.layout.addComponent(detail.pagePosition, baseUI);
            //计算宽度和高度
        }

        console.log("------>6");

        this.$element.append(this.layout.getViewUI());
        this.layout.show();
    }

    public getPageInfo(): PageInfo {
        return this.pageInfo;
    }


    private initWidthAndHeight(lstPageDetail: Array<PageDetailDto>) {

        let layout = new BorderLayoutProperty();
        let totalWidth = this.$element.width();
        //如果还没有父级的宽度，则不计算
        if (totalWidth < 20) {
            return layout;
        }

        for (let pageDetail of lstPageDetail) {
            if (pageDetail.initWidth) {
                layout[pageDetail.pagePosition + "Width"] = pageDetail.initWidth;
            } else {
                layout[pageDetail.pagePosition + "Width"] = 1;
            }
            if (pageDetail.initHeight) {
                layout[pageDetail.pagePosition + "Height"] = pageDetail.initHeight;
            } else {
                layout[pageDetail.pagePosition + "Height"] = 1;
            }
        }
        return this.roundLayout(layout);

    }

    private roundLayout(proper: BorderLayoutProperty) {
        let totalWidth = this.$element.width();
        let width = 1;
        let defaultLayout = BorderLayoutProperty.genDefaultFullProperty();
        //先检查宽度
        //第一优先，数据不等于1
        if (proper.westWidth != 0 && proper.westWidth != 1) {
            if (proper.westWidth > 1) {
                proper.westWidth = proper.westWidth / totalWidth;
            }
            width = width - proper.westWidth;
        }

        if (proper.centerWidth != 0 && proper.centerWidth != 1) {
            if (proper.centerWidth > 1) {
                proper.centerWidth = proper.centerWidth / totalWidth;
            }
            width = width - proper.centerWidth;
        }
        if (proper.eastWidth != 0 && proper.eastWidth != 1) {
            if (proper.eastWidth > 1) {
                proper.eastWidth = proper.eastWidth / totalWidth;
            }
            width = width - proper.eastWidth;
        }
        if (width < 0) {
            throw new Error("宽度设置错误,超出范围");
        }
        //第二轮分配未设置的
        if (proper.westWidth == 1) {
            proper.westWidth = Math.min(width, defaultLayout.westWidth);
            width = width - proper.westWidth;
        }
        if (proper.eastWidth == 1) {
            proper.eastWidth = Math.min(width, defaultLayout.eastWidth);
            width = width - proper.eastWidth;
        }

        if (proper.centerWidth == 1) {
            proper.centerWidth = width;
        }
        //计算高度--------------------------------------
        let totalHeight = this.$element.height();
        let height = 1;
        if (proper.northHeight != 0 && proper.northHeight != 1) {
            if (proper.northHeight > 1) {
                proper.northHeight = proper.northHeight / totalHeight;
            }
            height = height - proper.northHeight;
        }

        if (proper.centerHeight != 0 && proper.centerHeight != 1) {
            if (proper.centerHeight > 1) {
                proper.centerHeight = proper.centerHeight / totalHeight;
            }
            height = height - proper.centerHeight;
        }
        if (proper.southHeight != 0 && proper.southHeight != 1) {
            if (proper.southHeight > 1) {
                proper.southHeight = proper.southHeight / totalHeight;
            }
            height = height - proper.southHeight;
        }
        if (height < 0) {
            throw new Error("宽度设置错误,超出范围");
        }
        //第二轮分配未设置的
        let lastProper = "";
        if (proper.northHeight == 1) {
            proper.northHeight = Math.min(height, defaultLayout.northHeight);
            height = height - proper.northHeight;
            lastProper = "northHeight";
        }
        if (proper.southHeight == 1) {
            proper.southHeight = Math.min(height, defaultLayout.southHeight);
            height = height - proper.southHeight;
            lastProper = "southHeight";
        }

        if (proper.centerHeight == 1) {
            if (height == 1) {
                proper.centerHeight = 0.9;
                proper.southHeight = 0.1;
            } else {
                proper.centerHeight = height;
                height = 0;
            }
            lastProper = "centerHeight";
        }
        if (height > 0) {
            proper[lastProper] += height;
        }
        return proper;


    }

    protected async createSubUI(pageDetail: PageDetailDto) {
        let baseUi: BaseUI<any> = null;
        if (pageDetail.viewType == Constants.PageViewType.blockView) {
            //以下显示块
            let blockViewId = pageDetail.viewId;
            //如果是表
            let viewer = await UiService.getSchemaViewer(blockViewId);
            let showType = viewer.blockViewDto.defaultShowType;
            if (pageDetail.showType) {
                showType = pageDetail.showType;
            }

            if (showType == Constants.DispType.table) {
                baseUi = new Table(new ServerRenderProvider(blockViewId));
            } else if (showType == Constants.DispType.tree) {
                let treeInstance = TreeUI.getTreeInstance(viewer.blockViewDto.blockViewId);
                baseUi = treeInstance;
            } else if (showType == Constants.DispType.custom) {
                baseUi = new ManagedCustomPanelContainer(pageDetail);
            } else {
                baseUi = Form.getInstance(viewer.blockViewDto.blockViewId);
            }
        } else if (pageDetail.viewType == Constants.PageViewType.reference) {//引用只可以用树
            baseUi = ReferenceTree.getTreeInstance(pageDetail.viewId, pageDetail.versionCode);
        } else {//嵌套其它页面
            baseUi = PageUI.getInstance(pageDetail.viewId, pageDetail.versionCode);

        }
        baseUi.addReadyListener(() => {
            console.log("-----------------------ready")
            this.readyCount++;
            if (this.readyCount == this.pageInfo.getPageDetail().length) {
                this.fireReadyEvent();
            }
        });
        return baseUi;
    }


    getValue(): any {
    }

    setEditable(editable: boolean) {
        if (this.lstBaseUI) {
            for (let ui of this.lstBaseUI) {
                if (typeof ui["setEditable"] === "function") {
                    ui["setEditable"](editable);
                }
            }
        }
    }

    setEnable(enable: boolean) {
        if (this.lstBaseUI) {
            for (let ui of this.lstBaseUI) {
                if (typeof ui["enable"] === "function") {
                    ui["enable"](enable);
                }
            }
        }
    }

    setValue(value: any) {
    }

    destroy(): boolean {
        this.layout.destroy();
        this.pageInfo = null;
        return super.destroy();
    }


}

export interface PageUIInfo {
    pageId: number;
    version?: string;
}
