import "jstree/dist/themes/default/style.css";
import {BaseComponent} from "../../uidesign/view/BaseComponent";
import {CommonUtils} from "../../common/CommonUtils";
import {NetRequest} from "../../common/NetRequest";
import "../../jsplugs/jstree";
import {GeneralEventListener} from "../event/GeneralEventListener";
import {StringMap} from "../../common/StringMap";
import {CodeLevelProvider} from "../../common/CodeLevelProvider";
import {ButtonInfo} from "../../uidesign/view/JQueryComponent/Toolbar";

export class JsTree<T extends JsTreeInfo> extends BaseComponent<T> {
    static VIRTURE_ROOT_ID = "xxxxxxxxxxx";
    static request_get = "get";
    static request_post = "post";

    static EVENT_SELECT_CHANGED = "treeSelectChanged"

    private jsTree: JSTree;

    private $jsTree: JQuery;

    private static ROOT_KEY = "#";

    private currentNode: any;

    private hoverData: any;

    private timeCount = 0;

    private isCounting = false;
    private btns: JQuery;
    private silence = false;
    private selectedListener: Array<GeneralEventListener> = new Array<GeneralEventListener>();
    private dropListener: Array<GeneralEventListener> = new Array<GeneralEventListener>();

    protected dragable = false;

    protected createUI(): HTMLElement {
        this.dragable = this.properties && this.properties.dnd && this.properties.dnd.isDraggable;
        return $(require("../templete/JsTree.html")).get(0);
    }

    private treeProps = {
        "core": {
            "animation": 0,
            "check_callback": true,
            "themes": {"stripes": true},
            'checkbox': {
                "keep_selected_style": false
            }

        },
        "dnd": {
            onlyDroppable: true,
            is_draggable: () => {
                return this.getCanDragable()
            },
            onDrop: (node) => {
                this.fireDropEvent(node);
            }
        },
        "plugins": [
            "dnd", "search",
            "state", "types"
        ]
    };

    getJsTree() {
        return this.jsTree;
    }

    public setShowCheck(canCheck) {
        if (this.properties.multiSelect != canCheck) {
            this.properties.multiSelect = canCheck;
            this.updateCheckBoxShow();
        }
    }

    private updateCheckBoxShow() {
        this.properties.multiSelect ? this.jsTree.show_checkboxes() : this.jsTree.hide_checkboxes();
    }

    changeCurrentNodeText(str) {
        if (!this.currentNode) {
            return;
        }
        this.getJsTree().set_text(this.currentNode, str);
    }

    changeNodeText(id, str) {
        let node = this.getJsTree().get_node(id);
        if (node) {
            this.getJsTree().set_text(node, str);
        }
    }

    private onReady() {
        if (this.properties.onReady) {
            this.properties.onReady();
        }
        this.setEditable(this.editable);
    }

    deselectAll(supress_event?: boolean) {
        this.getJsTree().deselect_all(supress_event);
        this.selectNode(this.getJsTree().select_node(JsTree.ROOT_KEY))
    }


    protected initSubControls() {
        this.createTree();
        this.bindEvent();
    }

    selectNode(node: any) {
        if (!this.properties.multiSelect) {
            this.jsTree.deselect_all();
        }
        this.jsTree.select_node(node);
    }

    selectNodeById(id: number | string | Array<string>, silence = false) {
        CommonUtils.readyDo(() => {
            return this.isReady()
        }, () => {
            this.jsTree.deselect_all();
            this.jsTree.select_node(id);
        })

    }

    addSelectListener(listener: GeneralEventListener) {
        this.selectedListener.push(listener);
    }

    addDropListener(listener: GeneralEventListener) {
        this.dropListener.push(listener);
    }

    protected fireDropEvent(nodeId) {
        if (this.dropListener.length > 0) {
            for (let listener of this.dropListener) {
                listener.handleEvent("drop-tree", nodeId, null);
            }
        }
    }

