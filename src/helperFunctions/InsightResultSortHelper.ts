import { InsightResult } from "../controller/IInsightFacade";

export function recursiveInsightResultCompare(fieldsToSortBy: string[], x: InsightResult, y: InsightResult): number {
	if (fieldsToSortBy.length === 0) {
		return 0;
	}

	const errorCode = -3333;
    
    let xVal: string | number = errorCode;
    let yVal: string | number = errorCode;

	xVal = x[fieldsToSortBy[0]];
	yVal = y[fieldsToSortBy[0]];

	if (xVal > yVal) {
		return 1;
	} else if (xVal < yVal) {
		return -1;
	}

	return recursiveInsightResultCompare(fieldsToSortBy.slice(1), x, y);
}
