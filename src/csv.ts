import * as fs from "node:fs";
import * as path from "node:path";
import { stringify } from "csv";
import { htmlFilePath, parseHTML } from "./utils";

const listFilePath = path.join(__dirname, "list.json");
const listFile = fs.readFileSync(listFilePath, "utf8");
interface ListInterface {
	xpath: { [key: string]: { [key: string]: string } };
	links: string[];
}
const list = JSON.parse(listFile) as ListInterface;

async function parseAndSaveCSV(): Promise<void> {
	const records: any[] = [];

	for (const url of list.links) {
		const filePath = htmlFilePath(url);
		if (!fs.existsSync(filePath)) {
			console.error(`File not found: ${filePath}`);
			continue;
		}
		const fieldKey = Object.keys(list.xpath).find((key) => url.includes(key));
		if (!fieldKey) {
			console.error(`Fields not found for ${url}`);
			continue;
		}

		try {
			const record = await parseHTML(filePath, list.xpath[fieldKey]);
			record.URL = url;
			records.push(record);
		} catch (error: any) {
			console.error(`Error parsing ${filePath}: ${error.message || ""}`);
		}
	}

	const extractHeaders = Object.values(list.xpath).flatMap((v) =>
		Object.keys(v),
	);
	const headers = ["URL", ...new Set(extractHeaders)];
	const csvPath = path.join(__dirname, "list.csv");

	stringify(
		records,
		{
			header: true,
			columns: headers,
		},
		(err, output) => {
			if (err) {
				console.error("Error writing CSV:", err);
				return;
			}
			fs.writeFileSync(csvPath, output);
			console.log("CSV file has been saved.");
		},
	);
}

parseAndSaveCSV();