    destroy(): boolean {
        if (this.jsTree && this.$jsTree) {
            this.jsTree.destroy(false);
            this.$jsTree = null;
            this.currentNode = null;
            this.hoverData = null;
            this.btns = null;
            this.selectedListener = null;
            this.dropListener = null;
        }
        return super.destroy();
    }

    private createTree() {
        if (this.properties.multiSelect) {
            this.treeProps.plugins.push("checkbox")
        }
        if (this.properties.contenxtMenu) {
            this.treeProps.plugins.push("contextmenu")
        }
        this.treeProps.dnd.onlyDroppable = false;


        this.treeProps = $.extend(true, this.treeProps, this.properties);
        if (this.properties.url) {
            // data可以是一个函数,实现异步查询返回处理
            this.treeProps.core['data'] = (obj, callback) => {
                let url = null;
                if (typeof this.properties.url === "string") {
                    url = this.properties.url;
                } else if (typeof this.properties.url === "function") {
                    url = this.properties.url();
                }
                if (url) {
                    NetRequest.axios[this.properties.requestMethod || JsTree.request_get](url, this.makeFilter())
                        .then((result) => {
                            if (result.status == 200) {
                                if (CommonUtils.isHandleResult(result.data)) {
                                    callback(this.makeTreeData(result.data.data))
                                } else {
                                    callback(this.makeTreeData(result.data));
                                }

                                return;
                            }
                            alert("Tree encounter error!")
                        });

                } else {
                    callback(this.makeTreeData([]));
                }
            }

        }
        this.$jsTree = this.$element.find(".tree-panel");
        this.$jsTree.jstree(this.treeProps);
        this.jsTree = this.$jsTree.jstree(true);
        if (!this.properties.url) {
            this.setValue(null);
        }

        this.createToolbar();
    }

    setDraggable(canDragSort) {
        this.dragable = canDragSort;
        if (this.isReady()) {
            this.getJsTree().refresh();
        }
    }

    getCanDragable() {
        return this.dragable;
    }

    /**
     * 生成查询条件,一般的树是不需要查询条件的,主要是为了子类使用
     */
    protected makeFilter() {
        if (this.properties.getFilter) {
            return this.properties.getFilter();
        }
        return {}
    }

    private createToolbar() {
        this.btns = this.$element.find(".tree-button-toolbar");
        if (this.btns) {
            this.btns.children().off("click");
            this.btns.children().remove();
        }
        if (this.properties.buttons) {
            for (let btn of this.properties.buttons) {
                let $btn = $("<span class='tree-button "
                    + (btn.iconClass ? btn.iconClass : "") + "' title='" + (btn.hint || btn.text || '') + "'>"
                    // + (btn.text ? btn.text : "") 这里先不使用文字显示,
                    + "</span>");
                if (btn.clickHandler) {
                    $btn.on("click", (e) => {
                        if (!this.enabled) {
                            return;
                        }
                        btn.clickHandler(e, this.hoverData);
                    });
                }
                this.btns.append($btn);
            }
        }
    }

    /**
     * 设置显示的按钮
     * @param btns
     */
    setButtons(btns: Array<ButtonInfo>) {
        this.properties.buttons = btns;
        this.createToolbar();
    }

    private fireSelectChangeListener(data) {
        if (this.silence) {
            this.silence = false;
            return;
        }
        if (this.selectedListener.length > 0) {
            for (let listener of this.selectedListener) {
                listener.handleEvent(JsTree.EVENT_SELECT_CHANGED, data, this);
            }
        }
    }

    addDblClick(listener: GeneralEventListener) {
        this.addListener("dblclick", listener);
    }

