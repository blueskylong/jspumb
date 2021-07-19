import {Schema} from "./DmRuntime/Schema";
import {CommonUtils} from "../common/CommonUtils";
import {DmService} from "./service/DmService";
import {GlobalParams} from "../common/GlobalParams";
import {BeanFactory} from "../decorator/decorator";
import {StringMap} from "../common/StringMap";
import {TableInfo} from "./DmRuntime/TableInfo";
import {Logger} from "../common/Logger";
import {TableColumnRelation} from "./DmRuntime/TableColumnRelation";
import {Column} from "./DmRuntime/Column";
import {DmConstants} from "./DmConstants";
import {Alert} from "../uidesign/view/JQueryComponent/Alert";

export class SchemaFactory {
    static schemaId = 2;

    private static isReady = false;


    /**
     * 方案缓存
     */
    static CACHE_SCHEMA = new StringMap<Schema>();
    /**
     * 其它用于便利查询的缓存
     */
    static CACHE_OTHER = new StringMap<StringMap<any>>();

    static KEY_COL_TABLE = "COL_TABLE";
    static KEY_COLID_COL = "COLID_COL";
    static KEY_TABLEID_TABLE = "TABLEID_TABLE";


    /**
     * 取得方案信息,这里的缓存在程序启动时就向客户端申请
     * @param schemaId
     * @param version
     */
    static getSchema(schemaId: number, version: string): Schema {
        return SchemaFactory.CACHE_SCHEMA.get(CommonUtils.genKey(schemaId, version));
    }

    /**
     * 是否加载完成
     */
    public static isLoadReady() {
        return SchemaFactory.isReady;
    }

    init(callback: Function) {
        SchemaFactory.isReady = false;
        DmService.findSchemaIds((data) => {
            if (!Array.isArray(data)) {
                Alert.showMessage("查询数据失败");
                return;
            }
            if (data) {
                for (let id of data) {
                    SchemaFactory.initOneSchema(id, GlobalParams.getLoginVersion());
                }
            }
            SchemaFactory.isReady = true;
            if (callback) {
                callback();
            }
        });

    }

    static getMastTables(tableId) {
        SchemaFactory.getTablesRelation(tableId, GlobalParams.getLoginVersion());
    }

    static initOneSchema(id, version) {
        DmService.findSchemaInfo(id, version).then(
            (result) => {
                let schema = BeanFactory.populateBean(Schema, result.data);
                if (schema) {
                    SchemaFactory.CACHE_SCHEMA
                        .set(CommonUtils.genKey(id, version), schema);
                    this.initShortSearchInfo(schema);
                } else {
                    SchemaFactory.CACHE_SCHEMA.delete(CommonUtils.genKey(id, version));
                }

            }
        )
    }

    /**
     * 整理查询用的缓存信息
     * @param schema
     */
    private static initShortSearchInfo(schema: Schema) {
        let mapColIdToTable = SchemaFactory.CACHE_OTHER.get(SchemaFactory.KEY_COL_TABLE)
            ? SchemaFactory.CACHE_OTHER.get(SchemaFactory.KEY_COL_TABLE) : new StringMap<any>();
        let mapColIdToCol = SchemaFactory.CACHE_OTHER.get(SchemaFactory.KEY_COLID_COL)
            ? SchemaFactory.CACHE_OTHER.get(SchemaFactory.KEY_COLID_COL) : new StringMap<any>();
        let mapTableIdToTable = SchemaFactory.CACHE_OTHER.get(SchemaFactory.KEY_TABLEID_TABLE)
            ? SchemaFactory.CACHE_OTHER.get(SchemaFactory.KEY_TABLEID_TABLE) : new StringMap<any>();
        let version = schema.getSchemaDto().versionCode;
        if (schema.getLstTable()) {
            for (let table of schema.getLstTable()) {
                mapTableIdToTable.set(table.getTableDto().tableId + "_" + version, table);
                if (table.getLstColumn()) {
                    for (let col of table.getLstColumn()) {
                        mapColIdToCol.set(col.getColumnDto().columnId + "_" + version, col);
                        mapColIdToTable.set(col.getColumnDto().columnId + "_" + version, table);
                    }
                }
            }
        }
        SchemaFactory.CACHE_OTHER.set(SchemaFactory.KEY_COL_TABLE, mapColIdToTable);
        SchemaFactory.CACHE_OTHER.set(SchemaFactory.KEY_COLID_COL, mapColIdToCol);
        SchemaFactory.CACHE_OTHER.set(SchemaFactory.KEY_TABLEID_TABLE, mapTableIdToTable);
        schema.initExtendInfo();
    }

    /**
     * 根据列ID查询相应的表(视图)信息
     * @param colId
     */
    static getTableByColId(colId, version?): TableInfo {
        version = version ? version : GlobalParams.getLoginVersion();
        return (<StringMap<any>>SchemaFactory.CACHE_OTHER
            .get(SchemaFactory.KEY_COL_TABLE)).get(colId + "_" + version);
    }

