import 'jquery-ui/ui/core.js';
import 'jquery-ui/ui/widget.js';
import 'jquery-ui/ui/data.js';
import 'jquery-ui/ui/disable-selection.js';
import 'jquery-ui/ui/scroll-parent.js';
import 'jquery-ui/ui/widgets/draggable.js';
import 'jquery-ui/ui/widgets/sortable.js';
import 'jquery-ui/ui/widgets/mouse.js';
import 'free-jqgrid/dist/jquery.jqgrid.src.js';
import * as celleditors from './celleditors';
import './jgrid.xlsx';
import {TableTools} from "./TableTools";

$.extend(true, (<any>$).jgrid, {
    search: {
        odata: [{oper: 'eq', text: '等于'},
            {oper: 'ne', text: '不等于'},
            {oper: 'lt', text: '小于'},
            {oper: 'le', text: '小于等于'},
            {oper: 'gt', text: '大于'},
            {oper: 'ge', text: '大于等于'},
            {oper: 'bt', text: '介于', operand: '介于'},
            {oper: 'in', text: '包含'},
            {oper: 'ni', text: '不包含'},
            {oper: 'cn', text: '匹配'},
            {oper: 'nc', text: '不匹配'}]
    },
    celleditors: {
        TextInput: celleditors.cell_textinput,
        NumberInput: celleditors.cell_numberinput,
        JSTreeSelect: celleditors.cell_treeselect,
        TreeSelect: celleditors.cell_treeselect,
        Select: celleditors.cell_treeselect,
        Select2: celleditors.cell_treeselect,
        TextArea: celleditors.cell_textarea,
        FileUploader: celleditors.cell_fileuploader,
        DatePicker: celleditors.cell_datepicker,
        YearPicker: (cell: HTMLElement, cfg) => {
            cfg.datepickerConfig = $.extend(cfg.datepickerConfig || {}, {
                format: 'yyyy',
                startView: 2,
                maxViewMode: 2,
                minViewMode: 2,
            });
            celleditors.cell_datepicker(cell, cfg);
        },
    }
});

const customSortOperations = {};

const xlsxHeaderStyle = {
    font: {
        bold: true
    },
    alignment: {
        vertical: 'center',
        horizontal: 'center'
    },
    border: {
        top: {style: 'medium', color: {rgb: '333333'}},
        bottom: {style: 'medium', color: {rgb: '333333'}},
        left: {style: 'medium', color: {rgb: '333333'}},
        right: {style: 'medium', color: {rgb: '333333'}}
    }
};


const xlsxBodyStyle = {
    border: {
        top: {style: 'thin', color: {rgb: '333333'}},
        bottom: {style: 'thin', color: {rgb: '333333'}},
        left: {style: 'thin', color: {rgb: '333333'}},
        right: {style: 'thin', color: {rgb: '333333'}}
    }
};

/**
 * 转value为text
 * @param options
 * @param value
 * @param fields
 * @returns {string}
 */
function value2text(options, value, fields?) {
    if (!options || (!value && value !== 0 && value !== false)) {
        return '';
    }
    let s = '',
        values = String(value).split(','),
        idField = 'id',
        textField = 'text';
    if (fields) {
        [idField, textField] = fields.split(',');
    }
    for (let o of options) {
        for (let val of values) {
            if (String(o[idField]) === val) {
                s += (s ? ',' : '') + o[textField];
            }
        }
    }
    return s || value;
}

/**
 * 自定义单元格属性添加器
 * @param rowid
 * @param value
 * @param row
 * @param cm
 * @returns {any}
 */
function customCellattr(rowid, value, row, cm) {
    const $t: any = $(this);
    const editable = $t.isCellEditableExt(rowid, cm.name);
    if (typeof editable !== 'undefined') {
        return ' celleditable="' + editable + '" rowid="' + rowid + '"';
    }
}

/**
 * 自定义单元格渲染器
 * @param value
 * @param data
 * @returns {any}
 */
function customFormatter(value, data) {
    const t = this, $t: any = $(t), ext = t.ext,
        {rowId, colModel} = data, colName = colModel.name;
    if (typeof value === 'undefined' ||
        value === null ||
        (typeof value === 'number' && isNaN(value))) {
        return '';
    }
    // 获取编辑器，如果表格可编辑，editor不会为空
    const editor = $t.getEditorExt(rowId, colName) || colModel;
    let text = value;
    if (editor.options) {
        text = value2text(editor.options, value);
    } else if (editor.optionsSource) {
        $t.addTodoExt(editor.optionsSource, () => {
            $t.rerenderCellExt(rowId, colName);
        });
        return '';
    } else if (editor.format &&
        /(#|0|,)+\.?(#|0|,)*/.test(editor.format)) {
        text = TableTools.formatNumber(value, editor.format) || '';
    }
    if (text !== value) {
        // 解决title不一致bug
        const timer = setTimeout(() => {
            clearTimeout(timer);
            $t.setCellExt(rowId, colName, '', false, {
                title: text
            });
        }, 1);
    }
    if (editor.unContentSelect) {
        text = '<span class="un-content-select">' + text + '</span>'
    }
    return text;
}

/**
 * 自定义操作列单元格渲染器
 * @param value
 * @param data
 * @param rowdata
 * @returns {any}
 */
function customRowButtonsFormatter(value, data, rowdata) {
    const {rowId, colModel} = data;
    if (rowId) {
        let str = '';
        for (let btn of colModel.rowButtons) {
            let caption = btn.caption;
            if (typeof caption === 'function') {
                caption = caption(data, rowdata);
            }
            if (!caption) {
                continue;
            }
            if (typeof btn.beforeRender === 'function' &&
                btn.beforeRender(data, rowdata) === false) {
                continue;
            }
            str += '<a href="javascript:;" class="ui-jqgrid-rowbutton" ' +
                'data-fn="' + btn.onClickButton + '">' + caption + '</a>';
        }
        return str;
    }
    return customFormatter.bind(this)(value, data);
}

/**
 * 自定义链接列单元格渲染器
 * @param value
 * @param data
 * @param rowdata
 * @returns {any}
 */
function customLinkFormatter(value, data) {
    const {rowId, colModel} = data;
    let str = customFormatter.bind(this)(value, data);
    if (rowId && str) {
        return '<a href="javascript:;" class="ui-jqgrid-rowbutton" ' +
            'data-fn="' + colModel.link + '">' + str + '</a>';
    }
    return str;
}

/**
 * 自定义下拉搜索dataInit配置
 * @param el
 * @param {any} cm
 */
function customSelectDataInit(el: any, {cm}) {
    // 克隆el，并清楚name和id属性
    const t = this, $t: any = $(this), cloneEl = el.cloneNode();
    // 将cloneEl添加到el后面，并隐藏el
    $(el).hide().after(cloneEl);
    cloneEl.placeholder = '请选择搜索条件';
    $(cloneEl).attr({
        name: '',
        id: cloneEl.id + '_view',
        role: 'view'
    });
    // 获取选择项
    if (!cm.options) {
        $t.addTodoExt(cm.optionsSource, (result) => {
            const options = [];
            let fid, ftext, fparent;
            if (cm.optionsFields) {
                [fid, ftext, fparent] = cm.optionsFields.split(',');
            }
            for (let o of result) {
                options.push({
                    id: o[fid || 'id'],
                    text: o[ftext || 'text'],
                    parent: o[fparent || 'parent'],
                    data: o
                });
            }
            cm.options = options;
            $(el).change();
        });
    }
    // el添加change事件，使cloneEl的值与el保持一致
    $(el).on('change', function () {
        $(this).next().val(value2text(cm.options, $(this).val()));
    });
    $(cloneEl).on('focus', function () {
        $(this).blur();
        if (cm.options) {
            // 使用$(this).parent()[0]的原因：ie8下使用this有问题
            celleditors.cell_treeselect($(this).parent()[0], $.extend({
                value: $(el).val(),
                multiple: true,
                reversible: true,
                threeState: true,
                options: cm.options,
                onStop: (value) => {
                    $(el).val(value).change();
                    t.triggerToolbar();
                }
            }, cm.optionsCfg));
        }
    });
}

/**
 * 自定义录入搜索dataInit配置
 * @param el
 */
function customInputDataInit(el: any) {
    el.placeholder = '请输入搜索条件';
}


function customNumberInputDataInit(el: any) {
    const t = this, $t: any = $(this), cloneEl1 = el.cloneNode(), cloneEl2 = el.cloneNode();
    cloneEl1.placeholder = '请输入最小范围';
    cloneEl2.placeholder = '请输入最大范围';
    $(el).parent().addClass('ui-search-numberinput');
    $(el).hide().after(cloneEl2).after('<em>-</em>').after(cloneEl1);
    $(cloneEl1).addClass('pull-left').attr({
        name: '',
        id: cloneEl1.id + '_view1',
        role: 'view'
    });
    $(cloneEl2).addClass('pull-right').attr({
        name: '',
        id: cloneEl2.id + '_view2',
        role: 'view'
    });
    let timer = null;
    const change = function () {
        if (timer !== null) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            const val = $(el).val(),
                val1 = $(cloneEl1).val(), val2 = $(cloneEl2).val();
            const [s1, s2] = (val + '').split(',');
            if (s1 !== val1 || s2 !== val2) {
                if (!val1 && !val2) {
                    $(el).val('');
                } else {
                    $(el).val(val1 + ',' + val2);
                }
                $(el).change();
                t.triggerToolbar();
            }
            clearTimeout(timer);
            timer = null;
        }, 500);
    };
    $(cloneEl1).on($.support.leadingWhitespace ? 'input' : 'propertychange', function () {
        if (this.value !== '') {
            let value = this.value.replace(/[^\d.-]/g, '')
                .replace(/^-/, '*').replace(/-/g, '').replace('*', '-')
                .replace(/\./, '*').replace(/\./g, '').replace('*', '.');
            if (this.value !== value) {
                this.value = value;
            }
        }
        change();
    });
    $(cloneEl2).on($.support.leadingWhitespace ? 'input' : 'propertychange', function () {
        if (this.value !== '') {
            let value = this.value.replace(/[^\d.-]/g, '')
                .replace(/^-/, '*').replace(/-/g, '').replace('*', '-')
                .replace(/\./, '*').replace(/\./g, '').replace('*', '.');
            if (this.value !== value) {
                this.value = value;
            }
        }
        change();
    });
}

