import axios from 'axios';
import * as _ from 'underscore';
import {beforeCellEdit, CellConfig, createCellEditor, positionCellEditor} from '.';
import 'blueimp-file-upload/js/jquery.fileupload.js';
import {UiUtils} from "../../../common/UiUtils";
import {Alert} from "../../../uidesign/view/JQueryComponent/Alert";

interface CellFileUploaderColumn {
    name: string;
    title?: string;
    width?: number;
}

interface CellFileUploaderConfig extends CellConfig {
    name?: string;
    readonly?: boolean;
    dataUrl?: string;
    dataFormatter?: Function;
    uploadUrl?: string;
    downloadUrl?: (data) => string;
    removeUrl?: (data) => string;
    columns?: Array<CellFileUploaderColumn>;
    maxFileSize?: number;
}

const convertFileSize = (size: number) => {
    if (size) {
        const k = 1024,
            sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(size) / Math.log(k));
        return (size / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    } else {
        return '0 B';
    }
};

const generateHeader = (cfg: CellFileUploaderConfig) => {
    let temp = '<table class="cell-fileuploader-header"><tr>';
    temp += '<th style="width: 50px;"></th>';
    for (let column of cfg.columns) {
        const width = column.width || 150;
        temp += '<th title="' + column.title + '" style="width: ' + width + 'px;">' + column.title + '</th>';
    }
    temp += '<th style="width: 150px;">';
    if (cfg.readonly !== true) {
        temp += '<a class="btn blue btn-file"><input type="file" name="' + (cfg.name || 'file') + '">上传</a>';
    }
    temp += '</th>';
    temp += '</tr></table>';
    return temp;
};

const refresh = ($container: JQuery, cfg: CellFileUploaderConfig) => {
    // utils.getRequest({
    //     url: cfg.dataUrl,
    //     successCallBack: (data) => {
    //         if (_.isFunction(cfg.dataFormatter)) {
    //             data = cfg.dataFormatter(data, {
    //                 convertFileSize
    //             });
    //         }
    //         let temp = '<table>';
    //         if (data.length > 0) {
    //             for (let i = 0; i < data.length; i++) {
    //                 temp += '<tr>';
    //                 temp += '<th style="width: 50px;">' + (i + 1) + '</th>';
    //                 for (let column of cfg.columns) {
    //                     const width = column.width || 150, value = data[i][column.name] || '';
    //                     temp += '<td title="' + value + '" style="width: ' + width + 'px;">' + value + '</td>';
    //                 }
    //                 temp += '<th style="width: 150px;">';
    //                 temp += '<a class="file-download" data-index="' + i + '" >下载</a>';
    //                 if (cfg.readonly !== true) {
    //                     temp += '<a class="file-remove" data-index="' + i + '" >删除</a>';
    //                 }
    //                 temp += '</th>';
    //                 temp += '</tr>';
    //             }
    //         } else {
    //             let width = 200;
    //             for (let column of cfg.columns) {
    //                 width += column.width || 150;
    //             }
    //             temp += '<tr><th style="width: ' + width + 'px;">尚未上传</th></tr>';
    //         }
    //
    //         temp += '</table>';
    //         $container.empty().html(temp);
    //         $container.find('.file-download').click(function () {
    //             const {index} = $(this).data();
    //             // utils.download({
    //             //     url: cfg.downloadUrl(data[index])
    //             // });
    //         });
    //         if (cfg.readonly !== true) {
    //             $container.find('.file-remove').click(function () {
    //                 if (confirm('确认删除？')) {
    //                     const {index} = $(this).data();
    //                     const url = cfg.removeUrl(data[index]);
    //                     // utils.deleteRequest({
    //                     //     url: url,
    //                     //     successCallBack: () => {
    //                     //         refresh($container, cfg);
    //                     //     }
    //                     // });
    //                 }
    //             });
    //         }
    //     }
    // });
};

const cell_fileuploader = (cell: HTMLElement, cfg: CellFileUploaderConfig) => {
    beforeCellEdit(cell);
    const position = positionCellEditor(cell, false);
    const maxHeight = $(window).height() - (position.top || position.bottom) - 10;

    const $celleditor = createCellEditor();
    $celleditor.addClass('box-shadow')
        .css('border', '0')
        .css(position)
        .one('stop', function () {
            if (_.isFunction(cfg.onStop)) {
                cfg.onStop(cfg.value);
            }
            $(this).remove();
        })
        .append('<div class="cell-fileuploader"></div>');
    const $fileuploader = $celleditor.find('>.cell-fileuploader');
    const $header = $fileuploader.append(generateHeader(cfg)).find('>.cell-fileuploader-header');
    const $body = $fileuploader.append('<div class="cell-fileuploader-body"></div>').find('>.cell-fileuploader-body').css({
        'max-height': (maxHeight - $header.outerWidth(true)) + 'px',
        'overflow': 'auto'
    });
    refresh($body, cfg);

    if (cfg.readonly !== true) {
        // $fileuploader.find('input[type=file]').fileupload({
        //     url: axios.defaults.baseURL.replace(/\/$/, '') + '/' + cfg.uploadUrl.replace(/^\//, ''),
        //     type: 'POST',
        //     dataType: 'html',
        //     headers: {
        //         'WZ-Token': $.cookie('tokenName'),
        //     },
        //     add: (e, data) => {
        //         const file: any = data.originalFiles[0];
        //         if (_.isNumber(cfg.maxFileSize) && file.size > cfg.maxFileSize) {
        //             Alert.showMessage('文件过大，最大不能超过' + convertFileSize(cfg.maxFileSize));
        //             return;
        //         }
        //
        //         UiUtils.showMask()
        //         data.submit();
        //     },
        //     done: () => {
        //         UiUtils.hideMask();
        //         refresh($body, cfg);
        //     }
        // } as any);
    }

    if (typeof cfg.onRender === 'function') {
        cfg.onRender($celleditor, cfg);
    }
};
export {
    cell_fileuploader
}
