import * as _ from 'underscore';
import './jgrid.ext';
import {BaseComponent} from "../../uidesign/view/BaseComponent";
import {CommonUtils} from "../../common/CommonUtils";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";

interface JQGridProps {
    defaults?: any; // jqgrid默认配置
    name?: string; // 预留标识码
    columns?: Array<any>; // 列信息配置
    rowindex?: boolean; // 是否显示序号列
    rowcheck?: boolean; // 是否显示多选框列
    checkboxHtml?: Function; //
    autoFitWidth?: boolean; // 是否自适应宽度
    autoFitHeight?: boolean; // 是否自适应高度
    autoFitRelativor?: string;
    fullHeight?: boolean; // 是否充满高度，充满高度后，表格高度等于组件高度
    height?: number; // 表格高度
    rowidField?: string; // 行标识字段
    rowparentField?: string; // 父级标识对应字段
    rowexpandedField?: string;
    rowtextField?: string; //
    editors?: any; // 编辑器配置信息
    readonly?: boolean; // 是否可编辑
    calculator?: Function; // 计算器
    validator?: Function; // 校验器
    pager?: boolean; // 是否分页
    ajax?: Function; // 数据请求
    serverSide?: boolean; // 是否服务端分页
    frozen?: boolean; // 是否启用固定列
    navButtons?: Array<any>; // 左下角按钮
    columnNav?: boolean; // 是否显示列隐藏按钮
    xlsxNav?: boolean; // 是否显示导出按钮
    insertNav?: boolean; // 是否显示插入按钮
    removeNav?: boolean; // 是否显示删除按钮
    emptyMessage?: string;
    emptyButtons?: Array<any>;
    errorbar?: boolean;
    defaultData?: Array<any>; // 缺省数据
    onDataChanged?: Function;
    hiddenCells?: Array<any>; // 隐藏的单元格
    hiddenRows?: Array<any>; // 隐藏的行
    noPaste?: boolean; // 是否可粘贴
    loadDataOnReady?: boolean; //
    rowReversable?: boolean; // 行是否可反选，默认为true
    beforeSelectRow?: Function; // 行选中前，返回false时终止选中
    onSelectRow?: Function; // 行选中事件
    onUnselectRow?: Function; // 行取消选中
    subGrid?: (jqgrid: JQGrid<JQGridProps>, rowid: string) => JQGridProps;
    subGridBeforeExpand?: Function;
    cfgUploader?: Function;
    selectDefault?: Function; // 第一个参数为row, 默认选中返回值为true的数据
    rowStyle?: Function; // 标记行信息
}

interface Tip {
    x?: string;
    y?: string;
    error?: boolean;
    message?: string;
}

class JQGrid<T extends JQGridProps> extends BaseComponent<T> {
    static DEFAULT_CONFIG = {
        datatype: 'local',
        multiselectWidth: 25,
        rownumWidth: 40,
        sortable: true, // 是否可列排序
        rowList: [10, 20, 50, 100, 1000, '-1:全部'],
        rowNum: 20,
        pagerpos: 'right',
        pgtext: '第 {0}页， 共{1}页',
        viewrecords: true,
        recordtext: '显示第 {0} 至 {1} 条记录，共 {2} 项',
        recordpos: 'left',
        emptyrecords: '没有匹配的结果',
        loadtext: '读取中...',
        treeGridModel: 'adjacency',
        treedatatype: 'local',
        frozen: true
    };
    private _subs = [];
    $tableEl: HTMLElement = null;
    $props: JQGridProps | Function = null; // 自定义配置
    beforeInit: Function = null;

    private static exportNavHandler(jqgrid: JQGrid<JQGridProps>) {
        jqgrid.jqGrid('exportExcelExt');
    }

    private static insertNavHandler(jqgrid: JQGrid<JQGridProps>) {
        jqgrid.insertRow({}, true);
    }

    private static removeNavHandler(jqgrid: JQGrid<JQGridProps>) {
        if (jqgrid.getSelectedCount() === 0) {
            Alert.showMessage('请至少选择一条记录！');
            return;
        }
        jqgrid.removeSelected();
    }

    protected createUI(): HTMLElement {
        return JQGrid.createFullPanel("").get(0);
    }


