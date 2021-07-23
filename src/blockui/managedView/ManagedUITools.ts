import {StringMap} from "../../common/StringMap";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import {Column} from "../../datamodel/DmRuntime/Column";
import {Component} from "../uiruntime/Component";
import {DmConstants} from "../../datamodel/DmConstants";
import {Table} from "../table/Table";
import {ColumnDto} from "../../datamodel/dto/ColumnDto";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {ButtonInfo} from "../../uidesign/view/JQueryComponent/Toolbar";
import ClickEvent = JQuery.ClickEvent;
import {CommonUtils} from "../../common/CommonUtils";
import {CacheUtils} from "../../common/CacheUtils";
import {UiService} from "../service/UiService";

export class ManagedUITools {
    static cacheType = "UI";

    /**
     * 取得主健值
     * @param tableId
     */
    public static getDsKeyValue(tableId, row): object {
        return this.getKeyFieldAndValue(tableId, row, false);
    }

    /**
     * 取得主键的键值，
     * @param tableId
     * @param row
     * @param isCamel 行数据是不是已是驼峰
     */
    private static getKeyFieldAndValue(tableId, row, isCamel) {
        let tableInfo = SchemaFactory.getTableByTableId(tableId);
        let columns = tableInfo.getKeyColumns();
        if (!columns || columns.length == 0) {
            Alert.showMessage("数据表没有主键");
            return null;
        }
        if (!row) {
            return null;
        }
        let value = row;
        let result = new StringMap();
        for (let column of columns) {
            let oraField = column.getColumnDto().fieldName;
            let valueField = isCamel ? CommonUtils.toCamel(oraField) :
                oraField;
            result.set(oraField, value[valueField]);
        }
        return result.getValueAsObject();
    }

    /**
     * 取得主健值
     * @param tableId
     */
    public static getDsKeyValueByDtoRow(tableId, row): object {
        return this.getKeyFieldAndValue(tableId, row, true);
    }

    public static getPageSchemaInfo(pageId: string, version: string) {

    }

    /**
     * 查询引用与本数据源的关系字段
     * @param refId
     * @param dsIds 数据表
     */
    public static getReferField(refId, dsIds) {
        let result = new Array<Column>();
        for (let tableId of dsIds) {
            let tableInfo = SchemaFactory.getTableByTableId(tableId);
            for (let column of tableInfo.getLstColumn()) {
                if (column.getColumnDto().refId == refId) {
                    result.push(column);
                }
            }
        }
        return result;
    }

    public static initReferAndDsId(lstComponent: Array<Component>, dsIds: Array<number>,
                                   refCols: StringMap<Array<Column>>) {
        if (lstComponent) {
            let columnDto: ColumnDto;
            for (let component of lstComponent) {
                columnDto = component.getColumn().getColumnDto();
                if (dsIds.indexOf(columnDto.tableId) == -1) {
                    dsIds.push(columnDto.tableId);
                }
                //以下打包引用信息
                let refId = columnDto.refId;
                if (refId) {
                    let columns = refCols.get(refId + "");
                    if (!columns) {
                        columns = new Array<Column>();
                        refCols.set(refId + "", columns);
                    }
                    columns.push(component.getColumn());
                }
            }
        }
    }

    /**
     * 取得表关系字段
     * @param tableId
     * 返回的第一个字段是对方字段名,第二个本数据源的字段
     */
    public static getTableRelationField(tableId, dsIds): Array<string> {
        //非同一源,但相关的,则需要到后台查询
        let tableRelation = SchemaFactory.getTablesRelation(tableId, dsIds[0]);
        if (!tableRelation) {
            return null;
        }
        //这里只关心从本数据源开始的一对一或多对一关系,一般认为一对多关系中,一是主表,多是从表
        if ((tableRelation.getDto().relationType == DmConstants.RelationType.oneToMulti
            && tableRelation.getTableFrom().getTableDto().tableId == tableId)
            || (tableRelation.getDto().relationType == DmConstants.RelationType.multiToOne
                && tableRelation.getTableTo().getTableDto().tableId == tableId)
            || tableRelation.getDto().relationType == DmConstants.RelationType.oneToOne) {
            //本表的字段
            let colIdSelf = (tableRelation.getTableFrom().getTableDto().tableId == tableId) ? tableRelation.getDto().fieldTo : tableRelation.getDto().fieldFrom;
            let columnSelf = SchemaFactory.getColumnById(colIdSelf);
            //源表的字段
            //源表的字段
            let colIdFrom = (tableRelation.getTableFrom().getTableDto().tableId != tableId) ? tableRelation.getDto().fieldTo : tableRelation.getDto().fieldFrom;
            let columnFrom = SchemaFactory.getColumnById(colIdFrom);
            return [columnFrom.getColumnDto().fieldName, columnSelf.getColumnDto().fieldName];
        }


    }

