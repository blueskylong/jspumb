import {Constants} from "../common/Constants";
import {SystemParam} from "../common/GlobalParams";

export class DmConstants {
    // static DEFAULT_SCHEMA_ID = 2;//默认的方案ID
    // static DEFAULT_REFERENCE_ID = 0;//默认的引用方案
    /**
     * 关系类型
     */
    static RelationType = {
        /**
         * 一对一关系
         */
        oneToOne: 1,
        /**
         * 一对多关系
         */
        oneToMulti: 2,
        /**
         * 多对一关系
         */
        multiToOne: 3,
        /**
         * 多对多关系
         */
        multiToMulti: 4,
    };
    static ConstField = {
        versionCode: "version_code",
        xh: "xh",
        lvlCode: "lvl_code"
    };

    /**
     * 默认的方案作用
     */
    static DefaultSchemaIDs = {
        /**
         * 默认业务方案ID
         */
        DEFAULT_BS_SCHEMA: 3,
        /**
         * 默认系统方案ID
         */
        DEFAULT_SYS_SCHEMA: 2,
        /**
         * 基础方案方案
         */
        DEFAULT_DM_SCHEMA: 1,
        /**
         * 全局引用方案
         */
        DEFAULT_REFERENCE_SCHEMA: 0,
    };

    static DefaultRsIds = {
        role: 11,
        menu: 12,
        menuButton: 13,
        organization: 14
    };

    /**
     *固定系统参数
     */
    static GlobalParamsIds = {
        userId: 9991,
        roleId: 9992,
        version: 9995,
        userName: 9999,
        userBelong: 9998,
        userAccount: 9996
    }

    /**
     * 公式元素类型
     */
    static FormulaElementType = {
        logic: 100,//逻辑运算符,如: and  or
        compare: 200,//比较符 如:> <
        mathOperator: 300, //数学符号, 如 +-
        bracket: 500,//括号
        column: 800,//字段
        sysparam: 900,//系统参数
        constant: 1000,//常量,如"xxx"
        group: 1100,//分组函数
        error: 9999//错误类型
    }
}