    private static colmunNavHandler(jqgrid: JQGrid<JQGridProps>, d: any, e: any) {
        const {colModel, colNames} = jqgrid.jqGrid('getGridParam');
        let values = [], options: Array<any> = [{
            id: '_all',
            text: '全部'
        }];
        for (let i = 0, l = colModel.length; i < l; i++) {
            let cm = colModel[i];
            if (cm.name !== 'rn' &&
                cm.name !== 'cb' &&
                cm.name !== 'subgrid') {
                options.push({
                    id: cm.name,
                    text: colNames[i],
                    parent: '_all'
                });
                if (!cm.hidden) {
                    values.push(cm.name);
                }
                // tsavalon.cell_treeselect(e.currentTarget, {
                //     value: values.join(','),
                //     options,
                //     multiple: true,
                //     threeState: true,
                //     onStop: (str: string) => {
                //         const newValues = str.split(',');
                //         // 新的小于旧的，说明影藏
                //         if (values.length > newValues.length) {
                //             for (let value of values) {
                //                 if (!_.contains(newValues, value)) {
                //                     jqgrid.jqGrid('hideColExt', value);
                //                 }
                //             }
                //         } else if (values.length < newValues.length) {
                //             for (let newValue of newValues) {
                //                 if (!_.contains(values, newValue)) {
                //                     jqgrid.jqGrid('showColExt', newValue);
                //                 }
                //             }
                //         }
                //         values = newValues;
                //     }
                // });
            }
        }
    }

    static eachColumns(columns: Array<any>, fn: Function, level = 1) {
        if (columns && columns.push && columns.length) {
            for (let column of columns) {
                fn(column, level,
                    !(column.children && column.children.push && column.children.length));
                JQGrid.eachColumns(column.children, fn, level + 1);
            }
        }
    }

    static countLeafColumns({children}) {
        let count = 0;
        if (children && children.push && children.length) {
            for (let child of children) {
                count += JQGrid.countLeafColumns(child);
            }
        } else {
            count = 1;
        }
        return count;
    }

    static firstLeafColumn(column) {
        const children = column.children;
        if (children && children.push && children.length) {
            return JQGrid.firstLeafColumn(children[0]);
        } else {
            return column;
        }
    }

    /********************************* 内部方法 ****************************************/
    protected onInit(e) {
        if (typeof this.$props === 'function') {
            this.$props((props: JQGridProps) => {
                this.doInit(props);
            });
        } else {
            this.doInit(this.$props || {});
        }
    }

    protected initSubControls() {
        this.onInit(null);
    }

    private doInit(props: JQGridProps) {
        this.beforeInit(this, props);
        /****************** jqgrid初始化前处理 ********************/
        const $element = $(this.$element),
            $t: any = $element.find('>table'), // 表格jQuery对象
            t = $t[0]; // 表格的DOM对象
        t.id = CommonUtils.genUUID();
        if (props.name) {
            $element.attr('name', props.name);
        }
        /****************** jqgrid初始化处理 **********************/
        const config = $.extend({}, JQGrid.DEFAULT_CONFIG, props.defaults);
        // 列信息处理, 组装colNames、colModel、多表头
        const groupHeaders = [],
            colNames = [],
            colModel: Array<any> = [];
        JQGrid.eachColumns(props.columns, (column, level, leaf) => {
            // 叶子节点处理
            if (leaf) {
                colNames.push(column.title || column.label || '');
                colModel.push(column);
            } else {
                const {name} = JQGrid.firstLeafColumn(column);
                const count = JQGrid.countLeafColumns(column);

                let headers = groupHeaders[level - 1];
                if (!headers) {
                    headers = [];
                    groupHeaders.push(headers);
                }
                headers.push({
                    startColumnName: name,
                    numberOfColumns: count,
                    titleText: column.title || column.label || ''
                });
            }
        });
        // 初始化单元格管理器
        // 是否固定列
        config.colModel = colModel;
        config.colNames = colNames;
        config.groupHeaders = groupHeaders;
        // 多表头不允许列排序
        if (config.groupHeaders.length) {
            config.sortable = false;
        }
        // navButtons解析
        if (props.columnNav) {
            if (!props.navButtons) {
                props.navButtons = [];
            }
            props.navButtons.push({
                caption: '列选择',
                buttonicon: 'ui-icon ui-icon-grip-dotted-horizontal',
                onClickButton: JQGrid.colmunNavHandler,
            });
        }
        if (props.readonly !== true && props.insertNav) {
            if (!props.navButtons) {
                props.navButtons = [];
            }
            props.navButtons.push({
                caption: '新增',
                buttonicon: 'ui-icon ui-icon-circle-plus',
                onClickButton: JQGrid.insertNavHandler,
            });
        }
        if (props.readonly !== true && props.removeNav) {
            if (!props.navButtons) {
                props.navButtons = [];
            }
            props.navButtons.push({
                caption: '删除',
                buttonicon: 'ui-icon ui-icon-trash',
                onClickButton: JQGrid.removeNavHandler,
            });
        }
        if (props.xlsxNav) {
            if (!props.navButtons) {
                props.navButtons = [];
            }
            props.navButtons.push({
                caption: '导出',
                buttonicon: 'ui-icon ui-icon-circle-arrow-s',
                onClickButton: JQGrid.exportNavHandler,
            });
        }

        // 添加子表
        if (props.subGrid) {
            config.subGrid = true;
            config.subGridOptions = {reloadOnExpand: false};
            // 子表展开前事件
            if (typeof props.subGridBeforeExpand === 'function') {
                $t.on('jqGridSubGridBeforeExpand', (event, subgrid_id, rowid) => {
                    if (props.subGridBeforeExpand(this, rowid) === false) {
                        return false;
                    }
                });
            }
            // 子表展开时渲染子表
            $t.on('jqGridSubGridRowExpanded', (event, subgrid_id, rowid) => {
                const subid = CommonUtils.genUUID();
                for (let sub of this._subs) {
                    if (sub.id === subid) {
                        return;
                    }
                }
                let subGrid = new JQGrid($.extend({
                    is: 'ngs-jqgrid',
                }, props.subGrid(this, rowid), {
                    id: subid
                }));
                this._subs.push(subGrid);
                $(subGrid.getViewUI()).appendTo($element.find('#' + subgrid_id));

            });
        }
        // 初始化
        $t.jqGridExt({
            p: config,
            vmodel: this,
            ext: props,
            autoFit: {
                autoFitRelativor: props.autoFitRelativor || this.$element,
                autoFitHeight: props.autoFitHeight,
                autoFitWidth: props.autoFitWidth
            },
        });
        /****************** jqgrid初始化后处理 ********************/
        this.$tableEl = t;
        // 加载数据
        if (props.loadDataOnReady !== false) {
            $t.reloadDataExt();
        }
    }