    static getColumnById(colId, version?): Column {
        version = version ? version : GlobalParams.getLoginVersion();
        return (<StringMap<any>>SchemaFactory.CACHE_OTHER
            .get(SchemaFactory.KEY_COLID_COL)).get(colId + "_" + version);
    }

    /**
     * 尝试用表名和列名查询列信息
     * @param tableTitle
     * @param colTitle
     * @param schemaId
     * @param versionCode
     */
    static findColumnByFullName(tableTitle, colTitle, schemaId, versionCode): Column {
        let schema = SchemaFactory.getSchema(schemaId, versionCode);
        if (!schema) {
            return null;
        }
        let tableInfo = schema.findTableByTitle(tableTitle);
        if (!tableInfo) {
            return null;
        }
        return tableInfo.findColumnByColTitle(colTitle);
    }

    /**
     * 根据表(视图)ID查询表(视图)信息
     * @param tableid
     */
    static getTableByTableId(tableid, version?: string): TableInfo {
        version = version ? version : GlobalParams.getLoginVersion();
        return (<StringMap<any>>SchemaFactory
            .CACHE_OTHER.get(SchemaFactory.KEY_TABLEID_TABLE)).get(tableid + "_" + version);
    }

    /**
     * 根据表(视图)ID查询表(视图)信息
     * @param tableid
     */
    static getTableByTableName(tableName, schemaId, version?: string): TableInfo {
        version = version ? version : GlobalParams.getLoginVersion();
        let schema = this.getSchema(schemaId, version);
        if (!schema) {
            return null;
        }
        return schema.findTableByName(tableName);

    }

    /**
     * 查询二张表的直接关系
     * @param tableId1
     * @param tableId2
     */
    static getTablesRelation(tableId1, tableId2): TableColumnRelation {
        let lstRelation = SchemaFactory.getSchemaRelationsByTableId(tableId1);
        for (let relation of lstRelation) {
            if ((relation.getTableTo().getTableDto().tableId == tableId1 && relation.getTableFrom().getTableDto().tableId == tableId2)
                || (relation.getTableTo().getTableDto().tableId == tableId2 && relation.getTableFrom().getTableDto().tableId == tableId1)) {
                return relation;
            }
        }
        return null;

    }

    /**
     * 根据
     * @param tableId
     */
    static getSchemaRelationsByTableId(tableId: number) {
        let tableInfo = this.getTableByTableId(tableId);
        if (!tableInfo) {
            Logger.error("没有查询到表信息");
            return null;
        }
        let schemaId = tableInfo.getTableDto().schemaId;
        let schema = SchemaFactory.getSchema(schemaId, tableInfo.getTableDto().versionCode);
        let lstRelation = schema.getLstRelation();
        if (!lstRelation) {
            return null;
        }
        return lstRelation;
    }

    /**
     * 查询表与其它表的所有关系
     * @param tableId
     */
    static getTableRelations(tableId: number): Array<TableColumnRelation> {
        let lstRelation = SchemaFactory.getSchemaRelationsByTableId(tableId);
        let result = new Array<TableColumnRelation>();
        for (let relation of lstRelation) {
            if (relation.getTableTo().getTableDto().tableId == tableId
                || relation.getTableFrom().getTableDto().tableId == tableId) {
                result.push(relation);
            }
        }
        return result;
    }

    /**
     * 判断二个表是不是存在直接关系或间接关系
     * @param table1
     * @param table2
     */
    public static hasRelation(table1, table2): boolean {
        let tableRelations = SchemaFactory.getTableRelations(table1);
        if (!tableRelations || tableRelations.length == 0) {
            return false;
        }
        let stack = new Array<number>();
        for (let tableRelation of tableRelations) {
            if (SchemaFactory.isThoseTwoTablesRelation(table1, table2, tableRelation)) {
                return true;
            }
            ///收集待处理的关系
            stack.push(tableRelation.getTableTo().getTableDto().tableId === table1 ?
                tableRelation.getTableFrom().getTableDto().tableId : tableRelation.getTableTo().getTableDto().tableId);
        }
        //记录所有出现过的关系,
        let allAppeardRelation = new Array<number>();
        allAppeardRelation.push(...stack);
        let newChildId;
        while (stack.length > 0) {
            //取得最前面的表进行处理
            newChildId = stack.pop();
            //查询关系
            tableRelations = SchemaFactory.getTableRelations(newChildId);
            for (let tableRelation of tableRelations) {
                if (SchemaFactory.isThoseTwoTablesRelation(newChildId, table2, tableRelation)) {
                    return true;
                }
                ///收集待处理的关系
                let nextId = tableRelation.getTableTo().getTableDto().tableId === newChildId ?
                    tableRelation.getTableFrom().getTableDto().tableId : tableRelation.getTableTo().getTableDto().tableId;
                if (stack.indexOf(nextId) == -1) {//如果是新关系,则压栈.
                    stack.push(nextId);
                }
            }

        }
        return false;

    }


