import { InsightError, ResultTooLargeError } from "../controller/IInsightFacade";
import Dataset from "../objects/Dataset";
import Section from "../objects/Section";
import { and, entityMatchesQueryRequirements, equalTo, greaterThan, is, lessThan, maxSections, not, or } from "./QueryHandler";

export function filterSectionDataset(datasetToQuery: Dataset, operator: any, operatorParameter: any): Section[] {
    // This will store all the sections that we should return to be processed
    const sectionsToReturn: Section[] = [];

    for (const section of datasetToQuery.getEntities() as Section[]) {
        if (entityMatchesQueryRequirements(operator, operatorParameter, section, datasetToQuery.getKind())) {
            sectionsToReturn.push(section);

            if (sectionsToReturn.length > maxSections) {
                throw new ResultTooLargeError("More than 5000 sections are going to be returned!");
            }
        }
    }

    return sectionsToReturn;
}

export function getSectionValueFromConditionKey(conditionKey: string, sectionToUse: Section): string | number {
	switch (conditionKey) {
		case "uuid":
			return sectionToUse.getUuid();
		case "id":
			return sectionToUse.getId();
		case "title":
			return sectionToUse.getTitle();
		case "instructor":
			return sectionToUse.getInstructor();
		case "dept":
			return sectionToUse.getDept();
		case "year":
			return sectionToUse.getYear();
		case "avg":
			return sectionToUse.getAvg();
		case "pass":
			return sectionToUse.getPass();
		case "fail":
			return sectionToUse.getFail();
		case "audit":
			return sectionToUse.getAudit();
		default:
			throw new InsightError(`Unknown condition key: ${conditionKey}`);
	}
}