import {BlockViewer} from "../uiruntime/BlockViewer";
import {Table} from "./Table";
import {UiService} from "../service/UiService";
import {TreeNode, TreeNodeFactory} from "../../common/TreeNode";
import {CommonUtils} from "../../common/CommonUtils";
import {Component} from "../uiruntime/Component";
import {Constants} from "../../common/Constants";
import {ReferenceData} from "../../datamodel/dto/ReferenceData";
import FormatterOptions = FreeJqGrid.FormatterOptions;
import ColumnModel = FreeJqGrid.ColumnModel;

/**
 * 表体渲染接口,这个针对jqTable.
 */
export interface TableRenderProvider {

    /**
     * 某个单元格的编辑器
     * @param rowid
     * @param colIndex
     * @param value
     */
    getCellEditor(rowid: String, colIndex: number, value?: any, extParams?: any);

    /**
     * 取得一单元格的值
     * @param rowid
     * @param colIndex
     * @param value
     */
    getCellValue(rowid: String, colIndex: number, value?: any);

    /**
     * 某一单元格是否可以编辑
     * @param rowid
     * @param colIndex
     * @param value
     */
    isCellEditable(rowid: String, colIndex: number, value?: any);

    // /**
    //  * 取得列信息
    //  */
    // getColumnModel(): Array<ColumnModel>;

    /**
     * 取得分组信息
     */
    getColumnGroup(): FreeJqGrid.SetGroupHeaderOptions;

    /**
     * 取得后台的配置信息
     */
    getBlockInfo?(): BlockViewer;

    setAllowLoadData?(allow: boolean)

    /**
     * 取得表参数
     */
    getOptions(table: Table): Promise<FreeJqGrid.JqGridOptions>;

    setEditable(editable): void;

    setEnabled(enable): void;

    setExtFilterProvider(extFilterProvider: ExtFilterProvider);


    /**
     * 设置操作列按钮生成提供器
     * @param pro
     * colAndRowInfo:包含列信息,和行信息  FormatterOptions
     * ROW行数据
     * STATE 状态  action?: "edit" | "add"
     */
    setOperatorProvider(pro: (colAndRowInfo: FormatterOptions, row, state) => string);

}


export class ServerRenderProvider implements TableRenderProvider {

    static ServerDataUrl = CommonUtils.getServerUrl("/dmdata/findBlockData");
    static $label = $("<label></label>");
    /**
     * 是否可以编辑
     */
    protected isEditable = false;
    protected isEnable = true;
    protected viewer: BlockViewer;
    protected tableOption: FreeJqGrid.JqGridOptions;
    protected isReady = false;

    //手动插入的列
    protected lstExtCol: Array<ColumnModel>;
    private operatorProvider: (colAndRowInfo: FormatterOptions, row, state) => string;

    setOperatorProvider(pro: (colAndRowInfo: FormatterOptions, row, state) => string) {
        this.operatorProvider = pro;
    }


    setLstExtCol(lstColModel: Array<ColumnModel>) {
        this.lstExtCol = lstColModel;
    }

    /**
     * 表不会主动去调用查询,需要手动触发
     */
    protected allowLoadData = false;

    /**
     * 额外的过滤条件过滤 ,其优先级要大于控件自己生成的条件,会有覆盖的现象
     */
    protected extFilterProvider: ExtFilterProvider;

    protected lstColumn: Array<ColumnModel> = new Array<ColumnModel>();
    protected groupHeader = {
        useColSpanStyle: true,
        applyLabelClasses: false,
        groupHeaders: []
    };

    constructor(protected blockId: string | number, protected customOptions?: FreeJqGrid.JqGridOptions) {
    }

    /**
     * 设置是不是允许访问服务器
     * @param allow
     */
    setAllowLoadData(allow: boolean) {
        this.allowLoadData = allow;
    }

    setEnabled(enable) {
        this.isEnable = enable;
    }