    /**
     * 判断二个表是不是有祖孙关系,传送的关系是,祖为一对多,或一对一的传递到此表
     * 查询方法,是从子开始向上查找,直到找到头
     * @param childId
     * @param ancestorId
     */
    public static isChildAndAncestor(childId, ancestorId): boolean {
        let tableRelations = SchemaFactory.getTableRelations(childId);
        if (!tableRelations || tableRelations.length == 0) {
            return false;
        }
        let stack = new Array<number>();
        for (let tableRelation of tableRelations) {
            if (SchemaFactory.isMultiToOneRelation(childId, ancestorId, tableRelation)) {
                return true;
            }
            //如果不是从表关系,则不处理
            if (SchemaFactory.isTableSlaveRelation(childId, tableRelation)) {
                continue;
            }
            ///收集待处理的关系
            stack.push(tableRelation.getTableTo().getTableDto().tableId === childId ?
                tableRelation.getTableFrom().getTableDto().tableId : tableRelation.getTableTo().getTableDto().tableId);
        }
        //记录所有出现过的关系,
        let allAppeardRelation = new Array<number>();
        allAppeardRelation.push(...stack);
        let newChildId;
        while (stack.length > 0) {
            //取得最前面的表进行处理
            newChildId = stack.pop();
            //查询关系
            tableRelations = SchemaFactory.getTableRelations(newChildId);
            for (let tableRelation of tableRelations) {
                if (SchemaFactory.isMultiToOneRelation(newChildId, ancestorId, tableRelation)) {
                    return true;
                }
                //如果不是从表关系,则不处理
                if (SchemaFactory.isTableSlaveRelation(newChildId, tableRelation)) {
                    continue;
                }
                ///收集待处理的关系
                let nextId = tableRelation.getTableTo().getTableDto().tableId === newChildId ?
                    tableRelation.getTableFrom().getTableDto().tableId : tableRelation.getTableTo().getTableDto().tableId;
                if (stack.indexOf(nextId) == -1) {//如果是新关系,则压栈.
                    stack.push(nextId);
                }
            }

        }
        return false;

    }

    /**
     * 判断是不是当前二张表的关系,并且是主从关系,一对一也符合这样的关系
     * @param childId
     * @param ancestorId
     * @param tableRelation
     */
    private static isMultiToOneRelation(childId, ancestorId, tableRelation: TableColumnRelation) {
        let tableIdFrom = tableRelation.getTableFrom().getTableDto().tableId;
        let tableIdTo = tableRelation.getTableTo().getTableDto().tableId;
        let relationType = tableRelation.getDto().relationType;
        if (ancestorId == tableIdFrom
            && childId == tableIdTo
            && (relationType == DmConstants.RelationType.oneToMulti ||
                relationType == DmConstants.RelationType.oneToOne)) {
            return true;
        }
        if (ancestorId == tableIdTo
            && ancestorId == tableIdFrom
            && (relationType == DmConstants.RelationType.multiToOne ||
                relationType == DmConstants.RelationType.oneToOne)) {
            return true;
        }
        return false;
    }

    /**
     *判断是不是指定的二张表的关系
     * @param tableId1
     * @param tableId2
     * @param tableRelation
     */
    private static isThoseTwoTablesRelation(tableId1, tableId2, tableRelation: TableColumnRelation) {
        return (tableRelation.getTableFrom().getTableDto().tableId === tableId1
            && tableRelation.getTableTo().getTableDto().tableId === tableId2) ||
            (tableRelation.getTableFrom().getTableDto().tableId === tableId2
                && tableRelation.getTableTo().getTableDto().tableId === tableId1);
    }

    /**
     * 判断指定的表是不是从表,一对一也符合这样的关系
     * @param childId
     * @param ancestorId
     * @param tableRelation
     */
    private static isTableSlaveRelation(tableId, tableRelation: TableColumnRelation) {
        let tableIdFrom = tableRelation.getTableFrom().getTableDto().tableId;
        let tableIdTo = tableRelation.getTableTo().getTableDto().tableId;
        let relationType = tableRelation.getDto().relationType;
        if (tableId == tableIdFrom
            && (relationType == DmConstants.RelationType.oneToMulti ||
                relationType == DmConstants.RelationType.oneToOne)) {
            return true;
        }
        if (tableId == tableIdTo
            && (relationType == DmConstants.RelationType.multiToOne ||
                relationType == DmConstants.RelationType.oneToOne)) {
            return true;
        }
        return false;
    }
}




