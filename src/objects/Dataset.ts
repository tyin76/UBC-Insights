import { InsightDatasetKind } from "../controller/IInsightFacade";
import Room from "./Room";
import Section from "./Section";

class Dataset {
	private sections: Section[] | undefined;
	private rooms: Room[] | undefined;
	private kind: InsightDatasetKind;

	constructor(sectionsOrRooms: Section[] | Room[], kind: InsightDatasetKind) {
		if (kind === InsightDatasetKind.Rooms) {
			this.rooms = sectionsOrRooms as Room[];
		} else {
			this.sections = sectionsOrRooms as Section[];
		}
		this.kind = kind;
	}

	public getEntities(): Section[] | Room[] {
		if (this.kind === InsightDatasetKind.Rooms) {
			return this.rooms as Room[];
		} else {
			return this.sections as Section[];
		}
	}

	public getKind(): InsightDatasetKind {
		return this.kind;
	}

	public toJSON(): object {
		if (this.kind === InsightDatasetKind.Sections) {
			const sections = this.sections as Section[];
			return {
				kind: this.kind,
				sections: sections.map((section) => section.toJSON()), // Converts each Section to JSON
			};
		} else {
			const rooms = this.rooms as Room[];
			return {
				kind: this.kind,
				rooms: rooms.map((room) => room.toJSON()), // Converts each Room to JSON
			};
		}
	}
}

export default Dataset;
