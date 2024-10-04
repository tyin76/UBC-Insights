import Section from "./Section";

class Dataset {
	private sections: Section[];

	constructor(sections: Section[]) {
		this.sections = sections;
	}

	public getSections(): Section[] {
		return this.sections;
	}

	public toJSON(): object {
		return {
			sections: this.sections.map((section) => section.toJSON()), // Converts each Section to JSON
		};
	}
}

export default Dataset;
