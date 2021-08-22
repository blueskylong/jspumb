import * as _ from 'underscore';

export class TableTools {

    static cellTreeselect(cell: HTMLElement, cfg: CellTreeSelectConfig) {
        TableTools.beforeCellEdit(cell);
        if (_.isUndefined(cfg.value) || _.isNull(cfg.value)) {
            cfg.value = '';
        } else {
            cfg.value = cfg.value.toString();
        }
        if (!cfg.valueSeparator) {
            cfg.valueSeparator = ',';
        }
        const position = TableTools.positionCellEditor(cell, false);
        const $celleditor = TableTools.createCellEditor()
            .addClass('box-shadow')
            .css(position)
            .append('<input type="text" class="search form-control" placeholder="搜索..."/><div class="editor"></div>')
            .one('stop', function () {
                $(this).remove();
            });
        // 搜索处理
        if (cfg.searchable) {
            $celleditor
                .find('>.search')
                .on($.support.leadingWhitespace ? 'input' : 'propertychange', function () {
                    $(this).siblings('.editor').jstree(true).search($(this).val() as any);//TODO confirm
                });
        } else {
            $celleditor
                .find('>.search').hide();
        }
        // jstree初始化
        const $jstree = $celleditor.find('>.editor');
        $jstree.css({
            'min-height': '10px',
            'min-width': $(cell).outerWidth() + 'px',
            'max-height': ($(window).height() - (position.top || position.bottom) - 10 - $celleditor
                .find('>.search').outerHeight(true)) + 'px',
            'max-width': ($(window).width() - (position.left || position.right) - 10) + 'px',
            'overflow': 'auto',
            'padding-bottom': '5px'
        });
        $jstree.on('ready.jstree', function () {
            $(this).on('changed.jstree', function (event, {selected}) {
                const value0 = selected.join(cfg.valueSeparator);
                if (!cfg.multiple) {
                    $(this).parent('.ngs-celleditor').remove();
                    if (value0 !== cfg.value) {
                        cfg.onStop(value0);
                    } else if (cfg.reversible) {
                        cfg.onStop(null);
                    }
                } else {
                    cfg.onStop(value0);
                }
            });
        });

        let dataFn = null;

        if (cfg.lazy) {
            $jstree.on('open_node.jstree', (e0, d) => {
                if (d.node.children[0] === d.node.id + '_children_placeholder') {
                    d.instance.load_node(d.node);
                }
            });
            const ids = [], parents = [];
            for (let o of cfg.options) {
                ids.push(o.id);
                if (o.parent) {
                    parents.push(o.parent)
                }
            }
            dataFn = (obj, callback) => {
                const result = [];
                for (let o of cfg.options) {
                    if (o.parent === obj.id ||
                        (obj.id === '#' && !_.contains(ids, o.parent))) {
                        let d: any = {
                            id: o.id,
                            text: o.text,
                            data: o
                        }
                        if (_.contains(parents, o.id)) {
                            d.children = [{
                                icon: false,
                                id: d.id + '_children_placeholder',
                                text: 'Loading ...'
                            }];
                        }
                        result.push(d);
                    }
                }
                callback(result);
            }
        } else {
            dataFn = function () {
                const data = [],
                    ids = [],
                    parents = [],
                    values = cfg.value ? (cfg.multiple ? cfg.value.split(cfg.valueSeparator) : [cfg.value]) : [];
                for (let o of cfg.options) {
                    ids.push(o.id);
                }
                for (let o of cfg.options) {
                    if (_.contains(ids, o.parent)) {
                        parents.push(o.parent);
                    }
                }
                for (let o of cfg.options) {
                    const item = {
                        id: o.id,
                        text: o.text,
                        parent: _.contains(ids, o.parent) ? o.parent : '#',
                        state: {
                            selected: _.contains(values, o.id.toString()),
                            disabled: cfg.onlyLeafSelect === true ? _.contains(parents, o.id) : false,
                            opened: true
                        },
                        data: o.data
                    };
                    data.push(item);
                }
                return data;
            }()
        }

        $jstree.jstree({
            'core': {
                'themes': {
                    'responsive': false
                },
                'data': dataFn,
            },
            'plugins': function () {
                const plugins = ['themes', 'types'];
                if (cfg.searchable) {
                    plugins.push('search');
                }
                if (cfg.multiple) {
                    plugins.push('checkbox');
                }
                if ($.support.leadingWhitespace) {
                    plugins.push('wholerow');
                }
                return plugins;
            }(),
            'types': {
                'default': {
                    'icon': false  // 关闭默认图标
                },
            },
            'checkbox': {
                'three_state': cfg.threeState === true // 级联选中子节点
            },
            'search': {
                'search_leaves_only': cfg.onlyLeafSelect === true, // 是否只能选择叶子节点
                'show_only_matches': true
            }
        });

        if (typeof cfg.onRender === 'function') {
            cfg.onRender($celleditor, cfg);
        }
    };