function customDatatype(param: any) {
    const t = this, $t: any = $(t), ext = t.ext;
    // 第一次加载重置数据，不执行校验和onDataChanged
    let reset = false;
    if (!ext.dataReady) {
        ext.dataReady = true;
        reset = true;
    }
    param.criterias = $.extend({}, ext.search);
    if (param.filters) {
        const filters = JSON.parse(param.filters);
        for (let rule of filters.rules) {
            let field = rule.field;
            delete param.criterias[field];
            if (rule.op === 'cn') {
                field += '#like';
            } else if (rule.op === 'in') {
                field += '#in';
            } else if (rule.op === 'between') {
                field += '#numRange';
            }
            param.criterias[field] = rule.data;
        }
    }
    ext.ajax(param, (result) => {
        let timer = setTimeout(() => {
            $t.setGridDataExt({
                rows: result.records,
                page: param.page,
                total: Math.ceil(result.recordsTotal / param.rows),
                records: result.recordsTotal
            }, reset);
            clearTimeout(timer);
        }, 1);
    });
}

function customCheckboxHtml(d: any) {
    const t = this, p = t.p, checkboxHtml = t.checkboxHtml;
    const html = checkboxHtml(d);
    if (typeof html === 'string') {
        return html;
    } else {
        return '<input type="checkbox" id="jqg_' + p.id + '_' + d.rowid +
            '" class="cbox" name="jqg_' + p.id + '_' + d.rowid + '"' +
            (d.checked ? ' checked="checked" aria-checked="true"' : ' aria-checked="false"') + '/>';
    }
}

