import {NetRequest} from "../../common/NetRequest";
import {ColumnDto} from "../../datamodel/dto/ColumnDto";
import {BeanFactory} from "../../decorator/decorator";
import {Schema} from "../../datamodel/DmRuntime/Schema";
import {CommonUtils} from "../../common/CommonUtils";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {GlobalParams} from "../../common/GlobalParams";
import {HandleResult} from "../../common/HandleResult";


export class DmDesignService {
    static URL_ROOT = "/dm";
    static COL_ID_SER = -1;
    static TABLE_ID_SER = -1;

    /**
     * 查询一表的字段信息,用于新增表
     * @param tableName
     * @param schemaId
     * @param version
     * @param tableId
     * @param callback
     */
    static findTableFieldAsColumnDto(tableName, schemaId, version, tableId, callback: (result: Array<ColumnDto>) => void) {
        NetRequest.axios.get(DmDesignService.URL_ROOT + "/findTableFieldAsColumnDto/"
            + tableName).then((response) => {

            if (!response.data) {
                callback([]);
            }
            let lstDto = new Array<ColumnDto>();
            for (let item of response.data) {
                let dto = BeanFactory.populateBean(ColumnDto, item);
                dto.schemaId = schemaId;
                dto.versionCode = version;
                dto.columnId = DmDesignService.genColId();
                dto.tableId = tableId;
                lstDto.push(dto);
            }
            callback(lstDto);
        });
    }

    static saveSchema(schema: Schema, callback?: (data: HandleResult) => void) {
        NetRequest.axios.post(DmDesignService.URL_ROOT + "/saveSchema", schema)
            .then((result) => {
                if (callback) {
                    callback(result.data);
                }
                //刷新本地缓存
                SchemaFactory.initOneSchema(schema.getSchemaDto().schemaId, GlobalParams.getLoginVersion());
            });
    }

    static refreshServerCache(schemaId, version, callback?: (data: string) => void) {
        NetRequest.axios.get(DmDesignService.URL_ROOT + "/refreshCache/" + schemaId + "/" + version)
            .then((result) => {
                if (callback) {
                    callback(result.data);
                }
            });
    }

    /**
     * 生成一个Table id
     */
    static genTableId() {
        return DmDesignService.TABLE_ID_SER--;
    }

    /**
     * 生成列ID
     */
    static genColId() {
        return DmDesignService.COL_ID_SER--;
    }

    /**
     * 增加方案
     * @param schemaName
     * @param callback
     */
    static addSchema(schemaName, callback: (data) => void) {
        CommonUtils.handleResponse(
            NetRequest.axios.post(DmDesignService.URL_ROOT + "/addSchema", {"schemaName": schemaName}),
            callback
        )
    }

    /**
     * 删除方案
     * @param schemaId
     * @param callback
     */
    static deleteSchema(schemaId, callback: (data) => void) {
        CommonUtils.handleResponse(
            NetRequest.axios.delete(DmDesignService.URL_ROOT + "/deleteSchema/" + schemaId),
            callback
        )
    }

    /**
     * 同步信息,需要手动保存
     * @param tableId
     * @param callback
     */
    static getSyncTableCols(tableId, callback: (data) => void) {
        CommonUtils.handleResponse(
            NetRequest.axios.get(DmDesignService.URL_ROOT + "/getSyncTableCols/" + tableId),
            callback
        )
    }

    static findReferenceInfo(callback: (data) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get(this.URL_ROOT + "/findReferenceInfo"), callback);
    }

    static saveReference(lstDto, callback: (data) => void) {
        CommonUtils.handleResponse(NetRequest.axios.post(this.URL_ROOT + "/saveReference", lstDto), callback);
    }

}
