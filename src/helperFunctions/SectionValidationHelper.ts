function isFieldValidSectionNumberField(field: string): boolean {
	return ["year", "avg", "pass", "fail", "audit"].includes(field);
}

function isFieldValidSectionStringField(param: string): boolean {
	return ["uuid", "id", "title", "instructor", "dept"].includes(param);
}

export function isFieldValidSectionField(param: string): boolean {
	return isFieldValidSectionNumberField(param) || isFieldValidSectionStringField(param);
}