    private bindEvent() {
        this.$jsTree.on("activate_node.jstree", (obj, e) => {
            // 获取当前节点
            this.currentNode = e.node;
        });
        this.$jsTree.on("dblclick", (event) => {
            this.fireEvent("dblclick", this.getCurrentNode(), this);
        });

        this.$jsTree.on("select_node.jstree", (event, data) => {
            //有些地方可能出问题
            if (this.currentNode === data.node && !this.properties.multiSelect) {
                return;
            }
            this.currentNode = data.node;
            this.fireSelectChangeListener(data.node.data);
        });
        this.$jsTree.on("deselect_node.jstree", (event, data) => {
            //有些地方可能出问题
            if (this.currentNode === data.node && !this.properties.multiSelect) {
                return;
            }
            this.currentNode = null;
            this.fireSelectChangeListener(data.node.data);
        });

        this.$jsTree.on("state_ready.jstree", (event) => {
            this.jsTree.open_all();
            if (this.treeProps.dnd['isCanDrop']) {
                this.$element.children("li").addClass("droppable");
            }

            this.fireReadyEvent();
            if (this.properties.loadOnReady) {
                this.reload();
            }
            if (this.properties.url) {
                this.onReady();
            }

        });
        this.$jsTree.on("refresh.jstree", (event) => {
            this.jsTree.open_all();
            if (this.treeProps.dnd['isCanDrop']) {
                this.$element.children("li").addClass("droppable");
            }
            this.onReady();
            this.ready = true;
        });
        if (!this.properties.showSearch) {
            this.$element.find(".search-input").addClass(JsTree.HIDDEN_CLASS);
        }
        this.$element.find(".search-input").on("keyup", (e) => {
                this.startCount($(e.target).val());
            }
        );

        this.$element.on("mouseover", (e) => {
            if (!this.properties.buttons || !this.enabled) {
                return;
            }
            let $ele = $(e.target);

            if ($ele.hasClass("jstree-anchor")) {
                this.btns.removeClass("hidden");
                this.btns.offset({top: $ele.offset().top, left: $ele.offset().left + $ele.width() + 3});
                this.hoverData = this.jsTree.get_node(e.target);
            } else {
                this.btns.addClass("hidden");
            }
            this.changeButtons();
        });
        this.btns.on("mouseover", (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
        this.$element.on("mouseleave", (e) => {
            this.btns.addClass("hidden");
            this.hoverData = null;
        });
    }

    afterComponentAssemble(): void {
        if (this.properties.showSearch) {
            this.$jsTree.css("height", "calc(100%-60px)")
        } else {
            this.$jsTree.css("height", "calc(100%-10px)")
        }
        super.afterComponentAssemble();
    }

    /**
     * 根据设置显示按钮
     */
    private changeButtons() {
        if (this.properties.buttons && this.hoverData) {
            let $buttons = this.btns.find(".tree-button");
            for (let i = 0; i < this.properties.buttons.length; i++) {
                let btnDefine = this.properties.buttons[i];
                if (btnDefine.isShow) {
                    btnDefine.isShow(this.hoverData) ? $($buttons.get(i)).removeClass(JsTree.HIDDEN_CLASS) :
                        $($buttons.get(i)).addClass(JsTree.HIDDEN_CLASS);
                }
            }
        }
    }


    private startCount(value) {
        if (this.isCounting) {
            this.timeCount = 3;
            return;
        }
        this.isCounting = true;
        let int = setInterval(() => {
            this.timeCount--;
            if (this.timeCount < 0) {
                clearInterval(int);
                this.isCounting = false;
                this.jsTree.search(this.$element.find(".search-input").val() as string);
            }
        }, 300);
    }

    getValue(): any {
        let oraData = this.jsTree.get_json(null, {flat: true});
        if (oraData) {
            let result = [];
            if (this.properties.rootName) {
                oraData.splice(0, 1);
            }
            for (let row of oraData) {
                result.push(row.data);
            }
            return result;
        }
        return oraData;
    }

    setEditable(editable: boolean) {
        super.setEditable(editable);
        this.setEnable(editable);
    }

    setEnable(enable: boolean) {
        super.setEnable(enable);
        super.setEditable(enable);
        let data = this.jsTree.get_json(null, {flat: true});
        if (!enable) {
            this.btns.addClass("hidden");
            for (let row of data) {
                let node = this.jsTree.get_node(row.id);
                this.jsTree.disable_node(node);
            }
        } else {
            for (let row of data) {
                let node = this.jsTree.get_node(row.id);
                this.jsTree.enable_node(node);
            }
        }
        this.jsTree.redraw(true);
    }


    /**
     * 设置树上数据
     * @param value
     * @param directset
     */
    setValue(value: any, directset = false) {
        this.ready = false;
        this.jsTree.settings.core.data = directset
            ? value : this.makeTreeData(value);
        this.jsTree.refresh(false, true);
    }

    protected makeTreeData(data: Array<object>): Array<any> {
        if (this.properties.idField && this.properties.parentField) {
            return this.makeTreeDataById(data);
        } else {
            return this.makeTreeDataByCode(data);
        }

    }

    protected makeTreeDataByCode(data: Array<object>, lvlProvider?: CodeLevelProvider) {
        let result = new Array<Node>();
        let node: Node;
        let code;
        let rootId = JsTree.ROOT_KEY;
        lvlProvider = lvlProvider || CodeLevelProvider.getDefaultCodePro();
        this.properties.idField = this.properties.idField || Node.ID_FIELD;
        this.properties.codeField = this.properties.codeField || Node.CODE_FIELD;
        this.properties.textField = this.properties.textField || Node.TEXT_FIELD;
        if (this.properties.rootName) {
            let nodeRoot = new Node();
            if (!this.properties.rootId) {
                this.properties.rootId = JsTree.VIRTURE_ROOT_ID;
            }
            rootId = this.properties.rootId;
            nodeRoot.id = rootId;
            nodeRoot.parent = JsTree.ROOT_KEY;
            nodeRoot.text = this.properties.rootName;
            nodeRoot.data = null;
            result.push(nodeRoot);
        }
        let map = new StringMap<any>();
        //先收集所有的编辑数据
        let emptyLevelPro = new CodeLevelProvider();
        emptyLevelPro.setCurCode("900");
        if (data) {
            let codeField = this.properties.codeField;
            let idField = this.properties.idField;
            for (let row of data) {
                let lvlCode = row[codeField];
                if (!lvlCode) {
                    lvlCode = emptyLevelPro.getNext();
                    row[codeField] = lvlCode;
                }
                map.set(lvlCode, row[idField]);
            }
            //按编码排序
            data.sort((row1, row2) => {
                if (row1[codeField] > row2[codeField]) {
                    return 1;
                } else if (row1[codeField] === row2[codeField]) {
                    return 0;
                } else {
                    return -1
                }
            });
            for (let row of data) {
                node = new Node();
                code = row[codeField];
                if (!code) {
                    node.id = CommonUtils.genUUID();
                    node.parent = rootId;

                } else {
                    node.id = row[this.properties.idField];
                    try {
                        lvlProvider.setCurCode(code);

                        node.parent = map.get(lvlProvider.getPreLvlString());
                        if (!node.parent) {
                            node.parent = rootId;
                        }
                    } catch (e) {
                        console.log(e);
                        node.parent = rootId;
                    }
                }
                node.text = row[this.properties.textField];
                node.key = row[this.properties.idField];
                node.data = row;
                result.push(node);
            }
        }
        return result;
    }

    getCurrentData() {
        if (this.currentNode) {
            return this.currentNode.data;
        }
        return null;
    }

    getCurrentId() {
        if (this.currentNode) {
            return this.currentNode.id;
        }
        return null;
    }

    getCurrentNode() {
        return this.currentNode;
    }

    getNodeData(node: any) {
        return this.jsTree.get_json(node);
    }

    getNodeCode(node: any) {
        let data = this.jsTree.get_json(node);
        if (data) {
            return data.data[this.properties.codeField];
        }
    }

    isLeaf(node: string | object) {
        return this.jsTree.is_leaf(node);
    }

    /**
     * 取得选择的节点ID,一般是lvl_code 适用多选
     * @param onlyLeaf
     */
    getSelectedId(onlyLeaf = false) {
        if (onlyLeaf) {
            return this.getJsTree().get_bottom_selected(false);
        }
        return this.getJsTree().get_selected(false);
    }

    getSelectFullData(onlyLeaf = false) {
        let selectData;
        if (onlyLeaf) {
            selectData = this.jsTree.get_bottom_selected(true);
        } else {
            selectData = this.jsTree.get_selected(true);
        }
        if (!selectData || selectData.length < 1) {
            return selectData;
        }
        //如果手工增加了根节点,则要去掉
        if (this.properties.rootName) {
            for (let i = 0; i < selectData.length; i++) {
                let node = selectData[i];
                if (node.id === JsTree.VIRTURE_ROOT_ID) {
                    selectData.splice(i, 1);
                    break;
                }
            }
        }
        return selectData;

    }

    getAllSelectFullData() {
        let data = this.getSelectFullData(false);
        if (!data || data.length < 1) {
            return data;
        }
        let partSelectData = this.getJsTree().get_undetermined(true);
        if (partSelectData && partSelectData.length > 0) {
            data.push(...partSelectData);
        }
        //如果手工增加了根节点,则要去掉
        if (this.properties.rootName) {
            for (let i = 0; i < data.length; i++) {
                let node = data[i];
                if (node.id === JsTree.VIRTURE_ROOT_ID) {
                    data.splice(i, 1);
                    break;
                }
            }
        }
        return data;
    }

    isSelectRoot() {
        let node = this.getCurrentNode();
        return node && !node.data;
    }

    isRoot(node: any) {
        return node && !node.data;
    }

    reload() {
        this.ready = false;
        this.getJsTree().refresh(false, true);
    }

    getViewUI() {
        return super.getViewUI();
    }

    protected makeTreeDataById(data: Array<any>) {
        let result = new Array<Node>();
        let node: Node;
        let code;
        let rootId = JsTree.ROOT_KEY;
        if (this.properties.rootName) {
            let nodeRoot = new Node();
            rootId = JsTree.VIRTURE_ROOT_ID;
            nodeRoot.id = rootId;
            nodeRoot.parent = JsTree.ROOT_KEY;
            nodeRoot.text = this.properties.rootName;
            nodeRoot.data = null;
            result.push(nodeRoot);
        }
        if (data) {
            for (let row of data) {
                node = new Node();
                node.id = row[this.properties.idField];
                node.parent = row[this.properties.parentField] ? row[this.properties.parentField] : rootId;
                node.text = row[this.properties.textField];
                node.data = row;
                result.push(node);
            }
        }
        return result;
    }

}

export class Node {
    static ID_FIELD = "id";//id 字段
    static TEXT_FIELD = "name";//  名称字段
    static PARENT_FIELD = "parent_id";//父字段
    static CODE_FIELD = "code";//编码,需有级次,并且 是3-3-3的结构
    id: string;
    text: string;
    parent: string;
    data: any;
    key: any;
}

export interface JsTreeInfo {
    textField: string;
    multiSelect?: boolean;
    rootName?: string;
    codeField?: string;
    idField?: string;
    requestMethod?: string;
    showSearch?: boolean;
    loadOnReady?: boolean;
    url?: string | Function,
    parentField?: string;
    lvl?: Array<number>;
    onReady?: () => void;
    buttons?: Array<ButtonInfo>;
    dnd?: DragAndDrop;
    rootId?: string;
    getFilter?: () => object;
    contenxtMenu?: boolean;
}

export interface DragAndDrop {
    //是不是仅仅有droppable类的元素可以接收拖放
    onlyDroppable?: boolean,
    //是否可以拖
    isDraggable?: boolean,
    /**
     * 是否可以放下.针对当前位置
     * @param data
     */
    isCanDrop?: (sourceData, parentData) => boolean;
    /**
     * 是否可以拖起,针对单个节点
     * @param sourceData
     */
    isCanDrag?: (sourceData) => boolean;
}

