import { App, Editor, MarkdownView, Menu, Plugin } from "obsidian";
import {
	getWikidataPersonInfo,
	formatWikiDataResult,
} from "./src/wikidata-api";
import {
	getOpenLibraryPersonInfo,
	formatOpenLibraryResult,
} from "./src/openlibrary-api";
import {
	getOrcidPersonalInfo,
	formatOrcidPersonalInfo,
} from "./src/orcid-anon-api";
import {
	getWikipediaPageInfo,
	formatWikipediaMarkdownLink,
} from "./src/wikipedia-page-search";
import {
	getSemanticScholarAuthorInfo,
	formatSemanticScholarAuthorInfo,
} from "./src/semantic-scholar-api";

interface TextInsertPluginSettings {
	defaultText: string;
}

const DEFAULT_SETTINGS: TextInsertPluginSettings = {
	defaultText: "## Вставленный текст\nВот ваш добавленный контент!",
};

export default class TextInsertPlugin extends Plugin {
	settings: TextInsertPluginSettings;

	async onload() {
		await this.loadSettings();

		// Добавляем команду в контекстное меню
		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				(menu: Menu, editor: Editor) => {
					this.addToContextMenu(menu, editor);
				}
			)
		);
	}

	// Добавляем пункт в контекстное меню
	private addToContextMenu(menu: Menu, editor: Editor) {
		menu.addItem((item) => {
			item.setTitle("Поиск авторов книг в АПИ")
				.setIcon("search")
				.onClick(() => {
					this.insertCustomText(editor);
				});
		});
	}

	// Функция для вставки текста
	private async insertCustomText(editor: Editor) {
		const selection = editor.getSelection().trim();

		let wikiData = await getWikidataPersonInfo(selection);

		let wikipediaLinkRuOrSelect = "";
		let wikipediaLinkEn = "";

		if (wikiData?.russianName || selection) {
			wikipediaLinkRuOrSelect = formatWikipediaMarkdownLink(
				await getWikipediaPageInfo(
					"ru",
					wikiData?.russianName || selection
				)
			);
		}

		if (wikiData?.englishName || selection) {
			wikipediaLinkEn = formatWikipediaMarkdownLink(
				await getWikipediaPageInfo(
					"en",
					wikiData?.englishName || selection
				)
			);
		}

		let wikiDataString = formatWikiDataResult(wikiData);

		let openLibraryString = formatOpenLibraryResult(
			await getOpenLibraryPersonInfo(
				wikiData?.englishName || wikiData?.russianName || ""
			)
		);

		let orcidString = "";

		if (wikiData?.orcid) {
			orcidString = formatOrcidPersonalInfo({
				profileId: wikiData?.orcid,
				familyName:
					wikiData?.englishName || wikiData?.russianName || "",
				givenName: "",
				source: "Wikidata",
			});
		} else {
			orcidString = formatOrcidPersonalInfo(
				await getOrcidPersonalInfo(
					wikiData?.englishName || wikiData?.russianName || ""
				)
			);
		}
		// let semanticScholarString = formatSemanticScholarAuthorInfo(
		// 	await getSemanticScholarAuthorInfo(
		// 		wikiData?.englishName || selection || wikiData?.russianName
		// 	)
		// );

		// Заменяем выделенный текст на наш кастомный текст
		editor.replaceSelection(
			`${wikipediaLinkEn || ""}\n${
				wikipediaLinkRuOrSelect || ""
			}\n${wikiDataString}\n${openLibraryString}\n${orcidString}\n`
		);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
