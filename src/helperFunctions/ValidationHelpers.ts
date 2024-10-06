import { InsightError } from "../controller/IInsightFacade";
import { getKeysWithUnderscore } from "./QueryHandler";

const noneKeyword = "NONE";
const seperatedArrayLengths = 2;

function isValidOperator(key: string): boolean {
	return ["AND", "OR", "GT", "LT", "EQ", "IS", "NOT"].includes(key);
}

function isValidNumParam(param: string): boolean {
	return ["year", "avg", "pass", "fail", "audit"].includes(param);
}

function isValidStrParam(param: string): boolean {
	return ["uuid", "id", "title", "instructor", "dept"].includes(param);
}

function isValidParam(param: string): boolean {
	return isValidStrParam(param) || isValidNumParam(param);
}

function isValidOptionsKey(key: string): boolean {
	return ["COLUMNS", "ORDER"].includes(key);
}

function isValidQueryKey(key: string): boolean {
	return ["WHERE", "OPTIONS"].includes(key);
}

export function getAndValidateConditionKeyandValue(object: any, isStringOnlyValue: boolean): any[] {
	const operators = Object.keys(object);

	if (operators.length !== 1) {
		throw new InsightError("Object should have exactly one condition key.");
	}

	const conditionKey = operators[0];

	// Remember that the condition key is formatted like this "sections_dept", thus splitting at _, dept should be at index 1
	const condition = conditionKey.split("_")[1];

	if (!isValidParam(condition)) {
		throw new InsightError("Invalid condition Key");
	}

	const conditionValue = object[conditionKey];

	if (typeof conditionValue !== "number" && typeof conditionValue !== "string") {
		throw new InsightError("condition value is of an invalid type, not number or a string!");
	}

	if (typeof conditionValue === "number" && isStringOnlyValue) {
		throw new InsightError("condition value is of the wrong type!");
	}

	if (typeof conditionValue === "string" && !isStringOnlyValue) {
		throw new InsightError("condition value is of the wrong type!");
	}

	return [condition, conditionValue];
}

export function validateOptionsAndGetSingleDataset(options: any): string {
	// We intialize a set, remember, a set cannot hold duplicate values
	const nameSet = new Set<string>();
	let datasetName = "";

	for (const column of options.COLUMNS) {
		const columnParts = column.split("_");

		// Check if the column contains a dataset name
		if (columnParts.length !== seperatedArrayLengths) {
			throw new InsightError("Invalid column name format. Should be 'datasetName_param'.");
		}

		datasetName = columnParts[0];
		nameSet.add(datasetName);

		// Ensure that only one dataset name is allowed
		if (nameSet.size !== 1) {
			throw new InsightError("You can only use one dataset in the query");
		}
	}

	return datasetName;
}

export function validateWhereAndGetSingleDataset(where: any): string {
	// We intialize a set, remember, a set cannot hold duplicate values
	const nameSet = new Set<string>();
	let datasetName = "";

	// This for loop checks that all keys have dataset names that are referenceing the same dataset, and that all parameters are valid
	for (const key of getKeysWithUnderscore(where)) {
		const datasetNameAndParam = key.split("_");

		// Keys with underscores look like this "datasetName_param" for example "sections_dept", if we split at the underscore "_",
		// and the length of the array is not 2, then either there are too many underscores in the key, or the key does not contain both
		// the dataset name, and the parameter

		if (datasetNameAndParam.length !== seperatedArrayLengths) {
			throw new InsightError("Missing dataset name, or parameter");
		}

		datasetName = datasetNameAndParam[0];
		const parameter = datasetNameAndParam[1];

		// checks to see if parameter is valid, remember parameter is invalid if it is not one of the following "year", "avg", "pass", "fail", "audit", "uuid", "id", "title", "instructor", "dept"
		if (!isValidParam(parameter)) {
			throw new InsightError("Parameter is invalid");
		}

		// here we add the datasetName to the nameSet
		nameSet.add(datasetName);

		// If the nameSet is larger than 1, this must mean that the query has keys such as "dataset1_dept" and "dataset2_dept",
		// which is not allowed because you can only query from one dataset at a time
		if (nameSet.size !== 1) {
			throw new InsightError("You can only use one dataset in the query");
		}
	}

	return datasetName;
}

