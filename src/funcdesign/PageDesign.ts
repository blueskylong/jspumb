import "./template/PageDesign.css"
import {MenuFunction,} from "../blockui/MenuFunction";
import {BeanFactory, MenuFunc} from "../decorator/decorator";
import {JsTree, JsTreeInfo} from "../blockui/JsTree/JsTree";
import {Constants} from "../common/Constants";
import {BorderLayout, BorderLayoutProperty} from "../blockui/layout/BorderLayout";
import {Form} from "../blockui/Form";
import {BorderDesignPanel} from "./widget/BorderDesignPanel";

import {InputDlg} from "../blockui/dialogs/InputDlg";
import {Alert} from "../uidesign/view/JQueryComponent/Alert";
import PageService from "./serivce/PageService";
import {CommonUtils} from "../common/CommonUtils";
import {Dialog, DialogInfo} from "../blockui/Dialog";
import {PageInfoDto} from "./dto/PageInfoDto";
import {PageInfo} from "./dto/PageInfo";
import {CodeLevelProvider} from "../common/CodeLevelProvider";
import {Select} from "../uidesign/view/JQueryComponent/Select";
import {IComponentGenerator} from "../uidesign/view/generator/IComponentGenerator";
import {JQueryGeneralComponentGenerator} from "../uidesign/view/JQueryComponent/JQueryGeneralComponentGenerator";
import {MenuInfo} from "../sysfunc/menu/dto/MenuInfo";
import {MenuButtonDto} from "../sysfunc/menu/dto/MenuButtonDto";
import {DmConstants} from "../datamodel/DmConstants";
import {UiUtils} from "../common/UiUtils";

@MenuFunc("PageDesign")
export default class PageDesign<T extends MenuInfo> extends MenuFunction<T> {

    private pageTree: JsTree<JsTreeInfo>;
    private blockTree: JsTree<JsTreeInfo>;
    private splitCenter: BorderLayout<any>;
    private fPage: Form;
    private fAttr: Form;
    private designPanel: BorderDesignPanel;
    private addDialog: InputDlg;
    private schemaId = DmConstants.DefaultSchemaIDs.DEFAULT_SYS_SCHEMA;
    private schemaSelect: Select<any>;
    private generator: IComponentGenerator = new JQueryGeneralComponentGenerator();

    protected createUI(): HTMLElement {
        let $ele = $(require("./template/PageDesign.html"));
        let compInfo = Form.genSimpDto(Constants.ComponentType.select, "方案选择", 12, "c1", 85);
        this.schemaSelect = <Select<any>>this.generator.generateComponent(compInfo.getComponentDto().dispType,
            compInfo, $ele.find(".block-tree").get(0), {
                handleEvent: (eventType: string, field: any, value: any, extObject?: any) => {
                    this.schemaId = value;
                    this.pageTree.reload();
                    this.blockTree.reload();
                    this.designPanel.showPage(null);
                    this.fPage.setValue({});
                }
            });
        $ele.find(".page-tree").append(this.schemaSelect.getViewUI());
        return $ele.get(0);
    }


    protected initSubControls() {
        this.pageTree = new JsTree<JsTreeInfo>({
            textField: "pageName",
            idField: "pageId",
            codeField: "lvlCode",
            rootName: "页面信息",
            dnd: {isDraggable: true, onlyDroppable: false},
            url: () => {
                return "/page/findPageInfos/" + this.schemaId
            }
        });

        this.blockTree = new JsTree<JsTreeInfo>({
            rootName: "视图",
            textField: "name",
            idField: "id",
            codeField: "code",
            url: () => {
                return "/page/getPageElements/" + this.schemaId
            },
            dnd: {
                isDraggable: true, onlyDroppable: true, isCanDrop: () => {
                    return false;
                }
            }
        });

        let layoutAttr = new BorderLayoutProperty();
        layoutAttr.centerHeight = 0.7;
        layoutAttr.centerWidth = 0.8;
        this.splitCenter = new BorderLayout<any>(layoutAttr);
        this.fAttr = Form.getInstance(85);
        this.fPage = Form.getInstance(80);
        this.designPanel = new BorderDesignPanel(BorderLayoutProperty.genDefaultFullProperty());

        this.addDialog = new InputDlg({
            title: "增加页面", inputTitle: "页面名称", isCanEmpty: false, destroyOnClose: false, onOk: (value) => {
                let parentId = null;
                if (this.pageTree.getCurrentData()) {
                    parentId = this.pageTree.getCurrentData().pageId;
                }
                this.addPage(value, parentId);
                return true;
            }
        });
    }

    private bindEvent() {
        this.pageTree.addSelectListener({
            handleEvent: (eventType: string, data: object, source: object, extObject?: any) => {
                if (data) {
                    this.designPanel.showPage(data['pageId']);
                    this.fPage.setValue(data);
                } else {
                    this.designPanel.showPage(null);
                    this.fPage.setValue({});
                }
            }
        });
        this.designPanel.setListener({
            handleEvent: (eventType: string, data: object, source: object, extObject?: any) => {
                this.fAttr.setValue(data);
            }
        });
        this.fAttr.addValueChangeListener({
            handleEvent: (eventType: string, data: object, source: object, extObject?: any) => {
                this.designPanel.attrChanged(data, source);
            }
        });
    }

    private loadPage(pageId) {

    }