    /**
     * 取得单元格的编辑器
     * @param rowid
     * @param colIndex
     * @param value
     */
    public getCellEditor(rowid, colIndex, value, extParams?: any) {
        if (!this.isEditable) {
            ServerRenderProvider.$label.html(value);
            return ServerRenderProvider.$label.get(0);
        }
        let ele = $("<input type='text' ></input>");
        ele.val(value);
        ele.attr("id", extParams.id);
        ele.attr("name", extParams.name);
        return ele.get(0);
    }

    setExtFilterProvider(extFilterProvider: ExtFilterProvider) {
        this.extFilterProvider = extFilterProvider;
    }

    /**
     * 取得显示值
     * @param rowid
     * @param colIndex
     * @param value
     */
    public getCellValue(rowid, colIndex, value) {

    }

    public isCellEditable(rowid, colIndex, value) {
        if (!this.isEditable) {
            return false;
        }
        return true;
    }

    /**
     * 取得列末级列
     */
    public getColumnModel(): Array<ColumnModel> {
        return this.lstColumn;
    }

    getBlockInfo(): BlockViewer {
        return this.viewer;
    }

    /**
     * 取得分组信息
     *
     */
    public getColumnGroup(): FreeJqGrid.SetGroupHeaderOptions {
        if (this.groupHeader.groupHeaders.length > 0) {
            return this.groupHeader;
        }
        return null;
    }

    protected async findViewerInfo(blockId) {
        this.viewer = await UiService.getSchemaViewer(blockId) as any;
    }

    /**
     * 初始化表头
     */
    protected async init() {
        await this.findViewerInfo(this.blockId);
        if (this.viewer) {
            let lstComponent = this.viewer.getLstComponent();
            if (!lstComponent || lstComponent.length == 0) {
                lstComponent = [];
                return;
            }
            let blockDto = this.viewer.getBlockViewDto();
            let comNodes = TreeNodeFactory.genTreeNode(lstComponent, "componentDto", "lvlCode");
            //增加一个操作列
            this.lstColumn.push(this.createOperatorColModel());
            for (let node of comNodes) {
                //隐藏域不显示，表中不显示的列不显示
                let component = node.data;

                //这里需要先初始化选项数据
                if (component.getColumn().getColumnDto().refId && Constants.ComponentType.select ==
                    node.data.getComponentDto().dispType) {
                    await UiService.getReferenceData(component.getColumn().getColumnDto().refId);
                }
                if (this.viewer.getBlockViewDto().fieldToCamel == 1) {
                    component.column.getColumnDto().fieldName
                        = CommonUtils.toCamel(component.column.getColumnDto().fieldName);
                }
                if (node.children) {//目前只做二层
                    this.groupHeader.groupHeaders.push(this.createGroupHeader(node));
                    for (let subNode of node.children) {
                        await ServerRenderProvider.createColModel(subNode.data, this.lstColumn);
                    }
                } else {
                    await ServerRenderProvider.createColModel(component, this.lstColumn);
                }
            }
            if (this.lstExtCol) {
                this.lstColumn.push(...this.lstExtCol);
            }
        }
    }


    private createOperatorColModel(): ColumnModel {
        return {
            name: Table.OPERATE_COL_ID,
            search: false,
            width: 100,
            label: "操作",
            edittype: "button",
            frozen: false,
            formatter: (cellval, opts: FormatterOptions, row, act) => {
                if (this.operatorProvider) {
                    return this.operatorProvider(opts, row, act);
                }
                return "";
            }
        } //操作列
    }

    private createGroupHeader(node: TreeNode<Component>) {

        return {
            startColumnName: node.children[0].data.column.getColumnDto().fieldName,
            numberOfColumns: node.children.length,
            titleText: node.data.componentDto.title,
            id: node.data.componentDto.componentId
        }
    }

