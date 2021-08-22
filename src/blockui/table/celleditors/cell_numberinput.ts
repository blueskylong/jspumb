import * as _ from 'underscore';
import {CellConfig, beforeCellEdit, positionCellEditor, createCellEditor} from '.';

interface CellNumberInputConfig extends CellConfig {
    min?: number;
    max?: number;
    minWidth?: number;
    align?: string;
    precision?: number;
}

const cell_numberinput = (cell: HTMLElement, cfg: CellNumberInputConfig) => {
    beforeCellEdit(cell);
    if (_.isUndefined(cfg.value) || _.isNull(cfg.value)) {
        cfg.value = '';
    }
    const position = positionCellEditor(cell);
    const $celleditor = createCellEditor();
    $celleditor.css(position)
        .append('<input class="input" type="text"/>')
        .one('stop', function() {
            const value = $(this).find('>input').val();
            if (cfg.value.toString() !== value.toString()) {
                cfg.onStop(value === '' ? null : Number(value));
            }
            $(this).remove();
        });
    $celleditor
        .find('>input')
        .css({
            'height': $(cell).outerHeight() + 'px',
            'width': $(cell).outerWidth() + 'px',
            'max-width': ($(window).width() - (position.left || position.right)) + 'px',
            'min-width': (cfg.minWidth || 0) + 'px',
            'text-align': cfg.align
        }).val(cfg.value).focus()
        .on($.support.leadingWhitespace ? 'input' : 'propertychange', function () {
            const {min, max, precision} = cfg;
            if (this['value'] === '-') {
                if (_.isNumber(min) && min >= 0) {
                    this['value'] = min.toString();
                }
            } else if (this['value'] !== '') {
                let value = this['value'].replace(/[^\d.-]/g, '')
                    .replace(/^-/, '*').replace(/-/g, '').replace('*', '-')
                    .replace(/\./, '*').replace(/\./g, '').replace('*', '.');
                // 最小值处理
                if (_.isNumber(min) && parseFloat(value) < min) {
                    value = min.toString();
                }
                // 最大值处理
                if (_.isNumber(max) && parseFloat(value) > max) {
                    value = max.toString();
                }
                // 精度处理
                if (_.isNumber(precision) && precision >= 0) {
                    if (precision === 0) {
                        value = value.replace(/\./g, '');
                    } else {
                        let spotIndex = value.indexOf('.');
                        if (spotIndex > 0) {
                            value = value.substring(0, spotIndex + precision + 1);
                        }
                    }
                }
                if (this['value'] !== value) {
                    this['value'] = value;
                }
            }
        });
    if (typeof cfg.onRender === 'function') {
        cfg.onRender($celleditor, cfg);
    }
};

export {
    cell_numberinput
}
