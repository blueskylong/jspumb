import * as _ from 'underscore';
import {CellConfig, beforeCellEdit, positionCellEditor, createCellEditor} from '.';

interface CellTextInputConfig extends CellConfig {
    align?: string;
    maxLength?: number;
    minWidth?: number;
}

const cell_textinput = (cell: HTMLElement, cfg: CellTextInputConfig) => {
    beforeCellEdit(cell);
    if (_.isUndefined(cfg.value) || _.isNull(cfg.value)) {
        cfg.value = '';
    }
    const position = positionCellEditor(cell);
    const $celleditor = createCellEditor();
    $celleditor.css(position)
        .append('<input class="input" type="text"/>')
        .one('stop', function() {
            const value0 = $(this).find('>input').val();
            if (cfg.value.toString() !== value0.toString()) {
                cfg.onStop(value0);
            }
            $(this).remove();
        });
    $celleditor
        .find('>input').css({
            'height': $(cell).outerHeight() + 'px',
            'width': $(cell).outerWidth() + 'px',
            'max-width': ($(window).width() - (position.left || position.right)) + 'px',
            'min-width': (cfg.minWidth || 0) + 'px',
            'text-align': cfg.align
        }).prop({
            'maxlength': cfg.maxLength
        }).val(cfg.value).focus();
    if (typeof cfg.onRender === 'function') {
        cfg.onRender($celleditor, cfg);
    }
};

export {
    cell_textinput
}
