import {BaseDto} from "../../../../datamodel/dto/BaseDto";

export class StepMain extends BaseDto {
    stepId: number;
    stepName: string;
    lvlCode: string;
    stepCode: string;
    params: string;
    dispType: number;
    extClass: string;
    hasFullstep: number;
    schemaId: number;
}
