interface WikipediaSearchResult {
	query: {
		search: {
			title: string;
			pageid: number;
		}[];
	};
}

interface WikipediaPageInfo {
	title: string;
	url: string;
}

export async function getWikipediaPageInfo(
	lang: "en" | "ru",
	name: string
): Promise<WikipediaPageInfo | null> {
	console.info("-> Запрос к Wikipedia, строка поиска: ", name);

	try {
		const searchQuery = encodeURIComponent(name);
		const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Ошибка HTTP: ${response.status}`);
		}

		const data: WikipediaSearchResult = await response.json();

		if (!data.query.search.length) {
			return null;
		}

		const pageTitle = data.query.search[0].title;
		const pageUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(
			pageTitle
		)}`;

		return {
			title: pageTitle,
			url: pageUrl,
		};
	} catch (error) {
		console.error("Ошибка при поиске в Википедии:", error);
		return null;
	}
}

export function formatWikipediaMarkdownLink(
	pageInfo: WikipediaPageInfo | null
): string {
	if (!pageInfo) {
		return "- Не найдена страница в Википедии";
	}
	return `- [Википедия: ${pageInfo.title}](${pageInfo.url})`;
}

export default getWikipediaPageInfo;
