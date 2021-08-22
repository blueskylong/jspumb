import {CellConfig, beforeCellEdit, positionCellEditor, createCellEditor} from '.';
import DatepickerOptions = JQueryUI.DatepickerOptions;

interface CellDatePickerConfig extends CellConfig {
    datepickerConfig?: DatepickerOptions;
}


const cell_datepicker = (cell: HTMLElement, cfg: CellDatePickerConfig) => {
    beforeCellEdit(cell);
    const position = positionCellEditor(cell, false);
    const $celleditor = createCellEditor();

    $celleditor.addClass('box-shadow')
        .css(position)
        .append('<div class="editor"></div>')
        .one('stop', function() {
            $(this).remove();
        });

    $celleditor
        .find('>.editor')
        .css({
            'max-height': ($(window).height() - (position.top || position.bottom) - 10) + 'px',
            'max-width': ($(window).width() - (position.left || position.right) - 10) + 'px',
            'overflow': 'auto'
        })
        .data('date', cfg.value)
        .one('show', function() {
            $(this).one('changeDate', function(e: any) {
                cfg.onStop(e.format());
                $(this).remove();
            });
        })
        .datepicker($.extend({
            language: 'zh-CN',
            autoclose: true,
            format: 'yyyy-mm-dd'
        }, cfg.datepickerConfig));

    if (typeof cfg.onRender === 'function') {
        cfg.onRender($celleditor, cfg);
    }
};

export {
    cell_datepicker
}
