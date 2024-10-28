import { InsightError } from "../controller/IInsightFacade";

export function validateQuery(query: any): void {
	validateQueryExistence(query);
	validateWhereClause(query.WHERE);
	validateOptions(query.OPTIONS);
	validateOptionsColumns(query.OPTIONS.COLUMNS);
	validateOrderInOptions(query.OPTIONS);
	validateKeysInOptions(query.OPTIONS);
	validateKeysInQuery(query);
}

function isValidOptionsKey(key: string): boolean {
	return ["COLUMNS", "ORDER"].includes(key);
}

function isValidQueryKey(key: string): boolean {
	return ["WHERE", "OPTIONS"].includes(key);
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

function validateOrderInOptions(options: any): void {
	if (options.ORDER !== null && options.ORDER !== undefined) {
		if (typeof options.ORDER !== "string") {
			throw new InsightError("ORDER key is of the wrong type");
		}

		if (!options.COLUMNS.includes(options.ORDER)) {
			throw new InsightError("ORDER key must be in COLUMNS array.");
		}
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