    public static async getPageSchema(page, version) {
        let key = CommonUtils.genKey(page, version);
        let schemaId = CacheUtils.get(ManagedUITools.cacheType, key);
        if (schemaId) {
            return schemaId;
        } else {
            let schemaId = await UiService.findPageSchemaId(page);
            CacheUtils.put(ManagedUITools.cacheType, key, schemaId);
            return schemaId;
        }

    }

    public static findRow(tableId, mapKeyAndValue: object, data: Array<any>, valueField: string) {
        if (!mapKeyAndValue) {
            return null;
        }
        if (!data) {
            return null;
        }
        if (Array.isArray(data)) {
            for (let row of data) {
                if (this.isInRow(row, mapKeyAndValue)) {
                    return row[valueField];
                }
            }
        }
        return null;
    }

    /**
     * subObject是不是包含在fullObject中
     * @param fullObject
     * @param subObject
     */
    public static isInRow(fullObject, subObject: object) {
        let result = true;
        new StringMap(subObject).forEach((key, value, map) => {
            if (!fullObject.hasOwnProperty(key) || fullObject[key] != value) {
                result = false;
                return false;
            }
        });
        return result;
    }

    /**
     * 处理过滤条件,返回TRUE 表示要刷新
     * @param refId
     * @param dsIds
     * @param extFilter
     * @param refIdValue
     */
    public static makeFilter(refId, dsIds, extFilter, refIdValue) {
        //可能会有多个字段,但这个情况非常少
        let referFields = ManagedUITools.getReferField(refId, dsIds);
        if (!referFields) {
            return false;
        }
        //增加条件,刷新数据
        if (!refIdValue) {
            for (let col of referFields) {
                delete extFilter[col.getColumnDto().fieldName];
            }
        } else {
            for (let col of referFields) {
                extFilter[col.getColumnDto().fieldName] = refIdValue;
            }
        }
        return true;
    }

    /**
     * 查询与指定表相关的按钮,就是指定表的增删改查操作.
     * @param lstBtn
     * @param dsId
     */
    public static findRelationButtons(lstBtn: Array<MenuButtonDto>, tableId: number, isFilterUsed = false) {
        if (!lstBtn || lstBtn.length == 0) {
            return null;
        }
        let result = new Array<MenuButtonDto>();
        for (let btnInfo of lstBtn) {
            if (btnInfo.relationTableid == tableId) {
                if (!isFilterUsed || !btnInfo.isUsed) {
                    result.push(btnInfo);
                }
            }
        }
        return result;

    }


    static genKeyFieldValue(tableId) {
        let tableInfo = SchemaFactory.getTableByTableId(tableId);
        let columns = tableInfo.getKeyColumns();
        if (!columns || columns.length == 0) {
            Alert.showMessage("数据表没有主键");
            return null;
        }
        let result = new StringMap();
        for (let column of columns) {
            result.set(column.getColumnDto().fieldName, CommonUtils.genId());
        }
        return result.getValueAsObject();
    }

    static getKeyColumn(dsId) {
        let tableInfo = SchemaFactory.getTableByTableId(dsId);
        //查询主表字段.
        let columns = tableInfo.getKeyColumns();
        //如果没有主表,则不处理
        let result = new Array<Column>();
        if (columns && columns.length !== 0) {
            for (let column of columns) {
                if (column.getColumnDto().isKey && column.getColumnDto().isKey == 1) {
                    result.push(column);
                }
            }
        }
        return result;
    }

    static getOneKeyColumnField(dsId) {
        let cols = ManagedUITools.getKeyColumn(dsId);
        if (!cols || cols.length != 1) {
            throw new Error("不正确的主键字段配置");
        }
        return cols[0].getColumnDto().fieldName;
    }
}