    static beforeCellEdit(cell: HTMLElement) {
        // 停止其它单元格编辑
        TableTools.stopCellEdit();
        $(cell).parents().each(function () {
            if (this.scrollHeight > this.clientHeight ||
                this.scrollWidth > this.clientWidth) {
                // 父级滚动时，影藏编辑器处理
                if (_.isUndefined($(this).data('stopcelledit'))) { // 使得scroll事件只绑定一次
                    $(this).on('scroll', function () {
                        if ($(this).data('stopcelledit')) {
                            TableTools.stopCellEdit();
                        } else {
                            $(this).data('stopcelledit', true);
                        }
                    }).data('stopcelledit', true);
                }

            }
        });
    };

    /**
     * 完成编辑
     */
    static stopCellEdit() {
        $('body>.celleditor').trigger('stop');
    };

    /**
     * 获取单元格编辑器定位
     * @param cell
     * @param covered
     * @returns {{top: null, bottom: null, left: null, right: null, display: string}}
     */
    static positionCellEditor(cell: HTMLElement, covered = true) {
        const postion = {
            'top': null,
            'bottom': null,
            'left': null,
            'right': null,
            'display': 'block',
            'z-index': 0
        };
        if ($(cell).offset().top > $(window).height() / 2) {
            postion.bottom = $(window).height() - $(cell).offset().top - (covered ? $(cell).outerHeight() : 0);
        } else {
            postion.top = $(cell).offset().top + (covered ? 0 : $(cell).outerHeight());
        }
        if ($(cell).offset().left > $(window).width() / 2) {
            postion.right = $(window).width() - $(cell).offset().left - $(cell).outerWidth();
        } else {
            postion.left = $(cell).offset().left;
        }
        let zIndex = parseInt($(cell).css('z-index'), 10) || 0;
        $(cell).parents().each(function () {
            zIndex = Math.max(zIndex, parseInt($(this).css('z-index'), 10) || 0);
        });
        postion['z-index'] = zIndex + 10000;
        return postion;
    };

    static createCellEditor() {
        return $('body')
            .append('<div class="ngs-celleditor" style="display: none;"></div>')
            .find('>.ngs-celleditor');
    };

