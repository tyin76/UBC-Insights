import { InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError } from "../controller/IInsightFacade";
import Dataset from "../objects/Dataset";
import Room from "../objects/Room";
import Section from "../objects/Section";
import { validateAndExtractEntityFieldAndComparisonValue } from "./EntityValidationHelpers";
import { extractAndValidateLogicalOperatorAndParameter } from "./LogicalOperatorExtractionAndValidation";
import { validateQuery } from "./QueryValidation";
import { filterRoomDataset, getRoomValueFromConditionKey } from "./RoomsFilterHelper";
import { filterSectionDataset, getSectionValueFromConditionKey } from "./SectionsFilterHelper";
import { getDatasetAndValidateQuery } from "./WhereDatasetExtractorAndRefsValidation";
import { checkAstericksPlacement } from "./WildcardValidation";

export const maxSections = 5000;

function getEntityValueFromConditionKey(conditionKey: string, enitityToUse: Room | Section): string | number {
	if (enitityToUse instanceof Room) {
		return getRoomValueFromConditionKey(conditionKey, enitityToUse);
	}
	return getSectionValueFromConditionKey(conditionKey, enitityToUse);
}

// operatorParameter is in the format "datasetName_value"
export function greaterThan(entity: Section | Room, operatorParameter: any, kind: InsightDatasetKind): boolean {
	const conditionKeyAndValue: any[] = validateAndExtractEntityFieldAndComparisonValue(operatorParameter, false, kind);

	const conditionKey = conditionKeyAndValue[0];
	const conditionValue = conditionKeyAndValue[1];

	const sectionValue = getEntityValueFromConditionKey(conditionKey, entity);

	if (typeof sectionValue === "string") {
		throw new InsightError("Wrong type for section value");
	}

	return sectionValue > conditionValue;
}

// operatorParameter is in the format "datasetName_value"
export function lessThan(entity: Section | Room, operatorParameter: any, kind: InsightDatasetKind): boolean {
	const conditionKeyAndValue: any[] = validateAndExtractEntityFieldAndComparisonValue(operatorParameter, false, kind);

	const conditionKey = conditionKeyAndValue[0];
	const conditionValue = conditionKeyAndValue[1];

	const sectionValue = getEntityValueFromConditionKey(conditionKey, entity);

	if (typeof sectionValue === "string") {
		throw new InsightError("Wrong type for section value");
	}

	return sectionValue < conditionValue;
}

export function equalTo(entity: Section | Room, operatorParameter: any, kind: InsightDatasetKind): boolean {
	const conditionKeyAndValue: any[] = validateAndExtractEntityFieldAndComparisonValue(operatorParameter, false, kind);

	const conditionKey = conditionKeyAndValue[0];
	const conditionValue = conditionKeyAndValue[1];

	const sectionValue = getEntityValueFromConditionKey(conditionKey, entity);

	if (typeof sectionValue === "string") {
		throw new InsightError("Wrong type for section value");
	}

	return sectionValue === conditionValue;
}

// this is what is going to handle wildcards
export function is(entity: Section | Room, operatorParameter: any, kind: InsightDatasetKind): boolean {
	// Index 0 will have the conditionKey, index 1 will have the index Value
	const conditionKeyAndValue: any[] = validateAndExtractEntityFieldAndComparisonValue(operatorParameter, true, kind);

	// Stores the conditionKey ie: id, uuid, avg, etc
	const conditionKey = conditionKeyAndValue[0];

	// Store the value we should compare the section.conditionKey to,
	// So if the conditionKey is prof, and the conditionValue is "John" then we check does section.prof === "John"
	const conditionValue: string = conditionKeyAndValue[1];

	checkAstericksPlacement(conditionValue);

	const sectionValue = getEntityValueFromConditionKey(conditionKey, entity);

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

export function not(entity: Section | Room, operatorParameter: any, kind: InsightDatasetKind): boolean {
	const operatorAndParam: any[] = extractAndValidateLogicalOperatorAndParameter(operatorParameter);

	const operator = operatorAndParam[0];
	const operatorParam = operatorAndParam[1];

	return !entityMatchesQueryRequirements(operator, operatorParam, entity, kind);
}

export function and(entity: Section | Room, operatorParameter: any, kind: InsightDatasetKind): boolean {
	// remember that AND takes in an array of operations and ANDs their results together, thus
	// operatorParameter should already be an array!

	if (operatorParameter.length === 0) {
		throw new InsightError("AND array should not be empty.");
	}

	for (const operation of operatorParameter) {
		const operatorAndParam: string[] = extractAndValidateLogicalOperatorAndParameter(operation);

		const operator = operatorAndParam[0];
		const operatorParam = operatorAndParam[1];

		// If it does not matach all of the operation requirments, then return false (because its an AND)
		if (!entityMatchesQueryRequirements(operator, operatorParam, entity, kind)) {
			return false;
		}
	}

	return true;
}

export function or(entity: Section | Room, operatorParameter: string, kind: InsightDatasetKind): boolean {
	// remember that OR takes in an array of operations and ORs their results together, thus
	// operatorParameter should already be an array!

	if (operatorParameter.length === 0) {
		throw new InsightError("OR array should not be empty.");
	}

	for (const operation of operatorParameter) {
		const operatorAndParam: string[] = extractAndValidateLogicalOperatorAndParameter(operation);

		const operator = operatorAndParam[0];
		const operatorParam = operatorAndParam[1];

		// If matches at least of the operation requirements then return true (because its an OR)
		if (entityMatchesQueryRequirements(operator, operatorParam, entity, kind)) {
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

export async function getAllValidEntities(query: any): Promise<Section[] | Room[]> {
	validateQuery(query);

	const { WHERE } = query as any;

	// This will get the operator and operater parameter and store it in an array, where index 0 is the operator, and index 1 is the parameter
	const operatorAndParam: any[] = extractAndValidateLogicalOperatorAndParameter(WHERE);

	const operator = operatorAndParam[0];
	const operatorParameter = operatorAndParam[1];

	// Gets the dataset to query
	const datasetToQuery = await getDatasetAndValidateQuery(query);

	console.log(datasetToQuery.getKind());
	if (datasetToQuery.getKind() === InsightDatasetKind.Sections) {
		return filterSectionDataset(datasetToQuery, operator, operatorParameter);
	}

	return filterRoomDataset(datasetToQuery, operator, operatorParameter);
}

// If you pass in an object which represents an operator, it will return the condition key and value in an array
// if isStringOnlyValue is true then we check to make sure that condition value is a String and not a number vice versa
// Index 0 stores the key, index 1 stores the value
// For example if you pass in
//                        "IS": {
//							"sections_dept": "apsc"
//  						}
// It should return ["dept", "apsc"]
export function entityMatchesQueryRequirements(
	operator: string,
	operatorParameter: string,
	entityToCheck: Section | Room,
	kind: InsightDatasetKind
): boolean {
	switch (operator) {
		case "AND":
			return and(entityToCheck, operatorParameter, kind);
		case "OR":
			return or(entityToCheck, operatorParameter, kind);
		case "GT":
			return greaterThan(entityToCheck, operatorParameter, kind);
		case "LT":
			return lessThan(entityToCheck, operatorParameter, kind);
		case "EQ":
			return equalTo(entityToCheck, operatorParameter, kind);
		case "IS":
			return is(entityToCheck, operatorParameter, kind);
		case "NOT":
			return not(entityToCheck, operatorParameter, kind);
		default:
			return true;
	}
}
