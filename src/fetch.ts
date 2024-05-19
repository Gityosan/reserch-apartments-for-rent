import * as fs from "node:fs";
import * as path from "node:path";
import { delay, fetchHTML, htmlFilePath, saveHTML } from "./utils";

const listFilePath = path.join(__dirname, "list.json");
const listFile = fs.readFileSync(listFilePath, "utf8");
interface ListInterface {
	xpath: { [key: string]: { [key: string]: string } };
	links: string[];
}
const list = JSON.parse(listFile) as ListInterface;

const args = process.argv.slice(2);
const forceFetchFlag = args.includes("--force") || args.includes("-f");
const helpFlag = args.includes("--help") || args.includes("-h");

// 引数からURLを抽出
const urlArg = args.find((arg) => arg.startsWith("http"));

function printHelp() {
	console.log(`
Usage: npm run fetch [options] [url]

Options:
  --force           Force fetch the URL(s) even if the HTML file already exists
  -h                Show help message

Arguments:
  url               URL to fetch. If not specified, URLs from list.json are used
  `);
}

async function fetchAndSaveHTML(url: string, force = false): Promise<void> {
	const filePath = htmlFilePath(url);
	if (fs.existsSync(filePath) && !force) {
		console.log(`Skipping: ${filePath} already exists.`);
		return;
	}

	try {
		const html = await fetchHTML(url);
		await saveHTML(url, html);
		await delay(2000); // 2秒スリープ
	} catch (error: any) {
		console.error(`Error fetching ${url}: ${error.message || ""}`);
	}
}

async function fetchWebsites(): Promise<void> {
	if (helpFlag) {
		printHelp();
		return;
	}

	if (urlArg) {
		// 単一URLが指定された場合、そのURLのみを処理
		await fetchAndSaveHTML(urlArg, forceFetchFlag);
	} else {
		// list.json内の全URLを処理
		for (const url of list.links) {
			await fetchAndSaveHTML(url, forceFetchFlag);
		}
	}
}

fetchWebsites();
