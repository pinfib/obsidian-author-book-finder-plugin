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
	name: string
): Promise<WikipediaPageInfo | null> {
	try {
		const searchQuery = encodeURIComponent(name);
		const url = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Ошибка HTTP: ${response.status}`);
		}

		const data: WikipediaSearchResult = await response.json();

		if (data.query.search.length === 0) {
			return null;
		}

		const pageTitle = data.query.search[0].title;
		const pageUrl = `https://ru.wikipedia.org/wiki/${encodeURIComponent(
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
		return "- Не найдена ссылка на страницу в Википедии";
	}
	return `- [${pageInfo.title}](${pageInfo.url})`;
}

export default getWikipediaPageInfo;
