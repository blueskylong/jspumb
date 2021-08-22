import * as _ from 'underscore';
import './styles/index.scss';

interface CellConfig {
    value?: any;
    onStop?: Function;
    onRender?: Function;
}

/**
 * 完成编辑
 */
const stopCellEdit = () => {
    $('body>.ngs-celleditor').trigger('stop');
};

/**
 * 单元格编辑前处理
 * @param cell
 */
const beforeCellEdit = (cell: HTMLElement) => {
    // 停止其它单元格编辑
    stopCellEdit();
    $(cell).parents().each(function() {
        if (this.scrollHeight > this.clientHeight ||
            this.scrollWidth > this.clientWidth) {
            // 父级滚动时，影藏编辑器处理
            if (_.isUndefined($(this).data('stopcelledit'))) { // 使得scroll事件只绑定一次
                $(this).on('scroll', function() {
                    if ($(this).data('stopcelledit')) {
                        stopCellEdit();
                    } else {
                        $(this).data('stopcelledit', true);
                    }
                }).data('stopcelledit', true);
            }
            // 让单元格完全展示到视觉范围处理
            // left、right
            // const dLeft = $(cell).offset().left - $(this).offset().left;
            // if (dLeft < 0) {
            //     $(this).data('stopcelledit', false);
            //     this.scrollLeft = this.scrollLeft + $(cell).offset().left - $(this).offset().left;
            // } else {
            //     const dRight = ($(this).offset().left + $(this).outerWidth()) - ($(cell).offset().left + $(cell).outerWidth());
            //     if (dRight < 0) {
            //         $(this).data('stopcelledit', false);
            //         this.scrollLeft = this.scrollLeft - dRight;
            //     }
            // }
            // // top、bottom
            // const dTop = $(cell).offset().top - $(this).offset().top;
            // if (dTop < 0) {
            //     $(this).data('stopcelledit', false);
            //     this.scrollTop = this.scrollTop + $(cell).offset().top - $(this).offset().top;
            // } else {
            //     const dBottom = ($(this).offset().top + $(this).outerHeight()) - ($(cell).offset().top + $(cell).outerHeight());
            //     if (dBottom < 0) {
            //         $(this).data('stopcelledit', false);
            //         this.scrollTop = this.scrollTop - dBottom;
            //     }
            // }
        }
    });
};

/**
 * 获取单元格编辑器定位
 * @param cell
 * @param covered
 * @returns {{top: null, bottom: null, left: null, right: null, display: string}}
 */
const positionCellEditor = (cell: HTMLElement, covered = true) => {
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
    $(cell).parents().each(function() {
        zIndex = Math.max(zIndex, parseInt($(this).css('z-index'), 10) || 0);
    });
    postion['z-index'] = zIndex + 10000;
    return postion;
};

const createCellEditor = () => {
    return $('body')
        .append('<div class="ngs-celleditor" style="display: none;"></div>')
        .find('>.ngs-celleditor');
};

// 窗口大小改变，停止编辑
let resizeTimer = null;
$(window).on('resize', function (){
    if (!resizeTimer) {
        resizeTimer = setTimeout(function() {
            stopCellEdit();
            clearTimeout(resizeTimer);
            resizeTimer = null;
        } , 100);
    }
});
$(document).on('scroll', function() {
    // 文档滚动时，停止编辑
    stopCellEdit();
}).on('mousedown', function(e) {
    // 若点击的地方不是编辑器范围内，则停止编辑
    if ($(e.target).closest('.ngs-celleditor').length === 0) {
        stopCellEdit();
    }
});

export {
    CellConfig,
    stopCellEdit,
    beforeCellEdit,
    positionCellEditor,
    createCellEditor
}

export * from './cell_textinput';
export * from './cell_numberinput';
export * from './cell_treeselect';
export * from './cell_datepicker';
export * from './cell_textarea';
export * from './cell_fileuploader';
