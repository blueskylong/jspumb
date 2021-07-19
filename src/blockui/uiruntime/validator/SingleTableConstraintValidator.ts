import {IValidator} from "../IValidator";
import {BlockViewer} from "../BlockViewer";
import {Component} from "../Component";
import {RegValidator} from "../../../decorator/decorator";
import {SchemaFactory} from "../../../datamodel/SchemaFactory";
import {Constraint} from "../../../datamodel/DmRuntime/Constraint";
import {FormulaParse} from "../../../datamodel/DmRuntime/formula/FormulaParse";

/**
 * 单表约束检查
 */
@RegValidator()
export class SingleTableConstraintValidator implements IValidator {
    private lstConstraint: Array<Constraint>;
    private formulaParse: FormulaParse;

     validateField(fieldName, value, row, viewer: BlockViewer): string {
        return ""
    }

    async doValide(row, viewer: BlockViewer) {
        for (let cons of this.lstConstraint) {
            let filter = cons.getConstraintDto().filter;
            let expression = cons.getConstraintDto().expression;
            //先计算条件是不是符合,再计算表达式是不是符合
            if (filter != null) {
                let valueExp = await this.formulaParse.transToValue(filter, viewer.findTables()[0].getTableDto().tableId, row, null, this.formulaParse
                ,{});
                if (!eval(valueExp)) {
                    continue;
                }
            }
            //计算表达式
            let valueExp = await this.formulaParse.transToValue(expression, row, viewer.findTables()[0].getTableDto().tableId, null, this.formulaParse);
            if (!eval(valueExp)) {
                return cons.getConstraintDto().memo || "检查不通过";
            }
        }
    }

    /**
     * 此字段是否需要此验证器验证
     * @param component
     * @param viewer
     */
    isConcerned(component: Component, viewer: BlockViewer): boolean {
        let schema = SchemaFactory.getSchema(component.column.getColumnDto().schemaId, component.componentDto.versionCode);
        let columnConstraints = schema.getColumnConstraints(component.getColumn().getColumnDto().columnId);
        if (columnConstraints) {
            return true;
        }
        return false;
    }

    /**
     * 取得实例,验证器,可以是单例,有些多例,由验证器自己决定
     * @param component
     * @param viewer
     */
    getInstance(component: Component, viewer: BlockViewer): IValidator {
        let instance = new SingleTableConstraintValidator();
        let schema = SchemaFactory.getSchema(component.column.getColumnDto().schemaId, component.componentDto.versionCode);
        instance.lstConstraint = schema.getColumnConstraints(component.getColumn().getColumnDto().columnId);
        instance.formulaParse = FormulaParse.getInstance(true, schema);
        return instance;

    }
}