    /********************************* API ****************************************/
    /**
     * 判断组件是否加载完成
     * @returns {boolean}
     */
    isReady() {
        return super.isReady() && !!this.$tableEl;
    }

    /**
     * 调用jqgrid插件JQuery的API
     * @param args
     */
    jqGrid(...args) {
        const vm = this,
            tableEl = vm.$tableEl,
            $table: any = $(tableEl);
        if (args.length && tableEl[args[0]]) {
            return tableEl[args[0]]();
        } else {
            return $table.jqGrid(...args);
        }
    }

    /**
     * 刷新数据，可编辑表格会触发检验
     */
    refreshData() {
        this.reloadData();
    }

    /**
     * 重载数据，可编辑表格不会触发检验
     * @param searchData
     */
    reloadData(searchData?) {
        this.jqGrid('reloadDataExt', searchData);
    }

    reparseOptions(target: any) {
        this.jqGrid('parseOptionsExt', target);
    }

    /**
     * 过滤显示数据
     * @param {Function} fn
     */
    filterData(fn: Function) {
        this.jqGrid('filterDataExt', fn);
    }

    /**
     * 重置分页数据
     * @param records
     * @param recordsTotal
     * @param page
     * @param pageLength
     */
    resetPageData({records, recordsTotal, page, pageLength}) {
        this.jqGrid('setGridDataExt', {
            rows: records,
            page: page,
            total: Math.ceil(recordsTotal / pageLength),
            records: recordsTotal
        });
    }

    /**
     * 重置数据
     * @param args
     */
    resetData(data: Array<any>) {
        if (!_.isArray(data)) {
            return;
        }
        this.jqGrid('setGridDataExt', data, true);
    }

    /**
     * 设置数据
     * @param {Array<any>} data
     */
    setData(data: Array<any>) {
        this.jqGrid('setGridDataExt', data);
    }

    /**
     * 获取表数据
     * @returns {any}
     */
    getData() {
        return this.jqGrid('getGridDataExt');
    }

    /**
     * 导出excel文档
     */
    exportExcel() {
        this.jqGrid('exportExcelExt');
    }

    /**
     * 插入行
     * @param rowdata
     * @param srcrowid 插入位置
     * @param after 是否向后插入
     */
    insertRow(rowdata: any, srcrowid?: string | boolean) {
        this.jqGrid('insertRowExt', rowdata, srcrowid);
    }

    /**
     * 移除行
     * @param row
     */
    removeRow(row: any) {
        return this.jqGrid('removeRowExt', row);
    }