// This will take any object and return its operator and parameter in a string array
// Index 0 stores the operator, index 1 stores the operator parameter
export function getAndValidateOperatorandParameter(object: any): string[] {
	// This will get what EBNF grammar is being used (OR, AND, GT, LT, etc), the operation will be stored in keysOfWhere, there may be multiple keys in where
	const operators = Object.keys(object);

	// object can only ever have exactly one operator/key, so we must check for that and throw an error if there is not exactly one operator
	if (operators.length > 1) {
		throw new InsightError("Where should have at least one key");
	}

	// Here we are getting the key from the key array of the object which should be either "AND", "OR", "GT", "LT", "EQ", "IS", "NOT".
	let operator = operators[0];

	// Remember the only valid operators are the ones listed in the specification "AND", "OR", "GT", "LT", "EQ", "IS", "NOT",
	//if the key does not equal to one of these strings then this must mean that WHERE is an empty object and thus we have no operators
	// So we set operators to "NONE"
	if (!isValidOperator(operator) && operators.length === 0) {
		operator = noneKeyword;
	}

	let operatorParameter = "";

	// IF we do indeed have an operator, then we need the value of that operator which we can get
	if (operator !== noneKeyword) {
		operatorParameter = object[operator];
	}

	return [operator, operatorParameter];
}

export function checkAstericksPlacement(toCheck: string): void {
	if (toCheck.includes("*")) {
		const numberOfAstericks = toCheck.split("*").length - 1;

		const numberOfAstericksAllowed = 2;

		if (numberOfAstericks > numberOfAstericksAllowed) {
			throw new InsightError("Asterisks cannot be in the middle");
		}

		if (numberOfAstericks === 1 && toCheck.charAt(0) !== "*" && toCheck.charAt(toCheck.length - 1) !== "*") {
			throw new InsightError("Asterisks cannot be in the middle");
		}

		if (
			numberOfAstericks === numberOfAstericksAllowed &&
			(toCheck.charAt(0) !== "*" || toCheck.charAt(toCheck.length - 1) !== "*")
		) {
			throw new InsightError("Astericks cannot be in the middle");
		}
	}
}

function validateQuery1(query: any): void {
	if (!Array.isArray(query.OPTIONS.COLUMNS)) {
		throw new InsightError("Columns must be an array");
	}

	if (query.OPTIONS.COLUMNS.length === 0) {
		throw new InsightError("Columns array cannot be empty");
	}

	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined && typeof query.OPTIONS.ORDER !== "string") {
		throw new InsightError("ORDER key is of the wrong type");
	}

	if (
		query.OPTIONS.ORDER !== null &&
		query.OPTIONS.ORDER !== undefined &&
		!query.OPTIONS.COLUMNS.includes(query.OPTIONS.ORDER)
	) {
		throw new InsightError("ORDER key must be in COLUMNS array.");
	}

	for (const key of Object.keys(query.OPTIONS)) {
		if (!isValidOptionsKey(key)) {
			throw new InsightError("OPTIONS has as invalid key");
		}
	}

	for (const key of Object.keys(query)) {
		if (!isValidQueryKey(key)) {
			throw new InsightError(`QUERY has an invalid key ${key}`);
		}
	}
}

export function validateQuery(query: any): void {
	if (query === null || query === undefined) {
		throw new InsightError("query does not exist");
	}

	if (query.WHERE === null || query.WHERE === undefined) {
		throw new InsightError("WHERE does not exist");
	}

	if (query.OPTIONS === null || query.OPTIONS === undefined) {
		throw new InsightError("OPTIONS does not exist");
	}

	if (query.OPTIONS.COLUMNS === null || query.OPTIONS.COLUMNS === undefined) {
		throw new InsightError("COLUMNS does not exist");
	}

	if (typeof query.WHERE !== "object") {
		throw new InsightError("WHERE is of the wrong format");
	}

	if (Array.isArray(query.WHERE)) {
		throw new InsightError("WHERE should not be an array");
	}

	// Seperate because of the linter errors... this function was too long
	validateQuery1(query);
}