    /**
     * 数字格式化
     * @param value
     * @param format 格式 #、#,###.#0、000000 ￥#,###.#0
     * @returns {any}
     */
    static formatNumber = (value, format: string): string => {
        if (!(_.isNumber(value) && !_.isNaN(value)) && !(_.isString(value) && value && /^(-?\d*)(\.\d+)?$/.test(value))) {
            return null;
        }
        if (_.isString(value) && /^(-?)(\.\d+)?$/.test(value)) {
            value = value.replace(/\./, '0.');
        }
        const patterns = /(#|0|,)+\.?(#|0|,)*/.exec(format);
        if (patterns) {
            // 分整数部分处理和小数本分处理
            let [int_fmt, dec_fmt] = patterns[0].split('.');
            let [int_val, dec_val] = value.toString().split('.');
            let int_res = '', dec_res = '';
            /*
             整数部分处理
             */
            // 处理负数，先去掉‘-’号，处理完再添加
            const negative = int_val.indexOf('-') === 0;
            if (negative) {
                int_val = int_val.replace(/^-/, '');
            }
            // 去除0
            int_val = int_val.replace(/^0+/, '').replace(/^\./, '0.') || '0';
            // 将0之后的#变为0
            let zeroIndex = int_fmt.indexOf('0');
            if (zeroIndex >= 0) {
                int_fmt = int_fmt.substring(0, zeroIndex) + int_fmt.substring(zeroIndex).replace(/#/g, '0');
            }
            // 将int_fmt补全到int_val对应长度
            let dif = int_val.length - int_fmt.replace(/,/g, '').length;
            if (dif > 0) {
                let comma_split = int_fmt.split(','), comma_digit = 0, comma = comma_split.length > 1;
                if (comma) {
                    comma_digit = Math.max(comma_split[0].length, comma_split[1].length);
                }
                for (let i = 0, j = int_fmt.indexOf(','); i < dif; i++) {
                    if (comma && j >= comma_digit) {
                        int_fmt = ',' + int_fmt;
                        j = 0;
                    }
                    int_fmt = '#' + int_fmt;
                    if (comma) {
                        j++;
                    }
                }
            }
            // 替换处理
            const int_fmt_arr = int_fmt.split(''), int_val_arr = int_val.split(''), int_fmt_len = int_fmt.length,
                int_val_len = int_val.length;
            for (let i = 0, j = 0; i < int_fmt_len; i++) {
                switch (int_fmt_arr[int_fmt_len - 1 - i]) {
                    case '#':
                        if (int_val_len - j > 0) {
                            int_res = int_val_arr[int_val_len - 1 - j] + int_res;
                            j++;
                        }
                        break;
                    case '0':
                        if (int_val_len - j > 0) {
                            int_res = int_val_arr[int_val_len - 1 - j] + int_res;
                            j++;
                        } else {
                            int_res = '0' + int_res;
                        }
                        break;
                    case ',':
                        int_res = ',' + int_res;
                        break;
                }
            }
            int_res = int_res.replace(/^,+/, '');
            if (negative) {
                int_res = '-' + int_res;
            }
            if (dec_fmt) {
                // 小数部分0之前的#变为0
                let zeroLastIndex = dec_fmt.lastIndexOf('0');
                if (zeroLastIndex <= dec_fmt.length) {
                    dec_fmt = dec_fmt.substring(0, zeroLastIndex).replace(/#/g, '0') + dec_fmt.substring(zeroLastIndex);
                }
                dec_val = dec_val || '';
                const dec_fmt_arr = dec_fmt.split(''), dec_val_arr = dec_val.split(''), dec_fmt_len = dec_fmt.length,
                    dec_val_len = dec_val.length;
                for (let i = 0, j = 0; i < dec_fmt_len; i++) {
                    switch (dec_fmt_arr[i]) {
                        case '#':
                            if (j < dec_val_len) {
                                dec_res += dec_val_arr[j];
                                j++;
                            }
                            break;
                        case '0':
                            if (j < dec_val_len) {
                                dec_res += dec_val_arr[j];
                                j++;
                            } else {
                                dec_res += '0';
                            }
                            break;
                        case ',':
                            dec_res += ',';
                            break;
                    }
                }
                dec_res = dec_res.replace(/,+$/, '');
            }
            return format.replace(patterns[0], int_res + (dec_res ? '.' + dec_res : ''));
        } else {
            return value.toString();
        }
    };

}

export interface CellTreeSelectConfig extends CellConfig {
    options?: Array<any>; // 选择项
    multiple?: boolean; // 是否多选
    valueSeparator?: string; // 值分隔符
    reversible?: boolean; // 可反选的
    searchable?: boolean; // 是否可搜索
    onlyLeafSelect?: boolean; // 是否只能选择子节点
    threeState?: boolean; // jstree中checkbox有三种状态（级联选择子节点）
    lazy?: boolean;
}

interface CellConfig {
    value?: any;
    onStop?: Function;
    onRender?: Function;
}
