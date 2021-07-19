import {FormulaElement, TransCenter, TransElement} from "./TransElement";
import {DmConstants} from "../../../DmConstants";
import {Schema} from "../../Schema";
import {FormulaTools} from "../FormulaTools";
import {SchemaFactory} from "../../../SchemaFactory";
import {Column} from "../../Column";
import {CommonUtils} from "../../../../common/CommonUtils";
import {Constants} from "../../../../common/Constants";
import {TableColumnRelation} from "../../TableColumnRelation";
import {DmService} from "../../../service/DmService";
import {FormulaInfo} from "../../../../blockui/uiruntime/FormulaInfo";

@FormulaElement()
export class ColumnElement implements TransElement {

    getElementType(): number {
        return DmConstants.FormulaElementType.column;
    }

    getName(): string {
        return "列参数";
    }

    getExpressionCN() {
        return this.getName();
    }

    getOrder(): number {
        return this.getElementType();
    }

    isMatchCn(str): boolean {
        return FormulaTools.isColumnParam(str.trim());
    }

    isMatchInner(str): boolean {
        return FormulaTools.isColumnParam(str.trim());
    }

    transToCn(curElement: string, transcenter?: TransCenter): string {
        console.log(this.getName() + "  matched!");
        /**
         * 这里要注意,会有临时列,这里是查询不到的
         * @param exp
         */

        let columnParams = FormulaTools.getColumnParams(curElement);
        if (!columnParams || columnParams.length < 1) {
            return curElement;
        }
        for (let param of columnParams) {
            let column = SchemaFactory.getColumnById(param);
            let tableInfo = SchemaFactory.getTableByTableId(column.getColumnDto().tableId);
            curElement = FormulaTools.replaceColumnNameStr(curElement, param,
                tableInfo.getTableDto().title + "." + column.getColumnDto().title);
        }
        return curElement;
    }

    transToInner(curElement: string, schema: Schema, transcenter?: TransCenter): string {
        console.log(this.getName() + "  matched!");
        let columnParams = FormulaTools.getColumnParams(curElement);
        if (!columnParams || columnParams.length < 1) {
            return curElement;
        }
        for (let paramName of columnParams) {
            let names = paramName.split(".");
            if (names.length != 2) {
                throw new Error("列全名不正确");
            }
            let table = schema.findTableByTitle(names[0]);
            if (!table) {
                throw new Error("方案[" + schema.getSchemaDto().schemaName + "]中,表不存在[" + names[0] + "]");
            }
            let column = table.findColumnByColTitle(names[1]);
            if (column == null) {
                throw new Error("方案[" + schema.getSchemaDto().schemaName + "]中,列不存在[" + paramName + "]");
            }
            let tableInfo = SchemaFactory.getTableByTableId(column.getColumnDto().tableId);
            curElement = FormulaTools.replaceColumnNameStr(curElement, paramName,
                column.getColumnDto().columnId + "");
        }
        return curElement;
    }


    async transToValue(curElement: string, rowTableId, rowData, schema?: Schema, transcenter?: TransCenter, groupedData?): Promise<string> {
        console.log(this.getName() + "  matched!");
        let fieldType = null;
        let columnParams = FormulaTools.getColumnParams(curElement);
        if (CommonUtils.isEmpty(columnParams)) {
            return curElement;
        }
        for (let param of columnParams) {
            let column = SchemaFactory.getColumnById(param);
            fieldType = column.getColumnDto().fieldType;

            let tableInfo = SchemaFactory.getTableByTableId(column.getColumnDto().tableId);

            if (column.getColumnDto().tableId == rowTableId) {
                //如果是本表列,则直接从rowData中取数
                curElement = FormulaTools.replaceColumnValueStr(curElement, param,
                    this.getFieldValue(column, rowData).toString(), fieldType);
            } else {
                //如果不是本表数据,则需要去查询表之间的关系,并查询出来数据
                let relation = schema.findTableRelation(rowTableId, column.getColumnDto().tableId);
                let err = this.checkForeignColRelation(schema,
                    rowTableId
                    , tableInfo.getTableDto().title, relation);
                if (!CommonUtils.isEmpty(err)) {
                    throw new Error(err);
                }
                //取得关联的ID值
                //查询数据
                let lstValue = await this.findForeignColValue(relation, column.isNumberColumn(), column,
                    this.findRowRelationFieldValue(relation, rowTableId, rowData), relation.getDto().versionCode);
                let value = '';

                //如果没有数据
                if (CommonUtils.isEmpty(lstValue) || lstValue.length == 1) {
                    if (this.isNumberFieldType(fieldType)) {
                        if (CommonUtils.isEmpty(lstValue)) {
                            value += "0";
                        } else {
                            value += lstValue[0];
                        }

                    } else {
                        if (CommonUtils.isEmpty(lstValue)) {
                            value += "''";
                        } else {
                            //TODO 这里需要转义
                            value += "'" + lstValue[0] + "'";
                        }

                    }
                    //直接替换返回
                    //此处类型写死，为了不让外围函数再加引号
                    curElement = FormulaTools.replaceColumnValueStr(curElement, param,
                        value.toString(), Constants.FieldType.int);

                } else {
                    //如果是多数据,则要替换成特定参数,由分组函数处理
                    let key = FormulaTools.getGroupParamName();
                    groupedData.put(key, lstValue);
                    curElement = FormulaTools.replaceColumnValueStr(curElement, param,
                        key, fieldType);

                }

            }


        }
        return curElement;
    }

