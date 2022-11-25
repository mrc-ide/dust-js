import { UserType } from "./model";
import { VectorView } from "./state";

export interface FilterDataElement {
    time: number;
    data: any;
}

export interface FilterData {
    startTime: number;
    data: FilterDataElement[];
}

export function filterDataValidate(d: FilterData): void {
    d.data.forEach((el, idx) => {
        const prev = idx === 0 ? d.startTime : d.data[idx - 1].time;
        if (el.time <= prev) {
            throw Error("Expected times to be strictly increasing");
        }
    });
}

export type FilterCompare = (state: VectorView, observed: any, pars: UserType) => number;
