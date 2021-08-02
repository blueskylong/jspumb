import {CommonUtils} from "./CommonUtils";

export class Constants {

    static DEFAULT_SCHEMA_ID = 2;//默认的方案ID
    static DEFAULT_REFERENCE_ID = 0;//默认的引用方案
    static TitlePosition = {left: "1", right: "2", none: "0"};

    static ROW_HEIGHT = 25;

    static FieldType = {
        int: "2",
        varchar: "1",
        decimal: "4",
        datetime: "10",
        text: "20",
        binary: "30"

    };

    static DispType = {
        form: 1,
        table: 2,
        tree: 3,
        card: 4,
        refTree: 5,
        custom: 9//自定义面板
    };

    static ComponentType = {
        text: "1",
        button: "5",
        password: "10",
        hidden: '15',
        file: "20",
        checkbox: "22",
        radio: '26',
        textarea: "34",
        select: "39",
        label: "45",
        panel: "50",
        time: "55",
        email: "60",
        color: "65",
        date: "70",
        number: "75",
        filter: "78",
        formula: "80"
    };


    static Icons = {
        add: "fa fa-plus-circle",
        delete: "fa fa-trash",
        save: "fa fa-floppy-o",
        edit: "fa fa-pencil",
        export: "fa fa-file-excel-o",
        word: "fa fa-file-word-o"
    };

    static TreeRole = {
        idField: 1,
        codeField: 2,
        nameField: 3,
        parentField: 4
    };

    /**
     * 页面明细的类型
     */
    static PageViewType = {
        blockView: 1,//界面
        reference: 2,//引用
        page: 3//页面
    };

    /**
     * 界面状态
     */
    static UIState = {
        edit: 1,
        view: 2,
        add: 3
    };
    /**
     * 通用的事件类型
     */
    static GeneralEventType = {
        //选择变化
        SELECT_CHANGE_EVENT: "SELECT_CHANGED",
        /**
         * 值变化事件
         */
        VALUE_CHANGE_EVENT: "VALUE_CHANGED",
        /**
         * 双击事件
         */
        EVENT_DBL_CLICK: "DBL_CLICK",
        /**
         * 点击事件
         */
        EVENT_CLICK: "CLICK"
    };

    /**
     * 前后端协商的固定字段
     */
    static ConstFieldName = {
        /**
         * 保存时用于存放变化过的主键数据
         */
        CHANGE_KEYS_FEILD: "keys",
        /**
         * 插件列前缀
         */
        PLUG_FILTER_PREFIX: "PLUG_COLUMN_"
    };
    /**
     * 表或按钮操作类型
     */
    static DsOperatorType = {
        add: 1,//增加
        delete: 2,//删除
        edit: 3,//修改
        view: 4,//查看(刷新)
        saveSingle: 5,//保存
        saveMulti: 6,
        saveLevel: 7,//保存级次
        editMulti: 8,//修改多行
        cancel: 19,//取消
        query: 30,//查询
        refresh: 31,//刷新
        export: 32,//导出
        custom1: 101,//自定义
        custom2: 111,//自定义
        custom3: 121,//自定义
        custom4: 131,//自定义
    };

    static UserState = {
        normal: 0,
        disabled: -1,
        locked: -2,
        expired: -3,
        credentialsExpired: -4
    };
    /**
     * 表数据集状态变化
     */
    static TableState = {
        add: 1,
        edit: 2,
        view: 3
    };

    /**
     * 表数据变化类型
     */
    static TableDataChangedType = {
        added: 1,
        edited: 2,
        deleted: 3
    };

    /**
     * 界面可容纳的数据量类型
     */
    static UIDataNum = {
        one: 1,
        multi: 2
    };
    /**
     * 面板的位置布局方式
     */
    static PositionLayoutType = {
        /**
         * bootstrap12列布局
         */
        bootstrapLayout: 1,
        absoluteLayout: 2
    }

    static PlugStatus = {
        /**
         * 新的，还没有安装
         */
        NEW: 1,
        /**
         * 已过期
         */
        OLD: 2,
        /**
         * 已安装（正常使用状态）
         */
        INSTALLED: 3
    }

}

