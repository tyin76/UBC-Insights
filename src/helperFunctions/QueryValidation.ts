import { InsightError } from "../controller/IInsightFacade";
import { doesQueryContainTransformations } from "./TransformationsValidationHelper";

export function validateQuery(query: any): void {
	validateQueryExistence(query);
	validateWhereClause(query.WHERE);
	validateOptions(query.OPTIONS);
	validateOptionsColumns(query.OPTIONS.COLUMNS);
	validateOrderInOptions(query.OPTIONS);
	validateKeysInOptions(query.OPTIONS);
	validateKeysInQuery(query);
	if (doesQueryContainTransformations(query)) {
		validateKeysInTransformations(query.TRANSFORMATIONS);
		validateApplyInTransformations(query);
		validateGroupInTransformations(query);
	}
}

function validateGroupInTransformations(query: any): void {
	if (!query.TRANSFORMATIONS.GROUP) {
		throw new InsightError("TRANSFORMATIONS missing GROUP");
	}
	for (const field of query.TRANSFORMATIONS.GROUP) {
		const numUnderscores = field.split("_").length - 1;

		if (numUnderscores > 1) {
			throw new InsightError("Cannot have more than one underscore in Transformation group");
		}
	}
}

function validateApplyInTransformations(query: any): void {
	if (!query.TRANSFORMATIONS.APPLY) {
		throw new InsightError("TRANSFORMATIONS missing APPLY");
	}
}

function validateKeysInTransformations(transformations: any): void {
	for (const key of Object.keys(transformations)) {
		if (!isValidTransformationsKey(key)) {
			throw new InsightError("TRANSFORMATIONS has an invalid key");
		}
	}
}

function isValidTransformationsKey(key: string): boolean {
	return ["GROUP", "APPLY"].includes(key);
}

function isValidOptionsKey(key: string): boolean {
	return ["COLUMNS", "ORDER"].includes(key);
}

function isValidQueryKey(key: string): boolean {
	return ["WHERE", "OPTIONS", "TRANSFORMATIONS"].includes(key);
}

function validateQueryExistence(query: any): void {
	if (query === null || query === undefined) {
		throw new InsightError("query does not exist");
	}
}

function validateWhereClause(where: any): void {
	if (where === null || where === undefined) {
		throw new InsightError("WHERE does not exist");
	}

	if (typeof where !== "object") {
		throw new InsightError("WHERE is of the wrong format");
	}

	if (Array.isArray(where)) {
		throw new InsightError("WHERE should not be an array");
	}
}

function validateOptions(options: any): void {
	if (options === null || options === undefined) {
		throw new InsightError("OPTIONS does not exist");
	}
}

function validateOptionsColumns(columns: any): void {
	if (columns === null || columns === undefined) {
		throw new InsightError("COLUMNS does not exist");
	}

	if (!Array.isArray(columns)) {
		throw new InsightError("Columns must be an array");
	}

	if (columns.length === 0) {
		throw new InsightError("Columns array cannot be empty");
	}
}

function isDirValid(dir: any): boolean {
	return ["UP", "DOWN"].includes(dir);
}

function isOrderKeyInColumns(keys: any, options: any): boolean {
	for (const key of keys) {
		if (!options.COLUMNS.includes(key)) {
			return false;
		}
	}
	return true;
}

function validateOrderInOptions(options: any): void {
	if (options.ORDER !== null && options.ORDER !== undefined) {
		if (typeof options.ORDER === "string" && isOrderKeyInColumns([options.ORDER], options)) {
			return;
		}

		if (
			isDirValid(options.ORDER.dir) &&
			isOrderKeyInColumns(options.ORDER.keys, options) &&
			options.ORDER.keys.length > 0
		) {
			return;
		}

		throw new InsightError("ORDER section is of an invalid format");
	}
}

function validateKeysInOptions(options: any): void {
	for (const key of Object.keys(options)) {
		if (!isValidOptionsKey(key)) {
			throw new InsightError("OPTIONS has an invalid key");
		}
	}
}

function validateKeysInQuery(query: any): void {
	for (const key of Object.keys(query)) {
		if (!isValidQueryKey(key)) {
			throw new InsightError(`QUERY has an invalid key ${key}`);
		}
	}
}
