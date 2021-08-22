if ($.support.leadingWhitespace) {
    const XLSX = require('./xlsx/xlsx.js'),
        FileSaver = require('file-saverjs'),
        Blob = require('blobjs'),
        bookType = 'xlsx',
        sheetName = 'Sheet1',
        colWidth = {wpx: 145};

    class Workbook {
        Workbook;
        SheetNames: String[];
        Sheets;

        constructor() {
            this.Workbook = {Views: []};
            this.SheetNames = [];
            this.Sheets = {};
        }
    }

    function createSheet(data, merges) {
        const ws = {},
            range = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}},
            cols = [];
        for (let R = 0; R !== data.length; ++R) {
            for (let C = 0; C !== data[R].length; ++C) {
                if (range.s.r > R) {
                    range.s.r = R;
                }
                if (range.s.c > C) {
                    range.s.c = C;
                }
                if (range.e.r < R) {
                    range.e.r = R;
                }
                if (range.e.c < C) {
                    range.e.c = C;
                }
                const cell = data[R][C];
                if (!cell || !cell.v) {
                    continue;
                }
                const cell_ref = XLSX.utils.encode_cell({c: C, r: R});

                if (!cell.t) {
                    cell.t = 's';
                }
                ws[cell_ref] = cell;
            }
        }
        for (let i = 0, l = data[0].length; i < l; i++) {
            cols.push(colWidth);
        }
        ws['!merges'] = merges;
        ws['!cols'] = cols;
        if (range.s.c < 10000000) {
            ws['!ref'] = XLSX.utils.encode_range(range);
        }
        return ws;
    }

    $.fn['data2xlsx'] = function (fileName: string, data: Array<any>, merges: Array<any>) {
        const wb = new Workbook(),
            ws = createSheet(data, merges);
        wb.SheetNames.push(sheetName);
        wb.Sheets[sheetName] = ws;
        wb.Workbook.Views[0] = {RTL: false};

        const wopts = {
                bookType: bookType,
                bookSST: false,
                type: 'binary'
            },
            wbout = XLSX.write(wb, wopts),
            len = wbout.length,
            buf = new ArrayBuffer(len),
            view = new Uint8Array(buf);

        for (let i = 0; i !== len; ++i) {
            view[i] = wbout.charCodeAt(i) & 0xff;
        }
        FileSaver(new Blob([buf], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
        }), fileName + '.' + bookType, true);
    };
}
