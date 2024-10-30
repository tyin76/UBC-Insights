import { InsightResult } from "../controller/IInsightFacade";
import Section from "../objects/Section";
import { getSectionValueFromConditionKey } from "./SectionsFilterHelper";

export function parseSectionsData(sections: Section[], query: any): InsightResult[] {
	const insightResultsToReturn: InsightResult[] = [];

	// This sorts based on the parameter provided to ORDER
	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined) {
		sortSectionUsingKey(query.OPTIONS.ORDER.split("_")[1], sections);
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

function sortSectionUsingKey(conditionKey: string, sectionsToSort: Section[]): void {
	switch (conditionKey) {
		case "uuid":
			sectionsToSort.sort((x, y) => x.getUuid().localeCompare(y.getUuid()));
			break;
		case "id":
			sectionsToSort.sort((x, y) => x.getId().localeCompare(y.getId()));
			break;
		case "title":
			sectionsToSort.sort((x, y) => x.getTitle().localeCompare(y.getTitle()));
			break;
		case "instructor":
			sectionsToSort.sort((x, y) => x.getInstructor().localeCompare(y.getInstructor()));
			break;
		case "dept":
			sectionsToSort.sort((x, y) => x.getDept().localeCompare(y.getDept()));
			break;
		case "year":
			sectionsToSort.sort((x, y) => x.getYear() - y.getYear());
			break;
		case "avg":
			sectionsToSort.sort((x, y) => x.getAvg() - y.getAvg());
			break;
		case "pass":
			sectionsToSort.sort((x, y) => x.getPass() - y.getPass());
			break;
		case "fail":
			sectionsToSort.sort((x, y) => x.getFail() - y.getFail());
			break;
		case "audit":
			sectionsToSort.sort((x, y) => x.getAudit() - y.getAudit());
			break;
	}
}