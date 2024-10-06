import { InsightError, InsightResult, ResultTooLargeError } from "../controller/IInsightFacade";
import { getDatasetFromId } from "../objects/FileManagement";
import Section from "../objects/Section";
import {
	checkAstericksPlacement,
	getAndValidateConditionKeyandValue,
	getAndValidateOperatorandParameter,
	validateOptionsAndGetSingleDataset,
	validateQuery,
	validateWhereAndGetSingleDataset,
} from "./ValidationHelpers";

const maxSections = 5000;

function sectionMatchesQueryRequirements(
	operator: string,
	operatorParameter: string,
	sectionToCheck: Section
): boolean {
	switch (operator) {
		case "AND":
			return and(sectionToCheck, operatorParameter);
		case "OR":
			return or(sectionToCheck, operatorParameter);
		case "GT":
			return greaterThan(sectionToCheck, operatorParameter);
		case "LT":
			return lessThan(sectionToCheck, operatorParameter);
		case "EQ":
			return equalTo(sectionToCheck, operatorParameter);
		case "IS":
			return is(sectionToCheck, operatorParameter);
		case "NOT":
			return not(sectionToCheck, operatorParameter);
		default:
			return true;
	}
}

// If you pass in an object which represents an operator, it will return the condition key and value in an array
// if isStringOnlyValue is true then we check to make sure that condition value is a String and not a number vice versa
// Index 0 stores the key, index 1 stores the value
// For example if you pass in
//                        "IS": {
//							"sections_dept": "apsc"
//  						}
// It should return ["dept", "apsc"]