    /**
     * 移除行
     * @param row
     */
    removeRows(rows: Array<any>) {
        return this.jqGrid('removeRowExt', rows);
    }

    /**
     * 移除选中行
     */
    removeSelected() {
        const selarrrow = this.jqGrid('getGridParam', 'selarrrow'),
            selrow = this.jqGrid('getGridParam', 'selrow');
        if (selarrrow && selarrrow.length) {
            this.removeRows(selarrrow);
        } else if (selrow) {
            this.removeRow(selrow);
        }
    }

    /**
     * 获取行数据
     * @param rowid
     * @returns {any}
     */
    getRowData(rowid: string | string[]) {
        return this.jqGrid('getRowDataExt', rowid);
    }

    /**
     * 获取选中数量
     */
    getSelectedCount() {
        return this.jqGrid('getSelectedCountExt');
    }

    /**
     * 获取选中数据
     * @returns {any}
     */
    getSelectedData() {
        return this.jqGrid('getSelectedDataExt');
    }

    /**
     * 返回选中数据，返回必定为数组
     * @returns {Array<any>}
     */
    getSelected(): Array<any> {
        const selected = this.getSelectedData();
        if (selected) {
            return selected.push ? selected : [selected];
        } else {
            return [];
        }
    }

    /**
     *
     * 设置行数据
     * @param rowid
     * @param rowdata
     */
    setRowData(rowid: string, rowdata) {
        this.jqGrid('setRowDataExt', rowid, rowdata);
    }

    /**
     * 重新渲染单元格
     * @param x
     * @param y
     */
    rerenderCell(x: string, y: string) {
        this.jqGrid('rerenderCellExt', x, y);
    }

    /**
     * 设置但不触发校验
     * @param rowid
     * @param colname
     * @param value
     */
    resetValue(rowid: string, colname: string | number, value?: any) {
        this.jqGrid('resetValueExt', rowid, colname, value);
    }

    /**
     * 设置单元格值
     * @param rowid
     * @param colname
     * @param value
     */
    setCellValue(rowid: string, colname: string, value: any) {
        this.jqGrid('setValueExt', rowid, colname, value);
    }

    /**
     * 获取单元格真实值
     * @param rowid
     * @param colname
     * @returns {any}
     */
    getCellValue(rowid: string, colname: string) {
        // 若rowid不存在，获取列合计值
        if (!rowid || rowid === '?') {
            return this.jqGrid('getValueExt', null, colname);
        } else {
            return this.jqGrid('getValueExt', rowid, colname);
        }
    }

    /**
     * 设置footer数据
     * @param data
     */
    setFooterData(data) {
        this.jqGrid('footerData', 'set', data, true);
    }

    /**
     * 获取footer数据
     */
    getFooterData() {
        return this.jqGrid('footerData');
    }

    /**
     * 根据列
     */
    getColNameByIndex(index: number) {
        const iColByName = this.jqGrid('getGridParam', 'iColByName');
        for (let name in iColByName) {
            if (iColByName.hasOwnProperty(name) &&
                iColByName[name] === index) {
                return name;
            }
        }
    }

    /**
     * 触发change事件
     * @param e
     */
    change(e: any) {
        $(this.$tableEl).triggerHandler('jqGridDataChanged', $.extend(e, {
            action: 'validate'
        }));
    }

    /**
     * 计算+联动
     * @returns {JQGrid}
     */
    calculate(e?: any) {
        $(this.$tableEl).triggerHandler('jqGridDataChanged', $.extend(e, {
            action: 'calculate'
        }));
    }

    /**
     * 校验
     * @returns {JQGrid}
     */
    validate(e?: any) {
        $(this.$tableEl).triggerHandler('jqGridDataChanged', $.extend(e, {
            action: 'validate'
        }));
    }

    isValid(strict = false) {
        return this.jqGrid('isValidExt', strict);
    }

    setReadonly(readonly = true) {
        this.jqGrid('setReadonlyExt', readonly);
    }

    merge(clear = true) {
        this.jqGrid('mergeExt', clear);
    }

    /**
     * 修改单元格
     * @param cells
     */
    mixCells(cells) {
        if (!cells) {
            return;
        }
        if (_.isArray(cells)) {
            for (let cell of cells) {
                this.jqGrid('setEditorExt', cell.x, cell.y, cell);
            }
        } else {
            this.jqGrid('setEditorExt', cells.x, cells.y, cells);
        }
    }

}

export {
    JQGrid
}