    public static async createColModel(com: Component, lstColumn) {

        let options: ColumnModel = {
            name: com.column.getColumnDto().fieldName,
            index: com.column.getColumnDto().fieldName,
            width: com.componentDto.width ? com.componentDto.width : 200,
            search: typeof com.componentDto.showSearch === "undefined" || com.componentDto.showSearch == null || !!com.componentDto.showSearch,
            searchoptions: this.getSearchEditorInfo(com),
            align: com.getTextAlign(),
            label: com.componentDto.title,
            id: com.componentDto.componentId,
            editable: true,
            labelClasses: Table.COLUMN_LABEL_CLASS_PREFIX + com.getComponentDto().componentId,
            edittype: com.componentDto.dispType as any
        };
        if (com.getComponentDto().hideInTable == 1 ||
            com.getComponentDto().dispType == Constants.ComponentType.hidden) {
            options.hidden = true;
        }
        if (Constants.ComponentType.checkbox == com.getComponentDto().dispType) {
            options.formatter = "checkbox";
            options.edittype = "checkbox";
            options.formatoptions = {"value": "1:0"};
            options.align = "center";
        } else if (Constants.ComponentType.select == com.getComponentDto().dispType) {
            options.formatter = "select";

            await new SelectionColumnFormatter(com.getColumn().getColumnDto().refId, options);
        } else if (Constants.ComponentType.time == com.getComponentDto().dispType) {
            options.formatter = "date";
            options.edittype = "text";
            options.formatoptions = {srcformat: 'Y-m-d H:i:s', newformat: 'Y-m-d H:i:s'}
        }
        lstColumn.push(options);
    }

    private static getSearchEditorInfo(com: Component) {
        if (com.isNumberField()) {
            return {sopt: ['eq', 'ne', 'le', 'lt', 'gt', 'ge']};
        } else {
            return null;
        }
    }


    setEditable(editable): void {
        this.isEditable = editable;
    }

    /**
     * 取得表参数
     */
    async getOptions(table: Table): Promise<FreeJqGrid.JqGridOptions> {
        if (!this.tableOption) {
            await this.init();
            this.tableOption = $.extend(true, {}, DEFAULT_TABLE_CONFIG, this.customOptions || {});
            this.tableOption.colModel = this.getColumnModel();
            this.tableOption.ondblClickRow = (rowid: string, iRow: number, iCol: number, eventObject: JQueryEventObject) => {
                if (!rowid) {
                    return;
                }
                table.fireEvent(Constants.GeneralEventType.EVENT_DBL_CLICK, table.getRowData(rowid), table);
            };
            this.tableOption.url = (this.customOptions&&this.customOptions.url) ? CommonUtils.getServerUrl(this.customOptions.url)
                : ServerRenderProvider.ServerDataUrl + "/" + this.blockId;
            this.tableOption.datatype = "json";
            let blockId = this.blockId;
            let that = this;
            this.tableOption.beforeRequest = function () {
                if (!that.allowLoadData) {
                    return false;
                }
                this.p.postData["blockId"] = blockId;
                if (that.extFilterProvider) {
                    let extFilter = that.extFilterProvider.getExtFilter(that, this.p.postData as any);
                    if (extFilter) {
                        this.p.postData["extFilter"] = JSON.stringify(extFilter);
                    }
                }
            };
            this.tableOption.beforeSelectRow = () => {
                if (!this.isEnable) {
                    return false;
                }
            };

            return new Promise<FreeJqGrid.JqGridOptions>((resolve) => {
                resolve(this.tableOption);
            });
        } else {
            return new Promise<FreeJqGrid.JqGridOptions>((resolve) => {
                resolve(this.tableOption);
            });
        }
    }

    private findColumnByName(fieldName) {
        for (let col of this.viewer.getLstComponent()) {
            if (fieldName === col.column.getColumnDto().fieldName) {
                return col;
            }
        }
        return null;
    }
}

export class LocalRenderProvider extends ServerRenderProvider {
    constructor(viewer: BlockViewer, protected customOptions?: FreeJqGrid.JqGridOptions) {
        super(null, customOptions);
        this.viewer = viewer;
    }