function getSectionValueFromConditionKey(conditionKey: string, sectionToUse: Section): string | number {
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

// operatorParameter is in the format "datasetName_value"
function greaterThan(section: Section, operatorParameter: any): boolean {
	const conditionKeyAndValue: any[] = getAndValidateConditionKeyandValue(operatorParameter, false);

	const conditionKey = conditionKeyAndValue[0];
	const conditionValue = conditionKeyAndValue[1];

	const sectionValue = getSectionValueFromConditionKey(conditionKey, section);

	if (typeof sectionValue === "string") {
		throw new InsightError("Wrong type for section value");
	}

	return sectionValue > conditionValue;
}

// operatorParameter is in the format "datasetName_value"
function lessThan(section: Section, operatorParameter: any): boolean {
	const conditionKeyAndValue: any[] = getAndValidateConditionKeyandValue(operatorParameter, false);

	const conditionKey = conditionKeyAndValue[0];
	const conditionValue = conditionKeyAndValue[1];

	const sectionValue = getSectionValueFromConditionKey(conditionKey, section);

	if (typeof sectionValue === "string") {
		throw new InsightError("Wrong type for section value");
	}

	return sectionValue < conditionValue;
}

function equalTo(section: Section, operatorParameter: any): boolean {
	const conditionKeyAndValue: any[] = getAndValidateConditionKeyandValue(operatorParameter, false);

	const conditionKey = conditionKeyAndValue[0];
	const conditionValue = conditionKeyAndValue[1];

	const sectionValue = getSectionValueFromConditionKey(conditionKey, section);

	if (typeof sectionValue === "string") {
		throw new InsightError("Wrong type for section value");
	}

	return sectionValue === conditionValue;
}

// this is what is going to handle wildcards
function is(section: Section, operatorParameter: any): boolean {
	// Index 0 will have the conditionKey, index 1 will have the index Value
	const conditionKeyAndValue: any[] = getAndValidateConditionKeyandValue(operatorParameter, true);

	// Stores the conditionKey ie: id, uuid, avg, etc
	const conditionKey = conditionKeyAndValue[0];

	// Store the value we should compare the section.conditionKey to,
	// So if the conditionKey is prof, and the conditionValue is "John" then we check does section.prof === "John"
	const conditionValue: string = conditionKeyAndValue[1];

	checkAstericksPlacement(conditionValue);

	const sectionValue = getSectionValueFromConditionKey(conditionKey, section);

	if (typeof sectionValue === "number") {
		throw new InsightError("Wrong type for section value");
	}

	if (conditionValue.charAt(0) === "*" && conditionValue.charAt(conditionValue.length - 1) === "*") {
		//  inputstring:  Matches inputstring exactly
		return sectionValue.includes(conditionValue.replaceAll("*", ""));
	} else if (conditionValue.charAt(0) === "*") {
		// *inputstring:  Ends with inputstring
		return sectionValue.endsWith(conditionValue.replaceAll("*", ""));
	} else if (conditionValue.charAt(conditionValue.length - 1) === "*") {
		//  inputstring*: Starts with inputstring
		return sectionValue.startsWith(conditionValue.replaceAll("*", ""));
	} else {
		//  inputstring:  Matches inputstring exactly
		return sectionValue === conditionValue;
	}
}

function not(section: Section, operatorParameter: any): boolean {
	const operatorAndParam: any[] = getAndValidateOperatorandParameter(operatorParameter);

	const operator = operatorAndParam[0];
	const operatorParam = operatorAndParam[1];

	return !sectionMatchesQueryRequirements(operator, operatorParam, section);
}

function and(section: Section, operatorParameter: any): boolean {
	// remember that AND takes in an array of operations and ANDs their results together, thus
	// operatorParameter should already be an array!

	if (operatorParameter.length === 0) {
		throw new InsightError("AND array should not be empty.");
	}

	for (const operation of operatorParameter) {
		const operatorAndParam: string[] = getAndValidateOperatorandParameter(operation);

		const operator = operatorAndParam[0];
		const operatorParam = operatorAndParam[1];

		// If it does not matach all of the operation requirments, then return false (because its an AND)
		if (!sectionMatchesQueryRequirements(operator, operatorParam, section)) {
			return false;
		}
	}

	return true;
}

function or(section: Section, operatorParameter: string): boolean {
	// remember that OR takes in an array of operations and ORs their results together, thus
	// operatorParameter should already be an array!

	if (operatorParameter.length === 0) {
		throw new InsightError("OR array should not be empty.");
	}

	for (const operation of operatorParameter) {
		const operatorAndParam: string[] = getAndValidateOperatorandParameter(operation);

		const operator = operatorAndParam[0];
		const operatorParam = operatorAndParam[1];

		// If matches at least of the operation requirements then return true (because its an OR)
		if (sectionMatchesQueryRequirements(operator, operatorParam, section)) {
			return true;
		}
	}

	return false;
}

// this function was generated with ChatGPT to help me get all keys that contain underscores in the query object
// Remember that in the query, all keys that have an underscore a parameters for the dataset
export function getKeysWithUnderscore(obj: Record<string, any>, result: string[] = []): string[] {
	for (const key in obj) {
		// Used chatgpt here to fix if statement linter error
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			// Check if the key contains an underscore
			if (key.includes("_")) {
				result.push(key);
			}
			// If the value is an object, recurse into it
			if (typeof obj[key] === "object" && obj[key] !== null) {
				getKeysWithUnderscore(obj[key], result);
			}
		}
	}
	return result;
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

export async function getAllValidSections(query: any): Promise<Section[]> {
	validateQuery(query);

	const { WHERE } = query as any;

	// This will get the operator and operater parameter and store it in an array, where index 0 is the operator, and index 1 is the parameter
	const operatorAndParam: any[] = getAndValidateOperatorandParameter(WHERE);

	const operator = operatorAndParam[0];
	const operatorParameter = operatorAndParam[1];

	// This looks at the entire query and gets the id/name of the dataset that we need to access, this also validates the WHERE object
	// To ensure that it is formatted correctly
	const datasetNameToQueryFromWhere = validateWhereAndGetSingleDataset(WHERE);

	// This looks at the entire query and gets the id/name of the dataset that we need to access, this also validates the OPTIONS object
	// To ensure that it is formatted correctly
	const datasetNameToQueryFromOptions = validateOptionsAndGetSingleDataset(query.OPTIONS);

	const datasetName = datasetNameToQueryFromOptions;

	// This means that WHERE is an empty object ie: {} and does not have the datasetName within it, so we must now find it in the columns portion
	if (datasetNameToQueryFromWhere !== "" && datasetNameToQueryFromWhere !== datasetNameToQueryFromOptions) {
		throw new InsightError("WHERE and COLOUMNS does not reference the same dataset");
	}

	// Gets the dataset to query
	const datasetToQuery = await getDatasetFromId(datasetName);

	// This will store all the sections that we should return to be processed
	const sectionsToReturn: Section[] = [];

	for (const section of datasetToQuery.getSections()) {
		if (sectionMatchesQueryRequirements(operator, operatorParameter, section)) {
			sectionsToReturn.push(section);

			if (sectionsToReturn.length > maxSections) {
				throw new ResultTooLargeError("More than 5000 sections are going to be returned!");
			}
		}
	}

	return sectionsToReturn;
}
