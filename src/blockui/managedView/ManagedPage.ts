import {AutoManagedUI} from "./AutoManagedUI";

import {ManagedTable} from "./ManagedTable";
import {ManagedForm} from "./ManagedForm";
import PageUI, {PageUIInfo} from "../PageUI";
import {PageInfoDto} from "../../funcdesign/dto/PageInfoDto";
import {GlobalParams} from "../../common/GlobalParams";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {Constants} from "../../common/Constants";
import {UiService} from "../service/UiService";
import {ServerRenderProvider} from "../table/TableRenderProvider";
import {ManagedTreeUI} from "./ManagedTreeUI";
import BaseUI from "../../uidesign/view/BaseUI";
import {ManagedRefTree} from "./ManagedRefTree";
import {ManagedCard} from "./ManagedCard";
import {ManagedCustomPanelContainer} from "./ManagedCustomPanelContainer";
import {CommonUtils} from "../../common/CommonUtils";

/**
 * 此表单只响应列表或树选中情况下的显示
 * 表单只响应本级数据源的变化
 */
export class ManagedPage<T extends PageUIInfo> extends PageUI<T> {
    protected pageDetail: PageDetailDto;

    getSubManagedUI(): Array<AutoManagedUI> {
        let result = new Array<AutoManagedUI>();
        for (let subComp of this.lstBaseUI) {
            if (ManagedPage.isAutoManagedUI(subComp)) {
                result.push(subComp as any);
            } else if (subComp instanceof ManagedPage) {
                result.push(...subComp.getSubManagedUI());
            }
        }
        return result;
    }

    /**
     * 根据编码查询页面元素
     * @param controlCode
     */
    findSubUI(controlCode: string): AutoManagedUI {
        if (CommonUtils.isEmpty(controlCode)) {
            return null;
        }
        for (let subComp of this.lstBaseUI) {
            if (ManagedPage.isAutoManagedUI(subComp)) {
                if (controlCode == (subComp as any).getPageDetail().uiCode) {
                    return subComp as any;
                }
            } else if (subComp instanceof ManagedPage) {
                let result = subComp.findSubUI(controlCode);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }

    /**
     * 根据类型查询页面元素
     * @param _Constructor
     */
    findSubUIByType(_Constructor: Function): AutoManagedUI {
        if (CommonUtils.isEmpty(_Constructor)) {
            return null;
        }
        for (let subComp of this.lstBaseUI) {
            if (ManagedPage.isAutoManagedUI(subComp)) {
                if (subComp instanceof _Constructor) {
                    return subComp as any;
                }
            } else if (subComp instanceof ManagedPage) {
                let result = subComp.findSubUIByType(_Constructor);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }


    addReadyListener(handler: (source: any) => void) {
        super.addReadyListener(handler);
        //这里增加检查,进一步提示,界面的完成数量
        setTimeout(() => {
            if (this.isReady()) {
                return;
            }
            if (this.lstBaseUI) {
                for (let baseUi of this.lstBaseUI) {
                    if (!baseUi.isReady()) {
                        console.log(baseUi);
                        console.log("错误！！以上界面没有完成！，请检查是不是没有发出完成事件（this.fireReadyEvent(any)）。")
                    }
                }
            }
        }, 4000);
    }

    static getManagedInstance(pageId, pageDetail: PageDetailDto, version?) {
        let blockDto = new PageInfoDto();
        blockDto.pageId = pageId;
        blockDto.versionCode = version || GlobalParams.getLoginVersion();
        let pageUI = new ManagedPage(blockDto);
        pageUI.pageDetail = pageDetail;
        return pageUI;
    }


    protected async createSubUI(pageDetail: PageDetailDto) {
        let baseUi = null;
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
                baseUi = ManagedTable.getManagedInstance(new ServerRenderProvider(blockViewId), pageDetail);
            } else if (showType == Constants.DispType.tree) {
                let treeInstance = ManagedTreeUI.getManagedInstance(pageDetail);
                baseUi = treeInstance;
            } else if (showType == Constants.DispType.card) {
                let card = ManagedCard.getManagedInstance(pageDetail);
                baseUi = card;
            } else if (showType == Constants.DispType.custom) {
                baseUi = new ManagedCustomPanelContainer(pageDetail);
            } else {
                baseUi = ManagedForm.getManagedInstance(pageDetail);
            }
        } else if (pageDetail.viewType == Constants.PageViewType.reference) {//引用只可以用树
            baseUi = ManagedRefTree.getManagedInstance(pageDetail.viewId, pageDetail, pageDetail.versionCode);
        } else {//嵌套其它页面
            let instance = ManagedPage.getManagedInstance(pageDetail.viewId, pageDetail, pageDetail.versionCode);
            baseUi = instance;
        }
        //如果需要在创建时就显示数据,则这里需要调用一次,默认所有的组件都不直接取数
        baseUi.addReadyListener(() => {
            console.log("-----------------------ready")
            this.readyCount++;
            if (this.readyCount == this.pageInfo.getPageDetail().length) {

                this.fireReadyEvent();
            }
        });
        return baseUi;
    }

    getUiByID(type, id): BaseUI<any> {
        if (!id) {
            return null;
        }
        let subManagedUI = this.getSubManagedUI();
        if (subManagedUI) {
            for (let ui of subManagedUI) {
                if (ui.getPageDetail()) {
                    if (ui.getPageDetail().showType == type && ui.getPageDetail().viewId == id) {
                        return ui as any;
                    }
                }
            }
        }
        return null;
    }


    /**
     * 判断是不是自管理类型
     * @param obj
     */
    protected static isAutoManagedUI(obj: Object) {
        return obj['getPageDetail'] && obj["getTableIds"] && obj["setManageCenter"] && obj["checkAndSave"];
    }

    getUiDataNum(): number {
        return Constants.UIDataNum.multi;
    }

    /**
     * 检查并保存
     */
    async checkAndSave(): Promise<boolean> {
        for (let subUi of this.lstBaseUI) {
            if (ManagedPage.isAutoManagedUI(subUi)) {
                let result = await (<AutoManagedUI>(subUi as any)).checkAndSave();
                if (!result) {
                    return new Promise(resolve => resolve(false));
                }
            }
        }
        return new Promise(resolve => resolve(true));
    }
}
