import * as _ from 'underscore';
import {CellConfig, beforeCellEdit, positionCellEditor, createCellEditor} from '.';

interface CellTextAreaConfig extends CellConfig {
    minWidth?: number;
}

const cell_textarea = (cell: HTMLElement, cfg: CellTextAreaConfig) => {
    beforeCellEdit(cell);
    // 先停止其它单元格编辑
    if (_.isUndefined(cfg.value) || _.isNull(cfg.value)) {
        cfg.value = '';
    }
    const position = positionCellEditor(cell);
    const $celleditor = createCellEditor();
    $celleditor
        .css(position)
        .append('<div contenteditable="true" class="input"></div>')
        .one('stop', function() {
            const value0 = $(this).find('>.input').text();
            if (cfg.value.toString() !== value0.toString()) {
                cfg.onStop(value0);
            }
            $(this).remove();
        });
    $celleditor
        .find('>.input')
        .css({
            'height': 'auto',
            'width': $(cell).outerWidth() + 'px',
            'min-height': ($(cell).outerHeight() * 2) + 'px',
            'min-width': (cfg.minWidth || 150) + 'px',
            'max-height': ($(window).height() - (position.top || position.bottom) - 10) + 'px',
            'max-width': ($(window).width() - (position.left || position.right) - 10) + 'px',
            'overflow': 'auto',
            'word-break': 'break-all',
            'word-wrap': 'break-word'
        })
        .text(cfg.value)
        .focus();
    if (typeof cfg.onRender === 'function') {
        cfg.onRender($celleditor, cfg);
    }
};

export {
    cell_textarea,
}