    protected async findViewerInfo(blockId) {

        new Promise((resolve => {
            return this.viewer;
        }));
    }

    /**
     * 取得表参数
     */
    async getOptions(table: Table): Promise<FreeJqGrid.JqGridOptions> {
        if (!this.tableOption) {
            await this.init();
            this.tableOption = $.extend(true, {}, DEFAULT_TABLE_CONFIG, this.customOptions || {});
            this.tableOption.ondblClickRow = (rowid: string, iRow: number, iCol: number, eventObject: JQueryEventObject) => {
                table.fireEvent(Constants.GeneralEventType.EVENT_DBL_CLICK, table.getRowData(rowid), table);
            };
            this.tableOption.colModel = this.getColumnModel();
            return new Promise<FreeJqGrid.JqGridOptions>((resolve) => {
                resolve(this.tableOption);
            });
        } else {
            return new Promise<FreeJqGrid.JqGridOptions>((resolve) => {
                resolve(this.tableOption);
            });
        }
    }

}

export class FixRowServerRenderProvider extends ServerRenderProvider {
    protected async findViewerInfo(blockId) {
        this.viewer = await UiService.getSchemaViewer(blockId) as any;
    }
}

export interface ExtFilterProvider {
    getExtFilter(source: object, oldFilter: object): object;
}

let DEFAULT_TABLE_CONFIG: FreeJqGrid.JqGridOptions = {
    guiStyle: "bootstrapPrimary",
    datatype: 'local',
    multiselect: true,
    multiselectPosition: "left",
    rownumbers: true,
    multiselectWidth: 25,
    rownumWidth: 40,
    sortable: true, // 是否可列排序
    rowList: [10, 20, 50, 100, '-1:全部'],
    rowNum: 20,
    styleUI: 'Bootstrap',
    pagerpos: "center",
    autowidth: true,
    pgtext: '第 {0}页， 共{1}页',
    viewrecords: true,
    recordtext: '显示第 {0} 至 {1} 条记录，共 {2} 项',
    recordpos: 'left' as any,
    emptyrecords: '没有匹配的结果',
    loadtext: '读取中...',
    treeGridModel: "adjacency",
    treedatatype: 'local',
    // footerrow: true,
    shrinkToFit: false,
    frozen: true,
    // frozenColumns: true,
    pager: ".xx",//这里只是临时使用
    colModel: [],
    cellEdit: true,
    ajaxGridOptions: {xhrFields: {withCredentials: true}},
    jsonReader: {
        root: "data",    // json中代表实际模型数据的入口
        page: "page.currentPage",    // json中代表当前页码的数据
        total: "page.totalPage",    // json中代表总页数
        records: "page.totalRecord", // json中代表数据行总数的数据
        repeatitems: true, // 如果设为false，则jqGrid在解析json时，会根据name来搜索对应的数据元素（即可以json中元素可以不按顺序）；而所使用的name是来自于colModel中的name设定。
        cell: "cell",
        id: Table.ID_FIELD,
        userdata: "userdata",
        subgrid: {
            root: "lstData",
            repeatitems: true,
            cell: "cell"
        }
    },
    prmNames: {
        id: Table.ID_FIELD,
        subgridid: Table.ID_FIELD,
    }


};

export class SelectionColumnFormatter {
    private strSelection = "";

    constructor(private refId, private colModel: ColumnModel) {
        this.initData();
    }

    async initData() {
        let lstData = <Array<ReferenceData>>await UiService.getReferenceData(this.refId);

        if (lstData != null && lstData.length > 0) {
            lstData.forEach(row => {
                this.strSelection += row.id + ":" + row.name + ";";
            });
            this.strSelection = ":全部;" + this.strSelection.substr(0, this.strSelection.length - 1);

            this.colModel.edittype = "select";
            this.colModel.editoptions = {"value": this.strSelection};
            this.colModel.stype = 'select';
            this.colModel.searchoptions = {"value": this.strSelection};
        }
    }

}

