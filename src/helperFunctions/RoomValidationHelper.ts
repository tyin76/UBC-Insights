export function isFieldValidRoomNumberField(field: string): boolean {
	return ["lat", "lon", "seats"].includes(field);
}

export function isFieldValidRoomStringField(param: string): boolean {
	return ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"].includes(param);
}

export function isFieldValidRoomField(param: string): boolean {
	return isFieldValidRoomNumberField(param) || isFieldValidRoomStringField(param);
}
