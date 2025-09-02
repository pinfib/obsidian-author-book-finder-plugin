interface WikidataEducation {
	russian: string;
	english: string;
}

interface WikidataOccupation {
	russian: string;
	english: string;
}

interface WikidataFieldOfWork {
	russian: string;
	english: string;
}

interface WikidataResult {
	russianName?: string;
	englishName?: string;
	educations: WikidataEducation[];
	specialties: WikidataEducation[];
	occupations: WikidataOccupation[];
	fields: WikidataFieldOfWork[];
	viaf?: string;
	gnd?: string;
	isni?: string;
	orcid?: string;
	scopus?: string;
	openLibraryId?: string;
}

export async function getWikidataPersonInfo(
	personName: string
): Promise<WikidataResult | null> {
	const hasCyrillic = /[а-яё]/i.test(personName);
	const lang = hasCyrillic ? "ru" : "en";

	const query = `
      SELECT DISTINCT ?russianName ?englishName 
             ?educationRu ?educationEn 
             ?specialtyRu ?specialtyEn 
             ?occupationRu ?occupationEn 
             ?fieldRu ?fieldEn
             ?viaf ?gnd ?isni ?orcid ?scopus ?openLibraryId
      WHERE {
        { ?person rdfs:label "${personName}"@${lang}. }
        UNION
        { ?person skos:altLabel "${personName}"@${lang}. }

        OPTIONAL { ?person rdfs:label ?russianName. FILTER(LANG(?russianName)="ru") }
        OPTIONAL { ?person rdfs:label ?englishName. FILTER(LANG(?englishName)="en") }

        OPTIONAL { ?person wdt:P69 ?edu. ?edu rdfs:label ?educationRu. FILTER(LANG(?educationRu)="ru") }
        OPTIONAL { ?person wdt:P69 ?edu. ?edu rdfs:label ?educationEn. FILTER(LANG(?educationEn)="en") }

        OPTIONAL { ?person wdt:P512 ?spec. ?spec rdfs:label ?specialtyRu. FILTER(LANG(?specialtyRu)="ru") }
        OPTIONAL { ?person wdt:P512 ?spec. ?spec rdfs:label ?specialtyEn. FILTER(LANG(?specialtyEn)="en") }

        OPTIONAL { ?person wdt:P106 ?occ. ?occ rdfs:label ?occupationRu. FILTER(LANG(?occupationRu)="ru") }
        OPTIONAL { ?person wdt:P106 ?occ. ?occ rdfs:label ?occupationEn. FILTER(LANG(?occupationEn)="en") }

        OPTIONAL { ?person wdt:P101 ?field. ?field rdfs:label ?fieldRu. FILTER(LANG(?fieldRu)="ru") }
        OPTIONAL { ?person wdt:P101 ?field. ?field rdfs:label ?fieldEn. FILTER(LANG(?fieldEn)="en") }

        OPTIONAL { ?person wdt:P214 ?viaf. }
        OPTIONAL { ?person wdt:P227 ?gnd. }
        OPTIONAL { ?person wdt:P213 ?isni. }
        OPTIONAL { ?person wdt:P496 ?orcid. }
        OPTIONAL { ?person wdt:P4284 ?scopus. }
        OPTIONAL { ?person wdt:P648 ?openLibraryId. }

        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
      } LIMIT 300
    `;

	const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(
		query
	)}&format=json`;

	try {
		const resp = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "WikidataQuery/1.0",
			},
		});
		if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

		const data: any = await resp.json();

		const collect = (keyRu: string, keyEn: string) => {
			const set = new Map<string, { russian: string; english: string }>();
			data.results.bindings.forEach((b: any) => {
				const ru = b[keyRu]?.value || "";
				const en = b[keyEn]?.value || "";
				if (ru || en) set.set(ru + en, { russian: ru, english: en });
			});
			return Array.from(set.values());
		};

		const result: WikidataResult = {
			russianName: personName,
			educations: collect("educationRu", "educationEn"),
			specialties: collect("specialtyRu", "specialtyEn"),
			occupations: collect("occupationRu", "occupationEn"),
			fields: collect("fieldRu", "fieldEn"),
			viaf: data.results.bindings[0]?.viaf?.value,
			gnd: data.results.bindings[0]?.gnd?.value,
			isni: data.results.bindings[0]?.isni?.value,
			orcid: data.results.bindings[0]?.orcid?.value,
			scopus: data.results.bindings[0]?.scopus?.value,
			openLibraryId: data.results.bindings[0]?.openLibraryId?.value,
		};

		if (data.results.bindings[0]?.russianName?.value)
			result.russianName = data.results.bindings[0].russianName.value;
		if (data.results.bindings[0]?.englishName?.value)
			result.englishName = data.results.bindings[0].englishName.value;

		return result;
	} catch (err) {
		console.error(err);
		return null;
	}
}

export function formatWikiDataResult(wikiData?: WikidataResult | null): string {
	if (!wikiData) {
		return "";
	}

	const lines: string[] = [];

	if (wikiData.russianName)
		lines.push(`- Русское имя: ${wikiData.russianName}`);
	if (wikiData.englishName && wikiData.englishName !== wikiData.russianName)
		lines.push(`- Английское имя: ${wikiData.englishName}`);

	const formatList = (
		title: string,
		items: { russian: string; english: string }[]
	) => {
		if (items.length) {
			lines.push(`\t- ${title}:`);
			items.forEach((i) => {
				if (i.russian && i.english && i.russian !== i.english)
					lines.push(`\t\t- ${i.russian} (${i.english})`);
				else if (i.russian) lines.push(`\t\t- ${i.russian}`);
				else if (i.english) lines.push(`\t\t- ${i.english}`);
			});
		}
	};

	formatList("Образование", wikiData.educations);
	formatList("Специальность", wikiData.specialties);
	formatList("Род занятий", wikiData.occupations);
	formatList("Область исследований", wikiData.fields);

	if (wikiData.viaf) lines.push(`\t- VIAF: ${wikiData.viaf}`);
	if (wikiData.gnd) lines.push(`\t- GND: ${wikiData.gnd}`);
	if (wikiData.isni) lines.push(`\t- ISNI: ${wikiData.isni}`);
	if (wikiData.orcid) lines.push(`\t- ORCID: ${wikiData.orcid}`);
	if (wikiData.scopus) lines.push(`\t- Scopus Author ID: ${wikiData.scopus}`);
	if (wikiData.openLibraryId)
		lines.push(`\t- Open Library ID: ${wikiData.openLibraryId}`);

	return lines.join("\n");
}

export default getWikidataPersonInfo;
