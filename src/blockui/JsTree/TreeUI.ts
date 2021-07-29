import {JsTree, JsTreeInfo} from "./JsTree";
import {BlockViewDto} from "../../uidesign/dto/BlockViewDto";
import {GlobalParams} from "../../common/GlobalParams";
import {UiService} from "../service/UiService";
import {CommonUtils} from "../../common/CommonUtils";
import {BlockViewer} from "../uiruntime/BlockViewer";
import {BaseComponent} from "../../uidesign/view/BaseComponent";
import {Component} from "../uiruntime/Component";
import {Constants} from "../../common/Constants";
import {UiUtils} from "../../common/UiUtils";

/**
 * 设计生成的树
 */
export class TreeUI<T extends BlockViewDto> extends BaseComponent<T> {
    protected viewer: BlockViewer;
    protected blockViewId: number;
    protected versionCode;
    protected jsTree: JsTree<any>;
    protected lstComponent: Array<Component>;
    private canLoadData = false;
    protected extFilter = {};
    protected treeInfo: JsTreeInfo;
    protected hasCodeField:boolean;

    protected lstOnceReady: Array<() => void> = new Array<() => void>();

    static getTreeInstance(blockId, version?) {
        let blockDto = new BlockViewDto();
        blockDto.blockViewId = blockId;
        blockDto.versionCode = version || GlobalParams.getLoginVersion();
        let tree = new TreeUI(blockDto);
        tree.blockViewId = blockId;
        tree.versionCode = version;

        return tree;
    }

    getTree() {
        return this.jsTree;
    }

    async initSubControls() {
        if (!this.viewer) {
            this.viewer = await UiService.getSchemaViewer(this.blockViewId) as any;
        }
        this.lstComponent = this.viewer.getLstComponent();
        if (!this.lstComponent || this.lstComponent.length == 0) {
            this.lstComponent = [];
            return;
        }
        this.properties = this.viewer.getBlockViewDto() as any;
        this.treeInfo = this.genTreeInfo(this.lstComponent);
        this.treeInfo.rootName = this.properties.title || "所有数据";
        this.treeInfo.showSearch = true;
        this.treeInfo.url = () => {
            if (!this.canLoadData) {
                return null;
            }
            return UiUtils.getBlockViewNoPageUrl(this.properties.blockViewId);

        };
        this.jsTree = new JsTree<any>(this.treeInfo);
        this.$element.append(this.jsTree.getViewUI());
        this.jsTree.addReadyListener(() => {
            this.onUiDataReady();

            this.fireReadyEvent();
        })


    }

    protected onUiDataReady() {

    }

    private genTreeInfo(lstComponent: Array<Component>): JsTreeInfo {
        let treeInfo = {} as JsTreeInfo;
        if (!lstComponent) {
            console.log("TreeUI---->没有配置树的相关信息");
            treeInfo.textField = "";
            treeInfo.rootName = "未指定树结构信息";
            return treeInfo;
        }
        let component = this.findCompByTreeType(Constants.TreeRole.idField, lstComponent);
        if (!component) {
            console.log("TreeUI--->没有指定树结构的ID字段");
        } else {
            treeInfo.idField = component.getColumn().getColumnDto().fieldName;
        }
        component = this.findCompByTreeType(Constants.TreeRole.codeField, lstComponent);
        if (!component) {
            console.log("TreeUI--->没有指定树结构的编码字段");
            this.hasCodeField =false;
        } else {
            this.hasCodeField =true;
            treeInfo.codeField = component.getColumn().getColumnDto().fieldName;
        }
        component = this.findCompByTreeType(Constants.TreeRole.nameField, lstComponent);
        if (!component) {
            console.log("TreeUI--->没有指定树结构的名称字段");
        } else {
            treeInfo.textField = component.getColumn().getColumnDto().fieldName;
        }
        component = this.findCompByTreeType(Constants.TreeRole.parentField, lstComponent);
        if (component) {
            treeInfo.parentField = component.getColumn().getColumnDto().fieldName;
        }
        treeInfo.requestMethod = JsTree.request_post;
        treeInfo.getFilter = () => {
            return {blockId: this.blockViewId, extFilter: JSON.stringify(this.extFilter), "_search": true};
        };
        treeInfo.onReady = () => {
            this.fireOnceReadyEvent();
        }
        return treeInfo;

    }

    private fireOnceReadyEvent() {
        if (this.lstOnceReady.length > 0) {
            for (let listener of this.lstOnceReady) {
                listener();
            }
            this.lstOnceReady.splice(0, this.lstOnceReady.length);
        }
    }

    private findCompByTreeType(type, lstComponent: Array<Component>) {
        for (let comp of lstComponent) {
            if (comp.getComponentDto().treeRole == type) {
                return comp;
            }
        }
        return null;
    }

    reload(onReady?: () => void) {
        this.canLoadData = true;
        if (onReady) {
            this.lstOnceReady.push(onReady);
        }
        this.jsTree.reload();

    }

    protected createUI(): HTMLElement {
        return $("<div class='full-display'></div>").get(0);
    }

    getValue(): any {
        return this.jsTree.getValue();
    }

    setEditable(editable: boolean) {
        this.jsTree.setEditable(editable);
    }

    setEnable(enable: boolean) {
        this.jsTree.setEnable(enable);
    }

    setValue(value: any) {
        this.jsTree.setValue(value);
    }


}