    private isNumberFieldType(fieldType) {
        return Constants.FieldType.decimal == fieldType
            || Constants.FieldType.int == fieldType
            || Constants.FieldType.binary == fieldType;
    }

    private getFieldValue(column: Column, rowData) {
        let value = rowData[column.getColumnDto().fieldName];
        if (value == null) {
            if (column.isNumberColumn()) {
                value = 0;
            } else {
                value = "";
            }
        }
        //给字符串包裹引号
        if (!column.isNumberColumn()) {
            value = "'" + value + "'";
        }
        return value;
    }

    isOnlyForFilter(): boolean {
        return false;
    }


    /**
     * 查询外表列值
     *
     * @param relation      表之间的关系
     * @param isNumberValue 是不是数字字段,指的是目标字段,不是查询字段
     * @param queryColumn   需要查询的字段
     * @param id            行ID
     * @param version
     * @return
     */
    private async findForeignColValue(relation: TableColumnRelation,
                                      isNumberValue: boolean,
                                      queryColumn: Column,
                                      id, version): Promise<Array<object>> {
        let fieldName = queryColumn.getColumnDto().fieldName;
        let table = SchemaFactory.getTableByTableId(queryColumn.getColumnDto().tableId, version);

//查询字段

        //要过滤的字段
        let columnFilter: Column = null;
        if (relation.getTableFrom().getTableDto().tableId == table.getTableDto().tableId) {
            columnFilter = SchemaFactory.getColumnById(relation.getDto().fieldFrom, version);
        } else {
            columnFilter = SchemaFactory.getColumnById(relation.getDto().fieldTo, version);
        }
        let filter = {};
        filter[columnFilter.getColumnDto().fieldName] = id;
        let promise = new Promise<Array<object>>(resolve => {
            DmService.findTableFieldRows(table.getTableDto().tableId,
                queryColumn.getColumnDto().columnId, filter, (data: Array<object>) => {
                    let lstData = data;
                    if (CommonUtils.isEmpty(lstData)) {
                        return null;
                    }
                    let lstResult = [];
                    //这里将数值的空变成0 ，字符的空变成"";
                    let isNumberField = queryColumn.isNumberColumn();
                    for (let row of lstData) {
                        let obj = row[fieldName];
                        if (obj == null) {
                            if (isNumberField) {
                                obj = 0;
                            } else {
                                obj = "";
                            }
                        }
                        lstResult.push(obj);
                    }
                    resolve(lstResult);
                })

        });

        return promise;


    }

    /**
     * 检查外表列关系
     */
    private checkForeignColRelation(schema: Schema, rowTableId: number,
                                    foreignTableName: string,
                                    relation: TableColumnRelation) {

        if (relation == null) {
            return "公式引用的二表没有设置关联关系:"
                + foreignTableName + "  和  "
                + schema.findTableById(rowTableId).getTableDto().title;
        }

        return null;
    }

    /**
     * 查询本表中的关联字段的值
     *
     * @param relation
     * @param tableToFind
     * @param row
     * @return
     */
    private findRowRelationFieldValue(relation: TableColumnRelation, tableToFind: number, row: object) {
        //先确定本表的字段
        let fieldId = null;
        if (relation.getTableFrom().getTableDto().tableId == tableToFind) {
            fieldId = relation.getDto().fieldFrom;
        } else {
            fieldId = relation.getDto().fieldTo;
        }
        let column = SchemaFactory.getColumnById(fieldId, relation.getDto().versionCode);
        return row[column.getColumnDto().fieldName];
    }
}
