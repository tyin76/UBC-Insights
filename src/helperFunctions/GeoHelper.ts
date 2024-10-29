const http = require("http");

export async function geoLocationRequest(address: string): Promise<{ lat: number; lon: number }> {
	const encodedAddress = encodeURIComponent(address);
	//console.log(encodedAddress);

	const options = {
		hostname: "cs310.students.cs.ubc.ca",
		port: 11316,
		path: `/api/v1/project_team209/${encodedAddress}`,
		method: "GET",
	};

	return new Promise((resolve, reject) => {
		const req = http.request(options, (res: any) => {
			let data = "";

			// A chunk of data has been received.
			res.on("data", (chunk: any) => {
				data += chunk;
			});

			// The whole response has been received.
			res.on("end", () => {
				try {
					const response = JSON.parse(data);
					const { lat, lon } = response;
					resolve({ lat, lon });
				} catch (error) {
					reject(error);
				}
			});
		});

		req.on("error", (error: any) => {
			reject(error);
		});

		// End the request
		req.end();
	});
}
