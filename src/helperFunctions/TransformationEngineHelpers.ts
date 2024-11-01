import Decimal from "decimal.js";
import { InsightResult } from "../controller/IInsightFacade";

export function avgForGroupHelper(
	insightResults: InsightResult[],
	fieldsToGroupBy: string[],
	transformationInsightResults: Record<string, InsightResult>,
	avgMap: Record<string, Record<string, Decimal | number>>,
	totalKeyword: string,
	rowsKeyword: string,
	fieldToAvg: string
): void {
	for (const result of insightResults) {
		let currGroupId = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		}

		if (avgMap[currGroupId] !== undefined) {
			avgMap[currGroupId][totalKeyword] = (avgMap[currGroupId][totalKeyword] as Decimal).add(
				new Decimal(result[fieldToAvg])
			);
			avgMap[currGroupId][rowsKeyword] = (avgMap[currGroupId][rowsKeyword] as number) + 1;
		} else if (avgMap[currGroupId] === undefined) {
			avgMap[currGroupId] = {};
			avgMap[currGroupId][rowsKeyword] = 1;
			avgMap[currGroupId][totalKeyword] = new Decimal(result[fieldToAvg]);
		}
	}
}