    afterComponentAssemble(): void {
        this.$element.find(".split-pane")['splitPane']();
        this.$element.find(".page-tree").append(this.pageTree.getViewUI());
        UiUtils.addAutoHeightFit(this.pageTree.getViewUI());

        this.$element.find(".block-tree").append(this.blockTree.getViewUI());
        this.$element.find(".center-panel").append(this.splitCenter.getViewUI());
        this.splitCenter.addComponent(BorderLayout.center, this.designPanel);
        this.splitCenter.addComponent(BorderLayout.south, this.fPage);
        this.splitCenter.addComponent(BorderLayout.east, this.fAttr);
        this.splitCenter.show();
        this.bindEvent();
        this.fireReadyEvent();
    }

    private addPage(pageName, parentId?) {
        PageService.addPage(pageName, this.schemaId, parentId, (value) => {
            this.pageTree.getJsTree().refresh(false);
            this.pageTree.selectNodeById(value);
        });
    }

    protected doAdd() {
        this.addDialog.show();
    }

    protected doDelete() {
        let node = this.pageTree.getCurrentNode();
        if (this.pageTree.isSelectRoot() || (node.children && node.children.length > 0)) {
            Alert.showMessage("请选择叶子节点,现删除!");
            return;
        }
        new Dialog<DialogInfo>({
            title: "消息",
            content: "确定要删除页面[" + node.data.pageName + "]吗?",
            onOk: () => {
                PageService.deletePage(node.data.pageId, (err) => {
                    this.pageTree.reload();
                });
                return true;
            }
        }).show();

    }

    private doSave() {
        if (this.pageTree.isSelectRoot() || !this.pageTree.getCurrentNode()) {
            return;
        }
        UiUtils.showMask();
        try {

            let pageInfoDto = BeanFactory.populateBean(PageInfoDto, this.fPage.getValue());
            let lstDetail = this.designPanel.getData();
            let pageInfo = new PageInfo();
            pageInfo.setPageInfoDto(pageInfoDto);
            pageInfo.setPageDetailDto(lstDetail);
            let err = this.checkPage(pageInfo);
            if (err) {
                Alert.showMessage("数据不正确!" + err);
                UiUtils.hideMask();
                return;
            }
            PageService.savePageFullInfo(pageInfo, (data) => {
                this.pageTree.reload();

                this.pageTree.selectNodeById(pageInfoDto.pageId);
                UiUtils.hideMask();
                Alert.showMessage("保存成功");

            });

        } catch (e) {
            UiUtils.hideMask();
        }
    }

    private doSaveLvl() {
        new Dialog({
            title: "确认", content: "保存时会丢失当前页面的编辑信息.确定要保存级次信息吗?", onOk: () => {
                let oraData = this.pageTree.getJsTree().get_json(null, {flat: false});
                if (oraData && oraData.length > 0) {
                    let obj = {};
                    let provider = new CodeLevelProvider();
                    let data = oraData[0].children;
                    for (let row of data) {
                        this.makeLevel(provider, row, obj);
                    }
                    let curId = null;
                    if (this.pageTree.getCurrentData()) {
                        curId = this.pageTree.getCurrentData().pageId;
                    }
                    PageService.updatePageLevel(obj, this.schemaId, (data) => {
                        this.pageTree.reload();
                        if (curId) {

                            this.pageTree.selectNodeById(curId);
                            UiUtils.hideMask();
                            Alert.showMessage("保存成功");

                        }

                    });
                }
                return true;
            }
        }).show();
    }

    private makeLevel(codePro: CodeLevelProvider, node, obj) {

        let curCode = codePro.getNext();
        obj[node.data.pageId] = curCode;

        if (node.children && node.children.length > 0) {
            codePro.goSub();
            for (let subNode of node.children) {
                this.makeLevel(codePro, subNode, obj);
            }
            codePro.setCurCode(curCode);
        }
    }

    private checkPage(page: PageInfo) {
        if (!page.getPageInfoDto().pageName) {
            return "页面名称不可以为空!";
        }
        if (page.getPageInfoDto().height) {
            page.getPageInfoDto().height = Math.round(page.getPageInfoDto().height);
        }
        if (page.getPageInfoDto().width) {
            page.getPageInfoDto().width = Math.round(page.getPageInfoDto().width);
        }
        //....
        return null;
    }

    getButton(): Array<MenuButtonDto> {
        let btns = [];
        let button = new MenuButtonDto();
        button.iconClass = Constants.Icons.add;
        button.title = "增加";
        button.funcName = "doAdd";
        btns.push(button);

        button = new MenuButtonDto();
        button.iconClass = Constants.Icons.delete;
        button.title = "删除";
        button.funcName = "doDelete";
        btns.push(button);

        button = new MenuButtonDto();
        button.iconClass = Constants.Icons.save;
        button.title = "保存";
        button.funcName = "doSave";
        btns.push(button);

        button = new MenuButtonDto();
        button.title = "|";
        btns.push(button);

        button = new MenuButtonDto();
        button.iconClass = Constants.Icons.save;
        button.title = "保存级次";
        button.funcName = "doSaveLvl";
        btns.push(button);

        return btns;
    }

    destroy(): boolean {
        this.pageTree.destroy();
        this.blockTree.destroy();
        this.fPage.destroy();
        this.fAttr.destroy();
        this.designPanel.destroy();
        this.addDialog.destroy();
        this.splitCenter.destroy();
        return super.destroy();
    }
}