(<any>$).jgrid.extend({
    jqGridBeforeExt: function (cfg: any) {
        const $t = this, t = $t[0];

        cfg.rowFunctions = [];

        // 列信息处理
        for (let cm of cfg.p.colModel) {
            if (!cm) {
                continue;
            }
            // 默认不可排序
            cm.sortable = !!cm.sortable;
            // 树表若未设置ExpandColumn，则默认为第一列
            if (cfg.p.treeGrid && !cfg.p.ExpandColumn) {
                cfg.p.ExpandColumn = cm.name;
            }
            // 合计行
            if (cm.totalrow) {
                cfg.p.footerrow = true;
            }
            // 添加单元格内容渲染器，分离事件回调方法
            if (cm.rowButtons) {
                // 分离操作列事件回调方法
                for (let btn of cm.rowButtons) {
                    cfg.rowFunctions.push(btn.onClickButton);
                    btn.onClickButton = cfg.rowFunctions.length - 1;
                }
                // 添加操作列单元格内容渲染器
                cm.formatter = customRowButtonsFormatter;
            }
            if (cm.link) {
                // 分离链接列事件回调方法
                cfg.rowFunctions.push(cm.link);
                cm.link = cfg.rowFunctions.length - 1;
                // 添加链接列单元格内容渲染器
                cm.formatter = customLinkFormatter;
            } else if (cm.name !== 'rn' &&
                cm.name !== 'cb' &&
                cm.name !== 'subgrid' &&
                !cm.formatter) {
                // 添加单元格内容渲染器
                cm.formatter = customFormatter;
            }
            cm.width = parseFloat(cm.width) || 150;
        }
        // 添加序号列
        if (cfg.ext.rowindex) {
            cfg.p.rownumbers = true;
        }
        // 添加多选
        if (cfg.ext.rowcheck) {
            cfg.p.multiselect = true;
            //
            const checkboxHtml = cfg.ext.checkboxHtml;
            if (typeof checkboxHtml === 'function') {
                const vmodel = cfg.vmodel;
                cfg.p.checkboxHtml = customCheckboxHtml;
                t.checkboxHtml = (d) => {
                    return cfg.ext.checkboxHtml.bind(t)(d, vmodel);
                };


            }
        }
        // 添加分页栏
        if (cfg.ext.pager || cfg.ext.navButtons) {
            if (cfg.ext.pager) {
                if (cfg.ext.ajax) {
                    // 启动服务器端分页
                    if (cfg.ext.serverSide) {
                        cfg.p.datatype = null;
                    } else {
                        cfg.p.datatype = 'local';
                    }
                }
                // if (cfg.ext.navButtons) {
                //     cfg.p.viewrecords = false;
                // }
            } else {
                cfg.p.viewrecords = false;
                cfg.p.pgbuttons = false;
                cfg.p.pginput = false;
                cfg.p.pgtext = '';
                cfg.p.rowList = [];
                cfg.p.rowNum = -1;
            }
            cfg.p.pager = t.id + '_pager';
            $t.after('<div id="' + cfg.p.pager + '"></div>');
        }
        // 自适应宽度
        if (cfg.autoFit.autoFitWidth) {
            cfg.p.shrinkToFit = false;
            cfg.p.autowidth = true;
            let $relativor = $t.closest(cfg.autoFit.autoFitRelativor),
                cmWidth = 0,
                tWidth = $relativor.width() - (cfg.p.scrollWidth || 18);
            // 序号列宽度30
            if (cfg.p.rownumbers) {
                tWidth -= (cfg.p.rownumWidth || 25) + (cfg.p.cellLayout || 5);
            }
            // 复选框列宽度20
            if (cfg.p.multiselect) {
                tWidth -= (cfg.p.multiselectWidth || 15) + (cfg.p.cellLayout || 5);
            }
            // 子表列20
            if (cfg.p.subGrid) {
                tWidth -= 15 + (cfg.p.cellLayout || 5);
            }
            for (let cm of cfg.p.colModel) {
                if (!cm.hidden) {
                    cmWidth += cm.width;
                }
            }
            const dWidth = tWidth - cmWidth;
            if (dWidth > 0) {
                for (let cm of cfg.p.colModel) {
                    if (!cm.hidden) {
                        if (cm.name !== 'rn' &&
                            cm.name !== 'cb' &&
                            cm.name !== 'subgrid') {
                            let d = Math.floor(100 * dWidth * (cm.width / cmWidth)) / 100;
                            cm.width = cm.width + d;
                        }
                    }
                }
            }
        }
        cfg.p.customSortOperations = customSortOperations;
    },
    /**
     * 初始化
     * @param data
     */
    jqGridExt: function (cfg: any) {
        const $t = this, t = $t[0], vmodel = cfg.vmodel;
        $t.jqGridBeforeExt(cfg);
        /************* 初始化 ************/
        $t.jqGrid(cfg.p);
        /************* 初始后后 ************/
        const p = t.p, grid = t.grid, ext = t.ext = {
            rowidField: cfg.ext.rowidField, // 行标识字段
            defaultData: cfg.ext.defaultData, // 默认数据
            hiddenCells: cfg.ext.hiddenCells || [], // 隐藏单元格
            hiddenRows: cfg.ext.hiddenRows || [], // 影藏行
            editors: cfg.ext.editors, // 编辑器信息
            readonly: cfg.ext.readonly, // 是否只读
            cfgUploader: cfg.ext.cfgUploader, // 文件上传配置
            selectDefault: cfg.ext.selectDefault,
            emptyMessage: cfg.ext.emptyMessage,
            emptyButtons: cfg.ext.emptyButtons,
            serverSide: cfg.ext.serverSide,
            ajax: cfg.ext.ajax,
            dataReady: cfg.ext.loadDataOnReady === false,
            fullHeight: cfg.ext.fullHeight,
            tips: [],
            filterToolbar: false, // 是否有搜索栏
            frozenColumns: false // 是否冻结列
        };
        let calculator = cfg.ext.calculator,
            validator = cfg.ext.validator,
            onDataChanged = cfg.ext.onDataChanged,
            beforeSelectRow = cfg.ext.beforeSelectRow,
            onSelectRow = cfg.ext.onSelectRow,
            onUnselectRow = cfg.ext.onUnselectRow,
            rowReversable = cfg.ext.rowReversable,
            height = cfg.ext.height,
            navButtons = cfg.ext.navButtons,
            autoFitWidth = cfg.autoFit.autoFitWidth,
            autoFitHeight = cfg.autoFit.autoFitHeight,
            autoFitRelativor = cfg.autoFit.autoFitRelativor,
            rowFunctions = cfg.rowFunctions,
            rowStyle = cfg.ext.rowStyle; // 标记行信息
        // 编辑处理
        if (ext.editors && !ext.readonly) {
            $t.addClass('editable');
        }
        // emptyButtons处理
        if (ext.emptyButtons) {
            for (let btn of ext.emptyButtons) {
                rowFunctions.push(btn.onClickButton);
                btn.onClickButton = rowFunctions.length - 1;
            }
        }
        // 列信息处理
        for (let i = 0; i < p.colModel.length; i++) {
            const cm = p.colModel[i];
            if (!cm) {
                continue;
            }
            if (cm.name !== 'rn' &&
                cm.name !== 'cb' &&
                cm.name !== 'subgrid') {
                // 解析选择项
                $t.parseOptionsExt(cm);
                // 添加单元格属性渲染器
                if (!cm.cellattr) {
                    cm.cellattr = customCellattr;
                    // 添加冻结列
                    if (cm.frozen) {
                        ext.frozenColumns = true;
                        for (let j = 0; j < p.colModel.length; j++) {
                            if (j < i) {
                                p.colModel[j].frozen = true;
                            }
                        }
                    }
                }
                // 搜索栏处理
                if (cm.search) {
                    ext.filterToolbar = true;

                    if (cm.search === 'number') {
                        cm.searchoptions = {
                            sopt: ['between'],
                            dataInit: customNumberInputDataInit
                        };
                    } else {
                        if (cm.options || cm.optionsSource) {
                            cm.searchoptions = {
                                sopt: ['in'],
                                dataInit: customSelectDataInit
                            };
                        } else {
                            cm.searchoptions = {
                                dataInit: customInputDataInit
                            };
                        }
                    }
                } else {
                    cm.search = false;
                }
            }
        }
        // 添加搜素栏
        if (ext.filterToolbar) {
            $t.jqGrid('filterToolbar', {
                searchOperators: true,
                searchOnEnter: false,
                defaultSearch: 'cn'
            });
        }
        // 添加多表头
        $t.setGroupHeadersExt();
        // 添加冻结列
        if (ext.frozenColumns) {
            $t.setFrozenColumns();
        }
        // datatype处理
        if (typeof ext.ajax === 'function') {
            if (ext.serverSide) {
                p.datatype = customDatatype;
            } else {
                $t.on('reloadGridExt', function () {
                    // 第一次加载重置数据，不执行校验和onDataChanged
                    let reset = false;
                    if (!ext.dataReady) {
                        ext.dataReady = true;
                        reset = true;
                    }
                    ext.ajax((result) => {
                        $t.setGridDataExt(result, reset);
                    });
                });
            }
        }
        if (navButtons) {
            $t.jqGrid('navGrid', p.pager, {
                edit: false,
                add: false,
                del: false,
                search: false,
                refresh: false
            });
            for (let btn of navButtons) {
                const onClickButton = btn.onClickButton;
                btn.onClickButton = (...args) => {
                    args.splice(0, 0, vmodel);
                    onClickButton(...args);
                };
                $t.jqGrid('navButtonAdd', p.pager, btn);
            }
        }
        /*************************** 自适应高宽 *****************************/
        if (autoFitWidth || autoFitHeight) {
            let $relativor = $t.closest(autoFitRelativor),
                gridWidthOrg = -1,
                gridHeightOrg = -1,
                interval = setInterval(() => {
                    if ($('body #' + t.id).length === 0) {
                        clearInterval(interval);
                        interval = null;
                    }
                    if ($relativor.is(':visible')) {
                        if (autoFitWidth && Math.abs(gridWidthOrg - $relativor.width()) > 2) {
                            gridWidthOrg = $relativor.width();
                            $t.setGridWidthExt(gridWidthOrg - 2);
                        }
                        if (autoFitHeight) {
                            let gridHeight = $relativor.parent().height();
                            $relativor.siblings(':visible').each(function () {
                                gridHeight -= $(this).outerHeight(true);
                            });
                            if (Math.abs(gridHeightOrg - gridHeight) > 2) {
                                gridHeightOrg = gridHeight;
                                $t.setGridHeightExt(gridHeight);
                            }
                        }
                    }
                }, 100);
        }
        /*********************** 事件绑定 ************************/
        if (rowFunctions.length) {
            // 添加操作列、链接列点击事件
            $t.on('jqGridBeforeSelectRow', function (e0, rowid, e1) {
                const $target = $(e1.target).closest('a.ui-jqgrid-rowbutton');
                if ($target.length) {
                    rowFunctions[$target.data('fn')](vmodel, rowid, e0, e1);
                }
            });
        }
        // 禁止反选
        if (rowReversable === false) {
            $t.on('jqGridBeforeSelectRow', function (e0, rowid) {
                const selrow = $t.jqGrid('getGridParam', 'selrow');
                if (selrow === rowid) {
                    return false;
                }
            });
        }
        // 行选中前事件
        if (beforeSelectRow) {
            $t.on('jqGridBeforeSelectRow', function (e0, rowid) {
                return beforeSelectRow(vmodel, rowid);
            });
        }
        // 行选中事件
        if (onSelectRow) {
            $t.on('jqGridSelectRow', function (e0, rowid, selected) {
                if (selected) {
                    onSelectRow(vmodel, rowid);
                }
            });
            $t.on('jqGridSelectAll', function (e0, rowid, selected) {
                if (selected) {
                    onSelectRow(vmodel, rowid, true);
                }
            });
        }
        // 行取消选中
        if (onUnselectRow) {
            $t.on('jqGridSelectRow', function (e0, rowid, selected) {
                if (!selected) {
                    onUnselectRow(vmodel, rowid);
                }
            });
            $t.on('jqGridSelectAll', function (e0, rowid, selected) {
                if (!selected) {
                    onUnselectRow(vmodel, rowid, true);
                }
            });
        }
        // 表体加载完成事件
        $t.on('jqGridAfterGridComplete', function () {
            $t.mergeExt();
            // 设置高度
            if (!autoFitHeight && height) {
                $t.setGridHeightExt(height);
            }
        });
        // 值改变
        $t.on('jqGridDataChanged', function (e, d) {
            if (rowStyle && d) {
                if (d.sender === 'set_data') {
                    for (let row of d.rows) {
                        let rs = rowStyle(vmodel, row);
                        if (rs) {
                            $t.jqGrid('setRowData', row.id, '', rs);
                        }
                    }
                } else if (d.sender === 'insert_row') {
                    let rs = rowStyle(vmodel, d.row);
                    if (rs) {
                        $t.jqGrid('setRowData', d.rowid, '', rs);
                    }
                }
            }
            if (ext.emptyMessage) {
                if (p.data.length === 0) {
                    let msg = ext.emptyMessage, btns = ext.emptyButtons;
                    if (btns) {
                        const matches = ext.emptyMessage.match(/\{\{\w+\}\}/g);
                        if (matches) {
                            for (let match of matches) {
                                const key = match.substring(2, match.length - 2);
                                for (let i = 0; i < btns.length; i++) {
                                    const btn = btns[i];
                                    if (!btn.key) {
                                        btn.key = i;
                                    }
                                    btn.key = btn.key.toString();
                                    if (btn.key === key) {
                                        msg = msg.replace(match, '<a class="ui-jqgrid-emptybutton" ' +
                                            'data-fn="' + btn.onClickButton + '">' + btn.caption + '</a>');
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    $t.displayMessageExt(msg, true);
                    $(grid.eDiv).find('.ui-jqgrid-emptybutton').on('click', function () {
                        rowFunctions[$(this).data('fn')](vmodel, this);
                    });
                } else {
                    $t.displayMessageExt('', true);
                }
            }
            if (!d || !d.action || d.action === 'calculate') {
                if (p.data.length) {
                    if (typeof calculator === 'function') {
                        const rows = p.data;
                        const clonedRows = $t.getGridDataExt();
                        // 执行计算
                        $t.setEditorsExt(calculator(rows, vmodel, ext.editors, d));
                        let timer = setTimeout(() => {
                            clearTimeout(timer);
                            // 比较值改变的地方，并刷新对应单元格
                            for (let cm of p.colModel) {
                                for (let i = 0; i < rows.length; i++) {
                                    const row = rows[i], clonedRow = clonedRows[i];
                                    // 值比较，若值改变，则更改值
                                    if (row[cm.name] !== clonedRow[cm.name]) {
                                        // 更新数据
                                        $t.setCell(row.id, cm.name, row[cm.name], false, false, true);
                                        // 更新title
                                        $t.setCellExt(row.id, cm.name, '', '', {
                                            title: $t.getCell(row.id, cm.name)
                                        });
                                    }
                                }
                            }
                        }, 1);
                    }
                }
                $t.totalExt();
            }
            if (!d || !d.action || d.action === 'validate') {
                if (p.data.length) {
                    if (typeof validator === 'function') {
                        const tips = validator($t.getGridDataExt(), d, vmodel);
                        if (tips) {
                            $t.displayTipsExt(tips);
                        }
                    }
                }
            }
            if (!d || !d.action || d.action === 'onChange') {
                if (typeof onDataChanged === 'function') {
                    onDataChanged(vmodel, d);
                }
            }

        });
        // 编辑器
        if (ext.editors) {
            $.each(ext.editors, (name: string, editor: any) => {
                $t.parseOptionsExt(editor);
            });
            $t.on('jqGridResizeStart', function () {
                celleditors.stopCellEdit();
            }).on('jqGridCellSelect', function (e0, rowid, colindex, cellcontent, e1) {
                if (!ext.readonly) {
                    const el = $(e1.target).closest('td')[0],
                        cm = p.colModel[colindex]; // 获取行标识
                    if (cm && cm.name) {
                        $t.doEditExt(el, rowid, cm.name, {
                            vmodel: vmodel,
                            value: $t.getValueExt(rowid, cm.name),
                            onStop: (value) => {
                                $t.setValueExt(rowid, cm.name, value);
                            }
                        });
                    }
                }
            });
            $t.closest('.ui-jqgrid').on('mouseover', '.ui-jqgrid-btable td', function () {
                $(this).addClass('ui-state-hover');
            }).on('mouseout', '.ui-jqgrid-btable td', function () {
                $(this).removeClass('ui-state-hover');
            }).on('paste', function (event) {
                event.preventDefault();
                const $td = $(this).find('.ui-jqgrid-btable td.ui-state-hover');
                if ($td.length) {
                    const rowid = $td.parent('tr')[0].id, colindex = $td[0]['cellIndex'];
                    // 获取粘贴数据
                    let clipboardData = window['clipboardData'] || event.originalEvent['clipboardData']; // IE || chrome
                    const arr = clipboardData.getData('Text').split('\n')
                        .filter(function (item) {
                            return (item !== '')
                        }).map(function (item) {
                            return item.split('\t');
                        });
                    if (arr.length) {
                        let rowindex = null;
                        const rows = p.data;
                        for (let row of rows) {
                            if (row.id === rowid) {
                                rowindex = 0;
                            }
                            if (rowindex !== null && rowindex < arr.length) {
                                for (let i = 0; i < arr[rowindex].length; i++) {
                                    let colname = null;
                                    for (let name in p.iColByName) {
                                        if (p.iColByName.hasOwnProperty(name) &&
                                            p.iColByName[name] === colindex + i) {
                                            colname = name;
                                        }
                                    }
                                    if (colname && $t.isCellEditableExt(row.id, colname)) {
                                        const value = arr[rowindex][i];
                                        $t.resetValueExt(row.id, colindex + i, value);
                                    }
                                }
                                rowindex++;
                            }
                            if (rowindex === arr.length) {
                                break;
                            }
                        }
                        $t.triggerHandler('jqGridDataChanged', {
                            sender: 'paste'
                        });
                    }
                }
            });
        }
    },
    setGroupHeadersExt: function () {
        const $t = this, t = $t[0], p = t.p, grid = t.grid;
        if (p.groupHeaders && p.groupHeaders.length) {
            for (let headers of p.groupHeaders) {
                $t.setGroupHeaders({
                    useColSpanStyle: true,
                    groupHeaders: headers
                });
            }
            // 表头rowspan补丁
            const $labels = $('table.ui-jqgrid-htable tr.ui-jqgrid-labels', grid.hDiv),
                len = $labels.length;
            $labels.each(function (index) {
                $('th', this).each(function () {
                    const rowspan = $(this).prop('rowspan');
                    if (rowspan && rowspan > 1) {
                        $(this).prop('rowspan', len - index);
                    }
                });
            });
        }
    },
    hideColExt: function (colName: string) {
        const $t = this;
        $t.destroyGroupHeader();
        $t.hideCol(colName);
        $t.setGroupHeadersExt();
    },
    showColExt: function (colName: string) {
        const $t = this;
        $t.destroyGroupHeader();
        $t.showCol(colName);
        $t.setGroupHeadersExt();
    },
    /**
     * 设置行标识
     * @param rowdata
     */
    setRowidExt: function (rowdata) {
        const $t = this, t = $t[0], ext = t.ext;
        if (rowdata[ext.rowidField]) {
            rowdata.id = rowdata[ext.rowidField].toString();
        }
        if (rowdata.id) {
            rowdata.id = rowdata.id.toString();
        } else {
            ext._nRow = ext._nRow || 0;
            rowdata.id = 'row' + (ext._nRow++);
        }
    },
    /**
     * 设置表格数据
     * @param data
     */
    setGridDataExt: function (data, reset = false) {
        const $t = this, t = $t[0], p = t.p, ext = t.ext, rows = [];
        if (p.datatype === 'local') {
            data = data || [];
            if (data.length === 0 && ext.defaultData) {
                for (let d of ext.defaultData) {
                    d = $.extend(true, {}, d);
                    $t.setRowidExt(d);
                    rows.push($.extend(true, {}, d));
                }
            } else {
                for (let d of data) {
                    $t.setRowidExt(d);
                    rows.push($.extend(true, {}, d));
                }
            }
            if (p.treeGrid) {
                t.addJSONData({rows});
                p.data = rows;
            } else {
                p.data = rows;
                $t.trigger('reloadGrid');
            }
            $t.cleanEditorsExt(rows);
            $t.triggerHandler('jqGridDataChanged', {
                rows,
                sender: 'set_data',
                action: reset ? 'calculate' : null
            });
        } else if (typeof p.datatype === 'function') {
            for (let d of data.rows) {
                $t.setRowidExt(d);
                rows.push($.extend(true, {}, d));
            }
            p.data = rows;
            t.addJSONData(data);
            if (p.selrecords) {
                for (let selrow of p.selrecords) {
                    $t.setSelection(selrow);
                }
                p.selrecords = null;
            }
            $t.cleanEditorsExt(rows);
            $t.triggerHandler('jqGridDataChanged', {
                rows,
                sender: 'set_data',
                action: reset ? 'calculate' : null
            });
        }
        if (ext.selectDefault) {
            for (let d of p.data) {
                if (ext.selectDefault(d)) {
                    $t.setSelection(d.id);
                    if (!p.multiselect) {
                        break;
                    }
                }
            }
        }
    },
    /**
     * 获取克隆数据
     * @returns {Array}
     */
    getGridDataExt: function () {
        const $t = this, t = $t[0], p = t.p, rows = [];
        if (p.data) {
            for (let d of p.data) {
                rows.push($.extend(true, {}, d));
            }
        }
        return rows;
    },
    /**
     * 插入行
     * @param rowdata
     * @param {string | boolean} srcrowid
     */
    insertRowExt: function (rowdata: any, srcrowid?: string | boolean) {
        const $t = this, t = $t[0], p = t.p;
        let pos = null; // 插入位置
        // 添加id
        $t.setRowidExt(rowdata);
        // srcrowid为true，取选中行
        if (srcrowid === true) {
            srcrowid = p.selrow;
        }
        // 插入数据
        if (typeof srcrowid === 'string') {
            pos = p._index[srcrowid] + 1;
            $t.addRowData(rowdata.id, rowdata, 'after', srcrowid);
        } else {
            pos = p.data.length;
            $t.addRowData(rowdata.id, rowdata, 'last');
        }
        if (p.datatype === 'local') {
            const len = p.data.length;
            // 补全数据
            p.data[len - 1] = $.extend(true, p.data[len - 1], rowdata);
            // 重新排列顺序
            if (pos < len - 1) {
                let r = p.data[len - 1];
                for (let i = len - 1; i > pos; i--) {
                    p.data[i] = p.data[i - 1];
                    p._index[p.data[i].id] = i;
                }
                p.data[pos] = r;
                p._index[p.data[pos].id] = pos;
            }

            // 判断是否有分页，若有，需要重新渲染
            if (p.pgbuttons) {
                $t.trigger('reloadGrid');
            }
        }
        $t.triggerHandler('jqGridDataChanged', {
            x: rowdata.id,
            rowid: rowdata.id,
            row: rowdata,
            sender: 'insert_row'
        });
    },
    removeRowExt: function (rows: any) {
        const $t = this, t = $t[0], p = t.p, ext = t.ext, delIds = [];
        if (rows && rows.push) {
            rows = rows.slice();
            for (let i = 0; i < rows.length; i++) {
                const rowid = typeof rows[i] === 'string' ? rows[i] : rows[i].id;
                if ($t.jqGrid('delRowData', rowid)) {
                    delIds.push(rowid);
                }
            }
        } else {
            const rowid = typeof rows === 'string' ? rows : rows.id;
            if ($t.jqGrid('delRowData', rowid)) {
                delIds.push(rowid);
            }
        }
        // 清除编辑信息
        if (ext.editors) {
            $.each(ext.editors, (name: string) => {
                const [, x] = name.split('@');
                if (x && delIds.indexOf(x) < 0) {
                    delete ext.editors[name];
                }
            });
        }
        // 判断是否有分页，若有，需要重新渲染
        if (p.datatype === 'local' && p.pgbuttons) {
            $t.trigger('reloadGrid');
        }
        $t.triggerHandler('jqGridDataChanged', {
            x: delIds,
            rowid: delIds,
            sender: 'remove_row'
        });
        return delIds;
    },
    /**
     * 更新数据
     * @param {string} rowid
     * @param rowdata
     */
    setRowDataExt: function (rowid: string, rowdata: any) {
        const $t = this, t = $t[0], p = t.p;
        $t.setRowData(rowid, rowdata);
        // 同步跟新真实数据
        if (p.data) {
            for (let d of p.data) {
                if (d.id === rowid) {
                    $.extend(true, d, rowdata);
                    break;
                }
            }
        }
        $t.triggerHandler('jqGridDataChanged', {
            x: rowid,
            rowid: rowid,
            row: rowdata,
            sender: 'update_row'
        });
    },
    /**
     * 获取行
     * @param rowids
     * @returns {Array}
     */
    getRowDataExt: function (rowids: any) {
        const t = this[0], p = t.p;
        if (rowids && rowids.push) {
            const rows = [];
            if (p.data) {
                for (let d of p.data) {
                    if (rowids.indexOf(d.id) >= 0) {
                        rows.push($.extend(true, {}, d));
                    }
                }
            }
            return rows;
        } else {
            if (p.data) {
                for (let d of p.data) {
                    if (d.id === rowids) {
                        return $.extend(true, {}, d);
                    }
                }
            }
        }
    },
    /**
     * 获取选中数据
     * @returns {Array}
     */
    getSelectedDataExt: function () {
        const t = this[0], p = t.p;
        if (p.selarrrow && p.selarrrow.length) {
            return this.getRowDataExt(p.selarrrow);
        } else if (p.selrow) {
            return this.getRowDataExt(p.selrow);
        }
    },
    /**
     * 获取选中数据的数量
     * @returns {Array}
     */
    getSelectedCountExt: function () {
        const t = this[0], p = t.p;
        if (p.selarrrow && p.selarrrow.length) {
            return p.selarrrow.length;
        } else {
            return p.selrow ? 1 : 0;
        }
    },
    /**
     * 获取单元格的值
     * @param {string} rowid
     * @param {string} colname
     */
    getValueExt: function (rowid: string, colname: string) {
        const t = this[0], p = t.p;
        if (p.data) {
            if (rowid) {
                for (let d of p.data) {
                    if (d.id === rowid) {
                        return d[colname];
                    }
                }
            } else {
                let r = 0, s = 0, m;
                for (let d of p.data) {
                    let str = d[colname] ? d[colname].toString() : '0';
                    let astr = str.split('.');
                    if (astr.length > 1) {
                        r = Math.max(r, astr[1].length);
                    }
                }
                m = Math.pow(10, r);
                for (let d of p.data) {
                    s += Math.round((d[colname] || 0) * m);
                }
                return s / m;
            }
        }
    },
    /**
     * 更新单元格的值
     */
    setValueExt: function (rowid: string, colname: string, value?: any) {
        const $t = this, oldValue = $t.getValueExt(rowid, colname);
        $t.resetValueExt(rowid, colname, value);
        if (typeof value !== 'undefined') {
            $t.triggerHandler('jqGridDataChanged', {
                x: rowid,
                y: colname,
                value: value,
                oldValue: oldValue,
                sender: 'set_value'
            });
        }
    },
    /**
     * 更新单元格的值
     */
    resetValueExt: function (rowid: string, colname: string, value?: any, reset?) {
        const $t = this, t = $t[0], p = t.p, ext = t.ext;
        if (typeof value === 'undefined') {
            value = $t.getValueExt(rowid, colname);
        }
        // 后端分页，同步更新数据
        if (typeof p.datatype === 'function') {
            for (let d of p.data) {
                if (d.id === rowid) {
                    d[colname] = value;
                    break;
                }
            }
        }
        // 更新数据
        $t.setCell(rowid, colname, value, false, false, true);
        // 更新title（补丁）
        $t.setCellExt(rowid, colname, '', false, {
            title: $t.getCell(rowid, colname)
        });
    },
    /**
     * 合计
     */
    totalExt: function () {
        const t = this[0], p = t.p, data = {};
        // 合计
        for (let {name, totalrow} of p.colModel) {
            if (name && totalrow) {
                if (totalrow === true) {
                    data[name] = this.getValueExt(null, name);
                } else if (typeof totalrow === 'function') {
                    data[name] = totalrow(p.data);
                } else {
                    data[name] = totalrow;
                }
            }
        }
        this.jqGrid('footerData', 'set', data, true);
    },
    /**
     * 重载数据
     * @param search
     */
    reloadDataExt: function (search?: any) {
        const $t = this, t = $t[0], p = t.p, ext = t.ext;
        if (typeof p.datatype === 'function') {
            // 记录选中数据
            if (p.selarrrow && p.selarrrow.length) {
                p.selrecords = [...p.selarrrow];
            } else if (p.selrow) {
                p.selrecords = p.selrow;
            } else {
                p.selrecords = null;
            }
            if (search) {
                ext.search = $.extend(ext.search, search);
            }
            if (search && t.triggerToolbar) {
                $(p.gView + ' .ui-search-toolbar :input[role=search]').each(function () {
                    if (this['name'] && search.hasOwnProperty(this['name'])) {
                        $(this).val(search[this['name']]).change();
                        if ($(this).parent().hasClass('ui-search-numberinput')) {
                            let [v1, v2] = String(search[this['name']]).split(',');
                            $(this).siblings('[role=view].pull-left').val(v1);
                            $(this).siblings('[role=view].pull-right').val(v2);
                        }
                        delete ext.search[this['name']];
                    }
                });
                t.triggerToolbar();
            } else {
                $t.trigger('reloadGrid');
            }
        } else {
            $t.trigger('reloadGridExt');
        }
    },
    /**
     * 重新渲染单元格
     * @param {string} x
     * @param {string} y
     */
    rerenderCellExt: function (x: string, y: string) {
        const $t = this, t = $t[0];
        for (let d of t.p.data) {
            if (x && y) {
                if (d.id === x) {
                    $t.setCell(x, y, d[y], false, false, true);
                    const attr: any = {
                        title: $t.jqGrid('getCell', x, y)
                    };
                    if (t.ext.editors) {
                        attr.celleditable = $t.isCellEditableExt(x, y);
                    }
                    $t.setCellExt(x, y, '', false, attr);
                    break;
                }
            } else if (!x && y) {
                $t.setCell(d.id, y, d[y], false, false, true);
                const attr: any = {
                    title: $t.jqGrid('getCell', d.id, y)
                };
                if (t.ext.editors) {
                    attr.celleditable = $t.isCellEditableExt(d.id, y);
                }
                $t.setCellExt(d.id, y, '', false, attr);
            } else if (x && !y) {
                if (d.id === x) {
                    for (let cm of t.p.colModel) {
                        if (cm.name !== 'rn' &&
                            cm.name !== 'cb' &&
                            cm.name !== 'subgrid') {
                            $t.setCell(x, cm.name, d[cm.name], false, false, true);
                            const attr: any = {
                                title: $t.jqGrid('getCell', x, cm.name)
                            };
                            if (t.ext.editors) {
                                attr.celleditable = $t.isCellEditableExt(x, cm.name);
                            }
                            $t.setCellExt(x, cm.name, '', false, attr);
                        }
                    }
                    break;
                }
            }
        }
    },
    displayMessageExt: function (message, empty?) {
        const $t = this, t = $t[0], $e = $(t.grid.eDiv);
        if (message) {
            $t.displayErrorMessage(message);
        } else {
            $e.hide();
        }
        if (empty) {
            $e.removeClass('ui-state-error');
        } else {
            $e.addClass('ui-state-error');
        }
        $t.triggerHandler('jqGridResetFrozenHeights');
    },
    displayTipsExt: function (tips: Array<any>) {
        const $t = this, t = $t[0], ext = t.ext;
        if (ext.tips && tips && ext.tips.length === 0 && tips.length === 0) {
            return;
        }
        // 清除上一次提示
        if (ext.tips) {
            for (let tip of ext.tips) {
                if (tip.x && tip.y) {
                    $t.setCell(tip.x, tip.y, '', '', {
                        cellstate: '',
                        title: $t.getCell(tip.x, tip.y)
                    });
                }
            }
        }
        let en = 0, wn = 0;
        // 添加提示
        if (tips) {
            for (let tip of tips) {
                if (tip.x && tip.y) {
                    $t.setCell(tip.x, tip.y, '', '', {
                        cellstate: tip.error ? 'error' : 'warning',
                        title: tip.message
                    });
                    if (tip.error) {
                        en++;
                    } else {
                        wn++;
                    }
                }
            }
        }
        ext.tips = tips;

        if (ext.errorbar) {
            // 组织错误条信息
            let message = '';
            if (en > 0) {
                message += '<span>' + en + '条错误</span>';
            }
            if (wn > 0) {
                if (en > 0) {
                    message += '、';
                }
                message += '<span>' + wn + '条警告</span>';
            }
            // 显示错误条信息
            $t.displayMessageExt(message, false);
        }
    },
    isValidExt: function (strict = false) {
        const $t = this, t = $t[0], ext = t.ext;
        if (strict) {
            return ext.tips.length === 0;
        } else {
            for (let tip of ext.tips) {
                if (tip.error) {
                    return false;
                }
            }
            return true;
        }
    },
    clearCacheExt: function (source: string) {
        const t = this[0];
        if (t.cache) {
            delete t.cache[source];
        }
    },
    addTodoExt: function (source: string, fn: Function) {
        const t = this[0];
        if (!t.cache) {
            t.cache = {};
        }
        // 判断source对应的数据是否存在
        if (t.cache[source]) { // 若存在，值直接执行fn
            fn(t.cache[source]);
        } else { // 否则放入todo中，待数据获取后执行
            if (!t.todo) {
                t.todo = {};
            }
            if (!t.todo[source]) {
                t.todo[source] = [];
            }
            t.todo[source].push(fn);
        }
    },
    removeTodoExt: function (source: string, options: Array<any>) {
        const t = this[0];
        if (!t.cache) {
            t.cache = {};
        }
        // 放入缓存
        t.cache[source] = options;
        // 运行待执行方法
        if (!t.todo) {
            t.todo = {};
        }
        const fns = t.todo[source];
        if (fns) {
            for (let fn of fns) {
                fn(options);
            }
            delete t.todo[source];
        }
    },
    parseOptionsExt: function (target: any, after?: Function) {
        if (!target) {
            return;
        }
        const $t = this, t = $t[0], p = t.p;
        // 如果是字符串，则获取colModel
        if (typeof target === 'string') {
            for (let cm of p.colModel) {
                if (cm.name === target) {
                    target = cm;
                    break;
                }
            }
        }
        if (typeof target.options === 'string') { // 将#、+格式的选择项转换为数组格式
            const options = [];
            const arr = target.options.split('+');
            for (let a of arr) {
                const [id, text, parent] = a.split('#');
                const item = {} as any;
                item.id = id;
                if (typeof text !== 'undefined') {
                    item.text = text;
                } else {
                    item.text = id;
                }
                item.parent = parent;
                options.push(item);
            }
            target.options = options;
        } else if (target.optionsSource) { // 数据源请求
            const source = target.optionsSource,
                fields = target.optionsFields;
            // 清空缓存
            $t.clearCacheExt(source);
            // 添加todo延迟执行
            $t.addTodoExt(source, (result) => {
                const options = [];
                let fid, ftext, fparent;
                if (fields) {
                    [fid, ftext, fparent] = fields.split(',');
                }
                for (let o of result) {
                    options.push({
                        id: o[fid || 'id'],
                        text: o[ftext || 'text'],
                        parent: o[fparent || 'parent'],
                        data: o
                    });
                }
                target.options = options;

                if (after) {
                    after();
                }
            });
            // 获取数据
            // getRequest({
            //     url: /^\/.*/.test(source) ? source : '/api/datasource/datas/' + source,
            //     cache: false,
            //     successCallBack: (result) => {
            //         if (typeof result === 'string') {
            //             result = JSON.parse(result).datas;
            //         }
            //         $t.removeTodoExt(source, result);
            //     }
            // });
            return;
        }
        if (after) {
            after();
        }
    },
    setGridWidthExt: function (gridWidth: number) {
        const $t = this, t = $t[0], p = t.p, ext = t.ext;
        let cmWidth = 0, tWidth = gridWidth - (p.scrollWidth || 18);
        for (let cm of p.colModel) {
            if (!cm.hidden) {
                if (cm.name !== 'rn' &&
                    cm.name !== 'cb' &&
                    cm.name !== 'subgrid') {
                    cmWidth += cm.width;
                } else {
                    tWidth -= cm.width;
                }
            }
        }
        const dWidth = tWidth - cmWidth;
        for (let cm of p.colModel) {
            if (!cm.hidden) {
                if (cm.name !== 'rn' &&
                    cm.name !== 'cb' &&
                    cm.name !== 'subgrid') {
                    let d = Math.floor(100 * dWidth * (cm.width / cmWidth)) / 100;
                    $t.setColWidth(cm.name, Math.max(cm.width + d, cm.widthOrg));
                }
            }
        }
        $t.setGridWidth(gridWidth);
    },
    setGridHeightExt: function (gridHeight: number) {
        const $t = this, t = $t[0], ext = t.ext, grid = t.grid,
            extHeight = $t.closest('.ui-jqgrid').outerHeight(true) -
                $(grid.bDiv).outerHeight(true) + 2;
        // 重置表格高度
        if ($.support.leadingWhitespace) {
            if (ext.fullHeight) {
                $(grid.bDiv).height(gridHeight - extHeight);
            } else {
                $(grid.bDiv).css('max-height', gridHeight - extHeight);
            }
        } else {
            // TODO ie8下高度有问题
            $(grid.bDiv).height(gridHeight - extHeight);
        }
        $(grid.bDiv).css('overflow-y', 'auto');
        // 重置固定列高度
        $t.triggerHandler('jqGridResetFrozenHeights');
    },
    filterDataExt: function (fn: Function) {
        const $t = this, t = $t[0], p = t.p, ext = t.ext, hiddenRows = [];
        for (let i = 0; i < p.data.length; i++) {
            const d = p.data[i];
            if (fn(d)) {
                this.jqGrid('setRowData', d.id, '', {'display': 'table-row'});
            } else {
                this.jqGrid('setRowData', d.id, '', {'display': 'none'});
                hiddenRows.push(d.id);
            }
        }
        ext.hiddenRows = hiddenRows;
        $t.mergeExt();
        if (ext.frozenColumns) {
            $t.destroyFrozenColumns();
            $t.setFrozenColumns();
        }
    },
    mergeExt: function () {
        const $t = this, t = $t[0], p = t.p, ext = t.ext;
        if (p.data.length && p.colModel.length) {
            // 初始化单元格影藏信息
            const state = [],
                pos = {},
                rows = p.data.length,
                cols = p.colModel.length;
            for (let i = 0; i < rows; i++) {
                const d = p.data[i];
                pos[d.id] = {};
                state[i] = [];
                for (let j = 0; j < cols; j++) {
                    const cm = p.colModel[j];
                    pos[d.id][cm.name] = [i, j];
                    state[i][j] = {
                        x: d.id,
                        y: cm.name,
                        cellhidden: cm.hidden,
                        colhidden: false,
                        colspan: 1,
                        rowhidden: false,
                        rowspan: 1
                    };
                }
            }
            // 影藏单元格（横向）
            if (ext.hiddenCells.length) {
                // 隐藏指定单元格
                for (let {x, y} of ext.hiddenCells) {
                    if (pos[x] && pos[x][y]) {
                        const [xi, yj] = pos[x][y];
                        state[xi][yj].colhidden = true;
                    }
                }
            }
            // 计算colspan
            for (let i = 0; i < rows; i++) {
                for (let j = cols - 1; j > 0; j--) {
                    if (state[i][j].colhidden) {
                        state[i][j - 1].colspan = state[i][j].colspan + 1;
                    }
                }
            }
            // 自动合并单元格（纵向）
            for (let j = 0; j < cols; j++) {
                const cm = p.colModel[j];
                if (cm.automerge) {
                    let fn;
                    if (typeof cm.automerge === 'function') {
                        fn = cm.automerge;
                    } else {
                        if (cm.automerge === true) {
                            fn = (d1, d2) => {
                                return d1[cm.name] === d2[cm.name];
                            };
                        } else {
                            fn = (d1, d2) => {
                                return d1[cm.automerge] === d2[cm.automerge];
                            };
                        }
                    }
                    let d0 = null;
                    for (let i = 0; i < rows; i++) {
                        const d = p.data[i];
                        // 排除影藏行
                        if (ext.hiddenRows.indexOf(d.id) < 0) {
                            if (d0 === null || !fn(d0, d)) {
                                d0 = d;
                            } else {
                                const [xi, yj] = pos[d.id][cm.name];
                                state[xi][yj].rowhidden = true;
                            }
                        }
                    }
                }
            }
            // 计算rowspan
            for (let j = 0; j < cols; j++) {
                for (let i = rows - 1; i > 0; i--) {
                    if (state[i][j].rowhidden) {
                        state[i - 1][j].rowspan = state[i][j].rowspan +
                            (ext.hiddenRows.indexOf(state[i - 1][j].x) < 0 ? 1 : 0);
                    }
                }
            }
            // 合并单元格
            for (let row of state) {
                for (let cell of row) {
                    if (!cell.cellhidden) {
                        $t.setCell(cell.x, cell.y, '', {
                            'display': (cell.rowhidden || cell.colhidden) ? 'none' : 'table-cell'
                        }, {
                            rowspan: cell.rowspan,
                            colspan: cell.colspan
                        });
                    }
                }
            }
        }
    },
    exportExcelExt: function (fileName = '我的导出') {
        const $t = this, t = $t[0], p = t.p;
        const excelData = [], headerData = [], merges = [];
        const {colModel, colNames, groupHeaders} = p,
            bodyData = $t.getGridDataExt();

        // 添加表头数据
        for (let i = 0, l = colModel.length; i < l; i++) {
            let cm = colModel[i];
            if (cm.name !== 'rn' &&
                cm.name !== 'cb' &&
                cm.name !== 'subgrid') {
                headerData.push({
                    v: colNames[i],
                    s: xlsxHeaderStyle
                });
            }
        }

        if (groupHeaders && groupHeaders.length) {
            for (let ghs of groupHeaders) {
                let groupHeaderData = [],
                    row = excelData.length,
                    col = 0;
                for (let i = 0; i < colModel.length; i++) {
                    let cm = colModel[i];
                    if (cm.name !== 'rn' &&
                        cm.name !== 'cb' &&
                        cm.name !== 'subgrid') {
                        for (let gh of ghs) {
                            const scn = gh.startColumnName,
                                noc = gh.numberOfColumns;
                            if (scn === cm.name && noc > 1) {
                                const merge = {s: {r: row, c: col}, e: {r: row, c: col + noc - 1}};
                                for (let j = 0; j < noc; j++) {
                                    if (!cm.hidden) {
                                        groupHeaderData.push({
                                            v: gh.titleText,
                                            s: xlsxHeaderStyle
                                        });
                                        col++;
                                    } else {
                                        merge.e.c--;
                                    }
                                    i++;
                                    cm = colModel[i];
                                }
                                if (merge.e.c - merge.s.c > 1) {
                                    // 横向合并单元格
                                    merges.push(merge);
                                }
                            }
                        }
                        if (cm && !cm.hidden && groupHeaderData.length === col) {
                            // 纵向合并单元格
                            let merged = false;
                            for (let {s, e} of merges) {
                                if (s.c === col && e.c === col) {
                                    merged = true;
                                    e.r++;
                                    break;
                                }
                            }
                            if (!merged) {
                                merges.push({s: {r: row, c: col}, e: {r: row + 1, c: col}});
                            }
                            groupHeaderData.push(headerData[col]);
                            col++;
                        }
                    }
                }
                excelData.push(groupHeaderData);
            }
        }

        excelData.push(headerData);

        for (let d of bodyData) {
            const rowData = [];
            for (let cm of colModel) {
                if (cm.name !== 'rn' &&
                    cm.name !== 'cb' &&
                    cm.name !== 'subgrid') {
                    const v = customFormatter.bind($t)(d[cm.name], {
                        rowId: d.id,
                        colModel: cm
                    });

                    rowData.push({
                        v: v || v === 0 || v === false ? v : ' ',
                        s: xlsxBodyStyle
                    });
                }
            }
            excelData.push(rowData);
        }

        if ($.fn['data2xlsx']) {
            $.fn['data2xlsx'](fileName, excelData, merges);
        } else {
            alert('当前浏览器不支持此功能！');
        }
    },
    /************************ 编辑器相关 ****************************/
    /**
     * 设置编辑器
     * @param editors
     */
    setEditorsExt: function (editors: any) {
        const $t = this;
        if (editors) {
            if ($.isArray(editors)) {
                for (let editor of editors) {
                    $t.setEditorExt(editor.x, editor.y, editor);
                }
            } else {
                $t.setEditorExt(editors.x, editors.y, editors);
            }
        }
    },
    /**
     * 获取编辑器
     * @returns {}
     */
    getEditorsExt: function () {
        const $t = this, t = $t[0];
        return t.ext.editors;
    },
    /**
     * 设置单元格编辑器信息
     * @param {string} x
     * @param {string} y
     * @param editor
     */
    setEditorExt: function (x: string, y: string, editor: any) {
        const $t = this, t = $t[0], ext = t.ext;
        if (ext.editors && (x || y)) {
            const f = (y || '') + (x ? '@' + x : '');
            ext.editors[f] = $.extend(ext.editors[f], {}, editor);
            // 解析选择项，解析完成后重新渲染
            $t.parseOptionsExt(ext.editors[f], () => {
                $t.rerenderCellExt(x, y);
            });
        }
    },
    /**
     * 获取单元格编辑器信息
     * @param {string} x
     * @param {string} y
     */
    getEditorExt: function (x: string, y: string) {
        const $t = this, t = $t[0], p = t.p, ext = t.ext;
        if (ext.editors) {
            let cm0 = null;
            for (let cm of p.colModel) {
                if (cm.name === y) {
                    cm0 = cm;
                    break;
                }
            }
            return $.extend({},
                cm0,
                ext.editors[y],
                ext.editors['@' + x],
                ext.editors[y + '@' + x]);
        }
    },
    doEditExt(cell: HTMLElement, x: string, y: string, cfg: any) {
        const $t = this, t = $t[0], ext = t.ext;
        if (ext.editors && !ext.readonly) {
            const editor = this.getEditorExt(x, y);
            if (editor.editable !== false) {
                let fn = null;
                if (typeof editor.type === 'function') {
                    fn = editor.type;
                } else {
                    if (editor.type === 'FileUploader' &&
                        typeof t.uploader === 'function') {
                        $.extend(cfg, t.uploader(cfg));
                    }
                    if ((<any>$).jgrid.celleditors[editor.type]) {
                        fn = (<any>$).jgrid.celleditors[editor.type];
                    }
                }
                if (typeof fn === 'function') {
                    fn(cell, $.extend(editor, cfg));
                }
            }
        }
    },
    setReadonlyExt: function (readonly = true) {
        const $t = this, t = $t[0], grid = t.grid, ext = t.ext;
        ext.readonly = readonly;
        if (readonly) {
            $t.removeClass('editable');
        } else {
            $t.addClass('editable');
        }
        if (grid.fbDiv) {
            if (readonly) {
                grid.fbDiv.find('>table').removeClass('editable');
            } else {
                grid.fbDiv.find('>table').addClass('editable');
            }
        }
    },
    /**
     * 判断单元格是否可编辑
     * @param {string} x
     * @param {string} y
     * @returns {boolean | any}
     */
    isCellEditableExt: function (x: string, y: string) {
        const $t = this, t = $t[0], ext = t.ext;
        if (ext.editors && x && y) {
            if (ext.readonly) {
                return false;
            }
            const editor = $t.getEditorExt(x, y);
            return !!(editor &&
                editor.editable !== false &&
                (<any>$).jgrid.celleditors[editor.type]);
        }
    },
    /**
     * 清理编辑器信息
     * @param {Array<any>} data
     */
    cleanEditorsExt(data?: Array<any>) {
        const $t = this, t = $t[0], ext = t.ext;
        if (ext.editors) {
            let rowids;
            if (data) {
                rowids = [];
                for (let d of data) {
                    rowids.push(d.id);
                }
            }
            $.each(ext.editors, (name: string) => {
                if (rowids) {
                    const [, x] = name.split('@');
                    if (x && rowids.indexOf(x) < 0) {
                        delete ext.editors[name];
                    }
                } else {
                    delete ext.editors[name];
                }
            });
        }
    },
    setCellExt: function (rowid, colname, value, style, attr) {
        const $t = this, t = $t[0], ext = t.ext;
        if (attr && ext.tips) {
            for (let tip of ext.tips) {
                if (tip.x === rowid && tip.y === colname) {
                    delete attr.title;
                    break;
                }
            }
        }
        $t.setCell(rowid, colname, value, style, attr);
    }
});
