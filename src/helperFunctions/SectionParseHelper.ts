import { InsightError, InsightResult } from "../controller/IInsightFacade";
import Section from "../objects/Section";
import { getSectionValueFromConditionKey } from "./SectionsFilterHelper";
import { recursiveStringNumCompare } from "./SortHelper";

export function parseSectionsData(sections: Section[], query: any): InsightResult[] {
	const insightResultsToReturn: InsightResult[] = [];

	// This sorts based on the parameter provided to ORDER
	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined) {
		if (typeof query.OPTIONS.ORDER === "string") {
			sortSectionUsingKey([query.OPTIONS.ORDER.split("_")[1]], sections);
		} else {
			sortSectionUsingKey(
				query.OPTIONS.ORDER.keys.map((key: string) => key.split("_")[1]),
				sections,
				query.OPTIONS.ORDER.dir
			);
		}
	}

	for (const section of sections) {
		const insightResult: InsightResult = {};

		for (const key of query.OPTIONS.COLUMNS) {
			const datasetAndVariable: string[] = key.split("_");
			const variable = datasetAndVariable[1];

			insightResult[key] = getSectionValueFromConditionKey(variable, section);
		}

		insightResultsToReturn.push(insightResult);
	}

	return insightResultsToReturn;
}

function sortSectionUsingKey(conditionKeys: string[], sectionsToSort: Section[], direction = "UP"): void {
	sectionsToSort.sort((x, y) => recursiveStringNumCompare(conditionKeys, x, y));

	if (direction === "DOWN") {
		sectionsToSort.reverse();
	} else if (direction !== "UP") {
		throw new InsightError("Invalid dir key");
	}
}
