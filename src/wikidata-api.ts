interface WikidataEducation {
	russian: string;
	english: string;
}

interface WikidataOccupation {
	russian: string;
	english: string;
}

interface WikidataResult {
	russianName?: string;
	englishName?: string;
	educations: WikidataEducation[];
	specialties: WikidataEducation[];
	occupations: WikidataOccupation[];
	openLibraryId?: string;
}

export async function getWikidataPersonInfo(
	personName: string
): Promise<WikidataResult | null> {
	// Определяем язык ввода по наличию кириллических символов
	const hasCyrillic = /[а-яё]/i.test(personName);
	const searchLanguage = hasCyrillic ? "ru" : "en";

	const query = `
      SELECT DISTINCT 
        ?russianName ?englishName 
        ?educationRu ?educationEn 
        ?specialtyRu ?specialtyEn 
        ?occupationRu ?occupationEn 
        ?openLibraryId
      WHERE {
        {
          # Поиск по основному названию
          ?person rdfs:label "${personName}"@${searchLanguage}.
        }
        UNION
        {
          # Поиск по альтернативным названиям
          ?person skos:altLabel "${personName}"@${searchLanguage}.
        }
        
        # Получаем русское имя
        OPTIONAL {
          ?person rdfs:label ?russianName.
          FILTER(LANG(?russianName) = "ru")
        }
        
        # Получаем английское имя
        OPTIONAL {
          ?person rdfs:label ?englishName.
          FILTER(LANG(?englishName) = "en")
        }
        
        # Образование (русское и английское)
        OPTIONAL {
          ?person wdt:P69 ?education.
          OPTIONAL {
            ?education rdfs:label ?educationRu.
            FILTER(LANG(?educationRu) = "ru")
          }
          OPTIONAL {
            ?education rdfs:label ?educationEn.
            FILTER(LANG(?educationEn) = "en")
          }
        }
        
        # Специальность (русское и английское)
        OPTIONAL {
          ?person wdt:P512 ?specialty.
          OPTIONAL {
            ?specialty rdfs:label ?specialtyRu.
            FILTER(LANG(?specialtyRu) = "ru")
          }
          OPTIONAL {
            ?specialty rdfs:label ?specialtyEn.
            FILTER(LANG(?specialtyEn) = "en")
          }
        }
        
        # Род занятий (русское и английское)
        OPTIONAL {
          ?person wdt:P106 ?occupation.
          OPTIONAL {
            ?occupation rdfs:label ?occupationRu.
            FILTER(LANG(?occupationRu) = "ru")
          }
          OPTIONAL {
            ?occupation rdfs:label ?occupationEn.
            FILTER(LANG(?occupationEn) = "en")
          }
        }
        
        # Open Library ID
        OPTIONAL {
          ?person wdt:P648 ?openLibraryId.
        }
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
      }
      LIMIT 300
    `;

	const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(
		query
	)}&format=json`;

	try {
		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "WikidataQuery/1.0",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: any = await response.json();

		const result: WikidataResult = {
			russianName: personName,
			educations: [],
			specialties: [],
			occupations: [],
		};

		const educationMap = new Map<string, WikidataEducation>();
		const specialtyMap = new Map<string, WikidataEducation>();
		const occupationMap = new Map<string, WikidataOccupation>();

		data.results.bindings.forEach((binding: any) => {
			// Русское имя
			if (binding.russianName?.value) {
				result.russianName = binding.russianName.value;
			}

			// Английское имя
			if (binding.englishName?.value) {
				result.englishName = binding.englishName.value;
			}

			// Образование
			if (binding.educationRu?.value || binding.educationEn?.value) {
				const key =
					(binding.educationRu?.value || "") +
					(binding.educationEn?.value || "");
				if (!educationMap.has(key)) {
					educationMap.set(key, {
						russian: binding.educationRu?.value || "",
						english: binding.educationEn?.value || "",
					});
				}
			}

			// Специальность
			if (binding.specialtyRu?.value || binding.specialtyEn?.value) {
				const key =
					(binding.specialtyRu?.value || "") +
					(binding.specialtyEn?.value || "");
				if (!specialtyMap.has(key)) {
					specialtyMap.set(key, {
						russian: binding.specialtyRu?.value || "",
						english: binding.specialtyEn?.value || "",
					});
				}
			}

			// Род занятий
			if (binding.occupationRu?.value || binding.occupationEn?.value) {
				const key =
					(binding.occupationRu?.value || "") +
					(binding.occupationEn?.value || "");
				if (!occupationMap.has(key)) {
					occupationMap.set(key, {
						russian: binding.occupationRu?.value || "",
						english: binding.occupationEn?.value || "",
					});
				}
			}

			// Open Library ID
			if (binding.openLibraryId?.value && !result.openLibraryId) {
				result.openLibraryId = binding.openLibraryId.value;
			}
		});

		result.educations = Array.from(educationMap.values()).filter(
			(edu) => edu.russian || edu.english
		);
		result.specialties = Array.from(specialtyMap.values()).filter(
			(spec) => spec.russian || spec.english
		);
		result.occupations = Array.from(occupationMap.values()).filter(
			(occ) => occ.russian || occ.english
		);

		return result;
	} catch (error) {
		console.error("Error fetching data from Wikidata:", error);
		return null;
	}
}

export function formatWikiDataResult(wikiData: WikidataResult): string {
	const lines: string[] = [];

	// Имена
	if (wikiData.russianName) {
		lines.push(`- Русское имя: ${wikiData.russianName}`);
	}
	if (wikiData.englishName && wikiData.englishName !== wikiData.russianName) {
		lines.push(`- Английское имя: ${wikiData.englishName}`);
	}

	// Образование
	if (wikiData.educations.length > 0) {
		lines.push(`\t- Образование:`);
		wikiData.educations.forEach((edu) => {
			if (edu.russian && edu.english && edu.russian !== edu.english) {
				lines.push(`\t\t- ${edu.russian} (${edu.english})`);
			} else if (edu.russian) {
				lines.push(`\t\t- ${edu.russian}`);
			} else if (edu.english) {
				lines.push(`\t\t- ${edu.english}`);
			}
		});
	}

	// Специальность
	if (wikiData.specialties.length > 0) {
		lines.push(`\t- Специальность:`);
		wikiData.specialties.forEach((spec) => {
			if (spec.russian && spec.english && spec.russian !== spec.english) {
				lines.push(`\t\t- ${spec.russian} (${spec.english})`);
			} else if (spec.russian) {
				lines.push(`\t\t- ${spec.russian}`);
			} else if (spec.english) {
				lines.push(`\t\t- ${spec.english}`);
			}
		});
	}

	// Род занятий
	if (wikiData.occupations.length > 0) {
		lines.push(`\t- Род занятий:`);
		wikiData.occupations.forEach((occ) => {
			if (occ.russian && occ.english && occ.russian !== occ.english) {
				lines.push(`\t\t- ${occ.russian} (${occ.english})`);
			} else if (occ.russian) {
				lines.push(`\t\t- ${occ.russian}`);
			} else if (occ.english) {
				lines.push(`\t\t- ${occ.english}`);
			}
		});
	}

	// Open Library ID
	if (wikiData.openLibraryId) {
		lines.push(`\t- Open Library ID: ${wikiData.openLibraryId}`);
	}

	return lines.join("\n");
}

export default getWikidataPersonInfo;
